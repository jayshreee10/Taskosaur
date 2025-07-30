"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/contexts/organization-context";
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

    localStorage.setItem("currentOrganizationId", organization.id);

    window.dispatchEvent(new CustomEvent("organizationChanged"));

    if (onOrganizationChange) {
      onOrganizationChange(organization);
    }
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
          className="flex items-center gap-3 px-3 py-2 h-9 min-w-[180px] bg-[var(--background)] hover:bg-[var(--accent)]/50 transition-all duration-200 rounded-lg"
        >
          {currentOrganization ? (
            <>
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-[var(--primary-foreground)] text-xs font-semibold">
                  {getInitials(currentOrganization.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)] truncate leading-tight">
                  {currentOrganization.name}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] truncate leading-tight">
                  {currentOrganization._count?.members || 0} members
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarFallback className="bg-[var(--muted)]">
                  <HiOfficeBuilding
                    size={14}
                    className="text-[var(--muted-foreground)]"
                  />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-[var(--muted-foreground)] truncate">
                Select Organization
              </span>
            </div>
          )}

          <HiChevronDown
            size={14}
            className="text-[var(--muted-foreground)] flex-shrink-0"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-80 p-0 bg-[var(--background)] border-[var(--border)] shadow-lg backdrop-blur-sm"
        align="start"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[var(--primary)]/5 to-[var(--primary)]/10 border-b border-[var(--border)]/30">
          <span className="text-sm font-semibold text-[var(--foreground)]">
            Organizations
          </span>
          <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-1 rounded-md">
            {organizations.length} total
          </span>
        </div>

        <div className="p-2">
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
                  className={`flex items-center gap-4 px-4 py-4 rounded-lg cursor-pointer hover:bg-[var(--accent)]/50 transition-all duration-200 ${
                    currentOrganization?.id === organization.id
                      ? "bg-[var(--primary)]/10 border border-[var(--primary)]/20"
                      : ""
                  }`}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-[var(--primary)]/20">
                    <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-[var(--primary-foreground)] text-sm font-bold">
                      {getInitials(organization.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)] truncate mb-1">
                      {organization.name}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                      {organization._count?.members || 0} members •{" "}
                      {organization._count?.workspaces || 0} workspaces
                    </p>
                  </div>
                  {currentOrganization?.id === organization.id && (
                    <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
                      <HiCheck
                        size={14}
                        className="text-[var(--primary-foreground)]"
                      />
                    </div>
                  )}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator className="my-2" />

              <DropdownMenuItem
                onClick={() => router.push("/settings/organizations")}
                className="flex items-center gap-4 px-4 py-4 rounded-lg cursor-pointer text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                  <HiCog size={16} className="text-[var(--primary)]" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-semibold">
                    Manage Organizations
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                    Settings and preferences
                  </div>
                </div>
              </DropdownMenuItem>
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
