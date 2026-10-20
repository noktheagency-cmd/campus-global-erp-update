"use server";

import { randomBytes, randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  APPLICATION_ADDITIONAL_DOCUMENT_CATEGORIES,
  APPLICATION_DOCUMENT_UPLOAD_BLOCKED_STATUSES,
  APPLICATION_DOCUMENT_UPLOAD_MAX_BYTES,
  APPLICATION_DOCUMENT_UPLOAD_MIME_TYPES,
  APPLICATION_DECISION_STATUSES,
  APPLICATION_REASON_REQUIRED_STATUSES,
  APPLICATION_REQUIRED_DOCUMENT_READY_STATUSES,
  APPLICATION_DOCUMENT_STATUSES,
  APPLICATION_STATUS_TRANSITIONS,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUSES,
} from "@/features/applications/constants";
import {
  applicationCreateSchema,
  applicationDocumentRequestCreateSchema,
  applicationDocumentRequestResponseSchema,
} from "@/features/applications/schemas";
import type {
  WizardChoicePayload,
  WizardEducationPayload,
  WizardExamPayload,
  WizardExistingDocumentPayload,
} from "@/features/applications/types";
import type { Prisma } from "@/generated/prisma/client";
import { getDocumentRequirements } from "@/features/applications/document-requirements";
import {
  getSessionAgentId,
  getSessionStudentId,
  requirePermission,
  type AuthSession,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  deleteStorageFile,
  uploadApplicationDocumentFile,
} from "@/lib/supabase/storage";

export type ApplicationActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

const initialErrorMessage = "Müraciət saxlanılmadı.";

export async function createApplicationAction(
  _state: ApplicationActionState,
  formData: FormData,
): Promise<ApplicationActionState> {
  if (!process.env.DATABASE_URL?.trim()) {
    return {
      status: "error",
      message:
        "DATABASE_URL aktiv deyil. ERP bağlantısı olmadan müraciət saxlanılmır.",
    };
  }

  const intent =
    getString(formData, "intent") === "submit" ? "submit" : "draft";
  const educationLevelKey = getString(formData, "educationLevelKey");
  const documentRequirements = getDocumentRequirements(educationLevelKey);
  const existingDocumentPayload = parseJsonArray<WizardExistingDocumentPayload>(
    formData,
    "existingDocumentsJson",
  );
  const existingDocumentKeys = new Set(
    existingDocumentPayload
      .filter((document) => document.documentId && document.documentKey)
      .map((document) => document.documentKey),
  );
  const missingRequiredDocuments = documentRequirements.filter(
    (requirement) =>
      requirement.required &&
      !getFile(formData, `document.${requirement.key}`) &&
      !existingDocumentKeys.has(requirement.key),
  );

  if (intent === "submit" && missingRequiredDocuments.length > 0) {
    return {
      fieldErrors: {
        documents: missingRequiredDocuments.map(
          (document) => `${document.title} yüklənməlidir.`,
        ),
      },
      message: "Təsdiq üçün zəruri sənədləri yükləyin.",
      status: "error",
    };
  }

  const parsed = applicationCreateSchema.safeParse({
    agentId: getString(formData, "agentId"),
    choices: parseJsonArray<WizardChoicePayload>(formData, "choicesJson"),
    country: getString(formData, "country"),
    education: parseEducationPayload(formData),
    educationLevelId: getString(formData, "educationLevelId"),
    educationLevelKey,
    exams: parseJsonArray<WizardExamPayload>(formData, "examsJson"),
    intent,
    internalNotes: getString(formData, "internalNotes"),
    periodId: getString(formData, "periodId"),
    selectedStudentId: getString(formData, "selectedStudentId"),
    student: {
      address: getString(formData, "address"),
      birthDate: getString(formData, "birthDate") || undefined,
      citizenship: getString(formData, "citizenship"),
      contactEmail: getString(formData, "contactEmail"),
      fatherName: getString(formData, "fatherName"),
      firstName: getString(formData, "firstName"),
      gender: getString(formData, "gender"),
      identityNo: getString(formData, "identityNo"),
      lastName: getString(formData, "lastName"),
      loginEmail: getString(formData, "loginEmail"),
      maritalStatus: getString(formData, "maritalStatus"),
      motherName: getString(formData, "motherName"),
      passportNo: getString(formData, "passportNo"),
      phone: getString(formData, "phone"),
    },
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      ...validationError(parsed.error.flatten().fieldErrors),
      message: firstIssue
        ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
        : "Form məlumatlarını yoxlayın.",
    };
  }

  let redirectTo = "";

  try {
    const session = await requirePermission("applications:create");
    const currentUserId = session.userId;
    const sessionAgentId = getSessionAgentId(session);
    const sessionStudentId = getSessionStudentId(session);
    const sessionStudent = sessionStudentId
      ? await prisma.student.findFirst({
          select: { agentId: true, id: true },
          where: {
            id: sessionStudentId,
            portalStatus: "READY",
            status: "ACTIVE",
            userId: session.userId,
          },
        })
      : null;

    if (sessionStudentId && !sessionStudent) {
      throw new ApplicationActionError("student-scope");
    }

    const effectiveAgentId =
      sessionStudent?.agentId ??
      sessionAgentId ??
      emptyToNull(parsed.data.agentId);
    const scopedInput = {
      ...parsed.data,
      agentId: effectiveAgentId ?? undefined,
      internalNotes: sessionStudentId ? "" : parsed.data.internalNotes,
    };
    const application = await prisma.$transaction(async (tx) => {
      if (sessionAgentId) {
        await assertAgentCanCreateApplication(
          tx,
          sessionAgentId,
          session.userId,
        );
      }

      await assertValidApplicationChoices(tx, scopedInput);
      const student = await createOrReuseStudent(
        tx,
        scopedInput,
        currentUserId,
        Boolean(sessionAgentId),
        sessionStudent?.id ?? null,
        session.userId,
      );
      const createdApplication = await tx.application.create({
        data: {
          agentId: effectiveAgentId,
          code: createApplicationCode(),
          country: scopedInput.country,
          createdById: currentUserId,
          educationLevelId: scopedInput.educationLevelId,
          internalNotes: emptyToNull(scopedInput.internalNotes),
          periodId: scopedInput.periodId,
          status: "DRAFT",
          studentId: student.id,
        },
        select: { code: true, id: true, studentId: true },
      });

      await tx.applicationChoice.createMany({
        data: scopedInput.choices.map((choice, index) => ({
          applicationId: createdApplication.id,
          priority: index + 1,
          programId: choice.programId,
          tuitionId: emptyToNull(choice.tuitionId ?? ""),
          universityId: choice.universityId,
        })),
      });

      await tx.applicationEducationRecord.create({
        data: {
          applicationId: createdApplication.id,
          averageScore: emptyToNull(scopedInput.education.averageScore),
          city: emptyToNull(scopedInput.education.city),
          country: emptyToNull(scopedInput.education.country),
          endYear: scopedInput.education.endYear,
          gradingSystem: emptyToNull(scopedInput.education.gradingSystem),
          institutionName: scopedInput.education.institutionName,
          isRequired: true,
          recordType: "HIGH_SCHOOL",
          startYear: scopedInput.education.startYear,
        },
      });

      const exams = scopedInput.exams.filter((exam) =>
        Boolean(exam.examName || exam.score || exam.maxScore || exam.examDate),
      );

      if (exams.length > 0) {
        await tx.applicationExamRecord.createMany({
          data: exams.map((exam) => ({
            applicationId: createdApplication.id,
            examDate: exam.examDate,
            examName: exam.examName || "İmtahan",
            maxScore: emptyToNull(exam.maxScore),
            score: emptyToNull(exam.score),
          })),
        });
      }

      await tx.applicationDocument.createMany({
        data: documentRequirements.map((requirement) => ({
          applicationId: createdApplication.id,
          documentGroup: requirement.group,
          documentKey: requirement.key,
          isRecommended: requirement.recommended,
          isRequired: requirement.required,
          status: "MISSING",
          title: requirement.title,
        })),
      });

      await tx.activityLog.create({
        data: {
          action: "CREATED",
          entityId: createdApplication.id,
          entityType: "APPLICATION",
          newValue: {
            code: createdApplication.code,
            country: scopedInput.country,
            intent: scopedInput.intent,
          },
          userId: currentUserId,
        },
      });

      if (effectiveAgentId) {
        await tx.agentNotification.create({
          data: {
            actionHref: `/applications/${createdApplication.id}`,
            agentId: effectiveAgentId,
            entityId: createdApplication.id,
            entityType: "APPLICATION",
            message: `${createdApplication.code} nömrəli müraciət yaradıldı.`,
            title: "Yeni müraciət yaradıldı",
            type: "APPLICATION_CREATED",
          },
        });
      }

      return createdApplication;
    });

    await applyExistingApplicationDocuments({
      applicationId: application.id,
      currentUserId,
      documentReferences: existingDocumentPayload,
      studentId: application.studentId,
    });

    const uploadResult = await uploadApplicationDocuments({
      applicationId: application.id,
      currentUserId,
      documentRequirements,
      formData,
    });

    if (uploadResult.status === "error") {
      revalidateApplications(application.id);
      redirectTo = `/applications/${application.id}?error=document-upload-partial`;
    } else if (intent === "submit") {
      const missingRequiredDocuments = await countBlockingRequiredDocuments(
        application.id,
      );

      if (missingRequiredDocuments > 0) {
        redirectTo = `/applications/${application.id}?error=missing-documents`;
      } else {
        await prisma.application.update({
          data: {
            status: "SUBMITTED",
            submittedAt: new Date(),
          },
          where: { id: application.id },
        });

        await prisma.activityLog.create({
          data: {
            action: "SUBMITTED",
            entityId: application.id,
            entityType: "APPLICATION",
            newValue: { code: application.code, status: "SUBMITTED" },
            userId: currentUserId,
          },
        });
      }
    }

    revalidateApplications(application.id);
    redirectTo ||= `/applications/${application.id}?success=${
      intent === "submit" ? "application-submitted" : "application-draft"
    }`;
  } catch (error) {
    return databaseError(error, initialErrorMessage);
  }

  redirect(redirectTo);
}

export async function submitStudentApplicationAction(formData: FormData) {
  const applicationId = getString(formData, "applicationId");

  if (!applicationId) {
    redirect("/applications?error=status");
  }

  const session = await requirePermission("applications:submit");
  const studentId = getSessionStudentId(session);
  const agentId = getSessionAgentId(session);

  if (!studentId && !agentId) {
    redirect(`/applications/${applicationId}?error=forbidden`);
  }

  const ownershipScope = studentId
    ? { studentId }
    : {
        OR: [{ agentId }, { student: { agentId } }],
      };

  const application = await prisma.application.findFirst({
    select: {
      code: true,
      id: true,
      status: true,
    },
    where: {
      id: applicationId,
      ...ownershipScope,
    },
  });

  if (!application) {
    redirect("/applications?error=forbidden");
  }

  if (application.status !== "DRAFT") {
    redirect(`/applications/${applicationId}?error=status`);
  }

  const missingRequiredDocuments =
    await countBlockingRequiredDocuments(applicationId);

  if (missingRequiredDocuments > 0) {
    redirect(
      `/applications/${applicationId}?error=missing-documents#documents`,
    );
  }

  const submitted = await prisma.application.updateMany({
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
    where: { id: applicationId, status: "DRAFT", ...ownershipScope },
  });
  if (submitted.count !== 1) {
    redirect(`/applications/${applicationId}?error=status`);
  }

  await prisma.activityLog.create({
    data: {
      action: "SUBMITTED",
      entityId: applicationId,
      entityType: "APPLICATION",
      newValue: {
        code: application.code,
        status: "SUBMITTED",
        submittedBy: studentId ? "student" : "agent",
      },
      userId: session.userId,
    },
  });

  revalidateApplications(applicationId);
  redirect(`/applications/${applicationId}?success=application-submitted`);
}

export async function updateApplicationStatusAction(formData: FormData) {
  const applicationId = getString(formData, "applicationId");
  const rawChoiceId = getString(formData, "choiceId");
  const choiceId =
    rawChoiceId === "__application__" ? null : emptyToNull(rawChoiceId);
  const documentKey = emptyToNull(getString(formData, "documentKey"));
  const nextStatus = getString(formData, "status");
  const statusReason = getString(formData, "statusReason");

  if (!applicationId || !isApplicationDecisionStatus(nextStatus)) {
    redirect("/applications?error=status");
  }

  const session = await requirePermission("applications:update");

  if (session.role !== "SUPER_ADMIN") {
    redirect(`/applications/${applicationId}?error=forbidden`);
  }

  await assertApplicationAccess(applicationId, session);

  const application = await prisma.application.findUnique({
    select: {
      id: true,
      code: true,
      internalNotes: true,
      agentId: true,
      status: true,
      submittedAt: true,
      studentId: true,
    },
    where: { id: applicationId },
  });

  if (!application) {
    redirect("/applications?error=not-found");
  }

  if (!canTransitionApplicationStatus(application.status, nextStatus)) {
    redirect(`/applications/${applicationId}?error=status-transition`);
  }

  if (
    APPLICATION_REASON_REQUIRED_STATUSES.includes(
      nextStatus as (typeof APPLICATION_REASON_REQUIRED_STATUSES)[number],
    ) &&
    statusReason.length < 3
  ) {
    redirect(`/applications/${applicationId}?error=status-reason`);
  }

  if (nextStatus === "SUBMITTED") {
    const missingRequiredDocuments =
      await countBlockingRequiredDocuments(applicationId);

    if (missingRequiredDocuments > 0) {
      redirect(`/applications/${applicationId}?error=missing-documents`);
    }
  }

  const relatedDocument = documentKey
    ? await prisma.applicationDocument.findUnique({
        select: {
          documentKey: true,
          id: true,
          notes: true,
          status: true,
          title: true,
        },
        where: {
          applicationId_documentKey: {
            applicationId,
            documentKey,
          },
        },
      })
    : null;

  if (documentKey && !relatedDocument) {
    redirect(`/applications/${applicationId}?error=document#documents`);
  }

  const relatedChoice = choiceId
    ? await prisma.applicationChoice.findFirst({
        include: {
          program: {
            select: {
              name: true,
            },
          },
          university: {
            select: {
              name: true,
            },
          },
        },
        where: {
          applicationId,
          id: choiceId,
        },
      })
    : null;

  if (choiceId && !relatedChoice) {
    redirect(`/applications/${applicationId}?error=choice`);
  }

  const currentUserId = session.userId;
  const internalNotes = emptyToNull(getString(formData, "internalNotes"));
  const statusReasonValue = emptyToNull(statusReason);
  const markDocumentInvalid =
    nextStatus === "INVALID_DOCUMENTS" && relatedDocument;
  const isChoiceDecision = Boolean(relatedChoice);

  await prisma.$transaction(async (tx) => {
    if (isChoiceDecision && relatedChoice) {
      await tx.application.update({
        data: {
          internalNotes,
        },
        where: { id: applicationId },
      });

      await tx.applicationChoice.update({
        data: {
          decidedAt: new Date(),
          decidedById: currentUserId,
          status: nextStatus,
          statusReason: statusReasonValue,
        },
        where: { id: relatedChoice.id },
      });
    } else {
      await tx.application.update({
        data: {
          internalNotes,
          status: nextStatus,
          submittedAt:
            nextStatus !== "DRAFT" && !application.submittedAt
              ? new Date()
              : nextStatus === "DRAFT"
                ? null
                : undefined,
        },
        where: { id: applicationId },
      });
    }

    if (markDocumentInvalid) {
      await tx.applicationDocument.update({
        data: {
          notes: statusReasonValue,
          reviewedAt: new Date(),
          reviewedById: currentUserId,
          status: "INVALID",
        },
        where: {
          applicationId_documentKey: {
            applicationId,
            documentKey: relatedDocument.documentKey,
          },
        },
      });
    }

    await tx.activityLog.create({
      data: {
        action: "STATUS_CHANGED",
        entityId: relatedChoice?.id ?? applicationId,
        entityType: relatedChoice ? "APPLICATION_CHOICE" : "APPLICATION",
        newValue: {
          agentId: application.agentId,
          choiceId: relatedChoice?.id ?? null,
          programName: relatedChoice?.program.name ?? null,
          universityName: relatedChoice?.university.name ?? null,
          documentKey: relatedDocument?.documentKey ?? null,
          documentTitle: relatedDocument?.title ?? null,
          notifyAgent: Boolean(application.agentId),
          notifyStudent: true,
          reason: statusReasonValue,
          status: nextStatus,
          studentId: application.studentId,
        },
        oldValue: {
          internalNotes: application.internalNotes,
          status: relatedChoice?.status ?? application.status,
          statusReason: relatedChoice?.statusReason ?? null,
        },
        userId: currentUserId,
      },
    });

    if (application.agentId) {
      const statusLabel =
        APPLICATION_STATUS_LABELS[
          nextStatus as keyof typeof APPLICATION_STATUS_LABELS
        ] ?? nextStatus;

      await tx.agentNotification.create({
        data: {
          actionHref: `/applications/${applicationId}`,
          agentId: application.agentId,
          entityId: applicationId,
          entityType: "APPLICATION",
          message: `${application.code} nömrəli müraciətin statusu “${statusLabel}” olaraq yeniləndi.${
            statusReasonValue ? ` Səbəb: ${statusReasonValue}` : ""
          }`,
          title: markDocumentInvalid
            ? "Sənəd düzəlişi tələb olunur"
            : "Status yeniləndi",
          type: markDocumentInvalid
            ? "DOCUMENT_REQUIRED"
            : "APPLICATION_STATUS",
        },
      });
    }

    if (markDocumentInvalid) {
      await tx.activityLog.create({
        data: {
          action: "STATUS_CHANGED",
          entityId: relatedDocument.id,
          entityType: "APPLICATION_DOCUMENT",
          newValue: {
            documentKey: relatedDocument.documentKey,
            reason: statusReasonValue,
            status: "INVALID",
            title: relatedDocument.title,
          },
          oldValue: {
            notes: relatedDocument.notes,
            status: relatedDocument.status,
          },
          userId: currentUserId,
        },
      });
    }
  });

  revalidateApplications(applicationId);
  redirect(`/applications/${applicationId}?success=status-updated`);
}

export async function uploadApplicationDocumentAction(formData: FormData) {
  const applicationId = getString(formData, "applicationId");
  const documentKey = getString(formData, "documentKey");
  const file = getFile(formData, "file");
  const returnTo = getDocumentUploadReturnTo(formData, applicationId);

  if (!applicationId || !documentKey) {
    redirect("/applications?error=document");
  }

  if (!file) {
    redirect(withStatusParam(returnTo, "error", "file-required"));
  }

  const session = await requirePermission("application-documents:upload");
  await assertApplicationAccess(applicationId, session);

  const document = await prisma.applicationDocument.findUnique({
    include: {
      application: {
        select: {
          status: true,
        },
      },
    },
    where: {
      applicationId_documentKey: {
        applicationId,
        documentKey,
      },
    },
  });

  if (!document) {
    redirect(withStatusParam(returnTo, "error", "document"));
  }

  if (
    APPLICATION_DOCUMENT_UPLOAD_BLOCKED_STATUSES.includes(
      document.application
        .status as (typeof APPLICATION_DOCUMENT_UPLOAD_BLOCKED_STATUSES)[number],
    )
  ) {
    redirect(withStatusParam(returnTo, "error", "document-locked"));
  }

  if (document.status === "ARCHIVED") {
    redirect(withStatusParam(returnTo, "error", "document-archived"));
  }

  const fileValidationError = getApplicationDocumentFileError(file);
  if (fileValidationError) {
    redirect(withStatusParam(returnTo, "error", fileValidationError));
  }

  try {
    const currentUserId = session.userId;
    const uploadedFile = await uploadApplicationDocumentFile({
      applicationId,
      documentKey,
      file,
    });

    await prisma.applicationDocument.update({
      data: {
        fileName: uploadedFile.fileName,
        fileSize: uploadedFile.fileSize,
        fileUrl: uploadedFile.fileUrl,
        mimeType: uploadedFile.mimeType,
        notes: null,
        reviewedAt: null,
        reviewedById: null,
        status: "UPLOADED",
        uploadedAt: new Date(),
        uploadedById: currentUserId,
      },
      where: {
        applicationId_documentKey: {
          applicationId,
          documentKey,
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "DOCUMENT_UPLOADED",
        entityId: document.id,
        entityType: "APPLICATION_DOCUMENT",
        newValue: {
          documentKey,
          fileName: uploadedFile.fileName,
          status: "UPLOADED",
        },
        oldValue: {
          fileName: document.fileName,
          status: document.status,
        },
        userId: currentUserId,
      },
    });

  } catch {
    redirect(withStatusParam(returnTo, "error", "upload"));
  }

  revalidateApplications(applicationId);
  redirect(withStatusParam(returnTo, "success", "document-uploaded"));
}

export async function addApplicationDocumentAction(formData: FormData) {
  const applicationId = getString(formData, "applicationId");
  const categoryKey = getString(formData, "categoryKey");
  const file = getFile(formData, "file");
  const returnTo = getDocumentUploadReturnTo(formData, applicationId);
  const category = APPLICATION_ADDITIONAL_DOCUMENT_CATEGORIES.find(
    (item) => item.key === categoryKey,
  );

  if (!applicationId || !category) {
    redirect(withStatusParam(returnTo, "error", "document-category"));
  }

  if (!file) {
    redirect(withStatusParam(returnTo, "error", "file-required"));
  }

  const session = await requirePermission("application-documents:upload");
  await assertApplicationAccess(applicationId, session);

  const application = await prisma.application.findUnique({
    select: { status: true },
    where: { id: applicationId },
  });

  if (!application) {
    redirect(withStatusParam(returnTo, "error", "document"));
  }

  if (
    APPLICATION_DOCUMENT_UPLOAD_BLOCKED_STATUSES.includes(
      application.status as (typeof APPLICATION_DOCUMENT_UPLOAD_BLOCKED_STATUSES)[number],
    )
  ) {
    redirect(withStatusParam(returnTo, "error", "document-locked"));
  }

  const fileValidationError = getApplicationDocumentFileError(file);
  if (fileValidationError) {
    redirect(withStatusParam(returnTo, "error", fileValidationError));
  }

  const documentKey = `additional-${category.key}-${randomBytes(5).toString("hex")}`;

  try {
    const uploadedFile = await uploadApplicationDocumentFile({
      applicationId,
      documentKey,
      file,
    });
    const document = await prisma.applicationDocument.create({
      data: {
        applicationId,
        documentGroup: "additional",
        documentKey,
        fileName: uploadedFile.fileName,
        fileSize: uploadedFile.fileSize,
        fileUrl: uploadedFile.fileUrl,
        isRecommended: false,
        isRequired: false,
        mimeType: uploadedFile.mimeType,
        status: "UPLOADED",
        title: category.label,
        uploadedAt: new Date(),
        uploadedById: session.userId,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "DOCUMENT_UPLOADED",
        entityId: document.id,
        entityType: "APPLICATION_DOCUMENT",
        newValue: {
          category: category.key,
          documentKey,
          fileName: uploadedFile.fileName,
          status: "UPLOADED",
        },
        userId: session.userId,
      },
    });
  } catch {
    redirect(withStatusParam(returnTo, "error", "upload"));
  }

  revalidateApplications(applicationId);
  redirect(withStatusParam(returnTo, "success", "document-added"));
}

export async function createApplicationDocumentRequestAction(
  formData: FormData,
) {
  const applicationId = getString(formData, "applicationId");
  const applicationChoiceId = getString(formData, "applicationChoiceId");
  const responseType = getString(formData, "responseType");
  const amountValue = getString(formData, "amount");
  const file = getFile(formData, "file");
  const returnTo = `/applications/${applicationId}`;
  const parsed = applicationDocumentRequestCreateSchema.safeParse({
    amount: amountValue ? Number(amountValue) : undefined,
    applicationChoiceId,
    applicationId,
    currency:
      responseType === "PAYMENT_RECEIPT"
        ? getString(formData, "currency").toUpperCase()
        : undefined,
    deadline: parseBakuDateTime(getString(formData, "deadline")),
    documentType: getString(formData, "documentType"),
    instructions: getString(formData, "instructions"),
    responseType,
    title: getString(formData, "title"),
  });

  if (!parsed.success) {
    redirect(withStatusParam(returnTo, "error", "request-form"));
  }

  if (
    parsed.data.responseType === "PAYMENT_RECEIPT" &&
    !parsed.data.currency
  ) {
    redirect(withStatusParam(returnTo, "error", "request-currency"));
  }

  if (!file) {
    redirect(withStatusParam(returnTo, "error", "file-required"));
  }

  const fileValidationError = getApplicationDocumentFileError(file);
  if (fileValidationError) {
    redirect(withStatusParam(returnTo, "error", fileValidationError));
  }

  const session = await requirePermission("applications:update");

  if (session.portalType === "student") {
    redirect(withStatusParam(returnTo, "error", "forbidden"));
  }

  await assertApplicationAccess(applicationId, session);

  const choice = await prisma.applicationChoice.findFirst({
    select: {
      application: {
        select: {
          studentId: true,
        },
      },
      id: true,
      program: { select: { name: true } },
      university: { select: { name: true } },
    },
    where: {
      applicationId,
      id: applicationChoiceId,
    },
  });

  if (!choice) {
    redirect(withStatusParam(returnTo, "error", "request-choice"));
  }

  const requestId = randomUUID();
  let uploadedFile: Awaited<
    ReturnType<typeof uploadApplicationDocumentFile>
  > | null = null;

  try {
    uploadedFile = await uploadApplicationDocumentFile({
      applicationId,
      documentKey: `request-${requestId}-source`,
      file,
    });

    await prisma.$transaction(async (tx) => {
      await tx.applicationDocumentRequest.create({
        data: {
          amount:
            parsed.data.responseType === "PAYMENT_RECEIPT"
              ? parsed.data.amount
              : null,
          applicationChoiceId,
          applicationId,
          createdById: session.userId,
          currency:
            parsed.data.responseType === "PAYMENT_RECEIPT"
              ? parsed.data.currency
              : null,
          deadline: parsed.data.deadline,
          documentType: parsed.data.documentType,
          fileName: uploadedFile!.fileName,
          fileSize: uploadedFile!.fileSize,
          fileUrl: uploadedFile!.fileUrl,
          id: requestId,
          instructions: emptyToNull(parsed.data.instructions),
          mimeType: uploadedFile!.mimeType,
          responseType: parsed.data.responseType,
          title: parsed.data.title,
        },
      });

      await tx.activityLog.create({
        data: {
          action: "CREATED",
          entityId: requestId,
          entityType: "APPLICATION_DOCUMENT_REQUEST",
          newValue: {
            applicationChoiceId,
            deadline: parsed.data.deadline.toISOString(),
            program: choice.program.name,
            responseType: parsed.data.responseType,
            studentId: choice.application.studentId,
            title: parsed.data.title,
            university: choice.university.name,
          },
          userId: session.userId,
        },
      });
    });
  } catch {
    if (uploadedFile) {
      await deleteStorageFile(uploadedFile.fileUrl).catch(() => undefined);
    }

    redirect(withStatusParam(returnTo, "error", "request-create"));
  }

  revalidateApplications(applicationId);
  redirect(withStatusParam(returnTo, "success", "request-created"));
}

export async function acknowledgeApplicationDocumentRequestAction(
  formData: FormData,
) {
  const applicationId = getString(formData, "applicationId");
  const requestId = getString(formData, "requestId");
  const returnTo = `/applications/${applicationId}`;

  if (!applicationId || !requestId) {
    redirect(withStatusParam(returnTo, "error", "request"));
  }

  const session = await requirePermission("application-documents:upload");
  await assertApplicationAccess(applicationId, session);

  const request = await prisma.applicationDocumentRequest.findFirst({
    where: { applicationId, id: requestId },
  });

  if (!request) {
    redirect(withStatusParam(returnTo, "error", "request"));
  }

  if (request.status === "CANCELLED") {
    redirect(withStatusParam(returnTo, "error", "request-closed"));
  }

  if (request.status === "COMPLETED" || request.status === "ACKNOWLEDGED") {
    redirect(withStatusParam(returnTo, "success", "request-acknowledged"));
  }

  const completed = request.responseType === "ACKNOWLEDGEMENT";
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.applicationDocumentRequest.update({
      data: {
        acknowledgedAt: now,
        completedAt: completed ? now : null,
        respondedById: completed ? session.userId : null,
        status: completed ? "COMPLETED" : "ACKNOWLEDGED",
      },
      where: { id: request.id },
    });

    await tx.activityLog.create({
      data: {
        action: "UPDATED",
        entityId: request.id,
        entityType: "APPLICATION_DOCUMENT_REQUEST",
        newValue: {
          acknowledgedAt: now.toISOString(),
          status: completed ? "COMPLETED" : "ACKNOWLEDGED",
          title: request.title,
        },
        oldValue: { status: request.status },
        userId: session.userId,
      },
    });
  });

  revalidateApplications(applicationId);
  redirect(withStatusParam(returnTo, "success", "request-acknowledged"));
}

export async function submitApplicationDocumentRequestResponseAction(
  formData: FormData,
) {
  const applicationId = getString(formData, "applicationId");
  const requestId = getString(formData, "requestId");
  const returnTo = `/applications/${applicationId}`;
  const file = getFile(formData, "file");
  const parsed = applicationDocumentRequestResponseSchema.safeParse({
    applicationId,
    requestId,
    responseDate: getString(formData, "responseDate"),
    responseNote: getString(formData, "responseNote"),
  });

  if (!parsed.success) {
    redirect(withStatusParam(returnTo, "error", "request-response-form"));
  }

  if (!file) {
    redirect(withStatusParam(returnTo, "error", "file-required"));
  }

  const fileValidationError = getApplicationDocumentFileError(file);
  if (fileValidationError) {
    redirect(withStatusParam(returnTo, "error", fileValidationError));
  }

  const session = await requirePermission("application-documents:upload");
  await assertApplicationAccess(applicationId, session);

  const request = await prisma.applicationDocumentRequest.findFirst({
    where: { applicationId, id: requestId },
  });

  if (!request) {
    redirect(withStatusParam(returnTo, "error", "request"));
  }

  if (
    request.status !== "ACKNOWLEDGED" ||
    request.responseType === "ACKNOWLEDGEMENT"
  ) {
    redirect(withStatusParam(returnTo, "error", "request-response-locked"));
  }

  let uploadedFile: Awaited<
    ReturnType<typeof uploadApplicationDocumentFile>
  > | null = null;

  try {
    uploadedFile = await uploadApplicationDocumentFile({
      applicationId,
      documentKey: `request-${request.id}-response`,
      file,
    });
    const completedAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.applicationDocumentRequest.update({
        data: {
          completedAt,
          respondedById: session.userId,
          responseDate: parsed.data.responseDate,
          responseFileName: uploadedFile!.fileName,
          responseFileSize: uploadedFile!.fileSize,
          responseFileUrl: uploadedFile!.fileUrl,
          responseMimeType: uploadedFile!.mimeType,
          responseNote: emptyToNull(parsed.data.responseNote),
          status: "COMPLETED",
        },
        where: { id: request.id },
      });

      await tx.activityLog.create({
        data: {
          action: "DOCUMENT_UPLOADED",
          entityId: request.id,
          entityType: "APPLICATION_DOCUMENT_REQUEST",
          newValue: {
            fileName: uploadedFile!.fileName,
            responseDate: parsed.data.responseDate.toISOString(),
            status: "COMPLETED",
            title: request.title,
          },
          oldValue: { status: request.status },
          userId: session.userId,
        },
      });
    });
  } catch {
    if (uploadedFile) {
      await deleteStorageFile(uploadedFile.fileUrl).catch(() => undefined);
    }

    redirect(withStatusParam(returnTo, "error", "request-response-upload"));
  }

  revalidateApplications(applicationId);
  redirect(withStatusParam(returnTo, "success", "request-completed"));
}

export async function updateApplicationDocumentStatusAction(
  formData: FormData,
) {
  const applicationId = getString(formData, "applicationId");
  const documentKey = getString(formData, "documentKey");
  const nextStatus = getString(formData, "status");

  if (
    !applicationId ||
    !documentKey ||
    !isApplicationDocumentStatus(nextStatus)
  ) {
    redirect("/applications?error=document-status");
  }

  const session = await requirePermission("applications:update");

  if (session.portalType !== "staff") {
    redirect(`/applications/${applicationId}?error=forbidden#documents`);
  }

  await assertApplicationAccess(applicationId, session);

  if (nextStatus === "UPLOADED") {
    redirect(`/applications/${applicationId}?error=document-status#documents`);
  }

  const document = await prisma.applicationDocument.findUnique({
    where: {
      applicationId_documentKey: {
        applicationId,
        documentKey,
      },
    },
  });

  if (!document) {
    redirect(`/applications/${applicationId}?error=document#documents`);
  }

  const currentUserId = session.userId;
  await prisma.applicationDocument.update({
    data: {
      status: nextStatus,
    },
    where: {
      applicationId_documentKey: {
        applicationId,
        documentKey,
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      action: "STATUS_CHANGED",
      entityId: document.id,
      entityType: "APPLICATION_DOCUMENT",
      newValue: { documentKey, status: nextStatus },
      oldValue: { status: document.status },
      userId: currentUserId,
    },
  });

  revalidateApplications(applicationId);
  redirect(`/applications/${applicationId}?success=document-status#documents`);
}

export async function toggleApplicationDocumentReviewedAction(
  formData: FormData,
) {
  const applicationId = getString(formData, "applicationId");
  const documentKey = getString(formData, "documentKey");
  const reviewed = getString(formData, "reviewed") === "true";

  if (!applicationId || !documentKey) {
    redirect("/applications?error=document-status");
  }

  const session = await requirePermission("applications:update");

  if (session.portalType !== "staff") {
    redirect(`/applications/${applicationId}?error=forbidden#documents`);
  }

  await assertApplicationAccess(applicationId, session);

  const document = await prisma.applicationDocument.findUnique({
    select: {
      id: true,
      reviewedAt: true,
      reviewedById: true,
      title: true,
    },
    where: {
      applicationId_documentKey: {
        applicationId,
        documentKey,
      },
    },
  });

  if (!document) {
    redirect(`/applications/${applicationId}?error=document#documents`);
  }

  const currentUserId = session.userId;
  await prisma.$transaction(async (tx) => {
    await tx.applicationDocument.update({
      data: {
        reviewedAt: reviewed ? new Date() : null,
        reviewedById: reviewed ? currentUserId : null,
      },
      where: {
        applicationId_documentKey: {
          applicationId,
          documentKey,
        },
      },
    });

    await tx.activityLog.create({
      data: {
        action: "UPDATED",
        entityId: document.id,
        entityType: "APPLICATION_DOCUMENT",
        newValue: {
          documentKey,
          reviewed,
          title: document.title,
        },
        oldValue: {
          reviewedAt: document.reviewedAt,
          reviewedById: document.reviewedById,
        },
        userId: currentUserId,
      },
    });
  });

  revalidateApplications(applicationId);
  redirect(`/applications/${applicationId}?success=document-reviewed#documents`);
}

async function assertValidApplicationChoices(
  tx: Prisma.TransactionClient,
  input: {
    choices: Array<{
      programId: string;
      tuitionId?: string | null;
      universityId: string;
    }>;
    country: string;
    educationLevelId: string;
    periodId: string;
  },
) {
  const seenChoices = new Set<string>();

  for (const choice of input.choices) {
    if (!choice.tuitionId) {
      throw new ApplicationActionError("invalid-choice");
    }

    const choiceKey = `${choice.universityId}:${choice.programId}:${choice.tuitionId}`;

    if (seenChoices.has(choiceKey)) {
      throw new ApplicationActionError("invalid-choice");
    }

    seenChoices.add(choiceKey);

    const program = await tx.program.findFirst({
      select: { id: true },
      where: {
        educationLevelId: input.educationLevelId,
        id: choice.programId,
        status: "ACTIVE",
        university: {
          country: input.country,
          id: choice.universityId,
          status: "ACTIVE",
        },
        tuitions: {
          some: {
            id: choice.tuitionId,
            periodId: input.periodId,
            priceStatus: "ACTIVE",
          },
        },
      },
    });

    if (!program) {
      throw new ApplicationActionError("invalid-choice");
    }
  }
}

async function assertAgentCanCreateApplication(
  tx: Prisma.TransactionClient,
  agentId: string,
  userId: string,
) {
  const agent = await tx.agent.findUnique({
    select: {
      canRegisterStudents: true,
      portalStatus: true,
      userId: true,
    },
    where: { id: agentId },
  });

  if (!agent || agent.userId !== userId) {
    throw new ApplicationActionError("agent-scope");
  }

  if (agent.portalStatus === "SUSPENDED" || !agent.canRegisterStudents) {
    throw new ApplicationActionError("agent-cannot-register");
  }
}

async function assertApplicationAccess(
  applicationId: string,
  session: AuthSession,
) {
  const scopedAgentId = getSessionAgentId(session);
  const scopedStudentId = getSessionStudentId(session);

  if (!scopedAgentId && !scopedStudentId) {
    return;
  }

  const application = await prisma.application.findFirst({
    select: { id: true },
    where: {
      agentId: scopedAgentId ?? undefined,
      id: applicationId,
      studentId: scopedStudentId ?? undefined,
    },
  });

  if (!application) {
    redirect("/applications?error=forbidden");
  }
}

async function createOrReuseStudent(
  tx: Prisma.TransactionClient,
  input: {
    agentId?: string;
    intent: "draft" | "submit";
    student: {
      address?: string;
      birthDate?: Date;
      citizenship?: string;
      contactEmail?: string;
      fatherName?: string;
      firstName: string;
      gender?: string;
      identityNo?: string;
      lastName: string;
      loginEmail?: string;
      maritalStatus?: string;
      motherName?: string;
      passportNo?: string;
      phone?: string;
    };
    selectedStudentId?: string;
  },
  currentUserId: string | null,
  enforceAgentOwnership = false,
  scopedStudentId: string | null = null,
  scopedStudentUserId: string | null = null,
) {
  if (scopedStudentId) {
    const existingStudent = await tx.student.findFirst({
      select: { id: true },
      where: {
        id: scopedStudentId,
        portalStatus: "READY",
        status: "ACTIVE",
        userId: scopedStudentUserId ?? undefined,
      },
    });

    if (!existingStudent) {
      throw new ApplicationActionError("student-scope");
    }

    return tx.student.update({
      data: {
        address: emptyToNull(input.student.address),
        birthDate: input.student.birthDate,
        citizenship: emptyToNull(input.student.citizenship),
        contactEmail: emptyToNull(input.student.contactEmail),
        fatherName: emptyToNull(input.student.fatherName),
        firstName: input.student.firstName,
        gender: emptyToNull(input.student.gender),
        identityNo: emptyToNull(input.student.identityNo),
        lastName: input.student.lastName,
        maritalStatus: emptyToNull(input.student.maritalStatus),
        motherName: emptyToNull(input.student.motherName),
        passportNo: emptyToNull(input.student.passportNo),
        phone: emptyToNull(input.student.phone),
        stage: input.intent === "submit" ? "Application" : "Profil",
      },
      select: { id: true },
      where: { id: existingStudent.id },
    });
  }

  if (input.selectedStudentId) {
    const selectedStudent = await tx.student.findFirst({
      select: { agentId: true, id: true },
      where: {
        id: input.selectedStudentId,
        status: "ACTIVE",
      },
    });

    if (!selectedStudent) {
      throw new ApplicationActionError("student-not-found");
    }

    if (
      enforceAgentOwnership &&
      selectedStudent.agentId &&
      input.agentId &&
      selectedStudent.agentId !== input.agentId
    ) {
      throw new ApplicationActionError("student-owned-by-other-agent");
    }

    return tx.student.update({
      data: {
        address: emptyToNull(input.student.address),
        agentId: emptyToNull(input.agentId),
        birthDate: input.student.birthDate,
        citizenship: emptyToNull(input.student.citizenship),
        contactEmail: emptyToNull(input.student.contactEmail),
        fatherName: emptyToNull(input.student.fatherName),
        firstName: input.student.firstName,
        gender: emptyToNull(input.student.gender),
        identityNo: emptyToNull(input.student.identityNo),
        lastName: input.student.lastName,
        loginEmail: emptyToNull(input.student.loginEmail),
        maritalStatus: emptyToNull(input.student.maritalStatus),
        motherName: emptyToNull(input.student.motherName),
        passportNo: emptyToNull(input.student.passportNo),
        phone: emptyToNull(input.student.phone),
        stage: input.intent === "submit" ? "Application" : "Profil",
      },
      select: { id: true },
      where: { id: selectedStudent.id },
    });
  }

  const matchers = [
    input.student.contactEmail
      ? { contactEmail: input.student.contactEmail }
      : null,
    input.student.passportNo ? { passportNo: input.student.passportNo } : null,
    input.student.identityNo ? { identityNo: input.student.identityNo } : null,
  ].filter((matcher): matcher is NonNullable<typeof matcher> =>
    Boolean(matcher),
  );
  const existingStudent =
    matchers.length > 0
      ? await tx.student.findFirst({
          select: { agentId: true, id: true },
          where: { OR: matchers },
        })
      : null;
  const studentData = {
    address: emptyToNull(input.student.address),
    agentId: emptyToNull(input.agentId),
    birthDate: input.student.birthDate,
    citizenship: emptyToNull(input.student.citizenship),
    contactEmail: emptyToNull(input.student.contactEmail),
    fatherName: emptyToNull(input.student.fatherName),
    firstName: input.student.firstName,
    gender: emptyToNull(input.student.gender),
    identityNo: emptyToNull(input.student.identityNo),
    lastName: input.student.lastName,
    loginEmail: emptyToNull(input.student.loginEmail),
    maritalStatus: emptyToNull(input.student.maritalStatus),
    motherName: emptyToNull(input.student.motherName),
    passportNo: emptyToNull(input.student.passportNo),
    phone: emptyToNull(input.student.phone),
    stage: input.intent === "submit" ? "Application" : "Profil",
  };

  if (existingStudent) {
    if (
      enforceAgentOwnership &&
      studentData.agentId &&
      existingStudent.agentId &&
      existingStudent.agentId !== studentData.agentId
    ) {
      throw new ApplicationActionError("student-owned-by-other-agent");
    }

    return tx.student.update({
      data: studentData,
      select: { id: true },
      where: { id: existingStudent.id },
    });
  }

  return tx.student.create({
    data: {
      ...studentData,
      createdById: currentUserId,
    },
    select: { id: true },
  });
}

async function applyExistingApplicationDocuments({
  applicationId,
  currentUserId,
  documentReferences,
  studentId,
}: {
  applicationId: string;
  currentUserId: string | null;
  documentReferences: WizardExistingDocumentPayload[];
  studentId: string;
}) {
  const references = documentReferences.filter(
    (document) => document.documentId && document.documentKey,
  );

  if (references.length === 0) {
    return;
  }

  const sourceDocuments = await prisma.applicationDocument.findMany({
    select: {
      documentKey: true,
      fileName: true,
      fileSize: true,
      fileUrl: true,
      id: true,
      mimeType: true,
      uploadedAt: true,
      uploadedById: true,
    },
    where: {
      id: { in: references.map((document) => document.documentId) },
      application: { studentId },
      fileName: { not: null },
      fileUrl: { not: null },
      status: "UPLOADED",
    },
  });
  const referencesById = new Map(
    references.map((document) => [document.documentId, document.documentKey]),
  );
  const validDocuments = sourceDocuments.filter(
    (document) => referencesById.get(document.id) === document.documentKey,
  );

  if (validDocuments.length === 0) {
    return;
  }

  await prisma.$transaction(
    validDocuments.map((document) =>
      prisma.applicationDocument.update({
        data: {
          fileName: document.fileName,
          fileSize: document.fileSize,
          fileUrl: document.fileUrl,
          mimeType: document.mimeType,
          status: "UPLOADED",
          uploadedAt: document.uploadedAt ?? new Date(),
          uploadedById: document.uploadedById ?? currentUserId,
        },
        where: {
          applicationId_documentKey: {
            applicationId,
            documentKey: document.documentKey,
          },
        },
      }),
    ),
  );

  await prisma.activityLog.createMany({
    data: validDocuments.map((document) => ({
      action: "DOCUMENT_UPLOADED",
      entityId: applicationId,
      entityType: "APPLICATION_DOCUMENT",
      newValue: {
        documentKey: document.documentKey,
        fileName: document.fileName,
        source: "existing-student-document",
      },
      userId: currentUserId,
    })),
  });
}

async function uploadApplicationDocuments({
  applicationId,
  currentUserId,
  documentRequirements,
  formData,
}: {
  applicationId: string;
  currentUserId: string | null;
  documentRequirements: ReturnType<typeof getDocumentRequirements>;
  formData: FormData;
}): Promise<ApplicationActionState> {
  for (const requirement of documentRequirements) {
    const file = getFile(formData, `document.${requirement.key}`);

    if (!file) {
      continue;
    }

    const fileValidationError = getApplicationDocumentFileError(file);

    if (fileValidationError) {
      return {
        message:
          fileValidationError === "file-too-large"
            ? `${requirement.title} maksimum 25 MB ola bilər.`
            : `${requirement.title} formatı dəstəklənmir.`,
        status: "error",
      };
    }

    try {
      const uploadedFile = await uploadApplicationDocumentFile({
        applicationId,
        documentKey: requirement.key,
        file,
      });

      await prisma.applicationDocument.update({
        data: {
          fileName: uploadedFile.fileName,
          fileSize: uploadedFile.fileSize,
          fileUrl: uploadedFile.fileUrl,
          mimeType: uploadedFile.mimeType,
          status: "UPLOADED",
          uploadedAt: new Date(),
          uploadedById: currentUserId,
        },
        where: {
          applicationId_documentKey: {
            applicationId,
            documentKey: requirement.key,
          },
        },
      });

      await prisma.activityLog.create({
        data: {
          action: "DOCUMENT_UPLOADED",
          entityId: applicationId,
          entityType: "APPLICATION_DOCUMENT",
          newValue: {
            documentKey: requirement.key,
            fileName: uploadedFile.fileName,
          },
          userId: currentUserId,
        },
      });
    } catch (error) {
      return {
        message:
          error instanceof Error
            ? error.message
            : `${requirement.title} yüklənmədi.`,
        status: "error",
      };
    }
  }

  return { status: "idle" };
}

async function countBlockingRequiredDocuments(applicationId: string) {
  return prisma.applicationDocument.count({
    where: {
      applicationId,
      isRequired: true,
      status: {
        notIn: [...APPLICATION_REQUIRED_DOCUMENT_READY_STATUSES],
      },
    },
  });
}

function canTransitionApplicationStatus(
  currentStatus: (typeof APPLICATION_STATUSES)[number],
  nextStatus: (typeof APPLICATION_STATUSES)[number],
) {
  return APPLICATION_STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
}

function getApplicationDocumentFileError(file: File) {
  if (file.size > APPLICATION_DOCUMENT_UPLOAD_MAX_BYTES) {
    return "file-too-large";
  }

  if (
    file.type &&
    !APPLICATION_DOCUMENT_UPLOAD_MIME_TYPES.includes(
      file.type as (typeof APPLICATION_DOCUMENT_UPLOAD_MIME_TYPES)[number],
    )
  ) {
    return "file-type";
  }

  return null;
}

function parseEducationPayload(formData: FormData): WizardEducationPayload {
  const value = parseJsonObject<WizardEducationPayload>(
    formData,
    "educationJson",
  );

  return {
    averageScore: value.averageScore,
    city: value.city,
    country: value.country,
    endYear: value.endYear || undefined,
    gradingSystem: value.gradingSystem,
    institutionName: value.institutionName ?? "",
    startYear: value.startYear || undefined,
  };
}

function parseJsonArray<T>(formData: FormData, key: string): T[] {
  const value = getString(formData, key);

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function parseJsonObject<T>(formData: FormData, key: string): Partial<T> {
  const value = getString(formData, key);

  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Partial<T>)
      : {};
  } catch {
    return {};
  }
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  return trimmed === "__none__" || trimmed === "__empty" ? "" : trimmed;
}

function parseBakuDateTime(value: string) {
  if (!value) {
    return value;
  }

  const normalized = value.length === 16 ? `${value}:00` : value;
  return new Date(`${normalized}+04:00`);
}

function getDocumentUploadReturnTo(formData: FormData, applicationId: string) {
  const returnTo = getString(formData, "returnTo");

  if (returnTo === "/documents") {
    return "/documents";
  }

  return `/applications/${applicationId}#documents`;
}

function withStatusParam(
  pathname: string,
  key: "error" | "success",
  value: string,
) {
  const [path, hash = ""] = pathname.split("#");
  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}${key}=${encodeURIComponent(value)}${
    hash ? `#${hash}` : ""
  }`;
}

function getFile(formData: FormData, key: string) {
  const value = formData.get(key);

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

function emptyToNull(value?: string | null) {
  return value && value.length > 0 ? value : null;
}

function createApplicationCode() {
  const date = new Date();
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  const suffix = randomBytes(3).toString("hex").toUpperCase();

  return `APP-${datePart}-${suffix}`;
}

function validationError(fieldErrors: Record<string, string[] | undefined>) {
  return {
    fieldErrors: Object.fromEntries(
      Object.entries(fieldErrors).filter(
        ([, value]) => value && value.length > 0,
      ),
    ) as Record<string, string[]>,
    message: "Form məlumatlarını yoxlayın.",
    status: "error" as const,
  };
}

function databaseError(error: unknown, fallbackMessage: string) {
  if (error instanceof ApplicationActionError) {
    if (error.message === "agent-scope") {
      return {
        message: "Agent yalnız öz hesabı üçün müraciət yarada bilər.",
        status: "error" as const,
      };
    }

    if (error.message === "agent-cannot-register") {
      return {
        message: "Bu agent hazırda tələbə və müraciət qeydiyyatı edə bilmir.",
        status: "error" as const,
      };
    }

    if (error.message === "student-scope") {
      return {
        message: "Bu əməliyyat üçün tələbə portal profili aktiv deyil.",
        status: "error" as const,
      };
    }

    if (error.message === "student-owned-by-other-agent") {
      return {
        message: "Bu tələbə başqa agentə bağlıdır.",
        status: "error" as const,
      };
    }

    if (error.message === "student-not-found") {
      return {
        message: "Seçilmiş tələbə aktiv deyil və ya tapılmadı.",
        status: "error" as const,
      };
    }

    return {
      message:
        error.message === "invalid-choice"
          ? "Seçilmiş ixtisas period, ölkə və pillə ilə uyğun deyil."
          : fallbackMessage,
      status: "error" as const,
    };
  }

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";

  if (code === "P2002") {
    return {
      message:
        "Bu e-mail, pasport və ya şəxsiyyət nömrəsi artıq başqa tələbədə istifadə olunub.",
      status: "error" as const,
    };
  }

  return {
    message: fallbackMessage,
    status: "error" as const,
  };
}

function isApplicationDecisionStatus(
  value: string,
): value is (typeof APPLICATION_DECISION_STATUSES)[number] {
  return APPLICATION_DECISION_STATUSES.includes(
    value as (typeof APPLICATION_DECISION_STATUSES)[number],
  );
}

function isApplicationDocumentStatus(
  value: string,
): value is (typeof APPLICATION_DOCUMENT_STATUSES)[number] {
  return APPLICATION_DOCUMENT_STATUSES.includes(
    value as (typeof APPLICATION_DOCUMENT_STATUSES)[number],
  );
}

function revalidateApplications(applicationId?: string) {
  revalidatePath("/applications");
  revalidatePath("/az/applications");
  revalidatePath("/applications/new");
  revalidatePath("/az/applications/new");
  revalidatePath("/dashboard");
  revalidatePath("/az/dashboard");
  revalidatePath("/updates");
  revalidatePath("/az/updates");

  if (applicationId) {
    revalidatePath(`/applications/${applicationId}`);
    revalidatePath(`/az/applications/${applicationId}`);
  }
}

class ApplicationActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApplicationActionError";
  }
}
