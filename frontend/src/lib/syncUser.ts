import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { User } from "@/lib/schema";

export async function syncUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const firstName = clerkUser.firstName ?? "";
  const lastName = clerkUser.lastName ?? "";
  const imageUrl = clerkUser.imageUrl ?? "";

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(users)
      .set({ email, firstName, lastName, imageUrl, updatedAt: new Date() })
      .where(eq(users.clerkId, userId))
      .returning();
    return updated;
  }

  const [newUser] = await db
    .insert(users)
    .values({
      clerkId: userId,
      email,
      firstName,
      lastName,
      imageUrl,
      plan: "free",
      onboardingCompletedAt: null,
    })
    .returning();

  return newUser;
}
