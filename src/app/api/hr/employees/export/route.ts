import "server-only";

import { can } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EXPORT_BATCH_SIZE = 500;

export async function GET() {
  const session = await requirePermission("hr:read");
  const canViewPayroll = can(session.role, "hr:payroll");
  const encoder = new TextEncoder();
  let cursor: string | undefined;
  let headerSent = false;

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const rows = await prisma.hrEmployee.findMany({
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { id: "asc" },
          select: {
            currency: canViewPayroll,
            department: true,
            email: true,
            employeeCode: true,
            employmentStatus: true,
            firstName: true,
            hiredAt: true,
            id: true,
            lastName: true,
            phone: true,
            position: true,
            salary: canViewPayroll,
            workMode: true,
          },
          skip: cursor ? 1 : 0,
          take: EXPORT_BATCH_SIZE,
        });

        if (!rows.length) {
          controller.close();
          return;
        }

        const headers = [
          "Əməkdaş ID",
          "Ad soyad",
          "E-poçt",
          "Telefon",
          "Departament",
          "Vəzifə",
          "İş rejimi",
          "Status",
          "İşə başlama",
          ...(canViewPayroll ? ["Maaş", "Valyuta"] : []),
        ];
        const lines = rows.map((employee) => {
          const payrollFields = canViewPayroll
            ? [
                Number(
                  (employee as typeof employee & { salary?: unknown }).salary ??
                    0,
                ),
                (employee as typeof employee & { currency?: string })
                  .currency ?? "AZN",
              ]
            : [];

          return [
            employee.employeeCode,
            `${employee.firstName} ${employee.lastName}`.trim(),
            employee.email,
            employee.phone ?? "",
            employee.department,
            employee.position,
            employee.workMode,
            employee.employmentStatus,
            employee.hiredAt.toISOString().slice(0, 10),
            ...payrollFields,
          ]
            .map(escapeCsv)
            .join(",");
        });

        const prefix = headerSent
          ? ""
          : `\uFEFF${headers.map(escapeCsv).join(",")}\r\n`;
        headerSent = true;
        cursor = rows.at(-1)?.id;
        controller.enqueue(
          encoder.encode(`${prefix}${lines.join("\r\n")}\r\n`),
        );
      } catch (error) {
        console.error("HR employee export failed", {
          code:
            typeof error === "object" && error && "code" in error
              ? String(error.code)
              : "unknown",
          name: error instanceof Error ? error.name : "UnknownError",
        });
        controller.error(new Error("HR_EXPORT_FAILED"));
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="campus-global-hr-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function escapeCsv(value: unknown) {
  const stringValue = String(value ?? "");
  return /[",\r\n]/.test(stringValue)
    ? `"${stringValue.replace(/"/g, '""')}"`
    : stringValue;
}
