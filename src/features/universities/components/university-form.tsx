"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import {
  Building2Icon,
  CalendarDaysIcon,
  ChevronDownIcon,
  CheckCircle2Icon,
  Globe2Icon,
  GraduationCapIcon,
  ImageIcon,
  LanguagesIcon,
  MailIcon,
  MapPinIcon,
  NewspaperIcon,
  NotebookTextIcon,
  PhoneIcon,
  SearchIcon,
  ShieldCheckIcon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
  AGREEMENT_STATUSES,
  ENTITY_STATUSES,
  PARTNERSHIP_STATUSES,
  SCHOOL_TYPES,
} from "@/features/universities/constants";
import {
  type ActionState,
  createUniversityAction,
  updateUniversityAction,
} from "@/features/universities/actions";
import type { UniversityCreateOptions } from "@/features/universities/data/create-options";
import {
  inferTurkeyUniversityCity,
  mergeTurkeyUniversityOptions,
  searchTurkeyUniversities,
  TURKEY_UNIVERSITY_OPTIONS,
  type TurkeyUniversityOption,
} from "@/features/universities/data/turkey-universities";
import { cn } from "@/lib/utils";

const UNIVERSITY_OPTION_LABELS: Record<string, string> = {
  ACTIVE: "Aktiv",
  ACTIVE_PARTNER: "Aktiv tərəfdaş",
  AGREEMENT_PENDING: "Müqavilə gözləyir",
  ARCHIVED: "Arxiv",
  COLLEGE: "Kollec",
  EXPIRED: "Müddəti bitib",
  FOUNDATION: "Vəqf universiteti",
  INACTIVE: "Qeyri-aktiv",
  LANGUAGE_SCHOOL: "Dil məktəbi",
  NONE: "Yoxdur",
  OTHER: "Digər",
  PENDING: "Gözləmədə",
  PRIVATE: "Özəl",
  PROSPECT: "Potensial tərəfdaş",
  PUBLIC: "Dövlət",
  PUBLIC_PRIVATE: "Dövlət-özəl",
  SUSPENDED: "Dayandırılıb",
};

const COUNTRY_CODES = [
  "AD",
  "AE",
  "AF",
  "AG",
  "AI",
  "AL",
  "AM",
  "AO",
  "AQ",
  "AR",
  "AS",
  "AT",
  "AU",
  "AW",
  "AX",
  "AZ",
  "BA",
  "BB",
  "BD",
  "BE",
  "BF",
  "BG",
  "BH",
  "BI",
  "BJ",
  "BL",
  "BM",
  "BN",
  "BO",
  "BQ",
  "BR",
  "BS",
  "BT",
  "BV",
  "BW",
  "BY",
  "BZ",
  "CA",
  "CC",
  "CD",
  "CF",
  "CG",
  "CH",
  "CI",
  "CK",
  "CL",
  "CM",
  "CN",
  "CO",
  "CR",
  "CU",
  "CV",
  "CW",
  "CX",
  "CY",
  "CZ",
  "DE",
  "DJ",
  "DK",
  "DM",
  "DO",
  "DZ",
  "EC",
  "EE",
  "EG",
  "EH",
  "ER",
  "ES",
  "ET",
  "FI",
  "FJ",
  "FK",
  "FM",
  "FO",
  "FR",
  "GA",
  "GB",
  "GD",
  "GE",
  "GF",
  "GG",
  "GH",
  "GI",
  "GL",
  "GM",
  "GN",
  "GP",
  "GQ",
  "GR",
  "GS",
  "GT",
  "GU",
  "GW",
  "GY",
  "HK",
  "HM",
  "HN",
  "HR",
  "HT",
  "HU",
  "ID",
  "IE",
  "IL",
  "IM",
  "IN",
  "IO",
  "IQ",
  "IR",
  "IS",
  "IT",
  "JE",
  "JM",
  "JO",
  "JP",
  "KE",
  "KG",
  "KH",
  "KI",
  "KM",
  "KN",
  "KP",
  "KR",
  "KW",
  "KY",
  "KZ",
  "LA",
  "LB",
  "LC",
  "LI",
  "LK",
  "LR",
  "LS",
  "LT",
  "LU",
  "LV",
  "LY",
  "MA",
  "MC",
  "MD",
  "ME",
  "MF",
  "MG",
  "MH",
  "MK",
  "ML",
  "MM",
  "MN",
  "MO",
  "MP",
  "MQ",
  "MR",
  "MS",
  "MT",
  "MU",
  "MV",
  "MW",
  "MX",
  "MY",
  "MZ",
  "NA",
  "NC",
  "NE",
  "NF",
  "NG",
  "NI",
  "NL",
  "NO",
  "NP",
  "NR",
  "NU",
  "NZ",
  "OM",
  "PA",
  "PE",
  "PF",
  "PG",
  "PH",
  "PK",
  "PL",
  "PM",
  "PN",
  "PR",
  "PS",
  "PT",
  "PW",
  "PY",
  "QA",
  "RE",
  "RO",
  "RS",
  "RU",
  "RW",
  "SA",
  "SB",
  "SC",
  "SD",
  "SE",
  "SG",
  "SH",
  "SI",
  "SJ",
  "SK",
  "SL",
  "SM",
  "SN",
  "SO",
  "SR",
  "SS",
  "ST",
  "SV",
  "SX",
  "SY",
  "SZ",
  "TC",
  "TD",
  "TF",
  "TG",
  "TH",
  "TJ",
  "TK",
  "TL",
  "TM",
  "TN",
  "TO",
  "TR",
  "TT",
  "TV",
  "TW",
  "TZ",
  "UA",
  "UG",
  "UM",
  "US",
  "UY",
  "UZ",
  "VA",
  "VC",
  "VE",
  "VG",
  "VI",
  "VN",
  "VU",
  "WF",
  "WS",
  "YE",
  "YT",
  "ZA",
  "ZM",
  "ZW",
] as const;

const countryDisplayNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["az"], { type: "region" })
    : null;

const COUNTRY_OPTIONS = COUNTRY_CODES.map((code) => ({
  code,
  label: countryDisplayNames?.of(code) ?? code,
})).sort((left, right) => left.label.localeCompare(right.label, "az"));

export type UniversityFormValues = {
  id?: string;
  name?: string;
  logoAccessUrl?: string | null;
  logoUrl?: string | null;
  country?: string;
  city?: string;
  website?: string | null;
  newsSourceUrl?: string | null;
  schoolType?: string;
  partnershipStatus?: string;
  agreementStatus?: string | null;
  mainEmail?: string | null;
  mainPhone?: string | null;
  internalNotes?: string | null;
  defaultCurrency?: string | null;
  defaultEducationLanguageId?: string | null;
  defaultEducationLevelId?: string | null;
  defaultPeriodId?: string | null;
  status?: string;
};

const initialActionState: ActionState = { status: "idle" };

export function UniversityForm({
  mode = "create",
  values,
  submitLabel,
  setupOptions,
  variant = "compact",
}: {
  mode?: "create" | "update";
  values?: UniversityFormValues;
  submitLabel?: string;
  setupOptions?: UniversityCreateOptions;
  variant?: "compact" | "page";
}) {
  const action =
    mode === "update" ? updateUniversityAction : createUniversityAction;
  const [state, formAction, isPending] = useActionState(
    action,
    initialActionState,
  );
  const isPage = variant === "page";
  const [universityName, setUniversityName] = useState(values?.name ?? "");
  const [country, setCountry] = useState(
    values?.country ?? (isPage ? "Türkiyə" : ""),
  );
  const [city, setCity] = useState(values?.city ?? "");
  const [website, setVebsayt] = useState(values?.website ?? "");
  const [newsSourceUrl, setNewsSourceUrl] = useState(
    values?.newsSourceUrl ?? "",
  );
  const [logoUrl, setLogoUrl] = useState(values?.logoUrl ?? "");
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(
    values?.logoAccessUrl ??
      (values?.logoUrl?.startsWith("http") ? values.logoUrl : ""),
  );
  const [logoUploadError, setLogoUploadError] = useState("");
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [universitySuggestions, setUniversitySuggestions] = useState<
    TurkeyUniversityOption[]
  >([]);
  const [showUniversitySuggestions, setShowUniversitySuggestions] =
    useState(false);
  const initialPeriodIds = [
    values?.defaultPeriodId ?? setupOptions?.periods[0]?.id ?? "__manual__",
  ].filter(Boolean);
  const initialEducationLevelIds = [
    values?.defaultEducationLevelId ??
      setupOptions?.educationLevels[0]?.id ??
      "__manual__",
  ].filter(Boolean);
  const initialEducationLanguageIds = [
    values?.defaultEducationLanguageId ??
      setupOptions?.educationLanguages[0]?.id ??
      "__manual__",
  ].filter(Boolean);
  const [selectedPeriodIds, setSelectedPeriodIds] = useState(initialPeriodIds);
  const [selectedEducationLevelIds, setSelectedEducationLevelIds] = useState(
    initialEducationLevelIds,
  );
  const [selectedEducationLanguageIds, setSelectedEducationLanguageIds] =
    useState(initialEducationLanguageIds);
  const [selectedCurrencies, setSelectedCurrencies] = useState(
    [values?.defaultCurrency ?? "TRY"].filter(Boolean),
  );
  const showSetupSection = isPage && setupOptions;
  const typedUniversityName = universityName.trim();
  const showUniversityPicker =
    isPage && showUniversitySuggestions && universitySuggestions.length > 0;
  const periodOptions = useMemo(
    () =>
      setupOptions?.periods.map((period) => ({
        description: `${period.year} / ${period.season}`,
        label: period.name,
        value: period.id,
      })) ?? [],
    [setupOptions?.periods],
  );

  useEffect(() => {
    if (!isPage || universityName.trim().length < 2) {
      return;
    }

    const localMatches = searchTurkeyUniversities(universityName);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/universities/turkey?search=${encodeURIComponent(
            universityName,
          )}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as {
          universities?: TurkeyUniversityOption[];
        };
        setUniversitySuggestions(
          mergeTurkeyUniversityOptions(
            payload.universities ?? [],
            localMatches,
          ),
        );
      } catch {
        if (!controller.signal.aborted) {
          setUniversitySuggestions(localMatches);
        }
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [isPage, universityName]);

  return (
    <form
      action={formAction}
      className={cn("flex flex-col", isPage ? "gap-6" : "gap-5")}
    >
      {values?.id ? <input name="id" type="hidden" value={values.id} /> : null}

      {state.status === "error" ? (
        <div className="rounded-[1.35rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.message}
        </div>
      ) : null}

      <div
        className={cn(
          "grid",
          isPage
            ? "gap-6 2xl:grid-cols-[minmax(0,1.2fr)_430px]"
            : "gap-4 xl:grid-cols-[1.08fr_0.92fr]",
        )}
      >
        <FormPanel
          className={isPage ? "relative z-20" : undefined}
          description="Komandanızın bu universiteti tanımaq və onunla işləmək üçün istifadə etdiyi əsas məlumatlar."
          icon={Building2Icon}
          roomy={isPage}
          title="Universitet detalları"
        >
          <FieldGroup className="gap-4">
            <div
              className={cn(
                "grid grid-cols-1 gap-4",
                isPage ? "lg:grid-cols-3" : "md:grid-cols-3",
              )}
            >
              <FormField
                error={state.fieldErrors?.name?.[0]}
                label={isPage ? "İctimai universitet adı" : "Universitet adı"}
                className={cn(
                  "relative",
                  isPage ? "lg:col-span-2" : "md:col-span-2",
                )}
              >
                <InputWithIcon
                  icon={Building2Icon}
                  name="name"
                  required
                  value={universityName}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setUniversityName(nextValue);
                    if (nextValue.trim().length < 1) {
                      setUniversitySuggestions(TURKEY_UNIVERSITY_OPTIONS);
                    } else if (isPage) {
                      setUniversitySuggestions(
                        searchTurkeyUniversities(nextValue),
                      );
                    }
                    setShowUniversitySuggestions(true);
                  }}
                  onFocus={() => {
                    if (isPage && universitySuggestions.length === 0) {
                      setUniversitySuggestions(TURKEY_UNIVERSITY_OPTIONS);
                    }
                    setShowUniversitySuggestions(true);
                  }}
                  placeholder="İstanbul Texniki Universiteti"
                  roomy={isPage}
                />
                {showUniversityPicker ? (
                  <div className="erp-select-scroll absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 max-h-[18rem] overflow-y-auto rounded-[1.35rem] border border-[#c9daf5] bg-white p-2 pr-3 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                    {universitySuggestions.map((university) => (
                      <button
                        className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-[#eef5ff]"
                        key={`${university.name}-${university.domain}`}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setUniversityName(university.name);
                          setCountry("Türkiyə");
                          setCity(
                            university.city ??
                              inferTurkeyUniversityCity(university.name),
                          );
                          setVebsayt(university.website);
                          setShowUniversitySuggestions(false);
                        }}
                        type="button"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#e8f1ff] text-[#0b66ff]">
                          <SearchIcon />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-bold text-[#07183a]">
                            {university.name}
                          </span>
                          <span className="mt-1 block truncate text-xs text-[#637392]">
                            {university.domain || university.website}
                          </span>
                        </span>
                      </button>
                    ))}
                    {typedUniversityName.length > 0 ? (
                      <button
                        className="mt-1 flex w-full items-center gap-3 rounded-2xl border border-dashed border-[#b8cced] bg-[#f7fbff] px-3 py-3 text-left transition hover:border-[#0b66ff]/40 hover:bg-[#eef5ff]"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setUniversityName(typedUniversityName);
                          setShowUniversitySuggestions(false);
                        }}
                        type="button"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0b66ff] shadow-sm">
                          <Building2Icon />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-bold text-[#07183a]">
                            Bu adı istifadı et
                          </span>
                          <span className="mt-1 block truncate text-xs text-[#637392]">
                            {typedUniversityName}
                          </span>
                        </span>
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </FormField>

              <FormField
                error={state.fieldErrors?.logoUrl?.[0]}
                label="Logo"
                className={isPage ? "lg:col-span-1" : "md:col-span-1"}
              >
                <LogoUploadField
                  error={logoUploadError}
                  isUploading={isLogoUploading}
                  logoUrl={logoUrl}
                  onClear={() => {
                    setLogoUrl("");
                    setLogoPreviewUrl("");
                    setLogoUploadError("");
                  }}
                  onUpload={async (file) => {
                    setLogoUploadError("");
                    setIsLogoUploading(true);

                    try {
                      const payload = await uploadLogo(file);
                      setLogoUrl(payload.fileUrl);
                      setLogoPreviewUrl(payload.accessUrl ?? "");
                    } catch (error) {
                      setLogoUploadError(
                        error instanceof Error
                          ? error.message
                          : "Logo yüklənə bilmədi.",
                      );
                    } finally {
                      setIsLogoUploading(false);
                    }
                  }}
                  previewUrl={logoPreviewUrl}
                />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField error={state.fieldErrors?.country?.[0]} label="Ölkə">
                <CountrySelectField
                  name="country"
                  onChange={setCountry}
                  placeholder="Türkiyə"
                  required
                  roomy={isPage}
                  value={country}
                />
              </FormField>

              <FormField error={state.fieldErrors?.city?.[0]} label="Şəhər">
                <InputWithIcon
                  icon={MapPinIcon}
                  name="city"
                  required
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Istanbul"
                  roomy={isPage}
                />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                error={state.fieldErrors?.website?.[0]}
                label="Vebsayt"
              >
                <InputWithIcon
                  icon={Globe2Icon}
                  name="website"
                  value={website}
                  onChange={(event) => setVebsayt(event.target.value)}
                  placeholder="https://itu.edu.tr"
                  roomy={isPage}
                />
              </FormField>

              <FormField
                error={state.fieldErrors?.newsSourceUrl?.[0]}
                label="Xəbər mənbə URL-i"
              >
                <InputWithIcon
                  icon={NewspaperIcon}
                  name="newsSourceUrl"
                  value={newsSourceUrl}
                  onChange={(event) => setNewsSourceUrl(event.target.value)}
                  placeholder="https://itu.edu.tr/news"
                  roomy={isPage}
                />
              </FormField>
            </div>
          </FieldGroup>
        </FormPanel>

        <FormPanel
          description="Daha çox detal əlavə etməzdən əvvəl cari əlaqə və müqavilə mərhələsini təyin edin."
          icon={ShieldCheckIcon}
          roomy={isPage}
          title="Tərəfdaşlıq qurulumu"
        >
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <FormField label="Məktəb tipi">
                <ModernSelect
                  defaultValue={values?.schoolType ?? "PUBLIC"}
                  name="schoolType"
                  options={SCHOOL_TYPES}
                  roomy={isPage}
                />
              </FormField>

              <FormField label="Tərəfdaşlıq statusu">
                <ModernSelect
                  defaultValue={values?.partnershipStatus ?? "PROSPECT"}
                  name="partnershipStatus"
                  options={PARTNERSHIP_STATUSES}
                  roomy={isPage}
                />
              </FormField>

              <FormField label="Müqavilə statusu">
                <ModernSelect
                  defaultValue={values?.agreementStatus ?? "NONE"}
                  name="agreementStatus"
                  options={AGREEMENT_STATUSES}
                  roomy={isPage}
                />
              </FormField>

              <FormField label="Qeyd statusu">
                <ModernSelect
                  defaultValue={values?.status ?? "ACTIVE"}
                  name="status"
                  options={ENTITY_STATUSES}
                  roomy={isPage}
                />
              </FormField>
            </div>
          </FieldGroup>
        </FormPanel>
      </div>

      {showSetupSection ? (
        <FormPanel
          description="Komandanızın sonradan proqram, qəbul dövrü və qiymət əlavə edərkən görəcəyi standartları seçin."
          icon={GraduationCapIcon}
          roomy
          title="Akademik standartlar"
        >
          <FieldGroup className="gap-5">
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
              <FormField
                error={state.fieldErrors?.defaultPeriodId?.[0]}
                label="Dönəm"
              >
                <SetupMultiSelect
                  defaultName="defaultPeriodId"
                  hiddenName="periodIds"
                  manualLabel="Yeni dönəm əlavə et"
                  onChange={setSelectedPeriodIds}
                  options={periodOptions}
                  placeholder="Dönəm seçin"
                  values={selectedPeriodIds}
                />
              </FormField>

              <FormField
                error={state.fieldErrors?.defaultEducationLevelId?.[0]}
                label="Təhsil pilləsi"
              >
                <SetupMultiSelect
                  defaultName="defaultEducationLevelId"
                  hiddenName="educationLevelIds"
                  manualLabel="Yeni pillə əlavə et"
                  onChange={setSelectedEducationLevelIds}
                  options={setupOptions.educationLevels.map((level) => ({
                    label: level.name,
                    value: level.id,
                  }))}
                  placeholder="Pillə seçin"
                  values={selectedEducationLevelIds}
                />
              </FormField>

              <FormField
                error={state.fieldErrors?.defaultEducationLanguageId?.[0]}
                label="Təhsil dili"
              >
                <SetupMultiSelect
                  defaultName="defaultEducationLanguageId"
                  hiddenName="educationLanguageIds"
                  manualLabel="Yeni dil əlavə et"
                  onChange={setSelectedEducationLanguageIds}
                  options={setupOptions.educationLanguages.map((language) => ({
                    label: language.name,
                    value: language.id,
                  }))}
                  placeholder="Dil seçin"
                  values={selectedEducationLanguageIds}
                />
              </FormField>

              <FormField
                error={state.fieldErrors?.defaultCurrency?.[0]}
                label="Currency"
              >
                <SetupMultiSelect
                  defaultName="defaultCurrency"
                  hideManual
                  hiddenName="currencies"
                  onChange={setSelectedCurrencies}
                  options={setupOptions.currencies.map((currency) => ({
                    label: currency,
                    value: currency,
                  }))}
                  placeholder="Valyuta seçin"
                  values={selectedCurrencies}
                />
              </FormField>
            </div>

            {selectedPeriodIds.includes("__manual__") ? (
              <div className="grid gap-4 rounded-[1.35rem] border border-[#dce6f4] bg-[#f8fbff] p-4 md:grid-cols-2 xl:grid-cols-5">
                <FormField label="Dönəm adı">
                  <InputWithIcon
                    icon={CalendarDaysIcon}
                    name="manualPeriodName"
                    placeholder="2027 Payız"
                    roomy
                  />
                </FormField>
                <FormField label="İl">
                  <InputWithIcon
                    icon={CalendarDaysIcon}
                    name="manualPeriodYear"
                    placeholder="2027"
                    roomy
                    type="number"
                  />
                </FormField>
                <FormField label="Season">
                  <InputWithIcon
                    icon={CalendarDaysIcon}
                    name="manualPeriodSeason"
                    placeholder="Payız"
                    roomy
                  />
                </FormField>
                <FormField label="Baİlama tarixi">
                  <InputWithIcon
                    icon={CalendarDaysIcon}
                    name="manualPeriodStartDate"
                    roomy
                    type="date"
                  />
                </FormField>
                <FormField label="Deadline">
                  <InputWithIcon
                    icon={CalendarDaysIcon}
                    name="manualPeriodDeadline"
                    roomy
                    type="date"
                  />
                </FormField>
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-2">
              {selectedEducationLevelIds.includes("__manual__") ? (
                <FormField label="Yeni pillə adı">
                  <InputWithIcon
                    icon={GraduationCapIcon}
                    name="manualEducationLevelName"
                    placeholder="Ön lisans"
                    roomy
                  />
                </FormField>
              ) : null}

              {selectedEducationLanguageIds.includes("__manual__") ? (
                <FormField label="Yeni dil adı">
                  <InputWithIcon
                    icon={LanguagesIcon}
                    name="manualEducationLanguageName"
                    placeholder="Fransızca"
                    roomy
                  />
                </FormField>
              ) : null}
            </div>
          </FieldGroup>
        </FormPanel>
      ) : null}

      <div
        className={cn(
          "grid",
          isPage
            ? "gap-6 lg:grid-cols-[minmax(360px,0.82fr)_minmax(0,1.18fr)]"
            : "gap-4 xl:grid-cols-[0.88fr_1.12fr]",
        )}
      >
        <FormPanel
          description="Sürətli follow-up üçün Əsas inbox və telefon nömrəsini əlavə edin."
          icon={MailIcon}
          roomy={isPage}
          title="Əlaqə detalları"
        >
          <FieldGroup className="gap-4">
            <FormField
              error={state.fieldErrors?.mainEmail?.[0]}
              label="Əsas e-poçt"
            >
              <InputWithIcon
                icon={MailIcon}
                name="mainEmail"
                type="email"
                defaultValue={values?.mainEmail ?? ""}
                placeholder="international@university.edu"
                roomy={isPage}
              />
            </FormField>

            <FormField label="Əsas telefon">
              <InputWithIcon
                icon={PhoneIcon}
                name="mainPhone"
                defaultValue={values?.mainPhone ?? ""}
                placeholder="+61..."
                roomy={isPage}
              />
            </FormField>
          </FieldGroup>
        </FormPanel>

        <FormPanel
          description="Prioritetlər, tələblər və ya izləmə xatırlatmaları üçün məxfi qeydlər."
          icon={NotebookTextIcon}
          roomy={isPage}
          title="Komanda qeydləri"
        >
          <FormField label="Komanda qeydləri">
            <Textarea
              name="internalNotes"
              defaultValue={values?.internalNotes ?? ""}
              className={cn(
                "resize-none rounded-[1.5rem] border-[#dce6f4] bg-white/80 p-4 text-sm shadow-[0_4px_16px_rgba(15,23,42,0.02)] transition-all duration-300 hover:border-[#0b66ff]/30 focus-visible:border-[#0b66ff] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#0b66ff]/10 focus-visible:ring-offset-0 outline-none",
                isPage ? "min-h-52" : "min-h-40",
              )}
              placeholder="Komandanız üçün faydalı qeydlər..."
            />
          </FormField>
        </FormPanel>
      </div>

      <div
        className={cn(
          "sticky flex flex-col gap-3 bg-white/92 backdrop-blur sm:flex-row sm:items-center sm:justify-between",
          isPage
            ? "bottom-4 rounded-[1.5rem] border border-[#dce6f4] p-4 shadow-[0_18px_50px_rgba(29,78,216,0.10)]"
            : "bottom-0 -mx-1 border-t border-[#edf2f8] px-1 pt-4",
        )}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-[#5d6d91]">
          <CheckCircle2Icon className="text-[#129344]" />
          Əsas sahələr tamamlananda saxlanmağa hazırdır.
        </div>
        <Button
          className="h-12 rounded-2xl bg-[#0b66ff] px-6 text-sm font-bold shadow-[0_16px_34px_rgba(37,99,235,0.26)] hover:bg-[#075be8]"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Saxlanılır..." : (submitLabel ?? "Universiteti saxla")}
        </Button>
      </div>
    </form>
  );
}

function FormPanel({
  children,
  className,
  description,
  icon: Icon,
  roomy = false,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  description: string;
  icon: typeof Building2Icon;
  roomy?: boolean;
  title: string;
}) {
  return (
    <FieldSet
      className={cn(
        "gap-5 rounded-[2rem] border border-[#dce6f4]/60 bg-white/70 shadow-[0_20px_50px_rgba(29,78,216,0.03)] backdrop-blur-md",
        roomy ? "p-6 lg:p-7" : "p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            "flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#0b66ff]/10 to-[#0b66ff]/5 text-[#0b66ff] border border-[#0b66ff]/10 shrink-0",
            roomy ? "size-12" : "size-10",
          )}
        >
          <Icon className={roomy ? "size-5" : "size-4.5"} />
        </div>
        <div className="min-w-0">
          <FieldSet>
            <FieldLegend className="mb-0 text-base font-black text-[#07183a]">
              {title}
            </FieldLegend>
            <FieldDescription
              className={cn(
                "mt-1 max-w-xl leading-relaxed text-[#637392]",
                roomy ? "text-sm" : "text-xs",
              )}
            >
              {description}
            </FieldDescription>
          </FieldSet>
        </div>
      </div>
      <Separator className="bg-[#edf2f8]" />
      {children}
    </FieldSet>
  );
}

function FormField({
  children,
  className,
  error,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  error?: string;
  label: string;
}) {
  return (
    <Field data-invalid={Boolean(error)} className={cn("gap-1.5", className)}>
      <FieldLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </FieldLabel>
      {children}
      <FieldError>{error}</FieldError>
    </Field>
  );
}

function InputWithIcon({
  icon: Icon,
  className,
  roomy = false,
  ...props
}: React.ComponentProps<typeof Input> & {
  icon: typeof Building2Icon;
  roomy?: boolean;
}) {
  return (
    <InputGroup
      className={cn(
        "rounded-[1.35rem] border-[#dce6f4] bg-white/80 shadow-[0_4px_16px_rgba(15,23,42,0.02)] transition-all duration-300 hover:border-[#0b66ff]/30 focus-within:border-[#0b66ff] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0b66ff]/10",
        roomy ? "h-14" : "h-12",
      )}
    >
      <InputGroupAddon>
        <Icon className="text-[#0b66ff] size-4.5" />
      </InputGroupAddon>
      <InputGroupInput
        {...props}
        className={cn("text-sm font-bold text-[#07183a]", className)}
      />
    </InputGroup>
  );
}

function CountrySelectField({
  name,
  onChange,
  placeholder,
  required,
  roomy = false,
  value,
}: {
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  roomy?: boolean;
  value: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedQuery = normalizeCountrySearch(searchQuery);
  const filteredCountries = useMemo(() => {
    if (!normalizedQuery) {
      return COUNTRY_OPTIONS;
    }

    return COUNTRY_OPTIONS.filter((country) =>
      normalizeCountrySearch(`${country.label} ${country.code}`).includes(
        normalizedQuery,
      ),
    );
  }, [normalizedQuery]);

  return (
    <div className="relative">
      <InputGroup
        className={cn(
          "rounded-[1.35rem] border-[#dce6f4] bg-white/80 shadow-[0_4px_16px_rgba(15,23,42,0.02)] transition-all duration-300 hover:border-[#0b66ff]/30 focus-within:border-[#0b66ff] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0b66ff]/10",
          roomy ? "h-14" : "h-12",
        )}
      >
        <InputGroupAddon>
          <MapPinIcon className="text-[#0b66ff] size-4.5" />
        </InputGroupAddon>
        <InputGroupInput
          autoComplete="off"
          name={name}
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 120);
          }}
          onChange={(event) => {
            onChange(event.target.value);
            setSearchQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setSearchQuery("");
            setIsOpen(true);
          }}
          placeholder={placeholder}
          required={required}
          value={value}
          className="text-sm font-bold text-[#07183a]"
        />
        <InputGroupAddon>
          <button
            aria-label="Ölkə siyahısını aç"
            className="flex size-8 items-center justify-center rounded-xl text-[#52617f] transition hover:bg-[#eef5ff] hover:text-[#0b66ff]"
            onMouseDown={(event) => {
              event.preventDefault();
              setSearchQuery("");
              setIsOpen((current) => !current);
            }}
            type="button"
          >
            <ChevronDownIcon
              className={cn(
                "size-4 transition duration-200",
                isOpen && "rotate-180",
              )}
            />
          </button>
        </InputGroupAddon>
      </InputGroup>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-[1.1rem] border border-[#dce6f4] bg-white shadow-[0_18px_44px_rgba(15,23,42,0.14)]">
          <div className="max-h-72 overflow-y-auto p-1.5">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#f4f8ff]",
                    country.label === value && "bg-[#eef5ff]",
                  )}
                  key={country.code}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onChange(country.label);
                    setSearchQuery("");
                    setIsOpen(false);
                  }}
                  type="button"
                >
                  <span
                    aria-hidden
                    className="h-[18px] w-6 shrink-0 rounded-[5px] border border-[#dce6f4] bg-cover bg-center bg-no-repeat shadow-sm"
                    style={{
                      backgroundImage: `url("https://flagcdn.com/${country.code.toLowerCase()}.svg")`,
                    }}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#102246]">
                    {country.label}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#8a97b3]">
                    {country.code}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm font-semibold text-[#637392]">
                Uyğun ölkə tapılmadı.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function normalizeCountrySearch(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("az")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("ə", "e")
    .replaceAll("ı", "i")
    .replaceAll("ö", "o")
    .replaceAll("ü", "u")
    .replaceAll("ğ", "g")
    .replaceAll("ş", "s")
    .replaceAll("ç", "c");
}

function LogoUploadField({
  error,
  isUploading,
  logoUrl,
  onClear,
  onUpload,
  previewUrl,
}: {
  error: string;
  isUploading: boolean;
  logoUrl: string;
  onClear: () => void;
  onUpload: (file: File) => Promise<void>;
  previewUrl: string;
}) {
  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    await onUpload(file);
  }

  return (
    <div className="space-y-2">
      <input name="logoUrl" type="hidden" value={logoUrl} />
      <div className="flex min-h-14 items-center gap-3 rounded-[1.35rem] border border-[#dce6f4] bg-white/80 px-3 py-2 shadow-[0_4px_16px_rgba(15,23,42,0.02)] transition-all duration-300 hover:border-[#0b66ff]/30">
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#e8f1ff] text-[#0b66ff] ring-1 ring-[#dce6f4]">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="size-full object-cover" src={previewUrl} />
          ) : (
            <ImageIcon />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-[#07183a]">
            {logoUrl ? "Logo yüklənib" : "Logo yüklə"}
          </div>
          <div className="truncate text-xs font-medium text-[#71809f]">
            PNG, JPG və ya WebP
          </div>
        </div>
        {logoUrl ? (
          <button
            aria-label="Logonu sil"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#dce6f4] bg-white text-[#637392] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            onClick={onClear}
            type="button"
          >
            <XIcon />
          </button>
        ) : null}
        <label className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#0b66ff] text-white shadow-[0_10px_24px_rgba(11,102,255,0.24)] transition hover:bg-[#075be8]">
          <UploadCloudIcon />
          <input
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={isUploading}
            onChange={handleChange}
            type="file"
          />
        </label>
      </div>
      {isUploading ? (
        <p className="text-xs font-semibold text-[#0b66ff]">Logo yüklənir...</p>
      ) : null}
      {error ? (
        <p className="text-xs font-semibold text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

function SetupMultiSelect({
  defaultName,
  hideManual = false,
  hiddenName,
  manualLabel = "Yenisini əlavə et",
  onChange,
  options,
  placeholder,
  values,
}: {
  defaultName: string;
  hideManual?: boolean;
  hiddenName: string;
  manualLabel?: string;
  onChange: (values: string[]) => void;
  options: Array<{ description?: string; label: string; value: string }>;
  placeholder: string;
  values: string[];
}) {
  const selectedValues = values.length > 0 ? values : [];
  const allOptions = hideManual
    ? options
    : [...options, { label: manualLabel, value: "__manual__" }];
  const selectedOptions = selectedValues.map((value) => {
    const option = allOptions.find((item) => item.value === value);
    return option ?? { label: value, value };
  });
  const availableOptions = allOptions.filter(
    (option) => !selectedValues.includes(option.value),
  );

  function addValue(nextValue: string) {
    if (selectedValues.includes(nextValue)) {
      return;
    }

    onChange([...selectedValues, nextValue]);
  }

  function removeValue(nextValue: string) {
    onChange(selectedValues.filter((value) => value !== nextValue));
  }

  return (
    <div className="space-y-2">
      {selectedValues[0] ? (
        <input name={defaultName} type="hidden" value={selectedValues[0]} />
      ) : null}
      {selectedValues.map((value) => (
        <input key={value} name={hiddenName} type="hidden" value={value} />
      ))}
      <Select
        key={selectedValues.join("|") || "empty"}
        onValueChange={addValue}
      >
        <SelectTrigger className="h-14 w-full rounded-[1.35rem] border-[#dce6f4] bg-white/80 px-4 text-sm font-bold text-[#07183a] shadow-[0_4px_16px_rgba(15,23,42,0.02)] transition-all duration-300 hover:border-[#0b66ff]/30 focus:border-[#0b66ff] focus:ring-4 focus:ring-[#0b66ff]/10">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          align="start"
          className="max-h-72 rounded-[1.2rem] border-[#dce6f4] bg-white p-1 shadow-[0_24px_70px_rgba(15,23,42,0.16)]"
          position="popper"
        >
          <SelectGroup>
            {availableOptions.length > 0 ? (
              availableOptions.map((option) => (
                <SelectItem
                  className="rounded-xl py-2.5 font-semibold text-[#24365f] focus:bg-[#eef5ff] focus:text-[#0b66ff]"
                  key={option.value}
                  value={option.value}
                >
                  <span className="flex flex-col gap-0.5">
                    <span>{option.label}</span>
                    {option.description ? (
                      <span className="text-xs font-medium text-[#71809f]">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                </SelectItem>
              ))
            ) : (
              <SelectItem disabled value="__empty">
                Bütün seçimlər əlavə olunub
              </SelectItem>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
      {selectedOptions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option, index) => (
            <span
              className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#dce6f4] bg-[#f8fbff] px-3 py-1 text-xs font-bold text-[#24365f]"
              key={option.value}
            >
              {index === 0 ? (
                <CheckCircle2Icon className="size-3.5 text-[#129344]" />
              ) : null}
              {option.label}
              <button
                aria-label={`${option.label} sil`}
                className="rounded-full text-[#71809f] transition hover:text-red-600"
                onClick={() => removeValue(option.value)}
                type="button"
              >
                <XIcon className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs font-semibold text-[#71809f]">
          Ən azı bir seçim əlavə edin.
        </p>
      )}
      {selectedOptions[0] ? (
        <p className="text-[11px] font-semibold text-[#71809f]">
          İlk seçim standart olaraq saxlanacaq.
        </p>
      ) : null}
    </div>
  );
}

function ModernSelect({
  defaultValue,
  name,
  options,
  roomy = false,
}: {
  defaultValue: string;
  name: string;
  options: readonly string[];
  roomy?: boolean;
}) {
  return (
    <Select defaultValue={defaultValue} name={name}>
      <SelectTrigger
        className={cn(
          "w-full rounded-[1.35rem] border-[#dce6f4] bg-white/80 px-4 text-sm font-bold text-[#07183a] shadow-[0_4px_16px_rgba(15,23,42,0.02)] transition-all duration-300 hover:border-[#0b66ff]/30 focus:border-[#0b66ff] focus:ring-4 focus:ring-[#0b66ff]/10",
          roomy ? "h-14" : "h-12",
        )}
      >
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
              key={option}
              value={option}
              className="rounded-xl py-2 font-semibold text-[#24365f] focus:bg-[#eef5ff] focus:text-[#0b66ff]"
            >
              {formatOption(option)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function formatOption(value: string) {
  if (UNIVERSITY_OPTION_LABELS[value]) {
    return UNIVERSITY_OPTION_LABELS[value];
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function uploadLogo(file: File) {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch("/api/universities/logo", {
    body: formData,
    method: "POST",
  });
  const payload = (await response.json()) as {
    accessUrl?: string | null;
    fileUrl?: string;
    message?: string;
  };

  if (!response.ok || !payload.fileUrl) {
    throw new Error(payload.message ?? "Logo yüklənə bilmədi.");
  }

  return {
    accessUrl: payload.accessUrl ?? null,
    fileUrl: payload.fileUrl,
  };
}
