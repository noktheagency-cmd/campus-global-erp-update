import {
  CalendarClockIcon,
  ChevronRightIcon,
  PhoneIcon,
  UserRoundIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CRM_SOURCE_LABELS,
  CRM_STAGE_LABELS,
  CRM_STATUS_LABELS,
} from "@/features/crm/constants";
import { formatCrmDateTime } from "@/features/crm/formatters";
import type { CrmRecord, CrmView } from "@/features/crm/types";
import { cn } from "@/lib/utils";

const overviewColumns =
  "grid-cols-[minmax(160px,1.25fr)_48px_minmax(70px,.7fr)_minmax(86px,.78fr)_minmax(88px,.82fr)_minmax(92px,.78fr)_minmax(86px,.72fr)_24px]";
const individualColumns =
  "grid-cols-[minmax(175px,1.35fr)_minmax(78px,.72fr)_minmax(86px,.76fr)_minmax(88px,.85fr)_minmax(92px,.78fr)_minmax(86px,.72fr)_24px]";
const agentColumns =
  "grid-cols-[minmax(180px,1.35fr)_minmax(70px,.68fr)_58px_66px_66px_minmax(92px,.78fr)_86px_24px]";

export function CrmRecordsList({
  onSelect,
  records,
  selectedId,
  view,
}: {
  onSelect: (recordId: string) => void;
  records: CrmRecord[];
  selectedId: string | null;
  view: CrmView;
}) {
  if (records.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl border border-[#dce6f4] bg-[#f6f9ff] text-[#0b66ff]">
          <UserRoundIcon className="size-5" />
        </span>
        <h2 className="mt-3 text-sm font-black text-[#14264b]">Nəticə tapılmadı</h2>
        <p className="mt-1 max-w-sm text-xs font-medium leading-5 text-[#71809f]">
          Axtarış sözünü və ya filterləri dəyişərək yenidən yoxlayın.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto xl:block">
        <div className="min-w-[650px]">
          <DesktopHeader view={view} />
          <div className="max-h-[600px] overflow-y-auto">
            {records.map((record) => (
              <DesktopRow
                key={`${record.kind}-${record.id}`}
                onSelect={onSelect}
                record={record}
                selected={selectedId === record.id}
                view={view}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-2.5 p-3 xl:hidden">
        {records.map((record) => (
          <MobileRecord
            key={`${record.kind}-${record.id}`}
            onSelect={onSelect}
            record={record}
            selected={selectedId === record.id}
          />
        ))}
      </div>
    </>
  );
}

function DesktopHeader({ view }: { view: CrmView }) {
  const isAgentView = view === "agents";
  const isIndividualView = view === "individuals";
  const labels = isAgentView
    ? [
        "Agent / şirkət",
        "Ölkə",
        "Tələbələr",
        "Aktiv müraciət",
        "Konversiya",
        "Növbəti izləmə",
        "Status",
        "",
      ]
    : isIndividualView
      ? [
          "Müştəri / əlaqə",
          "Mənbə",
          "Mərhələ",
          "Agent",
          "Növbəti izləmə",
          "Status",
          "",
        ]
      : [
          "Ad / kontakt",
          "Tip",
          "Mənbə",
          "Mərhələ",
          "Məsul şəxs",
          "Növbəti izləmə",
          "Status",
          "",
        ];

  return (
    <div
      className={cn(
        "grid items-center border-b border-[#e5edf8] bg-[#f6f9ff] px-2",
        getColumns(view),
      )}
    >
      {labels.map((label, index) => (
        <div
          className={cn(
            "px-2 py-2.5 text-[9px] font-black uppercase tracking-[0.04em] text-[#637392]",
            index === labels.length - 1 && "sr-only",
          )}
          key={`${label}-${index}`}
        >
          {label || "Detal"}
        </div>
      ))}
    </div>
  );
}

function DesktopRow({
  onSelect,
  record,
  selected,
  view,
}: {
  onSelect: (recordId: string) => void;
  record: CrmRecord;
  selected: boolean;
  view: CrmView;
}) {
  return (
    <button
      className={cn(
        "grid min-h-[66px] w-full items-center border-b border-[#edf2f9] px-2 text-left transition [contain-intrinsic-size:66px] [content-visibility:auto] last:border-b-0 hover:bg-[#f8fbff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b66ff]",
        getColumns(view),
        selected && "bg-[#f1f6ff] shadow-[inset_3px_0_0_#0b66ff] hover:bg-[#f1f6ff]",
      )}
      onClick={() => onSelect(record.id)}
      type="button"
    >
      <IdentityCell record={record} />
      {view === "agents" ? (
        <>
          <Cell>{record.country}</Cell>
          <StrongCell>{record.studentsCount}</StrongCell>
          <StrongCell>{record.activeApplications}</StrongCell>
          <StrongCell>{record.conversionRate}%</StrongCell>
          <DateCell value={record.nextFollowUpAt} />
          <StatusCell record={record} />
        </>
      ) : view === "individuals" ? (
        <>
          <Cell>{CRM_SOURCE_LABELS[record.source]}</Cell>
          <StageCell record={record} />
          <Cell>{record.agentName}</Cell>
          <DateCell value={record.nextFollowUpAt} />
          <StatusCell record={record} />
        </>
      ) : (
        <>
          <Cell>{record.kind === "agent" ? "Agent" : "Fərdi"}</Cell>
          <Cell>{CRM_SOURCE_LABELS[record.source]}</Cell>
          <StageCell record={record} />
          <Cell>{record.owner?.name ?? "Təyin edilməyib"}</Cell>
          <DateCell value={record.nextFollowUpAt} />
          <StatusCell record={record} />
        </>
      )}
      <span className="flex items-center justify-center text-[#91a0b9]">
        <ChevronRightIcon className="size-4" />
      </span>
    </button>
  );
}

function MobileRecord({
  onSelect,
  record,
  selected,
}: {
  onSelect: (recordId: string) => void;
  record: CrmRecord;
  selected: boolean;
}) {
  return (
    <button
      className={cn(
        "rounded-2xl border border-[#dce6f4] bg-white p-3 text-left shadow-[0_8px_24px_rgba(29,78,216,0.04)] transition [contain-intrinsic-size:142px] [content-visibility:auto]",
        selected && "border-[#9bc2ff] bg-[#f4f8ff]",
      )}
      onClick={() => onSelect(record.id)}
      type="button"
    >
      <div className="flex items-center gap-3">
        <RecordAvatar record={record} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-black text-[#14264b]">{record.name}</div>
          <div className="mt-0.5 truncate text-[11px] font-semibold text-[#71809f]">
            {record.companyName || record.email}
          </div>
        </div>
        <ChevronRightIcon className="size-4 text-[#91a0b9]" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <MobileMeta label="Mərhələ" value={CRM_STAGE_LABELS[record.stage]} />
        <MobileMeta label="Məsul" value={record.owner?.name ?? "Təyin edilməyib"} />
        <MobileMeta label="Növbəti izləmə" value={formatCrmDateTime(record.nextFollowUpAt)} />
        <MobileMeta label="Status" value={CRM_STATUS_LABELS[record.status]} />
      </div>
    </button>
  );
}

function IdentityCell({ record }: { record: CrmRecord }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 px-2 py-2">
      <RecordAvatar record={record} />
      <div className="min-w-0">
        <div className="truncate text-xs font-black text-[#14264b]">{record.name}</div>
        <div className="mt-0.5 truncate text-[10px] font-semibold text-[#71809f]">
          {record.kind === "agent" ? record.companyName : record.email}
        </div>
        {record.kind === "individual" ? (
          <div className="mt-0.5 flex items-center gap-1 truncate text-[9px] font-medium text-[#94a1b8]">
            <PhoneIcon className="size-2.5" />
            {record.phone}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RecordAvatar({ record }: { record: CrmRecord }) {
  return (
    <Avatar className="size-9 shrink-0 border border-[#dce6f4] bg-[#eff5ff]">
      <AvatarImage alt={record.name} src={record.avatarUrl} />
      <AvatarFallback className="bg-[#eff5ff] text-[10px] font-black text-[#0b66ff]">
        {record.initials}
      </AvatarFallback>
    </Avatar>
  );
}

function StageCell({ record }: { record: CrmRecord }) {
  return (
    <div className="min-w-0 px-2 py-2">
      <span className="inline-flex max-w-full truncate rounded-lg border border-[#dbe8ff] bg-[#f1f6ff] px-2 py-1 text-[9px] font-black text-[#0b66ff]">
        {CRM_STAGE_LABELS[record.stage]}
      </span>
    </div>
  );
}

function StatusCell({ record }: { record: CrmRecord }) {
  const tone = {
    ACTIVE: "bg-emerald-500",
    FOLLOW_UP: "bg-amber-500",
    LOST: "bg-red-500",
    PAUSED: "bg-slate-400",
    WON: "bg-[#0b66ff]",
  }[record.status];

  return (
    <div className="flex min-w-0 items-center gap-1.5 px-2 py-2 text-[9px] font-bold text-[#4c5f83]">
      <span className={cn("size-1.5 shrink-0 rounded-full", tone)} />
      <span className="truncate">{CRM_STATUS_LABELS[record.status]}</span>
    </div>
  );
}

function DateCell({ value }: { value: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 px-2 py-2 text-[9px] font-bold text-[#4c5f83]">
      <CalendarClockIcon className="size-3 shrink-0 text-[#71809f]" />
      <span className="truncate">{formatCrmDateTime(value)}</span>
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0 truncate px-2 py-2 text-[9px] font-semibold text-[#4c5f83]">
      {children}
    </div>
  );
}

function StrongCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 py-2 text-[11px] font-black tabular-nums text-[#14264b]">
      {children}
    </div>
  );
}

function MobileMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#f8fbff] px-2.5 py-2">
      <div className="text-[9px] font-black uppercase tracking-[0.04em] text-[#8a98b2]">
        {label}
      </div>
      <div className="mt-0.5 truncate font-bold text-[#34456c]">{value}</div>
    </div>
  );
}

function getColumns(view: CrmView) {
  if (view === "agents") return agentColumns;
  if (view === "individuals") return individualColumns;
  return overviewColumns;
}
