import {
  ArrowRightIcon,
  BellRingIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  Clock3Icon,
  DownloadIcon,
  FileTextIcon,
  GraduationCapIcon,
  LockIcon,
  MailIcon,
  SendIcon,
  ShieldCheckIcon,
  UploadCloudIcon,
  UserRoundIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getApplicationStatusHeaderSurface,
  getApplicationStatusTone,
} from "@/features/applications/application-status-tone";
import {
  submitStudentApplicationAction,
  uploadApplicationDocumentAction,
} from "@/features/applications/actions";
import { FloatingStudentChatPanel } from "@/features/applications/components/student-chat-panel";
import { updateStudentPortalProfilAction } from "@/features/students/actions";
import {
  formatInputDate,
  formatPortalDate,
  formatPortalDateTime,
  formatPortalMoney,
  getStatusLabel,
  type StudentPortalApplication,
  type StudentPortalData,
  type StudentPortalDocument,
  type StudentPortalDocumentRequest,
  type StudentPortalGeneralDocument,
  type StudentPortalStep,
  type StudentPortalUpdate,
} from "@/features/students/data/portal-data";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function StudentPortalWorkspace({
  data,
  error,
  success,
}: {
  data: StudentPortalData;
  error?: string;
  success?: string;
}) {
  const { metrics, primaryApplication, student } = data;
  const studentName = `${student.firstName} ${student.lastName}`.trim();

  return (
    <div className="min-h-full bg-[#f6f9ff] px-5 py-6 text-[#07183a] lg:px-8 lg:py-8">
      <header className="flex flex-col gap-5 border-b border-[#dce6f4]/70 pb-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Tələbə portalı
            </h1>
            <StatusBadge
              status={primaryApplication?.status ?? "PROFILE"}
              text={
                primaryApplication
                  ? getStatusLabel(primaryApplication.status)
                  : "Profil"
              }
            />
          </div>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#5d6d91]">
            Xoş gəldiniz, {studentName || "tələbə"}. Qəbul prosesinizi izləyin,
            zəruri sənədləri yükləyin və profilinizi baxış üçün hazır saxlayın.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <InfoChip
              icon={MailIcon}
              text={
                student.loginEmail ??
                data.student.contactEmail ??
                "E-poçt yoxdur"
              }
            />
            <InfoChip
              icon={UserRoundIcon}
              text={`Məsləhətçi: ${data.agentLabel}`}
            />
            {primaryApplication ? (
              <InfoChip
                icon={Clock3Icon}
                text={`Yeniləndi ${formatPortalDate(primaryApplication.updatedAt)}`}
              />
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            className="h-11 rounded-2xl bg-[#0b66ff] px-5 text-sm font-black shadow-[0_12px_28px_rgba(37,99,235,0.22)] hover:bg-[#075be8]"
          >
            <Link href="/documents">
              <UploadCloudIcon data-icon="inline-start" />
              Sənəd yüklə
            </Link>
          </Button>
          <Button
            asChild
            className="h-11 rounded-2xl border-[#dce6f4] bg-white px-5 text-sm font-black text-[#34456c] hover:bg-[#eef5ff] hover:text-[#0b66ff]"
            variant="outline"
          >
            <Link href="/profile">
              <UserRoundIcon data-icon="inline-start" />
              Profili redaktə et
            </Link>
          </Button>
        </div>
      </header>

      <FeedbackBanner error={error} success={success} />

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={primaryApplication?.code ?? "Hələ müraciət yoxdur"}
          icon={FileTextIcon}
          label="Müraciət"
          tone="blue"
          value={
            primaryApplication
              ? getStatusLabel(primaryApplication.status)
              : "Gözləyir"
          }
        />
        <MetricCard
          detail={`${metrics.uploadedDocuments}/${metrics.totalDocuments} yüklənib`}
          icon={UploadCloudIcon}
          label="Sənədlər"
          tone={metrics.missingRequiredDocuments > 0 ? "amber" : "green"}
          value={
            metrics.missingRequiredDocuments > 0
              ? `${metrics.missingRequiredDocuments} çatışmır`
              : "Hazır"
          }
        />
        <MetricCard
          detail="Redaktə edilə bilən əlaqə və şəxsiyyət sahələri"
          icon={UserRoundIcon}
          label="Profil"
          tone={metrics.profileCompletion >= 80 ? "green" : "amber"}
          value={`${metrics.profileCompletion}%`}
        />
        <MetricCard
          detail={
            metrics.overdueDocumentRequests > 0
              ? `${metrics.overdueDocumentRequests} tapşırığın deadline-ı keçib`
              : "İxtisas üzrə sənəd və ödəniş tapşırıqları"
          }
          icon={BellRingIcon}
          label="Gözləyən tapşırıq"
          tone={
            metrics.overdueDocumentRequests > 0
              ? "red"
              : metrics.pendingDocumentRequests > 0
                ? "amber"
                : "green"
          }
          value={String(metrics.pendingDocumentRequests)}
        />
      </section>

      {metrics.pendingDocumentRequests > 0 ? (
        <section className="mt-6">
          <Panel
            id="document-requests"
            description="Sizə göndərilmiş sənədləri deadline-dan əvvəl açın, təsdiqləyin və tələb olunan cavabı yükləyin."
            title="İcra gözləyən sənədlər"
          >
            <DocumentRequestAlerts applications={data.applications} />
          </Panel>
        </section>
      ) : null}

      <section className="mt-6">
        <Panel
          id="application"
          description="Qəbul prosesiniz növbəti zəruri əməl ilə burada göstərilir."
          title="Müraciətim"
        >
          {primaryApplication ? (
            <ApplicationOverview
              application={primaryApplication}
              missingRequiredDocuments={metrics.missingRequiredDocuments}
              steps={data.steps}
            />
          ) : (
            <EmptyState
              icon={FileTextIcon}
              title="Hələ müraciət yoxdur"
              text="Universitetlərə müraciət etmək və hər müraciəti buradan izləmək üçün Müraciətlər bölməsindən istifadə edin."
            />
          )}
        </Panel>
      </section>

      <StudentPortalChatWidget data={data} returnTo="/dashboard" />
    </div>
  );
}

export function StudentDocumentsWorkspace({
  data,
  error,
  success,
}: {
  data: StudentPortalData;
  error?: string;
  success?: string;
}) {
  const { applications, generalDocuments, primaryApplication } = data;

  return (
    <StudentPortalSectionShell
      description="Profilinizə və müraciətinizə aid bütün sənədləri bir yerdən görün, açın və idarə edin."
      icon={UploadCloudIcon}
      title="Sənədlər"
    >
      <FeedbackBanner error={error} success={success} />
      <Panel
        className="mt-5"
        description="İlkin qeydiyyatda və hər müraciət üzrə yüklədiyiniz sənədlər mənbəyinə görə kateqoriyalanıb."
        title="Ümumi sənədlər"
      >
        <GeneralDocumentsList
          applications={applications}
          documents={generalDocuments}
        />
      </Panel>
      <Panel
        className="mt-5"
        description="Aktiv müraciətiniz üçün tələb olunan, çatışmayan və yenilənə bilən sənədlər."
        title="Aktiv müraciətin sənəd tələbləri"
      >
        {primaryApplication ? (
          <DocumentChecklist
            application={primaryApplication}
            documents={primaryApplication.documents}
            returnTo="/documents"
          />
        ) : (
          <EmptyState
            icon={UploadCloudIcon}
            title="Sənədlər burada görünəcək"
            text="Müraciətiniz açıldıqdan sonra sənədlər burada görünəcək."
          />
        )}
      </Panel>
      <StudentPortalChatWidget data={data} returnTo="/documents" />
    </StudentPortalSectionShell>
  );
}

function DocumentRequestAlerts({
  applications,
}: {
  applications: StudentPortalApplication[];
}) {
  const requests = applications
    .flatMap((application) =>
      application.documentRequests.map((request) => ({
        applicationId: application.id,
        request,
      })),
    )
    .filter(
      ({ request }) =>
        request.status !== "COMPLETED" && request.status !== "CANCELLED",
    )
    .sort(
      (left, right) =>
        left.request.deadline.getTime() - right.request.deadline.getTime(),
    );

  return (
    <div className="grid gap-3">
      {requests.map(({ applicationId, request }) => (
        <DocumentRequestAlert
          applicationId={applicationId}
          key={request.id}
          request={request}
        />
      ))}
    </div>
  );
}

function DocumentRequestAlert({
  applicationId,
  request,
}: {
  applicationId: string;
  request: StudentPortalDocumentRequest;
}) {
  const overdue = request.isOverdue;
  const isPayment = request.responseType === "PAYMENT_RECEIPT";

  return (
    <article
      className={cn(
        "grid gap-4 rounded-[1.2rem] border bg-[#fbfdff] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
        overdue ? "border-red-200 bg-red-50/40" : "border-[#dce6f4]",
      )}
    >
      <div className="flex min-w-0 gap-3">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl",
            overdue
              ? "bg-red-100 text-red-600"
              : isPayment
                ? "bg-amber-100 text-amber-700"
                : "bg-[#e8f1ff] text-[#1559b7]",
          )}
        >
          <BellRingIcon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-[#07183a]">
              {request.title}
            </h3>
            <Badge
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[10px] font-black",
                overdue
                  ? "border-red-100 bg-red-50 text-red-700"
                  : request.status === "ACKNOWLEDGED"
                    ? "border-amber-100 bg-amber-50 text-amber-700"
                    : "border-blue-100 bg-blue-50 text-[#1559b7]",
              )}
            >
              {overdue
                ? "Deadline keçib"
                : request.status === "ACKNOWLEDGED"
                  ? "Cavab gözləyir"
                  : "Yeni sənəd"}
            </Badge>
          </div>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#637392]">
            {request.applicationChoice.university.name} · {request.applicationChoice.program.name}
          </p>
          <div className={cn("mt-2 text-xs font-black", overdue ? "text-red-600" : "text-amber-700")}>
            Son tarix: {formatPortalDateTime(request.deadline)}
            {request.amount
              ? ` · ${formatPortalMoney(request.amount, request.currency ?? "USD")}`
              : ""}
          </div>
        </div>
      </div>
      <Button
        asChild
        className={cn(
          "h-10 rounded-xl px-4 text-xs font-black",
          overdue
            ? "bg-red-600 hover:bg-red-700"
            : "bg-[#1559b7] hover:bg-[#104fa5]",
        )}
      >
        <Link href={`/applications/${applicationId}`}>
          Sənədə bax
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
      </Button>
    </article>
  );
}

function GeneralDocumentsList({
  applications,
  documents,
}: {
  applications: StudentPortalApplication[];
  documents: StudentPortalGeneralDocument[];
}) {
  const categories = [
    {
      description: "Profiliniz yaradılarkən yüklənmiş fayllar",
      documents: documents.map((document) => ({
        accessUrl: document.accessUrl,
        fileName: document.fileName,
        id: document.id,
        meta: [
          document.documentType,
          formatFileSize(document.fileSize),
          formatPortalDateTime(document.uploadedAt),
        ]
          .filter(Boolean)
          .join(" · "),
        status: "",
        title: document.title,
      })),
      id: "initial-registration",
      statusCode: null,
      statusLabel: "",
      title: "İlkin qeydiyyat sənədləri",
    },
    ...applications
      .map((application) => ({
        description: `${application.country} · ${application.period.name} · ${application.educationLevel.name}`,
        documents: application.documents
          .filter((document) => document.fileName)
          .map((document) => ({
            accessUrl: document.accessUrl,
            fileName: document.fileName ?? "",
            id: document.id,
            meta: [
              document.documentGroup,
              formatFileSize(document.fileSize ?? 0),
              formatPortalDateTime(document.uploadedAt),
            ]
              .filter(Boolean)
              .join(" · "),
            status: document.status,
            title: document.title,
          })),
        id: application.id,
        statusCode: application.status,
        statusLabel: getStatusLabel(application.status),
        title: `${application.code} · Müraciət sənədləri`,
      }))
      .filter((category) => category.documents.length > 0),
  ];
  const totalDocuments = categories.reduce(
    (total, category) => total + category.documents.length,
    0,
  );

  if (totalDocuments === 0) {
    return (
      <EmptyState
        icon={FileTextIcon}
        title="Ümumi sənəd yoxdur"
        text="İlkin qeydiyyat və ya müraciət sənədi yüklədikdə burada kateqoriyası ilə görünəcək."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {categories.map((category) => (
        <section
          className={cn(
            "rounded-[1.2rem] border p-3.5",
            category.statusCode
              ? getApplicationStatusHeaderSurface(category.statusCode)
              : "border-[#dce6f4] bg-[#fbfdff]",
          )}
          key={category.id}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-black text-[#07183a]">
                  {category.title}
                </h3>
                {category.statusCode ? (
                  <StatusBadge
                    status={category.statusCode}
                    text={category.statusLabel}
                  />
                ) : null}
              </div>
              <p className="mt-0.5 text-[11px] font-semibold text-[#71809f]">
                {category.description}
              </p>
            </div>
            <Badge className="rounded-full border border-white/80 bg-white/80 px-2.5 py-0.5 text-[11px] font-black text-[#51627f]">
              {category.documents.length} sənəd
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {category.documents.map((document) => (
              <article
                className="flex min-w-0 flex-col rounded-[1.05rem] border border-white/90 bg-white/90 p-4 shadow-[0_7px_20px_rgba(29,78,216,0.035)]"
                key={document.id}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ff] text-[#1559b7]">
                    <FileTextIcon className="size-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-black text-[#07183a]">
                      {document.title}
                    </h4>
                    <p className="mt-1 truncate text-xs font-semibold text-[#637392]">
                      {document.fileName}
                    </p>
                  </div>
                  {document.status ? (
                    <DocumentStatusBadge status={document.status} />
                  ) : null}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#e8eef7] pt-3">
                  <span className="min-w-0 truncate text-[10px] font-bold text-[#8a97b4]">
                    {document.meta}
                  </span>
                  {document.accessUrl ? (
                    <Button
                      asChild
                      className="h-8 shrink-0 rounded-lg border-[#dce6f4] bg-white px-2.5 text-[11px] font-black text-[#1559b7]"
                      size="sm"
                      variant="outline"
                    >
                      <a
                        href={document.accessUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <DownloadIcon data-icon="inline-start" />
                        Aç
                      </a>
                    </Button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function StudentProfilWorkspace({
  data,
  error,
  success,
}: {
  data: StudentPortalData;
  error?: string;
  success?: string;
}) {
  return (
    <StudentPortalSectionShell
      description="Əlaqə və şəxsiyyət məlumatlarınızı rahat şəkildə yeniləyin."
      icon={UserRoundIcon}
      title="Profil"
    >
      <FeedbackBanner error={error} success={success} />
      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <Panel
          description="Təhlükəsiz şəkildə yeniləyə biləcəyiniz sahələr bunlardır."
          title="Profil detalları"
        >
          <ProfilForm data={data} />
        </Panel>

        <Panel
          description="Portalda görə və dəyişə bildiyiniz məlumatlar."
          title="Giriş imkanları"
        >
          <PermissionList />
        </Panel>
      </section>
      <StudentPortalChatWidget data={data} returnTo="/profile" />
    </StudentPortalSectionShell>
  );
}

export function StudentUpdatesWorkspace({
  data,
  error,
  success,
}: {
  data: StudentPortalData;
  error?: string;
  success?: string;
}) {
  return (
    <StudentPortalSectionShell
      description="Müraciət, sənəd və profilinizlə bağlı qısa xəbərdarlıqlar."
      icon={Clock3Icon}
      title="Bildirişlər"
    >
      <FeedbackBanner error={error} success={success} />
      <Panel
        className="mt-5"
        description="Ən son məlumatlar yığcam şəkildə burada görünür."
        title="Son bildirişlər"
      >
        <RecentUpdates updates={data.recentUpdates} />
      </Panel>
      <StudentPortalChatWidget data={data} returnTo="/updates" />
    </StudentPortalSectionShell>
  );
}

function StudentPortalChatWidget({
  data,
  returnTo,
}: {
  data: StudentPortalData;
  returnTo: string;
}) {
  return (
    <FloatingStudentChatPanel
      applicationId={data.primaryApplication?.id}
      messages={data.chatMessages}
      returnTo={withChatOpen(returnTo)}
      studentId={data.student.id}
      viewer="student"
    />
  );
}

function withChatOpen(path: string) {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("chat", "open");
  const search = params.toString();

  return search ? `${pathname}?${search}` : pathname;
}

function ApplicationOverview({
  application,
  missingRequiredDocuments,
  steps,
}: {
  application: StudentPortalApplication;
  missingRequiredDocuments: number;
  steps: StudentPortalStep[];
}) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
        <div
          className={cn(
            "rounded-[1.35rem] border border-l-4 p-4",
            getApplicationStatusHeaderSurface(application.status),
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xl font-black text-[#07183a]">
              {application.code}
            </div>
            <StatusBadge
              status={application.status}
              text={getStatusLabel(application.status)}
            />
          </div>
          <div className="mt-3 grid gap-2 text-sm font-semibold text-[#637392] sm:grid-cols-2">
            <InfoLine label="Ölkə" value={application.country} />
            <InfoLine label="Dönəm" value={application.period.name} />
            <InfoLine
              label="Təhsil pilləsi"
              value={application.educationLevel.name}
            />
            <InfoLine
              label="Göndərilib"
              value={formatPortalDateTime(application.submittedAt)}
            />
          </div>
          {application.latestStatusReason ? (
            <div className="mt-3 rounded-2xl border border-[#dce6f4] bg-white px-3 py-2 text-xs font-semibold leading-5 text-[#51627f]">
              <span className="font-black text-[#07183a]">Səbəb: </span>
              {application.latestStatusReason}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            asChild
            className="h-11 rounded-2xl border-[#dce6f4] bg-white px-4 text-sm font-black text-[#1559b7] hover:bg-[#eef5ff]"
            variant="outline"
          >
            <Link href={`/applications/${application.id}`}>
              Detallara bax
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
          <SubmitApplicationForm
            application={application}
            missingRequiredDocuments={missingRequiredDocuments}
          />
        </div>
      </div>

      <ProgressSteps steps={steps} />

      <div className="rounded-[1.35rem] border border-[#dce6f4] bg-white">
        <div className="border-b border-[#e5edf8] px-4 py-3 text-xs font-black uppercase text-[#637392]">
          Proqram seçimləri
        </div>
        <div className="divide-y divide-[#edf2f8]">
          {application.choices.length > 0 ? (
            application.choices.map((choice) => {
              const tuition = choice.tuition;
              const price =
                tuition?.discountedTuitionFee ?? tuition?.tuitionFee ?? null;

              return (
                <div
                  className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[48px_1fr_160px]"
                  key={choice.id}
                >
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-[#e8f1ff] text-sm font-black text-[#1559b7]">
                    {choice.priority}
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-[#07183a]">
                      {choice.program.name}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-[#637392]">
                      {choice.university.name} · {choice.university.city} ·{" "}
                      {choice.program.educationLanguage?.name ??
                        "Dil təyin edilməyib"}
                    </div>
                  </div>
                  <div className="font-black text-[#07183a] md:text-right">
                    {formatPortalMoney(price, tuition?.currency ?? "USD") ||
                      "-"}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-8">
              <EmptyState
                icon={GraduationCapIcon}
                title="Seçim edilməyib"
                text="Proqram seçimləri tamamlandıqdan sonra burada görünəcək."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SubmitApplicationForm({
  application,
  missingRequiredDocuments,
}: {
  application: StudentPortalApplication;
  missingRequiredDocuments: number;
}) {
  if (application.status !== "DRAFT") {
    return null;
  }

  return (
    <form action={submitStudentApplicationAction}>
      <input name="applicationId" type="hidden" value={application.id} />
      <Button
        className={cn(
          "h-11 w-full rounded-2xl px-4 text-sm font-black shadow-[0_12px_24px_rgba(16,185,129,0.20)]",
          missingRequiredDocuments > 0
            ? "bg-[#e8eef7] text-[#637392] shadow-none hover:bg-[#e8eef7]"
            : "bg-[#12a66a] hover:bg-[#0f955f]",
        )}
        disabled={missingRequiredDocuments > 0}
        type="submit"
      >
        <SendIcon data-icon="inline-start" />
        {missingRequiredDocuments > 0
          ? "Əvvəlcə sənədləri yükləyin"
          : "Müraciəti göndər"}
      </Button>
    </form>
  );
}

function ProgressSteps({ steps }: { steps: StudentPortalStep[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-3 2xl:grid-cols-6">
      {steps.map((step) => (
        <div
          className={cn(
            "min-h-[118px] rounded-[1.25rem] border p-4",
            step.state === "complete" &&
              "border-emerald-100 bg-emerald-50 text-emerald-700",
            step.state === "current" &&
              "border-blue-100 bg-[#eef5ff] text-[#1559b7]",
            step.state === "pending" &&
              "border-[#dce6f4] bg-white text-[#637392]",
            step.state === "blocked" && "border-red-100 bg-red-50 text-red-600",
          )}
          key={step.label}
        >
          <div className="flex items-center gap-2 text-sm font-black">
            {step.state === "complete" ? (
              <CheckCircle2Icon className="size-4" />
            ) : step.state === "blocked" ? (
              <CircleAlertIcon className="size-4" />
            ) : (
              <Clock3Icon className="size-4" />
            )}
            {step.label}
          </div>
          <p className="mt-2 text-xs font-semibold leading-5 opacity-80">
            {step.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

function DocumentChecklist({
  application,
  documents,
  returnTo,
}: {
  application: StudentPortalApplication;
  documents: StudentPortalDocument[];
  returnTo?: string;
}) {
  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileTextIcon}
        title="Sənəd tələbi yoxdur"
        text="Hazırda əlavə sənəd istənilmir."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {documents.map((document) => (
        <div
          className="rounded-[1.25rem] border border-[#dce6f4] bg-white p-4"
          key={document.id}
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
            <div className="flex min-w-0 gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#f0f4f9] text-[#637392]">
                <FileTextIcon className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-black text-[#07183a]">
                    {document.title}
                    {document.isRequired ? (
                      <span className="ml-1 text-red-500">*</span>
                    ) : null}
                  </div>
                  <DocumentStatusBadge status={document.status} />
                </div>
                <div className="mt-1 text-xs font-semibold text-[#637392]">
                  {document.fileName ?? "Yüklənməyib"}
                  {document.fileSize
                    ? ` · ${formatFileSize(document.fileSize)}`
                    : ""}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {document.accessUrl ? (
                <Button
                  asChild
                  className="h-10 rounded-xl border-[#dce6f4] bg-white text-[#1559b7]"
                  size="sm"
                  variant="outline"
                >
                  <a href={document.accessUrl} rel="noreferrer" target="_blank">
                    <DownloadIcon data-icon="inline-start" />
                    Aç
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          <form
            action={uploadApplicationDocumentAction}
            className="mt-3 flex flex-col gap-2 sm:flex-row"
          >
            <input name="applicationId" type="hidden" value={application.id} />
            <input
              name="documentKey"
              type="hidden"
              value={document.documentKey}
            />
            {returnTo ? (
              <input name="returnTo" type="hidden" value={returnTo} />
            ) : null}
            <input
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
              className="min-h-10 flex-1 rounded-xl border border-[#dce6f4] bg-[#fbfdff] px-3 py-2 text-xs font-semibold text-[#34456c] file:mr-3 file:rounded-lg file:border-0 file:bg-[#e8f1ff] file:px-3 file:py-1.5 file:text-xs file:font-black file:text-[#1559b7]"
              name="file"
              type="file"
            />
            <Button className="h-10 rounded-xl bg-[#1559b7] font-bold hover:bg-[#104fa5]">
              <UploadCloudIcon data-icon="inline-start" />
              {document.status === "UPLOADED" ? "Dəyiş" : "Yüklə"}
            </Button>
          </form>
        </div>
      ))}
    </div>
  );
}

function ProfilForm({ data }: { data: StudentPortalData }) {
  const { student } = data;

  return (
    <form action={updateStudentPortalProfilAction} className="grid gap-4">
      <div className="rounded-[1.25rem] border border-[#dce6f4] bg-[#fbfdff] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-black text-[#07183a]">
              {student.firstName} {student.lastName}
            </div>
            <div className="mt-1 text-xs font-semibold text-[#637392]">
              Giriş: {student.loginEmail ?? "Təyin edilməyib"}
            </div>
          </div>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#e8f1ff] text-[#1559b7]">
            <UserRoundIcon />
          </div>
        </div>
      </div>

      <TextInput
        defaultValue={student.contactEmail ?? ""}
        label="Əlaqə e-poçtu"
        name="contactEmail"
        placeholder="email@example.com"
        type="email"
      />
      <TextInput
        defaultValue={student.phone ?? ""}
        label="Mobil telefon"
        name="phone"
        placeholder="+994 50 000 00 00"
      />
      <TextInput
        defaultValue={formatInputDate(student.birthDate)}
        label="Doğum tarixi"
        name="birthDate"
        type="date"
      />
      <TextInput
        defaultValue={student.citizenship ?? ""}
        label="Vətəndaşlıq"
        name="citizenship"
        placeholder="Azərbaycan"
      />
      <TextInput
        defaultValue={student.passportNo ?? ""}
        label="Pasport no"
        name="passportNo"
      />
      <TextInput
        defaultValue={student.identityNo ?? ""}
        label="Şəxsiyyət no"
        name="identityNo"
      />
      <label className="block">
        <span className="text-[11px] font-black uppercase text-[#637392]">
          Ünvan
        </span>
        <textarea
          className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-[#dce6f4] bg-white px-4 py-3 text-sm font-semibold text-[#07183a] outline-none transition placeholder:text-[#9aa7bd] focus:border-[#1559b7] focus:ring-4 focus:ring-[#1559b7]/10"
          defaultValue={student.address ?? ""}
          name="address"
          placeholder="Cari ünvan"
        />
      </label>

      <Button className="h-11 rounded-2xl bg-[#0b66ff] text-sm font-black hover:bg-[#075be8]">
        Profili saxla
      </Button>
    </form>
  );
}

function PermissionList() {
  const allowed = [
    "Öz müraciətlərinə baxmaq",
    "Öz müraciət sənədlərini yükləmək",
    "Zəruri sənədlər hazır olanda öz müraciətini göndərmək",
    "Əlaqə və şəxsiyyət profil sahələrini yeniləmək",
  ];
  const restricted = [
    "Başqa tələbələrə giriş yoxdur",
    "Agent, universitet və ya ödəniş məlumatlarını dəyişmək olmur",
    "Yalnız sizə aid məlumatlar görünür",
  ];

  return (
    <div className="grid gap-4">
      <PermissionGroup
        icon={ShieldCheckIcon}
        items={allowed}
        title="İcazəli"
        tone="green"
      />
      <PermissionGroup
        icon={LockIcon}
        items={restricted}
        title="Məhdud"
        tone="blue"
      />
    </div>
  );
}

function PermissionGroup({
  icon: Icon,
  items,
  title,
  tone,
}: {
  icon: LucideIcon;
  items: string[];
  title: string;
  tone: "blue" | "green";
}) {
  return (
    <div className="rounded-[1.25rem] border border-[#dce6f4] bg-[#fbfdff] p-4">
      <div
        className={cn(
          "mb-3 flex items-center gap-2 text-sm font-black",
          tone === "green" ? "text-emerald-700" : "text-[#1559b7]",
        )}
      >
        <Icon className="size-4" />
        {title}
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <div
            className="flex gap-2 text-sm font-semibold leading-5 text-[#52627f]"
            key={item}
          >
            <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentUpdates({ updates }: { updates: StudentPortalUpdate[] }) {
  if (updates.length === 0) {
    return (
      <EmptyState
        icon={Clock3Icon}
        title="Bildiriş yoxdur"
        text="Yeni məlumat olduqda burada görünəcək."
      />
    );
  }

  return (
    <div className="grid gap-2">
      {updates.map((update) => (
        <div
          className="flex gap-3 rounded-2xl border border-[#dce6f4] bg-[#fbfdff] px-4 py-3"
          key={update.id}
        >
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              update.tone === "green" && "bg-emerald-50 text-emerald-600",
              update.tone === "amber" && "bg-amber-50 text-amber-600",
              update.tone === "red" && "bg-red-50 text-red-600",
              update.tone === "blue" && "bg-[#e8f1ff] text-[#1559b7]",
            )}
          >
            <Clock3Icon className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-[#07183a]">
              {update.title}
            </div>
            <div className="mt-0.5 text-sm font-semibold leading-5 text-[#637392]">
              {update.detail}
            </div>
            <div className="mt-1 text-[11px] font-bold text-[#8b98b1]">
              {formatPortalDateTime(update.createdAt)}
            </div>
            {update.actionHref ? (
              <Button
                asChild
                className="mt-2 h-8 rounded-lg border-[#dce6f4] bg-white px-2.5 text-[11px] font-black text-[#1559b7]"
                size="sm"
                variant="outline"
              >
                <Link href={update.actionHref}>
                  Bax
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function StudentPortalSectionShell({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: ReactNode;
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="min-h-full bg-[#f6f9ff] px-5 py-6 text-[#07183a] lg:px-8 lg:py-8">
      <header className="flex flex-col gap-4 border-b border-[#dce6f4]/70 pb-6 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f1ff] text-[#1559b7]">
              <Icon className="size-5" />
            </span>
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                {title}
              </h1>
              <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-[#5d6d91]">
                {description}
              </p>
            </div>
          </div>
        </div>
        <Button
          asChild
          className="h-11 rounded-2xl border-[#dce6f4] bg-white px-5 text-sm font-black text-[#34456c] hover:bg-[#eef5ff] hover:text-[#0b66ff]"
          variant="outline"
        >
          <Link href="/dashboard">
            İdarə paneli
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </Button>
      </header>
      {children}
    </div>
  );
}

function Panel({
  children,
  className,
  description,
  id,
  title,
}: {
  children: ReactNode;
  className?: string;
  description: string;
  id?: string;
  title: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[1.65rem] border border-[#dce6f4] bg-white p-5 shadow-[0_18px_50px_rgba(29,78,216,0.05)]",
        className,
      )}
      id={id}
    >
      <div className="mb-4">
        <h2 className="text-lg font-black text-[#07183a]">{title}</h2>
        <p className="mt-1 text-sm font-medium leading-6 text-[#637392]">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  tone: "amber" | "blue" | "green" | "red";
  value: string;
}) {
  return (
    <div className="rounded-[1.65rem] border border-[#dce6f4] bg-white p-4 shadow-[0_18px_50px_rgba(29,78,216,0.06)]">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg",
            tone === "blue" && "bg-[#1559b7]",
            tone === "green" && "bg-emerald-500",
            tone === "amber" && "bg-amber-500",
            tone === "red" && "bg-red-500",
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[#637392]">{label}</div>
          <div className="mt-1 truncate text-xl font-black text-[#07183a]">
            {value}
          </div>
          <div className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#71809f]">
            {detail}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackBanner({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (!error && !success) {
    return null;
  }

  const isError = Boolean(error);

  return (
    <div
      className={cn(
        "mt-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold",
        isError
          ? "border-red-100 bg-red-50 text-red-700"
          : "border-emerald-100 bg-emerald-50 text-emerald-700",
      )}
    >
      {isError ? (
        <CircleAlertIcon className="mt-0.5 size-5" />
      ) : (
        <CheckCircle2Icon className="mt-0.5 size-5" />
      )}
      {isError ? getErrorMessage(error) : getSuccessMessage(success)}
    </div>
  );
}

function TextInput({
  defaultValue,
  label,
  name,
  placeholder,
  type = "text",
}: {
  defaultValue: string;
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase text-[#637392]">
        {label}
      </span>
      <input
        className="mt-2 h-11 w-full rounded-2xl border border-[#dce6f4] bg-white px-4 text-sm font-semibold text-[#07183a] outline-none transition placeholder:text-[#9aa7bd] focus:border-[#1559b7] focus:ring-4 focus:ring-[#1559b7]/10"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}

function InfoChip({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#dce6f4] bg-white px-3 py-1.5 text-xs font-bold text-[#52627f]">
      <Icon className="size-3.5 shrink-0 text-[#1559b7]" />
      <span className="truncate">{text}</span>
    </span>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[11px] font-black uppercase text-[#8b98b1]">
        {label}
      </span>
      <span className="mt-0.5 block font-black text-[#07183a]">{value}</span>
    </div>
  );
}

function StatusBadge({ status, text }: { status: string; text: string }) {
  const tone =
    status === "PROFILE" ? "slate" : getApplicationStatusTone(status);

  return (
    <Badge
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-black",
        badgeTone(tone),
      )}
    >
      {text}
    </Badge>
  );
}

function DocumentStatusBadge({ status }: { status: string }) {
  const tone =
    status === "UPLOADED"
      ? "green"
      : status === "WAIVED"
        ? "blue"
        : status === "ARCHIVED"
          ? "slate"
          : "red";

  return (
    <Badge
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[11px] font-black",
        badgeTone(tone),
      )}
    >
      {formatStatus(status)}
    </Badge>
  );
}

function EmptyState({
  icon: Icon,
  text,
  title,
}: {
  icon: LucideIcon;
  text: string;
  title: string;
}) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-[#cfd9e8] bg-[#fbfdff] px-4 text-center">
      <Icon className="mb-3 size-8 text-[#1559b7]" />
      <div className="font-black text-[#07183a]">{title}</div>
      <p className="mt-1 max-w-md text-sm font-semibold leading-6 text-[#637392]">
        {text}
      </p>
    </div>
  );
}

function badgeTone(tone: "amber" | "blue" | "green" | "red" | "slate") {
  return cn(
    tone === "green" && "border-emerald-100 bg-emerald-50 text-emerald-600",
    tone === "amber" && "border-amber-100 bg-amber-50 text-amber-700",
    tone === "red" && "border-red-100 bg-red-50 text-red-600",
    tone === "blue" && "border-blue-100 bg-blue-50 text-[#1559b7]",
    tone === "slate" && "border-slate-200 bg-slate-50 text-slate-600",
  );
}

function formatStatus(value: string) {
  const labels: Record<string, string> = {
    ARCHIVED: "Arxivdə",
    MISSING: "Çatışmır",
    PENDING_REVIEW: "Baxışda",
    REJECTED: "Qəbul edilmədi",
    UPLOADED: "Yüklənib",
    WAIVED: "Tələb olunmur",
  };

  if (labels[value]) {
    return labels[value];
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatFileSize(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function getSuccessMessage(success?: string) {
  if (success === "profile-updated") {
    return "Profil yeniləndi.";
  }

  if (success === "document-uploaded") {
    return "Sənəd yükləndi.";
  }

  if (success === "application-submitted") {
    return "Müraciət göndərildi.";
  }

  if (success === "message-sent") {
    return "Mesaj göndərildi.";
  }

  return "Əməliyyat tamamlandı.";
}

function getErrorMessage(error?: string) {
  if (error === "file-required") {
    return "Yükləmək üçün sənəd seçin.";
  }

  if (error === "missing-documents") {
    return "Göndərməzdən əvvəl tələb olunan sənədləri yükləyin.";
  }

  if (error === "forbidden") {
    return "Bu əməliyyat sizin portalınızda mümkün deyil.";
  }

  if (error === "profile") {
    return "Profil yenilənmədi. E-poçt, pasport və şəxsiyyət məlumatlarını yoxlayın.";
  }

  if (error === "upload") {
    return "Sənəd yüklənmədi.";
  }

  if (error === "file-too-large") {
    return "Sənədin həcmi 25 MB-dan çox olmamalıdır.";
  }

  if (error === "file-type") {
    return "Bu sənəd formatı qəbul edilmir.";
  }

  if (error === "document-locked") {
    return "Bu müraciət statusunda sənəd yükləmək artıq mümkün deyil.";
  }

  if (error === "document-archived") {
    return "Bu sənəd arxivdədir və yenidən yüklənə bilməz.";
  }

  if (error === "document-upload-partial") {
    return "Müraciət saxlanıldı, amma bir sənəd yüklənə bilmədi. Onu sənədlər bölməsindən yenidən yükləyin.";
  }

  if (error === "message-empty") {
    return "Mesaj boş ola bilməz.";
  }

  if (error === "message-too-long") {
    return "Mesaj çox uzundur.";
  }

  if (error === "message-forbidden") {
    return "Bu mesajı göndərmək icazəniz yoxdur.";
  }

  return "Əməliyyat tamamlana bilmədi.";
}
