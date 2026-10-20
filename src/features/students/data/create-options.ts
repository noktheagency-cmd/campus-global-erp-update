import { cache } from "react";

import type { StudentCreateOptions } from "@/features/students/types";
import {
  getCurrentSession,
  getSessionAgentId,
} from "@/lib/auth/session";

const fallbackAgents = [
  { label: "Elnur Camalov", value: "Elnur Camalov" },
  { label: "Leyla Karimova", value: "Leyla Karimova" },
  { label: "Mina Abbasova", value: "Mina Abbasova" },
  { label: "Orhan Yilmaz", value: "Orhan Yilmaz" },
];

export const getStudentCreateOptions = cache(
  async (): Promise<StudentCreateOptions> => {
    const session = await getCurrentSession();
    const scopedAgentId = session ? getSessionAgentId(session) : null;

    if (!hasUsableDatabaseUrl()) {
      return {
        agents: scopedAgentId ? [] : fallbackAgents,
        dataSource: "fallback",
      };
    }

    try {
      const { prisma } = await import("@/lib/db");
      const agents = await prisma.agent.findMany({
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        select: {
          companyName: true,
          firstName: true,
          id: true,
          lastName: true,
        },
        where: scopedAgentId
          ? { id: scopedAgentId, portalStatus: { not: "SUSPENDED" } }
          : { portalStatus: { not: "SUSPENDED" } },
      });

      return {
        agents: agents.map((agent) => ({
          label:
            agent.companyName ||
            `${agent.firstName} ${agent.lastName}`.trim(),
          value: agent.id,
        })),
        dataSource: "database",
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`Student create options unavailable: ${String(error)}`);
      }

      return {
        agents: scopedAgentId ? [] : fallbackAgents,
        dataSource: "unavailable",
      };
    }
  },
);

function hasUsableDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}
