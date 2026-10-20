import type {
  CommissionPackageEducationLevel,
  CommissionPackageRuleType,
  CommissionPackageScholarshipTriggerType,
} from "@/features/commissions/package-types";

type ScholarshipRule = {
  additionalInterval: number | null;
  scholarshipCount: number;
  studentThreshold: number;
  triggerType: CommissionPackageScholarshipTriggerType;
};

type MixedScholarshipRule = {
  additionalInterval: number;
  firstThreshold: number;
};

export function resolvePackageEducationLevel(
  rawName: string,
): CommissionPackageEducationLevel | null {
  const name = normalizeLevelName(rawName);
  const aliases: Array<[CommissionPackageEducationLevel, readonly string[]]> = [
    ["ASSOCIATE", ["associate", "onlisans", "subbakalavr"]],
    ["MASTER", ["master", "magistr", "yuksek lisans"]],
    ["BACHELOR", ["bachelor", "bakalavr", "lisans"]],
    ["PHD", ["phd", "doktorantura", "doktora", "doctorate"]],
    ["FOUNDATION", ["foundation", "hazirliq", "preparatory"]],
    ["LANGUAGE", ["language", "language course", "dil kursu"]],
  ];

  return (
    aliases.find(([, values]) =>
      values.some((value) => {
        const compactName = name.replaceAll(" ", "");
        const compactValue = value.replaceAll(" ", "");
        return name === value || name.includes(value) || compactName.includes(compactValue);
      }),
    )?.[0] ?? null
  );
}

export function academicYearFromPeriodYear(year: number) {
  return `${year}-${year + 1}`;
}

export function selectTierRate({
  rateTier1,
  rateTier2,
  studentOrdinal,
  tierThreshold,
}: {
  rateTier1: number;
  rateTier2: number;
  studentOrdinal: number;
  tierThreshold: number;
}) {
  return studentOrdinal <= tierThreshold ? rateTier1 : rateTier2;
}

export function calculatePackageCommission({
  amount,
  fixedAmount,
  rate,
  type,
}: {
  amount: number;
  fixedAmount: number | null;
  rate: number | null;
  type: CommissionPackageRuleType;
}) {
  if (type === "FIXED") return roundMoney(fixedAmount ?? 0);
  return roundMoney((amount * (rate ?? 0)) / 100);
}

export function calculateScholarshipCredits({
  levelRule,
  mixedStudentOrdinal,
  mixedRule,
  studentOrdinal,
}: {
  levelRule: ScholarshipRule | null;
  mixedStudentOrdinal?: number;
  mixedRule: MixedScholarshipRule | null;
  studentOrdinal: number;
}) {
  const levelCredits = calculateLevelScholarshipPackageCount(
    studentOrdinal,
    levelRule,
  );
  const mixedCredits = calculateMixedScholarshipCredits(
    mixedStudentOrdinal ?? studentOrdinal,
    mixedRule,
  );
  return Math.max(0, levelCredits + mixedCredits);
}

export function calculateLevelScholarshipPackageCount(
  studentOrdinal: number,
  rule: ScholarshipRule | null,
) {
  return rule
    ? cumulativeLevelCredits(studentOrdinal, rule) -
        cumulativeLevelCredits(studentOrdinal - 1, rule)
    : 0;
}

export function calculateMixedScholarshipCredits(
  studentOrdinal: number,
  rule: MixedScholarshipRule | null,
) {
  return rule
    ? cumulativeMixedCredits(studentOrdinal, rule) -
        cumulativeMixedCredits(studentOrdinal - 1, rule)
    : 0;
}

export function packagePaymentTermDays(type: CommissionPackageRuleType) {
  return type === "PERCENTAGE_CASH" ? 0 : 15;
}

function cumulativeLevelCredits(studentCount: number, rule: ScholarshipRule) {
  if (studentCount <= 0) return 0;
  if (rule.triggerType === "FIRST_THEN_EVERY") {
    if (
      studentCount < rule.studentThreshold ||
      !rule.additionalInterval ||
      rule.additionalInterval < 1
    ) {
      return 0;
    }
    return (
      (1 +
        Math.floor(
          (studentCount - rule.studentThreshold) / rule.additionalInterval,
        )) *
      rule.scholarshipCount
    );
  }
  return (
    Math.floor(studentCount / rule.studentThreshold) * rule.scholarshipCount
  );
}

function cumulativeMixedCredits(
  studentCount: number,
  rule: MixedScholarshipRule,
) {
  if (studentCount < rule.firstThreshold) return 0;
  return (
    1 +
    Math.floor((studentCount - rule.firstThreshold) / rule.additionalInterval)
  );
}

function normalizeLevelName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
