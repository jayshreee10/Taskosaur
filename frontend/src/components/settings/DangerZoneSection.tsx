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
      <div className="bg-red-50 dark:bg-red-950/20  rounded-lg p-4">
        <div className="p-6 lg:p-8">
          <div className="mb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-red-700">
              <HiExclamationTriangle className="w-5 h-5" /> Delete Account
            </CardTitle>
            <CardDescription className="text-red-500">
              Permanently delete the account and all associated data.
            </CardDescription>
          </div>
          <CardContent className="p-0">
            <ul className="list-disc pl-5 text-sm text-red-600 space-y-1">
              <li>All tasks and projects will be permanently deleted</li>
              <li>Profile and settings will be removed</li>
              <li>Sign out happens immediately</li>
            </ul>
          </CardContent>
          <CardFooter className="mt-6 p-0">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              className="rounded-md bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-none"
            >
              {loading ? "Processing..." : "Delete Account"}
            </Button>
          </CardFooter>
        </div>
      </div>

      {/* Confirmation Modal */}
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
                  This action will permanently delete the account and cannot be
                  undone. All data will be lost.
                </CardDescription>

                <div className="mt-4 p-4 rounded-md bg-red-50/50 border-none dark:bg-red-950/20 text-left">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-md text-red-600/80 dark:text-red-400/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span>All tasks and projects will be deleted</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-red-600/80 dark:text-red-400/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span>Profile and settings will be removed</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-red-600/80 dark:text-red-400/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span>Immediate logout</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-md border-none hover:bg-[var(--accent)] transition-all duration-200"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex-1 rounded-md bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-none"
                >
                  {loading ? (
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
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
