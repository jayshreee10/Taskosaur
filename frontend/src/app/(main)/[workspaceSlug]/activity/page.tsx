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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  HiClock,
  HiExclamationTriangle,
  HiArrowPath,
  HiDocumentText,
  HiChatBubbleLeft,
  HiClipboardDocumentCheck,
  HiUserPlus,
  HiFunnel,
  HiCheckCircle,
  HiXMark,
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
      <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-[var(--primary-foreground)] font-bold shadow-lg">
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
  
  const colors = {
    task: 'bg-green-500/20 border-green-500/30 text-green-600',
    comment: 'bg-blue-500/20 border-blue-500/30 text-blue-600',
    status: 'bg-orange-500/20 border-orange-500/30 text-orange-600',
    assignment: 'bg-purple-500/20 border-purple-500/30 text-purple-600',
    general: 'bg-[var(--muted)]/50 border-[var(--border)] text-[var(--muted-foreground)]'
  };
  
  const Icon = icons[type];
  
  return (
    <div className={`flex items-center justify-center h-7 w-7 rounded-full border-2 shadow-sm transition-all duration-200 ${colors[type]}`}>
      <Icon size={14} className="font-medium" />
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-background transition-colors duration-200">
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="animate-pulse">
        <div className="flex justify-between items-center mb-6 lg:mb-8">
          <div className="h-8 bg-[var(--muted)] rounded w-1/3"></div>
          <div className="h-10 bg-[var(--muted)] rounded w-40"></div>
        </div>
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardContent className="p-6 lg:p-8">
            <div className="space-y-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-[var(--muted)] rounded-full"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-[var(--muted)] rounded w-3/4"></div>
                    <div className="h-3 bg-[var(--muted)] rounded w-1/3"></div>
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
  <Card className="border-[var(--border)] bg-[var(--card)] shadow-sm hover:shadow-lg transition-all duration-200">
    <CardContent className="p-8 lg:p-12 text-center">
      <div className="py-8">
        <div className="w-16 h-16 rounded-full bg-[var(--muted)]/30 flex items-center justify-center mx-auto mb-6">
          <Icon size={32} className="text-[var(--muted-foreground)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
          {title}
        </h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-8 leading-relaxed max-w-md mx-auto">
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
    { value: 'all', label: 'All Activity', icon: HiClock, color: 'bg-gray-500/10 text-gray-700' },
    { value: 'comment', label: 'Comments', icon: HiChatBubbleLeft, color: 'bg-blue-500/10 text-blue-700' },
    { value: 'task', label: 'Tasks', icon: HiClipboardDocumentCheck, color: 'bg-green-500/10 text-green-700' },
    { value: 'status', label: 'Status Changes', icon: HiDocumentText, color: 'bg-orange-500/10 text-orange-700' },
    { value: 'assignment', label: 'Assignments', icon: HiUserPlus, color: 'bg-purple-500/10 text-purple-700' },
  ];
  
  const currentFilter = filterOptions.find(f => f.value === activityFilter) || filterOptions[0];

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
      <div className="min-h-screen bg-background transition-colors duration-200">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <HiExclamationTriangle className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Something went wrong</h3>
              <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto leading-relaxed">{error}</p>
              <Button 
                onClick={() => retryFetch()}
                variant="outline"
                className="border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-all duration-200 hover:border-[var(--primary)]/50 flex items-center gap-2"
              >
                <HiArrowPath size={16} />
                Try again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-200">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <EmptyState
            icon={HiDocumentText}
            title="Workspace not found"
            description="The workspace you're looking for doesn't exist or you don't have access to it."
            action={
              <Link href="/workspaces">
                <Button className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 transition-all duration-200">
                  Back to Workspaces
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Enhanced Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left: Title and Description */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 flex items-center justify-center text-white font-bold shadow-lg">
                  {workspace.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-[var(--foreground)]">
                    {workspace.name} Activity
                  </h1>
                  <p className="text-sm lg:text-base text-[var(--muted-foreground)] mt-1 leading-relaxed">
                    Recent activity and updates in this workspace
                  </p>
                  
                  {/* Activity Count */}
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {filteredActivities.length} {activityFilter === 'all' ? 'activities' : filterOptions.find(f => f.value === activityFilter)?.label.toLowerCase()}
                      {activities.length !== filteredActivities.length && (
                        <span className="text-[var(--muted-foreground)] ml-1">of {activities.length} total</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Filter Controls */}
            <div className="flex items-center gap-3">
              {/* Active Filter Tag */}
              {activityFilter !== 'all' && (
                <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-200">
                  <Badge 
                    variant="secondary"
                    className={`flex items-center gap-2 px-3 py-1.5 ${currentFilter.color} border border-current/20 hover:bg-current/20 transition-all duration-200`}
                  >
                    <currentFilter.icon className="w-3 h-3" />
                    <span className="text-xs font-medium">{currentFilter.label}</span>
                    <button
                      onClick={() => setActivityFilter('all')}
                      className="ml-1 hover:bg-current/20 rounded-full p-0.5 transition-colors"
                      aria-label="Clear filter"
                    >
                      <HiXMark className="w-3 h-3" />
                    </button>
                  </Badge>
                </div>
              )}
              
              {/* Filter Trigger */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-9 h-9 p-0 border-[var(--border)] hover:bg-[var(--accent)] hover:border-[var(--primary)]/50 transition-all duration-200 relative"
                    aria-label="Filter activities"
                  >
                    <HiFunnel className="w-4 h-4" />
                    {activityFilter !== 'all' && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border-[var(--border)] bg-[var(--background)] shadow-lg">
                  <DropdownMenuLabel className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider px-3 py-2">
                    Filter Activity
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[var(--border)]" />
                  {filterOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = activityFilter === option.value;
                    return (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => setActivityFilter(option.value)}
                        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all duration-200 ${
                          isActive 
                            ? 'bg-[var(--accent)] text-[var(--accent-foreground)] font-medium' 
                            : 'hover:bg-[var(--accent)]/50'
                        }`}
                      >
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                          isActive ? option.color : 'bg-[var(--muted)]/30'
                        }`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <span className="flex-1">{option.label}</span>
                        {isActive && (
                          <HiCheckCircle className="w-4 h-4 text-[var(--primary)] animate-in zoom-in-50 duration-200" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                  {activityFilter !== 'all' && (
                    <>
                      <DropdownMenuSeparator className="bg-[var(--border)]" />
                      <DropdownMenuItem
                        onClick={() => setActivityFilter('all')}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[var(--accent)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all duration-200"
                      >
                        <HiXMark className="w-4 h-4" />
                        <span>Clear Filter</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Activity List */}
        {filteredActivities.length > 0 ? (
          <Card className="border-[var(--border)] bg-[var(--card)] shadow-sm hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6 lg:p-8">
              <div className="flow-root">
                <ul role="list" className="-mb-8">
                  {filteredActivities.map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== filteredActivities.length - 1 && (
                          <div
                            className="absolute top-12 left-6 -ml-px h-full w-px bg-gradient-to-b from-[var(--border)] via-[var(--border)]/50 to-transparent"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex items-start gap-4">
                          <div className="relative flex-shrink-0">
                            <UserAvatar name={activity.user} size="lg" />
                            <div className="absolute -bottom-1 -right-1 transform translate-x-1 translate-y-1">
                              <ActivityIcon type={activity.type} />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="space-y-3">
                              {/* Activity Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="text-sm leading-relaxed">
                                    <Link
                                      href="#"
                                      className="font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors duration-200"
                                    >
                                      {activity.user}
                                    </Link>
                                    <span className="text-[var(--muted-foreground)] mx-1">
                                      {activity.action}
                                    </span>
                                    <Link
                                      href="#"
                                      className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors duration-200 underline decoration-[var(--primary)]/30 underline-offset-2 hover:decoration-[var(--primary)]"
                                    >
                                      {activity.target}
                                    </Link>
                                    {activity.project && (
                                      <span className="text-[var(--muted-foreground)]">
                                        {' in project '}
                                        <Link 
                                          href={`/${workspaceSlug}/${activity.project}`} 
                                          className="text-[var(--primary)] hover:text-[var(--primary)]/80 font-semibold transition-colors duration-200"
                                        >
                                          {activity.project}
                                        </Link>
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Time and metadata */}
                                  <div className="flex items-center gap-3 mt-2">
                                    <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                                      <HiClock className="w-3 h-3" />
                                      <span className="font-medium">{activity.time}</span>
                                    </div>
                                    <Badge 
                                      variant={activity.type === 'task' ? 'default' : 'secondary'}
                                      className={`text-xs capitalize transition-colors ${
                                        activity.type === 'task' ? 'bg-green-500/10 text-green-700 hover:bg-green-500/20' :
                                        activity.type === 'comment' ? 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20' :
                                        activity.type === 'status' ? 'bg-orange-500/10 text-orange-700 hover:bg-orange-500/20' :
                                        activity.type === 'assignment' ? 'bg-purple-500/10 text-purple-700 hover:bg-purple-500/20' :
                                        'bg-[var(--accent)]/30 text-[var(--accent-foreground)] hover:bg-[var(--accent)]/50'
                                      }`}
                                    >
                                      {activity.type}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {activity.comment && (
                              <div className="mt-4 p-5 rounded-xl border bg-gradient-to-r from-[var(--accent)]/20 to-[var(--accent)]/10 border-[var(--border)]/50 shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="flex items-start gap-4">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--primary)]/10 flex-shrink-0 border border-[var(--primary)]/20">
                                    <HiChatBubbleLeft className="w-5 h-5 text-[var(--primary)]" />
                                  </div>
                                  <div className="flex-1 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">
                                          Comment
                                        </span>
                                        <div className="w-1 h-1 rounded-full bg-[var(--muted-foreground)]" />
                                        <span className="text-xs text-[var(--muted-foreground)] font-medium">
                                          {activity.time}
                                        </span>
                                      </div>
                                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                        Reply
                                      </Button>
                                    </div>
                                    <div className="bg-[var(--background)]/50 rounded-lg p-3 border border-[var(--border)]/30">
                                      <p className="text-sm text-[var(--foreground)] leading-relaxed">
                                        {activity.comment}
                                      </p>
                                    </div>
                                  </div>
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