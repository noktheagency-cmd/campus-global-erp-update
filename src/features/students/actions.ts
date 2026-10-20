"use server";

import { randomBytes, scryptSync } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  agentStudentProfileSchema,
  studentCreateSchema,
  type StudentCreateInput,
} from "@/features/students/schemas";
import type { RelatedEntityType } from "@/generated/prisma/client";
import {
  getSessionAgentId,
  getSessionStudentId,
  requirePermission,
  requireSession,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  deleteStorageFile,
  type UploadedStorageFile,
  uploadStudentDocumentFile,
  uploadStudentPhotoFile,
} from "@/lib/supabase/storage";

export type StudentActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

type StudentPortalProfilInput = {
  address?: string | null;
  birthDate?: Date | null;
  citizenship?: string | null;
  contactEmail?: string | null;
  identityNo?: string | null;
  passportNo?: string | null;
  phone?: string | null;
};

type StudentPortalProfilSnapshot = {
  address: string | null;
  birthDate: string | null;
  citizenship: string | null;
  contactEmail: string | null;
  identityNo: string | null;
  passportNo: string | null;
  phone: string | null;
};

type StudentDocumentInput = {
  documentType: string;
  file: File;
  title: string;
};

type UploadedStudentDocument = StudentDocumentInput & UploadedStorageFile;

const initialErrorMessage = "Tələbə yaradıla bilmədi.";
const maxStudentPhotoBytes = 5 * 1024 * 1024;
const maxStudentDocumentBytes = 25 * 1024 * 1024;
const studentPortalEmailDomain = "student.campus.global";
const allowedStudentPhotoTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const allowedStudentDocumentTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
]);

export async function generateStudentPortalCredentialsAction(input: {
  firstName?: string;
  lastName?: string;
}) {
  await requirePermission("students:create");

  const baseLocalPart = buildStudentEmailLocalPart(
    input.firstName,
    input.lastName,
  );
  const email = await findAvailableStudentLoginEmail(baseLocalPart);

  return {
    email,
    password: generateTemporaryPassword(),
  };
}

export async function createStudentAction(
  _state: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  if (!process.env.DATABASE_URL?.trim()) {
    return {
      message: "DATABASE_URL qurulmayıb. Tələbə qeydləri saxlanıla bilmir.",
      status: "error",
    };
  }

  const parsed = studentCreateSchema.safeParse({
    address: getString(formData, "address"),
    agentId: getString(formData, "agentId"),
    birthDate: getOptionalDate(formData, "birthDate"),
    citizenship: getString(formData, "citizenship"),
    contactEmail: getString(formData, "contactEmail"),
    fatherName: getString(formData, "fatherName"),
    firstName: getString(formData, "firstName"),
    gender: getString(formData, "gender") || "Male",
    identityNo: getString(formData, "identityNo"),
    intent: getString(formData, "intent") === "draft" ? "draft" : "create",
    lastName: getString(formData, "lastName"),
    loginEmail: getString(formData, "loginEmail"),
    maritalStatus: getString(formData, "maritalStatus") || "Single",
    motherName: getString(formData, "motherName"),
    passportNo: getString(formData, "passportNo"),
    password: getString(formData, "password"),
    phone: getString(formData, "mobilePhone"),
    photoUrl: getString(formData, "photoUrl"),
  });

  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors);
  }

  const file = getFile(formData, "photo");
  const studentDocuments = getStudentDocumentInputs(formData);
  let photoUrl = parsed.data.photoUrl;
  let uploadedPhotoUrl = "";
  const uploadedStudentDocuments: UploadedStudentDocument[] = [];

  for (const document of studentDocuments) {
    const documentValidationMessage = validateStudentDocument(document);

    if (documentValidationMessage) {
      return {
        message: documentValidationMessage,
        status: "error",
      };
    }
  }

  if (file) {
    const photoValidationMessage = validateStudentPhotoFile(file);

    if (photoValidationMessage) {
      return {
        message: photoValidationMessage,
        status: "error",
      };
    }

    try {
      const uploadedPhoto = await uploadStudentPhotoFile({ file });
      photoUrl = uploadedPhoto.fileUrl;
      uploadedPhotoUrl = uploadedPhoto.fileUrl;
    } catch (error) {
      return {
        message:
          error instanceof Error
            ? error.message
            : "Tələbə fotosu yüklənə bilmədi.",
        status: "error",
      };
    }
  }

  if (studentDocuments.length > 0) {
    const uploadId = randomBytes(12).toString("hex");

    try {
      for (const document of studentDocuments) {
        const uploadedFile = await uploadStudentDocumentFile({
          file: document.file,
          uploadId,
        });

        uploadedStudentDocuments.push({
          ...document,
          ...uploadedFile,
        });
      }
    } catch (error) {
      if (uploadedPhotoUrl) {
        await cleanupUploadedStudentPhoto(uploadedPhotoUrl);
      }
      await cleanupUploadedStudentDocuments(uploadedStudentDocuments);

      return {
        message:
          error instanceof Error
            ? error.message
            : "Tələbə sənədləri yüklənə bilmədi.",
        status: "error",
      };
    }
  }

  try {
    const session = await requirePermission("students:create");
    const currentUserId = session.userId;
    const sessionAgentId = getSessionAgentId(session);
    const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`;
    const passwordHash = hashPassword(parsed.data.password);
    const logValue = buildActivityLogValue(parsed.data, photoUrl);

    await prisma.$transaction(
      async (tx) => {
        const selectedAgentId =
          sessionAgentId ?? emptyToNull(parsed.data.agentId);
        const existingUser = await tx.user.findUnique({
          select: { id: true, role: true },
          where: { email: parsed.data.loginEmail },
        });

        if (existingUser && existingUser.role !== "STUDENT") {
          throw new StudentActionError("email-owned-by-staff");
        }

        const portalUser = existingUser
          ? await tx.user.update({
              data: {
                name: fullName,
                status: "ACTIVE",
              },
              select: { id: true },
              where: { id: existingUser.id },
            })
          : await tx.user.create({
              data: {
                email: parsed.data.loginEmail,
                name: fullName,
                role: "STUDENT",
                status: "ACTIVE",
              },
              select: { id: true },
            });

        if (selectedAgentId) {
          const agent = await tx.agent.findUnique({
            select: {
              canRegisterStudents: true,
              portalStatus: true,
              userId: true,
            },
            where: { id: selectedAgentId },
          });

          if (!agent) {
            throw new StudentActionError("agent-not-found");
          }

          if (
            agent.portalStatus === "SUSPENDED" ||
            !agent.canRegisterStudents
          ) {
            throw new StudentActionError("agent-cannot-register");
          }

          if (sessionAgentId && agent.userId !== session.userId) {
            throw new StudentActionError("agent-scope");
          }
        }

        const student = await tx.student.create({
          data: {
            address: emptyToNull(parsed.data.address),
            agent: selectedAgentId
              ? { connect: { id: selectedAgentId } }
              : undefined,
            birthDate: parsed.data.birthDate,
            citizenship: emptyToNull(parsed.data.citizenship),
            contactEmail: emptyToNull(parsed.data.contactEmail),
            createdBy: currentUserId
              ? { connect: { id: currentUserId } }
              : undefined,
            documents:
              uploadedStudentDocuments.length > 0
                ? {
                    create: uploadedStudentDocuments.map((document) => ({
                      documentType: document.documentType,
                      fileName: document.fileName,
                      fileSize: document.fileSize,
                      fileUrl: document.fileUrl,
                      mimeType: document.mimeType,
                      title: document.title,
                      uploadedById: currentUserId,
                    })),
                  }
                : undefined,
            fatherName: emptyToNull(parsed.data.fatherName),
            firstName: parsed.data.firstName,
            gender: parsed.data.gender,
            identityNo: emptyToNull(parsed.data.identityNo),
            lastName: parsed.data.lastName,
            loginEmail: parsed.data.loginEmail,
            maritalStatus: parsed.data.maritalStatus,
            motherName: emptyToNull(parsed.data.motherName),
            passportNo: emptyToNull(parsed.data.passportNo),
            passwordHash,
            phone: emptyToNull(parsed.data.phone),
            photoUrl: emptyToNull(photoUrl),
            portalStatus: parsed.data.intent === "draft" ? "PENDING" : "READY",
            portalUser: { connect: { id: portalUser.id } },
            stage: "Profil",
          },
          select: { agentId: true, id: true },
        });

        if (student.agentId) {
          await tx.agent.update({
            data: {
              registeredStudentsCount: { increment: 1 },
            },
            where: { id: student.agentId },
          });

          await tx.agentNotification.create({
            data: {
              actionHref: "/students",
              agentId: student.agentId,
              entityId: student.id,
              entityType: "STUDENT",
              message: `${fullName} agent hesabına əlavə edildi.`,
              title: "Yeni tələbə yaradıldı",
              type: "STUDENT_CREATED",
            },
          });
        }

        await tx.activityLog.create({
          data: {
            action: "CREATED",
            entityId: student.id,
            entityType: "STUDENT" satisfies RelatedEntityType,
            newValue: {
              ...logValue,
              documentCount: uploadedStudentDocuments.length,
              photoUrl,
            },
            userId: currentUserId,
          },
        });
      },
      {
        maxWait: 15_000,
        timeout: 30_000,
      },
    );
  } catch (error) {
    if (uploadedPhotoUrl) {
      await cleanupUploadedStudentPhoto(uploadedPhotoUrl);
    }
    await cleanupUploadedStudentDocuments(uploadedStudentDocuments);

    return databaseError(error, initialErrorMessage);
  }

  revalidateStudents();
  redirect("/students?success=student-created");
}

export async function updateStudentPortalProfilAction(formData: FormData) {
  if (!process.env.DATABASE_URL?.trim()) {
    redirect("/profile?error=profile");
  }

  const session = await requireSession();
  const studentId = getSessionStudentId(session);

  if (!studentId) {
    redirect("/profile?error=forbidden");
  }

  const birthDate = getNullableDate(formData, "birthDate");

  if (birthDate === undefined) {
    redirect("/profile?error=profile");
  }

  const nextProfil = {
    address: emptyToNull(getString(formData, "address")),
    birthDate,
    citizenship: emptyToNull(getString(formData, "citizenship")),
    contactEmail: emptyToNull(getString(formData, "contactEmail")),
    identityNo: emptyToNull(getString(formData, "identityNo")),
    passportNo: emptyToNull(getString(formData, "passportNo")),
    phone: emptyToNull(getString(formData, "phone")),
  };

  let currentProfil: StudentPortalProfilSnapshot | null = null;

  try {
    const student = await prisma.student.findFirst({
      select: {
        address: true,
        birthDate: true,
        citizenship: true,
        contactEmail: true,
        id: true,
        identityNo: true,
        passportNo: true,
        phone: true,
      },
      where: {
        id: studentId,
        portalStatus: "READY",
        status: "ACTIVE",
        userId: session.userId,
      },
    });

    currentProfil = student ? buildStudentPortalProfilSnapshot(student) : null;
  } catch {
    redirect("/profile?error=profile");
  }

  if (!currentProfil) {
    redirect("/profile?error=forbidden");
  }

  try {
    await prisma.$transaction([
      prisma.student.update({
        data: nextProfil,
        where: { id: studentId },
      }),
      prisma.activityLog.create({
        data: {
          action: "UPDATED",
          entityId: studentId,
          entityType: "STUDENT" satisfies RelatedEntityType,
          newValue: buildStudentPortalProfilSnapshot(nextProfil),
          oldValue: currentProfil,
          userId: session.userId,
        },
      }),
    ]);
  } catch {
    redirect("/profile?error=profile");
  }

  revalidateStudentPortal();
  redirect("/profile?success=profile-updated");
}

export async function updateAgentStudentProfileAction(formData: FormData) {
  const session = await requirePermission("students:update");
  const agentId = getSessionAgentId(session);
  const studentId = getString(formData, "studentId");
  const returnTo = `/applications/students/${encodeURIComponent(studentId)}`;
  if (!agentId || !studentId) redirect("/students?error=forbidden");

  const birthDate = getNullableDate(formData, "birthDate");
  const firstName = getString(formData, "firstName");
  const lastName = getString(formData, "lastName");
  if (birthDate === undefined) {
    redirect(`${returnTo}?error=student-profile-invalid`);
  }

  const parsedProfile = agentStudentProfileSchema.safeParse({
    firstName,
    lastName,
    fatherName: emptyToNull(getString(formData, "fatherName")),
    motherName: emptyToNull(getString(formData, "motherName")),
    birthDate,
    gender: emptyToNull(getString(formData, "gender")),
    maritalStatus: emptyToNull(getString(formData, "maritalStatus")),
    address: emptyToNull(getString(formData, "address")),
    citizenship: emptyToNull(getString(formData, "citizenship")),
    contactEmail: emptyToNull(getString(formData, "contactEmail")),
    identityNo: emptyToNull(getString(formData, "identityNo")),
    passportNo: emptyToNull(getString(formData, "passportNo")),
    phone: emptyToNull(getString(formData, "phone")),
  });
  if (!parsedProfile.success) {
    redirect(`${returnTo}?error=student-profile-invalid`);
  }
  const profile = parsedProfile.data;

  try {
    await prisma.$transaction(async (tx) => {
      const previous = await tx.student.findFirst({
        select: { firstName: true, lastName: true, contactEmail: true, phone: true, userId: true },
        where: { id: studentId, agentId, status: "ACTIVE" },
      });
      if (!previous) throw new StudentActionError("agent-scope");
      const result = await tx.student.updateMany({
        data: profile,
        where: { id: studentId, agentId, status: "ACTIVE" },
      });
      if (result.count !== 1) throw new StudentActionError("agent-scope");
      if (previous.userId && (previous.firstName !== profile.firstName || previous.lastName !== profile.lastName)) {
        await tx.user.update({
          data: { name: `${profile.firstName} ${profile.lastName}` },
          where: { id: previous.userId },
        });
      }
      await tx.activityLog.create({
        data: {
          action: "UPDATED",
          entityId: studentId,
          entityType: "STUDENT" satisfies RelatedEntityType,
          oldValue: previous,
          newValue: { ...profile, birthDate: birthDate?.toISOString() ?? null },
          userId: session.userId,
        },
      });
    });
  } catch (error) {
    if (error instanceof StudentActionError) redirect("/students?error=forbidden");
    redirect(`${returnTo}?error=student-profile-failed`);
  }

  revalidateStudents();
  revalidatePath(returnTo);
  redirect(`${returnTo}?success=student-profile-updated`);
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `scrypt:${salt}:${hash}`;
}

function generateTemporaryPassword() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%";
  const alphabet = `${letters}${digits}${symbols}`;

  return [
    randomFrom(letters),
    randomFrom(digits),
    randomFrom(symbols),
    ...Array.from({ length: 9 }, () => randomFrom(alphabet)),
  ]
    .sort(() => randomBytes(1)[0] - 128)
    .join("");
}

function randomFrom(value: string) {
  return value[randomBytes(1)[0] % value.length] ?? value[0] ?? "";
}

function buildStudentEmailLocalPart(firstName?: string, lastName?: string) {
  const first = slugNamePart(firstName);
  const last = slugNamePart(lastName);
  const localPart = [first, last].filter(Boolean).join(".");

  return localPart || "telebe";
}

function slugNamePart(value?: string) {
  return (value ?? "")
    .trim()
    .toLocaleLowerCase("az")
    .replace(/ə/g, "e")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ğ/g, "g")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .replace(/\.+/g, ".")
    .slice(0, 48);
}

async function findAvailableStudentLoginEmail(baseLocalPart: string) {
  for (let index = 0; index < 100; index += 1) {
    const suffix = index === 0 ? "" : String(index + 1);
    const email = `${baseLocalPart}${suffix}@${studentPortalEmailDomain}`;
    const [user, student] = await Promise.all([
      prisma.user.findFirst({
        select: { id: true },
        where: { email: { equals: email, mode: "insensitive" } },
      }),
      prisma.student.findFirst({
        select: { id: true },
        where: { loginEmail: { equals: email, mode: "insensitive" } },
      }),
    ]);

    if (!user && !student) {
      return email;
    }
  }

  return `${baseLocalPart}.${randomBytes(3).toString("hex")}@${studentPortalEmailDomain}`;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  return trimmed === "__none__" || trimmed === "__empty" ? "" : trimmed;
}

function getOptionalDate(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || undefined;
}

function getNullableDate(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function getFile(formData: FormData, key: string) {
  const value = formData.get(key);

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

function getStudentDocumentInputs(formData: FormData): StudentDocumentInput[] {
  return formData
    .getAll("studentDocumentKeys")
    .flatMap((value) => {
      if (typeof value !== "string" || !/^[a-zA-Z0-9_-]+$/.test(value)) {
        return [];
      }

      const file = getFile(formData, `studentDocumentFile:${value}`);

      if (!file) {
        return [];
      }

      const title =
        getString(formData, `studentDocumentTitle:${value}`) ||
        stripFileExtension(file.name);
      const documentType =
        getString(formData, `studentDocumentType:${value}`) || "Digər";

      return [{ documentType, file, title }];
    });
}

function validateStudentPhotoFile(file: File) {
  if (!allowedStudentPhotoTypes.has(file.type)) {
    return "Tələbə fotosu JPG, PNG və ya WebP formatında olmalıdır.";
  }

  if (file.size > maxStudentPhotoBytes) {
    return "Tələbə fotosu 5 MB və ya daha kiçik olmalıdır.";
  }

  return "";
}

function validateStudentDocument(document: StudentDocumentInput) {
  if (!document.title || document.title.length > 120) {
    return "Sənəd adı 1–120 simvol arasında olmalıdır.";
  }

  const mimeType =
    document.file.type || inferStudentDocumentMimeType(document.file.name);

  if (!allowedStudentDocumentTypes.has(mimeType)) {
    return `${document.file.name} dəstəklənməyən formatdadır. PDF, Word, Excel, şəkil və ya TXT faylı seçin.`;
  }

  if (document.file.size > maxStudentDocumentBytes) {
    return `${document.file.name} 25 MB və ya daha kiçik olmalıdır.`;
  }

  return "";
}

function inferStudentDocumentMimeType(fileName: string) {
  const extension = fileName.toLowerCase().split(".").pop() ?? "";
  const mimeTypes: Record<string, string> = {
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    pdf: "application/pdf",
    png: "image/png",
    txt: "text/plain",
    webp: "image/webp",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };

  return mimeTypes[extension] ?? "";
}

async function cleanupUploadedStudentPhoto(fileUrl: string) {
  try {
    await deleteStorageFile(fileUrl);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `Uploaded student photo cleanup failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

async function cleanupUploadedStudentDocuments(
  documents: UploadedStudentDocument[],
) {
  await Promise.all(
    documents.map(async (document) => {
      try {
        await deleteStorageFile(document.fileUrl);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `Uploaded student document cleanup failed: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    }),
  );
}

function stripFileExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").trim() || "Sənəd";
}

function emptyToNull(value?: string | null) {
  return value && value.length > 0 ? value : null;
}

function validationError(fieldErrors: Record<string, string[] | undefined>) {
  return {
    fieldErrors: Object.fromEntries(
      Object.entries(fieldErrors).filter(
        ([, value]) => value && value.length > 0,
      ),
    ) as Record<string, string[]>,
    message: "Zəhmət olmasa işarələnmiş sahələri yoxlayın.",
    status: "error" as const,
  };
}

function buildActivityLogValue(
  values: StudentCreateInput,
  photoUrl?: string,
) {
  return Object.fromEntries(
    Object.entries({ ...values, photoUrl }).flatMap(([key, value]) => {
      if (key === "password" || value === undefined) {
        return [];
      }

      if (value instanceof Date) {
        return [[key, value.toISOString()]];
      }

      return [[key, value]];
    }),
  );
}

function buildStudentPortalProfilSnapshot(
  values: StudentPortalProfilInput,
): StudentPortalProfilSnapshot {
  return {
    address: values.address ?? null,
    birthDate: values.birthDate ? values.birthDate.toISOString() : null,
    citizenship: values.citizenship ?? null,
    contactEmail: values.contactEmail ?? null,
    identityNo: values.identityNo ?? null,
    passportNo: values.passportNo ?? null,
    phone: values.phone ?? null,
  };
}

function databaseError(
  error: unknown,
  fallbackMessage: string,
): StudentActionState {
  if (error instanceof StudentActionError) {
    if (error.message === "agent-not-found") {
      return {
        message: "Seçilmiş agent tapılmadı.",
        status: "error",
      };
    }

    if (error.message === "agent-cannot-register") {
      return {
        message: "Seçilmiş agent hazırda tələbə qeydiyyatı edə bilmir.",
        status: "error",
      };
    }

    if (error.message === "agent-scope") {
      return {
        message: "Agentlər yalnız öz hesabları üçün tələbə qeydiyyatı edə bilər.",
        status: "error",
      };
    }

    return {
      message: "Bu giriş e-poçtu artıq əməkdaş hesabında istifadə olunur.",
      status: "error",
    };
  }

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";

  if (code === "P2002") {
    return {
      message:
        "Bu e-poçt, pasport nömrəsi və ya şəxsiyyət nömrəsi artıq başqa tələbədə istifadə olunub.",
      status: "error",
    };
  }

  if (process.env.NODE_ENV === "development") {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn(
      `Student create failed: ${detail}`,
    );

    return {
      message: `${fallbackMessage} ${detail}`,
      status: "error",
    };
  }

  return {
    message: fallbackMessage,
    status: "error",
  };
}

function revalidateStudents() {
  revalidatePath("/students");
  revalidatePath("/az/students");
  revalidatePath("/students/new");
  revalidatePath("/az/students/new");
  revalidatePath("/dashboard");
  revalidatePath("/az/dashboard");
  revalidatePath("/updates");
  revalidatePath("/az/updates");
}

function revalidateStudentPortal() {
  revalidatePath("/applications");
  revalidatePath("/az/applications");
}

class StudentActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StudentActionError";
  }
}
