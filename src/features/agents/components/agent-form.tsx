"use client";

import {
  Building2Icon,
  CameraIcon,
  EyeIcon,
  EyeOffIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  PlusIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createAgentAction,
  type ActionState,
} from "@/features/agents/actions";
import {
  AGENT_SOCIAL_PLATFORMS,
  AGENT_SOCIAL_PLATFORM_LABELS,
} from "@/features/agents/constants";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type SocialRow = {
  id: string;
  platform: (typeof AGENT_SOCIAL_PLATFORMS)[number];
  url: string;
};

type ContactRow = {
  id: string;
  fullName: string;
  position: string;
  email: string;
  phone: string;
  whatsapp: string;
  isPrimary: boolean;
};

const initialActionState: ActionState = { status: "idle" };

const countryOptions = [
  ["", "Ölkə seçin"],
  ["Azerbaijan", "Azərbaycan"],
  ["Turkey", "Türkiyə"],
  ["Russia", "Rusiya"],
  ["Georgia", "Gürcüstan"],
  ["Kazakhstan", "Qazaxıstan"],
  ["Other", "Digər"],
] as const;

const portalPermissions = [
  {
    description: "Agent öz portalından yeni tələbə profili yarada bilər.",
    label: "Tələbə qeydiyyatı",
    name: "canRegisterStudents",
  },
  {
    description: "Agent yalnız özünə təyin edilən tələbə və müraciətləri görür.",
    label: "Yalnız öz qeydləri",
    name: "ownStudentsOnly",
  },
  {
    description: "Agent konversiya və komissiya göstəricilərini görə bilər.",
    label: "Portal hesabatları",
    name: "portalReporting",
  },
] as const;

export function AgentForm() {
  const [state, formAction, isPending] = useActionState(
    createAgentAction,
    initialActionState,
  );
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [socialRows, setSocialRows] = useState<SocialRow[]>([
    createSocialRow("INSTAGRAM"),
  ]);
  const [contacts, setContacts] = useState<ContactRow[]>([createContactRow(true)]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const serializedSocialLinks = useMemo(
    () =>
      JSON.stringify(
        socialRows
          .filter((row) => row.url.trim())
          .map(({ platform, url }) => ({ platform, url: url.trim() })),
      ),
    [socialRows],
  );
  const serializedContacts = useMemo(
    () =>
      JSON.stringify(
        contacts
          .filter(
            (contact) =>
              contact.fullName.trim() &&
              (contact.email.trim() ||
                contact.phone.trim() ||
                contact.whatsapp.trim()),
          )
          .map((contact) => ({
            email: contact.email.trim(),
            fullName: contact.fullName.trim(),
            isPrimary: contact.isPrimary,
            phone: contact.phone.trim(),
            position: contact.position.trim(),
            whatsapp: contact.whatsapp.trim(),
          })),
      ),
    [contacts],
  );
  const instagramUrl =
    socialRows.find((row) => row.platform === "INSTAGRAM")?.url.trim() ?? "";

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(URL.createObjectURL(file));
    setFileName(file.name);
  }

  function updateSocialRow(id: string, patch: Partial<SocialRow>) {
    setSocialRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function updateContact(id: string, patch: Partial<ContactRow>) {
    setContacts((rows) =>
      rows.map((row) => {
        if (patch.isPrimary) {
          return row.id === id
            ? { ...row, ...patch, isPrimary: true }
            : { ...row, isPrimary: false };
        }

        return row.id === id ? { ...row, ...patch } : row;
      }),
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input name="socialLinksJson" type="hidden" value={serializedSocialLinks} />
      <input name="contactsJson" type="hidden" value={serializedContacts} />
      <input name="instagramUrl" type="hidden" value={instagramUrl} />

      {state.status === "error" ? (
        <div
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" />
          <div>
            <div className="font-bold">Agent yadda saxlanılmadı</div>
            <p className="mt-0.5">{state.message}</p>
          </div>
        </div>
      ) : null}

      <section className="rounded-2xl border border-[#dbe5f1] bg-white">
        <SectionHeader
          description="Agentin əsas profili və əlaqə məlumatları"
          title="Şəxsi məlumatlar"
        />
        <div className="grid gap-6 p-5 lg:grid-cols-[180px_minmax(0,1fr)]">
          <div>
            <FieldLabel label="Profil şəkli" />
            <label className="group mt-2 flex aspect-square max-w-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#cbd9ea] bg-[#f8fbff] text-center transition hover:border-[#0b66ff] hover:bg-[#f3f8ff]">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="Profil şəkli önizləməsi"
                  className="size-full object-cover"
                  src={previewUrl}
                />
              ) : (
                <>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#e8f1ff] text-[#0b66ff]">
                    <CameraIcon className="size-5" />
                  </span>
                  <span className="mt-3 text-sm font-bold text-[#183153]">
                    Şəkil yüklə
                  </span>
                  <span className="mt-1 px-3 text-[11px] text-[#71809a]">
                    JPG, PNG və ya WebP · 5 MB
                  </span>
                </>
              )}
              <input
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                name="profilePhoto"
                onChange={handlePhotoChange}
                type="file"
              />
            </label>
            {fileName ? (
              <p className="mt-2 max-w-40 truncate text-xs text-[#637392]">
                {fileName}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormField error={state.fieldErrors?.firstName?.[0]} label="Ad" required>
              <TextInput icon={UserRoundIcon} name="firstName" required />
            </FormField>
            <FormField error={state.fieldErrors?.lastName?.[0]} label="Soyad" required>
              <TextInput icon={UserRoundIcon} name="lastName" required />
            </FormField>
            <FormField label="Şirkət">
              <TextInput icon={Building2Icon} name="companyName" />
            </FormField>
            <FormField label="Telefon">
              <TextInput
                icon={PhoneIcon}
                name="mobilePhone"
                placeholder="+994 50 000 00 00"
                type="tel"
              />
            </FormField>
            <FormField label="Ölkə">
              <select className={controlClassName} defaultValue="" name="country">
                {countryOptions.map(([value, label]) => (
                  <option key={value || "empty"} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Ünvan">
              <TextInput icon={MapPinIcon} name="address" />
            </FormField>
            <div className="md:col-span-2 xl:col-span-3">
              <FormField label="Daxili qeyd">
                <Textarea
                  className="min-h-20 resize-y rounded-xl border-[#d7e2ef] bg-white px-3 py-2.5 text-sm focus-visible:border-[#0b66ff] focus-visible:ring-2 focus-visible:ring-[#0b66ff]/10"
                  name="internalNotes"
                  placeholder="Region, dil, onboarding və əməkdaşlıq qeydləri..."
                />
              </FormField>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#dbe5f1] bg-white">
        <SectionHeader
          action={
            <Button
              className="h-9 rounded-xl px-3 text-xs font-bold"
              onClick={() => setSocialRows((rows) => [...rows, createSocialRow()])}
              type="button"
              variant="outline"
            >
              <PlusIcon data-icon="inline-start" />
              Sosial hesab əlavə et
            </Button>
          }
          description="Agentin ictimai profilləri və veb səhifəsi"
          title="Sosial media"
        />
        <div className="space-y-2 p-5">
          {socialRows.map((row) => (
            <div
              className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)_40px]"
              key={row.id}
            >
              <select
                aria-label="Sosial platforma"
                className={controlClassName}
                onChange={(event) =>
                  updateSocialRow(row.id, {
                    platform: event.target.value as SocialRow["platform"],
                  })
                }
                value={row.platform}
              >
                {AGENT_SOCIAL_PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>
                    {AGENT_SOCIAL_PLATFORM_LABELS[platform]}
                  </option>
                ))}
              </select>
              <Input
                aria-label={`${AGENT_SOCIAL_PLATFORM_LABELS[row.platform]} URL`}
                className={controlClassName}
                onChange={(event) =>
                  updateSocialRow(row.id, { url: event.target.value })
                }
                placeholder="https://..."
                type="url"
                value={row.url}
              />
              <Button
                aria-label="Sosial hesabı sil"
                className="size-10 rounded-xl text-[#71809a] hover:bg-red-50 hover:text-red-600"
                disabled={socialRows.length === 1}
                onClick={() =>
                  setSocialRows((rows) => rows.filter((item) => item.id !== row.id))
                }
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#dbe5f1] bg-white">
        <SectionHeader
          action={
            <Button
              className="h-9 rounded-xl px-3 text-xs font-bold"
              onClick={() => setContacts((rows) => [...rows, createContactRow()])}
              type="button"
              variant="outline"
            >
              <PlusIcon data-icon="inline-start" />
              Əlaqəli şəxs əlavə et
            </Button>
          }
          description="Agent şirkətində gündəlik əlaqə saxlanılan şəxslər"
          title="Əlaqəli şəxslər"
        />
        <div className="space-y-3 p-5">
          {contacts.map((contact, index) => (
            <div
              className="grid gap-3 rounded-xl border border-[#e5edf6] bg-[#fbfdff] p-3 xl:grid-cols-[1.2fr_1fr_1.35fr_1fr_1fr_auto_auto]"
              key={contact.id}
            >
              <CompactInput
                label="Ad soyad"
                onChange={(value) => updateContact(contact.id, { fullName: value })}
                value={contact.fullName}
              />
              <CompactInput
                label="Vəzifə"
                onChange={(value) => updateContact(contact.id, { position: value })}
                value={contact.position}
              />
              <CompactInput
                label="E-poçt"
                onChange={(value) => updateContact(contact.id, { email: value })}
                type="email"
                value={contact.email}
              />
              <CompactInput
                label="Telefon"
                onChange={(value) => updateContact(contact.id, { phone: value })}
                type="tel"
                value={contact.phone}
              />
              <CompactInput
                label="WhatsApp"
                onChange={(value) => updateContact(contact.id, { whatsapp: value })}
                type="tel"
                value={contact.whatsapp}
              />
              <label className="flex min-w-24 items-center gap-2 self-end rounded-xl px-2 py-2 text-xs font-semibold text-[#526482]">
                <input
                  checked={contact.isPrimary}
                  className="size-4 accent-[#0b66ff]"
                  name="primaryContact"
                  onChange={() => updateContact(contact.id, { isPrimary: true })}
                  type="radio"
                  value={contact.id}
                />
                Əsas əlaqə
              </label>
              <Button
                aria-label={`${index + 1}-ci əlaqəli şəxsi sil`}
                className="size-10 self-end rounded-xl text-[#71809a] hover:bg-red-50 hover:text-red-600"
                disabled={contacts.length === 1}
                onClick={() =>
                  setContacts((rows) => rows.filter((item) => item.id !== contact.id))
                }
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#dbe5f1] bg-white">
          <SectionHeader
            description="Agentin şəxsi portal hesabı"
            title="Portal girişi"
          />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <FormField error={state.fieldErrors?.email?.[0]} label="E-poçt" required>
              <TextInput icon={MailIcon} name="email" required type="email" />
            </FormField>
            <FormField error={state.fieldErrors?.password?.[0]} label="Şifrə" required>
              <div className="relative">
                <TextInput
                  icon={ShieldCheckIcon}
                  name="password"
                  required
                  type={showPassword ? "text" : "password"}
                />
                <button
                  aria-label={showPassword ? "Şifrəni gizlət" : "Şifrəni göstər"}
                  className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#71809a] hover:bg-[#eef5ff] hover:text-[#0b66ff]"
                  onClick={() => setShowPassword((value) => !value)}
                  type="button"
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </button>
              </div>
            </FormField>
          </div>
        </section>

        <section className="rounded-2xl border border-[#dbe5f1] bg-white">
          <SectionHeader
            description="Agentin portalda edə biləcəyi əməliyyatlar"
            title="Portal icazələri"
          />
          <div className="divide-y divide-[#edf2f7] px-5">
            {portalPermissions.map((permission) => (
              <label
                className="flex items-center gap-3 py-3"
                key={permission.name}
              >
                <Checkbox
                  className="size-5 rounded-md border-[#b9c9dc] data-checked:bg-[#0b66ff]"
                  defaultChecked
                  disabled={isPending}
                  name={permission.name}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-[#102442]">
                    {permission.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-[#71809a]">
                    {permission.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>

      <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-2xl border border-[#d7e2ef] bg-white/95 p-3 shadow-[0_16px_42px_rgba(20,48,91,0.12)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-[#637392]">
          <UsersRoundIcon className="size-4 text-[#0b66ff]" />
          Profil, əlaqələr və portal hesabı bir əməliyyatda yaradılacaq.
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            className="h-10 rounded-xl px-5 font-bold"
            variant="outline"
          >
            <Link href="/agents">Ləğv et</Link>
          </Button>
          <Button
            className="h-10 rounded-xl bg-[#0b66ff] px-6 font-bold shadow-[0_10px_24px_rgba(11,102,255,0.24)] hover:bg-[#075be8]"
            disabled={isPending}
          >
            {isPending ? "Yaradılır..." : "Agent yarat"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function SectionHeader({
  action,
  description,
  title,
}: {
  action?: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#e8eef5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-sm font-black text-[#102442]">{title}</h2>
        <p className="mt-0.5 text-xs text-[#71809a]">{description}</p>
      </div>
      {action}
    </div>
  );
}

function FormField({
  children,
  error,
  label,
  required = false,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <FieldLabel label={label} required={required} />
      <div className="mt-1.5">{children}</div>
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className="text-[11px] font-bold uppercase tracking-wide text-[#637392]">
      {label}
      {required ? <span className="ml-0.5 text-red-500">*</span> : null}
    </span>
  );
}

function TextInput({
  icon: Icon,
  className,
  ...props
}: React.ComponentProps<"input"> & { icon: LucideIcon }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7c8da8]" />
      <Input
        {...props}
        className={cn(controlClassName, "pl-9", className)}
      />
    </div>
  );
}

function CompactInput({
  label,
  onChange,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[#71809a]">
        {label}
      </span>
      <Input
        className={controlClassName}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

const controlClassName =
  "h-10 w-full rounded-xl border border-[#d7e2ef] bg-white px-3 text-sm font-medium text-[#102442] outline-none transition placeholder:text-[#9aa8bc] hover:border-[#b9cbe1] focus:border-[#0b66ff] focus:ring-2 focus:ring-[#0b66ff]/10";

function createSocialRow(
  platform: SocialRow["platform"] = "WEBSITE",
): SocialRow {
  return {
    id: createClientId(),
    platform,
    url: "",
  };
}

function createContactRow(isPrimary = false): ContactRow {
  return {
    email: "",
    fullName: "",
    id: createClientId(),
    isPrimary,
    phone: "",
    position: "",
    whatsapp: "",
  };
}

function createClientId() {
  return Math.random().toString(36).slice(2, 10);
}
