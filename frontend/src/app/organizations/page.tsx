// app/organizations/page.tsx

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Header from "@/components/layout/Header";
import OrganizationSelectionPage from "@/components/organizations/OrganizationSelectionPage";
import OrganizationProvider from "@/contexts/organization-context";

export default function OrganizationsPage() {
  return (
    <ProtectedRoute requireOrganization={false}>
      <OrganizationProvider>
        <Header />
        <OrganizationSelectionPage />
      </OrganizationProvider>
    </ProtectedRoute>
  );
}
