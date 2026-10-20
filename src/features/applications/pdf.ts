import { existsSync } from "node:fs";

import PDFDocument from "pdfkit";

import type { ApplicationDetailData } from "@/features/applications/data/detail-data";
import type { Prisma } from "@/generated/prisma/client";

type PdfDoc = InstanceType<typeof PDFDocument>;

const PAGE = {
  bottom: 52,
  left: 42,
  right: 42,
  top: 42,
};

const COLORS = {
  amber: "#f59e0b",
  blue: "#1559b7",
  blueSoft: "#edf5ff",
  border: "#dce6f4",
  green: "#12b981",
  ink: "#07183a",
  muted: "#637392",
  red: "#ef405d",
  slate: "#8a97b4",
  surface: "#f6f9ff",
  white: "#ffffff",
};

const PDF_APPLICATION_STATUS_LABELS: Record<string, string> = {
  ACCEPTED: "Qəbul olundu",
  ARCHIVED: "Arxiv",
  DRAFT: "Qaralama",
  ENROLLED: "Qəbul olundu",
  INVALID_DOCUMENTS: "Düzgün olmayan sənədlər",
  OFFER: "Qəbul olundu",
  REJECTED: "Qəbul uğursuz oldu",
  SUBMITTED: "Göndərildi",
  UNDER_REVIEW: "Yoxlanılır",
};

const PDF_DOCUMENT_GROUP_LABELS: Record<string, string> = {
  essential: "Əsas sənədlər",
  optional: "Digər sənədlər",
};

export async function generateApplicationPdf(data: ApplicationDetailData) {
  const doc = new PDFDocument({
    bufferPages: true,
    info: {
      Author: "Campus Global ERP",
      Subject: "Müraciət detalları",
      Title: `${data.application.code} - Müraciət`,
    },
    margin: 0,
    size: "A4",
  });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  registerFonts(doc);
  paintPageBackground(doc);
  renderHeader(doc, data);
  renderSummary(doc, data);
  renderStudentSection(doc, data);
  renderChoicesSection(doc, data);
  renderEducationSection(doc, data);
  renderDocumentsSection(doc, data);
  renderActivitySection(doc, data);
  renderFooters(doc);

  doc.end();

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function renderHeader(doc: PdfDoc, data: ApplicationDetailData) {
  const { application, summary } = data;
  const statusTone = getStatusTone(application.status);
  const startY = PAGE.top;

  roundedRect(doc, PAGE.left, startY, contentWidth(doc), 96, 18, COLORS.white);
  doc
    .roundedRect(PAGE.left, startY, contentWidth(doc), 96, 18)
    .lineWidth(1)
    .stroke(COLORS.border);

  doc
    .circle(PAGE.left + 34, startY + 36, 18)
    .fill(statusTone)
    .fillColor(COLORS.white)
    .font("AppBold")
    .fontSize(13)
    .text("CG", PAGE.left + 22, startY + 30, { width: 24, align: "center" });

  doc
    .fillColor(COLORS.ink)
    .font("AppBold")
    .fontSize(20)
    .text(application.code, PAGE.left + 66, startY + 18, {
      width: contentWidth(doc) - 210,
    });
  doc
    .fillColor(COLORS.muted)
    .font("AppRegular")
    .fontSize(9.5)
    .text(
      [
        studentName(data),
        application.period.name,
        application.country,
        application.educationLevel.name,
      ]
        .filter(Boolean)
        .join("  /  "),
      PAGE.left + 66,
      startY + 45,
      { width: contentWidth(doc) - 210 },
    );

  pill(
    doc,
    PAGE.left + contentWidth(doc) - 132,
    startY + 18,
    104,
    summary.statusLabel,
    statusTone,
    COLORS.white,
  );
  doc
    .fillColor(COLORS.muted)
    .font("AppRegular")
    .fontSize(8.5)
    .text(`PDF tarixi: ${formatDateTime(new Date())}`, PAGE.left + 66, startY + 69, {
      width: 230,
    });
  doc
    .fillColor(COLORS.muted)
    .font("AppRegular")
    .fontSize(8.5)
    .text(`Agent: ${summary.agentLabel}`, PAGE.left + 305, startY + 69, {
      width: contentWidth(doc) - 335,
      align: "right",
    });

  doc.y = startY + 118;
}

function renderSummary(doc: PdfDoc, data: ApplicationDetailData) {
  const { application, summary } = data;
  const metrics = [
    ["Status", summary.statusLabel],
    ["Göndərildi", summary.submittedAt],
    ["Seçimlər", `${application.choices.length} ixtisas`],
    ["Sənədlər", `${summary.uploadedDocuments}/${summary.totalDocuments} hazır`],
    ["Çatışmayan", String(summary.missingRequiredDocuments)],
    ["Yeniləndi", summary.updatedAt],
  ];
  const gap = 8;
  const width = (contentWidth(doc) - gap * 2) / 3;
  let x = PAGE.left;
  let y = doc.y;

  for (const [index, metric] of metrics.entries()) {
    if (index > 0 && index % 3 === 0) {
      x = PAGE.left;
      y += 58;
    }

    roundedRect(doc, x, y, width, 48, 12, COLORS.white);
    doc.roundedRect(x, y, width, 48, 12).lineWidth(0.7).stroke(COLORS.border);
    doc
      .fillColor(COLORS.slate)
      .font("AppBold")
      .fontSize(7.5)
      .text(metric[0].toUpperCase(), x + 12, y + 10, { width: width - 24 });
    doc
      .fillColor(COLORS.ink)
      .font("AppBold")
      .fontSize(10)
      .text(metric[1] || "-", x + 12, y + 25, { width: width - 24 });
    x += width + gap;
  }

  doc.y = y + 66;
}

function renderStudentSection(doc: PdfDoc, data: ApplicationDetailData) {
  const student = data.application.student;

  sectionTitle(doc, "Tələbə məlumatları", "Şəxsi və portal məlumatları");
  keyValueGrid(doc, [
    ["Ad Soyad", studentName(data)],
    ["Doğum tarixi", formatDateTime(student.birthDate)],
    ["Əlaqə e-poçtu", student.contactEmail],
    ["Portal e-poçtu", student.loginEmail],
    ["Telefon", student.phone],
    ["Pasport", student.passportNo],
    ["Şəxsiyyət nömrəsi", student.identityNo],
    ["Vətəndaşlıq", student.citizenship],
    ["Cins", student.gender],
    ["Ailə vəziyyəti", student.maritalStatus],
    ["Mərhələ", student.stage],
    ["Portal statusu", student.portalStatus],
    ["Ünvan", student.address],
    ["Tələbə ID", student.id],
  ]);
}

function renderChoicesSection(doc: PdfDoc, data: ApplicationDetailData) {
  sectionTitle(
    doc,
    "İxtisas seçimləri",
    `${data.application.choices.length} proqram secilib`,
    150,
  );

  if (data.application.choices.length === 0) {
    emptyLine(doc, "İxtisas seçimi yoxdur.");
    return;
  }

  for (const choice of data.application.choices) {
    ensureSpace(doc, 78);
    const y = doc.y;
    roundedRect(doc, PAGE.left, y, contentWidth(doc), 66, 12, COLORS.white);
    doc.roundedRect(PAGE.left, y, contentWidth(doc), 66, 12).lineWidth(0.7).stroke(COLORS.border);
    pill(doc, PAGE.left + 12, y + 13, 34, `#${choice.priority}`, COLORS.blueSoft, COLORS.blue);
    doc
      .fillColor(COLORS.ink)
      .font("AppBold")
      .fontSize(10.5)
      .text(choice.university.name, PAGE.left + 58, y + 11, { width: 220 });
    doc
      .fillColor(COLORS.muted)
      .font("AppRegular")
      .fontSize(8.5)
      .text(
        [choice.university.schoolType, choice.university.city, choice.university.country]
          .filter(Boolean)
          .join(" / "),
        PAGE.left + 58,
        y + 29,
        { width: 220 },
      );

    const tuition = choice.tuition;
    const price = tuition?.discountedTuitionFee ?? tuition?.tuitionFee ?? null;
    const status = choice.status ?? data.application.status;
    doc
      .fillColor(COLORS.ink)
      .font("AppBold")
      .fontSize(10)
      .text(choice.program.name, PAGE.left + 295, y + 11, { width: 165 });
    doc
      .fillColor(COLORS.muted)
      .font("AppRegular")
      .fontSize(8.5)
      .text(
        [
          choice.program.educationLevel?.name,
          choice.program.educationLanguage?.name,
          formatApplicationMoney(price, tuition?.currency ?? "USD"),
        ]
          .filter(Boolean)
          .join(" / "),
        PAGE.left + 295,
        y + 29,
        { width: 165 },
      );
    pill(
      doc,
      PAGE.left + contentWidth(doc) - 96,
      y + 13,
      78,
      statusLabel(status),
      getStatusTone(status),
      COLORS.white,
    );

    if (choice.statusReason) {
      doc
        .fillColor(COLORS.red)
        .font("AppRegular")
        .fontSize(8)
        .text(`Səbəb: ${choice.statusReason}`, PAGE.left + 58, y + 48, {
          width: contentWidth(doc) - 76,
        });
    }

    doc.y = y + 78;
  }
}

function renderEducationSection(doc: PdfDoc, data: ApplicationDetailData) {
  sectionTitle(doc, "Təhsil və imtahan", "Akademik tarixçə və nəticələr");
  const records = data.application.educationRecords;
  const exams = data.application.examRecords;

  if (records.length === 0 && exams.length === 0) {
    emptyLine(doc, "Təhsil və imtahan məlumatı yoxdur.");
    return;
  }

  for (const record of records) {
    keyValueGrid(doc, [
      ["Müəssisə", record.institutionName],
      ["Ölkə / şəhər", [record.country, record.city].filter(Boolean).join(" / ")],
      ["Başlama ili", record.startYear ? String(record.startYear) : ""],
      ["Bitmə ili", record.endYear ? String(record.endYear) : ""],
      ["Qiymətləndirmə", record.gradingSystem],
      ["Orta bal", record.averageScore],
      ["Zəruri", record.isRequired ? "Bəli" : "Xeyr"],
    ]);
  }

  if (exams.length > 0) {
    subTitle(doc, "İmtahanlar");
    for (const exam of exams) {
      keyValueGrid(doc, [
        ["İmtahan", exam.examName],
        ["Nəticə", exam.score],
        ["Maks. bal", exam.maxScore],
        ["Tarix", formatDateTime(exam.examDate)],
      ]);
    }
  }
}

function renderDocumentsSection(doc: PdfDoc, data: ApplicationDetailData) {
  sectionTitle(doc, "Sənədlər", "Yükləmə, baxıldı və status məlumatları");

  if (data.documents.length === 0) {
    emptyLine(doc, "Sənəd yoxdur.");
    return;
  }

  for (const document of data.documents) {
    ensureSpace(doc, 64);
    const y = doc.y;
    const group =
      PDF_DOCUMENT_GROUP_LABELS[document.documentGroup] ?? document.documentGroup;

    roundedRect(doc, PAGE.left, y, contentWidth(doc), 54, 10, COLORS.white);
    doc.roundedRect(PAGE.left, y, contentWidth(doc), 54, 10).lineWidth(0.7).stroke(COLORS.border);
    doc
      .fillColor(COLORS.ink)
      .font("AppBold")
      .fontSize(9.5)
      .text(document.title, PAGE.left + 12, y + 10, { width: 220 });
    doc
      .fillColor(COLORS.muted)
      .font("AppRegular")
      .fontSize(8)
      .text(
        [
          group,
          document.isRequired ? "Zəruri" : "İstəyə görə",
          document.fileName || "Fayl yoxdur",
        ].join(" / "),
        PAGE.left + 12,
        y + 27,
        { width: 280 },
      );

    doc
      .fillColor(COLORS.muted)
      .font("AppRegular")
      .fontSize(8)
      .text(
        [
          `Yükləndi: ${document.uploadedAt ? formatDateTime(document.uploadedAt) : "-"}`,
          `Baxıldı: ${document.reviewedAt ? formatDateTime(document.reviewedAt) : "-"}`,
        ].join("\n"),
        PAGE.left + 315,
        y + 10,
        { width: 120 },
      );
    pill(
      doc,
      PAGE.left + contentWidth(doc) - 92,
      y + 12,
      76,
      documentStatusLabel(document.status),
      getDocumentTone(document.status),
      COLORS.white,
    );

    if (document.notes) {
      doc
        .fillColor(COLORS.red)
        .font("AppRegular")
        .fontSize(8)
        .text(`Qeyd: ${document.notes}`, PAGE.left + 12, y + 41, {
          width: contentWidth(doc) - 24,
        });
    }

    doc.y = y + 64;
  }
}

function renderActivitySection(doc: PdfDoc, data: ApplicationDetailData) {
  sectionTitle(doc, "Loglar", "Son əməliyyatlar", 112);

  if (data.activities.length === 0) {
    emptyLine(doc, "Log yoxdur.");
    return;
  }

  for (const activity of data.activities.slice(0, 30)) {
    ensureSpace(doc, 42);
    const y = doc.y;
    doc
      .circle(PAGE.left + 7, y + 8, 4)
      .fill(getActivityTone(activity.action));
    doc
      .fillColor(COLORS.ink)
      .font("AppBold")
      .fontSize(8.8)
      .text(activityLabel(activity.action), PAGE.left + 20, y, { width: 170 });
    doc
      .fillColor(COLORS.muted)
      .font("AppRegular")
      .fontSize(8)
      .text(
        [
          formatDateTime(activity.createdAt),
          activity.entityType,
          activity.user?.name ?? activity.user?.email ?? "Sistem",
        ].join(" / "),
        PAGE.left + 200,
        y,
        { width: contentWidth(doc) - 220 },
      );
    const note = activitySummary(activity.newValue);
    if (note) {
      doc
        .fillColor(COLORS.muted)
        .font("AppRegular")
        .fontSize(8)
        .text(note, PAGE.left + 20, y + 16, { width: contentWidth(doc) - 20 });
      doc.y = y + 38;
    } else {
      doc.y = y + 28;
    }
  }
}

function keyValueGrid(doc: PdfDoc, items: Array<[string, unknown]>) {
  const gap = 8;
  const colWidth = (contentWidth(doc) - gap) / 2;
  let x = PAGE.left;
  let y = doc.y;

  for (const [index, [label, rawValue]] of items.entries()) {
    const value = stringifyValue(rawValue);
    const rowHeight = Math.max(
      38,
      doc.heightOfString(value || "-", {
        width: colWidth - 22,
      }) + 23,
    );

    if (index > 0 && index % 2 === 0) {
      x = PAGE.left;
      y += rowHeight + gap;
    }

    ensureSpace(doc, rowHeight + 8);
    roundedRect(doc, x, y, colWidth, rowHeight, 10, COLORS.white);
    doc.roundedRect(x, y, colWidth, rowHeight, 10).lineWidth(0.7).stroke(COLORS.border);
    doc
      .fillColor(COLORS.slate)
      .font("AppBold")
      .fontSize(7.2)
      .text(label.toUpperCase(), x + 10, y + 8, { width: colWidth - 20 });
    doc
      .fillColor(COLORS.ink)
      .font("AppRegular")
      .fontSize(8.8)
      .text(value || "-", x + 10, y + 21, { width: colWidth - 20 });

    x += colWidth + gap;
  }

  doc.y = y + 48;
}

function sectionTitle(doc: PdfDoc, title: string, meta?: string, minSpace = 62) {
  ensureSpace(doc, minSpace);
  if (doc.y > PAGE.top + 10) {
    doc.y += 6;
  }

  doc
    .fillColor(COLORS.blue)
    .font("AppBold")
    .fontSize(13)
    .text(title, PAGE.left, doc.y, { continued: false });

  if (meta) {
    doc
      .fillColor(COLORS.muted)
      .font("AppRegular")
      .fontSize(8.5)
      .text(meta, PAGE.left, doc.y + 2, {
        align: "right",
        width: contentWidth(doc),
      });
  }

  doc
    .moveTo(PAGE.left, doc.y + 10)
    .lineTo(PAGE.left + contentWidth(doc), doc.y + 10)
    .lineWidth(1)
    .stroke(COLORS.border);
  doc.y += 22;
}

function subTitle(doc: PdfDoc, title: string) {
  ensureSpace(doc, 34);
  doc
    .fillColor(COLORS.ink)
    .font("AppBold")
    .fontSize(10)
    .text(title, PAGE.left, doc.y);
  doc.y += 14;
}

function emptyLine(doc: PdfDoc, text: string) {
  ensureSpace(doc, 42);
  roundedRect(doc, PAGE.left, doc.y, contentWidth(doc), 34, 10, COLORS.white);
  doc.roundedRect(PAGE.left, doc.y, contentWidth(doc), 34, 10).lineWidth(0.7).stroke(COLORS.border);
  doc
    .fillColor(COLORS.muted)
    .font("AppRegular")
    .fontSize(9)
    .text(text, PAGE.left + 12, doc.y + 11, { width: contentWidth(doc) - 24 });
  doc.y += 44;
}

function pill(
  doc: PdfDoc,
  x: number,
  y: number,
  width: number,
  text: string,
  background: string,
  color: string,
) {
  roundedRect(doc, x, y, width, 19, 9.5, background);
  doc
    .fillColor(color)
    .font("AppBold")
    .fontSize(7.6)
    .text(text, x + 6, y + 5.5, { align: "center", width: width - 12 });
}

function roundedRect(
  doc: PdfDoc,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color: string,
) {
  doc.save().roundedRect(x, y, width, height, radius).fill(color).restore();
}

function ensureSpace(doc: PdfDoc, height: number) {
  if (doc.y + height <= doc.page.height - PAGE.bottom) {
    return;
  }

  doc.addPage();
  paintPageBackground(doc);
  doc.y = PAGE.top;
}

function paintPageBackground(doc: PdfDoc) {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.surface);
}

function renderFooters(doc: PdfDoc) {
  const range = doc.bufferedPageRange();

  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    doc
      .moveTo(PAGE.left, doc.page.height - 36)
      .lineTo(doc.page.width - PAGE.right, doc.page.height - 36)
      .lineWidth(0.7)
      .stroke(COLORS.border);
    doc
      .fillColor(COLORS.slate)
      .font("AppRegular")
      .fontSize(8)
      .text("Campus Global ERP", PAGE.left, doc.page.height - 26, {
        width: 180,
      });
    doc
      .fillColor(COLORS.slate)
      .font("AppRegular")
      .fontSize(8)
      .text(`Səhifə ${index + 1} / ${range.count}`, PAGE.left, doc.page.height - 26, {
        align: "right",
        width: contentWidth(doc),
      });
  }
}

function registerFonts(doc: PdfDoc) {
  const regular = findFont([
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
  ]);
  const bold = findFont([
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/segoeuib.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
  ]);

  if (regular) {
    doc.registerFont("AppRegular", regular);
  } else {
    doc.registerFont("AppRegular", "Helvetica");
  }

  if (bold) {
    doc.registerFont("AppBold", bold);
  } else {
    doc.registerFont("AppBold", "Helvetica-Bold");
  }

  doc.font("AppRegular");
}

function findFont(paths: string[]) {
  return paths.find((fontPath) => existsSync(fontPath));
}

function contentWidth(doc: PdfDoc) {
  return doc.page.width - PAGE.left - PAGE.right;
}

function studentName(data: ApplicationDetailData) {
  return `${data.application.student.firstName} ${data.application.student.lastName}`.trim();
}

function statusLabel(status: string) {
  return PDF_APPLICATION_STATUS_LABELS[status] ?? formatEnumLabel(status);
}

function formatApplicationMoney(value: unknown, currency = "USD") {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "";
  }

  return new Intl.NumberFormat("en", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("az", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function documentStatusLabel(status: string) {
  if (status === "UPLOADED") {
    return "Yüklənib";
  }

  if (status === "INVALID") {
    return "Problem var";
  }

  if (status === "WAIVED") {
    return "Azad edilib";
  }

  if (status === "ARCHIVED") {
    return "Arxiv";
  }

    return "Yoxdur";
}

function activityLabel(action: string) {
  const labels: Record<string, string> = {
    CREATED: "Yaradıldı",
    DOCUMENT_REVIEWED: "Sənədə baxıldı",
    DOCUMENT_STATUS_CHANGED: "Sənəd statusu",
    DOCUMENT_UPLOADED: "Sənəd yükləndi",
    STATUS_CHANGED: "Status dəyişdi",
    SUBMITTED: "Göndərildi",
    UPDATED: "Yeniləndi",
  };

  return labels[action] ?? formatEnumLabel(action);
}

function activitySummary(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  const record = value as Record<string, unknown>;
  const fields = [
    ["Status", record.statusLabel ?? record.status],
    ["Səbəb", record.reason],
    ["Sənəd", record.documentTitle ?? record.documentKey],
    ["İxtisas", record.choiceLabel ?? record.programName],
    ["Qeyd", record.notes],
  ];

  return fields
    .map(([label, rawValue]) => {
      const value = stringifyValue(rawValue);
      return value ? `${label}: ${value}` : "";
    })
    .filter(Boolean)
    .join(" / ");
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return formatDateTime(value);
  }

  if (typeof value === "object") {
    return "";
  }

  return String(value);
}

function getStatusTone(status: string) {
  if (status === "REJECTED" || status === "INVALID_DOCUMENTS") {
    return COLORS.red;
  }

  if (status === "ACCEPTED" || status === "OFFER" || status === "ENROLLED") {
    return COLORS.green;
  }

  if (status === "DRAFT") {
    return COLORS.amber;
  }

  return COLORS.blue;
}

function getDocumentTone(status: string) {
  if (status === "INVALID") {
    return COLORS.red;
  }

  if (status === "UPLOADED" || status === "WAIVED") {
    return COLORS.green;
  }

  if (status === "ARCHIVED") {
    return COLORS.slate;
  }

  return COLORS.amber;
}

function getActivityTone(action: string) {
  if (action.includes("STATUS")) {
    return COLORS.blue;
  }

  if (action.includes("DOCUMENT")) {
    return COLORS.green;
  }

  return COLORS.amber;
}
