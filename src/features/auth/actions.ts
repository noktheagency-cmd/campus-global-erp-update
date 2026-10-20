"use server";

import { redirect } from "next/navigation";

import { defaultLocale, locales } from "@/i18n/routing";
import { verifyPassword } from "@/lib/auth/password";
import { clearSession, startSession, type PortalType } from "@/lib/auth/session";
import type { Role } from "@/lib/auth/permissions";

export type LoginActionState = {
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
  message?: string;
  status: "idle" | "error";
};

export async function logoutAction(formData: FormData) {
  const locale = normalizeLocale(getString(formData, "locale"));
  await clearSession();
  redirect(locale === defaultLocale ? "/login" : `/${locale}/login`);
}

type LoginIdentity = {
  email: string;
  portalType: PortalType;
  role: Role;
  subjectId?: string;
  userId: string;
};

export async function loginAction(
  _state: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  const locale = normalizeLocale(getString(formData, "locale"));
  const remember = formData.get("remember") === "on";

  if (!email || !password) {
    return {
      fieldErrors: {
        email: !email ? ["E-poçt daxil edin."] : undefined,
        password: !password ? ["Şifrə daxil edin."] : undefined,
      },
      message: "E-poçt və şifrə tələb olunur.",
      status: "error",
    };
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return {
      message: "DATABASE_URL qurulmayıb. Giriş yoxlanıla bilmir.",
      status: "error",
    };
  }

  const identity = await authenticate(email, password);

  if (!identity) {
    return {
      message: "E-poçt və ya şifrə yanlışdır.",
      status: "error",
    };
  }

  await startSession(
    {
      email: identity.email,
      portalType: identity.portalType,
      role: identity.role,
      subjectId: identity.subjectId,
      userId: identity.userId,
    },
    remember,
  );

  redirect(getRedirectPath(identity, locale, getString(formData, "next")));
}

async function authenticate(
  email: string,
  password: string,
): Promise<LoginIdentity | null> {
  const { prisma } = await import("@/lib/db");

  const staffUser = await prisma.user.findUnique({
    select: {
      email: true,
      id: true,
      passwordHash: true,
      role: true,
      status: true,
    },
    where: { email },
  });

  if (
    staffUser &&
    staffUser.status === "ACTIVE" &&
    staffUser.role !== "AGENT" &&
    staffUser.role !== "STUDENT"
  ) {
    const sharedStaffPasswordHash =
      process.env.CAMPUS_GLOBAL_STAFF_PASSWORD_HASH;

    if (
      verifyPassword(password, staffUser.passwordHash) ||
      verifyPassword(password, sharedStaffPasswordHash)
    ) {
      return {
        email: staffUser.email,
        portalType: "staff",
        role: staffUser.role,
        userId: staffUser.id,
      };
    }

    return null;
  }

  const [agent, student] = await Promise.all([
    prisma.agent.findUnique({
      select: {
        email: true,
        id: true,
        passwordHash: true,
        portalStatus: true,
        portalUser: {
          select: {
            id: true,
            role: true,
            status: true,
          },
        },
      },
      where: { email },
    }),
    prisma.student.findUnique({
      select: {
        id: true,
        loginEmail: true,
        passwordHash: true,
        portalStatus: true,
        portalUser: {
          select: {
            id: true,
            role: true,
            status: true,
          },
        },
        status: true,
      },
      where: { loginEmail: email },
    }),
  ]);

  if (
    agent?.portalStatus === "READY" &&
    agent.portalUser?.status === "ACTIVE" &&
    agent.portalUser.role === "AGENT" &&
    verifyPassword(password, agent.passwordHash)
  ) {
    return {
      email: agent.email,
      portalType: "agent",
      role: "AGENT",
      subjectId: agent.id,
      userId: agent.portalUser.id,
    };
  }

  if (
    student?.loginEmail &&
    student.portalStatus === "READY" &&
    student.status === "ACTIVE" &&
    student.portalUser?.status === "ACTIVE" &&
    student.portalUser.role === "STUDENT" &&
    verifyPassword(password, student.passwordHash)
  ) {
    return {
      email: student.loginEmail,
      portalType: "student",
      role: "STUDENT",
      subjectId: student.id,
      userId: student.portalUser.id,
    };
  }

  return null;
}

function getRedirectPath(
  identity: LoginIdentity,
  locale: string,
  nextPath: string,
) {
  const safeNextPath = sanitizeNextPath(nextPath);

  if (safeNextPath && canRedirectTo(identity.role, safeNextPath)) {
    return safeNextPath;
  }

  const prefix = locale === defaultLocale ? "" : `/${locale}`;

  if (identity.role === "AGENT") {
    return `${prefix}/dashboard`;
  }

  if (identity.role === "STUDENT") {
    return `${prefix}/dashboard`;
  }

  if (identity.role === "UNIVERSITY_REPRESENTATIVE") {
    return `${prefix}/universities`;
  }

  return `${prefix}/dashboard`;
}

function canRedirectTo(role: Role, path: string) {
  const workspace = getWorkspaceSegment(path);

  if (!workspace) {
    return false;
  }

  if (role === "AGENT") {
    return (
      workspace === "dashboard" ||
      workspace === "students" ||
      workspace === "applications" ||
      workspace === "universities" ||
      workspace === "commissions" ||
      workspace === "services" ||
      workspace === "updates" ||
      workspace === "profile"
    );
  }

  if (role === "STUDENT") {
    return (
      workspace === "dashboard" ||
      workspace === "applications" ||
      workspace === "documents" ||
      workspace === "profile" ||
      workspace === "services" ||
      workspace === "updates" ||
      workspace === "universities"
    );
  }

  if (role === "UNIVERSITY_REPRESENTATIVE") {
    return workspace === "universities";
  }

  return true;
}

function getWorkspaceSegment(path: string) {
  const [pathname] = path.split("?");
  const parts = pathname.split("/").filter(Boolean);
  const first = parts[0];

  if (locales.includes(first as (typeof locales)[number])) {
    return parts[1];
  }

  return first;
}

function sanitizeNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "";
  }

  try {
    const url = new URL(value, "https://campus.local");

    if (
      url.origin !== "https://campus.local" ||
      url.pathname.startsWith("/api") ||
      url.pathname.startsWith("/_next")
    ) {
      return "";
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return "";
  }
}

function normalizeLocale(locale: string) {
  return locales.includes(locale as (typeof locales)[number])
    ? locale
    : defaultLocale;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}
