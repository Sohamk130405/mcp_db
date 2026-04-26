import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { createApiKey } from "../services/apiKey.service.js";
import { createConnection } from "../services/connection.service.js";

async function seed() {
  console.log("🌱 Starting database seeding...");

  try {
    // 1. Create a user
    const [user] = await db
      .insert(users)
      .values({
        email: "john.doe@example.com",
        passwordHash: "placeholder_hash", // Proper auth not yet implemented
        plan: "pro",
      })
      .returning();

    console.log(`✅ User created: ${user.email} (${user.id})`);

    // 2. Register DB credentials (MySQL localhost)
    const connection = await createConnection(user.id, {
      label: "Local MySQL",
      dbType: "mysql",
      host: "localhost",
      port: 3306,
      databaseName: "test_db",
      username: "root",
      password: "password",
    });

    console.log(`✅ Database connection registered: ${connection.label}`);

    // 3. Generate API key
    const apiKey = await createApiKey(user.id, "Test API Key");

    console.log("\n🚀 Seeding completed successfully!");
    console.log("-----------------------------------------");
    console.log(`User ID:    ${user.id}`);
    console.log(`API Key ID: ${apiKey.id}`);
    console.log(`Raw API Key: ${apiKey.rawKey}`);
    console.log("-----------------------------------------");
    console.log("Use the Raw API Key above to test the MCP server.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
