import { redirect } from "next/navigation";
import { syncUser } from "@/lib/syncUser";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await syncUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingCompletedAt) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar user={{ firstName: user.firstName, imageUrl: user.imageUrl, plan: user.plan }} />
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
