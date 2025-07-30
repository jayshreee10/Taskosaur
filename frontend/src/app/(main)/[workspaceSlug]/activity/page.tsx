'use client';

import Link from 'next/link';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  HiClock,
  HiExclamationTriangle,
  HiArrowPath,
  HiDocumentText,
  HiChatBubbleLeft,
  HiClipboardDocumentCheck,
  HiUserPlus,
} from 'react-icons/hi2';

interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  project?: string;
  time: string;
  comment?: string;
  type: 'task' | 'comment' | 'status' | 'assignment' | 'general';
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

const UserAvatar = ({ 
  name, 
  size = "md" 
}: { 
  name: string;
  size?: "sm" | "md" | "lg";
}) => {
  const sizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <Avatar className={sizes[size]}>
      <AvatarFallback className="bg-primary text-primary-foreground font-medium">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
};

const ActivityIcon = ({ type }: { type: Activity['type'] }) => {
  const icons = {
    task: HiClipboardDocumentCheck,
    comment: HiChatBubbleLeft,
    status: HiDocumentText,
    assignment: HiUserPlus,
    general: HiClock
  };
  
  const variants = {
    task: "default",
    comment: "secondary", 
    status: "outline",
    assignment: "secondary",
    general: "outline"
  } as const;
  
  const Icon = icons[type];
  
  return (
    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-[var(--background)] border-2 border-border">
      <Icon size={12} className="text-muted-foreground" />
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[var(--background)]">
    <div className="max-w-7xl mx-auto p-6">
      <div className="animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 bg-muted rounded w-1/4"></div>
          <div className="h-10 bg-muted rounded w-32"></div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description,
  action
}: {
  icon: any;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <Card>
    <CardContent className="p-6 text-center">
      <div className="py-10">
        <Icon size={48} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="text-sm font-medium text-foreground mb-2">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mb-6">
          {description}
        </p>
        {action}
      </div>
    </CardContent>
  </Card>
);

export default function WorkspaceActivityPage() {
  const params = useParams();
  const router = useRouter();
  const { getWorkspaceBySlug } = useWorkspaceContext();
  const { isAuthenticated } = useAuth();
  
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState('all');
  
  const workspaceSlug = params.workspaceSlug as string;

  // Prevent multiple simultaneous API calls
  const fetchingRef = useRef(false);
  const currentSlugRef = useRef<string>('');

  const filterOptions = [
    { value: 'all', label: 'All Activity' },
    { value: 'comment', label: 'Comments' },
    { value: 'task', label: 'Tasks' },
    { value: 'status', label: 'Status Changes' },
    { value: 'assignment', label: 'Assignments' },
  ];

  const fetchData = useCallback(async () => {
    try {
      // Prevent duplicate calls for the same slug
      if (fetchingRef.current && currentSlugRef.current === workspaceSlug) {
        console.log('🔄 Already fetching activity data for slug:', workspaceSlug);
        return;
      }
      
      fetchingRef.current = true;
      currentSlugRef.current = workspaceSlug;
      
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Fetching activity for workspace slug:', workspaceSlug);

      // Check authentication
      if (!isAuthenticated()) {
        router.push('/auth/login');
        fetchingRef.current = false;
        return;
      }

      // Fetch workspace data
      const workspaceData = await getWorkspaceBySlug(workspaceSlug);
      
      if (!workspaceData) {
        setError('Workspace not found');
        setIsLoading(false);
        fetchingRef.current = false;
        return;
      }

      setWorkspace(workspaceData);

      // Mock activities with proper typing
      const mockActivities: Activity[] = [
        {
          id: '1',
          user: 'John Doe',
          action: 'created task',
          target: 'Setup authentication',
          project: 'cole-cherry',
          time: '2 hours ago',
          comment: 'Need to implement OAuth2 integration',
          type: 'task'
        },
        {
          id: '2',
          user: 'Jane Smith',
          action: 'updated status of',
          target: 'Database design',
          project: 'backend',
          time: '4 hours ago',
          type: 'status'
        },
        {
          id: '3',
          user: 'Mike Johnson',
          action: 'commented on',
          target: 'UI mockups',
          time: '6 hours ago',
          comment: 'Looks great! Just need to adjust the color scheme.',
          type: 'comment'
        },
        {
          id: '4',
          user: 'Sarah Wilson',
          action: 'assigned',
          target: 'Frontend development',
          project: 'web-app',
          time: '1 day ago',
          type: 'assignment'
        },
        {
          id: '5',
          user: 'Alex Chen',
          action: 'completed task',
          target: 'API documentation',
          project: 'backend',
          time: '2 days ago',
          type: 'task'
        }
      ];
      
      setActivities(mockActivities);

    } catch (error) {
      console.error('Error fetching workspace activity:', error);
      setError(error instanceof Error ? error.message : 'Failed to load workspace activity');
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [workspaceSlug, getWorkspaceBySlug, isAuthenticated, router]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (workspaceSlug) {
      // Reset refs when slug changes
      if (currentSlugRef.current !== workspaceSlug) {
        console.log('📍 Workspace slug changed, resetting for new slug:', workspaceSlug);
        fetchingRef.current = false;
        currentSlugRef.current = '';
        setWorkspace(null);
        setActivities([]);
      }
      
      fetchData();
    }
  }, [workspaceSlug, fetchData]);

  // Cleanup refs on unmount
  useEffect(() => {
    return () => {
      fetchingRef.current = false;
      currentSlugRef.current = '';
    };
  }, []);

  // Manual retry function that resets refs
  const retryFetch = () => {
    console.log('🔄 Manual retry triggered');
    fetchingRef.current = false;
    currentSlugRef.current = '';
    setWorkspace(null);
    setActivities([]);
    fetchData();
  };

  // Filter activities based on selected filter
  const filteredActivities = activities.filter(activity => {
    if (activityFilter === 'all') return true;
    return activity.type === activityFilter;
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto p-6">
          <Alert variant="destructive">
            <HiExclamationTriangle className="h-4 w-4" />
            <AlertTitle>Error loading workspace activity</AlertTitle>
            <AlertDescription>
              {error}
              <div className="mt-4">
                <Button 
                  onClick={() => retryFetch()}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <HiArrowPath size={16} />
                  Try again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto p-6">
          <EmptyState
            icon={HiDocumentText}
            title="Workspace not found"
            description="The workspace you're looking for doesn't exist or you don't have access to it."
            action={
              <Link href="/workspaces">
                <Button>Back to Workspaces</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-semibold text-foreground mb-1">
                {workspace.name} Activity
              </h1>
              <p className="text-sm text-muted-foreground">
                Recent activity and updates in this workspace
              </p>
            </div>
            <div className="flex gap-2">
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter activity" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Activity List */}
        {filteredActivities.length > 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="flow-root">
                <ul role="list" className="-mb-8">
                  {filteredActivities.map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== filteredActivities.length - 1 && (
                          <span 
                            className="absolute top-8 left-6 -ml-px h-full w-0.5 bg-border" 
                            aria-hidden="true" 
                          />
                        )}
                        <div className="relative flex items-start gap-4">
                          <div className="relative flex-shrink-0">
                            <UserAvatar name={activity.user} size="lg" />
                            <div className="absolute -bottom-1 -right-1">
                              <ActivityIcon type={activity.type} />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div>
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  {activity.user}
                                </span>{' '}
                                {activity.action}{' '}
                                <span className="font-medium text-foreground">
                                  {activity.target}
                                </span>
                                {activity.project && (
                                  <span className="text-muted-foreground">
                                    {' '}in project{' '}
                                    <Link 
                                      href={`/${workspaceSlug}/${activity.project}`} 
                                      className="text-primary hover:text-primary/80 font-medium"
                                    >
                                      {activity.project}
                                    </Link>
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                                <HiClock size={12} />
                                {activity.time}
                              </p>
                            </div>
                            {activity.comment && (
                              <div className="mt-3 text-sm text-foreground p-3 bg-muted rounded-lg border border-border">
                                <div className="flex items-start gap-2">
                                  <HiChatBubbleLeft size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <span>{activity.comment}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={HiClock}
            title={activityFilter === 'all' ? 'No activity yet' : `No ${filterOptions.find(f => f.value === activityFilter)?.label.toLowerCase()} found`}
            description={
              activityFilter === 'all' 
                ? 'Recent activity in the workspace will appear here.'
                : `No ${filterOptions.find(f => f.value === activityFilter)?.label.toLowerCase()} match your current filter.`
            }
          />
        )}
      </div>
    </div>
  );
}