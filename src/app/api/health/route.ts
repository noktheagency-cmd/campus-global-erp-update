import "server-only";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`select 1`;

    return Response.json(
      {
        database: "reachable",
        responseTimeMs: Date.now() - startedAt,
        status: "healthy",
      },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Health check database probe failed", {
      code:
        typeof error === "object" && error && "code" in error
          ? String(error.code)
          : "unknown",
      name: error instanceof Error ? error.name : "UnknownError",
    });

    return Response.json(
      { database: "unreachable", status: "unhealthy" },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
        status: 503,
      },
    );
  }
}
