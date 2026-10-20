import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { defaultLocale, locales } from "@/i18n/routing";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { can, roles, type Permission, type Role } from "@/lib/auth/permissions";

export type PortalType = "staff" | "agent" | "student";

export type AuthSession = {
  email: string;
  expiresAt: number;
  issuedAt: number;
  portalType: PortalType;
  role: Role;
  subjectId?: string;
  userId: string;
};

type NewSession = Omit<AuthSession, "expiresAt" | "issuedAt">;

const sessionVersion = 1;
const sessionMaxAgeSeconds = 60 * 60 * 8;
const rememberedSessionMaxAgeSeconds = 60 * 60 * 24 * 30;
const sessionActivityTtlMs = 60_000;
const sessionActivityCache = new Map<
  string,
  { active: boolean; expiresAt: number }
>();

export async function startSession(input: NewSession, remember: boolean) {
  const maxAge = remember
    ? rememberedSessionMaxAgeSeconds
    : sessionMaxAgeSeconds;
  const now = Date.now();
  const session: AuthSession & { version: number } = {
    ...input,
    email: input.email.toLowerCase(),
    expiresAt: now + maxAge * 1000,
    issuedAt: now,
    version: sessionVersion,
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, signSession(session), {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  primeSessionActivityCache(session, true);
}

export const getCurrentSession = cache(async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return readSessionToken(token);
});

export async function requireSession(options: { locale?: string } = {}) {
  const session = await getCurrentSession();

  if (!session) {
    redirect(getLoginPath(options.locale));
  }

  const activity = await getSessionActivity(session);

  if (!activity.active) {
    redirect(getLoginPath(options.locale));
  }

  return session;
}

export async function requirePermission(
  permission: Permission,
  options: { locale?: string } = {},
) {
  const session = await requireSession(options);

  if (!can(session.role, permission)) {
    redirect(getDefaultWorkspacePath(session.role, options.locale));
  }

  return session;
}

export function isAgentSession(session: AuthSession): session is AuthSession & {
  portalType: "agent";
  role: "AGENT";
  subjectId: string;
} {
  return (
    session.portalType === "agent" &&
    session.role === "AGENT" &&
    Boolean(session.subjectId)
  );
}

export function getSessionAgentId(session: AuthSession) {
  return isAgentSession(session) ? session.subjectId : null;
}

export function isStudentSession(
  session: AuthSession,
): session is AuthSession & {
  portalType: "student";
  role: "STUDENT";
  subjectId: string;
} {
  return (
    session.portalType === "student" &&
    session.role === "STUDENT" &&
    Boolean(session.subjectId)
  );
}

export function getSessionStudentId(session: AuthSession) {
  return isStudentSession(session) ? session.subjectId : null;
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? readSessionToken(token) : null;

  if (session) {
    sessionActivityCache.delete(getSessionActivityCacheKey(session));
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function getLoginPath(locale = defaultLocale) {
  const normalizedLocale = normalizeLocale(locale);

  return normalizedLocale === defaultLocale
    ? "/login"
    : `/${normalizedLocale}/login`;
}

export function getDefaultWorkspacePath(role: Role, locale = defaultLocale) {
  const normalizedLocale = normalizeLocale(locale);
  const prefix =
    normalizedLocale === defaultLocale ? "" : `/${normalizedLocale}`;

  if (role === "AGENT") {
    return `${prefix}/dashboard`;
  }

  if (role === "STUDENT") {
    return `${prefix}/dashboard`;
  }

  if (role === "UNIVERSITY_REPRESENTATIVE") {
    return `${prefix}/universities`;
  }

  return `${prefix}/dashboard`;
}

function signSession(session: AuthSession & { version: number }) {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString(
    "base64url",
  );
  const signature = createSignature(payload);

  return `${payload}.${signature}`;
}

function readSessionToken(token: string): AuthSession | null {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  if (!constantTimeEqual(signature, createSignature(payload))) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<AuthSession> & { version?: number };

    if (!isSessionPayload(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function isSessionPayload(
  value: Partial<AuthSession> & { version?: number },
): value is AuthSession & { version: number } {
  return (
    value.version === sessionVersion &&
    typeof value.userId === "string" &&
    value.userId.length > 0 &&
    typeof value.email === "string" &&
    value.email.length > 0 &&
    isRole(value.role) &&
    isPortalType(value.portalType) &&
    typeof value.issuedAt === "number" &&
    typeof value.expiresAt === "number" &&
    value.expiresAt > Date.now() &&
    (value.subjectId === undefined || typeof value.subjectId === "string")
  );
}

const getSessionActivity = cache(async function getSessionActivity(
  session: AuthSession,
) {
  const cacheKey = getSessionActivityCacheKey(session);
  const cached = sessionActivityCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return {
      active: cached.active,
      source: "cache" as const,
    };
  }

  if (cached) {
    sessionActivityCache.delete(cacheKey);
  }

  const startedAt = Date.now();

  try {
    const active = await querySessionActivity(session);
    primeSessionActivityCache(session, active);

    return {
      active,
      source: "database" as const,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    if (process.env.NODE_ENV === "development") {
      console.warn(
        `Session validation unavailable after ${durationMs}ms: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } else {
      console.error("Session activity validation unavailable", {
        code: "SESSION_ACTIVITY_UNAVAILABLE",
        durationMs,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    }

    return {
      active: process.env.NODE_ENV !== "production",
      source: "unavailable" as const,
    };
  }
});

async function querySessionActivity(session: AuthSession) {
  const { prisma } = await import("@/lib/db");
  const user = await prisma.user.findUnique({
    select: {
      email: true,
      role: true,
      status: true,
    },
    where: { id: session.userId },
  });

  if (
    !user ||
    user.status !== "ACTIVE" ||
    user.role !== session.role ||
    user.email.toLowerCase() !== session.email.toLowerCase()
  ) {
    return false;
  }

  if (session.portalType === "agent") {
    const agent = await prisma.agent.findFirst({
      select: { id: true },
      where: {
        id: session.subjectId,
        portalStatus: "READY",
        userId: session.userId,
      },
    });

    return Boolean(agent);
  }

  if (session.portalType === "student") {
    const student = await prisma.student.findFirst({
      select: { id: true },
      where: {
        id: session.subjectId,
        portalStatus: "READY",
        status: "ACTIVE",
        userId: session.userId,
      },
    });

    return Boolean(student);
  }

  return true;
}

function primeSessionActivityCache(session: AuthSession, active: boolean) {
  sessionActivityCache.set(getSessionActivityCacheKey(session), {
    active,
    expiresAt: Date.now() + sessionActivityTtlMs,
  });
}

function getSessionActivityCacheKey(session: AuthSession) {
  return [
    session.userId,
    session.email.toLowerCase(),
    session.role,
    session.portalType,
    session.subjectId ?? "",
  ].join(":");
}

function createSignature(payload: string) {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

function getSessionSecret() {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.CAMPUS_GLOBAL_AUTH_SECRET;

  if (secret?.trim()) {
    return secret.trim();
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET, SESSION_SECRET or CAMPUS_GLOBAL_AUTH_SECRET is required.",
    );
  }

  const fallbackSecret =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.DATABASE_URL;

  if (fallbackSecret?.trim()) {
    return `campus-global-session:${fallbackSecret.trim()}`;
  }

  return "campus-global-local-development-session-secret";
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function isRole(value: unknown): value is Role {
  return roles.includes(value as Role);
}

function isPortalType(value: unknown): value is PortalType {
  return value === "staff" || value === "agent" || value === "student";
}

function normalizeLocale(locale: string) {
  return locales.includes(locale as (typeof locales)[number])
    ? locale
    : defaultLocale;
}
