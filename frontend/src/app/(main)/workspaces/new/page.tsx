'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useAuth } from '@/contexts/auth-context'; 
import { HiExclamationTriangle, HiArrowLeft } from 'react-icons/hi2';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FormData {
  name: string;
  description: string;
}

export default function NewWorkspacePage() {
  const router = useRouter();
  const workspaceContext = useWorkspaceContext();
  const { isAuthenticated } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
  });

  const isFormValid = useCallback(() => {
    return formData.name.trim() !== '' && formData.description.trim() !== '';
  }, [formData]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  }, [error]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workspaceContext) {
      setError('Workspace context not available');
      return;
    }

    if (!isFormValid()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (!isAuthenticated()) {
        throw new Error('Authentication required');
      }
      
      const response = await workspaceContext.createWorkspace({
        name: formData.name.trim(),
        description: formData.description.trim(),
      });
      
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      router.push(`/${response.slug || slug}`);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create workspace');
    } finally {
      setIsSubmitting(false);
    }
  }, [workspaceContext, isFormValid, isAuthenticated, formData, router]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-[80vw] mx-auto py-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          
          <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
            New Workspace
          </h1>
        </div>

        {/* Form */}
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardHeader>
            <CardTitle className="text-[var(--card-foreground)]">Workspace Details</CardTitle>
            <CardDescription className="text-[var(--muted-foreground)]">
              Provide basic information about your new workspace.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-[var(--destructive)] bg-[var(--destructive)]/10">
                <HiExclamationTriangle className="h-4 w-4 text-[var(--destructive)]" />
                <AlertDescription className="text-[var(--destructive-foreground)]">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="workspace-name" className="text-[var(--foreground)]">
                  Workspace Name *
                </Label>
                <Input
                  id="workspace-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="My Workspace"
                  className="border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus-visible:ring-[var(--ring)]"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-[var(--muted-foreground)]">
                  Choose a clear, descriptive name for your workspace.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workspace-description" className="text-[var(--foreground)]">
                  Description *
                </Label>
                <Textarea
                  id="workspace-description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Describe the purpose of this workspace..."
                  className="border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] resize-none focus-visible:ring-[var(--ring)]"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-[var(--muted-foreground)]">
                  Help team members understand what this workspace is for.
                </p>
              </div>
            </form>
          </CardContent>

          <CardFooter className="border-t border-[var(--border)] bg-[var(--muted)]/20">
            <div className="flex justify-end gap-3 w-full">
              <Link href="/workspaces">
                <Button 
                  variant="outline" 
                  disabled={isSubmitting}
                  className="border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                >
                  Cancel
                </Button>
              </Link>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !isFormValid()}
                className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] hover:shadow-md transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[var(--primary-foreground)]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Workspace'
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}