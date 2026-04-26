import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { createConnection } from "../services/connection.service.js";

async function addPg() {
  console.log("🐘 Adding PostgreSQL connection...");

  try {
    // 1. Find the user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, "john.doe@example.com"))
      .limit(1);

    if (!user) {
      console.error("❌ User john.doe@example.com not found. Please run npm run db:seed first.");
      process.exit(1);
    }

    // 2. Register DB credentials (Postgres Neon)
    const connection = await createConnection(user.id, {
      label: "Neon Postgres",
      dbType: "postgresql",
      host: "ep-steep-breeze-adpaxq2h.c-2.us-east-1.aws.neon.tech",
      port: 5432,
      databaseName: "floatchat",
      username: "neondb_owner",
      password: "npg_fKtwBYZl0Cx4",
      sslEnabled: true,
    });

    console.log(`✅ PostgreSQL connection registered: ${connection.label}`);
    console.log(`Database: ${connection.databaseName}`);
    console.log(`Host:     ${connection.host}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to add Postgres connection:", error);
    process.exit(1);
  }
}

addPg();
