import { cache } from "react";

import { APPLICATION_STATUS_LABELS } from "@/features/applications/constants";
import { APPLICATION_REQUIRED_DOCUMENT_READY_STATUSES } from "@/features/applications/constants";
import type { Prisma } from "@/generated/prisma/client";
import {
  getCurrentSession,
  getSessionAgentId,
  getSessionStudentId,
} from "@/lib/auth/session";
import { createDocumentAccessUrl } from "@/lib/supabase/storage";

type ApplicationDetailRecord = Prisma.ApplicationGetPayload<{
  include: {
    agent: true;
    choices: {
      include: {
        decidedBy: true;
        program: {
          include: {
            campus: true;
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
    documents: {
      include: {
        reviewedBy: true;
        uploadedBy: true;
      };
    };
    documentRequests: {
      include: {
        createdBy: true;
        respondedBy: true;
      };
    };
    educationLevel: true;
    educationRecords: true;
    examRecords: true;
    period: true;
    student: true;
  };
}>;

export type ApplicationDetailData = {
  application: ApplicationDetailRecord;
  activities: Array<{
    action: string;
    createdAt: Date;
    entityType: string;
    id: string;
    newValue: Prisma.JsonValue | null;
    oldValue: Prisma.JsonValue | null;
    user: { name: string | null; email: string } | null;
  }>;
  documents: Array<
    ApplicationDetailRecord["documents"][number] & {
      accessUrl: string | null;
      downloadUrl: string | null;
    }
  >;
  documentRequests: Array<
    ApplicationDetailRecord["documentRequests"][number] & {
      accessUrl: string | null;
      downloadUrl: string | null;
      responseAccessUrl: string | null;
      responseDownloadUrl: string | null;
    }
  >;
  summary: {
    agentLabel: string;
    createdAt: string;
    missingRequiredDocuments: number;
    latestStatusReason: string | null;
    pendingDocumentRequests: number;
    statusLabel: string;
    submittedAt: string;
    totalDocuments: number;
    uploadedDocuments: number;
    updatedAt: string;
  };
};

export const getApplicationDetailData = cache(
  async (
    applicationId: string,
    options: {
      includeInternal?: boolean;
      studentId?: string;
    } = {},
  ): Promise<ApplicationDetailData | null> => {
    if (!hasUsableDatabaseUrl()) {
      return null;
    }

    const { prisma } = await import("@/lib/db");
    const session = await getCurrentSession();
    const scopedAgentId = session ? getSessionAgentId(session) : null;
    const scopedStudentId = session ? getSessionStudentId(session) : null;
    const effectiveStudentId =
      options.studentId ?? scopedStudentId ?? undefined;
    const application = await prisma.application.findFirst({
      include: {
        agent: true,
        choices: {
          include: {
            decidedBy: true,
            program: {
              include: {
                campus: true,
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
          include: {
            reviewedBy: true,
            uploadedBy: true,
          },
          orderBy: [{ isRequired: "desc" }, { documentGroup: "asc" }],
        },
        documentRequests: {
          include: {
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
        student: true,
      },
      where: {
        id: applicationId,
        studentId: effectiveStudentId,
      },
    });

    if (
      !application ||
      (scopedAgentId && application.agentId !== scopedAgentId)
    ) {
      return null;
    }

    const documents = await Promise.all(
      application.documents.map(async (document) => ({
        ...document,
        accessUrl: document.fileUrl
          ? await createDocumentAccessUrl(document.fileUrl)
          : null,
        downloadUrl: document.fileUrl
          ? await createDocumentAccessUrl(document.fileUrl, {
              download: document.fileName ?? true,
            })
          : null,
      })),
    );
    const documentRequests = await Promise.all(
      application.documentRequests.map(async (request) => ({
        ...request,
        accessUrl: await createDocumentAccessUrl(request.fileUrl),
        downloadUrl: await createDocumentAccessUrl(request.fileUrl, {
          download: request.fileName,
        }),
        responseAccessUrl: request.responseFileUrl
          ? await createDocumentAccessUrl(request.responseFileUrl)
          : null,
        responseDownloadUrl: request.responseFileUrl
          ? await createDocumentAccessUrl(request.responseFileUrl, {
              download: request.responseFileName ?? true,
            })
          : null,
      })),
    );
    const relatedIds = [
      application.id,
      ...application.choices.map((item) => item.id),
      ...application.documents.map((item) => item.id),
      ...application.documentRequests.map((item) => item.id),
    ];
    const activities = await prisma.activityLog.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 40,
      where:
        options.includeInternal === false
          ? {
              action: { in: ["STATUS_CHANGED", "SUBMITTED"] },
              entityId: application.id,
              entityType: "APPLICATION",
            }
          : {
              entityId: {
                in: relatedIds,
              },
            },
    });
    const latestStatusReason = getLatestStatusReason(activities);

    return {
      activities,
      application,
      documents,
      documentRequests,
      summary: {
        agentLabel: application.agent
          ? application.agent.companyName ||
            `${application.agent.firstName} ${application.agent.lastName}`.trim()
          : "Fərdi qeydiyyat",
        createdAt: formatDateTime(application.createdAt),
        missingRequiredDocuments: application.documents.filter(
          (document) =>
            document.isRequired &&
            !APPLICATION_REQUIRED_DOCUMENT_READY_STATUSES.includes(
              document.status as (typeof APPLICATION_REQUIRED_DOCUMENT_READY_STATUSES)[number],
            ),
        ).length,
        latestStatusReason,
        pendingDocumentRequests: application.documentRequests.filter(
          (request) =>
            request.status !== "COMPLETED" && request.status !== "CANCELLED",
        ).length,
        statusLabel:
          APPLICATION_STATUS_LABELS[
            application.status as keyof typeof APPLICATION_STATUS_LABELS
          ] ?? formatEnumLabel(application.status),
        submittedAt: application.submittedAt
          ? formatDateTime(application.submittedAt)
          : "Göndərilməyib",
        totalDocuments: application.documents.length,
        uploadedDocuments: application.documents.filter(
          (document) => document.status === "UPLOADED",
        ).length,
        updatedAt: formatDateTime(application.updatedAt),
      },
    };
  },
);

export function formatApplicationMoney(value: unknown, currency = "USD") {
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

export function formatDateTime(value: Date | null | undefined) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("az", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Baku",
    year: "numeric",
  }).format(value);
}

export function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getLatestStatusReason(
  activities: Array<{ action: string; newValue: Prisma.JsonValue | null }>,
) {
  for (const activity of activities) {
    if (activity.action !== "STATUS_CHANGED") {
      continue;
    }

    return readJsonString(activity.newValue, "reason") || null;
  }

  return null;
}

function readJsonString(value: Prisma.JsonValue | null, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  const record = value as Record<string, unknown>;
  const field = record[key];

  return typeof field === "string" ? field : "";
}

function hasUsableDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}
