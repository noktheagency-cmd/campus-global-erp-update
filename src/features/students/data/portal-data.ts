import { cache } from "react";

import { APPLICATION_STATUS_LABELS } from "@/features/applications/constants";
import {
  mapStudentChatMessages,
  type StudentChatMessage,
} from "@/features/applications/student-chat";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { createDocumentAccessUrl } from "@/lib/supabase/storage";

type StudentPortalRecord = Prisma.StudentGetPayload<{
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
            university: true;
          };
        };
        documents: true;
        documentRequests: {
          include: {
            applicationChoice: {
              include: {
                program: true;
                university: true;
              };
            };
            createdBy: true;
            respondedBy: true;
          };
        };
        educationLevel: true;
        educationRecords: true;
        examRecords: true;
        period: true;
      };
    };
    documents: true;
  };
}>;

type PortalApplicationBase = StudentPortalRecord["applications"][number];
type PortalDocumentBase = PortalApplicationBase["documents"][number];
type PortalDocumentRequestBase =
  PortalApplicationBase["documentRequests"][number];
type PortalGeneralDocumentBase = StudentPortalRecord["documents"][number];
type PortalStatusActivity = {
  action: string;
  createdAt: Date;
  entityId: string;
  id: string;
  newValue: Prisma.JsonValue | null;
};

export type StudentPortalDocument = PortalDocumentBase & {
  accessUrl: string | null;
};

export type StudentPortalGeneralDocument = PortalGeneralDocumentBase & {
  accessUrl: string | null;
};

export type StudentPortalDocumentRequest = PortalDocumentRequestBase & {
  accessUrl: string | null;
  isOverdue: boolean;
  responseAccessUrl: string | null;
};

export type StudentPortalApplication = Omit<
  PortalApplicationBase,
  "documents" | "documentRequests"
> & {
  documents: StudentPortalDocument[];
  documentRequests: StudentPortalDocumentRequest[];
  latestStatusReason: string | null;
};

export type StudentPortalUpdate = {
  id: string;
  title: string;
  detail: string;
  actionHref?: string;
  createdAt: Date;
  tone: "amber" | "blue" | "green" | "red";
};

export type StudentPortalStep = {
  detail: string;
  label: string;
  state: "blocked" | "complete" | "current" | "pending";
};

export type StudentPortalData = {
  agentLabel: string;
  applications: StudentPortalApplication[];
  chatMessages: StudentChatMessage[];
  dataSource: "database" | "unavailable";
  generalDocuments: StudentPortalGeneralDocument[];
  metrics: {
    missingRequiredDocuments: number;
    overdueDocumentRequests: number;
    pendingDocumentRequests: number;
    profileCompletion: number;
    programChoices: number;
    uploadedDocuments: number;
    totalDocuments: number;
  };
  primaryApplication: StudentPortalApplication | null;
  profileFields: Array<{
    filled: boolean;
    label: string;
    value: string;
  }>;
  recentUpdates: StudentPortalUpdate[];
  steps: StudentPortalStep[];
  student: StudentPortalRecord;
};

export const getStudentPortalData = cache(
  async (studentId?: string): Promise<StudentPortalData | null> => {
    if (!studentId || !hasUsableDatabaseUrl()) {
      return null;
    }

    const { prisma } = await import("@/lib/db");
    const student = await prisma.student.findUnique({
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
                university: true,
              },
              orderBy: [{ priority: "asc" }],
            },
            documents: {
              orderBy: [{ isRequired: "desc" }, { documentGroup: "asc" }],
            },
            documentRequests: {
              include: {
                applicationChoice: {
                  include: {
                    program: true,
                    university: true,
                  },
                },
                createdBy: true,
                respondedBy: true,
              },
              orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
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
        },
        documents: {
          orderBy: [{ uploadedAt: "desc" }],
        },
      },
      where: {
        id: studentId,
        status: "ACTIVE",
      },
    });

    if (!student) {
      return null;
    }

    const applicationsWithDocuments = await Promise.all(
      student.applications.map(async (application) => ({
        ...application,
        documents: await Promise.all(
          application.documents.map(async (document) => ({
            ...document,
            accessUrl: document.fileUrl
              ? await createDocumentAccessUrl(document.fileUrl)
              : null,
          })),
        ),
        documentRequests: await Promise.all(
          application.documentRequests.map(async (request) => ({
            ...request,
            accessUrl: await createDocumentAccessUrl(request.fileUrl),
            isOverdue:
              request.status !== "COMPLETED" &&
              request.status !== "CANCELLED" &&
              request.deadline.getTime() < Date.now(),
            responseAccessUrl: request.responseFileUrl
              ? await createDocumentAccessUrl(request.responseFileUrl)
              : null,
          })),
        ),
      })),
    );
    const generalDocuments = await Promise.all(
      student.documents.map(async (document) => ({
        ...document,
        accessUrl: await createDocumentAccessUrl(document.fileUrl),
      })),
    );
    const [statusActivities, chatActivities] = await Promise.all([
      getPortalStatusActivities(
        prisma,
        applicationsWithDocuments.map((application) => application.id),
      ),
      getStudentChatActivities(prisma, student.id),
    ]);
    const latestStatusReasons = buildLatestStatusReasonMap(statusActivities);
    const applications = applicationsWithDocuments.map((application) => ({
      ...application,
      latestStatusReason: latestStatusReasons.get(application.id) ?? null,
    }));
    const primaryApplication =
      applications.find((application) => application.status !== "ARCHIVED") ??
      applications[0] ??
      null;
    const metrics = buildMetrics(
      student,
      applications,
      primaryApplication,
      generalDocuments,
    );

    return {
      agentLabel: formatAgentLabel(student.agent),
      applications,
      chatMessages: mapStudentChatMessages(chatActivities.reverse()),
      dataSource: "database",
      generalDocuments,
      metrics,
      primaryApplication,
      profileFields: buildProfilFields(student),
      recentUpdates: buildRecentUpdates(
        student,
        applications,
        primaryApplication,
        statusActivities,
        generalDocuments,
      ),
      steps: buildSteps(primaryApplication, metrics.missingRequiredDocuments),
      student,
    };
  },
);

async function getStudentChatActivities(
  prisma: PrismaClient,
  studentId: string,
) {
  return prisma.activityLog.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      createdAt: true,
      id: true,
      newValue: true,
      user: {
        select: {
          email: true,
          name: true,
          role: true,
        },
      },
    },
    take: 80,
    where: {
      action: "UPDATED",
      entityId: studentId,
      entityType: "STUDENT",
    },
  });
}

async function getPortalStatusActivities(
  prisma: PrismaClient,
  applicationIds: string[],
): Promise<PortalStatusActivity[]> {
  if (applicationIds.length === 0) {
    return [];
  }

  return prisma.activityLog.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      action: true,
      createdAt: true,
      entityId: true,
      id: true,
      newValue: true,
    },
    take: 30,
    where: {
      action: { in: ["STATUS_CHANGED", "SUBMITTED"] },
      entityId: { in: applicationIds },
      entityType: "APPLICATION",
    },
  });
}

function buildMetrics(
  student: StudentPortalRecord,
  applications: StudentPortalApplication[],
  application: StudentPortalApplication | null,
  generalDocuments: StudentPortalGeneralDocument[],
) {
  const documents = applications.flatMap((item) => item.documents);
  const documentRequests = applications.flatMap(
    (item) => item.documentRequests,
  );
  const primaryDocuments = application?.documents ?? [];
  const totalDocuments = documents.length + generalDocuments.length;
  const uploadedDocuments =
    documents.filter((document) => document.status === "UPLOADED").length +
    generalDocuments.length;
  const missingRequiredDocuments = primaryDocuments.filter(
    (document) => document.isRequired && document.status === "MISSING",
  ).length;
  const profileFields = buildProfilFields(student);
  const filledFields = profileFields.filter((field) => field.filled).length;
  const openDocumentRequests = documentRequests.filter(
    (request) =>
      request.status !== "COMPLETED" && request.status !== "CANCELLED",
  );

  return {
    missingRequiredDocuments,
    overdueDocumentRequests: openDocumentRequests.filter(
      (request) => request.deadline.getTime() < Date.now(),
    ).length,
    pendingDocumentRequests: openDocumentRequests.length,
    profileCompletion:
      profileFields.length > 0
        ? Math.round((filledFields / profileFields.length) * 100)
        : 0,
    programChoices: application?.choices.length ?? 0,
    totalDocuments,
    uploadedDocuments,
  };
}

function buildProfilFields(student: StudentPortalRecord) {
  return [
    ["Ad və soyad", `${student.firstName} ${student.lastName}`.trim()],
    ["Əlaqə e-poçtu", student.contactEmail],
    ["Mobil telefon", student.phone],
    ["Doğum tarixi", formatInputDate(student.birthDate)],
    ["Pasport no", student.passportNo],
    ["Şəxsiyyət no", student.identityNo],
    ["Vətəndaşlıq", student.citizenship],
    ["Ünvan", student.address],
  ].map(([label, value]) => ({
    filled: Boolean(value),
    label: String(label),
    value: String(value || "Qeyd edilməyib"),
  }));
}

function buildSteps(
  application: StudentPortalApplication | null,
  missingRequiredDocuments: number,
): StudentPortalStep[] {
  const status = application?.status;
  const hasApplication = Boolean(application);
  const submitted = Boolean(application?.submittedAt) || status !== "DRAFT";
  const invalidDocuments = status === "INVALID_DOCUMENTS";
  const accepted =
    status === "ACCEPTED" || status === "OFFER" || status === "ENROLLED";
  const rejected = status === "REJECTED";
  const finished = accepted || rejected;

  return [
    {
      detail: "Şəxsi profiliniz aktivdir.",
      label: "Profil",
      state: "complete",
    },
    {
      detail: hasApplication
        ? `Müraciət ${application?.code}`
        : "Yeni müraciəti Müraciətlər bölməsindən başlada bilərsiniz.",
      label: "Müraciət",
      state: hasApplication ? "complete" : "current",
    },
    {
      detail: invalidDocuments
        ? "Sənədlərdə problem var. Səbəbi müraciət detalları bölməsində görünür."
        : missingRequiredDocuments > 0
          ? `${missingRequiredDocuments} sənəd çatışmır`
          : "Lazımi sənədlər yüklənib.",
      label: "Sənədlər",
      state: !hasApplication
        ? "pending"
        : invalidDocuments
          ? "blocked"
          : missingRequiredDocuments > 0
            ? "current"
            : "complete",
    },
    {
      detail: rejected
        ? "Qəbul uğursuz oldu. Səbəb bildirişlərdə göstərilir."
        : accepted
          ? "Qəbul qərarı müsbətdir."
          : submitted
            ? "Müraciət baxış üçün göndərilib."
            : "Hazır olanda göndərə bilərsiniz.",
      label: "Baxış",
      state: !hasApplication
        ? "pending"
        : rejected
          ? "blocked"
          : finished
            ? "complete"
            : submitted
              ? "current"
              : "pending",
    },
    {
      detail: accepted
        ? "Qəbul olundu."
        : rejected
          ? "Qəbul uğursuz oldu."
          : "Universitet cavabı gözlənilir.",
      label: "Nəticə",
      state: accepted
        ? "complete"
        : rejected
          ? "blocked"
          : submitted
            ? "current"
            : "pending",
    },
    {
      detail:
        status === "ENROLLED"
          ? "Qeydiyyat tamamlanıb."
          : "Qeydiyyat müsbət cavabdan sonra başlayır.",
      label: "Qeydiyyat",
      state: status === "ENROLLED" ? "complete" : "pending",
    },
  ];
}

function buildRecentUpdates(
  student: StudentPortalRecord,
  applications: StudentPortalApplication[],
  application: StudentPortalApplication | null,
  statusActivities: PortalStatusActivity[],
  generalDocuments: StudentPortalGeneralDocument[],
): StudentPortalUpdate[] {
  const applicationLabels = new Map(
    applications.map((item) => [item.id, item.code]),
  );
  const updates: StudentPortalUpdate[] = [
    {
      createdAt: student.updatedAt,
      detail: "Profil məlumatlarınız son dəfə yenilənib.",
      id: `student-${student.id}`,
      title: "Profil yeniləndi",
      tone: "blue",
    },
  ];

  for (const document of generalDocuments) {
    updates.push({
      createdAt: document.uploadedAt,
      detail: `${document.fileName} yükləndi.`,
      id: `student-document-${document.id}`,
      title: document.title,
      tone: "blue",
    });
  }

  for (const activity of statusActivities) {
    const status = readJsonString(activity.newValue, "status");

    if (!status) {
      continue;
    }

    const reason = readJsonString(activity.newValue, "reason");
    const code =
      applicationLabels.get(activity.entityId) ||
      readJsonString(activity.newValue, "code") ||
      "Müraciət";

    updates.push({
      createdAt: activity.createdAt,
      detail: `${code} · ${getStatusLabel(status)}${reason ? ` - ${reason}` : ""}`,
      id: `status-${activity.id}`,
      title:
        activity.action === "SUBMITTED"
          ? "Müraciət göndərildi"
          : "Müraciət yeniləndi",
      tone: getStatusTone(status),
    });
  }

  for (const portalApplication of applications) {
    for (const request of portalApplication.documentRequests) {
      const program = request.applicationChoice.program.name;
      const university = request.applicationChoice.university.name;
      const completed = request.status === "COMPLETED";
      const overdue =
        !completed &&
        request.status !== "CANCELLED" &&
        request.deadline.getTime() < Date.now();

      updates.push({
        actionHref: `/applications/${portalApplication.id}`,
        createdAt: completed
          ? (request.completedAt ?? request.updatedAt)
          : request.createdAt,
        detail: completed
          ? `${university} · ${program} üzrə proses tamamlandı.`
          : `${university} · ${program} · son tarix ${formatPortalDateTime(request.deadline)}`,
        id: `document-request-${request.id}`,
        title: completed ? `${request.title} tamamlandı` : request.title,
        tone: completed ? "green" : overdue ? "red" : "amber",
      });
    }
  }

  if (application) {
    updates.push({
      createdAt: application.updatedAt,
      detail: `${application.code} · ${getStatusLabel(application.status)}${
        application.latestStatusReason
          ? ` - ${application.latestStatusReason}`
          : ""
      }`,
      id: `application-${application.id}`,
      title: "Müraciət məlumatı",
      tone: getStatusTone(application.status),
    });

    if (application.submittedAt) {
      updates.push({
        createdAt: application.submittedAt,
        detail: "Müraciətiniz baxış üçün göndərildi.",
        id: `submitted-${application.id}`,
        title: "Müraciət göndərildi",
        tone: "green",
      });
    }

    for (const document of application.documents) {
      if (!document.uploadedAt) {
        continue;
      }

      updates.push({
        createdAt: document.uploadedAt,
        detail: document.fileName
          ? `${document.fileName} yükləndi.`
          : "Sənəd yükləndi.",
        id: `document-${document.id}`,
        title: document.title,
        tone: "blue",
      });
    }
  }

  return updates
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 10);
}

function formatAgentLabel(agent: StudentPortalRecord["agent"]) {
  if (!agent) {
    return "Fərdi qeydiyyat";
  }

  return (
    agent.companyName ||
    `${agent.firstName} ${agent.lastName}`.trim() ||
    agent.email
  );
}

function buildLatestStatusReasonMap(activities: PortalStatusActivity[]) {
  const reasons = new Map<string, string>();
  const seenApplications = new Set<string>();

  for (const activity of activities) {
    if (
      activity.action !== "STATUS_CHANGED" ||
      seenApplications.has(activity.entityId)
    ) {
      continue;
    }

    seenApplications.add(activity.entityId);
    const reason = readJsonString(activity.newValue, "reason");

    if (reason) {
      reasons.set(activity.entityId, reason);
    }
  }

  return reasons;
}

export function getStatusLabel(status: string) {
  return (
    APPLICATION_STATUS_LABELS[
      status as keyof typeof APPLICATION_STATUS_LABELS
    ] ?? formatEnumLabel(status)
  );
}

function getStatusTone(status: string): StudentPortalUpdate["tone"] {
  if (status === "REJECTED" || status === "INVALID_DOCUMENTS") {
    return "red";
  }

  if (status === "ACCEPTED" || status === "OFFER" || status === "ENROLLED") {
    return "green";
  }

  if (status === "DRAFT") {
    return "amber";
  }

  return "blue";
}

function readJsonString(value: Prisma.JsonValue | null, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  const field = (value as Record<string, unknown>)[key];

  return typeof field === "string" ? field : "";
}

export function formatPortalDate(value: Date | null | undefined) {
  if (!value) {
    return "Təyin edilməyib";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Baku",
    year: "numeric",
  }).format(value);
}

export function formatPortalDateTime(value: Date | null | undefined) {
  if (!value) {
    return "Təyin edilməyib";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Baku",
    year: "numeric",
  }).format(value);
}

export function formatInputDate(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export function formatPortalMoney(value: unknown, currency = "USD") {
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

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hasUsableDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}
