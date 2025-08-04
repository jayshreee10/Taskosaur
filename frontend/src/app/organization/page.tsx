"use client";

import { useState } from "react";
import { useOrganization } from "@/contexts/organization-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
   
  HiCheck, 
  HiPlus, 
  HiChevronRight,
  HiLightBulb,
  HiUsers,
  HiCog,
  HiExclamationTriangle,
  HiGlobeAlt,
  HiInformationCircle,
  HiArrowLeft
} from "react-icons/hi2";
import { HiOfficeBuilding } from "react-icons/hi";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateOrganizationPage() {
  const { createOrganization } = useOrganization();
  const { getCurrentUser } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [theme, setTheme] = useState("light");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const router = useRouter();

  // Auto-generate slug from name
  const slug = name
    ? name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
    : "";

  // Real-time validation
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!name.trim()) {
      errors.name = "Organization name is required";
    } else if (name.length < 2) {
      errors.name = "Organization name must be at least 2 characters";
    } else if (name.length > 50) {
      errors.name = "Organization name must be less than 50 characters";
    }

    if (description && description.length > 200) {
      errors.description = "Description must be less than 200 characters";
    }

    if (website && website.trim()) {
      const urlPattern = /^https?:\/\/.+\..+/;
      if (!urlPattern.test(website.trim())) {
        errors.website = "Please enter a valid website URL";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setError(null);
    if (validationErrors.name) {
      setValidationErrors(prev => ({ ...prev, name: "" }));
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (validationErrors.description) {
      setValidationErrors(prev => ({ ...prev, description: "" }));
    }
  };

  const handleWebsiteChange = (value: string) => {
    setWebsite(value);
    if (validationErrors.website) {
      setValidationErrors(prev => ({ ...prev, website: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    const user = getCurrentUser();
    if (!user?.id) {
      setError("User not authenticated");
      setIsSubmitting(false);
      return;
    }

    try {
      await createOrganization({
        name: name.trim(),
        slug,
        description: description.trim() || undefined,
        website: website.trim() || undefined,
        settings: {
          allowInvites: true,
          requireEmailVerification: false,
          defaultRole: 'MEMBER',
          features: {
            timeTracking: false,
            customFields: false,
            automation: false,
            integrations: false,
          },
        },
        // ownerId removed: not in CreateOrganizationData type
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Failed to create organization");
    } finally {
      setIsSubmitting(false);
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-4">
        <div className="h-4 bg-[var(--muted)] rounded w-1/4"></div>
        <div className="h-10 bg-[var(--muted)] rounded"></div>
      </div>
      <div className="space-y-4">
        <div className="h-4 bg-[var(--muted)] rounded w-1/3"></div>
        <div className="h-10 bg-[var(--muted)] rounded"></div>
      </div>
      <div className="space-y-4">
        <div className="h-4 bg-[var(--muted)] rounded w-1/4"></div>
        <div className="h-20 bg-[var(--muted)] rounded"></div>
      </div>
      <div className="h-10 bg-[var(--muted)] rounded"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <HiOfficeBuilding className="size-4 text-black" />
            <h1 className="text-md font-semibold text-[var(--foreground)]">New Organization</h1>
          </div>
          <p className="text-[var(--muted-foreground)] text-xs mt-2 ">
            Set up your organization to start managing workspaces and teams
          </p>
        </div>

        {/* Create Organization Form */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b border-none pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                <HiOfficeBuilding className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-[var(--foreground)]">
                  Organization Details
                </CardTitle>
                <CardDescription className="text-sm text-[var(--muted-foreground)] mt-1">
                  Provide basic information about your organization
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 border-none">
            {isSubmitting ? (
              <LoadingSkeleton />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Card className="border-none shadow-sm bg-red-50 dark:bg-red-900/20">
                    <CardContent className="p-4 border-none">
                      <div className="flex items-start gap-3">
                        <HiExclamationTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">
                            Error creating organization
                          </h3>
                          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[var(--foreground)]" htmlFor="org-name">
                      Organization Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="org-name"
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Enter organization name"
                      required
                      disabled={isSubmitting}
                      className={`border-none shadow-sm ${
                        validationErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                    {validationErrors.name && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.name}</p>
                    )}
                    <p className="text-xs text-[var(--muted-foreground)]">
                      This will be the main identifier for your organization
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[var(--foreground)]" htmlFor="org-slug">
                      URL Slug
                    </Label>
                    <div className="relative">
                      <Input
                        id="org-slug"
                        type="text"
                        value={slug}
                        readOnly
                        className="border-none shadow-sm bg-[var(--muted)] cursor-not-allowed pr-16"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Badge variant="secondary" className="text-xs">
                          Auto
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Automatically generated from organization name
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[var(--foreground)]" htmlFor="org-description">
                    Description
                  </Label>
                  <Textarea
                    id="org-description"
                    value={description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    placeholder="Describe your organization's purpose and goals..."
                    rows={3}
                    disabled={isSubmitting}
                    className={`border-none shadow-sm resize-none ${
                      validationErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                  {validationErrors.description && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Optional - Help others understand your organization
                    </p>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {description.length}/200
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[var(--foreground)]" htmlFor="org-website">
                      Website
                    </Label>
                    <Input
                      id="org-website"
                      type="url"
                      value={website}
                      onChange={(e) => handleWebsiteChange(e.target.value)}
                      placeholder="https://example.com"
                      disabled={isSubmitting}
                      className={`border-none shadow-sm ${
                        validationErrors.website ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                    {validationErrors.website && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.website}</p>
                    )}
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Optional - Organization website or homepage
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[var(--foreground)]" htmlFor="org-theme">
                      Theme Preference
                    </Label>
                    <select
                      id="org-theme"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 bg-[var(--background)] border-none shadow-sm text-[var(--foreground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] text-sm"
                    >
                      <option value="light">Light Theme</option>
                      <option value="dark">Dark Theme</option>
                    </select>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      You can change this later in organization settings
                    </p>
                  </div>
                </div>
                <CardFooter className="flex justify-end gap-3 pt-4 border-t border-none">
                  <Link href="/settings/organizations">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      className="border-none shadow-sm text-[var(--foreground)] hover:bg-[var(--accent)]"
                    >
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !name.trim() || Object.keys(validationErrors).some(key => validationErrors[key])}
                    className="border-none shadow-sm bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] font-medium"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                        Creating Organization...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <HiPlus className="w-4 h-4" />
                        Create Organization
                      </div>
                    )}
                  </Button>
                </CardFooter>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="border-none shadow-sm bg-[var(--primary)]/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <HiInformationCircle className="w-5 h-5 text-[var(--primary)] mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
                  About Organizations
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">
                  Organizations are your top-level containers for workspaces, projects, and teams. 
                  Once created, you can switch between organizations using the selector in the header 
                  to work with different groups or companies.
                </p>
                <div className="text-sm text-[var(--muted-foreground)]">
                  <strong>What happens after creation:</strong>
                  <ul className="mt-1 space-y-1 ml-4">
                    <li>• You'll be set as the organization owner</li>
                    <li>• You can create workspaces to organize projects</li>
                    <li>• Invite team members and manage permissions</li>
                    <li>• Configure organization-wide settings and preferences</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}