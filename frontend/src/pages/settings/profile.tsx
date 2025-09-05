"use client";
import { useAuth } from "@/contexts/auth-context";
import { HiCog6Tooth } from "react-icons/hi2";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ProfileSection from "@/components/settings/ProfileSection";
import EmailSection from "@/components/settings/EmailSection";
import PreferencesSection from "@/components/settings/PreferencesSection";
import ResetPasswordSection from "@/components/settings/ResetPasswordSection";
import DangerZoneSection from "@/components/settings/DangerZoneSection";

export default function SettingsPage() {
  const { getCurrentUser } = useAuth();
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return (
      <div className="dashboard-container">
        <div className="flex-1">
          <div className="bg-[var(--background)] transition-colors duration-200">
            <div className="mx-auto">
              <div className="border-[var(--border)] bg-[var(--card)] shadow-sm p-8 text-center rounded-md">
                <div className="w-16 h-16 rounded-full bg-[var(--muted)]/30 flex items-center justify-center mx-auto mb-4">
                  <HiCog6Tooth className="w-8 h-8 text-[var(--muted-foreground)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                  Authentication Required
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  Please log in to access your account settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="bg-[var(--background)] transition-colors duration-200 rounded-md border-none">
        <div className="mx-auto  rounded-md border-none space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            {/* Left: Title and Description */}
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
                <HiCog6Tooth className="w-5 h-5 text-[var(--primary)]" />
                Account Settings
              </h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Manage your account settings, preferences, and security options.
              </p>

              {/* User Status */}
              <div className="mt-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-[var(--foreground)]">
                  Signed in as {currentUser.firstName} {currentUser.lastName}
                </span>
                <Badge
                  variant="secondary"
                  className="text-xs bg-[var(--primary)]/10 text-[var(--primary)] border-none"
                >
                  Active
                </Badge>
              </div>
            </div>

            {/* Right: User Avatar */}
            <Avatar className="h-12 w-12 border-none">
              {currentUser?.avatar && (
                <AvatarImage
                  src={currentUser?.avatar || ""}
                  alt={
                    `${currentUser.firstName} ${currentUser.lastName}`.trim() ||
                    "Profile Picture"
                  }
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-[var(--primary)] text-[var(--primary-foreground)] font-medium text-sm">
                {`${currentUser.firstName?.charAt(0) || ""}${
                  currentUser.lastName?.charAt(0) || ""
                }`.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="space-y-6 lg:space-y-8">
            <ProfileSection />
            <EmailSection />
            <PreferencesSection />
            <ResetPasswordSection />
            <DangerZoneSection />
          </div>
        </div>
      </div>
    </div>
  );
}
