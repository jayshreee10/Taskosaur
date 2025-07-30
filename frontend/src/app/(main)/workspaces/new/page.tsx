'use client';
import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WorkspaceContext } from '@/contexts/workspace-context'; 
import { useAuth } from '@/contexts/auth-context'; 
import { HiExclamation, HiArrowLeft } from 'react-icons/hi';

// Import shadcn UI components
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

export default function NewWorkspacePage() {
  const router = useRouter();
  const workspaceContext = useContext(WorkspaceContext);
  const { isAuthenticated } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Form validation - all fields must be filled
  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.description.trim() !== ''
    );
  };

  const getAuthToken = () => {
    // This function is no longer needed since contexts handle auth
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workspaceContext) {
      setError('Workspace context not available');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (!isAuthenticated()) {
        throw new Error('Authentication required');
      }
      
      const response = await workspaceContext.createWorkspace(formData);
      
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-');
      
      router.push(`/${response.slug || slug}`);
      
    } catch (error) {
      console.error('Error creating workspace:', error);
      setError(error instanceof Error ? error.message : 'Failed to create workspace');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950">
      <div className="max-w-7xl mx-auto p-6"> {/* Changed from max-w-2xl to max-w-4xl for wider form */}
        {/* Header */}
        <div className="mb-6">
         
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100 mb-2">Create New Workspace</h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Workspaces help you organize projects and collaborate with teams.
          </p>
        </div>

        {/* Form */}
        <Card className="p-8"> {/* Increased padding from p-6 to p-8 */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <HiExclamation className="w-4 h-4 text-red-500 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="My Workspace"
              />
            </div>

            <div>
              <Label htmlFor="workspace-description">Description</Label>
              <Textarea
                id="workspace-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Describe the purpose of this workspace"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
              <Link href="/workspaces">
                <Button variant="secondary">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting || !isFormValid()}
              >
                {isSubmitting ? 'Creating...' : 'Create Workspace'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}