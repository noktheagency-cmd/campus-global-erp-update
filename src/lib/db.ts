import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  loggedConnectionInfo?: boolean;
  pgPool?: Pool;
  prisma?: PrismaClient;
};

type PoolerMode = "session" | "transaction";

function createPrismaClient() {
  const pool = getPgPool();

  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log:
      process.env.PRISMA_LOG_QUERIES === "true" ? ["query", "warn"] : ["warn"],
  });
}

function getPgPool() {
  if (globalForPrisma.pgPool) {
    return globalForPrisma.pgPool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }

  const poolerMode = getPoolerMode();
  const normalizedConnectionString = normalizePoolerConnectionString(
    normalizePostgresConnectionString(connectionString),
    poolerMode,
  );
  const sslConfig = configureDatabaseSsl(normalizedConnectionString);
  const max = getPoolMax(poolerMode);

  globalForPrisma.pgPool = new Pool({
    allowExitOnIdle: true,
    connectionString: sslConfig.connectionString,
    connectionTimeoutMillis: getPoolTimeoutMillis(
      "DATABASE_POOL_CONNECT_TIMEOUT_MS",
      30_000,
    ),
    idleTimeoutMillis: getPoolTimeoutMillis(
      "DATABASE_POOL_IDLE_TIMEOUT_MS",
      60_000,
    ),
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
    max,
    ssl: sslConfig.ssl,
  });

  logConnectionInfo(sslConfig.connectionString, poolerMode, max);

  globalForPrisma.pgPool.on("error", (error) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(`Postgres pool error: ${error.message}`);
    }
  });

  return globalForPrisma.pgPool;
}

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, receiver);

    return typeof value === "function" ? value.bind(client) : value;
  },
});

function normalizePostgresConnectionString(connectionString: string) {
  const trimmed = connectionString.trim();
  const protocolEnd = trimmed.indexOf("://");

  if (protocolEnd === -1) {
    return trimmed;
  }

  const protocol = trimmed.slice(0, protocolEnd + 3);
  const rest = trimmed.slice(protocolEnd + 3);
  const atIndex = rest.lastIndexOf("@");

  if (atIndex === -1) {
    return trimmed;
  }

  const credentials = rest.slice(0, atIndex);
  const hostAndPath = rest.slice(atIndex + 1);
  const separatorIndex = credentials.indexOf(":");

  if (separatorIndex === -1) {
    return trimmed;
  }

  const user = credentials.slice(0, separatorIndex);
  const password = credentials.slice(separatorIndex + 1);

  return `${protocol}${encodeURIComponent(safeDecode(user))}:${encodeURIComponent(
    safeDecode(password),
  )}@${hostAndPath}`;
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizePoolerConnectionString(
  connectionString: string,
  poolerMode: PoolerMode,
) {
  try {
    const url = new URL(connectionString);
    const isSupabasePooler = url.hostname.endsWith(".pooler.supabase.com");

    if (isSupabasePooler) {
      url.port = poolerMode === "transaction" ? "6543" : "5432";
      return url.toString();
    }
  } catch {
    return connectionString;
  }

  return connectionString;
}

function configureDatabaseSsl(connectionString: string) {
  const configuredCa = process.env.DATABASE_SSL_CA?.trim();
  if (!configuredCa) return { connectionString };

  try {
    const url = new URL(connectionString);
    url.searchParams.delete("sslmode");
    url.searchParams.delete("sslcert");
    url.searchParams.delete("sslkey");
    url.searchParams.delete("sslrootcert");
    return {
      connectionString: url.toString(),
      ssl: {
        ca: configuredCa.replace(/\\n/g, "\n"),
        rejectUnauthorized: true as const,
      },
    };
  } catch {
    return { connectionString };
  }
}

function getPoolerMode(): PoolerMode {
  const configured = process.env.DATABASE_POOLER_MODE?.trim().toLowerCase();

  if (configured === "session" || configured === "transaction") {
    return configured;
  }

  return process.env.NODE_ENV === "production" ? "transaction" : "session";
}

function getPoolMax(poolerMode: PoolerMode) {
  const configured =
    process.env.DATABASE_POOL_MAX ?? process.env.POSTGRES_POOL_MAX;
  const fallback = poolerMode === "transaction" ? 3 : 5;

  if (!configured) {
    return fallback;
  }

  const parsed = Number(configured);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.floor(parsed));
}

function logConnectionInfo(
  connectionString: string,
  poolerMode: PoolerMode,
  max: number,
) {
  if (
    globalForPrisma.loggedConnectionInfo ||
    (process.env.NODE_ENV === "production" &&
      process.env.DATABASE_LOG_CONNECTION_INFO !== "true")
  ) {
    return;
  }

  globalForPrisma.loggedConnectionInfo = true;

  try {
    const url = new URL(connectionString);
    const host = url.hostname;
    const port = url.port || "5432";
    const family = host.endsWith(".pooler.supabase.com")
      ? "supabase-pooler"
      : host.endsWith(".supabase.co")
        ? "supabase-direct"
        : "postgres";

    console.info(
      `Postgres pool: family=${family} mode=${poolerMode} host=${host} port=${port} max=${max}`,
    );
  } catch {
    console.info(`Postgres pool: mode=${poolerMode} max=${max}`);
  }
}

function getPoolTimeoutMillis(name: string, fallback: number) {
  const configured = process.env[name];

  if (!configured) {
    return fallback;
  }

  const parsed = Number(configured);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1_000, Math.floor(parsed));
}
