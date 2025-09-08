import React, { ReactNode } from "react";
import OrganizationProvider from "@/contexts/organization-context";
import WorkspaceProvider from "@/contexts/workspace-context";
import ProjectProvider from "@/contexts/project-context";
import Header from "@/components/layout/Header";
import { Toaster } from "sonner";
import { useRouter } from "next/router";

interface CommonProvidersProps {
  children: ReactNode;
}

export default function OrgProviders({ children }: CommonProvidersProps) {
  const router = useRouter();
  return (
    <>
      <OrganizationProvider>
        <WorkspaceProvider>
          <ProjectProvider>
            <div className="min-h-screen bg-[var(--background)] ">
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* <Header /> */}
                <div className="flex-1 overflow-y-auto">{children}</div>
              </div>
              <Toaster />
            </div>
          </ProjectProvider>
        </WorkspaceProvider>
      </OrganizationProvider>
    </>
  );
}
