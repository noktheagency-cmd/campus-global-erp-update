"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleAlertIcon,
  CopyIcon,
  DownloadIcon,
  FileTextIcon,
  GraduationCapIcon,
  HistoryIcon,
  IdCardIcon,
  MailIcon,
  MapPinIcon,
  MessageCircleIcon,
  PhoneIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getApplicationStatusHeaderSurface,
  getApplicationStatusSurface,
  getApplicationStatusTone,
} from "@/features/applications/application-status-tone";
import { StudentChatPanel } from "@/features/applications/components/student-chat-panel";
import { updateAgentStudentProfileAction } from "@/features/students/actions";
import type { ApplicationStudentDetailData } from "@/features/applications/data/student-detail-data";
import type { ApplicationStatus } from "@/features/applications/types";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type FloatingPanel = "chat" | null;

export function ApplicationStudentDetail({
  data,
  error,
  success,
}: {
  data: ApplicationStudentDetailData;
  error?: string;
  success?: string;
}) {
  const { applications, generalDocuments, student, summary } = data;
  const returnTo = `/applications/students/${student.id}`;
  const [profileOpen, setProfileOpen] = useState(false);
  const [floatingPanel, setFloatingPanel] = useState<FloatingPanel>(null);
  const [logsOpen, setLogsOpen] = useState(false);
  const [openApplications, setOpenApplications] = useState<Set<string>>(
    () => new Set(),
  );

  function toggleApplication(applicationId: string) {
    setOpenApplications((current) => {
      const next = new Set(current);

      if (next.has(applicationId)) {
        next.delete(applicationId);
      } else {
        next.add(applicationId);
      }

      return next;
    });
  }

  return (
    <div className="min-h-full bg-[#f6f9ff] px-4 py-5 pb-28 sm:px-5 lg:px-8 lg:py-7">
      <section className="rounded-[1.35rem] border border-[#dce6f4] bg-white p-4 shadow-[0_14px_38px_rgba(29,78,216,0.045)] lg:p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Button
              asChild
              className="mt-0.5 size-10 rounded-xl border-[#dce6f4] bg-white text-[#34456c] hover:bg-[#f6f9ff] hover:text-[#1559b7]"
              size="icon"
              variant="outline"
            >
              <Link href="/applications" aria-label="Müraciətlərə qayıt">
                <ArrowLeftIcon className="size-4" />
              </Link>
            </Button>
            <StudentAvatar name={student.name} src={student.photoUrl} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-[#07183a]">
                  {student.name || "Adsız tələbə"}
                </h1>
                <Badge className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-black text-[#0b66ff]">
                  {summary.totalApplications} müraciət
                </Badge>
                <Badge className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-xs font-black text-emerald-600">
                  {student.status || "Status yoxdur"}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm font-semibold text-[#5d6d91]">
                <span>{student.stage || "Mərhələ yoxdur"}</span>
                <span>
                  {student.citizenship || "Vətəndaşlıq qeyd olunmayıb"}
                </span>
                <span>{student.agent}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <InfoPill
                  icon={MailIcon}
                  text={student.contactEmail || "E-poçt yoxdur"}
                />
                <InfoPill
                  icon={PhoneIcon}
                  text={student.phone || "Telefon yoxdur"}
                />
                <InfoPill
                  icon={MapPinIcon}
                  text={student.address || "Ünvan yoxdur"}
                />
              </div>
              <Button
                className="mt-3 h-10 rounded-xl border-[#dce6f4] bg-white px-4 text-xs font-black text-[#1559b7] hover:bg-[#eef5ff]"
                onClick={() => setProfileOpen(true)}
                type="button"
                variant="outline"
              >
                <UserRoundIcon data-icon="inline-start" />
                Bütün tələbə məlumatlarını göstər
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[560px]">
            <SummaryTile
              label="Cəmi müraciət"
              value={summary.totalApplications}
            />
            <SummaryTile
              label="Aktiv müraciət"
              value={summary.activeApplications}
              tone="blue"
            />
            <SummaryTile
              label="Sənəd"
              value={`${summary.uploadedDocuments}/${summary.totalDocuments}`}
              tone={summary.missingRequiredDocuments > 0 ? "amber" : "green"}
            />
            <SummaryTile
              label="Çatışmayan"
              value={summary.missingRequiredDocuments}
              tone={summary.missingRequiredDocuments > 0 ? "red" : "green"}
            />
          </div>
        </div>
      </section>

      <FeedbackBanner error={error} success={success} />

      <Panel
        className="mt-5"
        description="İlkin qeydiyyatda və hər müraciət üzrə yüklənmiş sənədlər mənbəyinə görə kateqoriyalanıb."
        icon={FileTextIcon}
        title="Ümumi sənədlər"
      >
        <GeneralStudentDocuments
          applications={applications}
          documents={generalDocuments}
        />
      </Panel>

      <Panel
        className="mt-5"
        description="Başlıqlar yığcam saxlanılıb. Aşağı oxu ilə hər müraciətin bütün detallarını açın."
        icon={FileTextIcon}
        title="Müraciətlər"
      >
        {applications.length > 0 ? (
          <div className="grid gap-4">
            {applications.map((application) => (
              <ApplicationDossierCard
                application={application}
                expanded={openApplications.has(application.id)}
                key={application.id}
                onToggle={() => toggleApplication(application.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyMini text="Tələbənin hələ müraciəti yoxdur." />
        )}
      </Panel>

      <ActivityLogDisclosure
        activities={data.activityLogs}
        open={logsOpen}
        onToggle={() => setLogsOpen((current) => !current)}
      />

      <ProfileModal
        data={data}
        onClose={() => setProfileOpen(false)}
        open={profileOpen}
      />

      <FloatingWorkspace
        activePanel={floatingPanel}
        data={data}
        onClose={() => setFloatingPanel(null)}
        onOpen={setFloatingPanel}
        returnTo={returnTo}
      />
    </div>
  );
}

function GeneralStudentDocuments({
  applications,
  documents,
}: {
  applications: ApplicationStudentDetailData["applications"];
  documents: ApplicationStudentDetailData["generalDocuments"];
}) {
  const categories = [
    {
      description: "Tələbə profili yaradılarkən yüklənmiş fayllar",
      documents: documents.map((document) => ({
        accessUrl: document.accessUrl,
        fileName: document.fileName,
        id: document.id,
        meta: [
          document.type,
          formatFileSize(document.fileSize),
          document.uploadedAt,
          document.uploadedBy,
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
        description: `${application.country} · ${application.period} · ${application.level}`,
        documents: application.documents
          .filter((document) => document.fileName)
          .map((document) => ({
            accessUrl: document.accessUrl,
            fileName: document.fileName,
            id: document.id,
            meta: [
              document.group,
              formatFileSize(document.fileSize),
              document.uploadedAt,
              document.uploadedBy,
            ]
              .filter(Boolean)
              .join(" · "),
            status: document.status,
            title: document.title,
          })),
        id: application.id,
        statusCode: application.statusCode,
        statusLabel: application.status,
        title: `${application.code} · Müraciət sənədləri`,
      }))
      .filter((category) => category.documents.length > 0),
  ];
  const totalDocuments = categories.reduce(
    (total, category) => total + category.documents.length,
    0,
  );

  if (totalDocuments === 0) {
    return <EmptyMini text="Tələbənin ümumi sənədi yoxdur." />;
  }

  return (
    <div className="grid gap-4">
      {categories.map((category) => (
        <section
          className={cn(
            "rounded-[1.15rem] border p-3.5",
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
                    label={category.statusLabel}
                    status={category.statusCode}
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
          {category.documents.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {category.documents.map((document) => (
                <article
                  className="rounded-[1rem] border border-white/90 bg-white/90 p-3.5 shadow-[0_7px_20px_rgba(29,78,216,0.035)]"
                  key={document.id}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ff] text-[#1559b7]">
                      <FileTextIcon className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-black text-[#07183a]">
                        {document.title}
                      </h4>
                      <p className="mt-1 truncate text-xs font-semibold text-[#637392]">
                        {document.fileName}
                      </p>
                    </div>
                    {document.status ? (
                      <DocumentBadge status={document.status} />
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#e5edf8] pt-3">
                    <p className="min-w-0 truncate text-[10px] font-semibold text-[#8a97b4]">
                      {document.meta}
                    </p>
                    {document.accessUrl ? (
                      <Button
                        asChild
                        className="h-8 shrink-0 rounded-lg border-[#dce6f4] bg-white px-2.5 text-[11px] font-black text-[#1559b7] hover:bg-[#eef5ff]"
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
          ) : (
            <EmptyMini text="Bu kateqoriyada sənəd yoxdur." />
          )}
        </section>
      ))}
    </div>
  );
}

function ApplicationDossierCard({
  application,
  expanded,
  onToggle,
}: {
  application: ApplicationStudentDetailData["applications"][number];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-[1.2rem] border border-l-4 bg-white",
        getApplicationStatusSurface(application.statusCode),
      )}
    >
      <div
        className={cn(
          "grid gap-3 px-4 py-4 lg:grid-cols-[1fr_auto] lg:items-start",
          getApplicationStatusHeaderSurface(application.statusCode),
        )}
      >
        <button
          aria-expanded={expanded}
          className="min-w-0 text-left"
          onClick={onToggle}
          type="button"
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-black text-[#07183a]">{application.code}</div>
            <StatusBadge
              label={application.status}
              status={application.statusCode}
            />
            <Badge className="rounded-full border border-[#dce6f4] bg-white px-2.5 py-0.5 text-xs font-black text-[#637392]">
              {application.choices.length} seçim
            </Badge>
            {application.missingRequiredDocuments > 0 ? (
              <Badge className="rounded-full border border-red-100 bg-red-50 px-2.5 py-0.5 text-xs font-black text-red-600">
                {application.missingRequiredDocuments} sənəd çatışmır
              </Badge>
            ) : (
              <Badge className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-xs font-black text-emerald-600">
                Sənədlər hazır
              </Badge>
            )}
          </div>
          <div className="mt-1 text-xs font-semibold text-[#637392]">
            {application.country} · {application.period} · {application.level}
          </div>
          {application.latestStatusReason ? (
            <div className="mt-2 w-fit rounded-xl border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-bold leading-5 text-amber-700">
              Səbəb: {application.latestStatusReason}
            </div>
          ) : null}
        </button>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <MiniStat label="Göndərilib" value={application.submittedAt} />
          <MiniStat label="Yenilənib" value={application.updatedAt} />
          <Button
            asChild
            className="h-9 rounded-xl border-[#dce6f4] bg-white px-3 text-xs font-black text-[#1559b7] hover:bg-[#eef5ff]"
            size="sm"
            variant="outline"
          >
            <Link href={`/applications/${application.id}`}>
              Detal
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
          <Button
            aria-label={
              expanded
                ? "Müraciət detallarını bağla"
                : "Müraciət detallarını aç"
            }
            className="size-9 rounded-xl border-[#dce6f4] bg-white text-[#1559b7] hover:bg-[#eef5ff]"
            onClick={onToggle}
            size="icon"
            type="button"
            variant="outline"
          >
            <ChevronDownIcon
              className={cn(
                "size-4 transition-transform duration-300",
                expanded && "rotate-180",
              )}
            />
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "grid border-t border-[#edf2f8] transition-[grid-template-rows] duration-300 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="grid gap-4 p-4">
            {application.internalNotes ? (
              <div className="rounded-xl border border-[#dce6f4] bg-[#fbfdff] px-3 py-2 text-xs font-semibold leading-5 text-[#51627f]">
                Daxili qeyd: {application.internalNotes}
              </div>
            ) : null}

            <Subsection icon={GraduationCapIcon} title="Proqram seçimləri">
              {application.choices.length > 0 ? (
                <div className="grid gap-2">
                  {application.choices.map((choice) => (
                    <div
                      className="grid gap-3 rounded-[1rem] border border-[#edf2f8] bg-[#fbfdff] px-3 py-3 text-sm sm:grid-cols-[40px_1fr_auto]"
                      key={`${choice.priority}-${choice.program}-${choice.university}`}
                    >
                      <div className="flex size-9 items-center justify-center rounded-xl bg-[#e8f1ff] text-xs font-black text-[#1559b7]">
                        {choice.priority}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-black text-[#07183a]">
                          {choice.program}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-[#637392]">
                          {choice.university} · {choice.city} ·{" "}
                          {choice.language || "Dil qeyd olunmayıb"}
                        </div>
                      </div>
                      <div className="font-black text-[#07183a] sm:text-right">
                        {choice.price || "-"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyMini text="Proqram seçimi yoxdur." />
              )}
            </Subsection>

            <div className="grid gap-4 xl:grid-cols-2">
              <Subsection icon={BookOpenIcon} title="Təhsil məlumatları">
                {application.educationRecords.length > 0 ? (
                  <div className="grid gap-2">
                    {application.educationRecords.map((record) => (
                      <DataStrip
                        key={`${record.type}-${record.institutionName}`}
                        label={record.institutionName}
                        meta={[
                          record.type,
                          record.country,
                          record.city,
                          record.period,
                          record.gradingSystem,
                          record.averageScore,
                        ]}
                        required={record.required}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyMini text="Təhsil məlumatı yoxdur." />
                )}
              </Subsection>

              <Subsection icon={CalendarIcon} title="İmtahan məlumatları">
                {application.exams.length > 0 ? (
                  <div className="grid gap-2">
                    {application.exams.map((exam) => (
                      <DataStrip
                        key={`${exam.name}-${exam.date}`}
                        label={exam.name}
                        meta={[exam.score, exam.maxScore, exam.date]}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyMini text="İmtahan məlumatı yoxdur." />
                )}
              </Subsection>
            </div>

            <Subsection icon={IdCardIcon} title="Sənədlər">
              {application.documents.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {application.documents.map((document) => (
                    <div
                      className="rounded-[1rem] border border-[#edf2f8] bg-[#fbfdff] px-3 py-3"
                      key={document.id}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-[#07183a]">
                            {document.title}
                            {document.required ? (
                              <span className="ml-1 text-red-500">*</span>
                            ) : null}
                          </div>
                          <div className="mt-1 truncate text-xs font-semibold text-[#637392]">
                            {document.fileName || "Fayl yoxdur"}
                          </div>
                        </div>
                        <DocumentBadge status={document.status} />
                      </div>
                      <div className="mt-2 text-[11px] font-bold text-[#8a97b4]">
                        {document.group}
                        {document.uploadedAt ? ` · ${document.uploadedAt}` : ""}
                        {document.uploadedBy ? ` · ${document.uploadedBy}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyMini text="Sənəd tələbi yoxdur." />
              )}
            </Subsection>
          </div>
        </div>
      </div>
    </article>
  );
}

function ProfileModal({
  data,
  onClose,
  open,
}: {
  data: ApplicationStudentDetailData;
  onClose: () => void;
  open: boolean;
}) {
  const { student } = data;
  const [isEditing, setIsEditing] = useState(false);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
      <section className="max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-[1.35rem] border border-[#dce6f4] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between gap-3 border-b border-[#edf2f8] bg-[#fbfdff] px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-black text-[#07183a]">
              <UserRoundIcon className="size-5 text-[#0b66ff]" />
              Bütün tələbə məlumatları
            </div>
            <p className="mt-1 text-xs font-semibold text-[#637392]">
              Şəxsi, əlaqə, portal və agent məlumatları.
            </p>
          </div>
          <Button
            aria-label="Pəncərəni bağla"
            className="size-9 rounded-xl border-[#dce6f4] bg-white text-[#34456c] hover:bg-[#eef5ff]"
            onClick={onClose}
            size="icon"
            type="button"
            variant="outline"
          >
            <XIcon className="size-4" />
          </Button>
        </div>
        <div className="max-h-[calc(88vh-82px)] overflow-y-auto p-5">
          {data.viewer === "agent" ? (
            <Button className="mb-4" type="button" variant="outline" onClick={() => setIsEditing((value) => !value)}>
              {isEditing ? "Məlumatlara bax" : "Profili redaktə et"}
            </Button>
          ) : null}
          {isEditing && data.viewer === "agent" ? (
            <form action={updateAgentStudentProfileAction} className="grid gap-3 sm:grid-cols-2">
              <input name="studentId" type="hidden" value={student.id} />
              {([
                ["firstName", "Ad", student.firstName],
                ["lastName", "Soyad", student.lastName],
                ["fatherName", "Ata adı", student.fatherName],
                ["motherName", "Ana adı", student.motherName],
                ["birthDate", "Doğum tarixi", student.birthDateInput],
                ["gender", "Cins", student.gender],
                ["maritalStatus", "Ailə vəziyyəti", student.maritalStatus],
                ["citizenship", "Vətəndaşlıq", student.citizenship],
                ["phone", "Telefon", student.phone],
                ["contactEmail", "Əlaqə e-poçtu", student.contactEmail],
                ["passportNo", "Pasport", student.passportNo],
                ["identityNo", "Şəxsiyyət nömrəsi", student.identityNo],
                ["address", "Ünvan", student.address],
              ] as const).map(([name, label, value]) => (
                <label className="grid gap-1 text-xs font-bold text-[#415a80]" key={name}>
                  {label}
                  <input className="h-10 rounded-xl border border-[#dce6f4] px-3 text-sm text-[#07183a]" defaultValue={value} name={name} required={name === "firstName" || name === "lastName"} type={name === "birthDate" ? "date" : name === "contactEmail" ? "email" : "text"} />
                </label>
              ))}
              <Button className="sm:col-span-2" type="submit">Profili saxla</Button>
            </form>
          ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <DetailItem label="Ad" value={student.firstName} />
            <DetailItem label="Soyad" value={student.lastName} />
            <DetailItem label="Ata adı" value={student.fatherName} />
            <DetailItem label="Ana adı" value={student.motherName} />
            <DetailItem label="Doğum tarixi" value={student.birthDate} />
            <DetailItem label="Cins" value={student.gender} />
            <DetailItem label="Ailə vəziyyəti" value={student.maritalStatus} />
            <DetailItem label="Vətəndaşlıq" value={student.citizenship} />
            <DetailItem label="Telefon" value={student.phone} />
            <DetailItem label="Əlaqə e-poçtu" value={student.contactEmail} />
            <DetailItem label="Portal e-poçtu" value={student.loginEmail} />
            <DetailItem label="Pasport" value={student.passportNo} />
            <DetailItem label="Şəxsiyyət nömrəsi" value={student.identityNo} />
            <DetailItem
              className="sm:col-span-2 xl:col-span-3"
              label="Ünvan"
              value={student.address}
            />
            <DetailItem label="Portal statusu" value={student.portalStatus} />
            <DetailItem
              label="Portal istifadəçisi"
              value={student.portalUser}
            />
            <DetailItem label="Agent" value={student.agent} />
            <DetailItem label="Agent e-poçtu" value={student.agentEmail} />
            <DetailItem label="Agent telefonu" value={student.agentPhone} />
            <DetailItem label="Yaradan" value={student.createdBy} />
            <DetailItem label="Yaradılıb" value={student.createdAt} />
            <DetailItem label="Yenilənib" value={student.updatedAt} />
            <DetailItem label="Tələbə ID" value={student.id} />
          </div>
          )}
        </div>
      </section>
    </div>
  );
}

function FloatingWorkspace({
  activePanel,
  data,
  onClose,
  onOpen,
  returnTo,
}: {
  activePanel: FloatingPanel;
  data: ApplicationStudentDetailData;
  onClose: () => void;
  onOpen: (panel: FloatingPanel) => void;
  returnTo: string;
}) {
  const { applications, student } = data;

  return (
    <>
      {activePanel ? (
        <div className="fixed bottom-24 right-4 z-[80] w-[calc(100vw-2rem)] max-w-[440px] sm:right-6">
          <div className="mb-2 flex justify-end">
            <Button
              aria-label="Paneli bağla"
              className="size-10 rounded-full border-[#dce6f4] bg-white text-[#34456c] shadow-[0_14px_34px_rgba(15,23,42,0.16)] hover:bg-[#eef5ff]"
              onClick={onClose}
              size="icon"
              type="button"
              variant="outline"
            >
              <XIcon className="size-4" />
            </Button>
          </div>
          <StudentChatPanel
            applicationId={applications[0]?.id}
            className="max-h-[72vh]"
            messages={data.chatMessages}
            returnTo={returnTo}
            studentId={student.id}
            viewer={data.viewer}
          />
        </div>
      ) : null}

      <div className="fixed bottom-5 right-4 z-[75] flex flex-col gap-3 sm:right-6">
        <FloatingButton
          active={activePanel === "chat"}
          count={data.chatMessages.length}
          icon={MessageCircleIcon}
          label="Mesajlaşma"
          onClick={() => onOpen(activePanel === "chat" ? null : "chat")}
        />
      </div>
    </>
  );
}

function FloatingButton({
  active,
  count,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "group relative flex size-14 items-center justify-center rounded-full border shadow-[0_18px_38px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5",
        active
          ? "border-[#0b66ff] bg-[#0b66ff] text-white"
          : "border-blue-100 bg-white text-[#0b66ff]",
      )}
      onClick={onClick}
      type="button"
    >
      <Icon className="size-5" />
      <span
        className={cn(
          "absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-black",
          active ? "bg-white text-[#0b66ff]" : "bg-[#0b66ff] text-white",
        )}
      >
        {count}
      </span>
      <span className="pointer-events-none absolute right-16 rounded-full bg-[#07183a] px-3 py-1 text-xs font-black text-white opacity-0 shadow-lg transition group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

function ActivityTimeline({
  activities,
  compact = false,
}: {
  activities: ApplicationStudentDetailData["activityLogs"];
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "space-y-3 overflow-y-auto pr-1",
        compact ? "max-h-[58vh]" : "max-h-[460px]",
      )}
    >
      {activities.length > 0 ? (
        activities.map((activity) => (
          <div className="relative pl-5" key={activity.id}>
            <span
              className={cn(
                "absolute left-0 top-1.5 size-2.5 rounded-full",
                activity.tone === "green" && "bg-emerald-500",
                activity.tone === "amber" && "bg-amber-500",
                activity.tone === "red" && "bg-red-500",
                activity.tone === "blue" && "bg-[#0b66ff]",
                activity.tone === "slate" && "bg-slate-400",
              )}
            />
            <div className="rounded-[1rem] border border-[#edf2f8] bg-[#fbfdff] px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-black text-[#07183a]">
                  {activity.action}
                </div>
                <div className="text-[11px] font-bold text-[#8a97b4]">
                  {activity.createdAt}
                </div>
              </div>
              <div className="mt-1 text-xs font-semibold leading-5 text-[#637392]">
                {activity.detail}
              </div>
              <div className="mt-1 text-[11px] font-bold text-[#8a97b4]">
                {activity.actor}
              </div>
            </div>
          </div>
        ))
      ) : (
        <EmptyMini text="Log yoxdur." />
      )}
    </div>
  );
}

function ActivityLogDisclosure({
  activities,
  onToggle,
  open,
}: {
  activities: ApplicationStudentDetailData["activityLogs"];
  onToggle: () => void;
  open: boolean;
}) {
  const latestActivity = activities[0];

  return (
    <section className="mt-5 overflow-hidden rounded-[1.25rem] border border-[#dce6f4] bg-white shadow-[0_12px_32px_rgba(29,78,216,0.04)]">
      <button
        aria-expanded={open}
        className="grid w-full gap-3 bg-[#fbfdff] px-4 py-3 text-left transition hover:bg-[#f6f9ff] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
        onClick={onToggle}
        type="button"
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ff] text-[#0b66ff]">
            <HistoryIcon className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-black text-[#07183a]">Loglar</h2>
              <Badge className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[11px] font-black text-[#0b66ff]">
                {activities.length} qeyd
              </Badge>
            </div>
            <p className="mt-1 text-xs font-semibold leading-5 text-[#637392]">
              {latestActivity
                ? `${latestActivity.action} · ${latestActivity.createdAt}`
                : "Profil, müraciət və sənəd hadisələri burada görünəcək."}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <span className="hidden rounded-full bg-white px-3 py-1 text-xs font-black text-[#637392] sm:inline-flex">
            {open ? "Bağla" : "Aç"}
          </span>
          <ChevronDownIcon
            className={cn(
              "size-5 text-[#637392] transition-transform",
              open && "rotate-180",
            )}
          />
        </div>
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-[#edf2f8] p-4">
            <ActivityTimeline activities={activities} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Panel({
  children,
  className,
  description,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[1.25rem] border border-[#dce6f4] bg-white shadow-[0_12px_32px_rgba(29,78,216,0.04)]",
        className,
      )}
    >
      <div className="border-b border-[#edf2f8] bg-[#fbfdff] px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-black text-[#07183a]">
          <Icon className="size-4 text-[#0b66ff]" />
          {title}
        </div>
        <p className="mt-1 text-xs font-semibold text-[#637392]">
          {description}
        </p>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Subsection({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-[#637392]">
        <Icon className="size-3.5 text-[#0b66ff]" />
        {title}
      </div>
      {children}
    </div>
  );
}

function DetailItem({
  className,
  label,
  value,
}: {
  className?: string;
  label: string;
  value?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const canCopy = Boolean(value);

  async function copyValue() {
    if (!value) {
      return;
    }

    await navigator.clipboard?.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div
      className={cn(
        "min-w-0 rounded-[1rem] border border-[#edf2f8] bg-[#fbfdff] px-3 py-2.5",
        className,
      )}
    >
      <div className="text-[10px] font-black uppercase text-[#8a97b4]">
        {label}
      </div>
      <div className="mt-1 flex min-h-8 min-w-0 items-center justify-between gap-2">
        <div className="min-w-0 truncate text-sm font-bold text-[#07183a]">
          {value || "Qeyd olunmayıb"}
        </div>
        <Button
          aria-label={`${label} kopyala`}
          className="size-8 shrink-0 rounded-lg border-[#dce6f4] bg-white text-[#1559b7] hover:bg-[#eef5ff]"
          disabled={!canCopy}
          onClick={copyValue}
          size="icon"
          type="button"
          variant="outline"
        >
          {copied ? (
            <CheckCircle2Icon className="size-4" />
          ) : (
            <CopyIcon className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

function DataStrip({
  label,
  meta,
  required,
}: {
  label: string;
  meta: string[];
  required?: boolean;
}) {
  return (
    <div className="rounded-[1rem] border border-[#edf2f8] bg-[#fbfdff] px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-black text-[#07183a]">{label}</div>
        {required ? (
          <Badge className="rounded-full border border-red-100 bg-red-50 px-2 py-0 text-[10px] font-black text-red-600">
            Məcburi
          </Badge>
        ) : null}
      </div>
      <div className="mt-1 text-xs font-semibold leading-5 text-[#637392]">
        {meta.filter(Boolean).join(" · ") || "Əlavə məlumat yoxdur"}
      </div>
    </div>
  );
}

function StudentAvatar({ name, src }: { name: string; src: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  if (src) {
    return (
      <Image
        alt={name}
        className="size-14 shrink-0 rounded-2xl border border-[#dce6f4] object-cover"
        height={56}
        src={src}
        unoptimized
        width={56}
      />
    );
  }

  return (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-[#dce6f4] bg-[#e8f1ff] text-lg font-black text-[#1559b7]">
      {initials || <UserRoundIcon className="size-6" />}
    </div>
  );
}

function InfoPill({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <span className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full border border-[#dce6f4] bg-[#f8fbff] px-3 py-1 text-xs font-bold text-[#637392]">
      <Icon className="size-3.5 shrink-0 text-[#0b66ff]" />
      <span className="truncate">{text}</span>
    </span>
  );
}

function SummaryTile({
  label,
  tone = "blue",
  value,
}: {
  label: string;
  tone?: "amber" | "blue" | "green" | "red";
  value: number | string;
}) {
  return (
    <div className="rounded-[1rem] border border-[#dce6f4] bg-[#fbfdff] p-3">
      <div className="text-xs font-black uppercase text-[#637392]">{label}</div>
      <div
        className={cn(
          "mt-1 text-2xl font-black tabular-nums",
          tone === "blue" && "text-[#1559b7]",
          tone === "green" && "text-[#0f955f]",
          tone === "amber" && "text-[#b7791f]",
          tone === "red" && "text-[#dc2626]",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#dce6f4] bg-white px-3 py-2">
      <div className="text-[10px] font-black uppercase text-[#8a97b4]">
        {label}
      </div>
      <div className="mt-0.5 text-xs font-black text-[#07183a]">
        {value || "-"}
      </div>
    </div>
  );
}

function StatusBadge({
  label,
  status,
}: {
  label: string;
  status: ApplicationStatus;
}) {
  const tone = getApplicationStatusTone(status);

  return (
    <Badge
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs font-bold",
        tone === "green" && "border-emerald-100 bg-emerald-50 text-emerald-600",
        tone === "amber" && "border-amber-100 bg-amber-50 text-amber-700",
        tone === "red" && "border-red-100 bg-red-50 text-red-600",
        tone === "slate" && "border-slate-200 bg-slate-50 text-slate-600",
      )}
    >
      {label}
    </Badge>
  );
}

function DocumentBadge({ status }: { status: string }) {
  const ready = status === "Yüklənib" || status === "Azad edilib";

  return (
    <Badge
      className={cn(
        "shrink-0 rounded-full border px-2 py-0 text-[10px] font-black",
        ready
          ? "border-emerald-100 bg-emerald-50 text-emerald-600"
          : "border-red-100 bg-red-50 text-red-600",
      )}
    >
      {status}
    </Badge>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="rounded-[1rem] border border-dashed border-[#dce6f4] bg-[#f8fbff] px-3 py-5 text-center text-xs font-bold text-[#637392]">
      {text}
    </div>
  );
}

function formatFileSize(value: number) {
  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
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
        "mt-5 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold",
        isError
          ? "border-red-100 bg-red-50 text-red-700"
          : "border-emerald-100 bg-emerald-50 text-emerald-700",
      )}
    >
      {isError ? (
        <CircleAlertIcon className="size-5 shrink-0" />
      ) : (
        <CheckCircle2Icon className="size-5 shrink-0" />
      )}
      {isError ? getErrorMessage(error) : getSuccessMessage(success)}
    </div>
  );
}

function getSuccessMessage(success?: string) {
  if (success === "student-profile-updated") return "Tələbə profili yeniləndi.";
  if (success === "message-sent") {
    return "Mesaj göndərildi.";
  }

  return "Əməliyyat tamamlandı.";
}

function getErrorMessage(error?: string) {
  if (error === "student-profile-invalid") return "Ad, soyad və doğum tarixini yoxlayın.";
  if (error === "student-profile-failed") return "Tələbə profili saxlanıla bilmədi.";
  if (error === "message-empty") {
    return "Mesaj boş ola bilməz.";
  }

  if (error === "message-too-long") {
    return "Mesaj çox uzundur.";
  }

  if (error === "message-forbidden") {
    return "Bu mesajı göndərmək icazəniz yoxdur.";
  }

  return "Əməliyyat tamamlanmadı.";
}
