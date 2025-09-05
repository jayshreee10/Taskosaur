"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import ActionButton from "@/components/common/ActionButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HiUserCircle } from "react-icons/hi2";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export default function ProfileSection() {
  const { getCurrentUser, updateUser, uploadFileToS3 } = useAuth();
  const currentUser = getCurrentUser();

  const fetchingRef = useRef(false);
  const currentUserRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (currentUser) {
      if (currentUserRef.current?.id === currentUser.id) return;
      currentUserRef.current = currentUser;
      setProfileData({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
      });
    }
  }, [currentUser]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleUploadButtonClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleProfilePicUpload = useCallback(async () => {
    if (!selectedFile || !currentUser) return;
    setUploadingProfilePic(true);
    try {
      const extension = selectedFile.name.split(".").pop();
      const s3Key = `avatars/${currentUser.id}.${extension}`;
      await uploadFileToS3(selectedFile, s3Key);
      await updateUser(currentUser.id, { avatar: s3Key });
      toast.success("Profile picture updated successfully!");
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Failed to upload profile picture. Please try again.");
    } finally {
      setUploadingProfilePic(false);
    }
  }, [selectedFile, currentUser, uploadFileToS3, updateUser]);

  const handleProfileSubmit = async () => {
    if (!currentUser || fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      await updateUser(currentUser.id, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
      });
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  return (
    <Card className="border-none bg-[var(--card)]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-[var(--foreground)]">
              <HiUserCircle className="w-5 h-5 text-[var(--primary)]" />
              Profile Information
            </CardTitle>
            <CardDescription className="text-sm text-[var(--muted-foreground)] mt-1">
              Update your personal information. This information will be
              displayed publicly so be careful what is shared.
            </CardDescription>
          </div>
          <Badge
            variant="secondary"
            className="text-xs bg-[var(--primary)]/10 text-[var(--primary)] border-none"
          >
            Public
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Picture */}
          <div className="flex  gap-3 p-3 bg-[var(--accent)]/20 rounded-md">
            <Avatar className="h-8 w-8 border-none">
              {(previewUrl || currentUser?.avatar) && (
                <AvatarImage
                  src={previewUrl || currentUser?.avatar || ""}
                  alt={
                    `${profileData.firstName} ${profileData.lastName}`.trim() ||
                    "Profile Picture"
                  }
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-[var(--primary)] text-[var(--primary-foreground)] font-medium text-xs">
                {`${profileData.firstName?.charAt(0) || ""}${
                  profileData.lastName?.charAt(0) || ""
                }`.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <Label className="text-sm font-medium text-[var(--foreground)] block mb-1">
                Profile Picture
              </Label>
              <p className="text-xs text-[var(--muted-foreground)] mb-2">
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
                <ActionButton
                  type="button"
                  secondary
                  onClick={handleUploadButtonClick}
                  disabled={uploadingProfilePic}
                
                >
                  Select Image
                </ActionButton>
                <ActionButton
                  type="button"
                  secondary
                  onClick={handleProfilePicUpload}
                  disabled={!selectedFile || uploadingProfilePic}
                 
                >
                  {uploadingProfilePic ? (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </div>
                  ) : (
                    "Upload"
                  )}
                </ActionButton>
                {selectedFile && (
                  <ActionButton
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="h-7 px-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] border-none"
                  >
                    Remove
                  </ActionButton>
                )}
              </div>
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-[var(--foreground)]">
                First Name <span className="text-red-500">*</span>
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
                className="h-8 border-none bg-[var(--background)]"
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-[var(--foreground)]">
                Last Name <span className="text-red-500">*</span>
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
                className="h-8 border-none bg-[var(--background)]"
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <ActionButton
              onClick={handleProfileSubmit}
              disabled={
                loading ||
                !profileData.firstName.trim() ||
                !profileData.lastName.trim()
              }
              primary
              className="h-8 px-3 text-sm bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] border-none"
            >
              {loading ? (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                "Save Changes"
              )}
            </ActionButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}