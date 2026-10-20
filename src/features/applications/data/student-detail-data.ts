import { cache } from "react";

import {
  APPLICATION_REQUIRED_DOCUMENT_READY_STATUSES,
  APPLICATION_STATUS_LABELS,
} from "@/features/applications/constants";
import {
  isStudentChatActivity,
  mapStudentChatMessages,
  type StudentChatMessage,
} from "@/features/applications/student-chat";
import type { ApplicationStatus } from "@/features/applications/types";
import type { Prisma } from "@/generated/prisma/client";
import {
  getCurrentSession,
  getSessionAgentId,
  getSessionStudentId,
} from "@/lib/auth/session";
import { createDocumentAccessUrl } from "@/lib/supabase/storage";

type StudentApplicationsRecord = Prisma.StudentGetPayload<{
  include: {
    agent: {
      select: {
        companyName: true;
        email: true;
        firstName: true;
        lastName: true;
        phone: true;
      };
    };
    createdBy: {
      select: {
        email: true;
        name: true;
        role: true;
      };
    };
    portalUser: {
      select: {
        email: true;
        name: true;
        role: true;
        status: true;
      };
    };
    applications: {
      include: {
        choices: {
          include: {
            program: {
              include: {
                educationLanguage: true;
                educationLevel: true;
              };
            };
            tuition: {
              include: {
                period: true;
              };
            };
            university: {
              select: {
                city: true;
                country: true;
                name: true;
                schoolType: true;
              };
            };
          };
        };
        documents: {
          include: {
            uploadedBy: {
              select: {
                email: true;
                name: true;
              };
            };
          };
        };
        educationLevel: true;
        educationRecords: true;
        examRecords: true;
        period: true;
      };
    };
    documents: {
      include: {
        uploadedBy: {
          select: {
            email: true;
            name: true;
          };
        };
      };
    };
  };
}>;

type StudentActivityRecord = {
  action: string;
  createdAt: Date;
  entityId: string;
  entityType: string;
  id: string;
  newValue: Prisma.JsonValue | null;
  oldValue: Prisma.JsonValue | null;
  user: { email: string; name: string | null; role: string } | null;
};

export type ApplicationStudentDetailData = {
  viewer: "agent" | "staff" | "student";
  student: {
    address: string;
    agent: string;
    agentEmail: string;
    agentPhone: string;
    birthDate: string;
    birthDateInput: string;
    citizenship: string;
    contactEmail: string;
    createdAt: string;
    createdBy: string;
    fatherName: string;
    firstName: string;
    gender: string;
    id: string;
    identityNo: string;
    lastName: string;
    loginEmail: string;
    maritalStatus: string;
    motherName: string;
    name: string;
    passportNo: string;
    phone: string;
    photoUrl: string;
    portalStatus: string;
    portalUser: string;
    stage: string;
    status: string;
    updatedAt: string;
  };
  summary: {
    activeApplications: number;
    draftApplications: number;
    missingRequiredDocuments: number;
    submittedApplications: number;
    totalApplications: number;
    totalDocuments: number;
    uploadedDocuments: number;
    updatedAt: string;
  };
  applications: Array<{
    choices: Array<{
      city: string;
      country: string;
      language: string;
      price: string;
      priority: number;
      program: string;
      university: string;
    }>;
    code: string;
    country: string;
    documents: Array<{
      accessUrl: string;
      fileName: string;
      fileSize: number;
      group: string;
      id: string;
      required: boolean;
      status: string;
      title: string;
      uploadedAt: string;
      uploadedBy: string;
    }>;
    educationRecords: Array<{
      averageScore: string;
      city: string;
      country: string;
      gradingSystem: string;
      institutionName: string;
      period: string;
      required: boolean;
      type: string;
    }>;
    exams: Array<{
      date: string;
      maxScore: string;
      name: string;
      score: string;
    }>;
    id: string;
    internalNotes: string;
    latestStatusReason: string;
    level: string;
    missingRequiredDocuments: number;
    period: string;
    status: string;
    statusCode: ApplicationStatus;
    submittedAt: string;
    updatedAt: string;
  }>;
  generalDocuments: Array<{
    accessUrl: string;
    fileName: string;
    fileSize: number;
    id: string;
    title: string;
    type: string;
    uploadedAt: string;
    uploadedBy: string;
  }>;
  activityLogs: Array<{
    actor: string;
    action: string;
    createdAt: string;
    detail: string;
    id: string;
    tone: "amber" | "blue" | "green" | "red" | "slate";
  }>;
  chatMessages: StudentChatMessage[];
};

export const getApplicationStudentDetailData = cache(
  async (studentId: string): Promise<ApplicationStudentDetailData | null> => {
    if (!process.env.DATABASE_URL?.trim()) {
      return null;
    }

    const { prisma } = await import("@/lib/db");
    const session = await getCurrentSession();
    const scopedAgentId = session ? getSessionAgentId(session) : null;
    const scopedStudentId = session ? getSessionStudentId(session) : null;

    if (scopedStudentId && scopedStudentId !== studentId) {
      return null;
    }

    const student = await prisma.student.findFirst({
      include: {
        agent: {
          select: {
            companyName: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        applications: {
          include: {
            choices: {
              include: {
                program: {
                  include: {
                    educationLanguage: true,
                    educationLevel: true,
                  },
                },
                tuition: {
                  include: {
                    period: true,
                  },
                },
                university: {
                  select: {
                    city: true,
                    country: true,
                    name: true,
                    schoolType: true,
                  },
                },
              },
              orderBy: [{ priority: "asc" }],
            },
            documents: {
              include: {
                uploadedBy: {
                  select: {
                    email: true,
                    name: true,
                  },
                },
              },
              orderBy: [{ isRequired: "desc" }, { documentGroup: "asc" }],
            },
            educationLevel: true,
            educationRecords: {
              orderBy: [{ isRequired: "desc" }, { createdAt: "asc" }],
            },
            examRecords: {
              orderBy: [{ createdAt: "asc" }],
            },
            period: true,
          },
          orderBy: [{ updatedAt: "desc" }],
          where: scopedAgentId ? { agentId: scopedAgentId } : undefined,
        },
        createdBy: {
          select: {
            email: true,
            name: true,
            role: true,
          },
        },
        portalUser: {
          select: {
            email: true,
            name: true,
            role: true,
            status: true,
          },
        },
        documents: {
          include: {
            uploadedBy: {
              select: {
                email: true,
                name: true,
              },
            },
          },
          orderBy: [{ uploadedAt: "desc" }],
        },
      },
      where: {
        id: studentId,
        agentId: scopedAgentId ?? undefined,
      },
    });

    if (!student) {
      return null;
    }

    const applicationIds = student.applications.map(
      (application) => application.id,
    );
    const documentIds = student.applications.flatMap((application) =>
      application.documents.map((document) => document.id),
    );
    const activities = await prisma.activityLog.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 120,
      where: {
        OR: [
          { entityId: student.id, entityType: "STUDENT" },
          { entityId: { in: applicationIds }, entityType: "APPLICATION" },
          {
            entityId: {
              in: documentIds.length > 0 ? documentIds : ["__none__"],
            },
            entityType: "APPLICATION_DOCUMENT",
          },
        ],
      },
    });

    return await mapStudentApplications(
      student,
      activities,
      session?.portalType ?? "staff",
    );
  },
);

async function mapStudentApplications(
  student: StudentApplicationsRecord,
  activities: StudentActivityRecord[],
  viewer: ApplicationStudentDetailData["viewer"],
): Promise<ApplicationStudentDetailData> {
  const reasonByApplication = buildStatusReasonMap(activities);
  const applications = await Promise.all(
    student.applications.map(async (application) => {
      const documents = await Promise.all(
        application.documents.map(async (document) => ({
          accessUrl: document.fileUrl
            ? ((await createDocumentAccessUrl(document.fileUrl)) ?? "")
            : "",
          fileName: document.fileName ?? "",
          fileSize: document.fileSize ?? 0,
          group: document.documentGroup,
          id: document.id,
          required: document.isRequired,
          status: formatDocumentStatus(document.status),
          title: document.title,
          uploadedAt: formatDateTime(document.uploadedAt),
          uploadedBy:
            document.uploadedBy?.name ?? document.uploadedBy?.email ?? "",
        })),
      );

      return {
        choices: application.choices.map((choice) => ({
          city: choice.university.city,
          country: choice.university.country,
          language: choice.program.educationLanguage?.name ?? "",
          price: formatMoney(
            choice.tuition?.discountedTuitionFee ?? choice.tuition?.tuitionFee,
            choice.tuition?.currency ?? "USD",
          ),
          priority: choice.priority,
          program: choice.program.name,
          university: choice.university.name,
        })),
        code: application.code,
        country: application.country,
        documents,
        educationRecords: application.educationRecords.map((record) => ({
          averageScore: record.averageScore ?? "",
          city: record.city ?? "",
          country: record.country ?? "",
          gradingSystem: record.gradingSystem ?? "",
          institutionName: record.institutionName,
          period: [record.startYear, record.endYear]
            .filter(Boolean)
            .join(" - "),
          required: record.isRequired,
          type: formatEducationRecordType(record.recordType),
        })),
        exams: application.examRecords.map((record) => ({
          date: formatDate(record.examDate),
          maxScore: record.maxScore ?? "",
          name: record.examName,
          score: record.score ?? "",
        })),
        id: application.id,
        internalNotes:
          viewer === "student" ? "" : (application.internalNotes ?? ""),
        latestStatusReason: reasonByApplication.get(application.id) ?? "",
        level: application.educationLevel.name,
        missingRequiredDocuments: countMissingRequiredDocuments(application),
        period: application.period.name,
        status:
          APPLICATION_STATUS_LABELS[
            application.status as keyof typeof APPLICATION_STATUS_LABELS
          ] ?? formatEnumLabel(application.status),
        statusCode: application.status as ApplicationStatus,
        submittedAt: application.submittedAt
          ? formatDateTime(application.submittedAt)
          : "Göndərilməyib",
        updatedAt: formatDateTime(application.updatedAt),
      };
    }),
  );
  const documents = applications.flatMap(
    (application) => application.documents,
  );
  const missingRequiredDocuments = applications.reduce(
    (total, application) => total + application.missingRequiredDocuments,
    0,
  );
  const generalDocuments = await Promise.all(
    student.documents.map(async (document) => ({
      accessUrl: (await createDocumentAccessUrl(document.fileUrl)) ?? "",
      fileName: document.fileName,
      fileSize: document.fileSize,
      id: document.id,
      title: document.title,
      type: document.documentType,
      uploadedAt: formatDateTime(document.uploadedAt),
      uploadedBy: document.uploadedBy?.name ?? document.uploadedBy?.email ?? "",
    })),
  );
  const latestApplication = student.applications[0];

  const studentPhotoUrl = student.photoUrl
    ? ((await createDocumentAccessUrl(student.photoUrl)) ?? "")
    : "";

  return {
    activityLogs: activities
      .filter((activity) => !isStudentChatActivity(activity.newValue))
      .slice(0, 40)
      .map(mapActivityLog),
    applications,
    chatMessages: mapStudentChatMessages(
      activities
        .filter((activity) => isStudentChatActivity(activity.newValue))
        .reverse(),
    ),
    generalDocuments,
    student: {
      address: student.address ?? "",
      agent: formatAgent(student.agent),
      agentEmail: student.agent?.email ?? "",
      agentPhone: student.agent?.phone ?? "",
      birthDate: formatDate(student.birthDate),
      birthDateInput: student.birthDate?.toISOString().slice(0, 10) ?? "",
      citizenship: student.citizenship ?? "",
      contactEmail: student.contactEmail ?? "",
      createdAt: formatDateTime(student.createdAt),
      createdBy: student.createdBy?.name ?? student.createdBy?.email ?? "",
      fatherName: student.fatherName ?? "",
      firstName: student.firstName,
      gender: formatGender(student.gender),
      id: student.id,
      identityNo: student.identityNo ?? "",
      lastName: student.lastName,
      loginEmail: student.loginEmail ?? "",
      maritalStatus: formatMaritalStatus(student.maritalStatus),
      motherName: student.motherName ?? "",
      name: `${student.firstName} ${student.lastName}`.trim(),
      passportNo: student.passportNo ?? "",
      phone: student.phone ?? "",
      photoUrl: studentPhotoUrl,
      portalStatus: formatPortalStatus(student.portalStatus),
      portalUser:
        student.portalUser?.name ??
        student.portalUser?.email ??
        student.loginEmail ??
        "",
      stage: formatStudentStage(student.stage),
      status: formatEntityStatus(student.status),
      updatedAt: formatDateTime(student.updatedAt),
    },
    summary: {
      activeApplications: student.applications.filter(
        (application) => application.status !== "ARCHIVED",
      ).length,
      draftApplications: student.applications.filter(
        (application) => application.status === "DRAFT",
      ).length,
      missingRequiredDocuments,
      submittedApplications: student.applications.filter(
        (application) => application.status === "SUBMITTED",
      ).length,
      totalApplications: student.applications.length,
      totalDocuments: documents.length + generalDocuments.length,
      uploadedDocuments:
        documents.filter((document) => document.status === "Yüklənib").length +
        generalDocuments.length,
      updatedAt: latestApplication
        ? formatDateTime(latestApplication.updatedAt)
        : "",
    },
    viewer,
  };
}

function countMissingRequiredDocuments(
  application: StudentApplicationsRecord["applications"][number],
) {
  return application.documents.filter(
    (document) =>
      document.isRequired &&
      !APPLICATION_REQUIRED_DOCUMENT_READY_STATUSES.includes(
        document.status as (typeof APPLICATION_REQUIRED_DOCUMENT_READY_STATUSES)[number],
      ),
  ).length;
}

function buildStatusReasonMap(activities: StudentActivityRecord[]) {
  const reasons = new Map<string, string>();

  for (const activity of activities) {
    if (
      activity.entityType !== "APPLICATION" ||
      activity.action !== "STATUS_CHANGED" ||
      reasons.has(activity.entityId) ||
      !isPlainObject(activity.newValue)
    ) {
      continue;
    }

    const reason =
      typeof activity.newValue.reason === "string"
        ? activity.newValue.reason.trim()
        : "";

    if (reason) {
      reasons.set(activity.entityId, reason);
    }
  }

  return reasons;
}

function mapActivityLog(activity: StudentActivityRecord) {
  return {
    action: formatActivityAction(activity.action),
    actor: activity.user?.name ?? activity.user?.email ?? "Sistem",
    createdAt: formatDateTime(activity.createdAt),
    detail: formatActivityDetail(activity),
    id: activity.id,
    tone: getActivityTone(activity.action),
  };
}

function formatActivityDetail(activity: StudentActivityRecord) {
  if (
    activity.action === "STATUS_CHANGED" &&
    isPlainObject(activity.newValue)
  ) {
    const status =
      typeof activity.newValue.status === "string"
        ? (APPLICATION_STATUS_LABELS[
            activity.newValue.status as keyof typeof APPLICATION_STATUS_LABELS
          ] ?? formatEnumLabel(activity.newValue.status))
        : "";
    const reason =
      typeof activity.newValue.reason === "string"
        ? activity.newValue.reason.trim()
        : "";

    return [status ? `Status: ${status}` : "", reason ? `Səbəb: ${reason}` : ""]
      .filter(Boolean)
      .join(" · ");
  }

  if (
    activity.action === "DOCUMENT_UPLOADED" &&
    isPlainObject(activity.newValue)
  ) {
    const title =
      typeof activity.newValue.title === "string"
        ? activity.newValue.title
        : "";

    return title ? `${title} sənədi yeniləndi` : "Sənəd yeniləndi";
  }

  return getEntityLabel(activity.entityType);
}

function getActivityTone(
  action: string,
): ApplicationStudentDetailData["activityLogs"][number]["tone"] {
  if (action === "STATUS_CHANGED") {
    return "blue";
  }

  if (action === "DOCUMENT_UPLOADED") {
    return "green";
  }

  if (action === "ARCHIVED") {
    return "red";
  }

  if (action === "SUBMITTED") {
    return "amber";
  }

  return "slate";
}

function formatActivityAction(action: string) {
  const labels: Record<string, string> = {
    ARCHIVED: "Arxivləndi",
    CREATED: "Yaradıldı",
    DOCUMENT_UPLOADED: "Sənəd yükləndi",
    PRICE_UPDATED: "Qiymət yeniləndi",
    STATUS_CHANGED: "Status dəyişdi",
    SUBMITTED: "Göndərildi",
    UPDATED: "Yeniləndi",
  };

  return labels[action] ?? formatEnumLabel(action);
}

function getEntityLabel(entityType: string) {
  if (entityType === "APPLICATION_CHOICE") {
    return "İxtisas seçimi";
  }

  const labels: Record<string, string> = {
    APPLICATION: "Müraciət",
    APPLICATION_DOCUMENT: "Sənəd",
    STUDENT: "Tələbə profili",
  };

  return labels[entityType] ?? formatEnumLabel(entityType);
}

function formatAgent(agent: StudentApplicationsRecord["agent"]) {
  return agent
    ? agent.companyName || `${agent.firstName} ${agent.lastName}`.trim()
    : "Fərdi qeydiyyat";
}

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("az", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(value);
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("az", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function formatMoney(value: unknown, currency = "USD") {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "";
  }

  return new Intl.NumberFormat("en", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}

function formatDocumentStatus(value: string) {
  const labels: Record<string, string> = {
    ARCHIVED: "Arxivdə",
    MISSING: "Yüklənməyib",
    UPLOADED: "Yüklənib",
    WAIVED: "Azad edilib",
  };

  return labels[value] ?? formatEnumLabel(value);
}

function formatEducationRecordType(value: string) {
  const labels: Record<string, string> = {
    BACHELOR: "Bakalavr",
    HIGH_SCHOOL: "Orta məktəb",
    MASTER: "Magistr",
    OTHER: "Digər",
  };

  return labels[value] ?? formatEnumLabel(value);
}

function formatStudentStage(value: string) {
  const labels: Record<string, string> = {
    Application: "Müraciət",
    Enrollment: "Qeydiyyat",
    Offer: "Təklif",
    Profil: "Profil",
    Profile: "Profil",
    Visa: "Viza",
  };

  return labels[value] ?? value;
}

function formatGender(value: string | null) {
  const labels: Record<string, string> = {
    FEMALE: "Qadın",
    MALE: "Kişi",
    OTHER: "Digər",
  };

  return value ? (labels[value.toUpperCase()] ?? value) : "";
}

function formatMaritalStatus(value: string | null) {
  const labels: Record<string, string> = {
    MARRIED: "Evli",
    SINGLE: "Subay",
  };

  return value ? (labels[value.toUpperCase()] ?? value) : "";
}

function formatPortalStatus(value: string) {
  const labels: Record<string, string> = {
    PENDING: "Gözləyir",
    READY: "Aktiv",
    SUSPENDED: "Dayandırılıb",
  };

  return labels[value] ?? value;
}

function formatEntityStatus(value: string) {
  const labels: Record<string, string> = {
    ACTIVE: "Aktiv",
    ARCHIVED: "Arxivdə",
    INACTIVE: "Passiv",
  };

  return labels[value] ?? value;
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
