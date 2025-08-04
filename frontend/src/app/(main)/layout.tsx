import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Breadcrumb from "@/components/layout/Breadcrumb";
import WorkspaceProvider from "@/contexts/workspace-context";
import ProjectProvider from "@/contexts/project-context";
import TaskProvider from "@/contexts/task-context";
import OrganizationProvider from "@/contexts/organization-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Taskosaur - Project Management",
  description: "A lightweight Jira clone",
};

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <OrganizationProvider>
        <WorkspaceProvider>
        <ProjectProvider>
          <TaskProvider>
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              <Breadcrumb />
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </div>
          </div>
          </TaskProvider>
        </ProjectProvider>
        </WorkspaceProvider>
      </OrganizationProvider>
    </ProtectedRoute>
  );
}