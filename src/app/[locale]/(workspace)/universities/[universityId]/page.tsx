import {
  ArrowLeftIcon,
  ArchiveIcon,
  BookOpenIcon,
  Building2Icon,
  CalendarDaysIcon,
  EyeIcon,
  ExternalLinkIcon,
  FilePlus2Icon,
  FileTextIcon,
  GlobeIcon,
  GraduationCapIcon,
  MailIcon,
  MessageCircleIcon,
  MapPinIcon,
  MoreVerticalIcon,
  NewspaperIcon,
  PencilIcon,
  PhoneIcon,
  PhoneCallIcon,
  PlusIcon,
  RefreshCwIcon,
  StickyNoteIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  archiveUniversityAction,
  archiveCampusAction,
  archiveContactAction,
  archiveDocumentAction,
  archiveProgramAction,
  createCampusAction,
  createContactAction,
  createDocumentAction,
  createNoteAction,
  createPeriodAction,
  createTuitionAction,
  expireTuitionAction,
  syncUniversityNewsAction,
  updateCampusAction,
  updateContactAction,
  updateDocumentAction,
  updateNoteAction,
  updateTuitionAction,
} from "@/features/universities/actions";
import * as CampusFormModule from "@/features/universities/components/campus-form";
import { UniversityFeedbackToast } from "@/features/universities/components/university-feedback-toast";
import { ProgramForm as ProgramDetailsForm } from "@/features/universities/components/program-form";
import {
  CURRENCIES,
  DOCUMENT_TYPES,
  ENTITY_STATUSES,
  PERIOD_STATUSES,
  PRICE_STATUSES,
  SCHOLARSHIP_TYPES,
} from "@/features/universities/constants";
import { UniversityForm } from "@/features/universities/components/university-form";
import {
  formatMoney,
  getUniversityDetailData,
} from "@/features/universities/data/detail-data";
import {
  formatDate,
  formatEnumLabel,
} from "@/features/universities/data/dashboard-data";
import { Link } from "@/i18n/navigation";
import { requireSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

type UniversityDetailData = NonNullable<
  Awaited<ReturnType<typeof getUniversityDetailData>>
>;

const detailTabs = [
  "overview",
  "profile",
  "campuses",
  "programs",
  "periods",
  "documents",
  "activity",
] as const;

const studentDetailTabs = [
  "overview",
  "profile",
  "programs",
  "periods",
] as const;

const agentDetailTabs = ["overview", "profile", "programs", "periods"] as const;

type ReadOnlyPortalType = "agent" | "student";
type ReadOnlyDetailTab =
  | (typeof studentDetailTabs)[number]
  | (typeof agentDetailTabs)[number];

const EMPTY_SELECT_VALUE = "__empty";

export default async function UniversityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ universityId: string }>;
  searchParams: Promise<{
    editCampus?: string;
    editContact?: string;
    editDocument?: string;
    editNote?: string;
    editProgram?: string;
    editTuition?: string;
    error?: string;
    success?: string;
    tab?: string;
  }>;
}) {
  const [{ universityId }, query] = await Promise.all([params, searchParams]);
  const [data, session] = await Promise.all([
    getUniversityDetailData(universityId),
    requireSession(),
  ]);

  if (!data) {
    notFound();
  }

  const { university, summary } = data;

  if (session.portalType === "student" || session.portalType === "agent") {
    const portalType: ReadOnlyPortalType =
      session.portalType === "agent" ? "agent" : "student";

    return (
      <StudentUniversityDetail
        data={data}
        defaultTab={normalizeReadOnlyDetailTab(query.tab, portalType)}
        portalType={portalType}
      />
    );
  }

  const defaultTab = normalizeDetailTab(query.tab);
  const editingCampus = university.campuses.find(
    (campus) => campus.id === query.editCampus,
  );
  const editingProgram = university.programs.find(
    (program) => program.id === query.editProgram,
  );
  const editingTuition = university.programs
    .flatMap((program) =>
      program.tuitions.map((tuition) => ({ program, tuition })),
    )
    .find(({ tuition }) => tuition.id === query.editTuition);
  const editingDocument = university.documents.find(
    (document) => document.id === query.editDocument,
  );
  const editingContact = university.contacts.find(
    (contact) => contact.id === query.editContact,
  );
  const editingNote = university.notes.find(
    (note) => note.id === query.editNote,
  );
  const tuitionRows = university.programs.flatMap((program) =>
    program.tuitions.map((tuition) => ({ program, tuition })),
  );
  const totalPrograms = university.programs.length;
  const relatedPeriods = Array.from(
    new Map(
      tuitionRows.map(({ tuition }) => [tuition.period.id, tuition.period]),
    ).values(),
  );
  const relatedPeriodIds = new Set(relatedPeriods.map((period) => period.id));
  const activeCampuses = university.campuses.filter(
    (campus) => campus.status === "ACTIVE",
  ).length;
  const campusOptions = university.campuses.map((campus) => ({
    id: campus.id,
    name: campus.name,
  }));
  const activeContacts = university.contacts.filter(
    (contact) => contact.status === "ACTIVE",
  ).length;
  const draftPrograms = university.programs.filter(
    (program) => program.status === "DRAFT",
  ).length;
  const mainCampus =
    university.campuses.find((campus) => campus.isMainCampus) ??
    university.campuses[0] ??
    null;
  const now = new Date();
  const expiryCutoff = new Date(now);
  expiryCutoff.setDate(expiryCutoff.getDate() + 120);
  const expiringDocuments = university.documents.filter(
    (document) =>
      document.status === "ACTIVE" &&
      document.expiryDate &&
      document.expiryDate >= now &&
      document.expiryDate <= expiryCutoff,
  ).length;
  const profileValues = {
    agreementStatus: university.agreementStatus,
    city: university.city,
    country: university.country,
    id: university.id,
    internalNotes: university.internalNotes,
    logoAccessUrl: university.logoAccessUrl,
    logoUrl: university.logoUrl,
    mainEmail: university.mainEmail,
    mainPhone: university.mainPhone,
    name: university.name,
    newsSourceUrl: university.newsSourceUrl,
    partnershipStatus: university.partnershipStatus,
    schoolType: university.schoolType,
    status: university.status,
    website: university.website,
  };

  return (
    <div className="min-h-full bg-[#f4f7fb] px-5 py-5 lg:px-7 lg:py-6">
      <UniversityFeedbackToast error={query.error} success={query.success} />

      <section className="rounded-[1.5rem] border border-[#dce6f4] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Button
              asChild
              className="mt-1 rounded-[1rem] border-[#dce6f4] bg-white"
              size="icon"
              variant="outline"
            >
              <Link href="/universities" aria-label="Universitetlərə qayıt">
                <ArrowLeftIcon />
              </Link>
            </Button>
            <LogoBlock
              logoUrl={university.logoAccessUrl ?? university.logoUrl}
              name={university.name}
            />
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border border-[#dce6f4] bg-[#f8fafc] px-3 py-1 text-[11px] font-bold uppercase text-[#52627f]">
                  Universitet profili
                </Badge>
                <Badge className="rounded-full border border-[#dce6f4] bg-white px-3 py-1 text-[11px] font-bold uppercase text-[#52627f]">
                  Yeniləndi {summary.updatedAt}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-[#07183a] sm:text-3xl">
                  {university.name}
                </h1>
                <StatusBadge tone={getStatusTone(university.status)}>
                  {summary.statusLabel}
                </StatusBadge>
                <StatusBadge tone="blue">
                  {summary.partnershipLabel}
                </StatusBadge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-[#5d6d91]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPinIcon />
                  {university.country}, {university.city}
                </span>
                <span>{summary.schoolTypeLabel}</span>
                <span>{summary.agreementLabel}</span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <ContactChip type="email" value={university.mainEmail} />
                <ContactChip
                  type="phone"
                  value={university.mainPhone}
                  whatsapp={summary.primaryContact?.whatsapp ?? null}
                />
                <ContactChip type="website" value={university.website} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <RecordDialog
              description="Əsas profil məlumatlarını, tərəfdaşlıq statusunu, razılaşma statusunu və daxili qeydləri yeniləyin."
              title="Universiteti yenilə"
              trigger={
                <Button
                  className="h-11 rounded-2xl border-[#dce6f4] bg-white px-4 text-[#24365f]"
                  variant="outline"
                >
                  <PencilIcon data-icon="inline-start" />
                  Yenilə
                </Button>
              }
            >
              <UniversityForm
                mode="update"
                submitLabel="Universiteti yenilə"
                values={profileValues}
              />
            </RecordDialog>
            <RecordDialog
              description="Əvvəl proqram yaradın, sonra uyğun tablardan təhsil haqqı, dönəm və sənəd qeydlərini bağlayın."
              title="Proqram əlavə et"
              trigger={
                <Button className="h-11 rounded-2xl bg-[#0b66ff] px-4 shadow-[0_12px_28px_rgba(37,99,235,0.22)] hover:bg-[#075be8]">
                  <PlusIcon data-icon="inline-start" />
                  Proqram əlavə et
                </Button>
              }
            >
              <ProgramDetailsForm
                campuses={campusOptions}
                defaultCurrency={university.defaultCurrency ?? undefined}
                defaultEducationLanguageId={
                  university.defaultEducationLanguageId ?? undefined
                }
                defaultEducationLevelId={
                  university.defaultEducationLevelId ?? undefined
                }
                defaultPeriodId={university.defaultPeriodId ?? undefined}
                educationLanguages={data.educationLanguages}
                educationLevels={data.educationLevels}
                existingProgramNames={university.programs.map(
                  (program) => program.name,
                )}
                periods={data.periods}
                universityId={university.id}
              />
            </RecordDialog>
            <form action={archiveUniversityAction}>
              <input name="universityId" type="hidden" value={university.id} />
              <Button
                className="h-11 rounded-2xl border-red-200 bg-white px-4 text-red-600 hover:bg-red-50"
                type="submit"
                variant="outline"
              >
                <ArchiveIcon data-icon="inline-start" />
                Arxivlə
              </Button>
            </form>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-4">
        <SummaryCard
          detail={`${summary.activePrograms} aktiv, ${draftPrograms} qaralama`}
          icon={GraduationCapIcon}
          label="Cəmi proqramlar"
          tone="blue"
          value={totalPrograms}
        />
        <SummaryCard
          detail={`${relatedPeriods.length} bağlı`}
          icon={CalendarDaysIcon}
          label="Açıq dönəmlər"
          tone="violet"
          value={summary.activePeriods}
        />
        <SummaryCard
          detail={`${activeCampuses} aktiv`}
          icon={Building2Icon}
          label="Kampuslar"
          tone="green"
          value={university.campuses.length}
        />
        <SummaryCard
          detail={`${expiringDocuments} bitməyə yaxın`}
          icon={FileTextIcon}
          label="Sənədlər"
          tone="orange"
          value={university.documents.length}
        />
      </section>

      <Tabs defaultValue={defaultTab} className="mt-5">
        <div className="overflow-x-auto rounded-[1.25rem] border border-[#dce6f4] bg-white p-2 shadow-[0_14px_34px_rgba(15,23,42,0.04)]">
          <TabsList className="min-w-max bg-[#f3f7fc]" variant="default">
            {detailTabs.map((tab) => (
              <TabsTrigger
                key={tab}
                className="h-9 rounded-[0.9rem] px-3 data-active:bg-white data-active:text-[#0b66ff]"
                value={tab}
              >
                {formatTabLabel(tab)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent className="mt-5" value="overview">
          <div className="grid gap-5">
            <SectionCard title="Son xəbərlər">
              <NewsRail
                lastSyncedAt={university.newsLastSyncedAt}
                news={data.news}
                sourceUrl={university.newsSourceUrl}
                universityId={university.id}
              />
            </SectionCard>

            <SectionCard
              action={
                <RecordDialog
                  description="Yeni kampus yeri, ünvan və kampus şəkli əlavə edin."
                  title="Kampus əlavə et"
                  trigger={
                    <Button className="rounded-2xl" size="sm" variant="outline">
                      <PlusIcon data-icon="inline-start" />
                      Kampus əlavə et
                    </Button>
                  }
                >
                  <CampusForm university={university} />
                </RecordDialog>
              }
              title="Kampuslar"
            >
              <CampusShowcase
                campuses={university.campuses}
                universityId={university.id}
              />
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent className="mt-5" value="profile">
          <SectionCard
            action={
              <RecordDialog
                description="Rəsmi profil sahələrini və daxili qeydləri redaktə edin."
                title="Universiteti yenilə"
                trigger={
                  <Button className="rounded-2xl" size="sm">
                    <PencilIcon data-icon="inline-start" />
                    Profili yenilə
                  </Button>
                }
              >
                <UniversityForm
                  mode="update"
                  submitLabel="Universiteti yenilə"
                  values={profileValues}
                />
              </RecordDialog>
            }
            description="Profil və kontakt məlumatları vahid əməliyyat görünüşündə birlikdə göstərilir."
            title="Universitet profili və kontaktlar"
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <InfoItem label="Universitet adı" value={university.name} />
              <InfoItem label="Ölkə" value={university.country} />
              <InfoItem label="Şəhər" value={university.city} />
              <InfoItem label="Məktəb tipi" value={summary.schoolTypeLabel} />
              <InfoItem label="Tərəfdaşlıq" value={summary.partnershipLabel} />
              <InfoItem label="Razılaşma" value={summary.agreementLabel} />
              <InfoItem
                label="Əsas e-poçt"
                value={university.mainEmail ?? "Təyin edilməyib"}
              />
              <InfoItem
                label="Əsas telefon"
                value={university.mainPhone ?? "Təyin edilməyib"}
              />
              <InfoItem
                label="Xəbər mənbəyi"
                value={university.newsSourceUrl ?? "Təyin edilməyib"}
              />
              <InfoItem
                label="Vebsayt"
                value={university.website ?? "Təyin edilməyib"}
              />
              <InfoItem
                label="Ünvan"
                value={mainCampus?.address ?? "Təyin edilməyib"}
              />
            </div>
            <div className="mt-4 rounded-2xl border border-[#dce6f4] bg-white p-4">
              <div className="text-xs font-semibold uppercase text-[#71809f]">
                Daxili qeydlər
              </div>
              <div className="mt-2 text-sm leading-6 text-[#334568]">
                {university.internalNotes ?? "Hələ daxili qeyd yoxdur."}
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-[#07183a]">
                    əlaqə məlumatları
                  </div>
                  <div className="mt-1 text-xs text-[#637392]">
                    Kontakt şəxs, vəzifə, telefon, e-poçt və digər mövcud
                    detallar.
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge tone="blue">{activeContacts} aktiv</StatusBadge>
                  <RecordDialog
                    description="Bu universitet üçün qəbul, maliyyə və ya tərəfdaşlıq kontaktları əlavə edin."
                    title="Kontakt əlavə et"
                    trigger={
                      <Button className="rounded-2xl" size="sm">
                        <PlusIcon data-icon="inline-start" />
                        Kontakt əlavə et
                      </Button>
                    }
                  >
                    <ContactForm universityId={university.id} />
                  </RecordDialog>
                </div>
              </div>
              <KontaktProfilGrid
                contacts={university.contacts}
                universityId={university.id}
              />
            </div>
          </SectionCard>
          {editingContact ? (
            <RecordDialog
              defaultOpen
              description="Kontakt detallarını, əsas kontakt işarəsini və statusu yeniləyin."
              title="Kontaktı redaktə et"
            >
              <ContactForm
                universityId={university.id}
                values={editingContact}
              />
            </RecordDialog>
          ) : null}
        </TabsContent>

        <TabsContent className="mt-5" value="campuses">
          <RecordsSection
            action={
              <RecordDialog
                description="Bu universitetə kampus əlavə edin. Proqramlar daha sonra kampusa bağlana bilər."
                title="Kampus əlavə et"
                trigger={
                  <Button className="rounded-2xl" size="sm">
                    <PlusIcon data-icon="inline-start" />
                    Kampus əlavə et
                  </Button>
                }
              >
                <CampusForm university={university} />
              </RecordDialog>
            }
            description="Kampuslar ayrıca universitet deyil; bu profil altında saxlanılır."
            title="Kampuslar"
          >
            <DataList
              empty="Hələ kampus əlavə edilməyib."
              icon={Building2Icon}
              items={university.campuses.map((campus) => ({
                action: (
                  <ArchiveItemButton
                    action={archiveCampusAction}
                    id={campus.id}
                    idName="campusId"
                    universityId={university.id}
                  />
                ),
                actionHref: buildCampusMapUrl(campus),
                actionLabel: "Xəritə",
                description: campus.address ?? campus.notes ?? undefined,
                editHref: `/universities/${university.id}?tab=campuses&editCampus=${campus.id}`,
                highlights: [
                  campus.isMainCampus ? "Əsas kampus" : "Filial kampusu",
                  campus.notes ? "Qeyd var" : "Qeyd yoxdur",
                ],
                imageUrl: campus.imageAccessUrl ?? campus.imageUrl ?? undefined,
                meta: `${campus.country}, ${campus.city}`,
                status: formatEnumLabel(campus.status),
                title: campus.name,
              }))}
            />
          </RecordsSection>
          {editingCampus ? (
            <RecordDialog
              defaultOpen
              description="Kampus yerini, statusu, qeydləri və əsas kampus işarəsini yeniləyin."
              title="Kampusu redaktə et"
            >
              <CampusForm university={university} values={editingCampus} />
            </RecordDialog>
          ) : null}
        </TabsContent>

        <TabsContent className="mt-5" value="programs">
          <RecordsSection
            action={
              <div className="flex flex-wrap items-center justify-end gap-2">
                <RecordDialog
                  description="Pillə, dil, kampus, müddət və tələblərlə birlikdə proqram əlavə edin."
                  title="Proqram əlavə et"
                  trigger={
                    <Button className="rounded-2xl" size="sm">
                      <PlusIcon data-icon="inline-start" />
                      Proqram əlavə et
                    </Button>
                  }
                >
                  <ProgramDetailsForm
                    campuses={campusOptions}
                    defaultCurrency={university.defaultCurrency ?? undefined}
                    defaultEducationLanguageId={
                      university.defaultEducationLanguageId ?? undefined
                    }
                    defaultEducationLevelId={
                      university.defaultEducationLevelId ?? undefined
                    }
                    defaultPeriodId={university.defaultPeriodId ?? undefined}
                    educationLanguages={data.educationLanguages}
                    educationLevels={data.educationLevels}
                    existingProgramNames={university.programs.map(
                      (program) => program.name,
                    )}
                    periods={data.periods}
                    universityId={university.id}
                  />
                </RecordDialog>
              </div>
            }
            description="Proqramlar və dönəm əsaslı təhsil haqları vahid əməliyyat görünüşündə birlikdə idarə olunur."
            title="Proqramlar və təhsil haqqı"
          >
            <div className="overflow-x-auto">
              <ProgramTuitionTable
                programs={university.programs}
                universityId={university.id}
              />
            </div>
          </RecordsSection>
          {editingProgram ? (
            <RecordDialog
              defaultOpen
              description="Proqram metadatasını, pilləni, dili, tələbləri və statusu yeniləyin."
              title="Proqramı redaktə et"
            >
              <ProgramDetailsForm
                campuses={campusOptions}
                educationLanguages={data.educationLanguages}
                educationLevels={data.educationLevels}
                universityId={university.id}
                values={editingProgram}
              />
            </RecordDialog>
          ) : null}
          {editingTuition ? (
            <RecordDialog
              defaultOpen
              description={`${editingTuition.program.name} üçün qiyməti yeniləyin.`}
              title="Təhsil haqqını redaktə et"
            >
              <TuitionForm
                periods={data.periods}
                programs={university.programs}
                universityId={university.id}
                values={editingTuition.tuition}
              />
            </RecordDialog>
          ) : null}
        </TabsContent>

        <TabsContent className="mt-5" value="periods">
          <RecordsSection
            action={
              <RecordDialog
                description="2026 Payız kimi qəbul dönəmi yaradın və ya yeniləyin. Təhsil haqqı qeydləri sonra ondan istifadə edə bilər."
                title="Dönəm / qəbul əlavə et"
                trigger={
                  <Button className="rounded-2xl" size="sm">
                    <PlusIcon data-icon="inline-start" />
                    Dönəm əlavə et
                  </Button>
                }
              >
                <PeriodForm universityId={university.id} />
              </RecordDialog>
            }
            description="Dönəmlər təkrar istifadə edilən qəbul qeydləridir. Bağlı dönəmlər bu universitetin təhsil haqqında istifadə olunur."
            title="Dönəmlər / qəbullar"
          >
            <PeriodsTable
              periods={data.periods}
              relatedPeriodIds={relatedPeriodIds}
            />
          </RecordsSection>
        </TabsContent>

        <TabsContent className="mt-5" value="documents">
          <RecordsSection
            action={
              <RecordDialog
                description="Fayl yükləyin və ya xarici URL yapışdırın. Kritik fayllar aktivlik jurnalında görünür."
                title="Sənəd əlavə et"
                trigger={
                  <Button className="rounded-2xl" size="sm">
                    <PlusIcon data-icon="inline-start" />
                    Sənəd əlavə et
                  </Button>
                }
              >
                <DocumentForm universityId={university.id} />
              </RecordDialog>
            }
            description="Bu universitetə bağlı razılaşmalar, qiymət siyahıları, broşürlər və təsdiqlər."
            title="Sənədlər"
          >
            <DataList
              empty="Hələ sənəd əlavə edilməyib."
              icon={FileTextIcon}
              items={university.documents.map((document) => ({
                action: (
                  <ArchiveItemButton
                    action={archiveDocumentAction}
                    id={document.id}
                    idName="documentId"
                    universityId={university.id}
                  />
                ),
                actionHref: document.accessUrl ?? undefined,
                actionLabel: "Yüklə",
                description:
                  document.fileName ??
                  (document.fileUrl.startsWith("storage://")
                    ? "Supabase Storage-da saxlanılır"
                    : document.fileUrl),
                editHref: `/universities/${university.id}?tab=documents&editDocument=${document.id}`,
                highlights: [
                  formatEnumLabel(document.relatedEntityType),
                  document.validFrom
                    ? `Başlama tarixi ${formatDate(document.validFrom)}`
                    : "Başlama tarixi yoxdur",
                  document.expiryDate
                    ? `Bitmə tarixi ${formatDate(document.expiryDate)}`
                    : "Bitmə tarixi yoxdur",
                ],
                meta: `${document.documentType} - ${formatDate(document.uploadedAt)}`,
                status: formatEnumLabel(document.status),
                title: document.title,
              }))}
            />
          </RecordsSection>
          {editingDocument ? (
            <RecordDialog
              defaultOpen
              description="Sənəd metadatasını yeniləyin və istəyə bağlı yüklənmiş faylı dəyişin."
              title="Sənədi redaktə et"
            >
              <DocumentForm
                universityId={university.id}
                values={editingDocument}
              />
            </RecordDialog>
          ) : null}
        </TabsContent>

        <TabsContent className="mt-5" value="activity">
          <div className="grid gap-5">
            <SectionCard
              description="Bu universitetə bağlı tələbələr, seçdikləri proqram, status və əlaqəli aktivlik."
              title="Tələbə aktivliyi"
            >
              <StudentActivityTable items={data.studentActivities} />
            </SectionCard>
            <RecordsSection
              action={
                <RecordDialog
                  description="Tərəfdaşlıq, endirim, tələblər və ya risk konteksti üçün daxili qeydlər əlavə edin."
                  title="Qeyd əlavə et"
                  trigger={
                    <Button className="rounded-2xl" size="sm">
                      <PlusIcon data-icon="inline-start" />
                      Qeyd əlavə et
                    </Button>
                  }
                >
                  <NoteForm universityId={university.id} />
                </RecordDialog>
              }
              description="Daxili komanda qeydləri tam universitet zaman xəttində aktivliklə birlikdə göstərilir."
              title="Qeydlər"
            >
              <DataList
                empty="Hələ daxili qeyd yoxdur."
                icon={StickyNoteIcon}
                items={university.notes.map((note) => ({
                  editHref: `/universities/${university.id}?tab=activity&editNote=${note.id}`,
                  meta: note.author?.name ?? "Admin istifadəçisi",
                  status: formatDate(note.createdAt),
                  title: note.body,
                }))}
              />
            </RecordsSection>
          </div>
          {editingNote ? (
            <RecordDialog
              defaultOpen
              description="Seçilmiş daxili qeydi yeniləyin."
              title="Qeydi redaktə et"
            >
              <NoteForm universityId={university.id} values={editingNote} />
            </RecordDialog>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StudentUniversityDetail({
  data,
  defaultTab,
  portalType,
}: {
  data: UniversityDetailData;
  defaultTab: ReadOnlyDetailTab;
  portalType: ReadOnlyPortalType;
}) {
  const { university, summary } = data;
  const readOnlyTabs =
    portalType === "agent" ? agentDetailTabs : studentDetailTabs;
  const workspaceLabel =
    portalType === "agent" ? "Agent iş sahəsi" : "Tələbə iş sahəsi";
  const readOnlyLabel =
    portalType === "agent"
      ? "Yalnız oxunan agent görünüşü"
      : "Yalnız oxunan tələbə görünüşü";
  const tuitionRows = university.programs.flatMap((program) =>
    program.tuitions.map((tuition) => ({ program, tuition })),
  );
  const relatedPeriods = Array.from(
    new Map(
      tuitionRows.map(({ tuition }) => [tuition.period.id, tuition.period]),
    ).values(),
  );
  const relatedPeriodIds = new Set(relatedPeriods.map((period) => period.id));
  const activeCampuses = university.campuses.filter(
    (campus) => campus.status === "ACTIVE",
  ).length;
  return (
    <div className="min-h-full bg-[#f4f7fb] px-5 py-5 lg:px-7 lg:py-6">
      <section className="rounded-[1.5rem] border border-[#dce6f4] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Button
              asChild
              className="mt-1 rounded-[1rem] border-[#dce6f4] bg-white"
              size="icon"
              variant="outline"
            >
              <Link href="/universities" aria-label="Universitetlərə qayıt">
                <ArrowLeftIcon />
              </Link>
            </Button>
            <LogoBlock
              logoUrl={university.logoAccessUrl ?? university.logoUrl}
              name={university.name}
            />
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border border-[#dce6f4] bg-[#f8fafc] px-3 py-1 text-[11px] font-bold uppercase text-[#52627f]">
                  Universitet profili
                </Badge>
                <Badge className="rounded-full border border-[#cfe1ff] bg-[#edf5ff] px-3 py-1 text-[11px] font-bold uppercase text-[#0b66ff]">
                  {workspaceLabel}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-[#07183a] sm:text-3xl">
                  {university.name}
                </h1>
                <StatusBadge tone={getStatusTone(university.status)}>
                  {summary.statusLabel}
                </StatusBadge>
                <StatusBadge tone="blue">{readOnlyLabel}</StatusBadge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-[#5d6d91]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPinIcon />
                  {university.country}, {university.city}
                </span>
                <span>{summary.schoolTypeLabel}</span>
                <span>{summary.partnershipLabel}</span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <ContactChip type="email" value={university.mainEmail} />
                <ContactChip
                  type="phone"
                  value={university.mainPhone}
                  whatsapp={summary.primaryContact?.whatsapp ?? null}
                />
                <ContactChip type="website" value={university.website} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-4">
        <SummaryCard
          detail={`${summary.activePrograms} aktiv`}
          icon={GraduationCapIcon}
          label="Proqramlar"
          tone="blue"
          value={university.programs.length}
        />
        <SummaryCard
          detail={`${relatedPeriods.length} bağlı`}
          icon={CalendarDaysIcon}
          label="Açıq dönəmlər"
          tone="violet"
          value={summary.activePeriods}
        />
        <SummaryCard
          detail={`${activeCampuses} aktiv`}
          icon={Building2Icon}
          label="Kampuslar"
          tone="green"
          value={university.campuses.length}
        />
        <SummaryCard
          detail={`${summary.discountedPrograms} endirimli`}
          icon={BookOpenIcon}
          label="Təhsil haqqı"
          tone="orange"
          value={tuitionRows.length}
        />
      </section>

      <Tabs defaultValue={defaultTab} className="mt-5">
        <div className="overflow-x-auto rounded-[1.25rem] border border-[#dce6f4] bg-white p-2 shadow-[0_14px_34px_rgba(15,23,42,0.04)]">
          <TabsList className="min-w-max bg-[#f3f7fc]" variant="default">
            {readOnlyTabs.map((tab) => (
              <TabsTrigger
                key={tab}
                className="h-9 rounded-[0.9rem] px-3 data-active:bg-white data-active:text-[#0b66ff]"
                value={tab}
              >
                {formatTabLabel(tab)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent className="mt-5" value="overview">
          <div className="grid gap-5">
            <SectionCard title="Son xəbərlər">
              <NewsRail
                lastSyncedAt={university.newsLastSyncedAt}
                news={data.news}
                sourceUrl={university.newsSourceUrl}
                universityId={university.id}
                readOnly
              />
            </SectionCard>

            <SectionCard title="Kampuslar">
              <CampusShowcase
                campuses={university.campuses}
                universityId={university.id}
                readOnly
              />
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent className="mt-5" value="profile">
          <div className="grid gap-5 xl:grid-cols-2">
            <SectionCard
              description="Portalda görünən əsas ictimai profil sahələri."
              title="Profil"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <InfoItem label="Ölkə" value={university.country} />
                <InfoItem label="Şəhər" value={university.city} />
                <InfoItem label="Məktəb tipi" value={summary.schoolTypeLabel} />
                <InfoItem
                  label="Tərəfdaşlıq"
                  value={summary.partnershipLabel}
                />
                <InfoItem label="Razılaşma" value={summary.agreementLabel} />
                <InfoItem
                  label="Xəbər mənbəyi"
                  value={university.newsSourceUrl ?? "Təyin edilməyib"}
                />
              </div>
            </SectionCard>

            <SectionCard
              description="Portalda görünən universitet kontakt qeydləri."
              title="Kontaktlar"
            >
              <DataList
                empty="Hələ əlaqə məlumatı əlavə edilməyib."
                icon={UserRoundIcon}
                items={university.contacts.map((contact) => ({
                  description: contact.notes ?? contact.email ?? undefined,
                  highlights: [
                    contact.phone ?? "Telefon təyin edilməyib",
                    contact.department ?? "Şöbə təyin edilməyib",
                  ],
                  meta: contact.position ?? "Vəzifə təyin edilməyib",
                  status: contact.isPrimary
                    ? "Əsas"
                    : formatEnumLabel(contact.status),
                  title: contact.fullName,
                }))}
              />
            </SectionCard>

            <SectionCard
              description="Bu universitet profilinə aid kampus yerləri."
              title="Kampuslar"
            >
              <DataList
                empty="Hələ kampus əlavə edilməyib."
                icon={Building2Icon}
                items={university.campuses.map((campus) => ({
                  actionHref: buildCampusMapUrl(campus),
                  actionLabel: "Xəritə",
                  description: campus.address ?? campus.notes ?? undefined,
                  highlights: [
                    campus.isMainCampus ? "Əsas kampus" : "Filial kampusu",
                    campus.notes ? "Qeyd var" : "Qeyd yoxdur",
                  ],
                  imageUrl:
                    campus.imageAccessUrl ?? campus.imageUrl ?? undefined,
                  meta: `${campus.country}, ${campus.city}`,
                  status: formatEnumLabel(campus.status),
                  title: campus.name,
                }))}
              />
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent className="mt-5" value="programs">
          <div className="grid gap-5">
            <SectionCard
              description="Proqramlar yalnız baxış üçün görünür."
              title="Proqramlar"
            >
              <ReadOnlyProgramsTable
                programs={university.programs}
                universityId={university.id}
              />
            </SectionCard>
            <SectionCard
              description="Görünən proqramlara bağlı təhsil haqqı və endirim qeydləri."
              title="Təhsil haqqı"
            >
              <ReadOnlyTuitionTable programs={university.programs} />
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent className="mt-5" value="periods">
          <SectionCard
            description="Mövcud proqramlar üçün açıq və bağlı qəbul dönəmləri."
            title="Dönəmlər"
          >
            <PeriodsTable
              periods={data.periods}
              relatedPeriodIds={relatedPeriodIds}
            />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReadOnlyProgramsTable({
  maxRows,
  programs,
  universityId,
}: {
  maxRows?: number;
  programs: UniversityDetailData["university"]["programs"];
  universityId: string;
}) {
  const visiblePrograms = maxRows ? programs.slice(0, maxRows) : programs;

  if (visiblePrograms.length === 0) {
    return <EmptyState text="Hələ proqram əlavə edilməyib." />;
  }

  return (
    <Table className="min-w-[680px]">
      <TableHeader>
        <TableRow className="bg-[#fbfdff] hover:bg-[#fbfdff]">
          <TableHead className="px-4">Proqram</TableHead>
          <TableHead>Pillə / Dil</TableHead>
          <TableHead>Kampus</TableHead>
          <TableHead>Müddət</TableHead>
          <TableHead className="text-right">Baxış</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visiblePrograms.map((program) => (
          <TableRow key={program.id} className="h-16">
            <TableCell className="px-4">
              <div className="flex min-w-72 items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#e8f1ff] text-[#0b66ff]">
                  <BookOpenIcon />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-[#07183a]">
                    {program.name}
                  </div>
                  <div className="mt-1 max-w-md truncate text-xs text-[#637392]">
                    {program.requirementsSummary ?? "Tələblər təyin edilməyib"}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="font-medium text-[#334568]">
                {program.educationLevel.name}
              </div>
              <div className="mt-1 text-xs text-[#637392]">
                {program.educationLanguage.name}
              </div>
            </TableCell>
            <TableCell>{program.campus?.name ?? "Təyin edilməyib"}</TableCell>
            <TableCell>
              <div className="font-medium">
                {program.duration ?? "Təyin edilməyib"}
              </div>
              <div className="mt-1 text-xs text-[#637392]">
                {program.studyMode ?? "Format təyin edilməyib"}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <ProgramDetailsDialog program={program} />
                <Button
                  asChild
                  className="rounded-xl bg-[#0b66ff] px-3 text-xs font-black text-white shadow-[0_10px_22px_rgba(37,99,235,0.20)] hover:bg-[#0754d6]"
                  size="sm"
                >
                  <Link
                    href={buildApplicationPrefillHref({
                      programId: program.id,
                      tuitionId: program.tuitions[0]?.id ?? null,
                      universityId,
                    })}
                  >
                    <FilePlus2Icon data-icon="inline-start" />
                    Müraciət et
                  </Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ReadOnlyTuitionTable({
  maxRows,
  programs,
}: {
  maxRows?: number;
  programs: UniversityDetailData["university"]["programs"];
}) {
  const rows = programs.flatMap((program) =>
    program.tuitions.map((tuition) => ({ program, tuition })),
  );
  const visibleRows = maxRows ? rows.slice(0, maxRows) : rows;

  if (visibleRows.length === 0) {
    return <EmptyState text="Hələ təhsil haqqı qeydi əlavə edilməyib." />;
  }

  return (
    <Table className="min-w-[760px]">
      <TableHeader>
        <TableRow className="bg-[#fbfdff] hover:bg-[#fbfdff]">
          <TableHead className="px-4">Proqram</TableHead>
          <TableHead>Dönəm</TableHead>
          <TableHead>Təhsil haqqı</TableHead>
          <TableHead>Endirim / Təqaüd</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Baxış</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visibleRows.map(({ program, tuition }) => (
          <TableRow key={tuition.id} className="h-16">
            <TableCell className="px-4 font-semibold text-[#07183a]">
              <div className="max-w-72 truncate">{program.name}</div>
              <div className="mt-1 text-xs font-normal text-[#637392]">
                {tuition.paymentNote ?? "Ödəniş qeydi yoxdur"}
              </div>
            </TableCell>
            <TableCell>{tuition.period.name}</TableCell>
            <TableCell className="font-semibold tabular-nums">
              {formatMoney(tuition.tuitionFee, tuition.currency)}
            </TableCell>
            <TableCell>
              <div className="font-medium tabular-nums">
                {tuition.discountedTuitionFee
                  ? formatMoney(tuition.discountedTuitionFee, tuition.currency)
                  : "Yoxdur"}
              </div>
              <div className="mt-1 text-xs text-[#637392]">
                {tuition.scholarshipType
                  ? formatEnumLabel(tuition.scholarshipType)
                  : "Təqaüd yoxdur"}
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge tone={getStatusTone(tuition.priceStatus)}>
                {formatEnumLabel(tuition.priceStatus)}
              </StatusBadge>
            </TableCell>
            <TableCell className="text-right">
              <TuitionDetailsDialog program={program} tuition={tuition} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

type ProgramDetailsItem = {
  campus: { name: string } | null;
  duration?: string | null;
  educationLanguage: { name: string };
  educationLevel: { name: string };
  name: string;
  requirementsSummary?: string | null;
  studyMode?: string | null;
};

type TuitionDetailsItem = {
  currency: string;
  discountedTuitionFee: unknown;
  paymentNote?: string | null;
  period: { name: string };
  priceStatus: string;
  scholarshipType?: string | null;
  tuitionFee: unknown;
};

function ProgramDetailsDialog({ program }: { program: ProgramDetailsItem }) {
  return (
    <DetailDialog
      description="Proqram üzrə əsas akademik məlumatlar."
      title={program.name}
      triggerLabel="Proqram detallarına bax"
    >
      <DetailGrid>
        <DetailItem label="Proqram" value={program.name} />
        <DetailItem label="Pillə" value={program.educationLevel.name} />
        <DetailItem label="Dil" value={program.educationLanguage.name} />
        <DetailItem
          label="Kampus"
          value={program.campus?.name ?? "Təyin edilməyib"}
        />
        <DetailItem
          label="Müddət"
          value={program.duration ?? "Təyin edilməyib"}
        />
        <DetailItem
          label="Format"
          value={program.studyMode ?? "Format təyin edilməyib"}
        />
        <DetailItem
          label="Tələblər"
          value={program.requirementsSummary ?? "Tələblər təyin edilməyib"}
          wide
        />
      </DetailGrid>
    </DetailDialog>
  );
}

function TuitionDetailsDialog({
  program,
  tuition,
}: {
  program: ProgramDetailsItem;
  tuition: TuitionDetailsItem;
}) {
  return (
    <DetailDialog
      description="Seçilmiş proqram üçün təhsil haqqı və endirim məlumatları."
      title={`${program.name} - Təhsil haqqı`}
      triggerLabel="Təhsil haqqı detallarına bax"
    >
      <DetailGrid>
        <DetailItem label="Proqram" value={program.name} wide />
        <DetailItem label="Dönəm" value={tuition.period.name} />
        <DetailItem
          label="Təhsil haqqı"
          value={formatMoney(tuition.tuitionFee, tuition.currency)}
        />
        <DetailItem
          label="Endirimli qiymət"
          value={
            tuition.discountedTuitionFee
              ? formatMoney(tuition.discountedTuitionFee, tuition.currency)
              : "Yoxdur"
          }
        />
        <DetailItem
          label="Təqaüd"
          value={
            tuition.scholarshipType
              ? formatEnumLabel(tuition.scholarshipType)
              : "Təqaüd yoxdur"
          }
        />
        <DetailItem
          label="Status"
          value={
            <StatusBadge tone={getStatusTone(tuition.priceStatus)}>
              {formatEnumLabel(tuition.priceStatus)}
            </StatusBadge>
          }
        />
        <DetailItem
          label="Ödəniş qeydi"
          value={tuition.paymentNote ?? "Ödəniş qeydi yoxdur"}
          wide
        />
      </DetailGrid>
    </DetailDialog>
  );
}

function DetailDialog({
  children,
  description,
  title,
  triggerLabel,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
  triggerLabel: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          aria-label={triggerLabel}
          className="rounded-xl border-[#dce6f4] bg-white text-[#334568] hover:bg-[#f4f8ff] hover:text-[#0b66ff]"
          size="icon-sm"
          variant="outline"
        >
          <EyeIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.65rem] border-[#dce6f4] bg-white p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-[#edf2f8] p-5 pr-12">
          <DialogTitle className="text-lg font-bold text-[#07183a]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#637392]">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="p-5">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function DetailItem({
  label,
  value,
  wide,
}: {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[1rem] border border-[#edf2f8] bg-[#fbfdff] p-4",
        wide ? "sm:col-span-2" : undefined,
      )}
    >
      <div className="text-xs font-bold uppercase text-[#71809f]">{label}</div>
      <div className="mt-1 break-words font-semibold text-[#07183a]">
        {value}
      </div>
    </div>
  );
}

function LogoBlock({
  logoUrl,
  name,
}: {
  logoUrl: string | null;
  name: string;
}) {
  return (
    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.1rem] bg-[#e8f1ff] text-xl font-black text-[#0b66ff] ring-1 ring-[#dce6f4]">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="size-full object-cover" src={logoUrl} />
      ) : (
        name.charAt(0)
      )}
    </div>
  );
}

function SummaryCard({
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: typeof Building2Icon;
  label: string;
  tone: "blue" | "green" | "orange" | "violet";
  value: number;
}) {
  return (
    <Card className="overflow-hidden rounded-[1.25rem] border-[#dce6f4] bg-white py-0 shadow-[0_14px_34px_rgba(15,23,42,0.04)]">
      <CardContent className="p-4">
        <div
          className={cn(
            "mb-4 h-1.5 rounded-full",
            tone === "blue" && "bg-[#0b66ff]",
            tone === "green" && "bg-[#16a34a]",
            tone === "orange" && "bg-[#f97316]",
            tone === "violet" && "bg-[#7c3aed]",
          )}
        />
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-[0.9rem] ring-1 ring-[#edf2f8]",
              tone === "blue" && "bg-[#eef5ff] text-[#0b66ff]",
              tone === "green" && "bg-[#e9f8ef] text-[#129344]",
              tone === "orange" && "bg-[#fff0df] text-[#f97316]",
              tone === "violet" && "bg-[#f1eafe] text-[#7c3aed]",
            )}
          >
            <Icon />
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs font-bold uppercase tracking-normal text-[#637392]">
              {label}
            </div>
            <div className="text-2xl font-black text-[#07183a]">{value}</div>
            <div className="mt-1 truncate text-xs font-medium text-[#71809f]">
              {detail}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionCard({
  action,
  children,
  description,
  title,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <Card className="rounded-[1.25rem] border-[#dce6f4] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.04)]">
      <CardHeader className="flex items-start justify-between gap-4 border-b border-[#edf2f8] bg-[#fbfdff] pb-4">
        <div className="min-w-0">
          <CardTitle className="text-base font-black text-[#07183a]">
            {title}
          </CardTitle>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-5 text-[#637392]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </CardHeader>
      <CardContent className="p-4 lg:p-5">{children}</CardContent>
    </Card>
  );
}

function RecordsSection({
  action,
  children,
  description,
  title,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <SectionCard action={action} description={description} title={title}>
      {children}
    </SectionCard>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-[#edf2f8] bg-[#fbfdff] p-4">
      <div className="text-xs font-bold uppercase text-[#71809f]">{label}</div>
      <div className="mt-1 font-semibold text-[#07183a]">{value}</div>
    </div>
  );
}

function RecordDialog({
  children,
  defaultOpen,
  description,
  title,
  trigger,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
  description: string;
  title: string;
  trigger?: React.ReactNode;
}) {
  return (
    <Dialog defaultOpen={defaultOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.65rem] border-[#dce6f4] bg-white p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-[#edf2f8] p-5 pr-12">
          <DialogTitle className="text-lg font-bold text-[#07183a]">
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="p-5">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

function ContactChip({
  type,
  value,
  whatsapp,
}: {
  type: "email" | "phone" | "website";
  value: string | null;
  whatsapp?: string | null;
}) {
  if (!value) {
    return null;
  }

  const Icon =
    type === "email" ? MailIcon : type === "phone" ? PhoneIcon : GlobeIcon;
  const label = type === "website" ? "Vebsayt" : value;

  if (type === "phone") {
    return (
      <PhoneActionMenu
        className="rounded-full px-3 py-1.5 text-xs"
        phone={value}
        whatsapp={whatsapp}
      />
    );
  }

  return (
    <a
      className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#dce6f4] bg-[#fbfdff] px-3 py-1.5 text-xs font-semibold text-[#334568] transition hover:border-[#0b66ff]/35 hover:bg-[#eef5ff] hover:text-[#0b66ff]"
      href={type === "email" ? `mailto:${value}` : value}
      rel={type === "website" ? "noreferrer" : undefined}
      target={type === "website" ? "_blank" : undefined}
    >
      <Icon />
      <span className="truncate">{label}</span>
    </a>
  );
}

function ContactLine({
  type,
  value,
  whatsapp,
}: {
  type: "email" | "phone";
  value: string | null;
  whatsapp?: string | null;
}) {
  if (!value) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#334568]">
        {type === "email" ? (
          <MailIcon className="text-[#0b66ff]" />
        ) : (
          <PhoneIcon className="text-[#0b66ff]" />
        )}
        Təyin edilməyib
      </div>
    );
  }

  if (type === "phone") {
    return <PhoneActionMenu phone={value} whatsapp={whatsapp} />;
  }

  return (
    <a
      className="flex w-fit items-center gap-2 rounded-xl px-2 py-1 text-sm text-[#334568] transition hover:bg-[#eef5ff] hover:text-[#0b66ff]"
      href={`mailto:${value}`}
    >
      <MailIcon className="text-[#0b66ff]" />
      {value}
    </a>
  );
}

function PhoneActionMenu({
  className,
  phone,
  whatsapp,
}: {
  className?: string;
  phone: string;
  whatsapp?: string | null;
}) {
  const whatsappNumber = whatsapp || phone;
  const telHref = `tel:${normalizePhoneForTel(phone)}`;
  const whatsappHref = buildWhatsappHref(whatsappNumber);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex w-fit max-w-full items-center gap-2 rounded-xl border border-[#dce6f4] bg-[#fbfdff] px-2 py-1 text-sm font-semibold text-[#334568] transition hover:border-[#0b66ff]/35 hover:bg-[#eef5ff] hover:text-[#0b66ff]",
            className,
          )}
          type="button"
        >
          <PhoneIcon />
          <span className="truncate">{phone}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-60 rounded-[1.25rem] border-[#dce6f4] bg-white p-2 shadow-[0_24px_70px_rgba(15,23,42,0.16)]"
      >
        <DropdownMenuLabel className="px-3 py-2 text-xs font-bold uppercase text-[#71809f]">
          Kontakt əməliyyatları
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem
            asChild
            className="rounded-xl px-3 py-2 font-semibold text-[#24365f] focus:bg-[#e9f8ef] focus:text-[#129344]"
          >
            <a href={whatsappHref} rel="noreferrer" target="_blank">
              <MessageCircleIcon data-icon="inline-start" />
              WhatsApp
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="rounded-xl px-3 py-2 font-semibold text-[#24365f] focus:bg-[#eef5ff] focus:text-[#0b66ff]"
          >
            <a href={telHref}>
              <PhoneCallIcon data-icon="inline-start" />
              Zəng et
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-[#edf2f8]" />
        <div className="px-3 py-2 text-xs leading-5 text-[#637392]">
          {whatsapp
            ? `WhatsApp: ${whatsapp}`
            : "WhatsApp bu telefon nömrəsindən istifadə edir."}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function normalizePhoneForTel(value: string) {
  const trimmed = value.trim();
  const prefix = trimmed.startsWith("+") ? "+" : "";
  return `${prefix}${trimmed.replace(/[^\d]/g, "")}`;
}

function buildWhatsappHref(value: string) {
  return `https://wa.me/${value.replace(/[^\d]/g, "")}`;
}

function StatusBadge({
  children,
  tone = "green",
}: {
  children: React.ReactNode;
  tone?: "blue" | "green" | "orange" | "red" | "violet" | "neutral";
}) {
  return (
    <Badge
      className={cn(
        "rounded-full font-semibold",
        getToneClasses(tone, "badge"),
      )}
      variant="secondary"
    >
      {children}
    </Badge>
  );
}

function getToneClasses(
  tone: "blue" | "green" | "orange" | "red" | "violet" | "neutral",
  variant: "badge" | "soft",
) {
  const classes = {
    blue:
      variant === "badge"
        ? "bg-[#e8f1ff] text-[#0b66ff]"
        : "bg-[#e8f1ff] text-[#0b66ff]",
    green:
      variant === "badge"
        ? "bg-[#e9f8ef] text-[#129344]"
        : "bg-[#e9f8ef] text-[#129344]",
    neutral:
      variant === "badge"
        ? "bg-[#eef2f7] text-[#52627f]"
        : "bg-[#eef2f7] text-[#52627f]",
    orange:
      variant === "badge"
        ? "bg-[#fff0df] text-[#f97316]"
        : "bg-[#fff0df] text-[#f97316]",
    red:
      variant === "badge" ? "bg-red-50 text-red-600" : "bg-red-50 text-red-600",
    violet:
      variant === "badge"
        ? "bg-[#f1eafe] text-[#7c3aed]"
        : "bg-[#f1eafe] text-[#7c3aed]",
  } as const;

  return classes[tone];
}

function getStatusTone(value: string) {
  if (["ACTIVE", "ACTIVE_PARTNER", "OPEN"].includes(value)) {
    return "green";
  }

  if (
    ["PENDING", "AGREEMENT_PENDING", "DRAFT", "PROSPECT", "NONE"].includes(
      value,
    )
  ) {
    return "blue";
  }

  if (["EXPIRED", "CLOSED"].includes(value)) {
    return "orange";
  }

  if (["SUSPENDED", "ARCHIVED"].includes(value)) {
    return "red";
  }

  return "neutral";
}

function getStudentStatusTone(status: string) {
  if (status === "Accepted" || status === "Qəbul edildi") {
    return "green";
  }

  if (
    status === "Under Review" ||
    status === "Applied" ||
    status === "Baxılır" ||
    status === "Müraciət edildi"
  ) {
    return "blue";
  }

  if (status === "Documents Pending" || status === "Sənədlər gözlənilir") {
    return "orange";
  }

  return "neutral";
}

function CampusForm({
  university,
  values,
}: {
  university: { id: string; country: string; city: string };
  values?: {
    address: string | null;
    city: string;
    country: string;
    id: string;
    imageAccessUrl?: string | null;
    imageUrl?: string | null;
    isMainCampus: boolean;
    latitude?: unknown;
    longitude?: unknown;
    name: string;
    notes: string | null;
    status: string;
  };
}) {
  const isEditing = Boolean(values);

  if (CampusFormModule.CampusForm) {
    return (
      <CampusFormModule.CampusForm
        university={{
          city: university.city,
          country: university.country,
          id: university.id,
        }}
        values={
          values
            ? {
                address: values.address,
                city: values.city,
                country: values.country,
                id: values.id,
                imageAccessUrl: values.imageAccessUrl ?? null,
                imageUrl: values.imageUrl ?? null,
                isMainCampus: values.isMainCampus,
                latitude: toNumber(values.latitude),
                longitude: toNumber(values.longitude),
                name: values.name,
                notes: values.notes,
                status: values.status,
              }
            : undefined
        }
      />
    );
  }

  return (
    <form
      action={isEditing ? updateCampusAction : createCampusAction}
      className="space-y-3"
    >
      <input name="universityId" type="hidden" value={university.id} />
      {values ? (
        <input name="campusId" type="hidden" value={values.id} />
      ) : null}
      {values ? (
        <EditModeBar href={`/universities/${university.id}?tab=campuses`} />
      ) : null}
      <FormInput
        defaultValue={values?.name}
        name="name"
        placeholder="Əsas kampus"
        required
      />
      <div className="grid gap-3 md:grid-cols-2">
        <FormInput
          name="country"
          placeholder="Ölkə"
          defaultValue={values?.country ?? university.country}
          required
        />
        <FormInput
          name="city"
          placeholder="Şəhər"
          defaultValue={values?.city ?? university.city}
          required
        />
      </div>
      <FormInput
        defaultValue={values?.address ?? undefined}
        name="address"
        placeholder="Ünvan"
      />
      <FormSelect
        defaultValue={values?.status}
        name="status"
        options={ENTITY_STATUSES}
      />
      <label className="flex items-center gap-2 text-sm font-medium text-[#334568]">
        <input
          defaultChecked={values?.isMainCampus}
          name="isMainCampus"
          type="checkbox"
        />
        Əsas kampus
      </label>
      <FormTextarea
        defaultValue={values?.notes ?? undefined}
        name="notes"
        placeholder="Kampus qeydləri"
      />
      <SubmitButton>
        {isEditing ? "Kampusu yenilə" : "Kampus əlavə et"}
      </SubmitButton>
    </form>
  );
}

function TuitionForm({
  defaultCurrency,
  defaultPeriodId,
  periods,
  programs,
  universityId,
  values,
}: {
  defaultCurrency?: string;
  defaultPeriodId?: string;
  periods: Array<{ id: string; name: string }>;
  programs: Array<{ id: string; name: string }>;
  universityId: string;
  values?: {
    currency: string;
    discountedTuitionFee: unknown;
    id: string;
    paymentNote: string | null;
    periodId: string;
    priceStatus: string;
    programId: string;
    scholarshipType: string | null;
    scholarshipValue: unknown;
    tuitionFee: unknown;
  };
}) {
  const isEditing = Boolean(values);

  return (
    <form
      action={isEditing ? updateTuitionAction : createTuitionAction}
      className="space-y-3"
    >
      <input name="universityId" type="hidden" value={universityId} />
      {values ? (
        <input name="tuitionId" type="hidden" value={values.id} />
      ) : null}
      {values ? (
        <EditModeBar href={`/universities/${universityId}?tab=programs`} />
      ) : null}
      <FormSelect
        defaultValue={values?.programId}
        name="programId"
        options={programs.map((program) => ({
          label: program.name,
          value: program.id,
        }))}
        required
      />
      <FormSelect
        defaultValue={values?.periodId ?? defaultPeriodId}
        name="periodId"
        options={periods.map((period) => ({
          label: period.name,
          value: period.id,
        }))}
        required
      />
      <div className="grid gap-3 md:grid-cols-3">
        <FormSelect
          defaultValue={values?.currency ?? defaultCurrency ?? "USD"}
          name="currency"
          options={CURRENCIES}
        />
        <FormInput
          defaultValue={toInputNumber(values?.tuitionFee)}
          name="tuitionFee"
          placeholder="Rəsmi qiymət (məs: 12000)"
          required
          type="number"
        />
        <FormInput
          defaultValue={toInputNumber(values?.discountedTuitionFee)}
          name="discountedTuitionFee"
          placeholder="Endirimli yekun qiymet (məs: 9500)"
          type="number"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <FormSelect
          defaultValue={values?.scholarshipType ?? undefined}
          name="scholarshipType"
          options={SCHOLARSHIP_TYPES}
          placeholder="Təqaüd yoxdur"
        />
        <FormInput
          defaultValue={toInputNumber(values?.scholarshipValue)}
          name="scholarshipValue"
          placeholder="Teqaud meblegi/faizi (məs: 2500 ve ya 25)"
          type="number"
        />
      </div>
      <FormSelect
        defaultValue={values?.priceStatus}
        name="priceStatus"
        options={PRICE_STATUSES}
      />
      <FormTextarea
        defaultValue={values?.paymentNote ?? undefined}
        name="paymentNote"
        placeholder="Ödəniş qeydi"
      />
      <SubmitButton>
        {isEditing ? "Təhsil haqqını yenilə" : "Təhsil haqqı əlavə et"}
      </SubmitButton>
    </form>
  );
}

function DocumentForm({
  universityId,
  values,
}: {
  universityId: string;
  values?: {
    documentType: string;
    expiryDate: Date | null;
    fileUrl: string;
    id: string;
    notes: string | null;
    relatedEntityId: string;
    relatedEntityType: string;
    title: string;
    validFrom: Date | null;
  };
}) {
  const isEditing = Boolean(values);

  return (
    <form
      action={isEditing ? updateDocumentAction : createDocumentAction}
      className="space-y-3"
    >
      <input name="universityId" type="hidden" value={universityId} />
      <input
        name="relatedEntityType"
        type="hidden"
        value={values?.relatedEntityType ?? "UNIVERSITY"}
      />
      <input
        name="relatedEntityId"
        type="hidden"
        value={values?.relatedEntityId ?? universityId}
      />
      {values ? (
        <input name="documentId" type="hidden" value={values.id} />
      ) : null}
      {values ? (
        <>
          <input name="currentFileUrl" type="hidden" value={values.fileUrl} />
          <EditModeBar href={`/universities/${universityId}?tab=documents`} />
        </>
      ) : null}
      <FormInput
        defaultValue={values?.title}
        name="title"
        placeholder="Tərəfdaşlıq müqaviləsi 2026"
        required
      />
      <FormSelect
        defaultValue={values?.documentType}
        name="documentType"
        options={DOCUMENT_TYPES}
      />
      <FormInput
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
        name="file"
        type="file"
      />
      <FormInput
        defaultValue={
          values && !values.fileUrl.startsWith("storage://")
            ? values.fileUrl
            : undefined
        }
        name="fileUrl"
        placeholder="Və ya xarici fayl URL-i yapışdırın"
      />
      <div className="grid gap-3 md:grid-cols-2">
        <DateField
          defaultValue={toDateInput(values?.validFrom)}
          label="Başlama tarixi"
          name="validFrom"
        />
        <DateField
          defaultValue={toDateInput(values?.expiryDate)}
          label="Bitmə tarixi"
          name="expiryDate"
        />
      </div>
      <FormTextarea
        defaultValue={values?.notes ?? undefined}
        name="notes"
        placeholder="Sənəd qeydləri"
      />
      <SubmitButton>
        {isEditing ? "Sənədi yenilə" : "Sənəd əlavə et"}
      </SubmitButton>
    </form>
  );
}

function ContactForm({
  universityId,
  values,
}: {
  universityId: string;
  values?: {
    department: string | null;
    email: string | null;
    fullName: string;
    id: string;
    isPrimary: boolean;
    notes: string | null;
    phone: string | null;
    position: string | null;
    status: string;
    whatsapp: string | null;
  };
}) {
  const isEditing = Boolean(values);

  return (
    <form
      action={isEditing ? updateContactAction : createContactAction}
      className="space-y-3"
    >
      <input name="universityId" type="hidden" value={universityId} />
      {values ? (
        <input name="contactId" type="hidden" value={values.id} />
      ) : null}
      {values ? (
        <EditModeBar href={`/universities/${universityId}?tab=profile`} />
      ) : null}
      <FormInput
        defaultValue={values?.fullName}
        name="fullName"
        placeholder="Aygün Məmmədova"
        required
      />
      <div className="grid gap-3 md:grid-cols-2">
        <FormInput
          defaultValue={values?.position ?? undefined}
          name="position"
          placeholder="Direktor"
        />
        <FormInput
          defaultValue={values?.department ?? undefined}
          name="department"
          placeholder="Beynİlxalq ofis"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <FormInput
          defaultValue={values?.email ?? undefined}
          name="email"
          placeholder="sarah@university.edu"
          type="email"
        />
        <FormInput
          defaultValue={values?.phone ?? undefined}
          name="phone"
          placeholder="+61..."
        />
      </div>
      <FormInput
        defaultValue={values?.whatsapp ?? undefined}
        name="whatsapp"
        placeholder="WhatsApp"
      />
      <label className="flex items-center gap-2 text-sm font-medium text-[#334568]">
        <input
          defaultChecked={values?.isPrimary}
          name="isPrimary"
          type="checkbox"
        />
        Əsas kontakt
      </label>
      <FormSelect
        defaultValue={values?.status}
        name="status"
        options={ENTITY_STATUSES}
      />
      <FormTextarea
        defaultValue={values?.notes ?? undefined}
        name="notes"
        placeholder="Kontakt qeydləri"
      />
      <SubmitButton>
        {isEditing ? "Kontaktı yenilə" : "Kontakt əlavə et"}
      </SubmitButton>
    </form>
  );
}

function NoteForm({
  universityId,
  values,
}: {
  universityId: string;
  values?: {
    body: string;
    id: string;
    relatedEntityId: string | null;
    relatedEntityType: string | null;
  };
}) {
  const isEditing = Boolean(values);

  return (
    <form
      action={isEditing ? updateNoteAction : createNoteAction}
      className="space-y-3"
    >
      <input name="universityId" type="hidden" value={universityId} />
      <input
        name="relatedEntityType"
        type="hidden"
        value={values?.relatedEntityType ?? "UNIVERSITY"}
      />
      <input
        name="relatedEntityId"
        type="hidden"
        value={values?.relatedEntityId ?? universityId}
      />
      {values ? <input name="noteId" type="hidden" value={values.id} /> : null}
      {values ? (
        <EditModeBar href={`/universities/${universityId}?tab=activity`} />
      ) : null}
      <FormTextarea
        defaultValue={values?.body}
        name="body"
        placeholder="Daxili qeyd"
        required
      />
      <SubmitButton>
        {isEditing ? "Qeydi yenilə" : "Qeyd əlavə et"}
      </SubmitButton>
    </form>
  );
}

function PeriodForm({ universityId }: { universityId: string }) {
  return (
    <form action={createPeriodAction} className="space-y-3">
      <input name="universityId" type="hidden" value={universityId} />
      <FormInput name="name" placeholder="2026 Payız" required />
      <div className="grid gap-3 md:grid-cols-2">
        <FormInput name="year" placeholder="2026" required type="number" />
        <FormInput name="season" placeholder="Payız" required />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <FormInput name="applicationStartDate" type="date" />
        <FormInput name="applicationDeadline" type="date" />
      </div>
      <FormSelect defaultValue="OPEN" name="status" options={PERIOD_STATUSES} />
      <FormTextarea name="notes" placeholder="Dönəm qeydləri" />
      <SubmitButton>Dönəmi saxla</SubmitButton>
    </form>
  );
}

function ProgramTuitionTable({
  programs,
  universityId,
}: {
  programs: Array<{
    campus: { name: string } | null;
    duration?: string | null;
    educationLanguage: { name: string };
    educationLevel: { name: string };
    id: string;
    name: string;
    requirementsSummary?: string | null;
    studyMode?: string | null;
    tuitions: Array<{
      currency: string;
      discountedTuitionFee: unknown;
      id: string;
      lastUpdatedAt?: Date;
      paymentNote?: string | null;
      period: { name: string };
      priceStatus: string;
      scholarshipType?: string | null;
      scholarshipValue?: unknown;
      tuitionFee: unknown;
    }>;
  }>;
  universityId: string;
}) {
  type ProgramRow = (typeof programs)[number];
  type TuitionRow = ProgramRow["tuitions"][number];
  const rows = programs.flatMap<{
    program: ProgramRow;
    tuition: TuitionRow | null;
  }>((program) =>
    program.tuitions.length > 0
      ? program.tuitions.map((tuition) => ({ program, tuition }))
      : [{ program, tuition: null }],
  );

  if (rows.length === 0) {
    return <EmptyState text="Hələ proqram əlavə edilməyib." />;
  }

  return (
    <Table className="min-w-[1120px]">
      <TableHeader>
        <TableRow className="bg-[#fbfdff] hover:bg-[#fbfdff]">
          <TableHead className="px-4">Proqram</TableHead>
          <TableHead>Pillə / Dil</TableHead>
          <TableHead>Kampus</TableHead>
          <TableHead>Müddət</TableHead>
          <TableHead>Dönəm</TableHead>
          <TableHead className="text-right">Təhsil haqqı</TableHead>
          <TableHead className="text-right">Endirim / Təqaüd</TableHead>
          <TableHead className="text-right">Əməliyyatlar</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ program, tuition }) => (
          <TableRow
            key={tuition ? tuition.id : program.id}
            className="h-16 border-b border-[#edf2f8]/70"
          >
            <TableCell className="px-4">
              <div className="flex min-w-72 items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#e8f1ff] text-[#0b66ff]">
                  <BookOpenIcon />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-[#07183a]">
                    {program.name}
                  </div>
                  <div className="mt-1 max-w-md truncate text-xs text-[#637392]">
                    {program.requirementsSummary ?? "Tələblər təyin edilməyib"}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="font-medium text-[#334568]">
                {program.educationLevel.name}
              </div>
              <div className="mt-1 text-xs text-[#637392]">
                {program.educationLanguage.name}
              </div>
            </TableCell>
            <TableCell className="font-medium text-[#334568]">
              {program.campus?.name ?? "Təyin edilməyib"}
            </TableCell>
            <TableCell>
              <div className="font-medium text-[#334568]">
                {program.duration ?? "Təyin edilməyib"}
              </div>
              <div className="mt-1 text-xs text-[#637392]">
                {program.studyMode ?? "Format təyin edilməyib"}
              </div>
            </TableCell>
            <TableCell className="font-medium text-[#334568]">
              {tuition?.period.name ?? "Təyin edilməyib"}
            </TableCell>
            <TableCell className="text-right font-semibold tabular-nums text-[#07183a]">
              {tuition
                ? formatMoney(tuition.tuitionFee, tuition.currency)
                : "Təyin edilməyib"}
            </TableCell>
            <TableCell className="text-right">
              <div className="font-semibold tabular-nums text-[#129344]">
                {tuition?.discountedTuitionFee
                  ? formatMoney(tuition.discountedTuitionFee, tuition.currency)
                  : "Yoxdur"}
              </div>
              <div className="mt-1 text-xs text-[#637392]">
                {tuition?.scholarshipType
                  ? formatEnumLabel(tuition.scholarshipType)
                  : "Təqaüd yoxdur"}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                {tuition ? (
                  <TuitionDetailsDialog program={program} tuition={tuition} />
                ) : (
                  <ProgramDetailsDialog program={program} />
                )}
                <Button
                  asChild
                  className="rounded-xl bg-[#0b66ff] px-3 text-xs font-black text-white shadow-[0_10px_22px_rgba(37,99,235,0.20)] hover:bg-[#0754d6]"
                  size="sm"
                >
                  <Link
                    href={buildApplicationPrefillHref({
                      programId: program.id,
                      tuitionId: tuition?.id ?? null,
                      universityId,
                    })}
                  >
                    <FilePlus2Icon data-icon="inline-start" />
                    Müraciət et
                  </Link>
                </Button>
                <ProgramTuitionActionsMenu
                  programId={program.id}
                  tuitionId={tuition?.id ?? null}
                  universityId={universityId}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ProgramTuitionActionsMenu({
  programId,
  tuitionId,
  universityId,
}: {
  programId: string;
  tuitionId: string | null;
  universityId: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Əməliyyatlar"
          className="rounded-xl border-[#dce6f4] bg-white text-[#334568] hover:bg-[#f4f8ff] hover:text-[#0b66ff]"
          size="icon-sm"
          variant="outline"
        >
          <MoreVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-48 rounded-2xl border-[#dce6f4] p-2"
      >
        <DropdownMenuItem asChild className="rounded-xl font-semibold">
          <Link
            href={`/universities/${universityId}?tab=programs&editProgram=${programId}`}
          >
            <PencilIcon data-icon="inline-start" />
            Proqramı redaktə et
          </Link>
        </DropdownMenuItem>
        {tuitionId ? (
          <>
            <DropdownMenuItem asChild className="rounded-xl font-semibold">
              <Link
                href={`/universities/${universityId}?tab=programs&editTuition=${tuitionId}`}
              >
                <PencilIcon data-icon="inline-start" />
                Qiyməti redaktə et
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#edf2f8]" />
            <ArchiveMenuItemButton
              action={expireTuitionAction}
              id={tuitionId}
              idName="tuitionId"
              label="Qiymətin müddətini bitir"
              universityId={universityId}
            />
          </>
        ) : null}
        <ArchiveMenuItemButton
          action={archiveProgramAction}
          id={programId}
          idName="programId"
          label="Proqramı arxivlə"
          universityId={universityId}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function buildApplicationPrefillHref({
  programId,
  tuitionId,
  universityId,
}: {
  programId: string;
  tuitionId?: string | null;
  universityId: string;
}) {
  const params = new URLSearchParams({
    programId,
    universityId,
  });

  if (tuitionId) {
    params.set("tuitionId", tuitionId);
  }

  return `/applications/new?${params.toString()}`;
}

function PeriodsTable({
  periods,
  relatedPeriodIds,
}: {
  periods: Array<{
    applicationDeadline: Date | null;
    applicationStartDate: Date | null;
    id: string;
    name: string;
    notes: string | null;
    season: string;
    status: string;
    year: number;
  }>;
  relatedPeriodIds: Set<string>;
}) {
  if (periods.length === 0) {
    return <EmptyState text="Hələ dönəm əlavə edilməyib." />;
  }

  return (
    <Table className="min-w-[860px]">
      <TableHeader>
        <TableRow className="bg-[#fbfdff] hover:bg-[#fbfdff]">
          <TableHead className="px-4">Dönəm</TableHead>
          <TableHead>İl / Mövsüm</TableHead>
          <TableHead>Müraciət pəncərəsi</TableHead>
          <TableHead>İstifadə</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {periods.map((period) => (
          <TableRow key={period.id} className="h-16">
            <TableCell className="px-4">
              <div className="font-semibold text-[#07183a]">{period.name}</div>
              <div className="mt-1 max-w-md truncate text-xs text-[#637392]">
                {period.notes ?? "Qeyd yoxdur"}
              </div>
            </TableCell>
            <TableCell>
              <div className="font-medium">{period.year}</div>
              <div className="mt-1 text-xs text-[#637392]">{period.season}</div>
            </TableCell>
            <TableCell>
              {period.applicationStartDate || period.applicationDeadline ? (
                <div className="text-sm text-[#334568]">
                  {period.applicationStartDate
                    ? formatDate(period.applicationStartDate)
                    : "Başlanğıc yoxdur"}{" "}
                  -{" "}
                  {period.applicationDeadline
                    ? formatDate(period.applicationDeadline)
                    : "Son tarix yoxdur"}
                </div>
              ) : (
                <span className="text-[#637392]">Təyin edilməyib</span>
              )}
            </TableCell>
            <TableCell>
              <StatusBadge
                tone={relatedPeriodIds.has(period.id) ? "blue" : "neutral"}
              >
                {relatedPeriodIds.has(period.id)
                  ? "Bağlı"
                  : "Təkrar istifadə edilən"}
              </StatusBadge>
            </TableCell>
            <TableCell>
              <StatusBadge tone={getStatusTone(period.status)}>
                {formatEnumLabel(period.status)}
              </StatusBadge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DataList({
  empty,
  icon: Icon,
  items,
}: {
  empty: string;
  icon: typeof Building2Icon;
  items: Array<{
    actionHref?: string;
    actionLabel?: string;
    action?: React.ReactNode;
    description?: string;
    editHref?: string;
    highlights?: string[];
    imageUrl?: string | null;
    meta: string;
    status: string;
    title: string;
  }>;
}) {
  if (items.length === 0) {
    return <EmptyState text={empty} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <div
          key={`${item.title}-${index}`}
          className="rounded-2xl border border-[#edf2f8] bg-white p-4 transition hover:border-[#c9d9ee] hover:bg-[#fbfdff]"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#e8f1ff] text-[#0b66ff]">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="size-full object-cover"
                    src={item.imageUrl}
                  />
                ) : (
                  <Icon />
                )}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-[#07183a]">{item.title}</div>
                <div className="mt-1 text-sm text-[#637392]">{item.meta}</div>
                {item.description ? (
                  <div className="mt-2 max-w-4xl text-sm leading-6 text-[#334568]">
                    {item.description}
                  </div>
                ) : null}
                {item.highlights?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="rounded-full bg-[#f3f7fc] px-2.5 py-1 text-xs font-medium text-[#52627f]"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {item.actionHref ? (
                <Button
                  asChild
                  className="rounded-xl border-[#dce6f4] bg-white"
                  size="sm"
                  variant="outline"
                >
                  <a href={item.actionHref} rel="noreferrer" target="_blank">
                    <ExternalLinkIcon data-icon="inline-start" />
                    {item.actionLabel ?? "Açıq"}
                  </a>
                </Button>
              ) : null}
              {item.editHref ? <EditRecordButton href={item.editHref} /> : null}
              {item.action}
              <StatusBadge
                tone={getStatusTone(
                  item.status.toUpperCase().replaceAll(" ", "_"),
                )}
              >
                {item.status}
              </StatusBadge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function KontaktProfilGrid({
  contacts,
  universityId,
}: {
  contacts: Array<{
    department: string | null;
    email: string | null;
    fullName: string;
    id: string;
    isPrimary: boolean;
    notes: string | null;
    phone: string | null;
    position: string | null;
    status: string;
    whatsapp: string | null;
  }>;
  universityId: string;
}) {
  if (contacts.length === 0) {
    return <EmptyState text="Hələ əlaqə məlumatı əlavə edilməyib." />;
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {contacts.map((contact) => (
        <div
          key={`${contact.fullName}-${contact.email ?? contact.phone ?? ""}`}
          className="rounded-2xl border border-[#edf2f8] bg-[#fbfdff] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#e8f1ff] text-[#0b66ff]">
                <UserRoundIcon />
              </div>
              <div className="min-w-0">
                <div className="truncate font-bold text-[#07183a]">
                  {contact.fullName}
                </div>
                <div className="mt-1 text-sm font-medium text-[#637392]">
                  {contact.position ?? "Vəzifə təyin edilməyib"}
                </div>
                <div className="text-xs text-[#71809f]">
                  {contact.department ?? "Şöbə təyin edilməyib"}
                </div>
              </div>
            </div>
            <StatusBadge tone={contact.isPrimary ? "blue" : "neutral"}>
              {contact.isPrimary ? "Əsas" : formatEnumLabel(contact.status)}
            </StatusBadge>
          </div>
          <div className="mt-4 grid gap-2 text-sm text-[#334568]">
            <ContactLine type="email" value={contact.email} />
            <ContactLine
              type="phone"
              value={contact.phone}
              whatsapp={contact.whatsapp}
            />
            {contact.notes ? (
              <div className="rounded-xl bg-white px-3 py-2 text-xs leading-5 text-[#637392]">
                {contact.notes}
              </div>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <EditRecordButton
              href={`/universities/${universityId}?tab=profile&editContact=${contact.id}`}
            />
            <ArchiveItemButton
              action={archiveContactAction}
              id={contact.id}
              idName="contactId"
              universityId={universityId}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CampusShowcase({
  campuses,
  readOnly,
  universityId,
}: {
  campuses: UniversityDetailData["university"]["campuses"];
  readOnly?: boolean;
  universityId: string;
}) {
  if (campuses.length === 0) {
    return <EmptyState text="Hələ kampus əlavə edilməyib." />;
  }

  const [featuredCampus, ...otherCampuses] = campuses;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
      <CampusVisualCard
        campus={featuredCampus}
        featured
        readOnly={readOnly}
        universityId={universityId}
      />
      {otherCampuses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          {otherCampuses.map((campus) => (
            <CampusVisualCard
              campus={campus}
              key={campus.id}
              readOnly={readOnly}
              universityId={universityId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CampusVisualCard({
  campus,
  featured,
  readOnly,
  universityId,
}: {
  campus: UniversityDetailData["university"]["campuses"][number];
  featured?: boolean;
  readOnly?: boolean;
  universityId: string;
}) {
  const imageUrl = campus.imageAccessUrl ?? campus.imageUrl ?? null;
  const mapUrl = buildCampusMapUrl(campus);

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-[1.25rem] border border-[#dfe8f5] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] transition hover:border-[#bdd3f1] hover:shadow-[0_18px_42px_rgba(15,23,42,0.09)]",
        featured ? "min-h-[420px]" : "min-h-[260px]",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-[#eef5ff]",
          featured ? "h-64" : "h-36",
        )}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
            src={imageUrl}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-[linear-gradient(135deg,#eef5ff,#f8fbff_45%,#e8f7ef)] text-[#0b66ff]">
            <Building2Icon className={featured ? "size-14" : "size-10"} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#07183a]/70 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {campus.isMainCampus ? (
            <Badge className="rounded-full border border-white/50 bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#07183a] shadow-sm">
              Əsas kampus
            </Badge>
          ) : null}
          <Badge className="rounded-full border border-white/50 bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#52627f] shadow-sm">
            {formatEnumLabel(campus.status)}
          </Badge>
        </div>
      </div>
      <div className={cn("flex flex-col", featured ? "p-5" : "p-4")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              className={cn(
                "truncate font-black text-[#07183a]",
                featured ? "text-xl" : "text-base",
              )}
            >
              {campus.name}
            </h3>
            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#52627f]">
              <MapPinIcon className="size-4 text-[#0b66ff]" />
              <span className="truncate">
                {campus.city}, {campus.country}
              </span>
            </div>
          </div>
        </div>
        <p
          className={cn(
            "mt-3 text-sm leading-6 text-[#637392]",
            featured ? "line-clamp-3" : "line-clamp-2",
          )}
        >
          {campus.address ?? campus.notes ?? "Ünvan məlumatı əlavə edilməyib."}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            asChild
            className="rounded-xl border-[#dce6f4] bg-white text-[#0b66ff] hover:bg-[#f4f8ff]"
            size="sm"
            variant="outline"
          >
            <a href={mapUrl} rel="noreferrer" target="_blank">
              <ExternalLinkIcon data-icon="inline-start" />
              Xəritə
            </a>
          </Button>
          {!readOnly ? (
            <EditRecordButton
              href={`/universities/${universityId}?tab=campuses&editCampus=${campus.id}`}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}

function NewsRail({
  lastSyncedAt,
  news,
  readOnly = false,
  sourceUrl,
  universityId,
}: {
  lastSyncedAt?: Date | null;
  news: Array<{
    date: Date;
    id: string;
    imageUrl: string;
    sourceName: string | null;
    sourceUrl: string | null;
    summary: string;
    title: string;
  }>;
  readOnly?: boolean;
  sourceUrl?: string | null;
  universityId: string;
}) {
  const syncLabel = lastSyncedAt
    ? `Son yenilənmə: ${formatDate(lastSyncedAt)}`
    : "24 saatdan bir avtomatik yenilənir";

  if (news.length === 0) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-[#cfe0f5] bg-[#f8fbff] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#0b66ff]">
              <NewspaperIcon className="size-4" />
              Son xəbərlər
            </div>
            <p className="mt-2 text-sm font-semibold text-[#52627f]">
              Son xəbərlər burada görünəcək.
            </p>
            <p className="mt-1 text-xs font-medium text-[#8a9ab6]">
              {sourceUrl
                ? `${syncLabel}. Mənbə səhifəsi yoxlanılır.`
                : "Universitet profilində xəbər səhifəsinin URL-i əlavə edilməyib."}
            </p>
          </div>
          {sourceUrl && !readOnly ? (
            <form action={syncUniversityNewsAction}>
              <input name="universityId" type="hidden" value={universityId} />
              <Button className="rounded-xl" size="sm" type="submit">
                <RefreshCwIcon data-icon="inline-start" />
                Yenilə
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="-mx-1 overflow-x-auto pb-2">
        <div className="flex w-max gap-4 px-1">
          {news.map((item) => (
            <article
              key={item.id}
              className="group w-[280px] overflow-hidden rounded-[1.25rem] border border-[#dfe8f5] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-[#bcd4f6] hover:shadow-[0_18px_42px_rgba(15,23,42,0.1)] sm:w-[320px]"
            >
              <div className="relative h-40 overflow-hidden bg-[#eef5ff]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  src={item.imageUrl}
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#07183a]/60 to-transparent" />
                <Badge className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#24365f] shadow-sm">
                  {formatDate(item.date)}
                </Badge>
              </div>
              <div className="flex min-h-[205px] flex-col p-4">
                <div className="truncate text-xs font-bold uppercase text-[#8a9ab6]">
                  {item.sourceName ?? "Universitet xəbəri"}
                </div>
                <h3 className="mt-2 line-clamp-2 text-base font-black leading-6 text-[#07183a]">
                  {item.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#637392]">
                  {item.summary}
                </p>
                <Button
                  asChild
                  className="mt-auto w-fit rounded-xl border-[#dce6f4] bg-white text-[#0b66ff] hover:bg-[#f4f8ff]"
                  size="sm"
                  variant="outline"
                >
                  <Link href={`/universities/${universityId}/news/${item.id}`}>
                    <ExternalLinkIcon data-icon="inline-start" />
                    Detallara bax
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudentActivityTable({
  items,
}: {
  items: Array<{
    activity: string;
    date: Date;
    id: string;
    programName: string;
    status: string;
    studentName: string;
    universityName: string;
  }>;
}) {
  if (items.length === 0) {
    return (
      <EmptyState text="Bu universitetə hələ tələbə aktivliyi bağlı deyil." />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[920px]">
        <TableHeader>
          <TableRow className="bg-[#fbfdff] hover:bg-[#fbfdff]">
            <TableHead className="px-4">Tələbə</TableHead>
            <TableHead>Universitet</TableHead>
            <TableHead>Proqram / İxtisas</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tarix</TableHead>
            <TableHead>əlaqəli aktivlik</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="h-16">
              <TableCell className="px-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#e8f1ff] text-[#0b66ff]">
                    <UserRoundIcon />
                  </div>
                  <div className="font-semibold text-[#07183a]">
                    {item.studentName}
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-medium text-[#334568]">
                {item.universityName}
              </TableCell>
              <TableCell className="font-medium text-[#334568]">
                {item.programName}
              </TableCell>
              <TableCell>
                <StatusBadge tone={getStudentStatusTone(item.status)}>
                  {item.status}
                </StatusBadge>
              </TableCell>
              <TableCell className="text-sm text-[#637392]">
                {formatDate(item.date)}
              </TableCell>
              <TableCell className="text-sm text-[#334568]">
                {item.activity}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ArchiveItemButton({
  action,
  id,
  idName,
  label = "Arxivlə",
  universityId,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  idName: string;
  label?: string;
  universityId: string;
}) {
  return (
    <form action={action}>
      <input name={idName} type="hidden" value={id} />
      <input name="universityId" type="hidden" value={universityId} />
      <Button
        className="rounded-xl border-red-200 bg-white text-red-600 hover:bg-red-50"
        size="sm"
        type="submit"
        variant="outline"
      >
        {label}
      </Button>
    </form>
  );
}

function ArchiveMenuItemButton({
  action,
  id,
  idName,
  label,
  universityId,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  idName: string;
  label: string;
  universityId: string;
}) {
  return (
    <form action={action}>
      <input name={idName} type="hidden" value={id} />
      <input name="universityId" type="hidden" value={universityId} />
      <button
        className="relative flex w-full cursor-default select-none items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm font-semibold text-red-600 outline-none transition-colors hover:bg-red-50 focus:bg-red-50"
        type="submit"
      >
        <ArchiveIcon data-icon="inline-start" />
        {label}
      </button>
    </form>
  );
}

function EditRecordButton({
  href,
  label = "Edit",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Button
      asChild
      className="rounded-xl border-[#dce6f4] bg-white text-[#0b66ff] hover:bg-[#f4f8ff]"
      size="sm"
      variant="outline"
    >
      <Link href={href}>
        <PencilIcon data-icon="inline-start" />
        {label}
      </Link>
    </Button>
  );
}

function EditModeBar({ href }: { href: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#dce6f4] bg-[#f6f9ff] px-3 py-2">
      <span className="text-sm font-semibold text-[#334568]">
        Redaktə rejimi
      </span>
      <Button
        asChild
        className="h-8 rounded-xl border-[#dce6f4] bg-white px-3 text-[#334568]"
        size="sm"
        variant="outline"
      >
        <Link href={href}>
          <XIcon data-icon="inline-start" />
          Cancel
        </Link>
      </Button>
    </div>
  );
}

function FormInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      className={cn("h-11 rounded-2xl border-[#dce6f4]", props.className)}
    />
  );
}

function DateField({
  defaultValue,
  label,
  name,
}: {
  defaultValue?: string;
  label: string;
  name: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-[#71809f]">
        {label}
      </span>
      <FormInput defaultValue={defaultValue} name={name} type="date" />
    </label>
  );
}

function FormTextarea(props: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      {...props}
      className={cn("min-h-24 rounded-2xl border-[#dce6f4]", props.className)}
    />
  );
}

function FormSelect({
  defaultValue,
  name,
  options,
  placeholder,
  required,
}: {
  defaultValue?: string;
  name: string;
  options:
    | readonly string[]
    | Array<{
        label: string;
        value: string;
      }>;
  placeholder?: string;
  required?: boolean;
}) {
  const normalizedDefaultValue =
    defaultValue ?? (placeholder ? EMPTY_SELECT_VALUE : undefined);

  return (
    <Select
      defaultValue={normalizedDefaultValue}
      name={name}
      required={required}
    >
      <SelectTrigger className="h-11 w-full rounded-2xl border-[#dce6f4] bg-white px-3 text-sm font-semibold text-[#07183a] shadow-[0_8px_18px_rgba(15,23,42,0.03)] focus:border-[#0b66ff] focus:ring-[#0b66ff]/15">
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        align="start"
        className="max-h-72 rounded-[1.2rem] border-[#dce6f4] bg-white p-1 shadow-[0_24px_70px_rgba(15,23,42,0.16)]"
        position="popper"
      >
        <SelectGroup>
          {placeholder ? (
            <SelectItem
              value={EMPTY_SELECT_VALUE}
              className="rounded-xl py-2 font-semibold text-[#71809f] focus:bg-[#eef5ff] focus:text-[#0b66ff]"
            >
              {placeholder}
            </SelectItem>
          ) : null}
          {options.map((option) => {
            const value = typeof option === "string" ? option : option.value;
            const label =
              typeof option === "string"
                ? formatEnumLabel(option)
                : option.label;
            return (
              <SelectItem
                key={value}
                value={value}
                className="rounded-xl py-2 font-semibold text-[#24365f] focus:bg-[#eef5ff] focus:text-[#0b66ff]"
              >
                {label}
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <Button
      className="h-11 w-full rounded-2xl bg-[#0b66ff] shadow-[0_12px_28px_rgba(37,99,235,0.18)] hover:bg-[#075be8]"
      type="submit"
    >
      {children}
    </Button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-[#dce6f4] bg-[#fbfdff] text-sm font-medium text-[#637392]">
      {text}
    </div>
  );
}

function normalizeDetailTab(tab?: string): (typeof detailTabs)[number] {
  if (tab === "tuition") {
    return "programs";
  }

  if (tab === "contacts") {
    return "profile";
  }

  if (tab === "notes") {
    return "activity";
  }

  if (tab === "news") {
    return "overview";
  }

  if (detailTabs.includes(tab as (typeof detailTabs)[number])) {
    return tab as (typeof detailTabs)[number];
  }

  return "overview";
}

function normalizeReadOnlyDetailTab(
  tab: string | undefined,
  portalType: ReadOnlyPortalType,
): ReadOnlyDetailTab {
  const normalizedTab = normalizeDetailTab(tab);

  if (portalType === "agent") {
    if (
      agentDetailTabs.includes(
        normalizedTab as (typeof agentDetailTabs)[number],
      )
    ) {
      return normalizedTab as (typeof agentDetailTabs)[number];
    }

    return "overview";
  }

  if (
    studentDetailTabs.includes(
      normalizedTab as (typeof studentDetailTabs)[number],
    )
  ) {
    return normalizedTab as (typeof studentDetailTabs)[number];
  }

  return "overview";
}

function formatTabLabel(value: string) {
  const labels: Record<string, string> = {
    activity: "Aktivlik",
    campuses: "Kampuslar",
    documents: "Sənədlər",
    overview: "İcmal",
    periods: "Dönəmlər",
    profile: "Profil və kontakt",
    programs: "Proqramlar və təhsil haqqı",
  };

  return labels[value] ?? value;
}

function buildCampusMapUrl(campus: {
  address?: string | null;
  city: string;
  country: string;
  latitude?: unknown;
  longitude?: unknown;
}) {
  const latitude = toNumber(campus.latitude);
  const longitude = toNumber(campus.longitude);

  if (latitude !== null && longitude !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }

  const query = [campus.address, campus.city, campus.country]
    .filter(Boolean)
    .join(", ");

  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : undefined;
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function toDateInput(value?: Date | null) {
  if (!value) {
    return undefined;
  }

  return value.toISOString().slice(0, 10);
}

function toInputNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  return String(value);
}
