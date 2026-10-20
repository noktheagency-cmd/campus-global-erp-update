"use client";

import { useActionState, useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  AtomIcon,
  BookOpenIcon,
  Building2Icon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
  CircleAlertIcon,
  FileTextIcon,
  FlaskConicalIcon,
  GraduationCapIcon,
  LandmarkIcon,
  SchoolIcon,
  SearchIcon,
  StarIcon,
  UploadCloudIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  APPLICATION_DOCUMENT_GROUPS,
  APPLICATION_DOCUMENT_UPLOAD_MAX_BYTES,
  APPLICATION_DOCUMENT_UPLOAD_MIME_TYPES,
  APPLICATION_STATUS_LABELS,
} from "@/features/applications/constants";
import {
  createApplicationAction,
  type ApplicationActionState,
} from "@/features/applications/actions";
import { getDocumentRequirements } from "@/features/applications/document-requirements";
import type {
  ApplicationCreateOptions,
  ApplicationProgramOption,
  ApplicationStudentDocument,
  WizardChoicePayload,
  WizardEducationPayload,
  WizardExistingDocumentPayload,
  WizardExamPayload,
} from "@/features/applications/types";
import { cn } from "@/lib/utils";

const initialActionState: ApplicationActionState = { status: "idle" };

const steps = [
  { icon: CalendarDaysIcon, label: "Dönəm" },
  { icon: Building2Icon, label: "Ölkə" },
  { icon: GraduationCapIcon, label: "Pillə" },
  { icon: LandmarkIcon, label: "İxtisas" },
  { icon: UserRoundIcon, label: "Şəxsi" },
  { icon: SchoolIcon, label: "Təhsil" },
  { icon: FileTextIcon, label: "Sənədlər" },
  { icon: CheckIcon, label: "Təsdiq" },
] as const;

type PersonalState = {
  address: string;
  birthDate: string;
  citizenship: string;
  contactEmail: string;
  fatherName: string;
  firstName: string;
  gender: string;
  identityNo: string;
  lastName: string;
  loginEmail: string;
  maritalStatus: string;
  motherName: string;
  passportNo: string;
  phone: string;
};

type SelectedDocumentFileInfo = {
  compressed?: boolean;
  message: string;
  name: string;
  originalSize?: number;
  size: number;
  tone: "error" | "success" | "warning";
};

const APPLICATION_CLIENT_TOTAL_UPLOAD_LIMIT_BYTES = 70 * 1024 * 1024;
const IMAGE_COMPRESSION_MAX_EDGE = 1800;
const IMAGE_COMPRESSION_QUALITIES = [0.78, 0.68, 0.62] as const;

const initialPersonalState: PersonalState = {
  address: "",
  birthDate: "",
  citizenship: "Azərbaycan",
  contactEmail: "",
  fatherName: "",
  firstName: "",
  gender: "Male",
  identityNo: "",
  lastName: "",
  loginEmail: "",
  maritalStatus: "Single",
  motherName: "",
  passportNo: "",
  phone: "",
};

const initialEducationState: WizardEducationPayload = {
  averageScore: "",
  city: "",
  country: "",
  endYear: "",
  gradingSystem: "",
  institutionName: "",
  startYear: "",
};

const initialExamState: WizardExamPayload = {
  examDate: "",
  examName: "",
  maxScore: "",
  score: "",
};

function buildInitialPersonalState(
  options: ApplicationCreateOptions,
): PersonalState {
  if (!options.currentStudent) {
    return initialPersonalState;
  }

  return {
    ...initialPersonalState,
    address: options.currentStudent.address,
    birthDate: options.currentStudent.birthDate,
    contactEmail: options.currentStudent.contactEmail,
    fatherName: options.currentStudent.fatherName,
    firstName: options.currentStudent.firstName,
    identityNo: options.currentStudent.identityNo,
    lastName: options.currentStudent.lastName,
    motherName: options.currentStudent.motherName,
    passportNo: options.currentStudent.passportNo,
    phone: options.currentStudent.phone,
    citizenship:
      options.currentStudent.citizenship || initialPersonalState.citizenship,
    gender: options.currentStudent.gender || initialPersonalState.gender,
    loginEmail:
      options.currentStudent.loginEmail || options.currentStudent.contactEmail,
    maritalStatus:
      options.currentStudent.maritalStatus ||
      initialPersonalState.maritalStatus,
  };
}

function buildInitialEducationState(
  options: ApplicationCreateOptions,
): WizardEducationPayload {
  return options.currentStudent?.education ?? initialEducationState;
}

function buildInitialExamState(options: ApplicationCreateOptions): WizardExamPayload {
  return options.currentStudent?.exam ?? initialExamState;
}

export type ApplicationWizardPrefill = {
  programId?: string;
  tuitionId?: string;
  universityId?: string;
};

export function ApplicationWizard({
  options,
  prefill,
}: {
  options: ApplicationCreateOptions;
  prefill?: ApplicationWizardPrefill;
}) {
  const isStudentView = options.viewer === "student";
  const prefilledProgram = getPrefilledProgram(options, prefill);
  const prefilledLevelKey = prefilledProgram
    ? getLevelKeyForEducationLevel(options, prefilledProgram.educationLevelId)
    : "";
  const [state, formAction, isPending] = useActionState(
    createApplicationAction,
    initialActionState,
  );
  const [activeStep, setActiveStep] = useState(() =>
    prefilledProgram ? 3 : 0,
  );
  const [selectedPeriodId, setSelectedPeriodId] = useState(
    () => prefilledProgram?.periodId ?? "",
  );
  const [selectedCountry, setSelectedCountry] = useState(
    () => prefilledProgram?.country ?? "",
  );
  const [selectedLevelKey, setSelectedLevelKey] = useState(
    () => prefilledLevelKey,
  );
  const [selectedEducationLevelId, setSelectedEducationLevelId] = useState(
    () => prefilledProgram?.educationLevelId ?? "",
  );
  const [selectedChoices, setSelectedChoices] = useState<WizardChoicePayload[]>(
    () =>
      prefilledProgram
        ? [
            {
              programId: prefilledProgram.programId,
              tuitionId: prefilledProgram.tuitionId,
              universityId: prefilledProgram.universityId,
            },
          ]
        : [],
  );
  const [selectedStudentId, setSelectedStudentId] = useState(
    () => options.currentStudent?.id ?? "",
  );
  const [personal, setPersonal] = useState<PersonalState>(() =>
    buildInitialPersonalState(options),
  );
  const [education, setEducation] = useState<WizardEducationPayload>(
    () => buildInitialEducationState(options),
  );
  const [exam, setExam] = useState<WizardExamPayload>(
    () => buildInitialExamState(options),
  );
  const [agentId, setAgentId] = useState(() =>
    options.agents.length === 1 ? options.agents[0].value : "",
  );
  const [internalNotes, setInternalNotes] = useState("");
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [selectedDocumentFiles, setSelectedDocumentFiles] = useState<
    Record<string, SelectedDocumentFileInfo>
  >({});
  const [existingDocuments, setExistingDocuments] = useState<
    Record<string, ApplicationStudentDocument>
  >(() => options.currentStudent?.documents ?? {});
  const [clientError, setClientError] = useState("");
  const citizenshipOptions = useMemo(
    () => buildCitizenshipOptions(options),
    [options],
  );

  const selectedPeriod = options.periods.find(
    (period) => period.id === selectedPeriodId,
  );
  const selectedLevel = options.levels.find(
    (level) => level.key === selectedLevelKey,
  );
  const documentRequirements = useMemo(
    () => getDocumentRequirements(selectedLevelKey),
    [selectedLevelKey],
  );
  const availableCountries = useMemo(
    () => getAvailableCountriesForPeriod(options, selectedPeriodId),
    [options, selectedPeriodId],
  );
  const availableLevels = useMemo(
    () =>
      getAvailableLevelsForSelection(
        options,
        selectedPeriodId,
        selectedCountry,
      ),
    [options, selectedCountry, selectedPeriodId],
  );
  const filteredPrograms = useMemo(
    () =>
      options.programs.filter(
        (program) =>
          program.periodId === selectedPeriodId &&
          program.country === selectedCountry &&
          program.educationLevelId === selectedEducationLevelId,
      ),
    [
      options.programs,
      selectedCountry,
      selectedEducationLevelId,
      selectedPeriodId,
    ],
  );
  const selectedProgramRows = selectedChoices
    .map((choice) =>
      options.programs.find(
        (program) =>
          program.universityId === choice.universityId &&
          program.programId === choice.programId &&
          (program.tuitionId ?? "") === (choice.tuitionId ?? ""),
      ),
    )
    .filter((program): program is ApplicationProgramOption => Boolean(program));
  const documentFileNames = {
    ...getExistingDocumentFileNames(existingDocuments),
    ...fileNames,
  };
  const existingDocumentsJson = JSON.stringify(
    buildExistingDocumentPayload(existingDocuments, fileNames),
  );
  const missingRequiredDocuments = documentRequirements.filter(
    (document) => document.required && !documentFileNames[document.key],
  );
  const requiredDocumentCount = documentRequirements.filter(
    (document) => document.required,
  ).length;
  const readyRequiredDocumentCount =
    requiredDocumentCount - missingRequiredDocuments.length;
  const documentGroupTitle =
    selectedLevelKey === "associate" || selectedLevelKey === "bachelor"
      ? "Bakalavr və Ön Lisans Pilləsi"
      : (selectedLevel?.label ?? "");
  const workflowContext = [
    { label: "Dönəm", value: selectedPeriod?.name || "Seçilməyib" },
    { label: "Ölkə", value: selectedCountry || "Seçilməyib" },
    { label: "Pillə", value: selectedLevel?.label || "Seçilməyib" },
    {
      label: "Seçim",
      value:
        selectedChoices.length > 0
          ? `${selectedChoices.length} ixtisas`
          : "Seçilməyib",
    },
    {
      label: "Sənəd",
      value:
        requiredDocumentCount > 0
          ? `${readyRequiredDocumentCount}/${requiredDocumentCount} hazır`
          : "Siyahı gözləyir",
    },
  ];
  const choicesJson = JSON.stringify(selectedChoices);
  const educationJson = JSON.stringify(education);
  const examsJson = JSON.stringify([exam]);

  function goNext() {
    if (!canAdvance(activeStep)) {
      setClientError(getStepError(activeStep));
      return;
    }

    setClientError("");
    setActiveStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBack() {
    setClientError("");
    setActiveStep((current) => Math.max(current - 1, 0));
  }

  function canNavigateToStep(stepIndex: number) {
    if (stepIndex <= activeStep) {
      return true;
    }

    for (let index = 0; index < stepIndex; index += 1) {
      if (!canAdvance(index)) {
        return false;
      }
    }

    return true;
  }

  function getFirstBlockedStep(stepIndex: number) {
    for (let index = 0; index < stepIndex; index += 1) {
      if (!canAdvance(index)) {
        return index;
      }
    }

    return stepIndex;
  }

  function goToStep(stepIndex: number) {
    if (stepIndex === activeStep) {
      return;
    }

    if (!canNavigateToStep(stepIndex)) {
      setClientError(getStepError(getFirstBlockedStep(stepIndex)));
      return;
    }

    setClientError("");
    setActiveStep(stepIndex);
  }

  function selectLevel(levelKey: string, educationLevelId: string) {
    setSelectedLevelKey(levelKey);
    setSelectedEducationLevelId(educationLevelId);
    setSelectedChoices([]);
  }

  function selectCountry(country: string) {
    setSelectedCountry(country);
    setSelectedLevelKey("");
    setSelectedEducationLevelId("");
    setSelectedChoices([]);
  }

  function selectPeriod(periodId: string) {
    setSelectedPeriodId(periodId);
    setSelectedCountry("");
    setSelectedLevelKey("");
    setSelectedEducationLevelId("");
    setSelectedChoices([]);
  }

  function toggleProgram(program: ApplicationProgramOption) {
    setSelectedChoices((current) => {
      const programKey = getProgramChoiceKey(program);
      const exists = current.some((choice) => getChoiceKey(choice) === programKey);

      if (exists) {
        return current.filter((choice) => getChoiceKey(choice) !== programKey);
      }

      return [
        ...current,
        {
          programId: program.programId,
          tuitionId: program.tuitionId,
          universityId: program.universityId,
        },
      ];
    });
  }

  function removeChoice(choiceKey: string) {
    setSelectedChoices((current) =>
      current.filter((choice) => getChoiceKey(choice) !== choiceKey),
    );
  }

  function moveChoice(choiceKey: string, direction: -1 | 1) {
    setSelectedChoices((current) => {
      const index = current.findIndex(
        (choice) => getChoiceKey(choice) === choiceKey,
      );
      const targetIndex = index + direction;

      if (index < 0 || targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  }

  async function handleDocumentChange(
    key: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      setFileNames((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      setSelectedDocumentFiles((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      return;
    }

    const fileError = getClientDocumentFileError(file);

    if (fileError) {
      input.value = "";
      setFileNames((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      setSelectedDocumentFiles((current) => ({
        ...current,
        [key]: {
          message: fileError,
          name: file.name,
          size: file.size,
          tone: "error",
        },
      }));
      setClientError(fileError);
      return;
    }

    let preparedFile = file;
    let message = "Fayl seçildi.";
    let tone: SelectedDocumentFileInfo["tone"] = "success";
    let compressed = false;

    if (isCompressibleImage(file)) {
      try {
        const compressedFile = await compressImageFile(file);

        if (compressedFile && compressedFile.size < file.size) {
          preparedFile = compressedFile;
          replaceInputFile(input, compressedFile);
          compressed = true;
          message = `Şəkil sıxışdırıldı: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)}.`;
        } else {
          message = "Şəkil artıq optimal ölçüdədir.";
        }
      } catch {
        message = "Fayl seçildi, amma şəkil sıxışdırıla bilmədi.";
        tone = "warning";
      }
    }

    const totalBytes = getSelectedUploadTotalBytes(
      selectedDocumentFiles,
      key,
    ) + preparedFile.size;

    if (totalBytes > APPLICATION_CLIENT_TOTAL_UPLOAD_LIMIT_BYTES) {
      input.value = "";
      const limitMessage = `Seçilmiş faylların ümumi ölçüsü ${formatFileSize(APPLICATION_CLIENT_TOTAL_UPLOAD_LIMIT_BYTES)} limitini keçməməlidir.`;
      setFileNames((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      setSelectedDocumentFiles((current) => ({
        ...current,
        [key]: {
          message: limitMessage,
          name: preparedFile.name,
          originalSize: file.size,
          size: preparedFile.size,
          tone: "error",
        },
      }));
      setClientError(limitMessage);
      return;
    }

    setFileNames((current) => ({
      ...current,
      [key]: preparedFile.name,
    }));
    setSelectedDocumentFiles((current) => ({
      ...current,
      [key]: {
        compressed,
        message,
        name: preparedFile.name,
        originalSize: compressed ? file.size : undefined,
        size: preparedFile.size,
        tone,
      },
    }));

    setExistingDocuments((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setClientError("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const nativeEvent = event.nativeEvent as SubmitEvent;
    const submitter = nativeEvent.submitter as HTMLButtonElement | null;

    if (submitter?.value === "submit" && missingRequiredDocuments.length > 0) {
      event.preventDefault();
      setClientError("Təsdiq üçün zəruri sənədləri yükləyin.");
    }
  }

  function updatePersonal(key: keyof PersonalState, value: string) {
    setPersonal((current) => ({ ...current, [key]: value }));
  }

  function selectExistingStudent(studentId: string) {
    setSelectedStudentId(studentId);
    setFileNames({});
    setSelectedDocumentFiles({});

    if (!studentId) {
      setExistingDocuments({});
      setEducation(initialEducationState);
      setExam(initialExamState);
      return;
    }

    const student = options.students.find((item) => item.id === studentId);

    if (!student) {
      setExistingDocuments({});
      setEducation(initialEducationState);
      setExam(initialExamState);
      return;
    }

    setExistingDocuments(student.documents);
    setEducation(student.education);
    setExam(student.exam);
    setPersonal({
      address: student.address,
      birthDate: student.birthDate,
      citizenship: student.citizenship || initialPersonalState.citizenship,
      contactEmail: student.contactEmail,
      fatherName: student.fatherName,
      firstName: student.firstName,
      gender: student.gender || initialPersonalState.gender,
      identityNo: student.identityNo,
      lastName: student.lastName,
      loginEmail: student.loginEmail || student.contactEmail,
      maritalStatus:
        student.maritalStatus || initialPersonalState.maritalStatus,
      motherName: student.motherName,
      passportNo: student.passportNo,
      phone: student.phone,
    });

    if (student.agentId) {
      setAgentId(student.agentId);
    }
  }

  function updateEducation(key: keyof WizardEducationPayload, value: string) {
    setEducation((current) => ({ ...current, [key]: value }));
  }

  function updateExam(key: keyof WizardExamPayload, value: string) {
    setExam((current) => ({ ...current, [key]: value }));
  }

  function canAdvance(step: number) {
    if (step === 0) {
      return Boolean(selectedPeriodId);
    }

    if (step === 1) {
      return availableCountries.some(
        (country) => country.country === selectedCountry,
      );
    }

    if (step === 2) {
      return availableLevels.some(
        (level) =>
          level.key === selectedLevelKey &&
          level.educationLevelId === selectedEducationLevelId,
      );
    }

    if (step === 3) {
      return selectedChoices.length > 0;
    }

    if (step === 4) {
      return Boolean(personal.firstName.trim() && personal.lastName.trim());
    }

    if (step === 5) {
      return Boolean(education.institutionName?.trim());
    }

    return true;
  }

  return (
    <form
      action={formAction}
      className="flex min-h-full flex-col bg-[#f7f7f8] px-4 py-4 text-[#081a3a] lg:px-6 lg:py-5"
      onSubmit={handleSubmit}
    >
      <input name="agentId" type="hidden" value={agentId} />
      <input name="choicesJson" type="hidden" value={choicesJson} />
      <input name="country" type="hidden" value={selectedCountry} />
      <input
        name="educationLevelId"
        type="hidden"
        value={selectedEducationLevelId}
      />
      <input name="educationLevelKey" type="hidden" value={selectedLevelKey} />
      <input name="educationJson" type="hidden" value={educationJson} />
      <input name="examsJson" type="hidden" value={examsJson} />
      <input
        name="existingDocumentsJson"
        type="hidden"
        value={existingDocumentsJson}
      />
      <input
        name="internalNotes"
        type="hidden"
        value={isStudentView ? "" : internalNotes}
      />
      <input name="periodId" type="hidden" value={selectedPeriodId} />
      <input name="selectedStudentId" type="hidden" value={selectedStudentId} />
      {Object.entries(personal).map(([key, value]) => (
        <input key={key} name={key} type="hidden" value={value} />
      ))}

      <div className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col">
        <h1 className="text-xl font-black tracking-tight text-[#07183a] sm:text-2xl">
          Yeni Başvuru
        </h1>

        <WizardStepper
          activeStep={activeStep}
          canNavigateToStep={canNavigateToStep}
          onStepClick={goToStep}
        />
        <WorkflowContextBar
          activeStep={activeStep}
          dataUnavailable={options.dataSource === "unavailable"}
          isPending={isPending}
          items={workflowContext}
          onBack={goBack}
          onNext={goNext}
        />

        {((activeStep === steps.length - 1 && state.status === "error") ||
          clientError) && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
            <div>
              <div>{clientError || state.message}</div>
              {state.fieldErrors?.documents ? (
                <ul className="mt-1 list-inside list-disc text-xs font-medium">
                  {state.fieldErrors.documents.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        )}

        {options.dataSource === "unavailable" ? (
          <WizardPanel>
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <CircleAlertIcon />
              </div>
              <div>
                <h2 className="text-xl font-black">ERP bağlantısı yoxdur</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#637392]">
                  Dönəm, ölkə, universitet və ixtisas məlumatları database-dən
                  gəlməlidir. DATABASE_URL aktivləşəndən sonra yeni müraciət
                  formu işləyəcək.
                </p>
              </div>
            </div>
          </WizardPanel>
        ) : (
          <WizardPanel>
            <div className={activeStep === 0 ? "block" : "hidden"}>
              <PeriodStep
                options={options}
                selectedPeriodId={selectedPeriodId}
                onSelect={selectPeriod}
              />
            </div>
            <div className={activeStep === 1 ? "block" : "hidden"}>
              <CountryStep
                countries={availableCountries}
                selectedCountry={selectedCountry}
                onSelect={selectCountry}
              />
            </div>
            <div className={activeStep === 2 ? "block" : "hidden"}>
              <LevelStep
                levels={availableLevels}
                selectedLevelKey={selectedLevelKey}
                onSelect={selectLevel}
              />
            </div>
            <div className={activeStep === 3 ? "block" : "hidden"}>
              <ProgramStep
                programs={filteredPrograms}
                selectedChoices={selectedChoices}
                selectedCountry={selectedCountry}
                selectedLevel={selectedLevel?.label ?? ""}
                selectedPeriod={selectedPeriod?.name ?? ""}
                onMoveChoice={moveChoice}
                onRemoveChoice={removeChoice}
                onToggle={toggleProgram}
              />
            </div>
            <div className={activeStep === 4 ? "block" : "hidden"}>
              <PersonalStep
                agents={options.agents}
                agentId={agentId}
                citizenshipOptions={citizenshipOptions}
                isStudentView={isStudentView}
                personal={personal}
                selectedStudentId={selectedStudentId}
                students={options.students}
                onAgentChange={setAgentId}
                onChange={updatePersonal}
                onStudentSelect={selectExistingStudent}
              />
            </div>
            <div className={activeStep === 5 ? "block" : "hidden"}>
              <EducationStep
                countries={options.countries.map((country) => country.country)}
                education={education}
                exam={exam}
                onEducationChange={updateEducation}
                onExamChange={updateExam}
              />
            </div>
            <div className={activeStep === 6 ? "block" : "hidden"}>
              <DocumentsStep
                documentRequirements={documentRequirements}
                existingDocuments={existingDocuments}
                fileNames={documentFileNames}
                selectedFileInfo={selectedDocumentFiles}
                levelLabel={documentGroupTitle}
                selectedFileNames={fileNames}
                onFileChange={handleDocumentChange}
              />
            </div>
            <div className={activeStep === 7 ? "block" : "hidden"}>
              <ConfirmStep
                choices={selectedProgramRows}
                documentRequirements={documentRequirements}
                education={education}
                exam={exam}
                fileNames={documentFileNames}
                selectedFileInfo={selectedDocumentFiles}
                internalNotes={internalNotes}
                showInternalNotes={!isStudentView}
                missingRequiredDocuments={missingRequiredDocuments}
                personal={personal}
                selectedCountry={selectedCountry}
                selectedLevel={selectedLevel?.label ?? ""}
                selectedPeriod={selectedPeriod?.name ?? ""}
                statusLabel={APPLICATION_STATUS_LABELS.DRAFT}
                onNotesChange={setInternalNotes}
              />
            </div>
          </WizardPanel>
        )}
      </div>
    </form>
  );
}

function WizardStepper({
  activeStep,
  canNavigateToStep,
  onStepClick,
}: {
  activeStep: number;
  canNavigateToStep: (stepIndex: number) => boolean;
  onStepClick: (stepIndex: number) => void;
}) {
  return (
    <div className="mt-5 overflow-x-auto pb-2">
      <div className="grid min-w-[700px] grid-cols-8 gap-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === activeStep;
          const isDone = index < activeStep;
          const isAllowed = canNavigateToStep(index);

          return (
            <div
              className="relative flex min-w-0 flex-col items-center gap-2"
              key={step.label}
            >
              {index > 0 ? (
                <div
                  className={cn(
                    "absolute right-1/2 top-[18px] h-[2px] w-full",
                    isDone || isActive ? "bg-[#1559b7]" : "bg-[#dfe7f1]",
                  )}
                />
              ) : null}
              <button
                aria-current={isActive ? "step" : undefined}
                aria-disabled={!isAllowed}
                className={cn(
                  "relative z-10 flex min-w-0 flex-col items-center gap-2 rounded-xl px-1 py-0.5 outline-none transition focus-visible:ring-4 focus-visible:ring-[#1559b7]/10",
                  isAllowed
                    ? "cursor-pointer hover:-translate-y-0.5"
                    : "cursor-not-allowed opacity-65",
                )}
                onClick={() => onStepClick(index)}
                type="button"
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border-2 bg-white text-xs font-black",
                    isActive &&
                      "border-[#dbe8f9] bg-[#1559b7] text-white ring-4 ring-[#dbe8f9]",
                    isDone && "border-[#12b981] bg-[#12b981] text-white",
                    !isActive && !isDone && "border-[#dbe5f1] text-[#637392]",
                  )}
                >
                  {isDone ? <CheckIcon className="size-3.5" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "flex max-w-full items-center gap-1 truncate text-[11px] font-semibold",
                    isActive && "text-[#1559b7]",
                    isDone && "text-[#0ea66f]",
                    !isActive && !isDone && "text-[#51627f]",
                  )}
                >
                  <Icon className="size-3" />
                  <span className="truncate">{step.label}</span>
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorkflowContextBar({
  activeStep,
  dataUnavailable,
  isPending,
  items,
  onBack,
  onNext,
}: {
  activeStep: number;
  dataUnavailable: boolean;
  isPending: boolean;
  items: Array<{ label: string; value: string }>;
  onBack: () => void;
  onNext: () => void;
}) {
  const isLastStep = activeStep === steps.length - 1;
  const StepIcon = steps[activeStep].icon;

  return (
    <div className="mt-3 rounded-[1rem] border border-[#dce6f4] bg-white/95 px-2.5 py-2 shadow-[0_10px_26px_rgba(29,78,216,0.035)] backdrop-blur">
      <div className="grid gap-2 xl:grid-cols-[minmax(180px,240px)_minmax(0,1fr)_auto] xl:items-center">
        <div className="flex items-center gap-2 rounded-xl bg-[#f8fbff] px-2.5 py-2 ring-1 ring-[#edf2f8]">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#1559b7] text-white shadow-[0_10px_22px_rgba(21,89,183,0.18)]">
            <StepIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-wide text-[#637392]">
              Cari mərhələ
            </div>
            <div className="truncate text-sm font-black text-[#07183a]">
              {activeStep + 1}. {steps[activeStep].label}
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto py-0.5 xl:justify-end">
          {items.map((item) => (
            <div
              className="min-w-[118px] rounded-xl border border-[#edf2f8] bg-[#fbfdff] px-2.5 py-1.5"
              key={item.label}
            >
              <div className="text-[10px] font-black uppercase text-[#8a97b4]">
                {item.label}
              </div>
              <div className="mt-0.5 max-w-32 truncate text-xs font-black text-[#07183a]">
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:flex-nowrap xl:justify-end">
          <Button
            className="h-9 flex-1 rounded-xl border-[#dce6f4] bg-white px-3 text-xs font-black text-[#07183a] hover:bg-[#f6f9ff] hover:text-[#0b5bb8] sm:flex-none"
            disabled={activeStep === 0}
            onClick={onBack}
            type="button"
            variant="outline"
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Geri
          </Button>

          {!isLastStep ? (
            <Button
              className="h-9 flex-1 rounded-xl bg-[#1559b7] px-4 text-xs font-black shadow-[0_12px_24px_rgba(21,89,183,0.16)] hover:bg-[#104fa5] sm:flex-none"
              disabled={dataUnavailable}
              onClick={onNext}
              type="button"
            >
              İrəli
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          ) : (
            <>
              <Button
                className="h-9 flex-1 rounded-xl border-[#dce6f4] bg-white px-3 text-xs font-black text-[#34456c] hover:bg-[#f6f9ff] hover:text-[#0b5bb8] sm:flex-none"
                disabled={isPending || dataUnavailable}
                name="intent"
                type="submit"
                value="draft"
                variant="outline"
              >
                Qaralama saxla
              </Button>
              <Button
                className="h-9 flex-1 rounded-xl bg-[#1559b7] px-4 text-xs font-black shadow-[0_12px_24px_rgba(21,89,183,0.16)] hover:bg-[#104fa5] sm:flex-none"
                disabled={isPending || dataUnavailable}
                name="intent"
                type="submit"
                value="submit"
              >
                Təsdiqlə
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function WizardPanel({ children }: { children: React.ReactNode }) {
  return (
    <section className="mt-4 min-h-[260px] rounded-[1.15rem] border border-[#e5edf7] bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.04)] sm:p-5 lg:p-6">
      {children}
    </section>
  );
}

function PeriodStep({
  options,
  selectedPeriodId,
  onSelect,
}: {
  options: ApplicationCreateOptions;
  selectedPeriodId: string;
  onSelect: (periodId: string) => void;
}) {
  return (
    <StepShell
      description="Müraciət etmək istədiyiniz dönəmi seçin"
      title="Dönəm Seçimi"
    >
      <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
        {options.periods.map((period) => (
          <ChoiceCard
            active={selectedPeriodId === period.id}
            icon={CalendarDaysIcon}
            key={period.id}
            label={period.name}
            onClick={() => onSelect(period.id)}
          />
        ))}
      </div>
    </StepShell>
  );
}

function CountryStep({
  countries,
  selectedCountry,
  onSelect,
}: {
  countries: ApplicationCreateOptions["countries"];
  selectedCountry: string;
  onSelect: (country: string) => void;
}) {
  return (
    <StepShell
      description="Oxumaq istədiyiniz ölkəni seçin"
      title="Ölkə Seçimi"
    >
      <FieldLabel label="Ölkə" required />
      <select
        className="mt-2 h-12 w-full rounded-xl border border-[#cfd9e8] bg-white px-4 text-base font-semibold text-[#07183a] outline-none transition focus:border-[#1559b7] focus:ring-4 focus:ring-[#1559b7]/10"
        onChange={(event) => onSelect(event.target.value)}
        value={selectedCountry}
      >
        <option value="">Seçin...</option>
        {countries.map((country) => (
          <option key={country.country} value={country.country}>
            {country.country} ({country.universityCount})
          </option>
        ))}
      </select>
      {countries.length === 0 ? (
        <EmptyState text="Seçilmiş dönəm üçün aktiv proqram ölkəsi yoxdur." />
      ) : null}
    </StepShell>
  );
}

function LevelStep({
  levels,
  selectedLevelKey,
  onSelect,
}: {
  levels: ApplicationCreateOptions["levels"];
  selectedLevelKey: string;
  onSelect: (levelKey: string, educationLevelId: string) => void;
}) {
  return (
    <StepShell
      description="Qəbul olmaq istədiyiniz təhsil pilləsini seçin"
      title="Təhsil Pilləsi"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {levels.map((level) => (
          <ChoiceCard
            active={selectedLevelKey === level.key}
            icon={getLevelIcon(level.icon)}
            key={level.key}
            label={level.label}
            onClick={() => onSelect(level.key, level.educationLevelId)}
          />
        ))}
      </div>
      {levels.length === 0 ? (
        <EmptyState text="Seçilmiş dönəm və ölkə üçün aktiv pillə yoxdur." />
      ) : null}
    </StepShell>
  );
}

function ProgramStep({
  programs,
  selectedChoices,
  selectedCountry,
  selectedLevel,
  selectedPeriod,
  onMoveChoice,
  onRemoveChoice,
  onToggle,
}: {
  programs: ApplicationProgramOption[];
  selectedChoices: WizardChoicePayload[];
  selectedCountry: string;
  selectedLevel: string;
  selectedPeriod: string;
  onMoveChoice: (choiceKey: string, direction: -1 | 1) => void;
  onRemoveChoice: (choiceKey: string) => void;
  onToggle: (program: ApplicationProgramOption) => void;
}) {
  const [selectedUniversityId, setSelectedUniversityId] = useState("all");
  const [universitySearch, setUniversitySearch] = useState("");
  const [programSearch, setProgramSearch] = useState("");
  const universities = useMemo(
    () => getProgramUniversityOptions(programs),
    [programs],
  );
  const visibleUniversities = universities.filter((university) =>
    [university.name, university.type, university.city]
      .filter(Boolean)
      .some((value) => matchesSearch(value, universitySearch)),
  );
  const visiblePrograms = programs.filter((program) => {
    const universityMatches =
      selectedUniversityId === "all" ||
      program.universityId === selectedUniversityId;
    const programMatches = [
      program.programName,
      program.universityName,
      program.language,
      program.city,
      program.educationLevelName,
    ].some((value) => matchesSearch(value, programSearch));

    return universityMatches && programMatches;
  });
  const selectedProgramRows = selectedChoices
    .map((choice) =>
      programs.find((program) => getProgramChoiceKey(program) === getChoiceKey(choice)),
    )
    .filter((program): program is ApplicationProgramOption => Boolean(program));
  const selectedCount = selectedProgramRows.length;
  const selectedUniversityCount = new Set(
    selectedProgramRows.map((program) => program.universityId),
  ).size;
  const selectedByUniversity = selectedProgramRows.reduce<
    Record<string, number>
  >((accumulator, program) => {
    accumulator[program.universityId] =
      (accumulator[program.universityId] ?? 0) + 1;
    return accumulator;
  }, {});
  const selectedUniversityLabel =
    selectedUniversityId === "all"
      ? "Bütün universitetlər"
      : (universities.find((item) => item.id === selectedUniversityId)?.name ??
        "Universitet");

  return (
    <StepShell
      description="Eyni müraciət daxilində ölkə üzrə bir neçə universitet və proqram seçə bilərsiniz."
      title="İxtisas seçimi"
    >
      <div className="mb-4 flex flex-wrap gap-2 text-xs font-bold text-[#51627f]">
        <FilterChip>{selectedPeriod || "Dönəm seçilməyib"}</FilterChip>
        <FilterChip>{selectedCountry || "Ölkə seçilməyib"}</FilterChip>
        <FilterChip>{selectedLevel || "Pillə seçilməyib"}</FilterChip>
        <FilterChip>
          {selectedUniversityCount} universitet / {selectedCount} ixtisas
        </FilterChip>
      </div>

      {programs.length === 0 ? (
        <EmptyState text="Seçilmiş filterlərə uyğun aktiv ixtisas tapılmadı." />
      ) : (
        <div className="grid gap-3 xl:grid-cols-[270px_minmax(0,1fr)_320px]">
          <section className="rounded-[1rem] border border-[#dce6f4] bg-gradient-to-b from-white to-[#f7fbff] p-3 shadow-[0_14px_34px_rgba(21,89,183,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black text-[#07183a]">
                  Universitet
                </div>
                <div className="mt-0.5 text-xs font-semibold text-[#637392]">
                  {universities.length} universitet
                </div>
              </div>
              <Building2Icon className="size-5 text-[#1559b7]" />
            </div>

            <SearchField
              className="mt-3"
              label="Universitet axtarışı"
              onChange={setUniversitySearch}
              placeholder="Universitet, şəhər, tip..."
              value={universitySearch}
            />

            <div className="mt-3 grid max-h-[300px] gap-2 overflow-y-auto pr-1">
              <button
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(21,89,183,0.08)]",
                  selectedUniversityId === "all"
                    ? "border-[#1559b7] bg-[#eef5ff] shadow-[inset_3px_0_0_#1559b7]"
                    : "border-[#dce6f4] bg-white hover:border-[#1559b7]/50 hover:bg-[#f8fbff]",
                )}
                onClick={() => setSelectedUniversityId("all")}
                type="button"
              >
                <div className="text-sm font-black text-[#07183a]">
                  Bütün universitetlər
                </div>
                <div className="mt-1 text-xs font-semibold text-[#637392]">
                  {programs.length} proqram
                </div>
                {selectedCount > 0 ? (
                  <div className="mt-2 w-fit rounded-full bg-[#1559b7] px-2 py-0.5 text-[11px] font-black text-white">
                    {selectedCount} seçilib
                  </div>
                ) : null}
              </button>

              {visibleUniversities.map((university) => (
                <button
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(21,89,183,0.08)]",
                    selectedUniversityId === university.id
                      ? "border-[#1559b7] bg-[#eef5ff] shadow-[inset_3px_0_0_#1559b7]"
                      : "border-[#dce6f4] bg-white hover:border-[#1559b7]/50 hover:bg-[#f8fbff]",
                  )}
                  key={university.id}
                  onClick={() => setSelectedUniversityId(university.id)}
                  type="button"
                >
                  <div className="line-clamp-2 text-sm font-black text-[#07183a]">
                    {university.name}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-[#637392]">
                    {university.type} · {university.city}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="w-fit rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-[#1559b7]">
                      {university.programCount} proqram
                    </span>
                    {selectedByUniversity[university.id] ? (
                      <span className="w-fit rounded-full bg-[#1559b7] px-2 py-0.5 text-[11px] font-black text-white">
                        {selectedByUniversity[university.id]} seçilib
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}

              {visibleUniversities.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#cfd9e8] bg-white px-3 py-6 text-center text-sm font-semibold text-[#637392]">
                  Universitet tapılmadı.
                </div>
              ) : null}
            </div>
          </section>

          <section className="min-w-0 overflow-hidden rounded-[1rem] border border-[#dce6f4] bg-white shadow-[0_14px_34px_rgba(21,89,183,0.05)]">
            <div className="border-b border-[#dce6f4] p-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="text-sm font-black text-[#07183a]">
                    {selectedUniversityLabel}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-[#637392]">
                    {visiblePrograms.length} proqram göstərilir
                  </div>
                </div>
                <SearchField
                  className="lg:w-80"
                  label="Program axtarışı"
                  onChange={setProgramSearch}
                  placeholder="İxtisas, dil, şəhər..."
                  value={programSearch}
                />
              </div>
            </div>

            {visiblePrograms.length === 0 ? (
              <div className="p-4">
                <EmptyState text="Bu axtarışa uyğun proqram tapılmadı." />
              </div>
            ) : (
              <div className="max-h-[430px] overflow-y-auto p-3 pr-2">
                <div className="grid gap-2">
                  {visiblePrograms.map((program) => {
                    const selected = selectedChoices.some(
                      (choice) =>
                        getChoiceKey(choice) === getProgramChoiceKey(program),
                    );
                    const price = formatMoney(
                      program.tuitionFee,
                      program.currency,
                    );
                    const discountedPrice = formatMoney(
                      program.discountedTuitionFee,
                      program.currency,
                    );

                    return (
                      <button
                        className={cn(
                          "group rounded-xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(21,89,183,0.09)]",
                          selected
                            ? "border-[#1559b7] bg-[#eef5ff] shadow-[inset_3px_0_0_#1559b7]"
                            : "border-[#dce6f4] bg-white hover:border-[#1559b7]/50 hover:bg-[#fbfdff]",
                        )}
                        key={getProgramChoiceKey(program)}
                        onClick={() => onToggle(program)}
                        type="button"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <span
                            className={cn(
                              "mt-1 flex size-5 shrink-0 items-center justify-center rounded-md border transition",
                              selected
                                ? "border-[#1559b7] bg-[#1559b7] text-white"
                                : "border-[#cfd9e8] bg-white text-transparent group-hover:border-[#1559b7]",
                            )}
                          >
                            <CheckIcon className="size-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="line-clamp-1 text-sm font-black text-[#07183a]">
                                {program.programName}
                              </span>
                              <span className="rounded-full bg-[#eef5ff] px-2 py-0.5 text-[10px] font-black text-[#1559b7]">
                                {program.educationLevelName}
                              </span>
                            </div>
                            <div className="mt-1 line-clamp-1 text-xs font-bold text-[#637392]">
                              {program.universityName}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-[#51627f] ring-1 ring-[#edf2f8]">
                                {program.language}
                              </span>
                              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-[#51627f] ring-1 ring-[#edf2f8]">
                                {program.city}
                              </span>
                              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-[#51627f] ring-1 ring-[#edf2f8]">
                                {program.universityType}
                              </span>
                            </div>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              <div className="rounded-lg bg-white/80 px-3 py-2 ring-1 ring-[#edf2f8]">
                                <div className="text-[10px] font-black uppercase text-[#8a97b4]">
                                  Qiymət
                                </div>
                                <div className="mt-0.5 text-sm font-black text-[#07183a]">
                                  {price || "-"}
                                </div>
                              </div>
                              <div className="rounded-lg bg-[#ecfdf5] px-3 py-2 ring-1 ring-[#bff3dc]">
                                <div className="text-[10px] font-black uppercase text-[#0f9f6e]">
                                  Endirimli
                                </div>
                                <div className="mt-0.5 text-sm font-black text-[#0f9f6e]">
                                  {discountedPrice || price || "-"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          <SelectedChoicesBasket
            programs={selectedProgramRows}
            onMove={onMoveChoice}
            onRemove={onRemoveChoice}
          />
        </div>
      )}
    </StepShell>
  );
}

function SelectedChoicesBasket({
  programs,
  onMove,
  onRemove,
}: {
  programs: ApplicationProgramOption[];
  onMove: (choiceKey: string, direction: -1 | 1) => void;
  onRemove: (choiceKey: string) => void;
}) {
  const grouped = programs.reduce<
    Array<{
      items: Array<{ index: number; program: ApplicationProgramOption }>;
      universityId: string;
      universityName: string;
    }>
  >((accumulator, program, index) => {
    const group = accumulator.find(
      (item) => item.universityId === program.universityId,
    );

    if (group) {
      group.items.push({ index, program });
    } else {
      accumulator.push({
        items: [{ index, program }],
        universityId: program.universityId,
        universityName: program.universityName,
      });
    }

    return accumulator;
  }, []);

  return (
    <aside className="flex max-h-[535px] min-h-0 flex-col overflow-hidden rounded-[1rem] border border-[#dce6f4] bg-gradient-to-b from-white to-[#f7fbff] p-3 shadow-[0_14px_34px_rgba(21,89,183,0.05)] xl:sticky xl:top-4 xl:max-h-[535px] xl:self-start">
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div>
          <div className="text-sm font-black text-[#07183a]">
            Seçilmişlər səbəti
          </div>
          <div className="mt-0.5 text-xs font-semibold text-[#637392]">
            {grouped.length} universitet / {programs.length} ixtisas
          </div>
        </div>
        <span className="rounded-full bg-[#eef5ff] p-2 text-[#1559b7]">
          <StarIcon className="size-4" />
        </span>
      </div>

      {programs.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-[#cfd9e8] bg-[#f8fbff] px-3 py-6 text-center text-xs font-bold leading-5 text-[#637392]">
          Seçim etdikcə proqramlar burada görünəcək.
        </div>
      ) : (
        <div className="mt-3 grid min-h-0 max-h-[420px] flex-1 gap-3 overflow-y-auto pr-1">
          {grouped.map((group) => (
            <section key={group.universityId}>
              <div className="mb-2 line-clamp-2 text-xs font-black text-[#1559b7]">
                {group.universityName}
              </div>
              <div className="grid gap-2">
                {group.items.map(({ index, program }) => {
                  const choiceKey = getProgramChoiceKey(program);

                  return (
                    <div
                      className="rounded-xl border border-[#dce6f4] bg-white p-2.5 shadow-sm"
                      key={choiceKey}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[11px] font-black uppercase text-[#8a97b4]">
                            #{index + 1}
                          </div>
                          <div className="mt-0.5 line-clamp-2 text-sm font-black text-[#07183a]">
                            {program.programName}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-[#637392]">
                            {program.language} · {program.city}
                          </div>
                          <div className="mt-1 text-xs font-black text-[#12b981]">
                            {formatMoney(
                              program.discountedTuitionFee,
                              program.currency,
                            ) || formatMoney(program.tuitionFee, program.currency)}
                          </div>
                        </div>
                        <Button
                          aria-label="Seçimi sil"
                          className="size-8 shrink-0 rounded-lg border-red-100 bg-white text-red-600 hover:bg-red-50"
                          onClick={() => onRemove(choiceKey)}
                          size="icon"
                          type="button"
                          variant="outline"
                        >
                          <XIcon className="size-4" />
                        </Button>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button
                          className="h-8 flex-1 rounded-lg border-[#dce6f4] bg-white text-xs font-black text-[#34456c]"
                          disabled={index === 0}
                          onClick={() => onMove(choiceKey, -1)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <ChevronUpIcon data-icon="inline-start" />
                          Yuxarı
                        </Button>
                        <Button
                          className="h-8 flex-1 rounded-lg border-[#dce6f4] bg-white text-xs font-black text-[#34456c]"
                          disabled={index === programs.length - 1}
                          onClick={() => onMove(choiceKey, 1)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <ChevronDownIcon data-icon="inline-start" />
                          Aşağı
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </aside>
  );
}

function PersonalStep({
  agents,
  agentId,
  citizenshipOptions,
  isStudentView,
  personal,
  selectedStudentId,
  students,
  onAgentChange,
  onChange,
  onStudentSelect,
}: {
  agents: ApplicationCreateOptions["agents"];
  agentId: string;
  citizenshipOptions: Array<{ label: string; value: string }>;
  isStudentView: boolean;
  personal: PersonalState;
  selectedStudentId: string;
  students: ApplicationCreateOptions["students"];
  onAgentChange: (value: string) => void;
  onChange: (key: keyof PersonalState, value: string) => void;
  onStudentSelect: (studentId: string) => void;
}) {
  return (
    <StepShell
      description="Tələbənin şəxsi məlumatlarını daxil edin"
      title="Şəxsi Məlumatlar"
    >
      {!isStudentView ? (
        <div className="mb-5 rounded-2xl border border-[#dce6f4] bg-[#f8fbff] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="block flex-1">
              <FieldLabel label="Mövcud tələbə" />
              <select
                className="mt-2 h-12 w-full rounded-xl border border-[#dce6f4] bg-white px-4 text-base font-semibold text-[#07183a] outline-none transition focus:border-[#1559b7] focus:ring-4 focus:ring-[#1559b7]/10"
                onChange={(event) => onStudentSelect(event.target.value)}
                value={selectedStudentId}
              >
                <option value="">Yeni tələbə yaradılacaq</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.label ||
                      `${student.firstName} ${student.lastName}`}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-xl border border-[#edf2f8] bg-white px-4 py-3 text-xs font-semibold leading-5 text-[#637392] lg:w-80">
              Tələbəni seçdikdə şəxsi məlumatlar avtomatik dolur. Düzəliş
              etsəniz, müraciət saxlananda həmin tələbə kartı yenilənəcək.
            </div>
          </div>
          {selectedStudentId ? (
            <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              Mövcud tələbə seçilib. Submit zamanı yeni tələbə yaradılmayacaq.
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TextField
          label="Ad"
          onChange={(value) => onChange("firstName", value)}
          placeholder="Tələbənin adı"
          required
          value={personal.firstName}
        />
        <TextField
          label="Soyad"
          onChange={(value) => onChange("lastName", value)}
          placeholder="Tələbənin soyadı"
          required
          value={personal.lastName}
        />
        <TextField
          label="Ata adı"
          onChange={(value) => onChange("fatherName", value)}
          placeholder="Ata adı"
          value={personal.fatherName}
        />
        <TextField
          label="Ana adı"
          onChange={(value) => onChange("motherName", value)}
          placeholder="Ana adı"
          value={personal.motherName}
        />
        <TextField
          label="Doğum tarixi"
          onChange={(value) => onChange("birthDate", value)}
          type="date"
          value={personal.birthDate}
        />
        <TextField
          label="E-mail"
          onChange={(value) => {
            onChange("contactEmail", value);
            if (!personal.loginEmail) {
              onChange("loginEmail", value);
            }
          }}
          placeholder="email@example.com"
          type="email"
          value={personal.contactEmail}
        />
        <TextField
          label="Mobil telefon"
          onChange={(value) => onChange("phone", value)}
          placeholder="+994 50 000 00 00"
          value={personal.phone}
        />
        <SelectField
          label="Vətəndaşlıq"
          onChange={(value) => onChange("citizenship", value)}
          options={citizenshipOptions}
          value={personal.citizenship}
        />
        <TextField
          label="Pasport no"
          onChange={(value) => onChange("passportNo", value)}
          placeholder="Pasport no"
          value={personal.passportNo}
        />
        <TextField
          label="Şəxsiyyət no"
          onChange={(value) => onChange("identityNo", value)}
          placeholder="Şəxsiyyət no"
          value={personal.identityNo}
        />
        {!isStudentView ? (
          <SelectField
            label="Agent"
            onChange={onAgentChange}
            options={[{ label: "Agent seçilməyib", value: "" }, ...agents]}
            value={agentId}
          />
        ) : null}
        <SelectField
          label="Cins"
          onChange={(value) => onChange("gender", value)}
          options={[
            { label: "Kişi", value: "Male" },
            { label: "Qadın", value: "Female" },
          ]}
          value={personal.gender}
        />
        <SelectField
          label="Ailə vəziyyəti"
          onChange={(value) => onChange("maritalStatus", value)}
          options={[
            { label: "Subay", value: "Single" },
            { label: "Evli", value: "Married" },
          ]}
          value={personal.maritalStatus}
        />
        <TextField
          className="sm:col-span-2 xl:col-span-4"
          label="Ünvan"
          onChange={(value) => onChange("address", value)}
          placeholder="Ünvan"
          value={personal.address}
        />
      </div>
    </StepShell>
  );
}

function EducationStep({
  countries,
  education,
  exam,
  onEducationChange,
  onExamChange,
}: {
  countries: string[];
  education: WizardEducationPayload;
  exam: WizardExamPayload;
  onEducationChange: (key: keyof WizardEducationPayload, value: string) => void;
  onExamChange: (key: keyof WizardExamPayload, value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const yearOptions = buildYearOptions();
  const countryOptions = [
    { label: "Seçin...", value: "" },
    ...countries.map((country) => ({ label: country, value: country })),
  ];
  const hasEducation = Boolean(education.institutionName?.trim());
  const hasExam = Boolean(exam.examName?.trim() || exam.score?.trim());

  return (
    <StepShell
      description="Təhsil və imtahan məlumatlarını popup daxilində doldurun. Məlumatlar tələbə üzrə növbəti müraciətlərdə avtomatik təklif olunacaq."
      title="Təhsil Məlumatları"
    >
      <div className="rounded-[1.1rem] border border-[#dce6f4] bg-gradient-to-r from-[#f8fbff] to-white p-4 shadow-[0_12px_30px_rgba(29,78,216,0.04)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ff] text-[#1559b7]">
              <SchoolIcon className="size-5" />
            </div>
            <div>
              <div className="text-base font-black text-[#07183a]">
                Təhsil və imtahan məlumatları
              </div>
              <div className="mt-1 text-sm font-semibold leading-6 text-[#637392]">
                Form birbaşa açılmır; məlumatları popup-da doldurun və sonra
                xülasəni aşağıdakı `v` ikonları ilə yoxlayın.
              </div>
            </div>
          </div>
          <Button
            className="h-10 rounded-xl bg-[#1559b7] px-4 text-xs font-black shadow-[0_12px_24px_rgba(21,89,183,0.18)] hover:bg-[#104fa5]"
            onClick={() => setOpen(true)}
            type="button"
          >
            <FileTextIcon data-icon="inline-start" />
            {hasEducation ? "Məlumatları dəyiş" : "Məlumatları doldur"}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <EducationSummaryDisclosure
          complete={hasEducation}
          details={[
            ["Müəssisə", education.institutionName],
            ["Ölkə", education.country],
            ["Şəhər", education.city],
            ["Başlama ili", education.startYear],
            ["Bitmə ili", education.endYear],
            ["Qiymətləndirmə", education.gradingSystem],
            ["Orta bal", education.averageScore],
          ]}
          icon={SchoolIcon}
          title="Orta Məktəb"
        />
        <EducationSummaryDisclosure
          complete={hasExam}
          details={[
            ["İmtahan", exam.examName],
            ["Nəticə", exam.score],
            ["Maks. bal", exam.maxScore],
            ["Tarix", exam.examDate],
          ]}
          icon={FileTextIcon}
          title="İmtahan Məlumatları"
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.2rem] border-[#dce6f4] bg-white p-0 shadow-[0_24px_70px_rgba(7,24,58,0.18)] sm:max-w-4xl">
          <DialogHeader className="border-b border-[#edf2f8] bg-gradient-to-r from-[#f8fbff] to-white p-4 pr-12">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1559b7] text-white">
                <SchoolIcon className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-[#07183a]">
                  Təhsil məlumatları
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs font-semibold leading-5 text-[#637392]">
                  Doldurulan məlumatlar müraciətə yazılır və tələbə üçün
                  növbəti müraciətlərdə avtomatik istifadə olunur.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-4 p-4">
            <section className="rounded-xl border border-[#dce6f4] bg-[#fbfdff] p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-black text-[#07183a]">
                  <SchoolIcon className="size-4 text-[#1559b7]" />
                  Orta Məktəb
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-red-500 ring-1 ring-red-100">
                  Məcburi
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <TextField
                  label="Müəssisə adı"
                  onChange={(value) =>
                    onEducationChange("institutionName", value)
                  }
                  placeholder="Məktəb / Universitet adı"
                  required
                  value={education.institutionName ?? ""}
                />
                <SelectField
                  label="Ölkə"
                  onChange={(value) => onEducationChange("country", value)}
                  options={countryOptions}
                  value={education.country ?? ""}
                />
                <TextField
                  label="Şəhər"
                  onChange={(value) => onEducationChange("city", value)}
                  placeholder="Şəhər"
                  value={education.city ?? ""}
                />
                <SelectField
                  label="Başlama ili"
                  onChange={(value) => onEducationChange("startYear", value)}
                  options={yearOptions}
                  value={education.startYear ?? ""}
                />
                <SelectField
                  label="Bitmə ili"
                  onChange={(value) => onEducationChange("endYear", value)}
                  options={yearOptions}
                  value={education.endYear ?? ""}
                />
                <SelectField
                  label="Qiymətləndirmə sistemi"
                  onChange={(value) =>
                    onEducationChange("gradingSystem", value)
                  }
                  options={[
                    { label: "Seçin...", value: "" },
                    { label: "100 ballıq sistem", value: "100" },
                    { label: "5 ballıq sistem", value: "5" },
                    { label: "10 ballıq sistem", value: "10" },
                    { label: "4.0 GPA", value: "4.0" },
                    { label: "Hərf sistemi", value: "LETTER" },
                  ]}
                  value={education.gradingSystem ?? ""}
                />
                <TextField
                  label="Orta bal"
                  onChange={(value) => onEducationChange("averageScore", value)}
                  placeholder="Məs: 85 / 4.5"
                  value={education.averageScore ?? ""}
                />
              </div>
            </section>

            <section className="rounded-xl border border-[#dce6f4] bg-[#fbfdff] p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-[#07183a]">
                <FileTextIcon className="size-4 text-[#1559b7]" />
                İmtahan Məlumatları
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <TextField
                  label="İmtahan adı"
                  onChange={(value) => onExamChange("examName", value)}
                  placeholder="IELTS, SAT, YÖS..."
                  value={exam.examName ?? ""}
                />
                <TextField
                  label="Nəticə (bal)"
                  onChange={(value) => onExamChange("score", value)}
                  placeholder="Məs: 85"
                  value={exam.score ?? ""}
                />
                <TextField
                  label="Maks. bal"
                  onChange={(value) => onExamChange("maxScore", value)}
                  placeholder="Məs: 100"
                  value={exam.maxScore ?? ""}
                />
                <TextField
                  label="İmtahan tarixi"
                  onChange={(value) => onExamChange("examDate", value)}
                  type="date"
                  value={exam.examDate ?? ""}
                />
              </div>
            </section>

            <div className="flex justify-end border-t border-[#edf2f8] pt-3">
              <Button
                className="h-10 rounded-xl bg-[#1559b7] px-5 text-xs font-black hover:bg-[#104fa5]"
                onClick={() => setOpen(false)}
                type="button"
              >
                Hazırdır
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </StepShell>
  );
}

function EducationSummaryDisclosure({
  complete,
  details,
  icon: Icon,
  title,
}: {
  complete: boolean;
  details: Array<[string, string | undefined]>;
  icon: LucideIcon;
  title: string;
}) {
  const visibleDetails = details.filter(([, value]) => Boolean(value));

  return (
    <details className="group overflow-hidden rounded-[1.05rem] border border-[#dce6f4] bg-white shadow-[0_10px_26px_rgba(29,78,216,0.035)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-[#fbfdff] px-4 py-3 transition hover:bg-[#f6f9ff] [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ff] text-[#1559b7]">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-[#07183a]">{title}</div>
            <div className="mt-0.5 text-xs font-semibold text-[#637392]">
              {complete ? "Məlumat doldurulub" : "Doldurulmayıb"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-black",
              complete
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                : "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
            )}
          >
            {complete ? "Hazır" : "Boş"}
          </span>
          <ChevronDownIcon className="size-4 text-[#637392] transition group-open:rotate-180" />
        </div>
      </summary>
      <div className="grid gap-2 border-t border-[#edf2f8] p-3">
        {visibleDetails.length > 0 ? (
          visibleDetails.map(([label, value]) => (
            <div
              className="flex items-center justify-between gap-3 rounded-lg bg-[#f8fbff] px-3 py-2 text-sm"
              key={label}
            >
              <span className="text-xs font-black uppercase text-[#637392]">
                {label}
              </span>
              <span className="min-w-0 truncate text-right font-bold text-[#07183a]">
                {value}
              </span>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-[#dce6f4] bg-[#fbfdff] px-3 py-4 text-center text-sm font-semibold text-[#637392]">
            Məlumat əlavə edilməyib.
          </div>
        )}
      </div>
    </details>
  );
}

function LegacyEducationStep({
  countries,
  education,
  exam,
  onEducationChange,
  onExamChange,
}: {
  countries: string[];
  education: WizardEducationPayload;
  exam: WizardExamPayload;
  onEducationChange: (key: keyof WizardEducationPayload, value: string) => void;
  onExamChange: (key: keyof WizardExamPayload, value: string) => void;
}) {
  const yearOptions = buildYearOptions();
  const countryOptions = [
    { label: "Seçin...", value: "" },
    ...countries.map((country) => ({ label: country, value: country })),
  ];

  return (
    <StepShell
      description="Seçdiyiniz təhsil pilləsinə uyğun keçmiş təhsil məlumatlarınızı daxil edin"
      title="Təhsil Məlumatları"
    >
      <div className="rounded-xl border border-[#dce6f4]">
        <div className="flex items-center justify-between border-b border-[#dce6f4] bg-[#f5f8fd] px-5 py-4">
          <div className="flex items-center gap-2 text-lg font-black">
            <SchoolIcon className="text-[#1559b7]" />
            Orta Məktəb
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-red-500">
            Məcburi
          </span>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-2">
          <TextField
            label="Müəssisə adı"
            onChange={(value) => onEducationChange("institutionName", value)}
            placeholder="Məktəb / Universitet adı"
            required
            value={education.institutionName ?? ""}
          />
          <SelectField
            label="Ölkə"
            onChange={(value) => onEducationChange("country", value)}
            options={countryOptions}
            value={education.country ?? ""}
          />
          <TextField
            label="Şəhər"
            onChange={(value) => onEducationChange("city", value)}
            placeholder="Şəhər"
            value={education.city ?? ""}
          />
          <SelectField
            label="Başlama ili"
            onChange={(value) => onEducationChange("startYear", value)}
            options={yearOptions}
            value={education.startYear ?? ""}
          />
          <SelectField
            label="Bitmə ili"
            onChange={(value) => onEducationChange("endYear", value)}
            options={yearOptions}
            value={education.endYear ?? ""}
          />
          <SelectField
            label="Qiymətləndirmə sistemi"
            onChange={(value) => onEducationChange("gradingSystem", value)}
            options={[
              { label: "Seçin...", value: "" },
              { label: "100 ballıq sistem", value: "100" },
              { label: "5 ballıq sistem", value: "5" },
              { label: "10 ballıq sistem", value: "10" },
              { label: "4.0 GPA", value: "4.0" },
              { label: "Hərf sistemi", value: "LETTER" },
            ]}
            value={education.gradingSystem ?? ""}
          />
          <TextField
            label="Orta bal"
            onChange={(value) => onEducationChange("averageScore", value)}
            placeholder="Məs: 85 / 4.5"
            value={education.averageScore ?? ""}
          />
        </div>
      </div>

      <div className="mt-7">
        <div className="mb-3 flex items-center gap-2 text-lg font-black">
          <FileTextIcon className="text-[#1559b7]" />
          İmtahan Məlumatları
        </div>
        <div className="grid gap-5 rounded-xl border border-[#dce6f4] p-5 md:grid-cols-2">
          <TextField
            label="İmtahan adı"
            onChange={(value) => onExamChange("examName", value)}
            placeholder="Seçin..."
            value={exam.examName ?? ""}
          />
          <TextField
            label="Nəticə (bal)"
            onChange={(value) => onExamChange("score", value)}
            placeholder="Məs: 85"
            value={exam.score ?? ""}
          />
          <TextField
            label="Maks. bal"
            onChange={(value) => onExamChange("maxScore", value)}
            placeholder="Məs: 100"
            value={exam.maxScore ?? ""}
          />
          <TextField
            label="İmtahan tarixi"
            onChange={(value) => onExamChange("examDate", value)}
            type="date"
            value={exam.examDate ?? ""}
          />
        </div>
      </div>
    </StepShell>
  );
}

void LegacyEducationStep;

function DocumentsStep({
  documentRequirements,
  existingDocuments,
  fileNames,
  levelLabel,
  selectedFileInfo,
  selectedFileNames,
  onFileChange,
}: {
  documentRequirements: ReturnType<typeof getDocumentRequirements>;
  existingDocuments: Record<string, ApplicationStudentDocument>;
  fileNames: Record<string, string>;
  levelLabel: string;
  selectedFileInfo: Record<string, SelectedDocumentFileInfo>;
  selectedFileNames: Record<string, string>;
  onFileChange: (
    key: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void | Promise<void>;
}) {
  const essentialDocuments = documentRequirements.filter(
    (document) => document.group === "essential",
  );
  const optionalDocuments = documentRequirements.filter(
    (document) => document.group === "optional",
  );
  const readyCount = documentRequirements.filter(
    (document) => fileNames[document.key],
  ).length;

  return (
    <StepShell
      description="Namizədin seçdiyi pilləyə uyğun sənəd siyahısını tamamlayın."
      title="Sənəd Yükləmə"
    >
      <div className="grid gap-3 rounded-[1rem] border border-[#dce6f4] bg-gradient-to-r from-[#f8fbff] to-white p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <GraduationCapIcon className="size-4 text-[#1559b7]" />
            <span className="text-sm font-black text-[#07183a]">
              {levelLabel || "Bakalavr və Ön Lisans Pilləsi"}
            </span>
            <span className="rounded-full bg-[#eef5ff] px-2.5 py-1 text-[11px] font-black text-[#1559b7]">
              {readyCount}/{documentRequirements.length} hazır
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#637392]">
            Şəkil faylları seçilən anda sıxışdırılır. Böyük və uyğun olmayan
            fayllar submit mərhələsini gözləmədən bloklanır.
          </p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-700">
          Ümumi seçim limiti: {formatFileSize(APPLICATION_CLIENT_TOTAL_UPLOAD_LIMIT_BYTES)}
        </div>
      </div>

      <DocumentGroup
        documents={essentialDocuments}
        existingDocuments={existingDocuments}
        fileNames={fileNames}
        label={APPLICATION_DOCUMENT_GROUPS.essential}
        note="Zəruri - indi yüklənməsi tövsiyə olunur"
        selectedFileInfo={selectedFileInfo}
        selectedFileNames={selectedFileNames}
        onFileChange={onFileChange}
      />
      <DocumentGroup
        documents={optionalDocuments}
        existingDocuments={existingDocuments}
        fileNames={fileNames}
        label={APPLICATION_DOCUMENT_GROUPS.optional}
        note="İstəyə görə - sonra da yüklənə bilər"
        selectedFileInfo={selectedFileInfo}
        selectedFileNames={selectedFileNames}
        onFileChange={onFileChange}
      />
    </StepShell>
  );
}

function ConfirmStep({
  choices,
  documentRequirements,
  education,
  exam,
  fileNames,
  selectedFileInfo,
  internalNotes,
  missingRequiredDocuments,
  personal,
  selectedCountry,
  selectedLevel,
  selectedPeriod,
  showInternalNotes,
  statusLabel,
  onNotesChange,
}: {
  choices: ApplicationProgramOption[];
  documentRequirements: ReturnType<typeof getDocumentRequirements>;
  education: WizardEducationPayload;
  exam: WizardExamPayload;
  fileNames: Record<string, string>;
  selectedFileInfo: Record<string, SelectedDocumentFileInfo>;
  internalNotes: string;
  missingRequiredDocuments: ReturnType<typeof getDocumentRequirements>;
  personal: PersonalState;
  selectedCountry: string;
  selectedLevel: string;
  selectedPeriod: string;
  showInternalNotes: boolean;
  statusLabel: string;
  onNotesChange: (value: string) => void;
}) {
  const selectedUniversityCount = new Set(
    choices.map((choice) => choice.universityId),
  ).size;

  return (
    <StepShell
      description="Məlumatları yoxlayın, draft saxlayın və ya müraciəti təsdiqləyin"
      title="Təsdiq"
    >
      {missingRequiredDocuments.length > 0 ? (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          Zəruri sənədlər çatışmır:{" "}
          {missingRequiredDocuments
            .map((document) => document.title)
            .join(", ")}
        </div>
      ) : (
        <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          Təsdiq üçün zəruri məlumatlar hazırdır.
        </div>
      )}

      <div className="grid gap-3 xl:grid-cols-4">
        <SummaryCard title="Müraciət">
          <SummaryLine label="Dönəm" value={selectedPeriod} />
          <SummaryLine label="Ölkə" value={selectedCountry} />
          <SummaryLine label="Pillə" value={selectedLevel} />
          <SummaryLine
            label="Seçimlər"
            value={`${selectedUniversityCount} universitet / ${choices.length} ixtisas`}
          />
          <SummaryLine label="Status" value={statusLabel} />
        </SummaryCard>
        <SummaryCard title="Tələbə">
          <SummaryLine label="Ad" value={personal.firstName} />
          <SummaryLine label="Soyad" value={personal.lastName} />
          <SummaryLine label="Ata adı" value={personal.fatherName} />
          <SummaryLine label="Ana adı" value={personal.motherName} />
          <SummaryLine label="Doğum tarixi" value={personal.birthDate} />
          <SummaryLine label="E-mail" value={personal.contactEmail} />
          <SummaryLine label="Portal e-mail" value={personal.loginEmail} />
          <SummaryLine label="Telefon" value={personal.phone} />
          <SummaryLine label="Vətəndaşlıq" value={personal.citizenship} />
          <SummaryLine label="Pasport" value={personal.passportNo} />
          <SummaryLine label="Şəxsiyyət no" value={personal.identityNo} />
          <SummaryLine label="Cins" value={personal.gender} />
          <SummaryLine label="Ailə vəziyyəti" value={personal.maritalStatus} />
          <SummaryLine label="Ünvan" value={personal.address} />
        </SummaryCard>
        <SummaryCard title="Təhsil">
          <SummaryLine
            label="Müəssisə"
            value={education.institutionName ?? ""}
          />
          <SummaryLine label="Ölkə" value={education.country ?? ""} />
          <SummaryLine label="Şəhər" value={education.city ?? ""} />
          <SummaryLine label="Başlama ili" value={education.startYear ?? ""} />
          <SummaryLine label="Bitmə ili" value={education.endYear ?? ""} />
          <SummaryLine
            label="Qiymətləndirmə"
            value={education.gradingSystem ?? ""}
          />
          <SummaryLine label="Orta bal" value={education.averageScore ?? ""} />
        </SummaryCard>
        <SummaryCard title="İmtahan">
          <SummaryLine label="İmtahan" value={exam.examName ?? ""} />
          <SummaryLine label="Nəticə" value={exam.score ?? ""} />
          <SummaryLine label="Maks. bal" value={exam.maxScore ?? ""} />
          <SummaryLine label="Tarix" value={exam.examDate ?? ""} />
        </SummaryCard>
      </div>

      <div className="mt-5 rounded-xl border border-[#dce6f4]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dce6f4] px-5 py-3">
          <div className="text-sm font-black uppercase text-[#637392]">
            Seçilmiş ixtisaslar
          </div>
          <div className="rounded-full bg-[#eef5ff] px-3 py-1 text-xs font-black text-[#1559b7]">
            {selectedUniversityCount} universitet / {choices.length} ixtisas
          </div>
        </div>
        <div className="divide-y divide-[#edf2f8]">
          {choices.map((choice, index) => (
            <div
              className="grid gap-2 px-5 py-4 text-sm md:grid-cols-[56px_1fr_180px_120px]"
              key={choice.id}
            >
              <div className="font-black text-[#1559b7]">#{index + 1}</div>
              <div>
                <div className="font-black text-[#07183a]">
                  {choice.programName}
                </div>
                <div className="mt-1 text-xs font-semibold text-[#637392]">
                  {choice.universityName} · {choice.language}
                </div>
              </div>
              <div className="font-bold text-[#07183a]">
                {formatMoney(choice.discountedTuitionFee, choice.currency) ||
                  formatMoney(choice.tuitionFee, choice.currency)}
              </div>
              <div className="text-[#637392]">{choice.city}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-[#dce6f4] p-5">
        <div className="mb-3 text-sm font-black uppercase text-[#637392]">
          Sənədlər
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {documentRequirements.map((document) => (
            <div
              className="flex items-center justify-between rounded-lg bg-[#f8fbff] px-3 py-2 text-sm"
              key={document.key}
            >
              <span className="font-semibold text-[#07183a]">
                {document.title}
                {document.required ? (
                  <span className="ml-1 text-red-500">*</span>
                ) : null}
              </span>
              <span
                className={cn(
                  "font-bold",
                  fileNames[document.key] ? "text-[#12b981]" : "text-[#637392]",
                )}
              >
                {fileNames[document.key]
                  ? selectedFileInfo[document.key]?.size
                    ? formatFileSize(selectedFileInfo[document.key].size)
                    : "Hazır"
                  : "Yüklənməyib"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {showInternalNotes ? (
        <label className="mt-5 block">
          <FieldLabel label="Daxili qeyd" />
          <textarea
            className="mt-2 min-h-28 w-full resize-none rounded-xl border border-[#cfd9e8] bg-white px-4 py-3 text-sm font-semibold text-[#07183a] outline-none transition focus:border-[#1559b7] focus:ring-4 focus:ring-[#1559b7]/10"
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Komanda üçün daxili qeyd"
            value={internalNotes}
          />
        </label>
      ) : null}
    </StepShell>
  );
}

function DocumentGroup({
  documents,
  existingDocuments,
  fileNames,
  label,
  note,
  selectedFileInfo,
  selectedFileNames,
  onFileChange,
}: {
  documents: ReturnType<typeof getDocumentRequirements>;
  existingDocuments: Record<string, ApplicationStudentDocument>;
  fileNames: Record<string, string>;
  label: string;
  note: string;
  selectedFileInfo: Record<string, SelectedDocumentFileInfo>;
  selectedFileNames: Record<string, string>;
  onFileChange: (
    key: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void | Promise<void>;
}) {
  if (documents.length === 0) {
    return null;
  }

  const uploadedDocuments = documents.filter(
    (document) => fileNames[document.key],
  ).length;

  return (
    <section className="mt-5">
      <div className="flex flex-col gap-2 border-b border-[#dce6f4] pb-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="flex items-center gap-2 text-base font-black uppercase text-[#1559b7]">
          <StarIcon className="size-4" />
          {label}
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#1559b7]">
          <span className="rounded-full bg-[#eef5ff] px-3 py-1 text-xs font-black">
            {uploadedDocuments}/{documents.length} hazır
          </span>
          <span>{note}</span>
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        {documents.map((document) => {
          const hasExistingDocument = Boolean(existingDocuments[document.key]);
          const hasNewFile = Boolean(selectedFileNames[document.key]);
          const isReady = Boolean(fileNames[document.key]);
          const selectedInfo = selectedFileInfo[document.key];
          const existingFile = existingDocuments[document.key];
          const fileSize =
            selectedInfo?.size ?? existingFile?.fileSize ?? null;

          return (
            <div
              className={cn(
                "grid gap-3 rounded-xl border bg-white px-3 py-2.5 shadow-sm lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center",
                selectedInfo?.tone === "error"
                  ? "border-red-200 bg-red-50/40"
                  : "border-[#dce6f4]",
              )}
              key={document.key}
            >
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl",
                  isReady
                    ? "bg-[#e8fff5] text-[#047857]"
                    : selectedInfo?.tone === "error"
                      ? "bg-red-100 text-red-600"
                      : "bg-[#f1f5f9] text-[#637392]",
                )}
              >
                {isReady ? (
                  <CheckIcon className="size-4" />
                ) : (
                  <FileTextIcon className="size-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-black text-[#07183a]">
                    {document.title}
                    {document.required ? (
                      <span className="ml-1 text-red-500">*</span>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-black",
                      document.required
                        ? "bg-red-50 text-red-600 ring-1 ring-red-100"
                        : "bg-[#f1f5f9] text-[#637392]",
                    )}
                  >
                    {document.required ? "Zəruri" : "İstəyə görə"}
                  </span>
                  {isReady ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-100">
                      Hazır
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-xs font-semibold text-[#637392]">
                  <span className="min-w-0 truncate">
                    {selectedInfo?.name ||
                      fileNames[document.key] ||
                      "Yüklənməyib"}
                  </span>
                  {fileSize ? <span>{formatFileSize(fileSize)}</span> : null}
                  {selectedInfo?.originalSize ? (
                    <span>
                      əvvəl: {formatFileSize(selectedInfo.originalSize)}
                    </span>
                  ) : null}
                </div>
                {selectedInfo ? (
                  <div
                    aria-live="polite"
                    className={cn(
                      "mt-1 rounded-lg px-2 py-1 text-xs font-bold leading-5",
                      selectedInfo.tone === "success" &&
                        "bg-emerald-50 text-emerald-700",
                      selectedInfo.tone === "warning" &&
                        "bg-amber-50 text-amber-700",
                      selectedInfo.tone === "error" && "bg-red-50 text-red-700",
                    )}
                  >
                    {selectedInfo.message}
                  </div>
                ) : document.note ? (
                  <div className="mt-1 text-xs font-semibold text-[#8a97b4]">
                    {document.note}
                  </div>
                ) : null}
                <div className="sr-only">
                  {fileNames[document.key] || "Yüklənməyib"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1559b7] px-3 text-xs font-black text-white transition hover:bg-[#104fa5]">
                  <UploadCloudIcon className="size-4" />
                  {isReady ? "Dəyişdir" : "Yüklə"}
                  <input
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
                    className="sr-only"
                    name={`document.${document.key}`}
                    onChange={(event) => onFileChange(document.key, event)}
                    type="file"
                  />
                </label>
                {isReady ? (
                  <span
                    aria-live="polite"
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-black",
                      hasNewFile
                        ? "bg-[#e8fff5] text-[#047857]"
                        : "bg-[#eef5ff] text-[#1559b7]",
                    )}
                  >
                    <CheckIcon className="size-3.5" />
                    {hasNewFile
                      ? "Yeni fayl seçildi"
                      : hasExistingDocument
                        ? "Mövcud sənəd seçildi"
                        : "Sənəd seçildi"}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StepShell({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-black text-[#07183a]">{title}</h2>
      <p className="mt-1 max-w-4xl text-sm font-medium leading-6 text-[#51627f]">
        {description}
      </p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ChoiceCard({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "flex min-h-32 flex-col items-center justify-center gap-4 rounded-[1rem] border-2 bg-white px-4 py-5 text-center transition",
        active
          ? "border-[#1559b7] bg-[#eaf2ff] shadow-[0_0_0_4px_rgba(21,89,183,0.08)]"
          : "border-[#dce6f4] hover:border-[#1559b7]/40 hover:bg-[#f8fbff]",
      )}
      onClick={onClick}
      type="button"
    >
      <Icon className="size-8 text-[#1559b7]" />
      <span className="text-base font-black text-[#07183a]">{label}</span>
    </button>
  );
}

function SearchField({
  className,
  label,
  onChange,
  placeholder,
  value,
}: {
  className?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className={cn("relative block", className)}>
      <FieldLabel label={label} />
      <SearchIcon className="pointer-events-none absolute left-3 top-[34px] size-4 text-[#8a97b4]" />
      <input
        className="mt-1.5 h-10 w-full rounded-xl border border-[#dce6f4] bg-white px-4 pl-10 text-sm font-semibold text-[#07183a] outline-none transition placeholder:text-[#9aa7bd] focus:border-[#1559b7] focus:ring-4 focus:ring-[#1559b7]/10"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
    </label>
  );
}

function TextField({
  className,
  label,
  onChange,
  placeholder,
  required = false,
  type = "text",
  value,
}: {
  className?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className={cn("block", className)}>
      <FieldLabel label={label} required={required} />
      <input
        className="mt-1.5 h-10 w-full rounded-xl border border-[#dce6f4] bg-white px-3 text-sm font-semibold text-[#07183a] outline-none transition placeholder:text-[#9aa7bd] focus:border-[#1559b7] focus:ring-4 focus:ring-[#1559b7]/10"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="block">
      <FieldLabel label={label} />
      <select
        className="mt-1.5 h-10 w-full rounded-xl border border-[#dce6f4] bg-white px-3 text-sm font-semibold text-[#07183a] outline-none transition focus:border-[#1559b7] focus:ring-4 focus:ring-[#1559b7]/10"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value || "__empty"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FieldLabel({
  label,
  required = false,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <span className="text-xs font-black uppercase text-[#637392]">
      {label} {required ? <span className="text-red-500">*</span> : null}
    </span>
  );
}

function SummaryCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-xl border border-[#dce6f4] bg-[#fbfdff] p-3">
      <div className="mb-2 text-xs font-black uppercase text-[#1559b7]">
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="font-bold text-[#637392]">{label}</span>
      <span className="max-w-[65%] break-words text-right font-black text-[#07183a]">
        {value || "Daxil edilməyib"}
      </span>
    </div>
  );
}

function FilterChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[#dce6f4] bg-[#f8fbff] px-3 py-1">
      {children}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-[#cfd9e8] bg-[#f8fbff] text-center">
      <FileTextIcon className="mb-3 size-8 text-[#1559b7]" />
      <div className="font-black text-[#07183a]">{text}</div>
    </div>
  );
}

function getProgramUniversityOptions(programs: ApplicationProgramOption[]) {
  const grouped = new Map<
    string,
    {
      city: string;
      id: string;
      name: string;
      programCount: number;
      type: string;
    }
  >();

  for (const program of programs) {
    const current = grouped.get(program.universityId);

    if (current) {
      current.programCount += 1;
    } else {
      grouped.set(program.universityId, {
        city: program.city,
        id: program.universityId,
        name: program.universityName,
        programCount: 1,
        type: program.universityType,
      });
    }
  }

  return Array.from(grouped.values()).sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

function matchesSearch(value: string | null | undefined, query: string) {
  if (!query.trim()) {
    return true;
  }

  return normalizeSearch(value).includes(normalizeSearch(query));
}

function normalizeSearch(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getChoiceKey(choice: WizardChoicePayload) {
  return `${choice.universityId}:${choice.programId}:${choice.tuitionId ?? ""}`;
}

function getProgramChoiceKey(program: ApplicationProgramOption) {
  return `${program.universityId}:${program.programId}:${program.tuitionId ?? ""}`;
}

function getExistingDocumentFileNames(
  documents: Record<string, ApplicationStudentDocument>,
) {
  return Object.fromEntries(
    Object.entries(documents).map(([key, document]) => [
      key,
      document.fileName,
    ]),
  );
}

function buildExistingDocumentPayload(
  documents: Record<string, ApplicationStudentDocument>,
  selectedFileNames: Record<string, string>,
): WizardExistingDocumentPayload[] {
  return Object.entries(documents)
    .filter(([key]) => !selectedFileNames[key])
    .map(([key, document]) => ({
      documentId: document.id,
      documentKey: key,
    }));
}

function buildCitizenshipOptions(options: ApplicationCreateOptions) {
  const values = new Set([
    "Azərbaycan",
    "Türkiyə",
    "Rusiya",
    "Gürcüstan",
    "İran",
    "Qazaxıstan",
    "Özbəkistan",
    "Türkmənistan",
    "Digər",
  ]);

  if (options.currentStudent?.citizenship) {
    values.add(options.currentStudent.citizenship);
  }

  for (const student of options.students) {
    if (student.citizenship) {
      values.add(student.citizenship);
    }
  }

  return Array.from(values).map((value) => ({ label: value, value }));
}

function getClientDocumentFileError(file: File) {
  if (file.size > APPLICATION_DOCUMENT_UPLOAD_MAX_BYTES) {
    return `Fayl ${formatFileSize(APPLICATION_DOCUMENT_UPLOAD_MAX_BYTES)} limitindən böyükdür.`;
  }

  if (
    file.type &&
    !APPLICATION_DOCUMENT_UPLOAD_MIME_TYPES.includes(
      file.type as (typeof APPLICATION_DOCUMENT_UPLOAD_MIME_TYPES)[number],
    )
  ) {
    return "Bu fayl formatı qəbul edilmir.";
  }

  return "";
}

function getSelectedUploadTotalBytes(
  files: Record<string, SelectedDocumentFileInfo>,
  exceptKey: string,
) {
  return Object.entries(files).reduce((total, [key, file]) => {
    if (key === exceptKey || file.tone === "error") {
      return total;
    }

    return total + file.size;
  }, 0);
}

function isCompressibleImage(file: File) {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

async function compressImageFile(file: File) {
  const image = await loadImage(file);
  const largestEdge = Math.max(image.naturalWidth, image.naturalHeight);
  const ratio =
    largestEdge > IMAGE_COMPRESSION_MAX_EDGE
      ? IMAGE_COMPRESSION_MAX_EDGE / largestEdge
      : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let bestBlob: Blob | null = null;

  for (const quality of IMAGE_COMPRESSION_QUALITIES) {
    const blob = await canvasToBlob(canvas, "image/jpeg", quality);

    if (!blob) {
      continue;
    }

    if (!bestBlob || blob.size < bestBlob.size) {
      bestBlob = blob;
    }

    if (blob.size <= file.size * 0.7) {
      break;
    }
  }

  if (!bestBlob || bestBlob.size >= file.size) {
    return null;
  }

  return new File([bestBlob], replaceFileExtension(file.name, "jpg"), {
    lastModified: Date.now(),
    type: "image/jpeg",
  });
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };
    image.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function replaceInputFile(input: HTMLInputElement, file: File) {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  input.files = dataTransfer.files;
}

function replaceFileExtension(fileName: string, extension: string) {
  const baseName = fileName.replace(/\.[^.]+$/, "");
  return `${baseName}.${extension}`;
}

function formatFileSize(bytes: number | null | undefined) {
  if (!bytes) {
    return "";
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function buildYearOptions() {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1949 + 8 }, (_, index) =>
    String(currentYear + 8 - index),
  );

  return [
    { label: "Seçin...", value: "" },
    ...years.map((year) => ({ label: year, value: year })),
  ];
}

function getAvailableCountriesForPeriod(
  options: ApplicationCreateOptions,
  periodId: string,
) {
  if (!periodId) {
    return [];
  }

  const universitiesByCountry = new Map<string, Set<string>>();

  for (const program of options.programs) {
    if (program.periodId !== periodId) {
      continue;
    }

    const universities =
      universitiesByCountry.get(program.country) ?? new Set<string>();
    universities.add(program.universityId);
    universitiesByCountry.set(program.country, universities);
  }

  return Array.from(universitiesByCountry, ([country, universities]) => ({
    country,
    universityCount: universities.size,
  })).sort((left, right) => left.country.localeCompare(right.country));
}

function getAvailableLevelsForSelection(
  options: ApplicationCreateOptions,
  periodId: string,
  country: string,
) {
  if (!periodId || !country) {
    return [];
  }

  const levelIds = new Set(
    options.programs
      .filter(
        (program) =>
          program.periodId === periodId && program.country === country,
      )
      .map((program) => program.educationLevelId),
  );

  return options.levels.filter((level) => levelIds.has(level.educationLevelId));
}

function getPrefilledProgram(
  options: ApplicationCreateOptions,
  prefill?: ApplicationWizardPrefill,
) {
  if (!prefill?.programId) {
    return null;
  }

  return (
    options.programs.find(
      (program) =>
        program.programId === prefill.programId &&
        (!prefill.tuitionId || program.tuitionId === prefill.tuitionId) &&
        (!prefill.universityId ||
          program.universityId === prefill.universityId),
    ) ??
    options.programs.find(
      (program) => program.programId === prefill.programId,
    ) ??
    null
  );
}

function getLevelKeyForEducationLevel(
  options: ApplicationCreateOptions,
  educationLevelId: string,
) {
  return (
    options.levels.find((level) => level.educationLevelId === educationLevelId)
      ?.key ?? ""
  );
}

function getLevelIcon(icon: string): LucideIcon {
  if (icon === "university") {
    return LandmarkIcon;
  }

  if (icon === "book") {
    return BookOpenIcon;
  }

  if (icon === "flask") {
    return FlaskConicalIcon;
  }

  if (icon === "atom") {
    return AtomIcon;
  }

  return GraduationCapIcon;
}

function formatMoney(value: number | null, currency: string) {
  if (!value) {
    return "";
  }

  return `${new Intl.NumberFormat("en-US").format(value)} ${currency}`;
}

function getStepError(step: number) {
  if (step === 0) {
    return "Davam etmək üçün dönəm seçin.";
  }

  if (step === 1) {
    return "Davam etmək üçün ölkə seçin.";
  }

  if (step === 2) {
    return "Davam etmək üçün təhsil pilləsi seçin.";
  }

  if (step === 3) {
    return "Davam etmək üçün ən azı bir ixtisas seçin.";
  }

  if (step === 4) {
    return "Ad və soyad daxil edilməlidir.";
  }

  if (step === 5) {
    return "Orta məktəb müəssisə adı daxil edilməlidir.";
  }

  return "";
}
