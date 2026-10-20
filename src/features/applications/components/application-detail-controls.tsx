"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangleIcon,
  BellRingIcon,
  Building2Icon,
  CalendarClockIcon,
  CheckCircle2Icon,
  CircleDollarSignIcon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  PlusIcon,
  SendIcon,
  ShieldCheckIcon,
  UploadCloudIcon,
  UserRoundIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  acknowledgeApplicationDocumentRequestAction,
  addApplicationDocumentAction,
  createApplicationDocumentRequestAction,
  submitApplicationDocumentRequestResponseAction,
  submitStudentApplicationAction,
  toggleApplicationDocumentReviewedAction,
  updateApplicationDocumentStatusAction,
  updateApplicationStatusAction,
  uploadApplicationDocumentAction,
} from "@/features/applications/actions";
import {
  APPLICATION_ADDITIONAL_DOCUMENT_CATEGORIES,
  APPLICATION_DECISION_STATUSES,
  APPLICATION_DOCUMENT_REQUEST_STATUS_LABELS,
  APPLICATION_DOCUMENT_REQUEST_TYPES,
  APPLICATION_DOCUMENT_RESPONSE_TYPES,
  APPLICATION_REASON_REQUIRED_STATUSES,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_TRANSITIONS,
} from "@/features/applications/constants";
import { cn } from "@/lib/utils";

export type ApplicationDetailStudentField = {
  id: string;
  label: string;
  value: string;
};

export type ApplicationDetailDocumentRow = {
  accessUrl: string | null;
  documentGroup: string;
  documentGroupLabel: string;
  documentKey: string;
  downloadUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  isRequired: boolean;
  mimeType: string | null;
  notes: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  status: string;
  title: string;
  uploadedAt: string | null;
  uploadedBy: string | null;
};

export type ApplicationDetailDocumentRequestRow = {
  accessUrl: string | null;
  acknowledgedAt: string | null;
  amount: string | null;
  applicationChoiceId: string;
  completedAt: string | null;
  createdAt: string;
  createdBy: string | null;
  currency: string | null;
  deadline: string;
  deadlineAt: string;
  documentType: string;
  downloadUrl: string | null;
  fileName: string;
  fileSize: number;
  id: string;
  instructions: string | null;
  isOverdue: boolean;
  responseAccessUrl: string | null;
  responseDate: string | null;
  responseDownloadUrl: string | null;
  responseFileName: string | null;
  responseFileSize: number | null;
  respondedBy: string | null;
  responseNote: string | null;
  responseType: string;
  status: string;
  title: string;
};

export type ApplicationDetailChoiceRow = {
  campusName: string | null;
  city: string;
  decidedAt: string | null;
  decidedBy: string | null;
  documentRequests: ApplicationDetailDocumentRequestRow[];
  educationLevel: string;
  id: string;
  language: string;
  price: string;
  priority: number;
  programName: string;
  status: string;
  statusLabel: string;
  statusReason: string | null;
  universityId: string;
  universityName: string;
  universityType: string;
};

export type ApplicationDetailFeedback = {
  message: string;
  type: "error" | "success";
} | null;

type ApplicationDetailControlsProps = {
  applicationId: string;
  canManageDocuments: boolean;
  canManageDocumentRequests: boolean;
  canManageStatus: boolean;
  canRespondDocumentRequests: boolean;
  canUploadDocuments: boolean;
  canSubmitDraft: boolean;
  children: React.ReactNode;
  choices: ApplicationDetailChoiceRow[];
  currentStatus: string;
  documents: ApplicationDetailDocumentRow[];
  feedback: ApplicationDetailFeedback;
  internalNotes: string;
  isStudentPortal: boolean;
  latestStatusReason: string | null;
  missingRequiredDocuments: number;
  statusLabel: string;
  studentFields: ApplicationDetailStudentField[];
  studentName: string;
  totalDocuments: number;
  uploadedDocuments: number;
};

type WorkflowContext = Omit<ApplicationDetailControlsProps, "children" | "feedback">;

export function ApplicationDetailControls({
  children,
  feedback,
  ...context
}: ApplicationDetailControlsProps) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [studentOpen, setStudentOpen] = useState(false);
  const [previewDocument, setPreviewDocument] =
    useState<ApplicationDetailDocumentRow | null>(null);
  const [selectedDocument, setSelectedDocument] =
    useState<ApplicationDetailDocumentRow | null>(null);
  const [selectedChoice, setSelectedChoice] =
    useState<ApplicationDetailChoiceRow | null>(null);
  const [documentRequestChoice, setDocumentRequestChoice] =
    useState<ApplicationDetailChoiceRow | null>(null);

  function openStatus(
    document?: ApplicationDetailDocumentRow,
    choice?: ApplicationDetailChoiceRow,
  ) {
    setSelectedDocument(document ?? null);
    setSelectedChoice(choice ?? null);
    setStatusOpen(true);
  }

  useEffect(() => {
    if (!feedback) {
      return;
    }

    if (feedback.type === "error") {
      toast.error(feedback.message);
      return;
    }

    toast.success(feedback.message);
  }, [feedback]);

  return (
    <ApplicationDetailControlsContext.Provider
      value={{
        ...context,
        openPreview: setPreviewDocument,
        openDocumentRequests: setDocumentRequestChoice,
        openStatus,
        openStudent: () => setStudentOpen(true),
      }}
    >
      {children}
      <StatusDecisionDialog
        context={context}
        onOpenChange={(open) => {
          setStatusOpen(open);
          if (!open) {
            setSelectedDocument(null);
            setSelectedChoice(null);
          }
        }}
        open={statusOpen}
        selectedChoice={selectedChoice}
        selectedDocument={selectedDocument}
      />
      <StudentInfoDialog
        onOpenChange={setStudentOpen}
        open={studentOpen}
        studentFields={context.studentFields}
        studentName={context.studentName}
      />
      <DocumentPreviewDialog
        document={previewDocument}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewDocument(null);
          }
        }}
      />
      <ApplicationChoiceDocumentRequestsDialog
        applicationId={context.applicationId}
        canManage={context.canManageDocumentRequests}
        canRespond={context.canRespondDocumentRequests}
        choice={documentRequestChoice}
        onOpenChange={(open) => {
          if (!open) {
            setDocumentRequestChoice(null);
          }
        }}
        open={Boolean(documentRequestChoice)}
      />
    </ApplicationDetailControlsContext.Provider>
  );
}

type ApplicationDetailControlsContextValue = WorkflowContext & {
  openPreview: (document: ApplicationDetailDocumentRow) => void;
  openDocumentRequests: (choice: ApplicationDetailChoiceRow) => void;
  openStatus: (
    document?: ApplicationDetailDocumentRow,
    choice?: ApplicationDetailChoiceRow,
  ) => void;
  openStudent: () => void;
};

const ApplicationDetailControlsContext =
  createContext<ApplicationDetailControlsContextValue | null>(null);

function useApplicationDetailControls() {
  const context = useContext(ApplicationDetailControlsContext);

  if (!context) {
    throw new Error("ApplicationDetailControls context is missing.");
  }

  return context;
}

export function ApplicationDetailHeaderActions() {
  const {
    applicationId,
    openStatus,
    openStudent,
  } = useApplicationDetailControls();

  return (
    <div className="flex flex-wrap gap-2 sm:justify-end">
      <Button
        asChild
        className="h-9 rounded-xl border-[#dce6f4] bg-white px-3 text-xs font-black text-[#1559b7] hover:bg-[#eef5ff] sm:px-4"
        variant="outline"
      >
        <a href={`/api/applications/${applicationId}/pdf`}>
          <DownloadIcon data-icon="inline-start" />
          PDF export
        </a>
      </Button>
      <Button
        className="h-9 rounded-xl bg-[#1559b7] px-3 text-xs font-black hover:bg-[#104fa5] sm:px-4"
        onClick={() => openStatus()}
        type="button"
      >
        <ShieldCheckIcon data-icon="inline-start" />
        Status və qərar ver
      </Button>
      <Button
        className="h-9 rounded-xl border-[#dce6f4] bg-white px-3 text-xs font-black text-[#1559b7] hover:bg-[#eef5ff] sm:px-4"
        onClick={openStudent}
        type="button"
        variant="outline"
      >
        <UserRoundIcon data-icon="inline-start" />
        Tələbə məlumatları
      </Button>
    </div>
  );
}

export function ApplicationDocumentsReviewList() {
  const { applicationId, canUploadDocuments, documents } =
    useApplicationDetailControls();
  const [addDocumentOpen, setAddDocumentOpen] = useState(false);

  const groups = documents.reduce<Record<string, ApplicationDetailDocumentRow[]>>(
    (accumulator, document) => {
      accumulator[document.documentGroup] ??= [];
      accumulator[document.documentGroup].push(document);
      return accumulator;
    },
    {},
  );

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dce6f4] bg-[#f8fbff] px-3 py-2.5">
        <div>
          <div className="text-xs font-black text-[#07183a]">
            Sənəd faylları
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-[#71809f]">
            Faylları kateqoriya üzrə əlavə edin və idarə edin.
          </p>
        </div>
        {canUploadDocuments ? (
          <Button
            className="h-9 rounded-lg bg-[#1559b7] px-3 text-xs font-black hover:bg-[#104fa5]"
            onClick={() => setAddDocumentOpen(true)}
            size="sm"
            type="button"
          >
            <PlusIcon className="size-4" />
            Sənəd əlavə et
          </Button>
        ) : null}
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#dce6f4] bg-[#fbfdff] px-4 py-7 text-center text-sm font-semibold text-[#637392]">
          Hələ sənəd əlavə edilməyib.
        </div>
      ) : null}

      {Object.entries(groups).map(([group, items]) => {
        const readyCount = items.filter((item) =>
          item.status === "UPLOADED" || item.status === "WAIVED",
        ).length;
        const label = items[0]?.documentGroupLabel ?? group;

        return (
          <section
            className="overflow-hidden rounded-xl border border-[#dce6f4] bg-white"
            key={group}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5edf8] bg-[#f8fbff] px-3 py-2">
              <div className="text-[11px] font-black uppercase tracking-[0.04em] text-[#1559b7]">
                {label}
              </div>
              <Badge className="rounded-full border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-black text-[#1559b7]">
                {readyCount}/{items.length} hazır
              </Badge>
            </div>
            <div className="divide-y divide-[#edf2f8]">
              {items.map((document) => (
                <DocumentReviewRow
                  document={document}
                  key={document.documentKey}
                />
              ))}
            </div>
          </section>
        );
      })}

      <AddDocumentDialog
        applicationId={applicationId}
        onOpenChange={setAddDocumentOpen}
        open={addDocumentOpen}
      />
    </div>
  );
}

function AddDocumentDialog({
  applicationId,
  onOpenChange,
  open,
}: {
  applicationId: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const fileInputId = useId();
  const [selectedFileName, setSelectedFileName] = useState("");

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.2rem] border-[#dce6f4] bg-white p-0 shadow-[0_24px_70px_rgba(7,24,58,0.18)] sm:max-w-lg">
        <DialogHeader className="border-b border-[#edf2f8] bg-[#f8fbff] p-4 pr-12">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#1559b7] text-white">
              <PlusIcon className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-[#07183a]">
                Sənəd əlavə et
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs font-semibold leading-5 text-[#637392]">
                Kateqoriyanı seçin və uyğun faylı yükləyin.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form action={addApplicationDocumentAction} className="grid gap-4 p-4">
          <input name="applicationId" type="hidden" value={applicationId} />

          <fieldset>
            <legend className="text-[10px] font-black uppercase tracking-[0.05em] text-[#637392]">
              Kateqoriya
            </legend>
            <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-[#dce6f4] bg-white p-1 [scrollbar-color:#b8c4d8_transparent] [scrollbar-width:thin]">
              {APPLICATION_ADDITIONAL_DOCUMENT_CATEGORIES.map(
                (category, index) => (
                  <label className="block" key={category.key}>
                    <input
                      className="peer sr-only"
                      defaultChecked={index === 0}
                      name="categoryKey"
                      required
                      type="radio"
                      value={category.key}
                    />
                    <span className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-bold text-[#24365f] transition hover:bg-[#f3f7fd] peer-checked:bg-[#e8f1ff] peer-checked:text-[#1559b7] peer-focus-visible:ring-2 peer-focus-visible:ring-[#1559b7]/20">
                      <span>{category.label}</span>
                      <span className="size-2 rounded-full bg-[#d5dfed]" />
                    </span>
                  </label>
                ),
              )}
            </div>
          </fieldset>

          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.05em] text-[#637392]">
              Fayl
            </span>
            <input
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
              className="peer sr-only"
              id={fileInputId}
              name="file"
              onChange={(event) =>
                setSelectedFileName(event.target.files?.[0]?.name ?? "")
              }
              required
              type="file"
            />
            <label
              className="mt-2 flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#dce6f4] bg-[#fbfdff] px-2.5 text-[11px] font-semibold text-[#51627f] transition hover:border-[#b9d1f5] hover:bg-[#eef5ff] peer-focus-visible:ring-2 peer-focus-visible:ring-[#1559b7]/20"
              htmlFor={fileInputId}
            >
              <span className="shrink-0 rounded-md bg-[#e8f1ff] px-2.5 py-1.5 font-black text-[#1559b7]">
                Fayl seç
              </span>
              <span className="min-w-0 truncate">
                {selectedFileName || "Fayl seçilməyib"}
              </span>
            </label>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-[#edf2f8] pt-3 sm:flex-row sm:justify-end">
            <Button
              className="h-9 rounded-lg border-[#dce6f4] bg-white px-4 text-xs font-black text-[#34456c] hover:bg-[#f6f9ff]"
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Bağla
            </Button>
            <Button
              className="h-9 rounded-lg bg-[#1559b7] px-4 text-xs font-black hover:bg-[#104fa5]"
              disabled={!selectedFileName}
            >
              <UploadCloudIcon className="size-4" />
              Əlavə et
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ApplicationChoicesReviewList() {
  const {
    canManageDocumentRequests,
    canManageStatus,
    choices,
    openDocumentRequests,
    openStatus,
  } = useApplicationDetailControls();

  const universityGroups = useMemo(
    () =>
      choices.reduce<
        Array<{
          choices: ApplicationDetailChoiceRow[];
          universityId: string;
          universityName: string;
          universityType: string;
        }>
      >((accumulator, choice) => {
        const group = accumulator.find(
          (item) => item.universityId === choice.universityId,
        );

        if (group) {
          group.choices.push(choice);
        } else {
          accumulator.push({
            choices: [choice],
            universityId: choice.universityId,
            universityName: choice.universityName,
            universityType: choice.universityType,
          });
        }

        return accumulator;
      }, []),
    [choices],
  );
  const [selectedUniversityId, setSelectedUniversityId] = useState(
    () => universityGroups[0]?.universityId ?? "",
  );
  const selectedUniversity =
    universityGroups.find(
      (university) => university.universityId === selectedUniversityId,
    ) ?? universityGroups[0];

  if (choices.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#dce6f4] bg-[#fbfdff] px-4 py-8 text-center text-sm font-semibold text-[#637392]">
        İxtisas seçimi yoxdur.
      </div>
    );
  }

  if (!selectedUniversity) return null;

  const showCampus = selectedUniversity.choices.some(
    (choice) => choice.campusName,
  );
  const choiceColumns = showCampus
    ? "grid-cols-[58px_minmax(170px,1.35fr)_minmax(110px,.85fr)_minmax(90px,.7fr)_minmax(76px,.6fr)_minmax(82px,.65fr)_minmax(100px,.75fr)_minmax(110px,.85fr)_190px]"
    : "grid-cols-[64px_minmax(190px,1.5fr)_minmax(100px,.8fr)_minmax(84px,.65fr)_minmax(90px,.7fr)_minmax(110px,.8fr)_minmax(120px,.9fr)_190px]";

  return (
    <div className="grid gap-2.5">
      <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          aria-label="Universitet seçimi"
          className="inline-flex min-w-full w-max gap-1 rounded-xl border border-[#dce6f4] bg-white p-1 shadow-[0_6px_18px_rgba(29,78,216,0.05)]"
          role="group"
        >
          {universityGroups.map((university) => {
            const isSelected =
              university.universityId === selectedUniversity.universityId;

            return (
              <button
                aria-pressed={isSelected}
                className={cn(
                  "flex min-w-[180px] max-w-[280px] flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b66ff]",
                  isSelected
                    ? "bg-[#0b66ff] text-white shadow-[0_7px_18px_rgba(11,102,255,0.22)]"
                    : "text-[#4f5f7c] hover:bg-[#f3f7fd] hover:text-[#0b66ff]",
                )}
                key={university.universityId}
                onClick={() => setSelectedUniversityId(university.universityId)}
                type="button"
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg",
                    isSelected
                      ? "bg-white/15 text-white"
                      : "bg-[#eef5ff] text-[#0b66ff]",
                  )}
                >
                  <Building2Icon className="size-3.5" strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-black">
                    {university.universityName}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block truncate text-[10px] font-bold",
                      isSelected ? "text-blue-100" : "text-[#8a97b4]",
                    )}
                  >
                    {university.universityType} · {university.choices.length}{" "}
                    ixtisas
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#dce6f4] bg-white shadow-[0_10px_26px_rgba(29,78,216,0.045)]">
        <div
          className={cn(
            "hidden border-b border-[#e5edf8] bg-[#f6f9ff] px-2 lg:grid",
            choiceColumns,
          )}
        >
          {[
            "Prioritet",
            "İxtisas",
            ...(showCampus ? ["Kampus"] : []),
            "Pillə",
            "Dil",
            "Şəhər",
            "Qiymət",
            "Status",
            "Əməliyyat",
          ].map((label, index) => (
            <span
              className={cn(
                "px-2 py-3 text-[9px] font-black uppercase tracking-[0.04em] text-[#637392]",
                index === 0 && "text-center",
                index === (showCampus ? 6 : 5) && "text-right",
                index === (showCampus ? 8 : 7) && "text-center",
              )}
              key={label}
            >
              {label}
            </span>
          ))}
        </div>

        {selectedUniversity.choices.map((choice) => (
          <ChoiceDetailRow
            canManageStatus={canManageStatus}
            canManageDocumentRequests={canManageDocumentRequests}
            choice={choice}
            columns={choiceColumns}
            key={choice.id}
            onOpenDocumentRequests={openDocumentRequests}
            onOpenStatus={openStatus}
            showCampus={showCampus}
          />
        ))}
      </section>
    </div>
  );
}

function ChoiceDetailRow({
  canManageDocumentRequests,
  canManageStatus,
  choice,
  columns,
  onOpenDocumentRequests,
  onOpenStatus,
  showCampus,
}: {
  canManageDocumentRequests: boolean;
  canManageStatus: boolean;
  choice: ApplicationDetailChoiceRow;
  columns: string;
  onOpenStatus: (
    document?: ApplicationDetailDocumentRow,
    choice?: ApplicationDetailChoiceRow,
  ) => void;
  onOpenDocumentRequests: (choice: ApplicationDetailChoiceRow) => void;
  showCampus: boolean;
}) {
  return (
    <article className="border-t border-[#edf2f8] first:border-t-0">
      <div
        className={cn(
          "hidden items-center px-2 transition-colors hover:bg-[#f8fbff] lg:grid",
          columns,
        )}
      >
        <div className="px-2 py-3 text-center">
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-[#eef5ff] text-[11px] font-black tabular-nums text-[#0b66ff]">
            {choice.priority}
          </span>
        </div>
        <div className="min-w-0 px-2 py-3">
          <p className="truncate text-xs font-black text-[#07183a]">
            {choice.programName}
          </p>
          {choice.statusReason ? (
            <p
              className="mt-1 truncate text-[10px] font-bold text-red-600"
              title={choice.statusReason}
            >
              Səbəb: {choice.statusReason}
            </p>
          ) : choice.decidedAt ? (
            <p className="mt-1 truncate text-[10px] font-bold text-[#8a97b4]">
              Qərar: {choice.decidedAt}
              {choice.decidedBy ? ` · ${choice.decidedBy}` : ""}
            </p>
          ) : null}
        </div>
        {showCampus ? <ChoiceDetailText value={choice.campusName ?? ""} /> : null}
        <ChoiceDetailText value={choice.educationLevel} />
        <ChoiceDetailText value={choice.language} />
        <ChoiceDetailText value={choice.city} />
        <div className="min-w-0 px-2 py-3 text-right text-xs font-black text-emerald-700">
          <span className="truncate">{choice.price || "-"}</span>
        </div>
        <div className="min-w-0 px-2 py-3">
          <ChoiceStatusBadge
            label={choice.statusLabel}
            status={choice.status}
          />
        </div>
        <div className="flex items-center justify-end gap-1.5 px-2 py-3">
          {canManageDocumentRequests || choice.documentRequests.length > 0 ? (
            <Button
              className="h-8 rounded-lg border-blue-100 bg-blue-50 px-2.5 text-[10px] font-black text-[#1559b7] shadow-none hover:bg-[#e8f1ff]"
              onClick={() => onOpenDocumentRequests(choice)}
              size="sm"
              type="button"
              variant="outline"
            >
              <BellRingIcon className="size-3.5" />
              {choice.documentRequests.length > 0
                ? `Sənədlər · ${choice.documentRequests.length}`
                : "Sənəd göndər"}
            </Button>
          ) : null}
          {canManageStatus ? (
            <Button
              className="h-8 rounded-lg border-[#dce6f4] bg-white px-2.5 text-[10px] font-black text-[#1559b7] shadow-none hover:border-[#b9d1f5] hover:bg-[#eef5ff]"
              onClick={() => onOpenStatus(undefined, choice)}
              size="sm"
              type="button"
              variant="outline"
            >
              <ShieldCheckIcon className="size-3.5" />
              Seç
            </Button>
          ) : !canManageDocumentRequests &&
            choice.documentRequests.length === 0 ? (
            <span className="text-xs font-bold text-[#a0abc0]">—</span>
          ) : null}
        </div>
      </div>

      <div className="p-3 lg:hidden">
        <div className="flex items-start gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#eef5ff] text-[11px] font-black text-[#0b66ff]">
            {choice.priority}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="min-w-0 flex-1 text-xs font-black leading-5 text-[#07183a]">
                {choice.programName}
              </h3>
              <ChoiceStatusBadge
                label={choice.statusLabel}
                status={choice.status}
              />
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#edf2f8] pt-2.5">
              <ChoiceMobileFact label="Pillə" value={choice.educationLevel} />
              <ChoiceMobileFact label="Dil" value={choice.language} />
              {choice.campusName ? (
                <ChoiceMobileFact label="Kampus" value={choice.campusName} />
              ) : null}
              <ChoiceMobileFact label="Şəhər" value={choice.city} />
              <ChoiceMobileFact label="Qiymət" value={choice.price} price />
            </dl>
            {choice.statusReason ? (
              <p className="mt-2 rounded-lg border border-red-100 bg-red-50 px-2.5 py-2 text-[10px] font-bold leading-4 text-red-700">
                Səbəb: {choice.statusReason}
              </p>
            ) : choice.decidedAt ? (
              <p className="mt-2 text-[10px] font-bold text-[#8a97b4]">
                Qərar: {choice.decidedAt}
                {choice.decidedBy ? ` · ${choice.decidedBy}` : ""}
              </p>
            ) : null}
            {canManageDocumentRequests || choice.documentRequests.length > 0 || canManageStatus ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {canManageDocumentRequests || choice.documentRequests.length > 0 ? (
                  <Button
                    className="h-8 rounded-lg border-blue-100 bg-blue-50 text-[10px] font-black text-[#1559b7] shadow-none hover:bg-[#e8f1ff]"
                    onClick={() => onOpenDocumentRequests(choice)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <BellRingIcon className="size-3.5" />
                    {choice.documentRequests.length > 0
                      ? `Sənədlər · ${choice.documentRequests.length}`
                      : "Sənəd göndər"}
                  </Button>
                ) : null}
                {canManageStatus ? (
                  <Button
                    className="h-8 rounded-lg border-[#dce6f4] bg-white text-[10px] font-black text-[#1559b7] shadow-none hover:bg-[#eef5ff]"
                    onClick={() => onOpenStatus(undefined, choice)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <ShieldCheckIcon className="size-3.5" />
                    Qərar ver
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function ChoiceDetailText({ value }: { value: string }) {
  return (
    <div
      className="min-w-0 truncate px-2 py-3 text-[11px] font-bold text-[#34456c]"
      title={value || "-"}
    >
      {value || "-"}
    </div>
  );
}

function ChoiceMobileFact({
  label,
  price = false,
  value,
}: {
  label: string;
  price?: boolean;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] font-black uppercase tracking-[0.04em] text-[#8a97b4]">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 truncate text-[11px] font-black text-[#34456c]",
          price && "text-emerald-700",
        )}
      >
        {value || "-"}
      </dd>
    </div>
  );
}

function ApplicationChoiceDocumentRequestsDialog({
  applicationId,
  canManage,
  canRespond,
  choice,
  onOpenChange,
  open,
}: {
  applicationId: string;
  canManage: boolean;
  canRespond: boolean;
  choice: ApplicationDetailChoiceRow | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const documentTypeListId = useId();
  const sourceFileInputId = useId();
  const [creating, setCreating] = useState(false);
  const [sourceFileName, setSourceFileName] = useState("");
  const [responseType, setResponseType] = useState("ACKNOWLEDGEMENT");

  if (!choice) {
    return null;
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setCreating(false);
      setSourceFileName("");
      setResponseType("ACKNOWLEDGEMENT");
    }

    onOpenChange(nextOpen);
  }

  const activeCount = choice.documentRequests.filter(
    (request) =>
      request.status !== "COMPLETED" && request.status !== "CANCELLED",
  ).length;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.35rem] border-[#dce6f4] bg-[#f6f9ff] p-0 shadow-[0_28px_90px_rgba(7,24,58,0.22)] sm:max-w-3xl">
        <DialogHeader className="border-b border-[#dce6f4] bg-white p-5 pr-12">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0b66ff] text-white">
              <BellRingIcon className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-base font-black text-[#07183a]">
                  İxtisas üzrə sənədlər
                </DialogTitle>
                <Badge className="rounded-full border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[10px] font-black text-[#1559b7]">
                  {activeCount} aktiv
                </Badge>
              </div>
              <DialogDescription className="mt-1 text-xs font-semibold leading-5 text-[#637392]">
                {choice.universityName} · {choice.programName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 p-4 sm:p-5">
          {canManage ? (
            <div className="rounded-2xl border border-[#cfe0fa] bg-white p-3.5 shadow-[0_8px_24px_rgba(29,78,216,0.05)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-[#07183a]">
                    Tələbəyə yeni sənəd göndər
                  </div>
                  <p className="mt-0.5 text-xs font-semibold text-[#71809f]">
                    Sənədi, son tarixi və tələb olunan cavab formasını təyin edin.
                  </p>
                </div>
                <Button
                  className={cn(
                    "h-9 rounded-xl px-3 text-xs font-black",
                    creating
                      ? "border-[#dce6f4] bg-white text-[#34456c]"
                      : "bg-[#1559b7] text-white hover:bg-[#104fa5]",
                  )}
                  onClick={() => setCreating((value) => !value)}
                  type="button"
                  variant={creating ? "outline" : "default"}
                >
                  <PlusIcon className="size-4" />
                  {creating ? "Formu bağla" : "Sənəd göndər"}
                </Button>
              </div>

              {creating ? (
                <form
                  action={createApplicationDocumentRequestAction}
                  className="mt-4 grid gap-4 border-t border-[#edf2f8] pt-4"
                >
                  <input name="applicationId" type="hidden" value={applicationId} />
                  <input
                    name="applicationChoiceId"
                    type="hidden"
                    value={choice.id}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <RequestField label="Sənədin adı">
                      <input
                        className={requestInputClassName}
                        maxLength={160}
                        name="title"
                        placeholder="Məsələn: 1-ci ödəniş üçün Offer"
                        required
                      />
                    </RequestField>
                    <RequestField label="Sənəd növü / kateqoriya">
                      <input
                        className={requestInputClassName}
                        list={documentTypeListId}
                        maxLength={80}
                        name="documentType"
                        placeholder="Məsələn: PAYMENT_OFFER"
                        required
                      />
                      <datalist id={documentTypeListId}>
                        {APPLICATION_DOCUMENT_REQUEST_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </datalist>
                    </RequestField>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <RequestField label="Deadline (Bakı vaxtı)">
                      <input
                        className={requestInputClassName}
                        name="deadline"
                        required
                        type="datetime-local"
                      />
                    </RequestField>
                    <RequestField label="Tələb olunan cavab">
                      <select
                        className={requestInputClassName}
                        name="responseType"
                        onChange={(event) => setResponseType(event.target.value)}
                        value={responseType}
                      >
                        {APPLICATION_DOCUMENT_RESPONSE_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </RequestField>
                  </div>

                  {responseType === "PAYMENT_RECEIPT" ? (
                    <div className="grid gap-4 rounded-xl border border-amber-100 bg-amber-50/70 p-3 sm:grid-cols-2">
                      <RequestField label="Ödəniş məbləği (istəyə görə)">
                        <input
                          className={requestInputClassName}
                          min="0"
                          name="amount"
                          placeholder="0.00"
                          step="0.01"
                          type="number"
                        />
                      </RequestField>
                      <RequestField label="Valyuta">
                        <input
                          className={requestInputClassName}
                          defaultValue="USD"
                          maxLength={3}
                          minLength={3}
                          name="currency"
                          required
                        />
                      </RequestField>
                    </div>
                  ) : null}

                  <RequestField label="Tələbə üçün izah">
                    <textarea
                      className={cn(requestInputClassName, "min-h-24 resize-y py-3")}
                      maxLength={2000}
                      name="instructions"
                      placeholder="Sənəddə göstərilən əməliyyatı və vacib qeydləri yazın."
                    />
                  </RequestField>

                  <RequestField label="Göndəriləcək sənəd">
                    <input
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
                      className="peer sr-only"
                      id={sourceFileInputId}
                      name="file"
                      onChange={(event) =>
                        setSourceFileName(event.target.files?.[0]?.name ?? "")
                      }
                      required
                      type="file"
                    />
                    <label
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#b9d1f5] bg-[#f8fbff] px-3 text-xs font-semibold text-[#51627f] transition hover:bg-[#eef5ff] peer-focus-visible:ring-2 peer-focus-visible:ring-[#1559b7]/20"
                      htmlFor={sourceFileInputId}
                    >
                      <span className="rounded-lg bg-[#e8f1ff] px-3 py-1.5 font-black text-[#1559b7]">
                        Fayl seç
                      </span>
                      <span className="min-w-0 truncate">
                        {sourceFileName || "PDF, Office və ya şəkil · maksimum 25 MB"}
                      </span>
                    </label>
                  </RequestField>

                  <div className="flex justify-end border-t border-[#edf2f8] pt-3">
                    <Button
                      className="h-10 rounded-xl bg-[#0b66ff] px-5 text-xs font-black hover:bg-[#075be8]"
                      disabled={!sourceFileName}
                    >
                      <SendIcon className="size-4" />
                      Göndər və bildiriş yarat
                    </Button>
                  </div>
                </form>
              ) : null}
            </div>
          ) : null}

          {choice.documentRequests.length > 0 ? (
            <div className="grid gap-3">
              {choice.documentRequests.map((request) => (
                <DocumentRequestCard
                  applicationId={applicationId}
                  canRespond={canRespond}
                  key={request.id}
                  request={request}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-[#cfd9e8] bg-white px-5 text-center">
              <BellRingIcon className="mb-3 size-7 text-[#1559b7]" />
              <div className="text-sm font-black text-[#07183a]">
                Bu ixtisas üzrə sənəd yoxdur
              </div>
              <p className="mt-1 max-w-md text-xs font-semibold leading-5 text-[#71809f]">
                {canManage
                  ? "İlk sənədi göndərdikdə tələbənin dashboard və bildirişlər bölməsində görünəcək."
                  : "Yeni sənəd göndərildikdə burada görünəcək."}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DocumentRequestCard({
  applicationId,
  canRespond,
  request,
}: {
  applicationId: string;
  canRespond: boolean;
  request: ApplicationDetailDocumentRequestRow;
}) {
  const sourceUrl = request.downloadUrl ?? request.accessUrl;
  const responseUrl = request.responseDownloadUrl ?? request.responseAccessUrl;
  const completed = request.status === "COMPLETED";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border bg-white shadow-[0_8px_24px_rgba(29,78,216,0.045)]",
        request.isOverdue && !completed ? "border-red-200" : "border-[#dce6f4]",
      )}
    >
      <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="flex min-w-0 gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              completed
                ? "bg-emerald-50 text-emerald-600"
                : request.isOverdue
                  ? "bg-red-50 text-red-600"
                  : "bg-[#e8f1ff] text-[#1559b7]",
            )}
          >
            {request.responseType === "PAYMENT_RECEIPT" ? (
              <CircleDollarSignIcon className="size-4.5" />
            ) : (
              <FileTextIcon className="size-4.5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-[#07183a]">
                {request.title}
              </h3>
              <DocumentRequestStatusBadge request={request} />
            </div>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.03em] text-[#71809f]">
              {getDocumentRequestTypeLabel(request.documentType)} · {getResponseTypeLabel(request.responseType)}
            </p>
            {request.instructions ? (
              <p className="mt-2 whitespace-pre-wrap text-xs font-semibold leading-5 text-[#52627f]">
                {request.instructions}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          {sourceUrl ? (
            <Button
              asChild
              className="h-9 rounded-lg border-[#dce6f4] bg-white px-3 text-[11px] font-black text-[#1559b7]"
              size="sm"
              variant="outline"
            >
              <a href={sourceUrl} rel="noreferrer" target="_blank">
                <DownloadIcon className="size-3.5" />
                Sənədi aç
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2 border-t border-[#edf2f8] bg-[#fbfdff] px-4 py-3 text-[11px] font-bold text-[#637392] sm:grid-cols-3">
        <span className={cn("flex items-center gap-1.5", request.isOverdue && !completed && "text-red-600")}>
          <CalendarClockIcon className="size-3.5" />
          Son tarix: {request.deadline}
        </span>
        <span>Göndərilib: {request.createdAt}</span>
        <span className="sm:text-right">
          {request.amount ? `Məbləğ: ${request.amount}` : request.createdBy ? `Göndərən: ${request.createdBy}` : ""}
        </span>
      </div>

      {completed ? (
        <div className="border-t border-emerald-100 bg-emerald-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-black text-emerald-700">
                <CheckCircle2Icon className="size-4" />
                Proses tamamlanıb
              </div>
              <p className="mt-1 text-[11px] font-semibold text-emerald-700/80">
                {request.responseDate ? `Tarix: ${request.responseDate}` : request.completedAt}
                {request.respondedBy ? ` · İcra edən: ${request.respondedBy}` : ""}
              </p>
              {request.responseNote ? (
                <p className="mt-1 text-xs font-semibold text-[#52627f]">
                  {request.responseNote}
                </p>
              ) : null}
            </div>
            {responseUrl ? (
              <Button
                asChild
                className="h-9 rounded-lg border-emerald-200 bg-white px-3 text-[11px] font-black text-emerald-700"
                size="sm"
                variant="outline"
              >
                <a href={responseUrl} rel="noreferrer" target="_blank">
                  <DownloadIcon className="size-3.5" />
                  {request.responseType === "PAYMENT_RECEIPT" ? "Qəbzi aç" : "Cavabı aç"}
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      ) : request.status === "PENDING" && canRespond ? (
        <form
          action={acknowledgeApplicationDocumentRequestAction}
          className="flex flex-col gap-3 border-t border-[#edf2f8] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <input name="applicationId" type="hidden" value={applicationId} />
          <input name="requestId" type="hidden" value={request.id} />
          <p className="text-xs font-semibold leading-5 text-[#637392]">
            Sənədi açıb yoxladıqdan sonra təsdiqləyin.
            {request.responseType !== "ACKNOWLEDGEMENT"
              ? " Sonra cavab faylı və tarix sahələri açılacaq."
              : " Bu əməl tapşırığı tamamlayacaq."}
          </p>
          <Button className="h-9 shrink-0 rounded-xl bg-[#1559b7] px-4 text-xs font-black hover:bg-[#104fa5]">
            <CheckCircle2Icon className="size-4" />
            Sənədi təsdiqlə
          </Button>
        </form>
      ) : request.status === "ACKNOWLEDGED" && canRespond ? (
        <DocumentRequestResponseForm
          applicationId={applicationId}
          request={request}
        />
      ) : null}
    </article>
  );
}

function DocumentRequestResponseForm({
  applicationId,
  request,
}: {
  applicationId: string;
  request: ApplicationDetailDocumentRequestRow;
}) {
  const responseFileId = useId();
  const [fileName, setFileName] = useState("");
  const isPayment = request.responseType === "PAYMENT_RECEIPT";

  return (
    <form
      action={submitApplicationDocumentRequestResponseAction}
      className="grid gap-3 border-t border-amber-100 bg-amber-50/60 p-4"
    >
      <input name="applicationId" type="hidden" value={applicationId} />
      <input name="requestId" type="hidden" value={request.id} />
      <div className="flex items-center gap-2 text-xs font-black text-amber-800">
        <CheckCircle2Icon className="size-4" />
        Sənəd təsdiqləndi · {isPayment ? "qəbzi" : "cavab sənədini"} yükləyin
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <RequestField label={isPayment ? "Ödəniş tarixi" : "Sənəd tarixi"}>
          <input
            className={requestInputClassName}
            name="responseDate"
            required
            type="date"
          />
        </RequestField>
        <RequestField label={isPayment ? "Ödəniş qəbzi" : "Cavab sənədi"}>
          <input
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
            className="peer sr-only"
            id={responseFileId}
            name="file"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
            required
            type="file"
          />
          <label
            className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#d9c58a] bg-white px-3 text-xs font-semibold text-[#6b5a28] peer-focus-visible:ring-2 peer-focus-visible:ring-amber-500/20"
            htmlFor={responseFileId}
          >
            <UploadCloudIcon className="size-4 shrink-0" />
            <span className="min-w-0 truncate">{fileName || "Fayl seçin"}</span>
          </label>
        </RequestField>
      </div>
      <RequestField label="Qeyd (istəyə görə)">
        <input
          className={requestInputClassName}
          maxLength={1000}
          name="responseNote"
          placeholder="Tranzaksiya nömrəsi və ya əlavə məlumat"
        />
      </RequestField>
      <div className="flex justify-end">
        <Button
          className="h-9 rounded-xl bg-amber-600 px-4 text-xs font-black hover:bg-amber-700"
          disabled={!fileName}
        >
          <UploadCloudIcon className="size-4" />
          {isPayment ? "Qəbzi yüklə və tamamla" : "Sənədi yüklə və tamamla"}
        </Button>
      </div>
    </form>
  );
}

function RequestField({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.04em] text-[#637392]">
        {label}
      </span>
      {children}
    </label>
  );
}

function DocumentRequestStatusBadge({
  request,
}: {
  request: ApplicationDetailDocumentRequestRow;
}) {
  const statusLabel = request.isOverdue
    ? "Deadline keçib"
    : APPLICATION_DOCUMENT_REQUEST_STATUS_LABELS[
        request.status as keyof typeof APPLICATION_DOCUMENT_REQUEST_STATUS_LABELS
      ] ?? request.status;

  return (
    <Badge
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[10px] font-black",
        request.status === "COMPLETED" &&
          "border-emerald-100 bg-emerald-50 text-emerald-700",
        request.status === "ACKNOWLEDGED" &&
          "border-amber-100 bg-amber-50 text-amber-700",
        request.status === "PENDING" &&
          !request.isOverdue &&
          "border-blue-100 bg-blue-50 text-[#1559b7]",
        request.status === "CANCELLED" &&
          "border-slate-200 bg-slate-50 text-slate-600",
        request.isOverdue && "border-red-100 bg-red-50 text-red-700",
      )}
    >
      {statusLabel}
    </Badge>
  );
}

const requestInputClassName =
  "h-11 w-full rounded-xl border border-[#dce6f4] bg-white px-3 text-sm font-semibold text-[#07183a] outline-none transition placeholder:text-[#9aa7bd] focus:border-[#1559b7] focus:ring-4 focus:ring-[#1559b7]/10";

function getDocumentRequestTypeLabel(value: string) {
  return (
    APPLICATION_DOCUMENT_REQUEST_TYPES.find((type) => type.value === value)
      ?.label ?? value
  );
}

function getResponseTypeLabel(value: string) {
  return (
    APPLICATION_DOCUMENT_RESPONSE_TYPES.find((type) => type.value === value)
      ?.label ?? value
  );
}

function StatusDecisionDialog({
  context,
  onOpenChange,
  open,
  selectedChoice,
  selectedDocument,
}: {
  context: WorkflowContext;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  selectedChoice: ApplicationDetailChoiceRow | null;
  selectedDocument: ApplicationDetailDocumentRow | null;
}) {
  const allowedStatuses =
    APPLICATION_STATUS_TRANSITIONS[
      context.currentStatus as keyof typeof APPLICATION_STATUS_TRANSITIONS
    ] ?? [];
  const statusOptions = APPLICATION_DECISION_STATUSES.filter(
    (item) =>
      item === context.currentStatus ||
      allowedStatuses.includes(item) ||
      (selectedDocument && item === "INVALID_DOCUMENTS"),
  );
  const defaultStatus = selectedDocument
    ? "INVALID_DOCUMENTS"
    : (selectedChoice?.status ?? context.currentStatus);
  const showChoiceSelector =
    !selectedDocument && context.choices.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.2rem] border-[#dce6f4] bg-white p-0 shadow-[0_24px_70px_rgba(7,24,58,0.18)] sm:max-w-2xl">
        <DialogHeader className="border-b border-[#edf2f8] bg-gradient-to-r from-[#f8fbff] to-white p-4 pr-12">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1559b7] text-white shadow-[0_12px_24px_rgba(21,89,183,0.22)]">
              <ShieldCheckIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-black text-[#07183a]">
                Status və qərar
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs font-semibold leading-5 text-[#637392]">
                Qərarı seçin, səbəbi yazın və bildirişi yaradın.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4">
          {context.canSubmitDraft ? (
            <StudentPortalStatusActions context={context} />
          ) : context.canManageStatus ? (
            <form
              action={updateApplicationStatusAction}
              className="grid gap-3"
              key={`${defaultStatus}:${selectedDocument?.documentKey ?? "general"}:${selectedChoice?.id ?? "application"}`}
            >
              <input
                name="applicationId"
                type="hidden"
                value={context.applicationId}
              />
              {selectedDocument ? (
                <input
                  name="documentKey"
                  type="hidden"
                  value={selectedDocument.documentKey}
                />
              ) : null}

              {selectedDocument ? (
                <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-red-500" />
                    <div>
                      <div className="text-xs font-black uppercase text-red-700">
                        Problem bildirilən sənəd
                      </div>
                      <div className="mt-0.5 text-sm font-black text-[#07183a]">
                        {selectedDocument.title}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                {showChoiceSelector ? (
                  <label className="block">
                    <span className="text-[11px] font-black uppercase text-[#637392]">
                      Qərar obyekti
                    </span>
                    <Select
                      defaultValue={selectedChoice?.id ?? "__application__"}
                      name="choiceId"
                    >
                      <SelectTrigger className="mt-1.5 h-11 w-full rounded-xl border-[#dce6f4] bg-white px-3 text-left text-sm font-black text-[#07183a] shadow-sm focus:ring-[#1559b7]/10">
                        <SelectValue placeholder="Seçim seçin" />
                      </SelectTrigger>
                      <SelectContent
                        className="max-h-72 rounded-xl border-[#dce6f4] bg-white shadow-[0_18px_45px_rgba(7,24,58,0.16)]"
                        position="popper"
                      >
                        <SelectItem
                          className="rounded-lg py-2 font-black"
                          value="__application__"
                        >
                          Ümumi müraciət
                        </SelectItem>
                        {context.choices.map((choice) => (
                          <SelectItem
                            className="rounded-lg py-2"
                            key={choice.id}
                            value={choice.id}
                          >
                            #{choice.priority} · {choice.universityName} ·{" "}
                            {choice.programName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                ) : (
                  <div className="rounded-xl border border-[#edf2f8] bg-[#fbfdff] px-3 py-2">
                    <div className="text-[11px] font-black uppercase text-[#637392]">
                      Qərar obyekti
                    </div>
                    <div className="mt-1 text-sm font-black text-[#07183a]">
                      {selectedDocument?.title ?? "Ümumi müraciət"}
                    </div>
                  </div>
                )}

                <label className="block">
                  <span className="text-[11px] font-black uppercase text-[#637392]">
                    Yeni status
                  </span>
                  <Select defaultValue={defaultStatus} name="status" required>
                    <SelectTrigger className="mt-1.5 h-11 w-full rounded-xl border-[#dce6f4] bg-white px-3 text-left text-sm font-black text-[#07183a] shadow-sm focus:ring-[#1559b7]/10">
                      <SelectValue placeholder="Status seçin" />
                    </SelectTrigger>
                    <SelectContent
                      className="rounded-xl border-[#dce6f4] bg-white shadow-[0_18px_45px_rgba(7,24,58,0.16)]"
                      position="popper"
                    >
                      {statusOptions.map((item) => (
                        <SelectItem
                          className="rounded-lg py-2 font-black"
                          key={item}
                          value={item}
                        >
                          {APPLICATION_STATUS_LABELS[item]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              </div>

              {statusOptions.some((item) =>
                APPLICATION_REASON_REQUIRED_STATUSES.includes(
                  item as (typeof APPLICATION_REASON_REQUIRED_STATUSES)[number],
                ),
              ) ? (
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-700">
                  Düzgün olmayan sənədlər və qəbul uğursuz oldu statusları üçün səbəb yazılmalıdır.
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-black uppercase text-[#637392]">
                    Bildiriş səbəbi
                  </span>
                  <Textarea
                    className="mt-1.5 min-h-20 rounded-xl border-[#dce6f4] bg-white text-sm"
                    defaultValue={selectedDocument?.notes ?? ""}
                    name="statusReason"
                    placeholder={
                      selectedDocument
                        ? `${selectedDocument.title} üzrə problemi yazın...`
                        : "Səbəb yazın..."
                    }
                  />
                </label>

                <label className="block">
                  <span className="text-[11px] font-black uppercase text-[#637392]">
                    Daxili qeyd
                  </span>
                  <Textarea
                    className="mt-1.5 min-h-20 rounded-xl border-[#dce6f4] bg-white text-sm"
                    defaultValue={context.internalNotes}
                    name="internalNotes"
                    placeholder="Komanda üçün qeyd"
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-[#edf2f8] pt-3 sm:flex-row sm:justify-end">
                <Button
                  className="h-10 rounded-xl border-[#dce6f4] bg-white px-4 text-xs font-black text-[#34456c] hover:bg-[#f6f9ff]"
                  onClick={() => onOpenChange(false)}
                  type="button"
                  variant="outline"
                >
                  Bağla
                </Button>
                <Button
                  className="h-10 rounded-xl bg-[#1559b7] px-5 text-xs font-black shadow-[0_12px_24px_rgba(21,89,183,0.18)] hover:bg-[#104fa5]"
                  disabled={statusOptions.length === 0}
                >
                  Statusu yenilə
                </Button>
              </div>
            </form>
          ) : (
            <ReadOnlyStatus context={context} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LegacyStatusDecisionDialog({
  context,
  onOpenChange,
  open,
  selectedChoice,
  selectedDocument,
}: {
  context: WorkflowContext;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  selectedChoice: ApplicationDetailChoiceRow | null;
  selectedDocument: ApplicationDetailDocumentRow | null;
}) {
  const allowedStatuses =
    APPLICATION_STATUS_TRANSITIONS[
      context.currentStatus as keyof typeof APPLICATION_STATUS_TRANSITIONS
    ] ?? [];
  const statusOptions = APPLICATION_DECISION_STATUSES.filter(
    (item) =>
      item === context.currentStatus ||
      allowedStatuses.includes(item) ||
      (selectedDocument && item === "INVALID_DOCUMENTS"),
  );
  const defaultStatus = selectedDocument
    ? "INVALID_DOCUMENTS"
    : (selectedChoice?.status ?? context.currentStatus);
  const showChoiceSelector =
    !selectedDocument && context.choices.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.45rem] border-[#dce6f4] bg-white p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-[#edf2f8] p-5 pr-12">
          <DialogTitle className="text-lg font-black text-[#07183a]">
            Status və qərar
          </DialogTitle>
          <DialogDescription className="text-sm font-semibold leading-6 text-[#637392]">
            Qərarı seçin, lazım olduqda səbəb yazın və portal bildirişi yaradın.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5">
          {context.isStudentPortal ? (
            <StudentPortalStatusActions context={context} />
          ) : context.canManageStatus ? (
            <form
              action={updateApplicationStatusAction}
              className="grid gap-4"
              key={`${defaultStatus}:${selectedDocument?.documentKey ?? "general"}:${selectedChoice?.id ?? "application"}`}
            >
              <input
                name="applicationId"
                type="hidden"
                value={context.applicationId}
              />
              {selectedDocument ? (
                <input
                  name="documentKey"
                  type="hidden"
                  value={selectedDocument.documentKey}
                />
              ) : null}

              {showChoiceSelector ? (
                <div>
                  <div className="text-[11px] font-black uppercase text-[#637392]">
                    Qərarın tətbiq olunacağı seçim
                  </div>
                  <div className="mt-2 grid max-h-64 gap-2 overflow-y-auto pr-1">
                    <label>
                      <input
                        className="peer sr-only"
                        defaultChecked={!selectedChoice}
                        name="choiceId"
                        type="radio"
                        value=""
                      />
                      <span className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#dce6f4] bg-white px-3 py-2 text-sm font-black text-[#07183a] transition peer-checked:border-[#1559b7] peer-checked:bg-[#eef5ff] peer-focus-visible:ring-4 peer-focus-visible:ring-[#1559b7]/10">
                        Ümumi müraciət
                        <Badge className="rounded-full border-blue-100 bg-blue-50 text-[11px] font-black text-[#1559b7]">
                          {context.statusLabel}
                        </Badge>
                      </span>
                    </label>
                    {context.choices.map((choice) => (
                      <label key={choice.id}>
                        <input
                          className="peer sr-only"
                          defaultChecked={selectedChoice?.id === choice.id}
                          name="choiceId"
                          type="radio"
                          value={choice.id}
                        />
                        <span className="grid cursor-pointer gap-1 rounded-xl border border-[#dce6f4] bg-white px-3 py-2 text-sm transition peer-checked:border-[#1559b7] peer-checked:bg-[#eef5ff] peer-focus-visible:ring-4 peer-focus-visible:ring-[#1559b7]/10">
                          <span className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-black text-[#07183a]">
                              #{choice.priority} · {choice.programName}
                            </span>
                            <ChoiceStatusBadge status={choice.status} label={choice.statusLabel} />
                          </span>
                          <span className="text-xs font-semibold text-[#637392]">
                            {choice.universityName} · {choice.language} · {choice.city}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedDocument ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-red-500" />
                    <div>
                      <div className="text-sm font-black text-[#07183a]">
                        Problem bildirilən sənəd
                      </div>
                      <div className="mt-1 text-sm font-semibold text-red-700">
                        {selectedDocument.title}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div>
                <div className="text-[11px] font-black uppercase text-[#637392]">
                  Yeni status
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {statusOptions.map((item) => (
                    <label key={item}>
                      <input
                        className="peer sr-only"
                        defaultChecked={item === defaultStatus}
                        name="status"
                        required
                        type="radio"
                        value={item}
                      />
                      <span className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#dce6f4] bg-white px-3 py-2 text-sm font-black text-[#07183a] transition peer-checked:border-[#1559b7] peer-checked:bg-[#eef5ff] peer-focus-visible:ring-4 peer-focus-visible:ring-[#1559b7]/10">
                        {APPLICATION_STATUS_LABELS[item]}
                        <CheckCircle2Icon className="size-4 text-[#1559b7] opacity-0 transition peer-checked:opacity-100" />
                      </span>
                    </label>
                  ))}
                </div>
                {statusOptions.some((item) =>
                  APPLICATION_REASON_REQUIRED_STATUSES.includes(
                    item as (typeof APPLICATION_REASON_REQUIRED_STATUSES)[number],
                  ),
                ) ? (
                  <div className="mt-2 text-xs font-bold text-red-600">
                    Düzgün olmayan sənədlər və qəbul uğursuz oldu statusları
                    üçün səbəb yazılmalıdır.
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-black uppercase text-[#637392]">
                    Bildiriş səbəbi
                  </span>
                  <Textarea
                    className="mt-1 min-h-24 rounded-xl border-[#dce6f4] bg-white text-sm"
                    defaultValue={selectedDocument?.notes ?? ""}
                    name="statusReason"
                    placeholder={
                      selectedDocument
                        ? `${selectedDocument.title} üzrə problemi yazın...`
                        : "Səbəb yazın..."
                    }
                  />
                </label>

                <label className="block">
                  <span className="text-[11px] font-black uppercase text-[#637392]">
                    Daxili qeyd
                  </span>
                  <Textarea
                    className="mt-1 min-h-24 rounded-xl border-[#dce6f4] bg-white text-sm"
                    defaultValue={context.internalNotes}
                    name="internalNotes"
                    placeholder="Komanda üçün qeyd"
                  />
                </label>
              </div>

              <Button
                className="h-11 rounded-xl bg-[#1559b7] px-5 text-sm font-black hover:bg-[#104fa5]"
                disabled={statusOptions.length === 0}
              >
                Statusu yenilə və bildiriş yarat
              </Button>
            </form>
          ) : (
            <ReadOnlyStatus context={context} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

void LegacyStatusDecisionDialog;

function StudentPortalStatusActions({ context }: { context: WorkflowContext }) {
  if (context.currentStatus !== "DRAFT") {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
        Müraciət artıq qəbul prosesi üzrə izlənilir.
      </div>
    );
  }

  return (
    <form action={submitStudentApplicationAction} className="grid gap-3">
      <input name="applicationId" type="hidden" value={context.applicationId} />
      <Button
        className={cn(
          "h-11 rounded-xl text-sm font-black",
          context.missingRequiredDocuments > 0
            ? "bg-[#e8eef7] text-[#637392] hover:bg-[#e8eef7]"
            : "bg-[#12a66a] hover:bg-[#0f955f]",
        )}
        disabled={context.missingRequiredDocuments > 0}
        type="submit"
      >
        <SendIcon data-icon="inline-start" />
        {context.missingRequiredDocuments > 0
          ? "Əvvəlcə sənədləri yükləyin"
          : "Müraciəti göndər"}
      </Button>
      {context.missingRequiredDocuments > 0 ? (
        <div className="text-xs font-semibold text-red-600">
          Göndərməzdən əvvəl zəruri sənədləri yükləyin.
        </div>
      ) : null}
    </form>
  );
}

function ReadOnlyStatus({ context }: { context: WorkflowContext }) {
  return (
    <div className="rounded-[1.1rem] border border-[#dce6f4] bg-[#fbfdff] p-4">
      <div className="text-sm font-black text-[#07183a]">Cari status</div>
      <div className="mt-2">
        <Badge className="rounded-full border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-[#1559b7]">
          {context.statusLabel}
        </Badge>
      </div>
      {context.latestStatusReason ? (
        <div className="mt-3 rounded-xl border border-[#dce6f4] bg-white px-3 py-2 text-xs font-semibold leading-5 text-[#51627f]">
          <span className="block font-black text-[#07183a]">Səbəb</span>
          {context.latestStatusReason}
        </div>
      ) : (
        <p className="mt-2 text-xs font-semibold leading-5 text-[#637392]">
          Status dəyişiklikləri super admin tərəfindən idarə olunur.
        </p>
      )}
    </div>
  );
}

function StudentInfoDialog({
  onOpenChange,
  open,
  studentFields,
  studentName,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  studentFields: ApplicationDetailStudentField[];
  studentName: string;
}) {
  const [copiedField, setCopiedField] = useState("");

  async function copyValue(field: ApplicationDetailStudentField) {
    if (!field.value || field.value === "-") {
      return;
    }

    await navigator.clipboard?.writeText(field.value);
    setCopiedField(field.id);
    window.setTimeout(() => setCopiedField(""), 1200);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.45rem] border-[#dce6f4] bg-white p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-[#edf2f8] p-5 pr-12">
          <DialogTitle className="text-lg font-black text-[#07183a]">
            {studentName || "Tələbə məlumatları"}
          </DialogTitle>
          <DialogDescription className="text-sm font-semibold leading-6 text-[#637392]">
            Tələbənin bütün əsas məlumatları. Hər sətri ayrıca kopyalamaq olar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 p-5 sm:grid-cols-2">
          {studentFields.map((field) => (
            <div
              className="grid gap-2 rounded-xl border border-[#edf2f8] bg-[#fbfdff] p-3"
              key={field.id}
            >
              <div className="text-[11px] font-black uppercase text-[#637392]">
                {field.label}
              </div>
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0 break-words text-sm font-bold text-[#07183a]">
                  {field.value || "-"}
                </div>
                <Button
                  className="size-8 shrink-0 rounded-lg border-[#dce6f4] bg-white text-[#1559b7]"
                  disabled={!field.value || field.value === "-"}
                  onClick={() => copyValue(field)}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  {copiedField === field.id ? (
                    <CheckCircle2Icon className="size-4" />
                  ) : (
                    <CopyIcon className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DocumentPreviewDialog({
  document,
  onOpenChange,
}: {
  document: ApplicationDetailDocumentRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const isOpen = Boolean(document?.accessUrl);
  const previewKind = document ? getDocumentPreviewKind(document) : "unsupported";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] min-h-[70vh] flex-col overflow-hidden rounded-[1.45rem] border-[#dce6f4] bg-white p-0 sm:max-w-6xl">
        <DialogHeader className="border-b border-[#edf2f8] p-5 pr-12">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="break-words text-lg font-black text-[#07183a]">
                {document?.title ?? "Sənəd baxışı"}
              </DialogTitle>
              <DialogDescription className="mt-1 break-words text-sm font-semibold leading-6 text-[#637392]">
                {document?.fileName ?? "Fayl"} səhifədən çıxmadan açılır.
              </DialogDescription>
            </div>
            {document?.accessUrl ? (
              <div className="flex shrink-0 flex-wrap gap-2 pr-6">
                <Button
                  asChild
                  className="h-9 rounded-lg border-[#dce6f4] bg-white px-3 text-xs font-black text-[#1559b7]"
                  size="sm"
                  variant="outline"
                >
                  <a href={document.downloadUrl ?? document.accessUrl} download={document.fileName ?? true}>
                    <DownloadIcon data-icon="inline-start" />
                    Endir
                  </a>
                </Button>
              </div>
            ) : null}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 bg-[#f6f9ff] p-3">
          {document?.accessUrl && previewKind === "pdf" ? (
            <iframe
              className="h-[70vh] w-full rounded-xl border border-[#dce6f4] bg-white"
              src={document.accessUrl}
              title={`${document.title} baxışı`}
            />
          ) : document?.accessUrl && previewKind === "image" ? (
            <div className="flex h-[70vh] items-center justify-center overflow-auto rounded-xl border border-[#dce6f4] bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={`${document.title} baxışı`}
                className="max-h-full max-w-full rounded-lg object-contain"
                src={document.accessUrl}
              />
            </div>
          ) : document?.accessUrl && previewKind === "office" ? (
            <iframe
              className="h-[70vh] w-full rounded-xl border border-[#dce6f4] bg-white"
              src={getOfficePreviewUrl(document.accessUrl)}
              title={`${document.title} baxışı`}
            />
          ) : document?.accessUrl ? (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#dce6f4] bg-white px-4 text-center">
              <FileTextIcon className="size-10 text-[#8a97b4]" />
              <div className="text-sm font-black text-[#07183a]">
                Bu fayl üçün səhifədaxili önizləmə mümkün deyil.
              </div>
              <div className="max-w-md text-xs font-semibold leading-5 text-[#637392]">
                PDF, şəkil və Office faylları popup daxilində göstərilir. Digər
                formatlar brauzer tərəfindən avtomatik endirilə bildiyi üçün burada
                açılmır.
              </div>
            </div>
          ) : (
            <div className="flex h-[60vh] items-center justify-center rounded-xl border border-dashed border-[#dce6f4] bg-white text-sm font-bold text-[#637392]">
              Sənəd yüklənməyib.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DocumentReviewRow({
  document,
}: {
  document: ApplicationDetailDocumentRow;
}) {
  const {
    applicationId,
    canManageDocuments,
    canManageStatus,
    canUploadDocuments,
    openPreview,
    openStatus,
  } = useApplicationDetailControls();
  const isUploaded = Boolean(document.accessUrl);

  return (
    <article
      className={cn(
        "grid gap-2.5 bg-white px-3 py-2.5 xl:grid-cols-[auto_minmax(240px,1fr)_minmax(170px,230px)_auto] xl:items-center",
        document.status === "INVALID"
          ? "bg-red-50/40"
          : "hover:bg-[#fbfdff]",
      )}
    >
      <ReviewedToggle
        applicationId={applicationId}
        canManageDocuments={canManageDocuments}
        document={document}
      />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 break-words text-sm font-black text-[#07183a]">
            {document.title}
            {document.isRequired ? (
              <span className="ml-1 text-red-500">*</span>
            ) : null}
          </div>
          <DocumentStatusBadge status={document.status} />
        </div>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-xs font-semibold text-[#637392]">
          <span className="min-w-0 truncate">
            {document.fileName ?? "Yüklənməyib"}
          </span>
          {document.fileSize ? <span>{formatFileSize(document.fileSize)}</span> : null}
          {document.reviewedAt ? (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
              Baxılıb: {document.reviewedBy ?? "Komanda"}
            </span>
          ) : null}
        </div>
        {document.notes ? (
          <div className="mt-1 rounded-lg border border-red-100 bg-white px-2 py-1 text-xs font-semibold leading-5 text-red-700">
            Problem: {document.notes}
          </div>
        ) : null}
      </div>

      {canUploadDocuments ? (
        <UploadInlineForm
          applicationId={applicationId}
          document={document}
          isUploaded={isUploaded}
        />
      ) : (
        <div />
      )}

      <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
        {document.accessUrl ? (
          <>
            <Button
              className="h-9 rounded-lg border-[#dce6f4] bg-white px-3 text-xs font-black text-[#1559b7]"
              onClick={() => openPreview(document)}
              size="sm"
              type="button"
              variant="outline"
            >
              <EyeIcon data-icon="inline-start" />
              Bax
            </Button>
            <Button
              asChild
              className="h-9 rounded-lg border-[#dce6f4] bg-white px-3 text-xs font-black text-[#1559b7]"
              size="sm"
              variant="outline"
            >
              <a href={document.downloadUrl ?? document.accessUrl} download={document.fileName ?? true}>
                <DownloadIcon data-icon="inline-start" />
                Endir
              </a>
            </Button>
          </>
        ) : null}

        {canManageStatus ? (
          <Button
            className="h-9 rounded-lg border-red-100 bg-white px-3 text-xs font-black text-red-600 hover:bg-red-50"
            onClick={() => openStatus(document)}
            size="sm"
            type="button"
            variant="outline"
          >
            <AlertTriangleIcon data-icon="inline-start" />
            Problem bildir
          </Button>
        ) : null}

        {canManageDocuments ? (
          <DocumentStatusQuickActions
            applicationId={applicationId}
            document={document}
          />
        ) : null}
      </div>
    </article>
  );
}

function ReviewedToggle({
  applicationId,
  canManageDocuments,
  document,
}: {
  applicationId: string;
  canManageDocuments: boolean;
  document: ApplicationDetailDocumentRow;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const reviewedInputRef = useRef<HTMLInputElement>(null);
  const [checked, setChecked] = useState(Boolean(document.reviewedAt));

  return (
    <form
      action={toggleApplicationDocumentReviewedAction}
      className="flex items-center gap-2"
      ref={formRef}
    >
      <input name="applicationId" type="hidden" value={applicationId} />
      <input name="documentKey" type="hidden" value={document.documentKey} />
      <input
        name="reviewed"
        readOnly
        ref={reviewedInputRef}
        type="hidden"
        value={checked ? "true" : "false"}
      />
      <Checkbox
        aria-label={`${document.title} baxıldı`}
        checked={checked}
        className="size-5 rounded-md border-[#b8cced] data-checked:bg-[#1559b7]"
        disabled={!canManageDocuments}
        onCheckedChange={(value) => {
          const nextValue = value === true;
          setChecked(nextValue);
          if (reviewedInputRef.current) {
            reviewedInputRef.current.value = nextValue ? "true" : "false";
          }
          formRef.current?.requestSubmit();
        }}
      />
      <span className="text-xs font-black text-[#637392]">Baxıldı</span>
    </form>
  );
}

function UploadInlineForm({
  applicationId,
  document,
  isUploaded,
}: {
  applicationId: string;
  document: ApplicationDetailDocumentRow;
  isUploaded: boolean;
}) {
  const fileInputId = useId();
  const [selectedFileName, setSelectedFileName] = useState("");

  return (
    <form
      action={uploadApplicationDocumentAction}
      className="flex min-w-0 items-center gap-1.5"
    >
      <input name="applicationId" type="hidden" value={applicationId} />
      <input name="documentKey" type="hidden" value={document.documentKey} />
      <input
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
        className="peer sr-only"
        id={fileInputId}
        name="file"
        onChange={(event) =>
          setSelectedFileName(event.target.files?.[0]?.name ?? "")
        }
        type="file"
      />
      <label
        className="min-w-0 flex-1 cursor-pointer truncate rounded-lg border border-[#dce6f4] bg-[#fbfdff] px-2.5 py-2 text-[10px] font-black text-[#51627f] transition hover:border-[#b9d1f5] hover:bg-[#eef5ff] hover:text-[#1559b7] peer-focus-visible:ring-2 peer-focus-visible:ring-[#1559b7]/20"
        htmlFor={fileInputId}
        title={selectedFileName || undefined}
      >
        {selectedFileName || (isUploaded ? "Faylı dəyiş" : "Fayl seç")}
      </label>
      <Button
        className="h-8 shrink-0 rounded-lg bg-[#1559b7] px-2.5 text-[10px] font-black hover:bg-[#104fa5]"
        disabled={!selectedFileName}
      >
        <UploadCloudIcon data-icon="inline-start" />
        Yüklə
      </Button>
    </form>
  );
}

function DocumentStatusQuickActions({
  applicationId,
  document,
}: {
  applicationId: string;
  document: ApplicationDetailDocumentRow;
}) {
  if (document.status === "MISSING") {
    return (
      <DocumentStatusForm
        applicationId={applicationId}
        documentKey={document.documentKey}
        label="Tələb olunmasın"
        status="WAIVED"
      />
    );
  }

  if (document.status === "WAIVED") {
    return (
      <DocumentStatusForm
        applicationId={applicationId}
        documentKey={document.documentKey}
        label="Geri al"
        status="MISSING"
      />
    );
  }

  if (document.status === "UPLOADED") {
    return (
      <DocumentStatusForm
        applicationId={applicationId}
        documentKey={document.documentKey}
        label="Arxiv"
        status="ARCHIVED"
      />
    );
  }

  return null;
}

function DocumentStatusForm({
  applicationId,
  documentKey,
  label,
  status,
}: {
  applicationId: string;
  documentKey: string;
  label: string;
  status: string;
}) {
  return (
    <form action={updateApplicationDocumentStatusAction}>
      <input name="applicationId" type="hidden" value={applicationId} />
      <input name="documentKey" type="hidden" value={documentKey} />
      <input name="status" type="hidden" value={status} />
      <Button
        className="h-9 rounded-lg border-[#dce6f4] bg-white px-3 text-xs font-black text-[#34456c]"
        size="sm"
        type="submit"
        variant="outline"
      >
        {label}
      </Button>
    </form>
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
          : status === "INVALID"
            ? "red"
            : "amber";

  return (
    <Badge
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px] font-black",
        tone === "green" && "border-emerald-100 bg-emerald-50 text-emerald-600",
        tone === "amber" && "border-amber-100 bg-amber-50 text-amber-700",
        tone === "red" && "border-red-100 bg-red-50 text-red-600",
        tone === "blue" && "border-blue-100 bg-blue-50 text-[#1559b7]",
        tone === "slate" && "border-slate-200 bg-slate-50 text-slate-600",
      )}
    >
      {getDocumentStatusLabel(status)}
    </Badge>
  );
}

function ChoiceStatusBadge({
  label,
  status,
}: {
  label: string;
  status: string;
}) {
  const tone = getChoiceStatusTone(status);

  return (
    <Badge
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px] font-black",
        tone.badge,
      )}
    >
      {label}
    </Badge>
  );
}

function getChoiceStatusTone(status: string) {
  if (status === "ACCEPTED" || status === "OFFER" || status === "ENROLLED") {
    return {
      badge: "border-emerald-100 bg-emerald-50 text-emerald-600",
      dot: "bg-emerald-500 text-white",
    };
  }

  if (status === "REJECTED" || status === "INVALID_DOCUMENTS") {
    return {
      badge: "border-red-100 bg-red-50 text-red-600",
      dot: "bg-red-500 text-white",
    };
  }

  if (status === "DRAFT") {
    return {
      badge: "border-amber-100 bg-amber-50 text-amber-700",
      dot: "bg-amber-500 text-white",
    };
  }

  if (status === "ARCHIVED") {
    return {
      badge: "border-slate-200 bg-slate-50 text-slate-600",
      dot: "bg-slate-500 text-white",
    };
  }

  return {
    badge: "border-blue-100 bg-blue-50 text-[#1559b7]",
    dot: "bg-[#1559b7] text-white",
  };
}

function getDocumentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    ARCHIVED: "Arxivdə",
    INVALID: "Problem var",
    MISSING: "Yüklənməyib",
    UPLOADED: "Yüklənib",
    WAIVED: "Tələb olunmur",
  };

  return labels[status] ?? status;
}

function getDocumentPreviewKind(document: ApplicationDetailDocumentRow) {
  const mimeType = document.mimeType?.toLowerCase() ?? "";
  const fileName = document.fileName?.toLowerCase() ?? "";

  if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
    return "pdf";
  }

  if (
    mimeType.startsWith("image/") ||
    [".jpg", ".jpeg", ".png", ".webp", ".gif"].some((extension) =>
      fileName.endsWith(extension),
    )
  ) {
    return "image";
  }

  if (
    [
      "application/msword",
      "application/vnd.ms-excel",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(mimeType) ||
    [".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"].some((extension) =>
      fileName.endsWith(extension),
    )
  ) {
    return "office";
  }

  return "unsupported";
}

function getOfficePreviewUrl(accessUrl: string) {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(accessUrl)}`;
}

function formatFileSize(bytes: number) {
  if (!bytes) {
    return "";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
