import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/shared";
import { Database, Key, Zap } from "lucide-react";

const benefits = [
  { icon: Database, text: "Connect MongoDB, PostgreSQL, MySQL" },
  { icon: Zap, text: "Query in plain English with AI" },
  { icon: Key, text: "Secure API keys for any MCP client" },
];

export default function SignUpPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-950 relative overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
        <div className="relative z-10">
          <Logo className="mb-12" />
          <h2 className="text-4xl font-bold text-white mb-4">
            Start querying in<br />
            <span className="text-indigo-300">5 minutes.</span>
          </h2>
          <p className="text-indigo-200 mb-10">
            No credit card required. Connect your first database and start getting answers immediately.
          </p>
          <ul className="space-y-4">
            {benefits.map((b) => (
              <li key={b.text} className="flex items-center gap-3 text-indigo-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/30 flex items-center justify-center shrink-0">
                  <b.icon className="w-4 h-4 text-indigo-300" />
                </div>
                {b.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-indigo-300 text-sm">© 2026 DBTalk</p>
      </div>
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo /></div>
          <SignUp
            appearance={{
              variables: {
                colorPrimary: "#6366f1",
                colorBackground: "hsl(var(--card))",
                colorText: "hsl(var(--foreground))",
                colorTextSecondary: "hsl(var(--muted-foreground))",
                colorInputBackground: "hsl(var(--background))",
                colorInputText: "hsl(var(--foreground))",
                borderRadius: "0.75rem",
              },
              elements: {
                rootBox: "w-full",
                cardBox: "shadow-none",
                card: "bg-card border border-border shadow-lg shadow-indigo-500/5",
                headerTitle: "text-foreground text-2xl font-bold",
                headerSubtitle: "text-muted-foreground",
                formFieldInput: "bg-background text-foreground border-border",
                formFieldLabel: "text-foreground",
                socialButtonsBlockButton:
                  "bg-background text-foreground border-border hover:bg-muted",
                footerActionLink: "text-indigo-400 hover:text-indigo-300",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
