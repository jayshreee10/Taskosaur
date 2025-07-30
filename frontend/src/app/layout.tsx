import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import AuthProvider from "@/contexts/auth-context";

export const metadata: Metadata = {
  title: "Taskosaur - Authentication",
  description:
    "Sign in or create your Taskosaur account to manage projects and tasks efficiently.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}
