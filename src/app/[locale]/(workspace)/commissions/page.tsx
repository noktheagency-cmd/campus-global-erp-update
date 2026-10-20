import Link from "next/link";

import { CommissionPackageWorkspace } from "@/features/commissions/components/commission-package-workspace";
import { CommissionWorkspace } from "@/features/commissions/components/commission-workspace";
import { getCommissionWorkspaceData } from "@/features/commissions/data";
import { getCommissionPackageWorkspaceData } from "@/features/commissions/package-data";
import { defaultLocale } from "@/i18n/routing";
import { requirePermission } from "@/lib/auth/session";

type CommissionSearchParams = Record<string, string | string[] | undefined>;

export default async function CommissionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<CommissionSearchParams>;
}) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const session = await requirePermission("commissions:read", { locale });
  const preview =
    process.env.NODE_ENV !== "production" &&
    readParam(resolvedSearchParams, "preview") === "1";
  const mode =
    readParam(resolvedSearchParams, "mode") === "operations"
      ? "operations"
      : "packages";
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  const commonProps = {
    error: readParam(resolvedSearchParams, "error"),
    locale,
    success: readParam(resolvedSearchParams, "success"),
  };

  const workspace =
    mode === "operations" ? (
      <CommissionWorkspace
        {...commonProps}
        data={await getCommissionWorkspaceData(session, { preview })}
        defaultDate={todayInBaku()}
      />
    ) : (
      <CommissionPackageWorkspace
        {...commonProps}
        data={await getCommissionPackageWorkspaceData(session, { preview })}
      />
    );

  return (
    <div>
      <nav
        aria-label="Komissiya mərkəzi"
        className="mx-4 mt-4 flex w-fit gap-1 rounded-xl border border-[#dbe4ef] bg-white p-1 shadow-sm sm:mx-6"
      >
        <ModeLink
          active={mode === "packages"}
          href={`${prefix}/commissions`}
          label="Paketlər və müqavilələr"
        />
        <ModeLink
          active={mode === "operations"}
          href={`${prefix}/commissions?mode=operations`}
          label="Hesablamalar və ödənişlər"
        />
      </nav>
      {workspace}
    </div>
  );
}

function ModeLink({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
        active
          ? "bg-[#0b66ff] text-white shadow-sm"
          : "text-[#526789] hover:bg-[#f1f6fd]"
      }`}
      href={href}
    >
      {label}
    </Link>
  );
}

function todayInBaku() {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Baku",
    year: "numeric",
  }).format(new Date());
}

function readParam(searchParams: CommissionSearchParams, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
