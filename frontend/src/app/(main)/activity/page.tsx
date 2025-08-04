'use client';

import Link from 'next/link';
import { useOrganization } from '@/contexts/organization-context';
import {
  HiClock,
  HiFunnel,
  HiChatBubbleLeft,
  HiClipboardDocumentCheck,
  HiDocumentText,
  HiUserPlus,
  HiCheckCircle,
  HiUser,
  HiXMark,
  HiArrowPath,
  HiExclamationTriangle,
} from 'react-icons/hi2';
import { BsFillClockFill } from "react-icons/bs";
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

// Import your exact types
import type { ActivityFilters, ActivityItem, ActivityResponse } from '@/utils/api/organizationApi';

// Define filter options that map to backend entityTypes
type EntityTypeFilter = "Task" | "Project" | "Workspace" | "Organization" | "User" | "all";

export default function ActivityPage() {
  const [activeFilter, setActiveFilter] = useState<EntityTypeFilter>('all');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ActivityResponse['pagination'] | null>(null);
  
  const { user } = useAuth();

  // Use organization context
  const { 
    currentOrganization,
    getOrganizationRecentActivity,
    clearError
  } = useOrganization();

  // Updated filter options to match backend entityTypes
  const filterOptions = [
    { value: 'all' as EntityTypeFilter, label: 'All Activity', icon: HiClock, color: 'bg-gray-500/10 text-gray-700' },
    { value: 'Task' as EntityTypeFilter, label: 'Tasks', icon: HiClipboardDocumentCheck, color: 'bg-green-500/10 text-green-700' },
    { value: 'Project' as EntityTypeFilter, label: 'Projects', icon: HiDocumentText, color: 'bg-blue-500/10 text-blue-700' },
    { value: 'Workspace' as EntityTypeFilter, label: 'Workspaces', icon: HiUserPlus, color: 'bg-purple-500/10 text-purple-700' },
    { value: 'User' as EntityTypeFilter, label: 'Users', icon: HiUser, color: 'bg-orange-500/10 text-orange-700' },
  ];
  
  const currentFilter = filterOptions.find(f => f.value === activeFilter) || filterOptions[0];

  // Load activities with backend filtering
  const loadActivities = async (page: number = 1, entityTypeFilter: EntityTypeFilter = activeFilter) => {
    if (!currentOrganization?.id) return;

    try {
      setIsLoadingActivity(true);
      setActivityError(null);
      
      // Build filter parameters for backend using your exact ActivityFilters interface
      const filters: ActivityFilters = {
        limit: 20,
        page: page,
        userId: user?.id
      };

      // Add entityType filter if not 'all'
      if (entityTypeFilter !== 'all') {
        filters.entityType = entityTypeFilter;
      }

      const response: ActivityResponse = await getOrganizationRecentActivity(currentOrganization.id, filters);
      
      // Set activities and pagination from response
      setActivities(response.activities);
      setPagination(response.pagination);
      
    } catch (error) {
      console.error('Error loading organization activities:', error);
      setActivityError(error instanceof Error ? error.message : 'Failed to load activities');
    } finally {
      setIsLoadingActivity(false);
    }
  };

  // Load activities when component mounts or dependencies change
  useEffect(() => {
    if (currentOrganization?.id && user?.id) {
      loadActivities(1, activeFilter);
    }
  }, [currentOrganization?.id, user?.id, activeFilter]);

  // Handle filter changes
  const handleFilterChange = async (newFilter: EntityTypeFilter) => {
    setActiveFilter(newFilter);
    await loadActivities(1, newFilter);
  };

  // Handle page changes
  const handlePageChange = async (newPage: number) => {
    await loadActivities(newPage, activeFilter);
  };

  // Handle refresh
  const handleRefreshActivities = async () => {
    if (currentOrganization?.id) {
      try {
        clearError();
        await loadActivities(pagination?.currentPage || 1, activeFilter);
      } catch (error) {
        console.error('Error refreshing activities:', error);
        setActivityError(error instanceof Error ? error.message : 'Failed to refresh activities');
      }
    }
  };

  const formatActivityTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getActivityIcon = (activity: ActivityItem) => {
    const entityType = activity.entityType?.toLowerCase() || '';
    
    switch (entityType) {
      case 'task':
        return HiClipboardDocumentCheck;
      case 'project':
        return HiDocumentText;
      case 'workspace':
        return HiUserPlus;
      case 'user':
        return HiUser;
      default:
        return HiClock;
    }
  };

  const getEntityLink = (activity: ActivityItem) => {
    if (activity.entityType === 'Task') {
      return `/tasks/${activity.entityId}`;
    } else if (activity.entityType === 'Project') {
      return `/projects/${activity.entityId}`;
    } else if (activity.entityType === 'Workspace') {
      return `/workspaces/${activity.entityId}`;
    }
    return '#';
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-200 rounded-lg border-none">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 rounded-lg border-none">
        {/* Enhanced Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left: Title and Description */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <BsFillClockFill className="size-4" />
                <h1 className="text-md font-bold">
                  Activity Feed
                </h1>
                {currentOrganization && (
                  <Badge
                    className="text-xs font-medium min-w-[90px] text-center px-2 py-0.5 border-none"
                    style={{ background: 'color-mix(in oklab, var(--primary) 15%, transparent)', color: 'var(--accent-foreground)' }}
                  >
                    {currentOrganization.name}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Manage and track all your assigned tasks in one place.
              </p>
            
              {/* Activity Count */}
              <div className="mt-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {pagination?.totalCount || 0} {activeFilter === 'all' ? 'total activities' : currentFilter.label.toLowerCase()}
                  {activeFilter !== 'all' && (
                    <span className="text-[var(--muted-foreground)] ml-1">filtered</span>
                  )}
                </span>
              </div>
            </div>

            {/* Right: Filter Controls */}
            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshActivities}
                disabled={isLoadingActivity}
                className="flex items-center gap-2 cursor-pointer"
              >
                <HiArrowPath className={`w-4 h-4 ${isLoadingActivity ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              {/* Active Filter Tag */}
              {activeFilter !== 'all' && (
                <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-200">
                  <Badge 
                    variant="secondary"
                    className={`flex items-center gap-2 px-3 py-1.5 ${currentFilter.color} border border-current/20 hover:bg-current/20 transition-all duration-200`}
                  >
                    <currentFilter.icon className="w-3 h-3" />
                    <span className="text-xs font-medium">{currentFilter.label}</span>
                    <button
                      onClick={() => handleFilterChange('all')}
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
                    {activeFilter !== 'all' && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border-[var(--border)] bg-[var(--background)] shadow-lg">
                  <DropdownMenuLabel className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider px-3 py-2">
                    Filter by Entity Type
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[var(--border)]" />
                  {filterOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = activeFilter === option.value;
                    return (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => handleFilterChange(option.value)}
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
                  {activeFilter !== 'all' && (
                    <>
                      <DropdownMenuSeparator className="bg-[var(--border)]" />
                      <DropdownMenuItem
                        onClick={() => handleFilterChange('all')}
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

        {/* Activity Timeline */}
        <Card className="rounded-lg border-none bg-[var(--card)] shadow-sm hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6 lg:p-8 rounded-lg border-none">
            {isLoadingActivity ? (
              <div className="space-y-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-4 animate-pulse">
                    <div className="w-10 h-10 bg-[var(--muted)] rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[var(--muted)] rounded w-3/4"></div>
                      <div className="h-3 bg-[var(--muted)] rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activityError ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--destructive)]/10 flex items-center justify-center mx-auto mb-4">
                  <HiExclamationTriangle className="w-8 h-8 text-[var(--destructive)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                  Failed to load activities
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  {activityError}
                </p>
                <Button onClick={handleRefreshActivities}>
                  Try Again
                </Button>
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="flow-root">
                <ul role="list" className="-mb-8">
                  {activities.map((activity, activityIdx) => {
                    const ActivityIcon = getActivityIcon(activity);
                    return (
                      <li key={activity.id}>
                        <div className="relative pb-8">
                          {activityIdx !== activities.length - 1 && (
                            <div
                              className="absolute top-12 left-5 -ml-px h-full w-px bg-gradient-to-b from-[var(--border)] via-[var(--border)]/50 to-transparent"
                              aria-hidden="true"
                            />
                          )}
                          <div className="relative flex items-start gap-4">
                            {/* User Avatar with Activity Icon */}
                            <div className="relative flex-shrink-0">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-[var(--primary-foreground)] font-bold shadow-lg">
                                  {activity.user?.firstName && activity.user?.lastName ? 
                                    (activity.user.firstName.charAt(0) + activity.user.lastName.charAt(0)).toUpperCase() :
                                    '??'
                                  }
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--background)] border-2 border-[var(--border)] flex items-center justify-center shadow-sm">
                                <ActivityIcon className="w-3 h-3 text-[var(--muted-foreground)]" />
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
                                        {activity.user?.firstName && activity.user?.lastName 
                                          ? `${activity.user.firstName} ${activity.user.lastName}`
                                          : 'Unknown User'
                                        }
                                      </Link>
                                      <span className="text-[var(--muted-foreground)] mx-2">
                                        {activity.description}
                                      </span>
                                      {activity.entityId && (
                                        <Link
                                          href={getEntityLink(activity)}
                                          className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors duration-200 underline decoration-[var(--primary)]/30 underline-offset-2 hover:decoration-[var(--primary)]"
                                        >
                                          View {activity.entityType}
                                        </Link>
                                      )}
                                    </div>
                                    
                                    {/* Time and metadata */}
                                    <div className="flex items-center gap-3 mt-2">
                                      <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                                        <HiClock className="w-3 h-3" />
                                        <span className="font-medium">{formatActivityTime(activity.createdAt)}</span>
                                      </div>
                                      <Badge variant="secondary" className="text-xs bg-[var(--accent)]/30 text-[var(--accent-foreground)] hover:bg-[var(--accent)]/50 transition-colors">
                                        {activity.entityType}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Additional metadata if available */}
                              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                <div className="mt-4 p-4 rounded-lg border-none bg-gradient-to-r from-[var(--accent)]/20 to-[var(--accent)]/10 shadow-sm hover:shadow-md transition-all duration-200">
                                  <div className="flex items-start gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--primary)]/10 flex-shrink-0">
                                      <ActivityIcon className="w-4 h-4 text-[var(--primary)]" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">
                                          Details
                                        </span>
                                        <div className="w-1 h-1 rounded-full bg-[var(--muted-foreground)]" />
                                        <span className="text-xs text-[var(--muted-foreground)] font-medium">
                                          {formatActivityTime(activity.createdAt)}
                                        </span>
                                      </div>
                                      <div className="text-sm text-[var(--foreground)] leading-relaxed">
                                        {Object.entries(activity.metadata).map(([key, value]) => (
                                          <div key={key} className="flex items-center gap-2">
                                            <span className="font-medium capitalize">{key}:</span>
                                            <span>{String(value)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-none rounded-lg">
                    <div className="text-sm text-[var(--muted-foreground)]">
                      Showing {((pagination.currentPage - 1) * 20) + 1} to {Math.min(pagination.currentPage * 20, pagination.totalCount)} of {pagination.totalCount} activities
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrevPage || isLoadingActivity}
                      >
                        Previous
                      </Button>
                      
                      <span className="text-sm text-[var(--muted-foreground)] px-2">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNextPage || isLoadingActivity}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--muted)]/30 flex items-center justify-center mx-auto mb-4">
                  <HiClock className="w-8 h-8 text-[var(--muted-foreground)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                  {activeFilter === 'all' ? 'No activity yet' : `No ${currentFilter.label.toLowerCase()} found`}
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  {activeFilter === 'all' 
                    ? 'Recent changes and updates will appear here.' 
                    : 'Try adjusting your filter or check back later.'
                  }
                </p>
                {activeFilter !== 'all' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleFilterChange('all')}
                    className="mt-4"
                  >
                    Show All Activities
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
