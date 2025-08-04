"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/contexts/organization-context";
import { setCurrentOrganizationId } from "@/utils/hierarchyContext";
import { HiChevronDown, HiCheck, HiCog } from "react-icons/hi2";
import { HiOfficeBuilding } from "react-icons/hi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";

interface Organization {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  avatar?: string | null;
  website?: string;
  _count?: {
    members: number;
    workspaces: number;
  };
  userRole?: string;
  joinedAt?: string;
  isOwner?: boolean;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
}

interface OrganizationSelectorProps {
  onOrganizationChange?: (organization: Organization) => void;
}

export default function OrganizationSelector({
  onOrganizationChange,
}: OrganizationSelectorProps) {
  const router = useRouter();
  const { getOrganizationsByUser } = useOrganization();
  const { getCurrentUser } = useAuth();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] =
    useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const currentUser = getCurrentUser();
  if (!currentUser?.id) {
    throw new Error("User not authenticated");
  }

  const [userId, setUserId] = useState<string | null>(currentUser?.id);

  // Get user ID from localStorage
  useEffect(() => {
    try {
      const userString = localStorage.getItem("user");
      if (userString) {
        const user: User = JSON.parse(userString);
        const { id } = user;
        setUserId(id);
      } else {
        console.error("No user found in localStorage");
      }
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
    }
  }, []);

  // Fetch organizations when userId is available
  useEffect(() => {
    if (!userId) return;

    const fetchOrganizations = async () => {
      try {
        setIsLoading(true);

        const organizations: Organization[] = await getOrganizationsByUser(
          userId
        );
        setOrganizations(organizations);

        // Check if there's a saved organization ID in localStorage
        const savedOrgId = localStorage.getItem("currentOrganizationId");
        let selectedOrg: Organization | null = null;

        if (savedOrgId) {
          // Find the organization that matches the saved ID
          selectedOrg =
            organizations.find((org) => org.id === savedOrgId) || null;
        }

        // If no saved org or saved org not found, use first organization
        if (!selectedOrg && organizations.length > 0) {
          selectedOrg = organizations[0];
          // Save the first organization ID to localStorage
          if (selectedOrg) {
            localStorage.setItem("currentOrganizationId", selectedOrg.id);
            // Dispatch event to notify other components
            window.dispatchEvent(new CustomEvent("organizationChanged"));
          }
        }

        setCurrentOrganization(selectedOrg);
      } catch (error) {
        console.error("Error fetching organizations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const handleOrganizationSelect = (organization: Organization) => {
    setCurrentOrganization(organization);

    // This will set the new organization ID and automatically clear workspace/project context
    setCurrentOrganizationId(organization.id);

    window.dispatchEvent(new CustomEvent("organizationChanged"));

    if (onOrganizationChange) {
      onOrganizationChange(organization);
    }

    // Navigate to dashboard when organization changes
    // This ensures user doesn't stay on workspace/project pages that belong to the old organization
    router.replace("/dashboard");
  };

  const getInitials = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || "?";
  };

  if (isLoading || !userId) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 h-9 rounded-lg bg-[var(--background)] animate-pulse min-w-[180px]">
        <div className="w-6 h-6 bg-[var(--muted)] rounded-md"></div>
        <div className="space-y-1 flex-1">
          <div className="w-20 h-3 bg-[var(--muted)] rounded"></div>
          <div className="w-12 h-2 bg-[var(--muted)] rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="cursor-pointer flex items-center gap-2 h-9 px-2 hover:bg-[var(--accent)]/50 transition-colors min-w-0 rounded-md"
        >
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarFallback className="bg-[var(--primary)] text-[var(--primary-foreground)] text-[13px] font-semibold">
              {currentOrganization ? getInitials(currentOrganization.name) : "O"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex text-left min-w-0 flex-1">
            <div className="text-sm font-medium text-[var(--foreground)] leading-none truncate max-w-[80px]">
              {currentOrganization ? currentOrganization.name : "Organization"}
            </div>
          </div>
          <HiChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-60 p-0 bg-[var(--background)] border-[var(--border)] shadow-lg backdrop-blur-sm"
        align="end"
        sideOffset={6}
      >
        {/* Organization Profile Header */}
        <div className="flex items-center gap-4 px-4 py-2 bg-gradient-to-r from-[var(--primary)]/5 to-[var(--primary)]/10 border-b border-[var(--border)]/30">
          <Avatar className="size-7 flex-shrink-0 ring-1 ring-[var(--primary)]/20">
            <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-[var(--primary-foreground)] font-bold text-sm">
              {currentOrganization ? getInitials(currentOrganization.name) : "O"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-[var(--foreground)] truncate mb-0">
              {currentOrganization ? currentOrganization.name : "Organization"}
            </div>
            <div className="text-xs text-[var(--muted-foreground)] truncate mb-0">
              {currentOrganization ? `${currentOrganization._count?.members || 0} members` : ""}
            </div>
            <Badge
              variant="secondary"
              className="text-[12px] font-medium bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 px-2 mt-2 "
            >
              Org
            </Badge>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-2">
          {/* List organizations */}
          {organizations.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="w-12 h-12 rounded-lg bg-[var(--muted)] flex items-center justify-center mx-auto mb-4">
                <HiOfficeBuilding
                  size={20}
                  className="text-[var(--muted-foreground)]"
                />
              </div>
              <p className="text-sm font-medium text-[var(--foreground)] mb-2">
                No organizations found
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Contact your admin to get access
              </p>
            </div>
          ) : (
            <>
              {organizations.map((organization) => (
                <DropdownMenuItem
                  key={organization.id}
                  onClick={() => handleOrganizationSelect(organization)}
                  className={`flex items-center gap-2 px-2 rounded cursor-pointer hover:bg-[var(--accent)]/50 transition-all duration-200 ${
                    currentOrganization?.id === organization.id
                      ? "bg-[var(--primary)]/10 border border-[var(--primary)]/20"
                      : ""
                  }`}
                >
                  <Avatar className="h-7 w-7 flex-shrink-0 ring-1 ring-[var(--primary)]/20">
                    <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-[var(--primary-foreground)] font-bold text-sm">
                      {getInitials(organization.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-xs font-semibold text-[var(--foreground)] mb-0">
                      {organization.name}
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)] leading-relaxed">
                      {organization._count?.members || 0} members
                    </div>
                  </div>
                  {currentOrganization?.id === organization.id && (
                    <div className="size-2 rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
                      <HiCheck
                        size={8}
                        className="text-[var(--primary-foreground)] "
                      />
                    </div>
                  )}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator className="my-1" />
              <div className="pt-2 pb-1 px-2 border-t border-[var(--border)] bg-[var(--background)]/80 sticky bottom-0">
                <DropdownMenuItem
                  onClick={() => router.push("/settings/organizations")}
                  className="flex items-center gap-2 w-full rounded cursor-pointer hover:bg-[var(--accent)]/50 transition-all duration-200 py-2 px-2"
                >
                  <div className="w-6 h-6 rounded bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                    <HiCog className="size-3 text-[var(--primary)]" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[var(--foreground)] mb-0">
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
