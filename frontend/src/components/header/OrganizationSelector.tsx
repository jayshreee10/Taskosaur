import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useOrganization } from "@/contexts/organization-context";
import { setCurrentOrganizationId } from "@/utils/hierarchyContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { HiChevronDown, HiCheck, HiCog } from "react-icons/hi2";
import { useAuth } from "@/contexts/auth-context";
import { Building } from "lucide-react";
import { Organization, User } from "@/types";

export default function OrganizationSelector({
  onOrganizationChange,
}: {
  onOrganizationChange?: (o: Organization) => void;
}) {
  const router = useRouter();
  const { getUserOrganizations } = useOrganization();
  const { getCurrentUser } = useAuth();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] =
    useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isFetchingOnOpen, setIsFetchingOnOpen] = useState(false);

  const currentUser: User | null = getCurrentUser() ?? null;

  // Utility function
  const getInitials = (name?: string) => name?.charAt(0)?.toUpperCase() || "?";

  // Set current organization and persist to localStorage
  const setAndPersistOrganization = (org: Organization) => {
    setCurrentOrganization(org);
    localStorage.setItem("currentOrganizationId", org.id);
    setCurrentOrganizationId(org.id);
    window.dispatchEvent(new CustomEvent("organizationChanged"));
    onOrganizationChange?.(org);
  };

  // Initial fetch on component mount with refresh logic
  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchOrganizations = async () => {
      setIsLoading(true);
      try {
        const savedOrgId = localStorage.getItem("currentOrganizationId");
        console.log(savedOrgId);
        const orgs: Organization[] =
          (await getUserOrganizations(currentUser.id)) ?? [];
        setOrganizations(orgs);

        if (orgs.length === 0) {
          setIsLoading(false);
          return;
        }

        // On refresh, check if a current orgId exists in local storage
        let selectedOrg: Organization;
        console.log(savedOrgId);
        if (savedOrgId) {
          // Try to find a matching organization from the list
          const matchingOrg = orgs.find((org) => org.id === savedOrgId);

          if (matchingOrg) {
            // If a match is found, set that as the current org
            selectedOrg = matchingOrg;
          } else {
            // If no match is found, set the first org as default
            selectedOrg = orgs[0];
          }
        } else {
          // If no orgId exists in local storage, set the first org as default
          selectedOrg = orgs[0];
        }

        // Set the selected organization
        setAndPersistOrganization(selectedOrg);
      } catch (error) {
        console.error("Error fetching organizations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, [currentUser?.id]);

  // Fetch organizations when dropdown opens (for fresh data)
  const fetchOrganizationsOnOpen = async () => {
    if (!currentUser?.id) return;

    setIsFetchingOnOpen(true);
    try {
      const orgs: Organization[] =
        (await getUserOrganizations(currentUser.id)) ?? [];
      setOrganizations(orgs);

      // Update current organization if it still exists in the fresh data
      const currentOrgId = localStorage.getItem("currentOrganizationId");
      if (currentOrgId) {
        const updatedCurrentOrg = orgs.find((org) => org.id === currentOrgId);
        if (
          updatedCurrentOrg &&
          updatedCurrentOrg.id !== currentOrganization?.id
        ) {
          setCurrentOrganization(updatedCurrentOrg);
        }
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setIsFetchingOnOpen(false);
    }
  };

  // Handle organization selection
  const handleOrganizationSelect = (org: Organization) => {
    if (!org?.id || currentOrganization?.id === org.id) return;

    setAndPersistOrganization(org);

    try {
      router.replace("/dashboard");
    } catch (error) {
      console.error("Router replace failed:", error);
    }
  };

  // Handle dropdown open/close
  const handleDropdownOpen = (open: boolean) => {
    setDropdownOpen(open);
    if (open) {
      fetchOrganizationsOnOpen();
    }
  };

  // Loading state
  if (isLoading || !currentOrganization) {
    return (
      <div className="header-org-selector-loading">
        <div className="header-org-selector-loading-avatar" />
        <div className="header-org-selector-loading-content">
          <div className="header-org-selector-loading-text-primary" />
          <div className="header-org-selector-loading-text-secondary" />
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="header-org-selector-trigger">
          <Avatar className="header-org-selector-avatar">
            <AvatarFallback className="header-org-selector-avatar-fallback">
              {getInitials(currentOrganization.name)}
            </AvatarFallback>
          </Avatar>
          <span className="header-org-selector-name">
            {currentOrganization.name}
          </span>
          <HiChevronDown className="header-org-selector-chevron" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="header-org-selector-dropdown"
        align="end"
        sideOffset={6}
      >
        {/* Current Organization Header */}
        <div className="header-org-profile-header">
          <Avatar className="header-org-profile-avatar">
            <AvatarFallback className="header-org-profile-avatar-fallback">
              {getInitials(currentOrganization.name)}
            </AvatarFallback>
          </Avatar>
          <div className="header-org-profile-info">
            <div className="header-org-profile-name">
              {currentOrganization.name}
            </div>
            <div className="header-org-profile-meta">
              {currentOrganization._count?.members ?? 0} members
              <Badge variant="secondary" className="header-org-profile-badge">
                Org
              </Badge>
            </div>
          </div>
        </div>

        {/* Organizations List */}
        <div className="header-org-list-container">
          {isFetchingOnOpen ? (
            <div className="header-org-loading-state">
              <div className="header-org-loading-spinner" />
              <p className="header-org-loading-text">
                Loading organizations...
              </p>
            </div>
          ) : organizations.length === 0 ? (
            <div className="header-org-empty-state">
              <div className="header-org-empty-icon-container">
                <Building size={20} className="header-org-empty-icon" />
              </div>
              <p className="header-org-empty-title">No organizations found</p>
              <p className="header-org-empty-description">
                Contact your admin to get access
              </p>
            </div>
          ) : (
            <>
              {organizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleOrganizationSelect(org)}
                  className={`header-org-item ${
                    currentOrganization.id === org.id
                      ? "header-org-item-active"
                      : "header-org-item-inactive"
                  }`}
                >
                  <Avatar className="header-org-item-avatar">
                    <AvatarFallback className="header-org-item-avatar-fallback">
                      {getInitials(org.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="header-org-item-info">
                    <p className="header-org-item-name">{org.name}</p>
                    <p className="header-org-item-members">
                      {org._count?.members ?? 0} members
                    </p>
                  </div>
                  {currentOrganization.id === org.id && (
                    <HiCheck size={12} className="header-org-item-check" />
                  )}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator className="my-1" />
              <div className="header-org-footer">
                <DropdownMenuItem
                  onClick={() => {
                    try {
                      router.push("/settings");
                    } catch (error) {
                      console.error("Router push failed:", error);
                    }
                  }}
                  className="header-org-manage-item"
                >
                  <div className="header-org-manage-icon-container">
                    <HiCog className="header-org-manage-icon" />
                  </div>
                  <div className="header-org-manage-text">
                    <div className="header-org-manage-title">
                      Manage Organizations
                    </div>
                  </div>
                </DropdownMenuItem>
              </div>
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
