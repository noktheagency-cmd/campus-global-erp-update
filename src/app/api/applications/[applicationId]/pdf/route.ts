import { NextResponse } from "next/server";

import { getApplicationDetailData } from "@/features/applications/data/detail-data";
import { generateApplicationPdf } from "@/features/applications/pdf";
import { requireSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const [{ applicationId }, session] = await Promise.all([
    params,
    requireSession(),
  ]);
  const data = await getApplicationDetailData(applicationId, {
    includeInternal: session.portalType === "staff",
    studentId: session.portalType === "student" ? session.subjectId : undefined,
  });

  if (!data) {
    return NextResponse.json(
      { message: "Müraciət tapılmadı." },
      { status: 404 },
    );
  }

  const pdf = await generateApplicationPdf(data);
  const fileName = `${sanitizeFileName(data.application.code)}.pdf`;

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": "application/pdf",
    },
  });
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
}
