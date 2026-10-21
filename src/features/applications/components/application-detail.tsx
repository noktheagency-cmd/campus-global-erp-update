import Image from "next/image";
import {
  ArrowLeftIcon,
  BellRingIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleAlertIcon,
  ClockIcon,
  FileTextIcon,
  GraduationCapIcon,
  HistoryIcon,
  SendIcon,
  UserRoundIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ApplicationChoicesReviewList,
  ApplicationDetailControls,
  type ApplicationDetailFeedback,
  type ApplicationDetailChoiceRow,
  type ApplicationDetailDocumentRequestRow,
  ApplicationDetailHeaderActions,
  ApplicationDocumentsReviewList,
  type ApplicationDetailDocumentRow,
  type ApplicationDetailStudentField,
} from "@/features/applications/components/application-detail-controls";
import {
  APPLICATION_DOCUMENT_GROUPS,
  APPLICATION_STATUS_LABELS,
} from "@/features/applications/constants";
import {
  type ApplicationDetailData,
  formatApplicationMoney,
  formatDateTime,
  formatEnumLabel,
} from "@/features/applications/data/detail-data";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { AgentPayoutPreview } from "@/features/commissions/agent-payout-preview";
import { AgentPayoutPreviewCard } from "@/features/commissions/components/agent-payout-preview-card";

export function ApplicationDetail({
  canManageDocuments = false,
  canManageDocumentRequests = false,
  canManageStatus = false,
  canRespondDocumentRequests = false,
  canUploadDocuments = false,
  canSubmitDraft = false,
  data,
  error,
  isStudentPortal = false,
  payoutPreview = null,
  success,
}: {
  canManageDocuments?: boolean;
  canManageDocumentRequests?: boolean;
  canManageStatus?: boolean;
  canRespondDocumentRequests?: boolean;
  canUploadDocuments?: boolean;
  canSubmitDraft?: boolean;
  data: ApplicationDetailData;
  error?: string;
  isStudentPortal?: boolean;
  payoutPreview?: AgentPayoutPreview | null;
  success?: string;
}) {
  const { activities, application, documentRequests, documents, summary } = data;
  const studentName =
    `${application.student.firstName} ${application.student.lastName}`.trim();
  const studentFields = buildStudentFields(data, studentName);
  const choiceRows = application.choices.map((choice) =>
    mapChoiceRow(
      choice,
      application.status,
      documentRequests.filter(
        (request) => request.applicationChoiceId === choice.id,
      ),
    ),
  );
  const documentRows = documents.map((document) =>
    mapDocumentRow(document),
  );
  const feedback = getFeedbackMessage(error, success);

  return (
    <ApplicationDetailControls
      applicationId={application.id}
      canManageDocuments={canManageDocuments}
      canManageDocumentRequests={canManageDocumentRequests}
      canManageStatus={canManageStatus}
      canRespondDocumentRequests={canRespondDocumentRequests}
      canUploadDocuments={canUploadDocuments}
      canSubmitDraft={canSubmitDraft}
      choices={choiceRows}
      currentStatus={application.status}
      documents={documentRows}
      feedback={feedback}
      internalNotes={application.internalNotes ?? ""}
      isStudentPortal={isStudentPortal}
      latestStatusReason={summary.latestStatusReason}
      missingRequiredDocuments={summary.missingRequiredDocuments}
      statusLabel={summary.statusLabel}
      studentFields={studentFields}
      studentName={studentName}
      totalDocuments={summary.totalDocuments}
      uploadedDocuments={summary.uploadedDocuments}
    >
      <div className="min-h-full bg-[#f6f9ff] px-4 py-4 sm:px-5 lg:px-8 lg:py-5">
      <section className="rounded-[1.15rem] border border-[#dce6f4] bg-white p-3 shadow-[0_14px_38px_rgba(29,78,216,0.045)] lg:p-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
          <div className="flex min-w-0 items-start gap-3">
            <Button
              asChild
              className="mt-0.5 size-9 rounded-xl border-[#dce6f4] bg-white text-[#34456c] hover:bg-[#f6f9ff] hover:text-[#1559b7]"
              size="icon"
              variant="outline"
            >
              <Link href="/applications" aria-label="Müraciətlərə qayıt">
                <ArrowLeftIcon className="size-4" />
              </Link>
            </Button>
            <StudentProfileAvatar
              name={studentName}
              photoUrl={application.student.photoUrl ?? ""}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-[#07183a] sm:text-2xl">
                  {studentName}
                </h1>
                <StatusBadge prominent status={application.status} />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm font-semibold text-[#5d6d91]">
                <span className="font-black text-[#34456c]">
                  {application.code}
                </span>
                <span>{application.period.name}</span>
                <span>{application.country}</span>
                <span>{application.educationLevel.name}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <InfoPill icon={UserRoundIcon} text={summary.agentLabel} />
                <InfoPill
                  icon={ClockIcon}
                  text={`Yeniləndi: ${summary.updatedAt}`}
                />
                <InfoPill
                  icon={CheckCircle2Icon}
                  text={`${summary.uploadedDocuments}/${summary.totalDocuments} sənəd`}
                />
                {summary.pendingDocumentRequests > 0 ? (
                  <InfoPill
                    icon={BellRingIcon}
                    text={`${summary.pendingDocumentRequests} aktiv tapşırıq`}
                  />
                ) : null}
              </div>
            </div>
          </div>
          <ApplicationDetailHeaderActions />
        </div>
      </section>

      <section className="mt-3 grid gap-2 rounded-[1.15rem] border border-[#dce6f4] bg-white/80 p-2 shadow-[0_12px_32px_rgba(29,78,216,0.04)] backdrop-blur sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          detail={summary.statusLabel}
          icon={SendIcon}
          label="Status"
          tone="blue"
          value={summary.submittedAt}
        />
        <SummaryMetric
          detail="Zəruri sənədlər"
          icon={CircleAlertIcon}
          label="Çatışmayan"
          tone={summary.missingRequiredDocuments > 0 ? "red" : "green"}
          value={String(summary.missingRequiredDocuments)}
        />
        <SummaryMetric
          detail="Seçilmiş ixtisas"
          icon={GraduationCapIcon}
          label="Seçimlər"
          tone="green"
          value={String(application.choices.length)}
        />
        <SummaryMetric
          detail="Yaradılma tarixi"
          icon={ClockIcon}
          label="Yaradıldı"
          tone="amber"
          value={summary.createdAt}
        />
      </section>

      <section className="mt-4 grid gap-3">
        <StaticPanel
          description="Universitet, ixtisas, qiymət və prioritet sırası."
          icon={GraduationCapIcon}
          meta={`${application.choices.length} seçim`}
          title="İxtisas seçimləri"
        >
          <ApplicationChoicesReviewList />
        </StaticPanel>
        {payoutPreview ? <AgentPayoutPreviewCard preview={payoutPreview} /> : null}
        <DetailDisclosure
          description="Namizədin son təhsil və imtahan məlumatları."
          icon={FileTextIcon}
          meta={`${application.educationRecords.length} təhsil · ${application.examRecords.length} imtahan`}
          title="Təhsil və imtahan"
        >
          <EducationSection
            educationRecords={application.educationRecords}
            examRecords={application.examRecords}
          />
        </DetailDisclosure>

        <DetailDisclosure
          defaultOpen
          description="Sənədlər private storage-dan təhlükəsiz link ilə açılır."
          icon={FileTextIcon}
          id="documents"
          meta={`${summary.uploadedDocuments}/${summary.totalDocuments} hazır`}
          title="Sənədlər"
        >
          <ApplicationDocumentsReviewList />
        </DetailDisclosure>

        <DetailDisclosure
          description="Müraciət üzərində görülən son əməliyyatlar."
          icon={HistoryIcon}
          meta={`${activities.length} qeyd`}
          title="Loglar"
        >
          <ActivityList activities={activities} />
        </DetailDisclosure>
      </section>
      </div>
    </ApplicationDetailControls>
  );
}

function StudentProfileAvatar({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl: string;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  if (photoUrl) {
    return (
      <Image
        alt={name}
        className="size-12 shrink-0 rounded-full border-2 border-white object-cover shadow-[0_0_0_1px_#dce6f4,0_8px_18px_rgba(29,78,216,0.12)]"
        height={48}
        src={photoUrl}
        unoptimized
        width={48}
      />
    );
  }

  return (
    <span
      aria-label={`${name} profil şəkli`}
      className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#e8f1ff] text-sm font-black text-[#1559b7] shadow-[0_0_0_1px_#dce6f4,0_8px_18px_rgba(29,78,216,0.1)]"
      role="img"
    >
      {initials || <UserRoundIcon className="size-5" />}
    </span>
  );
}

function buildStudentFields(
  data: ApplicationDetailData,
  studentName: string,
): ApplicationDetailStudentField[] {
  const { application, summary } = data;
  const student = application.student;

  return [
    ["fullName", "Ad Soyad", studentName],
    ["firstName", "Ad", student.firstName],
    ["lastName", "Soyad", student.lastName],
    ["fatherName", "Ata adı", student.fatherName],
    ["motherName", "Ana adı", student.motherName],
    ["birthDate", "Doğum tarixi", formatDateTime(student.birthDate)],
    ["contactEmail", "Əlaqə e-poçtu", student.contactEmail],
    ["loginEmail", "Portal e-poçtu", student.loginEmail],
    ["phone", "Telefon", student.phone],
    ["passportNo", "Pasport", student.passportNo],
    ["identityNo", "Şəxsiyyət nömrəsi", student.identityNo],
    ["citizenship", "Vətəndaşlıq", student.citizenship],
    ["gender", "Cins", student.gender],
    ["maritalStatus", "Ailə vəziyyəti", student.maritalStatus],
    ["address", "Ünvan", student.address],
    ["stage", "Mərhələ", student.stage],
    ["status", "Status", student.status],
    ["portalStatus", "Portal statusu", student.portalStatus],
    ["agent", "Agent", summary.agentLabel],
    ["studentId", "Tələbə ID", student.id],
    ["userId", "Portal istifadəçi ID", student.userId],
    ["agentId", "Agent ID", student.agentId],
    ["createdById", "Yaradan ID", student.createdById],
    ["createdAt", "Yaradılıb", formatDateTime(student.createdAt)],
    ["updatedAt", "Yenilənib", formatDateTime(student.updatedAt)],
  ].map(([id, label, value]) => ({
    id: String(id),
    label: String(label),
    value: value ? String(value) : "-",
  }));
}

function mapDocumentRow(
  document: ApplicationDetailData["documents"][number],
): ApplicationDetailDocumentRow {
  const groupLabel =
    APPLICATION_DOCUMENT_GROUPS[
      document.documentGroup as keyof typeof APPLICATION_DOCUMENT_GROUPS
    ] ?? document.documentGroup;

  return {
    accessUrl: document.accessUrl,
    documentGroup: document.documentGroup,
    documentGroupLabel: groupLabel,
    documentKey: document.documentKey,
    downloadUrl: document.downloadUrl,
    fileName: document.fileName,
    fileSize: document.fileSize,
    isRequired: document.isRequired,
    mimeType: document.mimeType,
    notes: document.notes,
    reviewedAt: document.reviewedAt
      ? formatDateTime(document.reviewedAt)
      : null,
    reviewedBy:
      document.reviewedBy?.name ?? document.reviewedBy?.email ?? null,
    status: document.status,
    title: document.title,
    uploadedAt: document.uploadedAt
      ? formatDateTime(document.uploadedAt)
      : null,
    uploadedBy:
      document.uploadedBy?.name ?? document.uploadedBy?.email ?? null,
  };
}

function mapChoiceRow(
  choice: ApplicationDetailData["application"]["choices"][number],
  applicationStatus: string,
  documentRequests: ApplicationDetailData["documentRequests"],
): ApplicationDetailChoiceRow {
  const tuition = choice.tuition;
  const status = choice.status ?? applicationStatus;
  const price = tuition?.discountedTuitionFee ?? tuition?.tuitionFee ?? null;

  return {
    campusName: choice.program.campus?.name ?? null,
    city: choice.university.city ?? "-",
    decidedAt: choice.decidedAt ? formatDateTime(choice.decidedAt) : null,
    decidedBy: choice.decidedBy?.name ?? choice.decidedBy?.email ?? null,
    documentRequests: documentRequests.map(mapDocumentRequestRow),
    educationLevel: choice.program.educationLevel?.name ?? "-",
    id: choice.id,
    language: choice.program.educationLanguage?.name ?? "-",
    price: formatApplicationMoney(price, tuition?.currency ?? "USD") || "-",
    priority: choice.priority,
    programName: choice.program.name,
    status,
    statusLabel:
      APPLICATION_STATUS_LABELS[
        status as keyof typeof APPLICATION_STATUS_LABELS
      ] ?? formatEnumLabel(status),
    statusReason: choice.statusReason,
    universityId: choice.university.id,
    universityName: choice.university.name,
    universityType: choice.university.schoolType ?? "-",
  };
}

function mapDocumentRequestRow(
  request: ApplicationDetailData["documentRequests"][number],
): ApplicationDetailDocumentRequestRow {
  return {
    accessUrl: request.accessUrl,
    acknowledgedAt: request.acknowledgedAt
      ? formatDateTime(request.acknowledgedAt)
      : null,
    amount:
      request.amount === null
        ? null
        : formatApplicationMoney(request.amount, request.currency ?? "USD"),
    applicationChoiceId: request.applicationChoiceId,
    completedAt: request.completedAt
      ? formatDateTime(request.completedAt)
      : null,
    createdAt: formatDateTime(request.createdAt),
    createdBy: request.createdBy?.name ?? request.createdBy?.email ?? null,
    currency: request.currency,
    deadline: formatDateTime(request.deadline),
    deadlineAt: request.deadline.toISOString(),
    documentType: request.documentType,
    downloadUrl: request.downloadUrl,
    fileName: request.fileName,
    fileSize: request.fileSize,
    id: request.id,
    instructions: request.instructions,
    isOverdue:
      request.status !== "COMPLETED" &&
      request.status !== "CANCELLED" &&
      request.deadline.getTime() < Date.now(),
    responseAccessUrl: request.responseAccessUrl,
    responseDate: request.responseDate
      ? request.responseDate.toISOString().slice(0, 10)
      : null,
    responseDownloadUrl: request.responseDownloadUrl,
    responseFileName: request.responseFileName,
    responseFileSize: request.responseFileSize,
    respondedBy: request.respondedBy?.name ?? request.respondedBy?.email ?? null,
    responseNote: request.responseNote,
    responseType: request.responseType,
    status: request.status,
    title: request.title,
  };
}

function getFeedbackMessage(
  error?: string,
  success?: string,
): ApplicationDetailFeedback {
  if (error) {
    return {
      message: getErrorMessage(error),
      type: "error",
    };
  }

  if (success) {
    return {
      message: getSuccessMessage(success),
      type: "success",
    };
  }

  return null;
}

export function WorkflowStatusStrip({
  latestStatusReason,
  missingRequiredDocuments,
  status,
  statusLabel,
  totalDocuments,
  uploadedDocuments,
}: {
  latestStatusReason?: string | null;
  missingRequiredDocuments: number;
  status: string;
  statusLabel: string;
  totalDocuments: number;
  uploadedDocuments: number;
}) {
  const needsDocuments = missingRequiredDocuments > 0;
  const isDraft = status === "DRAFT";
  const tone = getWorkflowTone(status, needsDocuments);
  const message = getWorkflowMessage({
    isDraft,
    missingRequiredDocuments,
    needsDocuments,
    status,
  });
  const toneClasses = getWorkflowToneClasses(tone);

  return (
    <section
      className={cn(
        "mt-4 grid gap-3 rounded-[1.05rem] border px-4 py-3 shadow-[0_10px_26px_rgba(29,78,216,0.035)] lg:grid-cols-[1fr_auto]",
        toneClasses.container,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-white",
            toneClasses.icon,
          )}
        >
          {tone === "red" ? (
            <CircleAlertIcon className="size-4" />
          ) : (
            <CheckCircle2Icon className="size-4" />
          )}
        </div>
        <div>
          <div className="text-sm font-black text-[#07183a]">{message}</div>
          <div className="mt-1 text-xs font-semibold text-[#637392]">
            Cari status: {statusLabel} · Yüklənən sənədlər: {uploadedDocuments}/
            {totalDocuments}
          </div>
          {latestStatusReason ? (
            <div className="mt-2 rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-xs font-semibold leading-5 text-[#51627f]">
              <span className="font-black text-[#07183a]">Səbəb: </span>
              {latestStatusReason}
            </div>
          ) : null}
        </div>
      </div>
      <Button
        asChild
        className="h-9 rounded-xl border-[#dce6f4] bg-white px-4 text-xs font-black text-[#1559b7] hover:bg-white hover:text-[#104fa5]"
        size="sm"
        variant="outline"
      >
        <a href="#documents">Sənədlərə keç</a>
      </Button>
    </section>
  );
}

function getWorkflowTone(status: string, needsDocuments: boolean) {
  if (status === "REJECTED" || status === "INVALID_DOCUMENTS") {
    return "red";
  }

  if (status === "ACCEPTED" || status === "OFFER" || status === "ENROLLED") {
    return "green";
  }

  if (status === "SUBMITTED" || status === "UNDER_REVIEW") {
    return "blue";
  }

  if (needsDocuments || status === "DRAFT") {
    return "amber";
  }

  if (status === "ARCHIVED") {
    return "slate";
  }

  return "blue";
}

function getWorkflowMessage({
  isDraft,
  missingRequiredDocuments,
  needsDocuments,
  status,
}: {
  isDraft: boolean;
  missingRequiredDocuments: number;
  needsDocuments: boolean;
  status: string;
}) {
  if (status === "REJECTED") {
    return "Müraciət üzrə qəbul uğursuz oldu";
  }

  if (status === "INVALID_DOCUMENTS") {
    return "Sənədlərdə düzəliş tələb olunur";
  }

  if (status === "ACCEPTED" || status === "OFFER" || status === "ENROLLED") {
    return "Müraciət qəbul olundu";
  }

  if (status === "SUBMITTED") {
    return "Müraciət baxışa göndərildi";
  }

  if (status === "UNDER_REVIEW") {
    return "Müraciət yoxlanılır";
  }

  if (needsDocuments) {
    return `${missingRequiredDocuments} zəruri sənəd çatışmır`;
  }

  if (isDraft) {
    return "Müraciət göndərilməyə hazırdır";
  }

  if (status === "ARCHIVED") {
    return "Müraciət arxivdədir";
  }

  return "Müraciət izlənilir";
}

function getWorkflowToneClasses(tone: string) {
  if (tone === "red") {
    return {
      container: "border-red-100 bg-red-50",
      icon: "bg-red-500",
    };
  }

  if (tone === "green") {
    return {
      container: "border-emerald-100 bg-emerald-50",
      icon: "bg-emerald-500",
    };
  }

  if (tone === "amber") {
    return {
      container: "border-amber-100 bg-amber-50",
      icon: "bg-amber-500",
    };
  }

  if (tone === "slate") {
    return {
      container: "border-slate-200 bg-slate-50",
      icon: "bg-slate-500",
    };
  }

  return {
    container: "border-blue-100 bg-blue-50",
    icon: "bg-[#1559b7]",
  };
}

function ChoicesTable({
  choices,
}: {
  choices: ApplicationDetailData["application"]["choices"];
}) {
  if (choices.length === 0) {
    return <EmptyState text="İxtisas seçimi yoxdur." />;
  }

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[840px]">
        <TableHeader className="bg-[#f6f9ff]">
          <TableRow>
            <TableHead>Prioritet</TableHead>
            <TableHead>Universitet</TableHead>
            <TableHead>İxtisas</TableHead>
            <TableHead>Dil</TableHead>
            <TableHead>Şəhər</TableHead>
            <TableHead className="text-right">Qiymət</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {choices.map((choice) => {
            const tuition = choice.tuition;
            const price =
              tuition?.discountedTuitionFee ?? tuition?.tuitionFee ?? null;

            return (
              <TableRow key={choice.id}>
                <TableCell className="font-black text-[#1559b7]">
                  {choice.priority}
                </TableCell>
                <TableCell>
                  <div className="font-bold text-[#07183a]">
                    {choice.university.name}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-[#71809f]">
                    {choice.university.schoolType}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-bold text-[#07183a]">
                    {choice.program.name}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-[#71809f]">
                    {choice.program.educationLevel?.name ?? "Pillə yoxdur"}
                  </div>
                </TableCell>
                <TableCell>
                  {choice.program.educationLanguage?.name ?? "-"}
                </TableCell>
                <TableCell>{choice.university.city}</TableCell>
                <TableCell className="text-right font-black text-[#07183a]">
                  {formatApplicationMoney(price, tuition?.currency ?? "USD") ||
                    "-"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

void ChoicesTable;

function EducationSection({
  educationRecords,
  examRecords,
}: {
  educationRecords: ApplicationDetailData["application"]["educationRecords"];
  examRecords: ApplicationDetailData["application"]["examRecords"];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-[#edf2f8] bg-[#fbfdff] p-3.5">
        <h3 className="font-black text-[#07183a]">Təhsil Tarixçəsi</h3>
        <div className="mt-3 grid gap-3">
          {educationRecords.length > 0 ? (
            educationRecords.map((record) => (
              <div key={record.id} className="rounded-xl bg-white p-3">
                <div className="font-bold text-[#07183a]">
                  {record.institutionName}
                </div>
                <div className="mt-1 text-sm text-[#637392]">
                  {[record.country, record.city].filter(Boolean).join(", ") ||
                    "Ölkə/şəhər yoxdur"}
                </div>
                <div className="mt-2 text-xs font-semibold text-[#71809f]">
                  {record.startYear ?? "-"} - {record.endYear ?? "-"} ·{" "}
                  {record.averageScore ?? "Bal yoxdur"}
                </div>
              </div>
            ))
          ) : (
            <EmptyState text="Təhsil məlumatı yoxdur." />
          )}
        </div>
      </div>
      <div className="rounded-xl border border-[#edf2f8] bg-[#fbfdff] p-3.5">
        <h3 className="font-black text-[#07183a]">İmtahanlar</h3>
        <div className="mt-3 grid gap-3">
          {examRecords.length > 0 ? (
            examRecords.map((exam) => (
              <div key={exam.id} className="rounded-xl bg-white p-3">
                <div className="font-bold text-[#07183a]">{exam.examName}</div>
                <div className="mt-1 text-sm text-[#637392]">
                  {exam.score ?? "-"} / {exam.maxScore ?? "-"}
                </div>
                <div className="mt-2 text-xs font-semibold text-[#71809f]">
                  {formatDateTime(exam.examDate)}
                </div>
              </div>
            ))
          ) : (
            <EmptyState text="İmtahan məlumatı yoxdur." />
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityList({
  activities,
}: {
  activities: ApplicationDetailData["activities"];
}) {
  if (activities.length === 0) {
    return <EmptyState text="Aktivlik yoxdur." />;
  }

  return (
    <div className="grid max-h-[360px] gap-3 overflow-y-auto pr-1">
      {activities.map((activity) => {
        const status = readActivityValue(activity.newValue, "status");
        const reason = readActivityValue(activity.newValue, "reason");
        const actor = activity.user?.name ?? activity.user?.email ?? "Sistem";

        return (
          <div
            className="flex gap-3 rounded-xl border border-[#edf2f8] bg-[#fbfdff] p-3"
            key={activity.id}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ff] text-[#1559b7]">
              <HistoryIcon className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-[#07183a]">
                  {getActivityActionLabel(activity.action)}
                </span>
                {status ? <StatusBadge status={status} /> : null}
              </div>
              <div className="mt-1 text-sm font-semibold text-[#637392]">
                {getActivityEntityLabel(activity.entityType)} · {actor} ·{" "}
                {formatDateTime(activity.createdAt)}
              </div>
              {reason ? (
                <div className="mt-2 rounded-lg border border-[#dce6f4] bg-white px-3 py-2 text-xs font-semibold leading-5 text-[#51627f]">
                  <span className="font-black text-[#07183a]">Səbəb: </span>
                  {reason}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DetailDisclosure({
  children,
  className,
  defaultOpen = false,
  description,
  icon: Icon,
  id,
  meta,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
  description: string;
  icon: typeof FileTextIcon;
  id?: string;
  meta?: string;
  title: string;
}) {
  if (children === null) {
    return null;
  }

  return (
    <details
      className={cn(
        "group overflow-hidden rounded-[1.15rem] border border-[#dce6f4] bg-white shadow-[0_12px_34px_rgba(29,78,216,0.04)]",
        className,
      )}
      id={id}
      open={defaultOpen || undefined}
    >
      <summary className="grid cursor-pointer list-none gap-3 bg-[#fbfdff] px-4 py-3 transition hover:bg-[#f6f9ff] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ff] text-[#1559b7]">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="min-w-0 text-sm font-black text-[#07183a]">
                {title}
              </h2>
              {meta ? (
                <Badge className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[11px] font-black text-[#1559b7]">
                  {meta}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-xs font-semibold leading-5 text-[#637392]">
              {description}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <span className="hidden rounded-full bg-white px-3 py-1 text-xs font-black text-[#637392] sm:inline-flex">
            Detallar
          </span>
          <ChevronDownIcon className="size-5 text-[#637392] transition-transform group-open:rotate-180" />
        </div>
      </summary>
      <div className="border-t border-[#edf2f8] p-4">{children}</div>
    </details>
  );
}

function StaticPanel({
  children,
  className,
  description,
  icon: Icon,
  meta,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  description: string;
  icon: typeof FileTextIcon;
  meta?: string;
  title: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[1.15rem] border border-[#dce6f4] bg-white shadow-[0_12px_34px_rgba(29,78,216,0.04)]",
        className,
      )}
    >
      <div className="grid gap-3 border-b border-[#edf2f8] bg-[#fbfdff] px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ff] text-[#1559b7]">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="min-w-0 text-sm font-black text-[#07183a]">
                {title}
              </h2>
              {meta ? (
                <Badge className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[11px] font-black text-[#1559b7]">
                  {meta}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-xs font-semibold leading-5 text-[#637392]">
              {description}
            </p>
          </div>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function SummaryMetric({
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: typeof FileTextIcon;
  label: string;
  tone: "amber" | "blue" | "green" | "red";
  value: string;
}) {
  const colors = {
    amber: {
      accent: "bg-amber-400",
      icon: "bg-amber-50 text-amber-600 ring-amber-100",
      value: "text-amber-700",
    },
    blue: {
      accent: "bg-[#1559b7]",
      icon: "bg-blue-50 text-[#1559b7] ring-blue-100",
      value: "text-[#07183a]",
    },
    green: {
      accent: "bg-emerald-500",
      icon: "bg-emerald-50 text-emerald-600 ring-emerald-100",
      value: "text-emerald-700",
    },
    red: {
      accent: "bg-red-500",
      icon: "bg-red-50 text-red-600 ring-red-100",
      value: "text-red-600",
    },
  };

  return (
    <div className="relative overflow-hidden rounded-[1rem] border border-[#e3ecf8] bg-white px-3 py-2.5 shadow-[0_10px_24px_rgba(29,78,216,0.045)] transition hover:-translate-y-0.5 hover:border-[#cfe0f6] hover:shadow-[0_16px_32px_rgba(29,78,216,0.08)]">
      <div
        className={cn(
          "absolute inset-y-3 left-0 w-1 rounded-r-full",
          colors[tone].accent,
        )}
      />
      <div className="flex min-w-0 items-center gap-2.5 pl-1">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-xl ring-1",
            colors[tone].icon,
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-0.5">
          <div className="min-w-0">
            <div className="truncate text-[10px] font-black uppercase tracking-wide text-[#7d8ca9]">
              {label}
            </div>
            <div
              className={cn(
                "mt-0.5 truncate text-base font-black leading-none",
                colors[tone].value,
              )}
            >
              {value || "-"}
            </div>
          </div>
          <div className="max-w-[9rem] truncate rounded-full bg-[#f5f8fd] px-2.5 py-1 text-right text-[11px] font-bold text-[#637392] ring-1 ring-[#edf2f8]">
            {detail}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  prominent = false,
  status,
}: {
  prominent?: boolean;
  status: string;
}) {
  const label =
    APPLICATION_STATUS_LABELS[
      status as keyof typeof APPLICATION_STATUS_LABELS
    ] ?? formatEnumLabel(status);

  const tone =
    status === "ACCEPTED" || status === "OFFER" || status === "ENROLLED"
      ? "green"
      : status === "INVALID_DOCUMENTS"
        ? "red"
        : status === "DRAFT"
          ? "amber"
          : status === "REJECTED"
            ? "red"
            : "blue";

  return (
    <Badge
      className={cn(
        prominent
          ? "rounded-full border px-4 py-1.5 text-sm font-black shadow-[0_10px_24px_rgba(21,89,183,0.22)] ring-4 ring-offset-0"
          : "rounded-full border px-3 py-1 text-xs font-black",
        prominent ? prominentBadgeTone(tone) : badgeTone(tone),
      )}
    >
      {label}
    </Badge>
  );
}

function prominentBadgeTone(tone: "amber" | "blue" | "green" | "red" | "slate") {
  return cn(
    tone === "green" &&
      "border-emerald-500 bg-emerald-500 text-white ring-emerald-100",
    tone === "amber" &&
      "border-amber-500 bg-amber-500 text-white ring-amber-100",
    tone === "red" && "border-red-500 bg-red-500 text-white ring-red-100",
    tone === "blue" && "border-[#1559b7] bg-[#1559b7] text-white ring-blue-100",
    tone === "slate" &&
      "border-slate-500 bg-slate-600 text-white ring-slate-100",
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

function getActivityActionLabel(action: string) {
  const labels: Record<string, string> = {
    CREATED: "Yaradıldı",
    DOCUMENT_UPLOADED: "Sənəd yükləndi",
    PRICE_UPDATED: "Qiymət yeniləndi",
    STATUS_CHANGED: "Status dəyişdirildi",
    SUBMITTED: "Göndərildi",
    UPDATED: "Yeniləndi",
  };

  return labels[action] ?? formatEnumLabel(action);
}

function getActivityEntityLabel(entityType: string) {
  if (entityType === "APPLICATION_CHOICE") {
    return "İxtisas seçimi";
  }

  const labels: Record<string, string> = {
    APPLICATION: "Müraciət",
    APPLICATION_DOCUMENT: "Sənəd",
    APPLICATION_DOCUMENT_REQUEST: "İxtisas sənədi",
    STUDENT: "Tələbə",
  };

  return labels[entityType] ?? formatEnumLabel(entityType);
}

function readActivityValue(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  const field = (value as Record<string, unknown>)[key];

  return typeof field === "string" ? field : "";
}

function InfoPill({
  icon: Icon,
  text,
}: {
  icon: typeof FileTextIcon;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3f7fc] px-3 py-1 text-xs font-bold text-[#52627f]">
      <Icon className="size-3.5 text-[#1559b7]" />
      {text}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-24 items-center justify-center rounded-2xl border border-dashed border-[#dce6f4] bg-[#fbfdff] px-4 text-center text-sm font-semibold text-[#637392]">
      {text}
    </div>
  );
}

function getSuccessMessage(success?: string) {
  if (success === "application-submitted") {
    return "Müraciət təsdiqləndi.";
  }

  if (success === "application-draft") {
    return "Müraciət draft olaraq saxlanıldı.";
  }

  if (success === "status-updated") {
    return "Status yeniləndi.";
  }

  if (success === "document-uploaded") {
    return "Sənəd yükləndi.";
  }

  if (success === "document-added") {
    return "Yeni sənəd əlavə edildi.";
  }

  if (success === "document-status") {
    return "Sənəd statusu yeniləndi.";
  }

  if (success === "document-reviewed") {
    return "Sənəd baxışı qeyd olundu.";
  }

  if (success === "request-created") {
    return "Sənəd tələbəyə göndərildi və bildiriş yaradıldı.";
  }

  if (success === "request-acknowledged") {
    return "Sənəd təsdiqləndi.";
  }

  if (success === "request-completed") {
    return "Cavab sənədi yükləndi və proses tamamlandı.";
  }

  return "Əməliyyat tamamlandı.";
}

function getErrorMessage(error?: string) {
  if (error === "missing-documents") {
    return "Göndərmə üçün zəruri sənədlər yüklənməlidir.";
  }

  if (error === "file-required") {
    return "Yükləmək üçün fayl seçin.";
  }

  if (error === "document-category") {
    return "Sənəd kateqoriyasını seçin.";
  }

  if (error === "request-form") {
    return "Sənəd adı, növü, cavab forması və gələcək deadline daxil edilməlidir.";
  }

  if (error === "request-currency") {
    return "Ödəniş tapşırığı üçün 3 simvolluq valyuta kodu daxil edin.";
  }

  if (error === "request-choice") {
    return "Seçilmiş ixtisas bu müraciətə aid deyil.";
  }

  if (error === "request-create") {
    return "Sənəd göndərilmədi. Məlumatları və storage bağlantısını yoxlayın.";
  }

  if (error === "request") {
    return "Sənəd tapşırığı tapılmadı.";
  }

  if (error === "request-closed") {
    return "Bu sənəd tapşırığı artıq bağlıdır.";
  }

  if (error === "request-response-form") {
    return "Cavab tarixini və faylı düzgün daxil edin.";
  }

  if (error === "request-response-locked") {
    return "Cavab yükləməzdən əvvəl sənədi təsdiqləyin.";
  }

  if (error === "request-response-upload") {
    return "Cavab sənədi yüklənmədi. Yenidən cəhd edin.";
  }

  if (error === "upload") {
    return "Sənəd yüklənmədi. Supabase service role/secret key və bucket icazələrini yoxlayın.";
  }

  if (error === "document-upload-partial") {
    return "Müraciət saxlanıldı, amma sənədlərdən biri yüklənmədi. Sənədlər bölməsindən yenidən yükləyin.";
  }

  if (error === "file-too-large") {
    return "Fayl maksimum 25 MB ola bilər.";
  }

  if (error === "file-type") {
    return "Bu fayl formatı dəstəklənmir.";
  }

  if (error === "document-locked") {
    return "Bu müraciət statusunda sənəd yükləmək olmaz.";
  }

  if (error === "document-archived") {
    return "Arxivlənmiş sənədə fayl yükləmək olmaz.";
  }

  if (error === "status-transition") {
    return "Bu status keçidi ERP axınına uyğun deyil.";
  }

  if (error === "status-reason") {
    return "Bu status üçün bildiriş səbəbi yazılmalıdır.";
  }

  if (error === "forbidden") {
    return "Bu statusu yalnız super admin dəyişə bilər.";
  }

  if (error === "document-status") {
    return "Sənəd statusu bu formada dəyişdirilə bilməz.";
  }

  if (error === "document") {
    return "Sənəd tapılmadı.";
  }

  return "Əməliyyat icra olunmadı.";
}
