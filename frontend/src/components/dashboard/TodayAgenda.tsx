'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  HiX,
  HiExclamation,
  HiClock,
  HiLightningBolt,
  HiUsers,
  HiVideoCamera,
  HiLocationMarker,
  HiUser,
  HiDocumentText,
  HiCalendar,
} from 'react-icons/hi';

interface Task {
  id: number;
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

interface Meeting {
  id: number;
  title: string;
  time: string;
  type: 'video' | 'in-person' | 'team';
  location?: string;
  attendees?: number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
}

interface TodayAgendaProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  upcomingTasks?: Task[];
  todayMeetings?: Meeting[];
}

const defaultTasks: Task[] = [
  { id: 1, title: "Complete project proposal", dueDate: "Today", priority: "high" },
  { id: 2, title: "Review team presentations", dueDate: "Tomorrow", priority: "medium" },
  { id: 3, title: "Client meeting preparation", dueDate: "Friday", priority: "high" },
];

const defaultMeetings: Meeting[] = [
  {
    id: 1,
    title: "Team Standup",
    time: "9:00 AM - 9:30 AM",
    type: "team",
    icon: HiUsers,
    iconBg: "bg-green-500/10",
    location: "Video Call"
  },
  {
    id: 2,
    title: "Client Review Meeting",
    time: "2:00 PM - 3:00 PM",
    type: "in-person",
    icon: HiUser,
    iconBg: "bg-purple-500/10",
    location: "Conference Room A"
  },
  {
    id: 3,
    title: "Project Planning Session",
    time: "4:00 PM - 5:30 PM",
    type: "team",
    icon: HiDocumentText,
    iconBg: "bg-amber-500/10",
    attendees: 5
  }
];

export function TodayAgenda({ 
  isOpen, 
  onClose, 
  currentDate, 
  upcomingTasks = defaultTasks, 
  todayMeetings = defaultMeetings 
}: TodayAgendaProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-[var(--border)] transform transition-all duration-200 scale-100">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[var(--primary)]/5 to-[var(--primary)]/10 px-6 py-6 border-b border-[var(--border)]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 flex items-center justify-center shadow-lg">
                <HiCalendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[var(--foreground)]">Today's Agenda</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">{currentDate}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg bg-[var(--accent)]/50 hover:bg-[var(--accent)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all duration-200"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Upcoming Deadlines */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <HiExclamation className="w-4 h-4 text-red-500" />
                </div>
                <h4 className="text-lg font-semibold text-[var(--foreground)]">Urgent Tasks</h4>
              </div>
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] hover:bg-[var(--accent)]/30 transition-colors duration-200"
                  >
                    <div className={`w-3 h-3 rounded-full ${
                      task.priority === 'high' ? 'bg-red-500' : 
                      task.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">{task.title}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Due: {task.dueDate}</p>
                    </div>
                    <Button size="sm" variant="outline" className="border-[var(--border)] text-[var(--foreground)]">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Schedule */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <HiClock className="w-4 h-4 text-blue-500" />
                </div>
                <h4 className="text-lg font-semibold text-[var(--foreground)]">Today's Schedule</h4>
              </div>
              <div className="space-y-3">
                {todayMeetings.map((meeting) => {
                  const IconComponent = meeting.icon;
                  return (
                    <div
                      key={meeting.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] hover:bg-[var(--accent)]/30 transition-colors duration-200"
                    >
                      <div className={`w-12 h-12 rounded-lg ${meeting.iconBg} flex items-center justify-center`}>
                        <IconComponent className="w-5 h-5 text-current" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[var(--foreground)]">{meeting.title}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">{meeting.time}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {meeting.type === 'video' && (
                          <>
                            <HiVideoCamera className="w-4 h-4 text-[var(--muted-foreground)]" />
                            <span className="text-xs text-[var(--muted-foreground)]">Video Call</span>
                          </>
                        )}
                        {meeting.type === 'in-person' && meeting.location && (
                          <>
                            <HiLocationMarker className="w-4 h-4 text-[var(--muted-foreground)]" />
                            <span className="text-xs text-[var(--muted-foreground)]">{meeting.location}</span>
                          </>
                        )}
                        {meeting.attendees && (
                          <>
                            <HiUsers className="w-4 h-4 text-[var(--muted-foreground)]" />
                            <span className="text-xs text-[var(--muted-foreground)]">{meeting.attendees} attendees</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calendar Integration Section */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                  <HiCalendar className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <h4 className="text-lg font-semibold text-[var(--foreground)]">Calendar Events</h4>
              </div>
              
              {/* Calendar events will be populated here */}
              <div className="p-6 border-2 border-dashed border-[var(--border)] rounded-xl text-center">
                <HiCalendar className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-3" />
                <p className="text-sm font-medium text-[var(--foreground)] mb-1">Calendar Integration</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Connect your calendar to see events here
                </p>
                <Button 
                  size="sm" 
                  className="mt-3 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)]"
                >
                  Connect Calendar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[var(--accent)]/10 border-t border-[var(--border)]/30">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">
              Stay focused and make today productive! 🚀
            </p>
            <Button
              onClick={onClose}
              className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)]"
            >
              Got it!
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}