import type { Metadata } from "next";
import "../globals.css";
import AuthRedirect from "@/components/auth/AuthRedirect";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Taskosaur - Authentication",
  description:
    "Sign in or create your Taskosaur account to manage projects and tasks efficiently.",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
     <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthRedirect>
        <div className="min-h-screen bg-[var(--background)]">{children}</div>
      </AuthRedirect>
    </ThemeProvider>
  );
}
