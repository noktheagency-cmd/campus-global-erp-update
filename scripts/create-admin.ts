import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { Pool } from "pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";

config({ path: ".env" });

async function createAdmin() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    await prisma.user.upsert({
      where: { email: "admin@campusglobal.az" },
      update: {
        passwordHash: hashPassword("admin123"),
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      },
      create: {
        id: "usr_super_admin",
        email: "admin@campusglobal.az",
        name: "Super Admin",
        passwordHash: hashPassword("admin123"),
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      },
    });

    console.log("✓ Admin user created/updated successfully");
    console.log("Email: admin@campusglobal.az");
    console.log("Password: admin123");
  } catch (error) {
    console.error("Error:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

void createAdmin();
