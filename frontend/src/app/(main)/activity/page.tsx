'use client';

import Link from 'next/link';
import { getActivities } from '@/utils/apiUtils';
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
} from 'react-icons/hi2';
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

export default function ActivityPage() {
  const [activitiesData, setActivitiesData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const filterOptions = [
    { value: 'all', label: 'All Activity', icon: HiClock, color: 'bg-gray-500/10 text-gray-700' },
    { value: 'comments', label: 'Comments', icon: HiChatBubbleLeft, color: 'bg-blue-500/10 text-blue-700' },
    { value: 'tasks', label: 'Tasks', icon: HiClipboardDocumentCheck, color: 'bg-green-500/10 text-green-700' },
    { value: 'status', label: 'Status Changes', icon: HiDocumentText, color: 'bg-orange-500/10 text-orange-700' },
    { value: 'assignments', label: 'Assignments', icon: HiUserPlus, color: 'bg-purple-500/10 text-purple-700' },
  ];
  
  const currentFilter = filterOptions.find(f => f.value === activeFilter) || filterOptions[0];
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getActivities();
        setActivitiesData(data || []);
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Enhanced Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left: Title and Description */}
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-[var(--foreground)] mb-2">
                Activity Feed
              </h1>
              <p className="text-sm lg:text-base text-[var(--muted-foreground)] leading-relaxed">
                Track recent changes, comments, and updates across your workspace.
              </p>
              
              {/* Activity Count */}
              <div className="mt-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {activitiesData?.length || 0} {activeFilter === 'all' ? 'activities' : currentFilter.label.toLowerCase()}
                  {activeFilter !== 'all' && (
                    <span className="text-[var(--muted-foreground)] ml-1">filtered</span>
                  )}
                </span>
              </div>
            </div>

            {/* Right: Filter Controls */}
            <div className="flex items-center gap-3">
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
                      onClick={() => setActiveFilter('all')}
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
                    Filter Activity
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[var(--border)]" />
                  {filterOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = activeFilter === option.value;
                    return (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => setActiveFilter(option.value)}
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
                        onClick={() => setActiveFilter('all')}
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
        <Card className="border-[var(--border)] bg-[var(--card)] shadow-sm hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6 lg:p-8">
            {activitiesData && activitiesData.length > 0 ? (
              <div className="flow-root">
                <ul role="list" className="-mb-8">
                  {activitiesData.map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== activitiesData.length - 1 && (
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
                                {activity.user.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--background)] border-2 border-[var(--border)] flex items-center justify-center shadow-sm">
                              <HiClock className="w-3 h-3 text-[var(--muted-foreground)]" />
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
                                    {activity.workspace && (
                                      <span className="text-[var(--muted-foreground)]">
                                        {' in '}
                                        <Link
                                          href={`/${activity.workspace}`}
                                          className="text-[var(--primary)] hover:text-[var(--primary)]/80 font-semibold transition-colors duration-200"
                                        >
                                          {activity.workspace}
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
                                    <Badge variant="secondary" className="text-xs bg-[var(--accent)]/30 text-[var(--accent-foreground)] hover:bg-[var(--accent)]/50 transition-colors">
                                      Activity
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {(activity as any).comment && (
                              <div className="mt-4 p-4 rounded-xl border bg-gradient-to-r from-[var(--accent)]/20 to-[var(--accent)]/10 border-[var(--border)]/50 shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="flex items-start gap-3">
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--primary)]/10 flex-shrink-0">
                                    <HiChatBubbleLeft className="w-4 h-4 text-[var(--primary)]" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">
                                        Comment
                                      </span>
                                      <div className="w-1 h-1 rounded-full bg-[var(--muted-foreground)]" />
                                      <span className="text-xs text-[var(--muted-foreground)] font-medium">
                                        {activity.time}
                                      </span>
                                    </div>
                                    <p className="text-sm text-[var(--foreground)] leading-relaxed">
                                      {(activity as any).comment}
                                    </p>
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
            ) : (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--muted)]/30 flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 text-[var(--muted-foreground)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                  No activity yet
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  Recent changes and updates will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
