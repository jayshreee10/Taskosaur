import { useState, useEffect, useRef } from "react";
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
  const previousOrgId = useRef<string | null>(null);

  /* util */
  const getInitials = (name?: string) =>
    name?.charAt(0)?.toUpperCase() || "?";

  /* fetch orgs - initial load */
  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchOrganizations = async () => {
      setIsLoading(true);
      try {
        const orgs: Organization[] =
          (await getUserOrganizations(currentUser.id)) ?? [];
        setOrganizations(orgs);

        const savedOrgId = localStorage.getItem("currentOrganizationId");
        let selected: Organization | null = null;

        if (savedOrgId) {
          // First try to find the saved organization in the response
          selected = orgs.find((o) => o.id === savedOrgId);
        }
        
        // If saved org wasn't found or there was no saved org, default to first org
        if (!selected && orgs.length > 0) {
          selected = orgs[0];
          // Update localStorage with the new org
          localStorage.setItem("currentOrganizationId", selected.id);
        }

        if (selected) {
          setCurrentOrganization(selected);
          if (previousOrgId.current !== selected.id) {
            previousOrgId.current = selected.id;
            localStorage.setItem("currentOrganizationId", selected.id);
            setCurrentOrganizationId(selected.id);
            window.dispatchEvent(new CustomEvent("organizationChanged"));
          }
        }
      } catch (e) {
        console.error("Error fetching organizations:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, [currentUser?.id, getUserOrganizations]);

  /* fetch orgs when dropdown opens */
  const fetchOrganizationsOnOpen = async () => {
    if (!currentUser?.id) return;
    
    setIsFetchingOnOpen(true);
    try {
      const orgs: Organization[] =
        (await getUserOrganizations(currentUser.id)) ?? [];
      setOrganizations(orgs);

      // Update current organization if it exists in the new list
      const currentOrgId = localStorage.getItem("currentOrganizationId");
      if (currentOrgId) {
        const updatedCurrentOrg = orgs.find((o) => o.id === currentOrgId);
        if (updatedCurrentOrg) {
          setCurrentOrganization(updatedCurrentOrg);
        }
      }
    } catch (e) {
      console.error("Error fetching organizations:", e);
    } finally {
      setIsFetchingOnOpen(false);
    }
  };

  /* handlers */
  const handleOrganizationSelect = (org: Organization) => {
    if (!org?.id) return;
    if (currentOrganization?.id === org.id) return;

    setCurrentOrganization(org);
    localStorage.setItem("currentOrganizationId", org.id);
    setCurrentOrganizationId(org.id);
    window.dispatchEvent(new CustomEvent("organizationChanged"));
    onOrganizationChange?.(org);

    try {
      router.replace("/dashboard");
    } catch (err) {
      console.error("Router replace failed:", err);
    }
  };

  const handleDropdownOpen = (open: boolean) => {
    setDropdownOpen(open);
    if (open) {
      fetchOrganizationsOnOpen();
    }
  };

  /* UI */
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
              {getInitials(currentOrganization?.name)}
            </AvatarFallback>
          </Avatar>
          <span className="header-org-selector-name">
            {currentOrganization?.name || "Unknown Org"}
          </span>
          <HiChevronDown className="header-org-selector-chevron" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="header-org-selector-dropdown"
        align="end"
        sideOffset={6}
      >
        {/* Profile Header */}
        <div className="header-org-profile-header">
          <Avatar className="header-org-profile-avatar">
            <AvatarFallback className="header-org-profile-avatar-fallback">
              {getInitials(currentOrganization?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="header-org-profile-info">
            <div className="header-org-profile-name">
              {currentOrganization?.name || "Organization"}
            </div>
            <div className="header-org-profile-meta">
              {currentOrganization?._count?.members ?? 0} members
              <Badge variant="secondary" className="header-org-profile-badge">
                Org
              </Badge>
            </div>
          </div>
        </div>

        {/* list */}
        <div className="header-org-list-container">
          {isFetchingOnOpen ? (
            <div className="header-org-loading-state">
              <div className="header-org-loading-spinner" />
              <p className="header-org-loading-text">Loading organizations...</p>
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
                  key={org?.id}
                  onClick={() => handleOrganizationSelect(org)}
                  className={`header-org-item ${
                    currentOrganization?.id === org?.id
                      ? "header-org-item-active"
                      : "header-org-item-inactive"
                  }`}
                >
                  <Avatar className="header-org-item-avatar">
                    <AvatarFallback className="header-org-item-avatar-fallback">
                      {getInitials(org?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="header-org-item-info">
                    <p className="header-org-item-name">
                      {org?.name || "Unnamed Org"}
                    </p>
                    <p className="header-org-item-members">
                      {org?._count?.members ?? 0} members
                    </p>
                  </div>
                  {currentOrganization?.id === org?.id && (
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
                    } catch (err) {
                      console.error("Router push failed:", err);
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
