import { createClient } from "@supabase/supabase-js";

export const UNIVERSITY_DOCUMENTS_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ?? "university-documents";
export const APPLICATION_DOCUMENTS_BUCKET =
  process.env.SUPABASE_APPLICATION_DOCUMENTS_BUCKET ?? "application-documents";
export const STUDENT_PHOTOS_BUCKET =
  process.env.SUPABASE_STUDENT_PHOTOS_BUCKET ?? "student-photos";
export const STUDENT_DOCUMENTS_BUCKET =
  process.env.SUPABASE_STUDENT_DOCUMENTS_BUCKET ?? "student-documents";
export const SUPPORT_ATTACHMENTS_BUCKET =
  process.env.SUPABASE_SUPPORT_ATTACHMENTS_BUCKET ?? "support-attachments";
export const COMMISSION_DOCUMENTS_BUCKET =
  process.env.SUPABASE_COMMISSION_DOCUMENTS_BUCKET ?? "commission-documents";

const STORAGE_URL_PREFIX = "storage://";

export type UploadedStorageFile = {
  fileName: string;
  fileSize: number;
  fileUrl: string;
  mimeType: string;
  path: string;
};

export async function uploadUniversityDocumentFile({
  file,
  universityId,
}: {
  file: File;
  universityId: string;
}): Promise<UploadedStorageFile> {
  const path = buildUniversityDocumentPath(universityId, file.name);
  const mimeType = file.type || inferDocumentMimeType(file.name);
  const supabase = createStorageClient();

  const { error } = await supabase.storage
    .from(UNIVERSITY_DOCUMENTS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    fileUrl: toStorageUrl(UNIVERSITY_DOCUMENTS_BUCKET, path),
    mimeType,
    path,
  };
}

export async function uploadUniversityLogoFile({
  file,
}: {
  file: File;
}): Promise<UploadedStorageFile> {
  const path = buildUniversityLogoPath(file.name);
  const mimeType = file.type || "application/octet-stream";
  const supabase = createStorageClient();

  const { error } = await supabase.storage
    .from(UNIVERSITY_DOCUMENTS_BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    fileUrl: toStorageUrl(UNIVERSITY_DOCUMENTS_BUCKET, path),
    mimeType,
    path,
  };
}

export async function uploadCampusImageFile({
  file,
  universityId,
}: {
  file: File;
  universityId: string;
}): Promise<UploadedStorageFile> {
  const path = buildCampusImagePath(universityId, file.name);
  const mimeType = file.type || "application/octet-stream";
  const supabase = createStorageClient();

  const { error } = await supabase.storage
    .from(UNIVERSITY_DOCUMENTS_BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    fileUrl: toStorageUrl(UNIVERSITY_DOCUMENTS_BUCKET, path),
    mimeType,
    path,
  };
}

export async function uploadAgentLogoFile({
  file,
}: {
  file: File;
}): Promise<UploadedStorageFile> {
  const path = buildAgentLogoPath(file.name);
  const mimeType = file.type || "application/octet-stream";
  const supabase = createStorageClient();

  const { error } = await supabase.storage
    .from(UNIVERSITY_DOCUMENTS_BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    fileUrl: toStorageUrl(UNIVERSITY_DOCUMENTS_BUCKET, path),
    mimeType,
    path,
  };
}

export async function uploadStudentPhotoFile({
  file,
}: {
  file: File;
}): Promise<UploadedStorageFile> {
  const path = buildStudentPhotoPath(file.name);
  const mimeType = file.type || "application/octet-stream";
  const supabase = createStorageClient();

  const { error } = await supabase.storage
    .from(STUDENT_PHOTOS_BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    fileUrl: toStorageUrl(STUDENT_PHOTOS_BUCKET, path),
    mimeType,
    path,
  };
}

export async function uploadStudentDocumentFile({
  file,
  uploadId,
}: {
  file: File;
  uploadId: string;
}): Promise<UploadedStorageFile> {
  const path = buildStudentDocumentPath(uploadId, file.name);
  const mimeType = file.type || inferDocumentMimeType(file.name);
  const supabase = createStorageClient({ requireServiceRole: true });

  const { error } = await supabase.storage
    .from(STUDENT_DOCUMENTS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    fileUrl: toStorageUrl(STUDENT_DOCUMENTS_BUCKET, path),
    mimeType,
    path,
  };
}

export async function uploadApplicationDocumentFile({
  applicationId,
  documentKey,
  file,
}: {
  applicationId: string;
  documentKey: string;
  file: File;
}): Promise<UploadedStorageFile> {
  const path = buildApplicationDocumentPath(
    applicationId,
    documentKey,
    file.name,
  );
  const mimeType = file.type || "application/octet-stream";
  const supabase = createStorageClient({ requireServiceRole: true });

  const { error } = await supabase.storage
    .from(APPLICATION_DOCUMENTS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    fileUrl: toStorageUrl(APPLICATION_DOCUMENTS_BUCKET, path),
    mimeType,
    path,
  };
}

export async function uploadSupportTicketAttachmentFile({
  file,
  messageId,
  ticketId,
}: {
  file: File;
  messageId: string;
  ticketId: string;
}): Promise<UploadedStorageFile> {
  const path = buildSupportTicketAttachmentPath(ticketId, messageId, file.name);
  const mimeType = file.type || inferDocumentMimeType(file.name);
  const supabase = createStorageClient({ requireServiceRole: true });

  const { error } = await supabase.storage
    .from(SUPPORT_ATTACHMENTS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    fileUrl: toStorageUrl(SUPPORT_ATTACHMENTS_BUCKET, path),
    mimeType,
    path,
  };
}

export async function uploadCommissionAgreementFile({
  agreementCode,
  file,
}: {
  agreementCode: string;
  file: File;
}): Promise<UploadedStorageFile> {
  const path = buildCommissionAgreementPath(agreementCode, file.name);
  const mimeType = file.type || inferDocumentMimeType(file.name);
  const supabase = createStorageClient({ requireServiceRole: true });

  const { error } = await supabase.storage
    .from(COMMISSION_DOCUMENTS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    fileUrl: toStorageUrl(COMMISSION_DOCUMENTS_BUCKET, path),
    mimeType,
    path,
  };
}

export async function uploadCommissionPaymentEvidenceFile({
  applicationChoiceId,
  file,
}: {
  applicationChoiceId: string;
  file: File;
}): Promise<UploadedStorageFile> {
  const path = buildCommissionPaymentPath(applicationChoiceId, file.name);
  const mimeType = file.type || inferDocumentMimeType(file.name);
  const supabase = createStorageClient({ requireServiceRole: true });

  const { error } = await supabase.storage
    .from(COMMISSION_DOCUMENTS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    fileUrl: toStorageUrl(COMMISSION_DOCUMENTS_BUCKET, path),
    mimeType,
    path,
  };
}

export async function createDocumentAccessUrl(
  fileUrl: string,
  options: { download?: boolean | string } = {},
) {
  const storageRef = parseStorageUrl(fileUrl);

  if (!storageRef) {
    return fileUrl;
  }

  const requiresServiceRole =
    storageRef.bucket === APPLICATION_DOCUMENTS_BUCKET ||
    storageRef.bucket === STUDENT_DOCUMENTS_BUCKET ||
    storageRef.bucket === SUPPORT_ATTACHMENTS_BUCKET ||
    storageRef.bucket === COMMISSION_DOCUMENTS_BUCKET;

  if (
    !hasStorageCredentials() ||
    (requiresServiceRole && !hasServerStorageCredentials())
  ) {
    return null;
  }

  const supabase = createStorageClient({
    requireServiceRole: requiresServiceRole,
  });
  const { data, error } = await supabase.storage
    .from(storageRef.bucket)
    .createSignedUrl(storageRef.path, 60 * 60, options);

  if (error) {
    return null;
  }

  return data.signedUrl;
}

export async function createDocumentAccessUrls(fileUrls: string[]) {
  const accessUrls = new Map<string, string>();
  const grouped = new Map<string, Array<{ fileUrl: string; path: string }>>();

  for (const fileUrl of [...new Set(fileUrls.filter(Boolean))]) {
    const storageRef = parseStorageUrl(fileUrl);

    if (!storageRef) {
      accessUrls.set(fileUrl, fileUrl);
      continue;
    }

    const bucketFiles = grouped.get(storageRef.bucket) ?? [];
    bucketFiles.push({ fileUrl, path: storageRef.path });
    grouped.set(storageRef.bucket, bucketFiles);
  }

  for (const [bucket, files] of grouped) {
    const requiresServiceRole =
      bucket === APPLICATION_DOCUMENTS_BUCKET ||
      bucket === STUDENT_DOCUMENTS_BUCKET ||
      bucket === SUPPORT_ATTACHMENTS_BUCKET ||
      bucket === COMMISSION_DOCUMENTS_BUCKET;

    if (
      !hasStorageCredentials() ||
      (requiresServiceRole && !hasServerStorageCredentials())
    ) {
      continue;
    }

    const supabase = createStorageClient({
      requireServiceRole: requiresServiceRole,
    });
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrls(
        files.map((file) => file.path),
        60 * 60,
      );

    if (error) {
      continue;
    }

    data.forEach((signedFile, index) => {
      const source = files[index];

      if (source && signedFile.signedUrl) {
        accessUrls.set(source.fileUrl, signedFile.signedUrl);
      }
    });
  }

  return accessUrls;
}

export async function deleteStorageFile(fileUrl: string) {
  const storageRef = parseStorageUrl(fileUrl);

  if (!storageRef) {
    return;
  }

  const requiresServiceRole =
    storageRef.bucket === APPLICATION_DOCUMENTS_BUCKET ||
    storageRef.bucket === STUDENT_DOCUMENTS_BUCKET ||
    storageRef.bucket === SUPPORT_ATTACHMENTS_BUCKET ||
    storageRef.bucket === COMMISSION_DOCUMENTS_BUCKET;
  const supabase = createStorageClient({
    requireServiceRole: requiresServiceRole,
  });
  const { error } = await supabase.storage
    .from(storageRef.bucket)
    .remove([storageRef.path]);

  if (error) {
    throw new Error(error.message);
  }
}

export function isStorageUrl(fileUrl: string) {
  return Boolean(parseStorageUrl(fileUrl));
}

function createStorageClient({
  requireServiceRole = false,
}: {
  requireServiceRole?: boolean;
} = {}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseKey =
    serviceRoleKey ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey || (requireServiceRole && !serviceRoleKey)) {
    throw new Error("Supabase Storage environment variables are missing.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function hasStorageCredentials() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  );
}

function hasServerStorageCredentials() {
  return Boolean(
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function buildUniversityDocumentPath(universityId: string, fileName: string) {
  const safeName = sanitizeFileName(fileName);
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);

  return `universities/${sanitizePathSegment(universityId)}/${timestamp}-${suffix}-${safeName}`;
}

function buildUniversityLogoPath(fileName: string) {
  const safeName = sanitizeFileName(fileName);
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);

  return `university-logos/${timestamp}-${suffix}-${safeName}`;
}

function buildCampusImagePath(universityId: string, fileName: string) {
  const safeName = sanitizeFileName(fileName);
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);

  return `campus-images/${sanitizePathSegment(universityId)}/${timestamp}-${suffix}-${safeName}`;
}

function buildAgentLogoPath(fileName: string) {
  const safeName = sanitizeFileName(fileName);
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);

  return `agent-logos/${timestamp}-${suffix}-${safeName}`;
}

function buildStudentPhotoPath(fileName: string) {
  const safeName = sanitizeFileName(fileName);
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);

  return `student-photos/${timestamp}-${suffix}-${safeName}`;
}

function buildStudentDocumentPath(uploadId: string, fileName: string) {
  const safeName = sanitizeFileName(fileName);
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);

  return `students/${sanitizePathSegment(uploadId)}/${timestamp}-${suffix}-${safeName}`;
}

function buildApplicationDocumentPath(
  applicationId: string,
  documentKey: string,
  fileName: string,
) {
  const safeName = sanitizeFileName(fileName);
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);

  return `applications/${sanitizePathSegment(applicationId)}/${sanitizePathSegment(
    documentKey,
  )}/${timestamp}-${suffix}-${safeName}`;
}

function buildSupportTicketAttachmentPath(
  ticketId: string,
  messageId: string,
  fileName: string,
) {
  const safeName = sanitizeFileName(fileName);
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);

  return `tickets/${sanitizePathSegment(ticketId)}/${sanitizePathSegment(
    messageId,
  )}/${timestamp}-${suffix}-${safeName}`;
}

function buildCommissionAgreementPath(agreementCode: string, fileName: string) {
  const safeName = sanitizeFileName(fileName);
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);

  return `agreements/${sanitizePathSegment(agreementCode)}/${timestamp}-${suffix}-${safeName}`;
}

function buildCommissionPaymentPath(
  applicationChoiceId: string,
  fileName: string,
) {
  const safeName = sanitizeFileName(fileName);
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);

  return `payments/${sanitizePathSegment(applicationChoiceId)}/${timestamp}-${suffix}-${safeName}`;
}

function sanitizeFileName(value: string) {
  const fallback = "document";
  const normalized = value
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

  return normalized || fallback;
}

function inferDocumentMimeType(fileName: string) {
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

  return mimeTypes[extension] ?? "application/octet-stream";
}

function sanitizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function toStorageUrl(bucket: string, path: string) {
  return `${STORAGE_URL_PREFIX}${bucket}/${path}`;
}

function parseStorageUrl(fileUrl: string) {
  if (!fileUrl.startsWith(STORAGE_URL_PREFIX)) {
    return null;
  }

  const value = fileUrl.slice(STORAGE_URL_PREFIX.length);
  const separatorIndex = value.indexOf("/");

  if (separatorIndex === -1) {
    return null;
  }

  return {
    bucket: value.slice(0, separatorIndex),
    path: value.slice(separatorIndex + 1),
  };
}
