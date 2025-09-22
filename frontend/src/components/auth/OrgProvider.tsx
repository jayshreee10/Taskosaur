import React, { ReactNode } from "react";
import OrganizationProvider from "@/contexts/organization-context";
import WorkspaceProvider from "@/contexts/workspace-context";
import ProjectProvider from "@/contexts/project-context";
import { Toaster } from "sonner";

interface CommonProvidersProps {
  children: ReactNode;
}

export default function OrgProviders({ children }: CommonProvidersProps) {
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
