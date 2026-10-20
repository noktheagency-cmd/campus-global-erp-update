import {
  BadgePercentIcon,
  BellIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  FileTextIcon,
  FileWarningIcon,
  PlusIcon,
  UserPlusIcon,
  UsersRoundIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  markAgentNotificationReadAction,
  markAllAgentNotificationsReadAction,
} from "@/features/agents/actions";
import type {
  AgentApplicationSummary,
  AgentNotification,
  AgentPortalData,
  AgentStudentSummary,
} from "@/features/agents/types";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const metrics = [
  {
    icon: UsersRoundIcon,
    key: "totalStudents",
    label: "Cəmi tələbələr",
    tone: "blue",
  },
  {
    icon: FileTextIcon,
    key: "activeApplications",
    label: "Aktiv müraciətlər",
    tone: "green",
  },
  {
    icon: CheckCircle2Icon,
    key: "submittedApplications",
    label: "Göndərilənlər",
    tone: "amber",
  },
  {
    icon: FileWarningIcon,
    key: "missingDocuments",
    label: "Sənəd gözləyənlər",
    tone: "rose",
  },
] as const;

export function AgentDashboardWorkspace({ data }: { data: AgentPortalData }) {
  const initials = `${data.agent.firstName.charAt(0)}${data.agent.lastName.charAt(0)}`;

  return (
    <div className="min-h-full bg-[#f6f9ff] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto min-w-0 max-w-[1580px]">
        <header className="flex flex-col gap-4 rounded-2xl border border-[#dbe5f1] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-14 border border-[#dbe5f1]">
              {data.agent.profilePhotoUrl ? (
                <AvatarImage
                  alt={`${data.agent.firstName} ${data.agent.lastName}`}
                  src={data.agent.profilePhotoUrl}
                />
              ) : null}
              <AvatarFallback className="bg-[#eaf2ff] text-sm font-black text-[#0b66ff]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-black text-[#102442]">
                  {data.agent.firstName} {data.agent.lastName}
                </h1>
                <PortalBadge status={data.agent.portalStatus} />
              </div>
              <p className="mt-0.5 truncate text-sm font-semibold text-[#526482]">
                {data.agent.companyName}
              </p>
              <p className="mt-0.5 text-xs text-[#8190a8]">
                Agent ID: {data.agent.id}
              </p>
            </div>
          </div>
          {data.agent.canRegisterStudents ? (
            <Button
              asChild
              className="h-10 rounded-xl bg-[#0b66ff] px-4 font-bold shadow-[0_10px_24px_rgba(11,102,255,0.22)] hover:bg-[#075be8]"
            >
              <Link href="/students/new">
                <PlusIcon data-icon="inline-start" />
                Yeni tələbə
              </Link>
            </Button>
          ) : null}
        </header>

        <section className="mt-4 grid overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;

            return (
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5",
                  index > 0 && "border-t border-[#e8eef5] sm:border-l",
                  index === 2 && "sm:border-l-0 xl:border-l",
                  index > 1 && "xl:border-t-0",
                )}
                key={metric.key}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl",
                    metric.tone === "blue" && "bg-blue-50 text-[#0b66ff]",
                    metric.tone === "green" && "bg-emerald-50 text-emerald-600",
                    metric.tone === "amber" && "bg-amber-50 text-amber-600",
                    metric.tone === "rose" && "bg-rose-50 text-rose-500",
                  )}
                >
                  <Icon className="size-4.5" />
                </span>
                <div>
                  <p className="text-xs text-[#71809a]">{metric.label}</p>
                  <p className="mt-0.5 text-xl font-black tabular-nums text-[#102442]">
                    {data.metrics[metric.key]}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        <div className="mt-4 grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1.8fr)_minmax(330px,0.9fr)]">
          <div className="min-w-0 space-y-4">
            <DataPanel
              actionHref="/applications"
              actionLabel="Bütün müraciətlər"
              title="Son müraciətlər"
            >
              <ApplicationsTable applications={data.applications} />
            </DataPanel>
            <DataPanel
              actionHref="/students"
              actionLabel="Bütün tələbələr"
              title="Tələbələrim"
            >
              <StudentsTable students={data.students} />
            </DataPanel>
          </div>

          <NotificationsPanel
            notifications={data.notifications.slice(0, 8)}
            unreadCount={data.unreadNotifications}
          />
        </div>
      </div>
    </div>
  );
}

function DataPanel({
  actionHref,
  actionLabel,
  children,
  title,
}: {
  actionHref: string;
  actionLabel: string;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white">
      <div className="flex items-center justify-between border-b border-[#e8eef5] px-4 py-3.5">
        <h2 className="text-sm font-black text-[#102442]">{title}</h2>
        <Link
          className="inline-flex items-center gap-1 text-xs font-bold text-[#0b66ff] hover:underline"
          href={actionHref}
        >
          {actionLabel}
          <ChevronRightIcon className="size-3.5" />
        </Link>
      </div>
      {children}
    </section>
  );
}

function ApplicationsTable({
  applications,
}: {
  applications: AgentApplicationSummary[];
}) {
  if (applications.length === 0) {
    return <EmptyState label="Hələ müraciət yaradılmayıb." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left">
        <thead className="bg-[#f8fbff]">
          <tr>
            {["Tələbə", "Müraciət", "Ölkə", "Son status", "Yenilənib"].map(
              (label) => (
                <th
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-wide text-[#71809a]"
                  key={label}
                >
                  {label}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf2f7]">
          {applications.map((application) => (
            <tr className="hover:bg-[#f8fbff]" key={application.id}>
              <td className="px-4 py-3 text-xs font-bold text-[#102442]">
                {application.studentName}
              </td>
              <td className="px-4 py-3">
                <Link
                  className="text-xs font-bold text-[#0b66ff] hover:underline"
                  href={`/applications/${application.id}`}
                >
                  {application.code}
                </Link>
              </td>
              <td className="px-4 py-3 text-xs text-[#526482]">
                {application.country}
              </td>
              <td className="px-4 py-3">
                <StatusBadge
                  label={application.status}
                  status={application.statusCode}
                />
                {application.missingRequiredDocuments > 0 ? (
                  <span className="ml-2 text-[10px] font-bold text-amber-700">
                    {application.missingRequiredDocuments} sənəd çatışmır
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3 text-xs text-[#71809a]">
                {application.updatedAt}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StudentsTable({ students }: { students: AgentStudentSummary[] }) {
  if (students.length === 0) {
    return <EmptyState label="Hələ tələbə qeydiyyatdan keçirilməyib." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left">
        <thead className="bg-[#f8fbff]">
          <tr>
            {["Tələbə", "Əlaqə", "Mərhələ", "Portal", "Yenilənib"].map(
              (label) => (
                <th
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-wide text-[#71809a]"
                  key={label}
                >
                  {label}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf2f7]">
          {students.map((student) => (
            <tr className="hover:bg-[#f8fbff]" key={student.id}>
              <td className="px-4 py-3">
                <Link
                  className="text-xs font-bold text-[#102442] hover:text-[#0b66ff]"
                  href={`/applications/students/${student.id}`}
                >
                  {student.fullName}
                </Link>
              </td>
              <td className="px-4 py-3 text-xs text-[#526482]">
                {student.email}
              </td>
              <td className="px-4 py-3 text-xs font-semibold text-[#526482]">
                {student.stage}
              </td>
              <td className="px-4 py-3 text-xs font-semibold text-[#0b66ff]">
                {student.portalStatus}
              </td>
              <td className="px-4 py-3 text-xs text-[#71809a]">
                {student.updatedAt}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NotificationsPanel({
  notifications,
  unreadCount,
  fullPage = false,
}: {
  notifications: AgentNotification[];
  unreadCount: number;
  fullPage?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8eef5] px-4 py-3.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-black text-[#102442]">Bildirişlər</h2>
          {unreadCount > 0 ? (
            <Badge className="rounded-lg bg-[#e8f1ff] px-2 text-[10px] font-black text-[#0b66ff]">
              {unreadCount} yeni
            </Badge>
          ) : null}
        </div>
        {unreadCount > 0 ? (
          <form action={markAllAgentNotificationsReadAction}>
            <Button
              className="h-8 rounded-lg px-2 text-[11px] font-bold text-[#0b66ff]"
              size="sm"
              type="submit"
              variant="ghost"
            >
              Hamısını oxunmuş et
            </Button>
          </form>
        ) : null}
      </div>

      {notifications.length > 0 ? (
        <div className="divide-y divide-[#edf2f7]">
          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
            />
          ))}
        </div>
      ) : (
        <EmptyState label="Yeni bildiriş yoxdur." />
      )}

      {!fullPage ? (
        <Link
          className="flex items-center justify-center gap-1 border-t border-[#e8eef5] px-4 py-3 text-xs font-bold text-[#0b66ff] hover:bg-[#f8fbff]"
          href="/updates"
        >
          Bütün bildirişlər
          <ChevronRightIcon className="size-3.5" />
        </Link>
      ) : null}
    </section>
  );
}

function NotificationRow({
  notification,
}: {
  notification: AgentNotification;
}) {
  const Icon =
    notification.type === "STUDENT_CREATED"
      ? UserPlusIcon
      : notification.type === "COMMISSION_UPDATED"
        ? BadgePercentIcon
        : notification.type === "DOCUMENT_REQUIRED" ||
            notification.type === "DOCUMENT_STATUS"
          ? FileWarningIcon
          : FileTextIcon;

  return (
    <div
      className={cn(
        "relative flex gap-3 px-4 py-3.5",
        !notification.read && "bg-[#fbfdff]",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          notification.type === "STUDENT_CREATED"
            ? "bg-emerald-50 text-emerald-600"
            : notification.type === "COMMISSION_UPDATED"
              ? "bg-blue-50 text-[#0b66ff]"
              : notification.type === "DOCUMENT_REQUIRED" ||
                  notification.type === "DOCUMENT_STATUS"
                ? "bg-amber-50 text-amber-600"
                : "bg-blue-50 text-[#0b66ff]",
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link
            className="text-xs font-black text-[#102442] hover:text-[#0b66ff]"
            href={notification.actionHref}
          >
            {notification.title}
          </Link>
          {!notification.read ? (
            <form action={markAgentNotificationReadAction}>
              <input
                name="notificationId"
                type="hidden"
                value={notification.id}
              />
              <button
                aria-label="Oxunmuş kimi işarələ"
                className="mt-1 size-2 rounded-full bg-[#0b66ff] ring-4 ring-blue-50"
                title="Oxunmuş kimi işarələ"
                type="submit"
              />
            </form>
          ) : null}
        </div>
        <p className="mt-1 text-xs leading-5 text-[#526482]">
          {notification.message}
        </p>
        <p className="mt-1.5 text-[10px] font-medium text-[#8a98ad]">
          {notification.createdAt}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ label, status }: { label: string; status: string }) {
  return (
    <Badge
      className={cn(
        "rounded-lg border px-2 py-0.5 text-[10px] font-bold",
        ["ACCEPTED", "OFFER", "ENROLLED"].includes(status) &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        ["REJECTED", "INVALID_DOCUMENTS"].includes(status) &&
          "border-red-200 bg-red-50 text-red-600",
        status === "DRAFT" && "border-amber-200 bg-amber-50 text-amber-700",
        ![
          "ACCEPTED",
          "OFFER",
          "ENROLLED",
          "REJECTED",
          "INVALID_DOCUMENTS",
          "DRAFT",
        ].includes(status) && "border-blue-200 bg-blue-50 text-[#0b66ff]",
      )}
      variant="outline"
    >
      {label}
    </Badge>
  );
}

function PortalBadge({
  status,
}: {
  status: AgentPortalData["agent"]["portalStatus"];
}) {
  return (
    <Badge
      className={cn(
        "rounded-lg border px-2 py-0.5 text-[10px] font-bold",
        status === "Ready" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        status === "Pending" && "border-amber-200 bg-amber-50 text-amber-700",
        status === "Suspended" && "border-red-200 bg-red-50 text-red-600",
      )}
      variant="outline"
    >
      {status === "Ready"
        ? "Portal aktivdir"
        : status === "Pending"
          ? "Gözləmədə"
          : "Dayandırılıb"}
    </Badge>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-28 flex-col items-center justify-center px-4 text-center">
      <BellIcon className="size-6 text-[#a0aec0]" />
      <p className="mt-2 text-xs font-semibold text-[#71809a]">{label}</p>
    </div>
  );
}
