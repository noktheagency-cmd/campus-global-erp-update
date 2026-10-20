"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  EyeIcon,
  FileTextIcon,
  IdCardIcon,
  ImageIcon,
  KeyRoundIcon,
  LockKeyholeIcon,
  MailIcon,
  PhoneIcon,
  PlusIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UploadCloudIcon,
  UserRoundIcon,
  UsersRoundIcon,
  XIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  createStudentAction,
  generateStudentPortalCredentialsAction,
  type StudentActionState,
} from "@/features/students/actions";
import type { StudentCreateOptions } from "@/features/students/types";
import { cn } from "@/lib/utils";

const defaultAgentOption = { label: "-- Seçin --", value: "__none__" };
const initialActionState: StudentActionState = { status: "idle" };

const citizenshipOptions = [
  { label: "Azərbaycan", value: "Azerbaijan" },
  { label: "Türkiyə", value: "Turkey" },
  { label: "Rusiya", value: "Russia" },
  { label: "Gürcüstan", value: "Georgia" },
  { label: "Qazaxıstan", value: "Kazakhstan" },
  { label: "Digər", value: "Other" },
] as const;

const studentDocumentTypeOptions = [
  { label: "Pasport", value: "Pasport" },
  { label: "Şəxsiyyət vəsiqəsi", value: "Şəxsiyyət vəsiqəsi" },
  { label: "Diplom / attestat", value: "Diplom / attestat" },
  { label: "Transkript", value: "Transkript" },
  { label: "Sertifikat", value: "Sertifikat" },
  { label: "Digər", value: "Digər" },
] as const;

export function StudentForm({
  createOptions,
  defaultAgentId,
  isAgentPortal = false,
}: {
  createOptions: StudentCreateOptions;
  defaultAgentId?: string;
  isAgentPortal?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    createStudentAction,
    initialActionState,
  );
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [photoFileName, setPhotoFileName] = useState("");
  const [gender, setGender] = useState("Male");
  const [maritalStatus, setMaritalStatus] = useState("Single");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [credentialMessage, setCredentialMessage] = useState("");
  const [isGeneratingCredentials, setIsGeneratingCredentials] =
    useState(false);
  const [documentEntries, setDocumentEntries] = useState([
    { fileName: "", id: "1" },
  ]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const documentIdRef = useRef(1);
  const agentOptions = [defaultAgentOption, ...createOptions.agents];
  const preselectedAgent = defaultAgentId
    ? createOptions.agents.find((agent) => agent.value === defaultAgentId)
    : undefined;
  const agentSelectDefaultValue = preselectedAgent?.value ?? "__none__";
  const [agentId, setAgentId] = useState(agentSelectDefaultValue);
  const fieldErrors = state.fieldErrors ?? {};

  useEffect(() => {
    return () => {
      if (photoPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (photoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    setPhotoPreviewUrl(URL.createObjectURL(file));
    setPhotoFileName(file.name);
  }

  function clearPhoto() {
    if (photoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    setPhotoPreviewUrl("");
    setPhotoFileName("");

    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  async function handleGenerateCredentials() {
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();

    if (!cleanFirstName || !cleanLastName) {
      setCredentialMessage("Əvvəlcə ad və soyadı daxil edin.");
      return;
    }

    setCredentialMessage("");
    setIsGeneratingCredentials(true);

    try {
      const credentials = await generateStudentPortalCredentialsAction({
        firstName: cleanFirstName,
        lastName: cleanLastName,
      });

      setLoginEmail(credentials.email);
      setPassword(credentials.password);
      setShowPassword(true);
      setCredentialMessage("E-poçt və şifrə avtomatik yaradıldı.");
    } catch {
      setCredentialMessage("Giriş məlumatları yaradıla bilmədi.");
    } finally {
      setIsGeneratingCredentials(false);
    }
  }

  function addDocumentEntry() {
    documentIdRef.current += 1;
    setDocumentEntries((entries) => [
      ...entries,
      { fileName: "", id: String(documentIdRef.current) },
    ]);
  }

  function removeDocumentEntry(id: string) {
    setDocumentEntries((entries) => {
      const nextEntries = entries.filter((entry) => entry.id !== id);
      return nextEntries.length > 0
        ? nextEntries
        : [{ fileName: "", id: String(++documentIdRef.current) }];
    });
  }

  function updateDocumentFileName(id: string, fileName: string) {
    setDocumentEntries((entries) =>
      entries.map((entry) =>
        entry.id === id ? { ...entry, fileName } : entry,
      ),
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.status === "error" ? (
        <div className="flex flex-col gap-3 rounded-[1.5rem] border border-red-100 bg-red-50 px-5 py-4 text-red-700 shadow-[0_16px_40px_rgba(239,64,93,0.08)] sm:flex-row sm:items-center">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-red-500">
            <XIcon />
          </div>
          <div>
            <div className="text-sm font-black">Tələbə yadda saxlanılmadı.</div>
            <p className="mt-1 text-sm leading-6 text-red-600">
              {state.message ?? "Zəhmət olmasa işarələnmiş sahələri yoxlayın."}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-6">
          <FieldSet className="rounded-[2rem] border border-[#dce6f4]/70 bg-white/82 p-5 shadow-[0_20px_50px_rgba(29,78,216,0.04)] backdrop-blur-md">
            <div className="flex items-start gap-3.5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#0b66ff]/10 bg-[#e8f1ff] text-[#0b66ff]">
                <ImageIcon />
              </div>
              <div className="min-w-0">
                <FieldLegend className="mb-0 text-base font-black text-[#07183a]">
                  Şəkil yükləyin
                </FieldLegend>
                <FieldDescription className="mt-1 text-sm leading-6 text-[#637392]">
                  Tələbə qeydi üçün istəyə bağlı profil şəkli.
                </FieldDescription>
              </div>
            </div>
            <Separator className="bg-[#edf2f8]" />

            <div className="flex flex-col items-center gap-4 rounded-[1.6rem] border border-dashed border-[#b8cced] bg-[#f8fbff] p-5 text-center">
              <div className="flex size-32 items-center justify-center overflow-hidden rounded-[2rem] bg-white text-[#0b66ff] shadow-[0_16px_36px_rgba(15,23,42,0.06)] ring-1 ring-[#dce6f4]">
                {photoPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="size-full object-cover"
                    src={photoPreviewUrl}
                  />
                ) : (
                  <UserRoundIcon className="size-12" />
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-[#07183a]">
                  {photoFileName || "Şəkil yükləyin (istəyə bağlı)"}
                </div>
                <p className="mt-1 text-xs font-medium text-[#71809f]">
                  PNG, JPG və ya WebP
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <label className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0b66ff] px-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:bg-[#075be8]">
                  <UploadCloudIcon className="size-4" />
                  Yüklə
                  <input
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    name="photo"
                    onChange={handlePhotoChange}
                    ref={photoInputRef}
                    type="file"
                  />
                </label>
                {photoPreviewUrl ? (
                  <Button
                    className="h-11 rounded-2xl border-[#dce6f4] bg-white px-4 text-sm font-bold text-[#34456c] hover:bg-red-50 hover:text-red-600"
                    onClick={clearPhoto}
                    type="button"
                    variant="outline"
                  >
                    <XIcon data-icon="inline-start" />
                    Sil
                  </Button>
                ) : null}
              </div>
            </div>
          </FieldSet>

          <div className="rounded-[2rem] border border-[#dce6f4]/70 bg-white/82 p-5 shadow-[0_20px_50px_rgba(29,78,216,0.04)] backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff7e8] text-[#d97706]">
                <KeyRoundIcon />
              </div>
              <div>
                <h2 className="text-base font-black text-[#07183a]">
                  Portal sonra
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#637392]">
                  Giriş sahələri indi toplanır; tələbə portalı ekranı bu bölmə
                  hazır olandan sonra açılacaq.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          <FormSection
            description="Admissions və agentlər üçün istifadə olunan əsas şəxsiyyət və əlaqə məlumatları."
            icon={UserRoundIcon}
            step="01"
            title="Şəxsi məlumatlar"
          >
            <FieldGroup className="gap-5">
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                <FormField
                  error={fieldErrors.firstName?.[0]}
                  label="Ad"
                  required
                >
                  <InputWithIcon
                    icon={UserRoundIcon}
                    name="firstName"
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="Ad"
                    required
                    value={firstName}
                  />
                </FormField>
                <FormField
                  error={fieldErrors.lastName?.[0]}
                  label="Soyad"
                  required
                >
                  <InputWithIcon
                    icon={UserRoundIcon}
                    name="lastName"
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Soyad"
                    required
                    value={lastName}
                  />
                </FormField>
                <FormField label="Ata adı">
                  <InputWithIcon
                    icon={UsersRoundIcon}
                    name="fatherName"
                    placeholder="Ata adı"
                  />
                </FormField>
                <FormField label="Ana adı">
                  <InputWithIcon
                    icon={UsersRoundIcon}
                    name="motherName"
                    placeholder="Ana adı"
                  />
                </FormField>
              </div>

              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                <FormField
                  error={fieldErrors.birthDate?.[0]}
                  label="Doğum tarixi"
                >
                  <DateInputWithIcon name="birthDate" />
                </FormField>
                <FormField
                  error={fieldErrors.contactEmail?.[0]}
                  label="E-poçt (əlaqə üçün)"
                >
                  <InputWithIcon
                    icon={MailIcon}
                    name="contactEmail"
                    placeholder="email@example.com"
                    type="email"
                  />
                </FormField>
                <FormField
                  error={fieldErrors.phone?.[0]}
                  label="Mobil telefon"
                >
                  <InputWithIcon
                    icon={PhoneIcon}
                    name="mobilePhone"
                    placeholder="+994 50 000 00 00"
                    type="tel"
                  />
                </FormField>
                <FormField label="Vətəndaşlıq">
                  <ModernSelect
                    defaultValue="Azerbaijan"
                    name="citizenship"
                    options={citizenshipOptions}
                  />
                </FormField>
              </div>

              <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(220px,0.5fr)_minmax(220px,0.5fr)]">
                <FormField label="Ünvan">
                  <Textarea
                    className="min-h-14 resize-none rounded-[1.35rem] border-[#dce6f4] bg-white/82 px-4 py-3 text-sm font-bold text-[#07183a] shadow-[0_4px_16px_rgba(15,23,42,0.02)] outline-none transition-all duration-300 hover:border-[#0b66ff]/30 focus-visible:border-[#0b66ff] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#0b66ff]/10 focus-visible:ring-offset-0"
                    name="address"
                    placeholder="Ünvan"
                  />
                </FormField>
                <FormField label="Pasport no">
                  <InputWithIcon
                    icon={IdCardIcon}
                    name="passportNo"
                    placeholder="Pasport no"
                  />
                </FormField>
                <FormField label="Şəxsiyyət no">
                  <InputWithIcon
                    icon={ShieldCheckIcon}
                    name="identityNo"
                    placeholder="Şəxsiyyət no"
                  />
                </FormField>
              </div>

              <input
                name="agentId"
                type="hidden"
                value={agentId === "__none__" ? "" : agentId}
              />

              <div className="grid gap-4 2xl:grid-cols-[minmax(220px,0.8fr)_minmax(0,1fr)_minmax(0,1fr)]">
                {isAgentPortal ? (
                  <div className="flex min-h-14 flex-col justify-center rounded-[1.35rem] border border-[#dce6f4] bg-[#f8fbff] px-4 py-3">
                    <span className="text-[11px] font-black uppercase text-[#637392]">
                      Agent
                    </span>
                    <span className="mt-1 truncate text-sm font-bold text-[#07183a]">
                      {preselectedAgent?.label ?? "Cari agent"}
                    </span>
                    <span className="mt-1 text-xs font-semibold text-[#0b66ff]">
                      Avtomatik təyin olunur
                    </span>
                  </div>
                ) : (
                  <FormField
                    error={fieldErrors.agentId?.[0]}
                    label="Agent seçin"
                  >
                    <ModernSelect
                      defaultValue={agentSelectDefaultValue}
                      key={agentSelectDefaultValue}
                      onValueChange={setAgentId}
                      options={agentOptions}
                      value={agentId}
                    />
                    {preselectedAgent ? (
                      <FieldDescription className="text-xs font-semibold text-[#0b66ff]">
                        Tələbə {preselectedAgent.label} üçün təyin ediləcək.
                      </FieldDescription>
                    ) : null}
                  </FormField>
                )}
                <ChoiceGroup
                  label="Cins"
                  name="gender"
                  onChange={setGender}
                  options={[
                    { label: "Kişi", value: "Male" },
                    { label: "Qadın", value: "Female" },
                  ]}
                  value={gender}
                />
                <ChoiceGroup
                  label="Ailə vəziyyəti"
                  name="maritalStatus"
                  onChange={setMaritalStatus}
                  options={[
                    { label: "Subay", value: "Single" },
                    { label: "Evli", value: "Married" },
                  ]}
                  value={maritalStatus}
                />
              </div>
            </FieldGroup>
          </FormSection>

          <FormSection
            description="Burada daxil edilən giriş məlumatları tələbə portalı aktivləşəndə istifadə olunacaq."
            icon={LockKeyholeIcon}
            step="02"
            title="Giriş məlumatları"
          >
            <div className="flex flex-col gap-3 rounded-[1.35rem] border border-[#dce6f4] bg-[#f8fbff] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-black text-[#07183a]">
                  Portal e-poçtu və şifrə
                </div>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#637392]">
                  Ad və soyada uyğun, bazada olmayan e-poçt avtomatik seçilir.
                </p>
                {credentialMessage ? (
                  <p
                    className={cn(
                      "mt-1 text-xs font-bold",
                      credentialMessage.includes("yaradıldı")
                        ? "text-emerald-600"
                        : "text-amber-600",
                    )}
                  >
                    {credentialMessage}
                  </p>
                ) : null}
              </div>
              <Button
                className="h-10 shrink-0 rounded-xl border-[#cfe1ff] bg-white px-4 text-xs font-black text-[#0b66ff] hover:bg-[#eef5ff]"
                disabled={isGeneratingCredentials}
                onClick={handleGenerateCredentials}
                type="button"
                variant="outline"
              >
                <KeyRoundIcon data-icon="inline-start" />
                {isGeneratingCredentials ? "Yaradılır..." : "Avtomatik yarat"}
              </Button>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <FormField
                error={fieldErrors.loginEmail?.[0]}
                label="E-poçt"
                required
              >
                <InputWithIcon
                  icon={MailIcon}
                  name="loginEmail"
                  onChange={(event) => setLoginEmail(event.target.value)}
                  placeholder="E-poçt"
                  required
                  type="email"
                  value={loginEmail}
                />
              </FormField>
              <FormField
                error={fieldErrors.password?.[0]}
                label="Şifrə"
                required
              >
                <InputGroup className="h-14 rounded-[1.35rem] border-[#dce6f4] bg-white/82 shadow-[0_4px_16px_rgba(15,23,42,0.02)] transition-all duration-300 hover:border-[#0b66ff]/30 focus-within:border-[#0b66ff] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0b66ff]/10">
                  <InputGroupAddon>
                    <LockKeyholeIcon className="size-4.5 text-[#0b66ff]" />
                  </InputGroupAddon>
                  <InputGroupInput
                    className="text-sm font-bold text-[#07183a]"
                    name="password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Şifrə"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <InputGroupAddon align="inline-end">
                    <button
                      aria-label={
                          showPassword ? "Şifrəni gizlət" : "Şifrəni göstər"
                      }
                      className="flex size-9 items-center justify-center rounded-xl text-[#637392] transition hover:bg-[#eef5ff] hover:text-[#0b66ff]"
                      onClick={() => setShowPassword((current) => !current)}
                      type="button"
                    >
                      <EyeIcon className="size-4" />
                    </button>
                  </InputGroupAddon>
                </InputGroup>
              </FormField>
            </div>
          </FormSection>

          <FormSection
            description="Tələbənin profilinə aid ümumi sənədləri əlavə edin. Bu fayllar müraciətdən asılı olmadan tələbə portalında və tələbə detallarında görünəcək."
            icon={FileTextIcon}
            step="03"
            title="Ümumi sənədlər"
          >
            <div className="grid gap-3">
              {documentEntries.map((entry, index) => (
                <div
                  className="grid gap-3 rounded-[1.35rem] border border-[#dce6f4] bg-[#fbfdff] p-3 lg:grid-cols-[minmax(0,1fr)_220px_minmax(240px,1fr)_44px] lg:items-end"
                  key={entry.id}
                >
                  <input
                    name="studentDocumentKeys"
                    type="hidden"
                    value={entry.id}
                  />
                  <FormField label="Sənədin adı">
                    <InputWithIcon
                      icon={FileTextIcon}
                      name={`studentDocumentTitle:${entry.id}`}
                      placeholder={`Sənəd ${index + 1}`}
                    />
                  </FormField>
                  <FormField label="Sənəd növü">
                    <ModernSelect
                      defaultValue="Digər"
                      name={`studentDocumentType:${entry.id}`}
                      options={studentDocumentTypeOptions}
                    />
                  </FormField>
                  <FormField label="Fayl">
                    <label className="flex h-14 cursor-pointer items-center gap-3 rounded-[1.35rem] border border-dashed border-[#b8cced] bg-white px-4 text-sm font-bold text-[#34456c] transition hover:border-[#0b66ff] hover:bg-[#f8fbff]">
                      <UploadCloudIcon className="size-4.5 shrink-0 text-[#0b66ff]" />
                      <span className="min-w-0 flex-1 truncate">
                        {entry.fileName || "Fayl seçin"}
                      </span>
                      <input
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
                        className="sr-only"
                        name={`studentDocumentFile:${entry.id}`}
                        onChange={(event) =>
                          updateDocumentFileName(
                            entry.id,
                            event.target.files?.[0]?.name ?? "",
                          )
                        }
                        type="file"
                      />
                    </label>
                  </FormField>
                  <Button
                    aria-label={`${index + 1}-ci sənəd sətrini sil`}
                    className="size-11 rounded-xl border-[#dce6f4] bg-white text-[#71809f] hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    onClick={() => removeDocumentEntry(entry.id)}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              className="h-10 w-fit rounded-xl border-[#cfe1ff] bg-white px-4 text-xs font-black text-[#0b66ff] hover:bg-[#eef5ff]"
              onClick={addDocumentEntry}
              type="button"
              variant="outline"
            >
              <PlusIcon data-icon="inline-start" />
              Yeni sənəd sətri
            </Button>
          </FormSection>
        </div>
      </div>

      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-[1.5rem] border border-[#dce6f4] bg-white/94 p-4 shadow-[0_18px_50px_rgba(29,78,216,0.12)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-[#5d6d91]">
          <CheckCircle2Icon className="text-[#13a56a]" />
          Zəruri profil və giriş sahələri * ilə işarələnib.
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="h-12 rounded-2xl border-[#dce6f4] bg-white px-6 text-sm font-bold text-[#34456c] transition hover:bg-[#f6f9ff] hover:text-[#0b66ff]"
            disabled={isPending}
            name="intent"
            type="submit"
            value="draft"
            variant="outline"
          >
            Qaralama saxla
          </Button>
          <Button
            className="h-12 rounded-2xl bg-[#0b66ff] px-6 text-sm font-bold shadow-[0_16px_34px_rgba(37,99,235,0.26)] hover:bg-[#075be8]"
            disabled={isPending}
            name="intent"
            type="submit"
            value="create"
          >
            {isPending ? "Saxlanılır..." : "Tələbə əlavə et"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function FormSection({
  children,
  description,
  icon: Icon,
  step,
  title,
}: {
  children: React.ReactNode;
  description: string;
  icon: LucideIcon;
  step: string;
  title: string;
}) {
  return (
    <FieldSet className="gap-5 rounded-[2rem] border border-[#dce6f4]/70 bg-white/82 p-6 shadow-[0_20px_50px_rgba(29,78,216,0.04)] backdrop-blur-md lg:p-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#0b66ff]/10 bg-[#e8f1ff] text-[#0b66ff]">
            <Icon />
          </div>
          <div className="min-w-0">
            <FieldLegend className="mb-0 text-lg font-black text-[#07183a]">
              {title}
            </FieldLegend>
            <FieldDescription className="mt-1 max-w-2xl text-sm leading-6 text-[#637392]">
              {description}
            </FieldDescription>
          </div>
        </div>
        <div className="flex h-10 w-fit items-center rounded-2xl border border-[#dce6f4] bg-white px-3 text-sm font-black text-[#0b66ff]">
          {step}
        </div>
      </div>
      <Separator className="bg-[#edf2f8]" />
      {children}
    </FieldSet>
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
    <Field className="gap-1.5">
      <FieldLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
        {required ? <span className="text-[#ef405d]">*</span> : null}
      </FieldLabel>
      {children}
      {error ? (
        <FieldDescription className="text-xs font-semibold text-red-600">
          {error}
        </FieldDescription>
      ) : null}
    </Field>
  );
}

function DateInputWithIcon({ name }: { name: string }) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openCalendar() {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
  }

  return (
    <InputGroup className="h-14 rounded-[1.35rem] border-[#dce6f4] bg-white/82 shadow-[0_4px_16px_rgba(15,23,42,0.02)] transition-all duration-300 hover:border-[#0b66ff]/30 focus-within:border-[#0b66ff] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0b66ff]/10">
      <InputGroupAddon>
        <CalendarDaysIcon className="size-4.5 text-[#0b66ff]" />
      </InputGroupAddon>
      <InputGroupInput
        className="text-sm font-bold text-[#07183a]"
        name={name}
        onClick={openCalendar}
        ref={inputRef}
        type="date"
      />
      <InputGroupAddon align="inline-end">
        <button
          aria-label="Təqvimi aç"
          className="flex size-9 items-center justify-center rounded-xl text-[#637392] transition hover:bg-[#eef5ff] hover:text-[#0b66ff]"
          onClick={openCalendar}
          type="button"
        >
          <CalendarDaysIcon className="size-4" />
        </button>
      </InputGroupAddon>
    </InputGroup>
  );
}

function InputWithIcon({
  icon: Icon,
  className,
  ...props
}: React.ComponentProps<"input"> & {
  icon: LucideIcon;
}) {
  return (
    <InputGroup className="h-14 rounded-[1.35rem] border-[#dce6f4] bg-white/82 shadow-[0_4px_16px_rgba(15,23,42,0.02)] transition-all duration-300 hover:border-[#0b66ff]/30 focus-within:border-[#0b66ff] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0b66ff]/10">
      <InputGroupAddon>
        <Icon className="size-4.5 text-[#0b66ff]" />
      </InputGroupAddon>
      <InputGroupInput
        {...props}
        className={cn("text-sm font-bold text-[#07183a]", className)}
      />
    </InputGroup>
  );
}

function ModernSelect({
  defaultValue,
  disabled,
  name,
  onValueChange,
  options,
  value,
}: {
  defaultValue: string;
  disabled?: boolean;
  name?: string;
  onValueChange?: (value: string) => void;
  options: readonly { label: string; value: string }[];
  value?: string;
}) {
  return (
    <Select
      defaultValue={defaultValue}
      disabled={disabled}
      name={name}
      onValueChange={onValueChange}
      value={value}
    >
      <SelectTrigger className="h-14 w-full rounded-[1.35rem] border-[#dce6f4] bg-white/82 px-4 text-sm font-bold text-[#07183a] shadow-[0_4px_16px_rgba(15,23,42,0.02)] transition-all duration-300 hover:border-[#0b66ff]/30 focus:border-[#0b66ff] focus:ring-4 focus:ring-[#0b66ff]/10">
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        align="start"
        className="rounded-[1.2rem] border-[#dce6f4] bg-white p-1 shadow-[0_24px_70px_rgba(15,23,42,0.16)]"
        position="popper"
      >
        <SelectGroup>
          {options.map((option) => (
            <SelectItem
              className="rounded-xl py-2.5 font-semibold text-[#24365f] focus:bg-[#eef5ff] focus:text-[#0b66ff]"
              key={option.value}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function ChoiceGroup({
  label,
  name,
  onChange,
  options,
  value,
}: {
  label: string;
  name: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <Field className="gap-1.5">
      <FieldLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </FieldLabel>
      <div className="grid h-14 grid-cols-2 gap-2 rounded-[1.35rem] border border-[#dce6f4] bg-[#f8fbff] p-1.5 shadow-[0_4px_16px_rgba(15,23,42,0.02)]">
        {options.map((option) => (
          <label className="min-w-0" key={option.value}>
            <input
              checked={value === option.value}
              className="peer sr-only"
              name={name}
              onChange={() => onChange(option.value)}
              type="radio"
              value={option.value}
            />
            <span className="flex h-full items-center justify-center rounded-[1rem] px-3 text-sm font-black text-[#637392] transition peer-checked:bg-white peer-checked:text-[#0b66ff] peer-checked:shadow-[0_8px_20px_rgba(29,78,216,0.08)]">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </Field>
  );
}
