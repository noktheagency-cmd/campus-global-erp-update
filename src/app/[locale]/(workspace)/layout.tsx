import { AppShell } from "@/components/app/app-shell";
import type { AppLocale } from "@/i18n/routing";
import type { AuthSession } from "@/lib/auth/session";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createDocumentAccessUrl } from "@/lib/supabase/storage";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const session = await requireSession({ locale });
  const shellSession = await buildAppShellSession(session);

  return (
    <AppShell locale={locale as AppLocale} session={shellSession}>
      {children}
    </AppShell>
  );
}

async function buildAppShellSession(session: AuthSession) {
  if (!session.subjectId) {
    return session;
  }

  try {
    if (session.portalType === "agent") {
      const [agent, unreadNotifications] = await Promise.all([
        prisma.agent.findFirst({
          select: { logoUrl: true },
          where: {
            id: session.subjectId,
            portalStatus: "READY",
            userId: session.userId,
          },
        }),
        prisma.agentNotification.count({
          where: {
            agentId: session.subjectId,
            readAt: null,
          },
        }),
      ]);
      const imageUrl = agent?.logoUrl
        ? await createDocumentAccessUrl(agent.logoUrl)
        : null;

      return {
        ...session,
        imageUrl,
        unreadNotifications,
      };
    }

    if (session.portalType !== "student") {
      return session;
    }

    const student = await prisma.student.findFirst({
      select: { photoUrl: true },
      where: {
        id: session.subjectId,
        status: "ACTIVE",
        userId: session.userId,
      },
    });
    const imageUrl = student?.photoUrl
      ? await createDocumentAccessUrl(student.photoUrl)
      : null;

    return {
      ...session,
      imageUrl,
    };
  } catch {
    return session;
  }
}
