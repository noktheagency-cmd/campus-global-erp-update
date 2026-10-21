import {
  ArrowLeftIcon,
  BadgeCheckIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GraduationCapIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgentPasswordForm } from "@/features/agents/components/agent-password-form";
import { AgentPayoutSettingsForm } from "@/features/agents/components/agent-payout-settings-form";
import {
  AgentPriceProposalAudit,
  AgentServicesDialog,
} from "@/features/agents/components/agent-service-pricing-section";
import type { AgentPortalData } from "@/features/agents/types";
import { AgentBursWalletCard } from "@/features/commissions/components/agent-burs-wallet-card";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function AgentPortalWorkspace({
  data,
  error,
  selfService = false,
  servicesOpen = false,
  success,
}: {
  data: AgentPortalData;
  error?: string;
  selfService?: boolean;
  servicesOpen?: boolean;
  success?: string;
}) {
  const agent = data.agent;
  const initials = `${agent.firstName.charAt(0)}${agent.lastName.charAt(0)}`;

  return (
    <div className="min-h-full bg-[#f6f9ff] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <header className="flex flex-col gap-4 rounded-2xl border border-[#dbe5f1] bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {!selfService ? (
              <Button
                asChild
                className="size-9 shrink-0 rounded-xl"
                size="icon"
                variant="outline"
              >
                <Link aria-label="Agentlərə qayıt" href="/agents">
                  <ArrowLeftIcon className="size-4" />
                </Link>
              </Button>
            ) : null}
            <Avatar className="size-14 border border-[#dbe5f1]">
              {agent.profilePhotoUrl ? (
                <AvatarImage
                  alt={`${agent.firstName} ${agent.lastName}`}
                  src={agent.profilePhotoUrl}
                />
              ) : null}
              <AvatarFallback className="bg-[#eaf2ff] font-black text-[#0b66ff]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-black text-[#102442]">
                  {agent.firstName} {agent.lastName}
                </h1>
                <PortalBadge status={agent.portalStatus} />
                <Badge
                  className="rounded-lg border-[#dbe5f1] bg-white text-[10px] font-bold text-[#526482]"
                  variant="outline"
                >
                  {agent.tier}
                </Badge>
              </div>
              <p className="mt-0.5 truncate text-sm font-semibold text-[#526482]">
                {agent.companyName}
              </p>
              <p className="mt-0.5 text-xs text-[#8190a8]">ID: {agent.id}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 lg:items-end">
            <AgentServicesDialog
              agentId={agent.id}
              defaultOpen={servicesOpen}
              selfService={selfService}
              services={data.services}
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <HeaderMetric label="Tələbə" value={data.metrics.totalStudents} />
              <HeaderMetric
                label="Aktiv müraciət"
                value={data.metrics.activeApplications}
              />
              <HeaderMetric
                label="Qazanc"
                value={formatMoney(data.metrics.totalCommissionEarned)}
              />
              <HeaderMetric
                label="Burs xalı"
                value={data.bursWallet.availablePoints}
              />
              <HeaderMetric
                label="Balans"
                value={formatMoney(data.metrics.commissionBalance)}
              />
            </div>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-[#dbe5f1] bg-white">
            <SectionTitle
              description="Agent və şirkətin əsas əlaqə məlumatları"
              title="Profil məlumatları"
            />
            <div className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
              <Info icon={MailIcon} label="E-poçt" value={agent.email} />
              <Info icon={PhoneIcon} label="Telefon" value={agent.phone} />
              <Info icon={MapPinIcon} label="Ölkə" value={agent.country} />
              <Info icon={MapPinIcon} label="Ünvan" value={agent.address} />
            </div>
            {agent.internalNotes ? (
              <div className="border-t border-[#e8eef5] px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-wide text-[#71809a]">
                  Daxili qeyd
                </p>
                <p className="mt-1 text-sm leading-6 text-[#435675]">
                  {agent.internalNotes}
                </p>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-[#dbe5f1] bg-white">
            <SectionTitle
              description="Agent şirkətindəki məsul şəxslər"
              title="Əlaqəli şəxslər"
            />
            <div className="divide-y divide-[#edf2f7]">
              {agent.contacts.length > 0 ? (
                agent.contacts.map((contact) => (
                  <div className="flex gap-3 px-5 py-3.5" key={contact.id}>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef5ff] text-[#0b66ff]">
                      <UserRoundIcon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-[#102442]">
                          {contact.fullName}
                        </p>
                        {contact.isPrimary ? (
                          <Badge className="rounded-lg bg-emerald-50 text-[10px] font-bold text-emerald-700">
                            Əsas əlaqə
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-[#71809a]">
                        {contact.position || "Vəzifə qeyd edilməyib"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-[#526482]">
                        {contact.email ? <span>{contact.email}</span> : null}
                        {contact.phone ? <span>{contact.phone}</span> : null}
                        {contact.whatsapp ? (
                          <span>WhatsApp: {contact.whatsapp}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <Empty label="Əlaqəli şəxs əlavə edilməyib." />
              )}
            </div>
          </section>
        </div>

        <AgentPriceProposalAudit
          error={error}
          services={data.services}
          success={success}
        />

        <div className="grid gap-4 xl:grid-cols-2">
          <AgentBursWalletCard
            agentId={agent.id}
            error={error}
            returnTo={selfService ? "/profile" : `/agents/${agent.id}`}
            students={data.students}
            success={success}
            wallet={data.bursWallet}
          />

          <section className="rounded-2xl border border-[#dbe5f1] bg-white">
            <SectionTitle
              description="Agentə bağlı son komissiya hesablamaları"
              title="Komissiyalar və qazanclar"
            />
            <div className="divide-y divide-[#edf2f7]">
              {data.commissions.length > 0 ? (
                data.commissions.map((item) => (
                  <div
                    className="flex items-center justify-between gap-3 px-5 py-3"
                    key={item.id}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-[#102442]">
                        {item.studentName}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[#71809a]">
                        {item.code} · {item.universityName}
                        {item.scholarshipCreditsEarned
                          ? ` · +${item.scholarshipCreditsEarned} burs`
                          : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-black tabular-nums text-[#0b66ff]">
                        {formatMoney(item.agentAmount, item.currency)}
                      </span>
                      <span className="mt-0.5 block text-[10px] font-semibold text-[#8190a8]">
                        {item.status}
                      </span>
                    </span>
                  </div>
                ))
              ) : (
                <Empty label="Komissiya hesablaması yoxdur." />
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="rounded-2xl border border-[#dbe5f1] bg-white">
            <SectionTitle
              description="Agentin ictimai profilləri"
              title="Sosial media"
            />
            <div className="grid gap-2 p-5 sm:grid-cols-2">
              {agent.socialLinks.length > 0 ? (
                agent.socialLinks.map((social) => (
                  <a
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#e5edf6] px-3 py-2.5 text-sm font-bold text-[#31486b] transition hover:border-[#0b66ff]/30 hover:bg-[#f8fbff] hover:text-[#0b66ff]"
                    href={social.url}
                    key={social.id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="truncate">{social.platformLabel}</span>
                    <ExternalLinkIcon className="size-4 shrink-0" />
                  </a>
                ))
              ) : (
                <div className="sm:col-span-2">
                  <Empty label="Sosial hesab əlavə edilməyib." />
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[#dbe5f1] bg-white">
            <SectionTitle
              description="Portal girişinin funksional sərhədləri"
              title="Portal icazələri"
            />
            <div className="divide-y divide-[#edf2f7] px-5">
              <Permission
                active={agent.canRegisterStudents}
                label="Tələbə qeydiyyatı"
              />
              <Permission
                active={agent.ownStudentsOnly}
                label="Yalnız öz tələbələri"
              />
              <Permission
                active={agent.portalReporting}
                label="Portal hesabatları"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[#dbe5f1] bg-white">
            <SectionTitle
              description="Komissiya ödənişlərinin yönləndirilmə qaydaları"
              title="Ödəniş ayarları"
            />
            <div className="divide-y divide-[#edf2f7] px-5">
              {data.canEditPayoutSettings && !selfService ? (
                <AgentPayoutSettingsForm
                  agent={agent}
                  error={error}
                  success={success}
                />
              ) : (
                <>
                  <Permission
                    active={agent.cashPayoutActive ?? true}
                    label="Nağd ödəniş"
                  />
                  <Permission
                    active={agent.accountPayoutActive ?? true}
                    label="Hesaba köçürmə"
                  />
                  <Permission
                    active={agent.holdInAccount ?? false}
                    label="Hesabda saxla"
                  />
                  <Permission
                    active={agent.manualPayoutManagement ?? false}
                    label="Əll idarəetmə"
                  />
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm font-semibold text-[#31486b]">
                      Ödəniş faizi
                    </span>
                    <span className="text-xs font-bold text-[#526482]">
                      {agent.payoutPercentage ?? 100}%
                    </span>
                  </div>
                </>
              )}
            </div>
          </section>

          {!selfService && data.canEditPayoutSettings ? (
            <section className="rounded-2xl border border-[#dbe5f1] bg-white xl:col-span-2">
              <SectionTitle
                description="Agent portal giriş şifrəsini yeniləyin"
                title="Şifrə dəyişmə"
              />
              <AgentPasswordForm
                agentId={agent.id}
                error={error}
                success={success}
              />
            </section>
          ) : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ListPanel
            emptyLabel="Agentə tələbə təyin edilməyib."
            icon={GraduationCapIcon}
            title="Son tələbələr"
          >
            {data.students.map((student) => (
              <Link
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-[#f8fbff]"
                href={`/applications/students/${student.id}`}
                key={student.id}
              >
                <span className="min-w-0">
                  <span className="block truncate font-bold text-[#102442]">
                    {student.fullName}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[#71809a]">
                    {student.email}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-[#526482]">
                  {student.stage}
                </span>
              </Link>
            ))}
          </ListPanel>

          <ListPanel
            emptyLabel="Agentə müraciət təyin edilməyib."
            icon={FileTextIcon}
            title="Son müraciətlər"
          >
            {data.applications.map((application) => (
              <Link
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-[#f8fbff]"
                href={`/applications/${application.id}`}
                key={application.id}
              >
                <span className="min-w-0">
                  <span className="block truncate font-bold text-[#102442]">
                    {application.studentName}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[#71809a]">
                    {application.code} · {application.country}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-bold text-[#0b66ff]">
                  {application.status}
                </span>
              </Link>
            ))}
          </ListPanel>
        </div>
      </div>
    </div>
  );
}

function HeaderMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-24 rounded-xl border border-[#e5edf6] bg-[#fbfdff] px-3 py-2">
      <p className="text-[10px] font-bold uppercase text-[#8190a8]">{label}</p>
      <p className="mt-0.5 text-lg font-black tabular-nums text-[#102442]">
        {value}
      </p>
    </div>
  );
}

function formatMoney(value: number, currency = "AZN") {
  return `${new Intl.NumberFormat("az-AZ", {
    maximumFractionDigits: 0,
  }).format(value)} ${currency}`;
}

function SectionTitle({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="border-b border-[#e8eef5] px-5 py-4">
      <h2 className="text-sm font-black text-[#102442]">{title}</h2>
      <p className="mt-0.5 text-xs text-[#71809a]">{description}</p>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MailIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef5ff] text-[#0b66ff]">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase text-[#8190a8]">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-bold text-[#31486b]">
          {value}
        </p>
      </div>
    </div>
  );
}

function Permission({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="flex items-center gap-2 text-sm font-semibold text-[#31486b]">
        {active ? (
          <BadgeCheckIcon className="size-4 text-emerald-600" />
        ) : (
          <ShieldCheckIcon className="size-4 text-[#9aa8bc]" />
        )}
        {label}
      </span>
      <span
        className={cn(
          "text-xs font-bold",
          active ? "text-emerald-700" : "text-[#8190a8]",
        )}
      >
        {active ? "Aktiv" : "Bağlı"}
      </span>
    </div>
  );
}

function ListPanel({
  children,
  emptyLabel,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  emptyLabel: string;
  icon: typeof UsersRoundIcon;
  title: string;
}) {
  const count = Array.isArray(children) ? children.length : children ? 1 : 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white">
      <div className="flex items-center gap-2 border-b border-[#e8eef5] px-4 py-3.5">
        <Icon className="size-4 text-[#0b66ff]" />
        <h2 className="text-sm font-black text-[#102442]">{title}</h2>
      </div>
      <div className="divide-y divide-[#edf2f7]">
        {count > 0 ? children : <Empty label={emptyLabel} />}
      </div>
    </section>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex min-h-24 items-center justify-center px-4 text-center text-xs font-semibold text-[#8190a8]">
      {label}
    </div>
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
