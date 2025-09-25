"use client";
import { useState, useRef, useCallback } from "react";
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HiExclamationTriangle } from "react-icons/hi2";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/router";
import { toast } from "sonner";

export default function DangerZoneSection() {
  const { getCurrentUser, deleteUser } = useAuth();
  const currentUser = getCurrentUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fetchingRef = useRef(false);

  const handleDeleteAccount = useCallback(async () => {
    if (!currentUser || fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      await deleteUser(currentUser.id);
      toast.success("Account deleted successfully!");
      router.push("/login");
    } catch {
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      fetchingRef.current = false;
    }
  }, [currentUser, deleteUser, router]);

  return (
    <>
      <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4">
        <div className="p-4">
          <div className="mb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-red-700">
              <HiExclamationTriangle className="w-4 h-4" /> Delete Account
            </CardTitle>
            <CardDescription className="text-xs text-red-500">
              Permanently delete the account and all associated data.
            </CardDescription>
          </div>
          <CardContent className="p-0">
            <ul className="list-disc pl-4 text-xs text-red-600 space-y-0.5">
              <li>All tasks and projects will be permanently deleted</li>
              <li>Profile and settings will be removed</li>
              <li>Immediate sign out</li>
            </ul>
          </CardContent>
          <CardFooter className="mt-4 p-0">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              className="rounded bg-red-500 hover:bg-red-600 text-white text-sm shadow-sm transition-all duration-200 border-none px-3 py-1.5"
            >
              {loading ? "Processing..." : "Delete Account"}
            </Button>
          </CardFooter>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-[var(--background)]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm rounded-md border-none bg-[var(--card)] shadow-lg">
            <CardContent className="p-5">
              <div className="text-center mb-5">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-red-500 mb-3">
                  <HiExclamationTriangle className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
                  Confirm Deletion
                </CardTitle>
                <CardDescription className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                  This action is permanent and cannot be undone. All data will
                  be lost.
                </CardDescription>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded border-none text-xs"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex-1 rounded bg-red-500 hover:bg-red-600 text-white text-xs shadow-sm"
                >
                  {loading ? (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </div>
                  ) : (
                    "Delete Forever"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
