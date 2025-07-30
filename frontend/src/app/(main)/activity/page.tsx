import Link from 'next/link';
import { getActivities } from '@/utils/apiUtils';
import {
  HiChevronDown,
  // HiClockIcon,
  // HiFilter
} from 'react-icons/hi2';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Select } from '@/components/ui/select';

export default async function ActivityPage() {
  const activitiesData = await getActivities();

  return (
    <div className="min-h-screen bg-[oklch(var(--background))] text-[oklch(var(--foreground))] transition-colors">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold text-[oklch(var(--foreground))] mb-1 flex items-center gap-2">
                Activity
              </h1>
              <p className="text-sm text-[oklch(var(--muted-foreground))]">
                Track recent changes, comments, and updates across your workspace.
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <Select defaultValue="All Activity">
                <option>All Activity</option>
                <option>Comments</option>
                <option>Tasks</option>
                <option>Status Changes</option>
                <option>Assignments</option>
              </Select>
            </div>
          </div>

          {/* Activity Count */}
          <div className="mt-4 flex items-center gap-4 text-sm text-[oklch(var(--muted-foreground))]">
            <span>{activitiesData?.length || 0} activities</span>
          </div>
        </div>

        {/* Activity Timeline */}
        <Card className="bg-[oklch(var(--card))] text-[oklch(var(--card-foreground))] border border-[oklch(var(--border))] p-6">
          <CardContent>
            {activitiesData && activitiesData.length > 0 ? (
              <div className="flow-root">
                <ul role="list" className="-mb-8">
                  {activitiesData.map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== activitiesData.length - 1 && (
                          <span
                            className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-[oklch(var(--border))]"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex items-start space-x-3">
                          {/* Optional: Avatar or icon */}
                          <div className="relative">
                            {/* <UserAvatar name={activity.user} /> */}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div>
                              <div className="text-sm text-[oklch(var(--foreground))]">
                                <Link
                                  href="#"
                                  className="font-medium hover:text-[oklch(var(--primary))] transition-colors"
                                >
                                  {activity.user}
                                </Link>{' '}
                                <span className="text-[oklch(var(--muted-foreground))]">
                                  {activity.action}
                                </span>{' '}
                                <Link
                                  href="#"
                                  className="font-medium hover:text-[oklch(var(--primary))] transition-colors"
                                >
                                  {activity.target}
                                </Link>
                                {activity.workspace && (
                                  <span className="text-[oklch(var(--muted-foreground))]">
                                    {' '}
                                    in{' '}
                                    <Link
                                      href={`/${activity.workspace}`}
                                      className="text-[oklch(var(--accent))] hover:text-[oklch(var(--primary))] transition-colors"
                                    >
                                      {activity.workspace}
                                    </Link>
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-[oklch(var(--muted-foreground))]">
                                {activity.time}
                              </p>
                            </div>
                            {(activity as any).comment && (
                              <div className="mt-3 text-sm p-3 rounded-lg border bg-[oklch(var(--muted))] text-[oklch(var(--muted-foreground))] border-[oklch(var(--border))]">
                                {(activity as any).comment}
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
              <div className="text-center py-12">
                <CardTitle className="text-sm font-medium text-[oklch(var(--foreground))] mb-2">
                  No activity yet
                </CardTitle>
                <CardDescription className="text-xs text-[oklch(var(--muted-foreground))]">
                  Recent changes and updates will appear here.
                </CardDescription>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
