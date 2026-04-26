import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { dbConnections, users } from "../db/schema.js";
import { encrypt } from "../services/connection.service.js";

async function updateCreds() {
  console.log("🔐 Updating database credentials...");

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

    // 2. Encrypt new credentials
    const newUsername = "demo_user";
    const newPassword = "password@12345";
    const credentialsEncrypted = encrypt(
      JSON.stringify({
        username: newUsername,
        password: newPassword,
      }),
    );

    // 3. Update the connection
    const [updated] = await db
      .update(dbConnections)
      .set({
        credentialsEncrypted,
      })
      .where(
        and(
          eq(dbConnections.userId, user.id),
          eq(dbConnections.label, "Local MySQL")
        )
      )
      .returning();

    if (!updated) {
      console.error("❌ Connection 'Local MySQL' not found for this user.");
      process.exit(1);
    }

    console.log("✅ Credentials updated successfully for 'Local MySQL'!");
    console.log(`New Username: ${newUsername}`);
    console.log("New Password: [REDACTED]");

    process.exit(0);
  } catch (error) {
    console.error("❌ Update failed:", error);
    process.exit(1);
  }
}

updateCreds();
