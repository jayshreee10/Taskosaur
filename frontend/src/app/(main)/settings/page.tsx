"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import {
  HiCog6Tooth,
  HiUser,
  HiEnvelope,
  HiBell,
  HiExclamationTriangle,
  HiShieldCheck,
  HiCheckCircle,
  HiUserCircle,
  HiGlobeAlt,
} from "react-icons/hi2";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import "@/app/globals.css";

export default function SettingsPage() {
  const {
    getCurrentUser,
    updateUser,
    updateUserEmail,
    deleteUser,
    uploadFileToS3,
  } = useAuth();
  const router = useRouter();
  const currentUser = getCurrentUser();

  // Prevent multiple simultaneous API calls
  const fetchingRef = useRef(false);
  const currentUserRef = useRef<any>(null);

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
  });

  // Email form state
  const [emailData, setEmailData] = useState({
    email: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preferences form state
  const [preferencesData, setPreferencesData] = useState({
    timezone: "(UTC-08:00) Pacific Time (US & Canada)",
    notifications: {
      comments: true,
      assignments: true,
      updates: true,
    },
  });

  const [loading, setLoading] = useState({
    profile: false,
    email: false,
    preferences: false,
    delete: false,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (image only)
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      e.target.value = ""; // reset input
      return;
    }

    setSelectedFile(file);

    // Create a preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };
  // Initialize form data with current user data
  useEffect(() => {
    if (currentUser) {
      // Prevent duplicate initialization for the same user
      if (currentUserRef.current?.id === currentUser.id) {
        return;
      }

      currentUserRef.current = currentUser;

      setProfileData({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
      });
      setEmailData({
        email: currentUser.email || "",
      });
    }
  }, [currentUser]);

  // Cleanup refs on unmount
  useEffect(() => {
    return () => {
      fetchingRef.current = false;
      currentUserRef.current = null;
    };
  }, []);
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  const handleProfilePicUpload = useCallback(async () => {
    if (!selectedFile || !currentUser) return;

    setUploadingProfilePic(true);

    try {
      const extension = selectedFile.name.split(".").pop();
      const s3Key = `avatars/${currentUser.id}.${extension}`;
      await uploadFileToS3(selectedFile, s3Key);
      await updateUser(currentUser.id, { avatar: s3Key });
      setProfileData((prev) => ({ ...prev }));
      alert("Profile picture updated successfully!");
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      alert("Failed to upload profile picture. Please try again.");
    } finally {
      setUploadingProfilePic(false);
    }
  }, [selectedFile, currentUser, updateUser]);


  const handleProfileSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser || fetchingRef.current) return;

      fetchingRef.current = true;
      setLoading((prev) => ({ ...prev, profile: true }));

      try {
        await updateUser(currentUser.id, {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
        });
        // TODO: Replace with proper toast notification
        alert("Profile updated successfully!");
      } catch (error) {
        alert("Failed to update profile. Please try again.");
      } finally {
        setLoading((prev) => ({ ...prev, profile: false }));
        fetchingRef.current = false;
      }
    },
    [currentUser, profileData, updateUser]
  );

  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser || fetchingRef.current) return;

      fetchingRef.current = true;
      setLoading((prev) => ({ ...prev, email: true }));

      try {
        await updateUserEmail(currentUser.id, {
          email: emailData.email,
        });
        alert("Email updated successfully!");
      } catch (error) {
        alert("Failed to update email. Please try again.");
      } finally {
        setLoading((prev) => ({ ...prev, email: false }));
        fetchingRef.current = false;
      }
    },
    [currentUser, emailData, updateUserEmail]
  );

  const handlePreferencesSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser || fetchingRef.current) return;

      fetchingRef.current = true;
      setLoading((prev) => ({ ...prev, preferences: true }));

      try {
        await updateUser(currentUser.id, {
          timezone: preferencesData.timezone,
          preferences: {
            theme: "light",
            notifications: {
              email: preferencesData.notifications.comments,
              push: preferencesData.notifications.assignments,
            },
          },
        });
        alert("Preferences updated successfully!");
      } catch (error) {
        alert("Failed to update preferences. Please try again.");
      } finally {
        setLoading((prev) => ({ ...prev, preferences: false }));
        fetchingRef.current = false;
      }
    },
    [currentUser, preferencesData, updateUser]
  );

  const handleDeleteAccount = useCallback(async () => {
    if (!currentUser || fetchingRef.current) return;

    fetchingRef.current = true;
    setLoading((prev) => ({ ...prev, delete: true }));

    try {
      await deleteUser(currentUser.id);
      alert("Account deleted successfully!");
      router.push("/login");
    } catch (error) {
      alert("Failed to delete account. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, delete: false }));
      setShowDeleteConfirm(false);
      fetchingRef.current = false;
    }
  }, [currentUser, deleteUser, router]);


  if (!currentUser) {
    return (
      <div className="bg-[var(--background)] transition-colors duration-200">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Card className="border-[var(--border)] bg-[var(--card)] shadow-sm p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--muted)]/30 flex items-center justify-center mx-auto mb-4">
              <HiShieldCheck className="w-8 h-8 text-[var(--muted-foreground)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Authentication Required
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              Please log in to access your account settings.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--background)] transition-colors duration-200 rounded-md border-none">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 rounded-md border-none">
        {/* Enhanced Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left: Title and Description */}
            <div className="flex-1">
              <h1 className="text-md font-bold text-[var(--foreground)] mb-2 flex items-center gap-3">
                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-md bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 flex items-center justify-center shadow-lg">
                  <HiCog6Tooth className="w-5 h-5 lg:w-6 lg:h-6 text-[var(--primary-foreground)]" />
                </div>
                Account Settings
              </h1>
              <p className="text-md text-[var(--muted-foreground)] leading-relaxed">
                Manage your account settings, preferences, and security options.
              </p>

              {/* User Status */}
              <div className="mt-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-md font-medium text-[var(--foreground)]">
                  Signed in as {currentUser.firstName} {currentUser.lastName}
                </span>
                <Badge
                  variant="secondary"
                  className="text-xs bg-[var(--accent)]/30 text-[var(--accent-foreground)] rounded-md border-none"
                >
                  Active
                </Badge>
              </div>
            </div>

            {/* Right: User Avatar */}
            <div className="flex items-center gap-4">
             <Avatar className="h-16 w-16 border-none rounded-md shadow-lg">
                    {(currentUser?.avatar) && (
                      <AvatarImage
                        src={ currentUser?.avatar}
                        alt={
                          `${profileData.firstName || ""} ${
                            profileData.lastName || ""
                          }`.trim() || "Profile Picture"
                        }
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-[var(--primary-foreground)] font-bold text-lg">
                      {`${profileData.firstName?.charAt(0) || ""}${
                        profileData.lastName?.charAt(0) || ""
                      }`.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:space-y-8">
          {/* Profile Section */}
          <Card className="rounded-md border-none bg-[var(--card)] shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent)]/5 border-b border-none rounded-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold text-[var(--foreground)]">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 flex items-center justify-center shadow-sm">
                      <HiUserCircle className="w-5 h-5 text-[var(--primary-foreground)]" />
                    </div>
                    Profile Information
                  </CardTitle>
                  <CardDescription className="text-sm text-[var(--muted-foreground)] mt-2 leading-relaxed">
                    Update your personal information. This information will be
                    displayed publicly so be careful what you share.
                  </CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs bg-[var(--primary)]/10 text-[var(--primary)] rounded-md border-none"
                >
                  Public
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 lg:p-8 rounded-md">
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Profile Picture Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-md bg-[var(--accent)]/20 border-none">
                  <Avatar className="h-16 w-16 border-none rounded-md shadow-lg">
                    {(previewUrl || currentUser?.avatar) && (
                      <AvatarImage
                        src={previewUrl || currentUser?.avatar}
                        alt={
                          `${profileData.firstName || ""} ${
                            profileData.lastName || ""
                          }`.trim() || "Profile Picture"
                        }
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-[var(--primary-foreground)] font-bold text-md rounded-md">
                      {`${profileData.firstName?.charAt(0) || ""}${
                        profileData.lastName?.charAt(0) || ""
                      }`.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <Label className="text-sm font-semibold text-[var(--foreground)] mb-2 block">
                      Profile Picture
                    </Label>
                    <p className="text-xs text-[var(--muted-foreground)] mb-3 leading-relaxed">
                      Upload a new profile picture or change your existing one.
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleUploadButtonClick}
                        disabled={uploadingProfilePic}
                    className="rounded-md border-none hover:bg-[var(--accent)] transition-all duration-200"
                      >
                        Select Image
                      </Button>

                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleProfilePicUpload}
                        disabled={!selectedFile || uploadingProfilePic}
                    className="rounded-md shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        {uploadingProfilePic ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Uploading...
                          </div>
                        ) : (
                          "Upload"
                        )}
                      </Button>

                      {selectedFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
                        className="rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/50 transition-all duration-200 border-none"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                      First Name
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={profileData.firstName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProfileData((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                    className="rounded-md border-none bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-all duration-200"
                      placeholder="Enter your first name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                      Last Name
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={profileData.lastName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProfileData((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                    className="rounded-md border-none bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-all duration-200"
                      placeholder="Enter your last name"
                      required
                    />
                  </div>
                </div>

                <Separator className="bg-[var(--border)] rounded-md border-none" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <HiCheckCircle className="w-4 h-4 text-green-500" />
                    <span>Changes will be saved automatically</span>
                  </div>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={
                      loading.profile ||
                      !profileData.firstName.trim() ||
                      !profileData.lastName.trim()
                    }
                    className="rounded-md bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-lg hover:shadow-xl transition-all duration-200 border-none"
                    size="sm"
                  >
                    {loading.profile ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <HiCheckCircle className="w-4 h-4" />
                        Save Changes
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Email Section */}
          <Card className="rounded-md border-none bg-[var(--card)] shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent)]/5  border-none rounded-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold text-[var(--foreground)]">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br bg-[var(--primary)] hover:bg-[var(--primary)]/90 flex items-center justify-center shadow-sm">
                      <HiEnvelope className="w-5 h-5 text-white" />
                    </div>
                    Email Address
                  </CardTitle>
                  <CardDescription className="text-sm text-[var(--muted-foreground)]">
                    Update your email address. This will be used for login and
                    notifications.
                  </CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs bg-blue-500/10 text-blue-600 rounded-md border-none"
                >
                  Secure
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 lg:p-8 rounded-md">
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                    Email Address
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="max-w-md">
                    <Input
                      type="email"
                      value={emailData.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEmailData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    className="rounded-md border-none bg-[var(--background)] focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                      placeholder="Enter your email address"
                      required
                    />
                    <p className="text-xs text-[var(--muted-foreground)] mt-2 leading-relaxed">
                      We'll send a verification email if you change your
                      address.
                    </p>
                  </div>
                </div>

                <Separator className="bg-[var(--border)] rounded-md border-none" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <HiShieldCheck className="w-4 h-4 text-green-500" />
                    <span>Your email is secure and encrypted</span>
                  </div>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading.email || !emailData.email.trim()}
                    className="rounded-md bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-lg hover:shadow-xl transition-all duration-200 border-none"
                    size="sm"
                  >
                    {loading.email ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Updating...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <HiCheckCircle className="w-4 h-4" />
                        Update Email
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Preferences */}
          <Card className="rounded-md border-none bg-[var(--card)] shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent)]/5 border-b border-none rounded-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold text-[var(--foreground)]">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                      <HiBell className="w-5 h-5 text-white" />
                    </div>
                    Account Preferences
                  </CardTitle>
                  <CardDescription className="text-sm text-[var(--muted-foreground)] mt-2 leading-relaxed">
                    Customize your notification settings, timezone, and other
                    account preferences.
                  </CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs bg-purple-500/10 text-purple-600 rounded-md border-none"
                >
                  Personal
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 lg:p-8 rounded-md">
              <form onSubmit={handlePreferencesSubmit} className="space-y-8">
                {/* Timezone Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                      <HiGlobeAlt className="w-4 h-4 text-[var(--primary)]" />
                    </div>
                    <Label className="text-sm font-semibold text-[var(--foreground)]">
                      Timezone
                    </Label>
                  </div>
                  <div className="max-w-md pl-9">
                    <Select
                      value={preferencesData.timezone}
                      onValueChange={(value) =>
                        setPreferencesData((prev) => ({
                          ...prev,
                          timezone: value,
                        }))
                      }
                    >
                      <SelectTrigger className="rounded-md border-none bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-all duration-200">
                        <SelectValue placeholder="Select your timezone" />
                      </SelectTrigger>
                      <SelectContent className="rounded-md border-none bg-[var(--background)] shadow-lg">
                        <SelectItem value="(UTC-08:00) Pacific Time (US & Canada)">
                          (UTC-08:00) Pacific Time (US & Canada)
                        </SelectItem>
                        <SelectItem value="(UTC-05:00) Eastern Time (US & Canada)">
                          (UTC-05:00) Eastern Time (US & Canada)
                        </SelectItem>
                        <SelectItem value="(UTC+00:00) London">
                          (UTC+00:00) London
                        </SelectItem>
                        <SelectItem value="(UTC+01:00) Berlin, Paris, Rome">
                          (UTC+01:00) Berlin, Paris, Rome
                        </SelectItem>
                        <SelectItem value="(UTC+08:00) Singapore, Hong Kong">
                          (UTC+08:00) Singapore, Hong Kong
                        </SelectItem>
                        <SelectItem value="(UTC+09:00) Tokyo">
                          (UTC+09:00) Tokyo
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-[var(--muted-foreground)] mt-2 leading-relaxed">
                      Used to display dates and times in your local timezone.
                    </p>
                  </div>
                </div>

                <Separator className="bg-[var(--border)] rounded-md border-none" />

                {/* Notifications Section */}
                {/* <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <HiBell className="w-4 h-4 text-purple-500" />
                    </div>
                    <Label className="text-sm font-semibold text-[var(--foreground)]">
                      Email Notifications
                    </Label>
                  </div>
                  <div className="space-y-4 pl-9">
                    {[
                      {
                        key: "comments",
                        label: "Comments",
                        description:
                          "Get notified when someone comments on your tasks.",
                        icon: HiBell,
                      },
                      {
                        key: "assignments",
                        label: "Task Assignments",
                        description:
                          "Get notified when you're assigned to a task.",
                        icon: HiUser,
                      },
                      {
                        key: "updates",
                        label: "Task Updates",
                        description:
                          "Get notified when tasks you're involved with are updated.",
                        icon: HiCheckCircle,
                      },
                    ].map((notification) => {
                      const Icon = notification.icon;
                      const isEnabled =
                        preferencesData.notifications[
                          notification.key as keyof typeof preferencesData.notifications
                        ];
                      return (
                        <div
                          key={notification.key}
                          className="flex items-start gap-4 p-4 rounded-xl border border-[var(--border)]/50 bg-[var(--accent)]/20 hover:bg-[var(--accent)]/30 transition-all duration-200"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--background)] border border-[var(--border)] flex-shrink-0">
                            <Icon
                              className={`w-4 h-4 ${
                                isEnabled
                                  ? "text-[var(--primary)]"
                                  : "text-[var(--muted-foreground)]"
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <label
                                  htmlFor={notification.key}
                                  className="text-sm font-semibold text-[var(--foreground)] cursor-pointer block"
                                >
                                  {notification.label}
                                </label>
                                <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                                  {notification.description}
                                </p>
                              </div>
                              <Checkbox
                                id={notification.key}
                                checked={isEnabled}
                                onCheckedChange={(checked) =>
                                  setPreferencesData((prev) => ({
                                    ...prev,
                                    notifications: {
                                      ...prev.notifications,
                                      [notification.key]: checked,
                                    },
                                  }))
                                }
                                className="ml-4 flex-shrink-0 h-5 w-5 border-[var(--border)] data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div> */}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <HiCheckCircle className="w-4 h-4 text-green-500" />
                    <span>Settings are saved automatically</span>
                  </div>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading.preferences}
                    className="rounded-md bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-none"
                    size="sm"
                  >
                    {loading.preferences ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <HiCheckCircle className="w-4 h-4" />
                        Save Preferences
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="rounded-md border-none bg-red-50/50 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden dark:bg-red-950/20">
            <CardHeader className="bg-gradient-to-r from-red-500/10 to-red-600/10 border-b border-none rounded-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold text-red-700 dark:text-red-400">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
                      <HiExclamationTriangle className="w-5 h-5 text-white" />
                    </div>
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="text-sm text-red-600/80 dark:text-red-400/80 mt-2 leading-relaxed">
                    Irreversible and destructive actions. Please proceed with
                    caution.
                  </CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs bg-red-500/10 text-red-600 rounded-md border-none"
                >
                  Critical
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 lg:p-8 rounded-md">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-4 rounded-md border-none bg-red-50/30 dark:bg-red-950/10">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 rounded-md bg-red-500/10 flex items-center justify-center">
                      <HiExclamationTriangle className="w-4 h-4 text-red-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">
                      Delete Account
                    </h3>
                  </div>
                  <p className="text-xs text-red-600/80 dark:text-red-400/80 leading-relaxed pl-9">
                    Permanently delete your account and all associated data.
                    This action cannot be undone and will immediately log you
                    out.
                  </p>
                  <div className="mt-3 pl-9">
                    <div className="flex items-center gap-2 text-xs text-red-600/70 dark:text-red-400/70">
                      <span>•</span>
                      <span>All your tasks and projects will be deleted</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-red-600/70 dark:text-red-400/70">
                      <span>•</span>
                      <span>Your profile and settings will be removed</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-red-600/70 dark:text-red-400/70">
                      <span>•</span>
                      <span>This action is immediate and irreversible</span>
                    </div>
                  </div>
                </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading.delete}
                    className="rounded-md bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-none flex-shrink-0"
                  >
                  {loading.delete ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <HiExclamationTriangle className="w-4 h-4" />
                      Delete Account
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-[var(--background)]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <Card className="w-full max-w-md rounded-md border-none bg-[var(--card)] shadow-2xl animate-in zoom-in-95 duration-200">
              <CardContent className="p-6 lg:p-8 rounded-md">
                <div className="text-center mb-6">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-md bg-gradient-to-br from-red-500 to-red-600 mb-4 shadow-lg">
                    <HiExclamationTriangle className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-md font-bold text-red-700 dark:text-red-400 mb-3">
                    Delete Account
                  </CardTitle>
                  <CardDescription className="text-md text-[var(--muted-foreground)] leading-relaxed">
                    This action will permanently delete your account and cannot
                    be undone. All your data will be lost forever.
                  </CardDescription>

                  {/* Warning List */}
                  <div className="mt-4 p-4 rounded-md bg-red-50/50 border-none dark:bg-red-950/20">
                    <div className="space-y-2 text-left">
                        <div className="flex items-center gap-2 text-md text-red-600/80 dark:text-red-400/80">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span>All tasks and projects will be deleted</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-red-600/80 dark:text-red-400/80">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span>Your profile and settings will be removed</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-red-600/80 dark:text-red-400/80">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span>You will be immediately logged out</span>
                      </div>
                    </div>
                  </div>
                </div>

                  <CardFooter className="flex gap-3 p-0 rounded-md border-none">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 rounded-md border-none hover:bg-[var(--accent)] transition-all duration-200"
                    disabled={loading.delete}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteAccount}
                    disabled={loading.delete}
                    className="flex-1 rounded-md bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-none"
                  >
                    {loading.delete ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Deleting...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <HiExclamationTriangle className="w-4 h-4" />
                        Delete Forever
                      </div>
                    )}
                  </Button>
                </CardFooter>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
