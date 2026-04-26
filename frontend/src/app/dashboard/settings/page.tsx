import { getDbUser } from "@/lib/getDbUser";
import { redirect } from "next/navigation";
import { SettingsDashboard } from "@/components/settings/SettingsDashboard";

export default async function SettingsPage() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");

  return (
    <SettingsDashboard
      user={{
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        plan: user.plan,
        createdAt: user.createdAt.toISOString(),
      }}
    />
  );
}
