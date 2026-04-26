import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { NavigationFeedback } from "@/components/shared/NavigationFeedback";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "DBTalk — Talk to your databases",
  description:
    "Connect MongoDB, PostgreSQL, or MySQL. Ask questions in natural language. Get answers instantly via AI and MCP.",
  keywords: ["database", "AI", "MCP", "natural language", "SQL", "MongoDB"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          cz-shortcut-listen="true"
          className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <NavigationFeedback />
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "hsl(var(--card))",
                  color: "hsl(var(--card-foreground))",
                  border: "1px solid hsl(var(--border))",
                },
              }}
            />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
