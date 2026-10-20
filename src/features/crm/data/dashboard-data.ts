import { cache } from "react";

import { fallbackCrmRecords, fallbackTeamMembers } from "@/features/crm/data/fallback-data";
import type {
  CrmActivityRecord,
  CrmDashboardData,
  CrmRecord,
  CrmSourceCode,
  CrmStageCode,
  CrmStatusCode,
  CrmTaskPriorityCode,
  CrmTaskRecord,
  CrmTaskStatusCode,
  CrmTeamMember,
} from "@/features/crm/types";
import type { Prisma } from "@/generated/prisma/client";
import { can } from "@/lib/auth/permissions";
import { getCurrentSession } from "@/lib/auth/session";
import { createDocumentAccessUrls } from "@/lib/supabase/storage";

type StudentCrmRecord = Prisma.StudentGetPayload<{
  select: {
    _count: {
      select: {
        documents: true;
      };
    };
    address: true;
    agent: {
      select: {
        companyName: true;
        firstName: true;
        lastName: true;
      };
    };
    agentId: true;
    applications: {
      select: {
        code: true;
        id: true;
        status: true;
        updatedAt: true;
      };
    };
    birthDate: true;
    citizenship: true;
    contactEmail: true;
    createdAt: true;
    createdBy: {
      select: {
        email: true;
        id: true;
        name: true;
      };
    };
    firstName: true;
    id: true;
    lastName: true;
    loginEmail: true;
    phone: true;
    photoUrl: true;
    portalStatus: true;
    stage: true;
    status: true;
    updatedAt: true;
  };
}>;

type AgentCrmRecord = Prisma.AgentGetPayload<{
  select: {
    _count: {
      select: {
        applications: true;
        students: true;
      };
    };
    address: true;
    applications: {
      select: {
        code: true;
        id: true;
        status: true;
        updatedAt: true;
      };
    };
    commissionBalance: true;
    companyName: true;
    contacts: {
      select: {
        email: true;
        fullName: true;
        isPrimary: true;
        phone: true;
        position: true;
        whatsapp: true;
      };
    };
    conversionRate: true;
    country: true;
    createdAt: true;
    createdBy: {
      select: {
        email: true;
        id: true;
        name: true;
      };
    };
    email: true;
    firstName: true;
    id: true;
    lastName: true;
    logoUrl: true;
    phone: true;
    portalStatus: true;
    students: {
      select: {
        firstName: true;
        id: true;
        lastName: true;
        stage: true;
      };
    };
    tier: true;
    updatedAt: true;
  };
}>;

type CrmProfileRecord = Prisma.CrmProfileGetPayload<{
  select: {
    agentId: true;
    id: true;
    interactions: {
      select: {
        author: {
          select: {
            email: true;
            name: true;
          };
        };
        body: true;
        id: true;
        occurredAt: true;
        subject: true;
        type: true;
      };
    };
    lastContactAt: true;
    nextFollowUpAt: true;
    owner: {
      select: {
        email: true;
        id: true;
        name: true;
      };
    };
    preferredDestination: true;
    source: true;
    stage: true;
    status: true;
    studentId: true;
    tags: true;
    tasks: {
      select: {
        assignedTo: {
          select: {
            email: true;
            id: true;
            name: true;
          };
        };
        completedAt: true;
        description: true;
        dueAt: true;
        id: true;
        priority: true;
        status: true;
        title: true;
      };
    };
  };
}>;

export const getCrmDashboardData = cache(
  async (): Promise<CrmDashboardData> => {
    const session = await getCurrentSession();
    const canManage = session ? can(session.role, "crm:manage") : false;

    if (!hasUsableDatabaseUrl()) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("CRM database configuration is missing.");
      }

      return {
        canManage,
        records: fallbackCrmRecords,
        teamMembers: fallbackTeamMembers,
        usingFallback: true,
      };
    }

    try {
      const { prisma } = await import("@/lib/db");
      const [students, agents, teamMembers] = await Promise.all([
        prisma.student.findMany({
          select: {
            _count: {
              select: { documents: true },
            },
            address: true,
            agent: {
              select: {
                companyName: true,
                firstName: true,
                lastName: true,
              },
            },
            agentId: true,
            applications: {
              orderBy: { updatedAt: "desc" },
              select: {
                code: true,
                id: true,
                status: true,
                updatedAt: true,
              },
              take: 4,
            },
            birthDate: true,
            citizenship: true,
            contactEmail: true,
            createdAt: true,
            createdBy: {
              select: {
                email: true,
                id: true,
                name: true,
              },
            },
            firstName: true,
            id: true,
            lastName: true,
            loginEmail: true,
            phone: true,
            photoUrl: true,
            portalStatus: true,
            stage: true,
            status: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 100,
          where: { status: { not: "ARCHIVED" } },
        }),
        prisma.agent.findMany({
          select: {
            _count: {
              select: {
                applications: {
                  where: { status: { not: "ARCHIVED" } },
                },
                students: true,
              },
            },
            address: true,
            applications: {
              orderBy: { updatedAt: "desc" },
              select: {
                code: true,
                id: true,
                status: true,
                updatedAt: true,
              },
              take: 4,
            },
            commissionBalance: true,
            companyName: true,
            contacts: {
              orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
              select: {
                email: true,
                fullName: true,
                isPrimary: true,
                phone: true,
                position: true,
                whatsapp: true,
              },
              take: 5,
            },
            conversionRate: true,
            country: true,
            createdAt: true,
            createdBy: {
              select: {
                email: true,
                id: true,
                name: true,
              },
            },
            email: true,
            firstName: true,
            id: true,
            lastName: true,
            logoUrl: true,
            phone: true,
            portalStatus: true,
            students: {
              orderBy: { updatedAt: "desc" },
              select: {
                firstName: true,
                id: true,
                lastName: true,
                stage: true,
              },
              take: 5,
            },
            tier: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 100,
        }),
        prisma.user.findMany({
          orderBy: [{ name: "asc" }, { email: "asc" }],
          select: { email: true, id: true, name: true },
          where: {
            role: {
              in: ["SUPER_ADMIN", "ADMIN", "MANAGER", "CONSULTANT"],
            },
            status: "ACTIVE",
          },
        }),
      ]);

      let profiles: CrmProfileRecord[] = [];
      if (students.length > 0 || agents.length > 0) {
        profiles = await prisma.crmProfile.findMany({
          select: {
            agentId: true,
            id: true,
            interactions: {
              select: {
                author: {
                  select: { email: true, name: true },
                },
                body: true,
                id: true,
                occurredAt: true,
                subject: true,
                type: true,
              },
              orderBy: { occurredAt: "desc" },
              take: 12,
            },
            lastContactAt: true,
            nextFollowUpAt: true,
            owner: {
              select: { email: true, id: true, name: true },
            },
            preferredDestination: true,
            source: true,
            stage: true,
            status: true,
            studentId: true,
            tags: true,
            tasks: {
              select: {
                assignedTo: {
                  select: { email: true, id: true, name: true },
                },
                completedAt: true,
                description: true,
                dueAt: true,
                id: true,
                priority: true,
                status: true,
                title: true,
              },
              orderBy: [{ status: "asc" }, { dueAt: "asc" }],
              take: 10,
            },
          },
          where: {
            OR: [
              ...(students.length > 0
                ? [{ studentId: { in: students.map((student) => student.id) } }]
                : []),
              ...(agents.length > 0
                ? [{ agentId: { in: agents.map((agent) => agent.id) } }]
                : []),
            ],
          },
        });
      }

      const profileByStudentId = new Map(
        profiles
          .filter((profile) => Boolean(profile.studentId))
          .map((profile) => [profile.studentId as string, profile]),
      );
      const profileByAgentId = new Map(
        profiles
          .filter((profile) => Boolean(profile.agentId))
          .map((profile) => [profile.agentId as string, profile]),
      );
      const photoUrls = await createDocumentAccessUrls(
        [
          ...students.map((student) => student.photoUrl),
          ...agents.map((agent) => agent.logoUrl),
        ].filter((value): value is string => Boolean(value)),
      );

      return {
        canManage,
        records: [
          ...students.map((student) =>
            mapStudentRecord(
              student,
              profileByStudentId.get(student.id),
              student.photoUrl ? (photoUrls.get(student.photoUrl) ?? "") : "",
            ),
          ),
          ...agents.map((agent) =>
            mapAgentRecord(
              agent,
              profileByAgentId.get(agent.id),
              agent.logoUrl
                ? (photoUrls.get(agent.logoUrl) ?? "")
                : "",
            ),
          ),
        ],
        teamMembers: teamMembers.map(mapTeamMember),
        usingFallback: false,
      };
    } catch (error) {
      warnInDevelopment("Falling back to local CRM data", error);

      if (process.env.NODE_ENV === "production") {
        throw error;
      }

      return {
        canManage,
        records: fallbackCrmRecords,
        teamMembers: fallbackTeamMembers,
        usingFallback: true,
      };
    }
  },
);

function mapStudentRecord(
  student: StudentCrmRecord,
  profile: CrmProfileRecord | undefined,
  avatarUrl: string,
): CrmRecord {
  const name = `${student.firstName} ${student.lastName}`.trim();
  const activeApplications = student.applications.filter(
    (application) => application.status !== "ARCHIVED",
  ).length;

  return {
    activities: mapActivities(profile),
    activeApplications,
    address: student.address ?? "Təyin edilməyib",
    agentName: student.agent
      ? student.agent.companyName ||
        `${student.agent.firstName} ${student.agent.lastName}`.trim()
      : "Fərdi qeydiyyat",
    applications: student.applications.map((application) => ({
      code: application.code,
      id: application.id,
      status: application.status,
      updatedAt: application.updatedAt.toISOString(),
    })),
    avatarUrl,
    birthDate: student.birthDate?.toISOString().slice(0, 10) ?? "",
    citizenship: student.citizenship ?? "Təyin edilməyib",
    commissionBalance: 0,
    companyName: "",
    contacts: [],
    conversionRate: activeApplications > 0 ? 60 : 20,
    country: student.citizenship ?? "Təyin edilməyib",
    createdAt: student.createdAt.toISOString(),
    documentCount: student._count.documents,
    email: student.contactEmail ?? student.loginEmail ?? "Təyin edilməyib",
    id: student.id,
    initials: getInitials(name),
    kind: "individual",
    lastContactAt: profile?.lastContactAt?.toISOString() ?? null,
    name,
    nextFollowUpAt: profile?.nextFollowUpAt?.toISOString() ?? null,
    owner: profile?.owner
      ? mapTeamMember(profile.owner)
      : student.createdBy
        ? mapTeamMember(student.createdBy)
        : null,
    phone: student.phone ?? "Təyin edilməyib",
    portalStatus: mapPortalStatus(student.portalStatus),
    preferredDestination: profile?.preferredDestination ?? "Təyin edilməyib",
    profileId: profile?.id ?? null,
    source: (profile?.source as CrmSourceCode | undefined) ??
      (student.agentId ? "AGENT_REFERRAL" : "MANUAL"),
    stage: (profile?.stage as CrmStageCode | undefined) ??
      mapStudentStage(student.stage),
    status: (profile?.status as CrmStatusCode | undefined) ??
      (student.status === "INACTIVE" ? "PAUSED" : "ACTIVE"),
    students: [],
    studentsCount: 0,
    tags: profile?.tags ?? [],
    tasks: mapTasks(profile),
    tier: "",
    updatedAt: student.updatedAt.toISOString(),
  };
}

function mapAgentRecord(
  agent: AgentCrmRecord,
  profile: CrmProfileRecord | undefined,
  avatarUrl: string,
): CrmRecord {
  const name = `${agent.firstName} ${agent.lastName}`.trim();

  return {
    activities: mapActivities(profile),
    activeApplications: agent._count.applications,
    address: agent.address ?? "Təyin edilməyib",
    agentName: "",
    applications: agent.applications.map((application) => ({
      code: application.code,
      id: application.id,
      status: application.status,
      updatedAt: application.updatedAt.toISOString(),
    })),
    avatarUrl,
    birthDate: "",
    citizenship: "",
    commissionBalance: Number(agent.commissionBalance),
    companyName: agent.companyName ?? "Müstəqil agent",
    contacts: agent.contacts.map((contact) => ({
      email: contact.email ?? "",
      fullName: contact.fullName,
      isPrimary: contact.isPrimary,
      phone: contact.phone ?? "",
      position: contact.position ?? "",
      whatsapp: contact.whatsapp ?? "",
    })),
    conversionRate: agent.conversionRate,
    country: agent.country ?? "Təyin edilməyib",
    createdAt: agent.createdAt.toISOString(),
    documentCount: 0,
    email: agent.email,
    id: agent.id,
    initials: getInitials(name),
    kind: "agent",
    lastContactAt: profile?.lastContactAt?.toISOString() ?? null,
    name,
    nextFollowUpAt: profile?.nextFollowUpAt?.toISOString() ?? null,
    owner: profile?.owner
      ? mapTeamMember(profile.owner)
      : agent.createdBy
        ? mapTeamMember(agent.createdBy)
        : null,
    phone: agent.phone ?? "Təyin edilməyib",
    portalStatus: mapPortalStatus(agent.portalStatus),
    preferredDestination: "",
    profileId: profile?.id ?? null,
    source: (profile?.source as CrmSourceCode | undefined) ?? "MANUAL",
    stage: (profile?.stage as CrmStageCode | undefined) ??
      (agent.portalStatus === "READY"
        ? "ACTIVE_PARTNER"
        : "PARTNER_ONBOARDING"),
    status: (profile?.status as CrmStatusCode | undefined) ??
      (agent.portalStatus === "SUSPENDED" ? "PAUSED" : "ACTIVE"),
    students: agent.students.map((student) => ({
      id: student.id,
      name: `${student.firstName} ${student.lastName}`.trim(),
      stage: student.stage,
    })),
    studentsCount: agent._count.students,
    tags: profile?.tags ?? [],
    tasks: mapTasks(profile),
    tier: titleCase(agent.tier),
    updatedAt: agent.updatedAt.toISOString(),
  };
}

function mapActivities(
  profile: CrmProfileRecord | undefined,
): CrmActivityRecord[] {
  return (
    profile?.interactions.map((interaction) => ({
      actor: interaction.author
        ? interaction.author.name || interaction.author.email
        : "Campus Global",
      body: interaction.body ?? "",
      id: interaction.id,
      occurredAt: interaction.occurredAt.toISOString(),
      subject: interaction.subject,
      type: interaction.type,
    })) ?? []
  );
}

function mapTasks(profile: CrmProfileRecord | undefined): CrmTaskRecord[] {
  return (
    profile?.tasks.map((task) => ({
      assignedTo: task.assignedTo ? mapTeamMember(task.assignedTo) : null,
      completedAt: task.completedAt?.toISOString() ?? null,
      description: task.description ?? "",
      dueAt: task.dueAt.toISOString(),
      id: task.id,
      priority: task.priority as CrmTaskPriorityCode,
      status: task.status as CrmTaskStatusCode,
      title: task.title,
    })) ?? []
  );
}

function mapTeamMember(member: {
  email: string;
  id: string;
  name: string | null;
}): CrmTeamMember {
  return {
    id: member.id,
    name: member.name || member.email,
  };
}

function mapStudentStage(value: string): CrmStageCode {
  const normalized = value.toLowerCase();

  if (normalized.includes("offer")) return "OFFER";
  if (normalized.includes("enroll")) return "ENROLLED";
  if (normalized.includes("application") || normalized.includes("visa")) {
    return "APPLICATION";
  }
  if (normalized.includes("document")) return "DOCUMENT_COLLECTION";

  return "CONTACTED";
}

function mapPortalStatus(value: string) {
  if (value === "READY") return "Aktiv";
  if (value === "SUSPENDED") return "Dayandırılıb";
  return "Gözləyir";
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hasUsableDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  return Boolean(databaseUrl && !databaseUrl.includes("CHANGE_ME_DB_PASSWORD"));
}

function warnInDevelopment(message: string, error: unknown) {
  if (process.env.NODE_ENV !== "development") return;

  console.warn(
    `${message}: ${error instanceof Error ? error.message : String(error)}`,
  );
}
