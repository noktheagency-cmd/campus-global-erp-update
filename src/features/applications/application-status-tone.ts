import type { ApplicationStatus } from "@/features/applications/types";

export type ApplicationStatusTone = "amber" | "green" | "red" | "slate";

export function getApplicationStatusTone(
  status: ApplicationStatus | string,
): ApplicationStatusTone {
  if (status === "ACCEPTED" || status === "OFFER" || status === "ENROLLED") {
    return "green";
  }

  if (status === "REJECTED" || status === "INVALID_DOCUMENTS") {
    return "red";
  }

  if (status === "ARCHIVED") {
    return "slate";
  }

  return "amber";
}

export function getApplicationStatusSurface(
  status: ApplicationStatus | string,
) {
  const tone = getApplicationStatusTone(status);

  if (tone === "green") {
    return "border-emerald-200/80 border-l-emerald-400 bg-emerald-50/60 hover:bg-emerald-50/90";
  }

  if (tone === "red") {
    return "border-red-200/80 border-l-red-400 bg-red-50/60 hover:bg-red-50/90";
  }

  if (tone === "amber") {
    return "border-amber-200/80 border-l-amber-400 bg-amber-50/60 hover:bg-amber-50/90";
  }

  return "border-slate-200 border-l-slate-300 bg-slate-50/60 hover:bg-slate-50";
}

export function getApplicationStatusHeaderSurface(
  status: ApplicationStatus | string,
) {
  const tone = getApplicationStatusTone(status);

  if (tone === "green") {
    return "border-emerald-200/80 bg-emerald-50/70";
  }

  if (tone === "red") {
    return "border-red-200/80 bg-red-50/70";
  }

  if (tone === "amber") {
    return "border-amber-200/80 bg-amber-50/70";
  }

  return "border-slate-200 bg-slate-50/70";
}
