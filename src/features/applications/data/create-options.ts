import { cache } from "react";

import { APPLICATION_LEVEL_CARDS } from "@/features/applications/constants";
import type {
  ApplicationCreateOptions,
  ApplicationLevelOption,
  ApplicationProgramOption,
  ApplicationStudentDocument,
  WizardEducationPayload,
  WizardExamPayload,
} from "@/features/applications/types";
import type { Prisma } from "@/generated/prisma/client";
import {
  getCurrentSession,
  getSessionAgentId,
  getSessionStudentId,
} from "@/lib/auth/session";

type ApplicationCreateProgramRecord = Prisma.ProgramGetPayload<{
  include: {
    campus: true;
    educationLanguage: true;
    educationLevel: true;
    tuitions: {
      include: { period: true };
    };
    university: true;
  };
}>;

export const getApplicationCreateOptions = cache(
  async (): Promise<ApplicationCreateOptions> => {
    const session = await getCurrentSession();
    const scopedAgentId = session ? getSessionAgentId(session) : null;
    const scopedStudentId = session ? getSessionStudentId(session) : null;
    const viewer = scopedStudentId ? "student" : "workspace";

    if (!hasUsableDatabaseUrl()) {
      return emptyOptions("unavailable", viewer);
    }

    try {
      const { prisma } = await import("@/lib/db");
      const [periods, levels, programs, agents, students, currentStudent] =
        await Promise.all([
          prisma.period.findMany({
            orderBy: [{ year: "desc" }, { season: "asc" }],
            select: {
              applicationDeadline: true,
              id: true,
              name: true,
              season: true,
              year: true,
            },
            where: { status: "OPEN" },
          }),
          prisma.educationLevel.findMany({
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            select: { id: true, name: true },
            where: { status: "ACTIVE" },
          }),
          prisma.program.findMany({
            include: {
              campus: true,
              educationLanguage: true,
              educationLevel: true,
              tuitions: {
                include: { period: true },
                orderBy: [{ lastUpdatedAt: "desc" }],
                where: {
                  period: { status: "OPEN" },
                  priceStatus: "ACTIVE",
                },
              },
              university: true,
            },
            orderBy: [{ university: { name: "asc" } }, { name: "asc" }],
            where: {
              status: "ACTIVE",
              university: { status: "ACTIVE" },
            },
          }),
          prisma.agent.findMany({
            orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
            select: {
              companyName: true,
              firstName: true,
              id: true,
              lastName: true,
            },
            where: scopedAgentId
              ? { id: scopedAgentId, portalStatus: { not: "SUSPENDED" } }
              : scopedStudentId
                ? { id: "__student-no-agent-options__" }
                : { portalStatus: { not: "SUSPENDED" } },
          }),
          scopedStudentId
            ? Promise.resolve([])
            : prisma.student.findMany({
                orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
                select: {
                  address: true,
                  agent: {
                    select: {
                      companyName: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                  agentId: true,
                  birthDate: true,
                  citizenship: true,
                  contactEmail: true,
                  fatherName: true,
                  firstName: true,
                  gender: true,
                  id: true,
                  identityNo: true,
                  lastName: true,
                  loginEmail: true,
                  maritalStatus: true,
                  motherName: true,
                  passportNo: true,
                  phone: true,
                  applications: {
                    orderBy: [{ updatedAt: "desc" }],
                    select: {
                      documents: {
                        orderBy: [
                          { uploadedAt: "desc" },
                          { updatedAt: "desc" },
                        ],
                        select: {
                          documentKey: true,
                          fileName: true,
                          fileSize: true,
                          fileUrl: true,
                          id: true,
                          mimeType: true,
                          uploadedAt: true,
                        },
                        where: {
                          fileName: { not: null },
                          fileUrl: { not: null },
                          status: "UPLOADED",
                        },
                      },
                      educationRecords: {
                        orderBy: [
                          { isRequired: "desc" },
                          { updatedAt: "desc" },
                        ],
                        select: {
                          averageScore: true,
                          city: true,
                          country: true,
                          endYear: true,
                          gradingSystem: true,
                          institutionName: true,
                          startYear: true,
                        },
                        take: 1,
                      },
                      examRecords: {
                        orderBy: [{ updatedAt: "desc" }],
                        select: {
                          examDate: true,
                          examName: true,
                          maxScore: true,
                          score: true,
                        },
                        take: 1,
                      },
                    },
                    take: 10,
                  },
                },
                take: 300,
                where: {
                  agentId: scopedAgentId ?? undefined,
                  status: "ACTIVE",
                },
              }),
          scopedStudentId
            ? prisma.student.findFirst({
                select: {
                  address: true,
                  birthDate: true,
                  citizenship: true,
                  contactEmail: true,
                  fatherName: true,
                  firstName: true,
                  gender: true,
                  id: true,
                  identityNo: true,
                  lastName: true,
                  loginEmail: true,
                  maritalStatus: true,
                  motherName: true,
                  passportNo: true,
                  phone: true,
                  applications: {
                    orderBy: [{ updatedAt: "desc" }],
                    select: {
                      documents: {
                        orderBy: [
                          { uploadedAt: "desc" },
                          { updatedAt: "desc" },
                        ],
                        select: {
                          documentKey: true,
                          fileName: true,
                          fileSize: true,
                          fileUrl: true,
                          id: true,
                          mimeType: true,
                          uploadedAt: true,
                        },
                        where: {
                          fileName: { not: null },
                          fileUrl: { not: null },
                          status: "UPLOADED",
                        },
                      },
                      educationRecords: {
                        orderBy: [
                          { isRequired: "desc" },
                          { updatedAt: "desc" },
                        ],
                        select: {
                          averageScore: true,
                          city: true,
                          country: true,
                          endYear: true,
                          gradingSystem: true,
                          institutionName: true,
                          startYear: true,
                        },
                        take: 1,
                      },
                      examRecords: {
                        orderBy: [{ updatedAt: "desc" }],
                        select: {
                          examDate: true,
                          examName: true,
                          maxScore: true,
                          score: true,
                        },
                        take: 1,
                      },
                    },
                    take: 10,
                  },
                },
                where: {
                  id: scopedStudentId,
                  portalStatus: "READY",
                  status: "ACTIVE",
                  userId: session?.userId,
                },
              })
            : Promise.resolve(null),
        ]);
      const programOptions = buildProgramOptions(programs);
      const availablePeriodIds = new Set(
        programOptions
          .map((program) => program.periodId)
          .filter((periodId): periodId is string => Boolean(periodId)),
      );
      const availableLevelIds = new Set(
        programOptions.map((program) => program.educationLevelId),
      );

      return {
        agents: agents.map((agent) => ({
          label:
            agent.companyName || `${agent.firstName} ${agent.lastName}`.trim(),
          value: agent.id,
        })),
        countries: buildCountryOptions(programOptions),
        currentStudent: currentStudent
          ? {
              id: currentStudent.id,
              address: currentStudent.address ?? "",
              birthDate: formatDateInput(currentStudent.birthDate),
              citizenship: currentStudent.citizenship ?? "",
              contactEmail: currentStudent.contactEmail ?? "",
              fatherName: currentStudent.fatherName ?? "",
              firstName: currentStudent.firstName,
              gender: currentStudent.gender ?? "",
              identityNo: currentStudent.identityNo ?? "",
              lastName: currentStudent.lastName,
              loginEmail:
                currentStudent.loginEmail ?? currentStudent.contactEmail ?? "",
              maritalStatus: currentStudent.maritalStatus ?? "",
              motherName: currentStudent.motherName ?? "",
              passportNo: currentStudent.passportNo ?? "",
              phone: currentStudent.phone ?? "",
              documents: buildStudentDocuments(currentStudent.applications),
              education: buildStudentEducation(currentStudent.applications),
              exam: buildStudentExam(currentStudent.applications),
            }
          : null,
        dataSource: "database",
        levels: buildLevelOptions(
          levels.filter((level) => availableLevelIds.has(level.id)),
        ),
        periods: periods
          .filter((period) => availablePeriodIds.has(period.id))
          .map((period) => ({
            deadline: period.applicationDeadline?.toISOString() ?? null,
            id: period.id,
            name: period.name,
            season: period.season,
            year: period.year,
          })),
        programs: programOptions,
        students: students.map((student) => {
          const studentName = `${student.firstName} ${student.lastName}`.trim();
          const agentLabel = student.agent
            ? student.agent.companyName ||
              `${student.agent.firstName} ${student.agent.lastName}`.trim()
            : "Fərdi qeydiyyat";

          return {
            address: student.address ?? "",
            agentId: student.agentId ?? "",
            agentLabel,
            birthDate: formatDateInput(student.birthDate),
            citizenship: student.citizenship ?? "",
            contactEmail: student.contactEmail ?? "",
            fatherName: student.fatherName ?? "",
            firstName: student.firstName,
            gender: student.gender ?? "",
            id: student.id,
            identityNo: student.identityNo ?? "",
            label: [studentName, student.contactEmail, student.passportNo]
              .filter(Boolean)
              .join(" · "),
            lastName: student.lastName,
            loginEmail: student.loginEmail ?? student.contactEmail ?? "",
            maritalStatus: student.maritalStatus ?? "",
            motherName: student.motherName ?? "",
            passportNo: student.passportNo ?? "",
            phone: student.phone ?? "",
            documents: buildStudentDocuments(student.applications),
            education: buildStudentEducation(student.applications),
            exam: buildStudentExam(student.applications),
          };
        }),
        viewer,
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `Application create options unavailable: ${String(error)}`,
        );
      }

      return emptyOptions("unavailable", viewer);
    }
  },
);

function buildStudentDocuments(
  applications: Array<{
    documents: Array<{
      documentKey: string;
      fileName: string | null;
      fileSize: number | null;
      fileUrl: string | null;
      id: string;
      mimeType: string | null;
      uploadedAt: Date | null;
    }>;
  }>,
): Record<string, ApplicationStudentDocument> {
  const documents: Record<string, ApplicationStudentDocument> = {};

  for (const application of applications) {
    for (const document of application.documents) {
      if (
        documents[document.documentKey] ||
        !document.fileName ||
        !document.fileUrl
      ) {
        continue;
      }

      documents[document.documentKey] = {
        documentKey: document.documentKey,
        fileName: document.fileName,
        fileSize: document.fileSize,
        fileUrl: document.fileUrl,
        id: document.id,
        mimeType: document.mimeType,
        uploadedAt: document.uploadedAt?.toISOString() ?? null,
      };
    }
  }

  return documents;
}

function buildStudentEducation(
  applications: Array<{
    educationRecords?: Array<{
      averageScore: string | null;
      city: string | null;
      country: string | null;
      endYear: number | null;
      gradingSystem: string | null;
      institutionName: string;
      startYear: number | null;
    }>;
  }>,
): WizardEducationPayload {
  for (const application of applications) {
    const record = application.educationRecords?.[0];

    if (!record?.institutionName) {
      continue;
    }

    return {
      averageScore: record.averageScore ?? "",
      city: record.city ?? "",
      country: record.country ?? "",
      endYear: record.endYear ? String(record.endYear) : "",
      gradingSystem: record.gradingSystem ?? "",
      institutionName: record.institutionName,
      startYear: record.startYear ? String(record.startYear) : "",
    };
  }

  return {
    averageScore: "",
    city: "",
    country: "",
    endYear: "",
    gradingSystem: "",
    institutionName: "",
    startYear: "",
  };
}

function buildStudentExam(
  applications: Array<{
    examRecords?: Array<{
      examDate: Date | null;
      examName: string;
      maxScore: string | null;
      score: string | null;
    }>;
  }>,
): WizardExamPayload {
  for (const application of applications) {
    const record = application.examRecords?.[0];

    if (!record?.examName && !record?.score) {
      continue;
    }

    return {
      examDate: formatDateInput(record.examDate),
      examName: record.examName ?? "",
      maxScore: record.maxScore ?? "",
      score: record.score ?? "",
    };
  }

  return {
    examDate: "",
    examName: "",
    maxScore: "",
    score: "",
  };
}

function buildLevelOptions(
  levels: Array<{ id: string; name: string }>,
): ApplicationLevelOption[] {
  return APPLICATION_LEVEL_CARDS.map((card) => {
    const matchedLevel = findMatchingLevel(card.aliases, levels);

    return {
      aliases: card.aliases,
      educationLevelId: matchedLevel?.id ?? "",
      icon: card.icon,
      key: card.key,
      label: card.label,
    };
  }).filter((level) => level.educationLevelId);
}

function buildProgramOptions(
  programs: ApplicationCreateProgramRecord[],
): ApplicationProgramOption[] {
  return programs.flatMap<ApplicationProgramOption>((program) =>
    program.tuitions.map((tuition) => ({
      city: program.campus?.city ?? program.university.city,
      country: program.university.country,
      currency: tuition.currency,
      discountedTuitionFee: tuition.discountedTuitionFee
        ? Number(tuition.discountedTuitionFee)
        : null,
      educationLevelId: program.educationLevelId,
      educationLevelName: program.educationLevel.name,
      id: `${program.id}:${tuition.id}`,
      language: program.educationLanguage.name,
      periodId: tuition.periodId,
      periodName: tuition.period.name,
      programId: program.id,
      programName: program.name,
      tuitionFee: Number(tuition.tuitionFee),
      tuitionId: tuition.id,
      universityId: program.universityId,
      universityName: program.university.name,
      universityType: formatEnumLabel(program.university.schoolType),
    })),
  );
}

function buildCountryOptions(programs: ApplicationProgramOption[]) {
  const universitiesByCountry = new Map<string, Set<string>>();

  for (const program of programs) {
    const universities =
      universitiesByCountry.get(program.country) ?? new Set<string>();
    universities.add(program.universityId);
    universitiesByCountry.set(program.country, universities);
  }

  return Array.from(universitiesByCountry, ([country, universities]) => ({
    country,
    universityCount: universities.size,
  })).sort((left, right) => left.country.localeCompare(right.country));
}

function findMatchingLevel(
  aliases: readonly string[],
  levels: Array<{ id: string; name: string }>,
) {
  const normalizedAliases = aliases.map(normalizeText);
  const directMatch = levels.find((level) => {
    const normalizedName = normalizeText(level.name);
    return normalizedAliases.some(
      (alias) =>
        normalizedName.includes(alias) || alias.includes(normalizedName),
    );
  });

  if (directMatch) {
    return directMatch;
  }

  if (normalizedAliases.some((alias) => alias.includes("associate"))) {
    return findMatchingLevel(["bachelor", "bakalavr", "lisans"], levels);
  }

  if (normalizedAliases.some((alias) => alias.includes("integrated"))) {
    return findMatchingLevel(["phd", "doktor"], levels);
  }

  return null;
}

function emptyOptions(
  dataSource: ApplicationCreateOptions["dataSource"],
  viewer: ApplicationCreateOptions["viewer"] = "workspace",
): ApplicationCreateOptions {
  return {
    agents: [],
    countries: [],
    currentStudent: null,
    dataSource,
    levels: [],
    periods: [],
    programs: [],
    students: [],
    viewer,
  };
}

function formatDateInput(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function formatEnumLabel(value: string | null | undefined) {
  if (!value) {
    return "N/A";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hasUsableDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
