import { redirect } from "next/navigation";
import { syncUser } from "@/lib/syncUser";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  const user = await syncUser();
  if (!user) redirect("/sign-in");
  if (user.onboardingCompletedAt) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background mesh-bg flex flex-col items-center justify-center p-4">
      <OnboardingWizard firstName={user.firstName} />
    </div>
  );
}
