'use client';

import { useState, useEffect } from 'react';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
  type: 'meeting' | 'appointment' | 'reminder' | 'block';
  isAllDay?: boolean;
  color?: string;
}

export interface CalendarIntegration {
  isConnected: boolean;
  provider?: 'google' | 'outlook' | 'apple';
  email?: string;
}

export function useCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [integration, setIntegration] = useState<CalendarIntegration>({
    isConnected: false
  });
  const [isLoading, setIsLoading] = useState(false);

  // Mock calendar events for demonstration
  const mockEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Daily Standup',
      start: new Date(new Date().setHours(9, 0, 0, 0)),
      end: new Date(new Date().setHours(9, 30, 0, 0)),
      type: 'meeting',
      location: 'Video Call',
      attendees: ['team@company.com'],
      color: '#10B981'
    },
    {
      id: '2',
      title: 'Client Presentation',
      start: new Date(new Date().setHours(14, 0, 0, 0)),
      end: new Date(new Date().setHours(15, 0, 0, 0)),
      type: 'meeting',
      location: 'Conference Room A',
      attendees: ['client@example.com', 'manager@company.com'],
      color: '#8B5CF6'
    },
    {
      id: '3',
      title: 'Project Review',
      start: new Date(new Date().setHours(16, 0, 0, 0)),
      end: new Date(new Date().setHours(17, 30, 0, 0)),
      type: 'meeting',
      attendees: ['dev-team@company.com'],
      color: '#F59E0B'
    },
    {
      id: '4',
      title: 'Focus Time - Development',
      start: new Date(new Date().setHours(10, 0, 0, 0)),
      end: new Date(new Date().setHours(12, 0, 0, 0)),
      type: 'block',
      color: '#EF4444'
    }
  ];

  // Get today's events
  const getTodayEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= today && eventDate < tomorrow;
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  };

  // Get upcoming events (next 7 days)
  const getUpcomingEvents = (days: number = 7) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= today && eventDate < futureDate;
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  };

  // Format time for display
  const formatEventTime = (start: Date, end: Date) => {
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  // Connect to calendar provider
  const connectCalendar = async (provider: 'google' | 'outlook' | 'apple') => {
    setIsLoading(true);
    try {
      // Mock integration - replace with actual OAuth flow
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIntegration({
        isConnected: true,
        provider,
        email: `user@${provider === 'google' ? 'gmail.com' : provider === 'outlook' ? 'outlook.com' : 'icloud.com'}`
      });
      
      // Load mock events after connection
      setEvents(mockEvents);
      
      // Store integration in localStorage
      localStorage.setItem('calendarIntegration', JSON.stringify({
        isConnected: true,
        provider,
        email: `user@${provider === 'google' ? 'gmail.com' : provider === 'outlook' ? 'outlook.com' : 'icloud.com'}`
      }));
      
    } catch (error) {
      console.error('Failed to connect calendar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect calendar
  const disconnectCalendar = () => {
    setIntegration({ isConnected: false });
    setEvents([]);
    localStorage.removeItem('calendarIntegration');
  };

  // Load saved integration on mount
  useEffect(() => {
    const savedIntegration = localStorage.getItem('calendarIntegration');
    if (savedIntegration) {
      try {
        const parsed = JSON.parse(savedIntegration);
        setIntegration(parsed);
        if (parsed.isConnected) {
          setEvents(mockEvents);
        }
      } catch (error) {
        console.error('Failed to parse saved calendar integration:', error);
      }
    }
  }, []);

  return {
    events,
    integration,
    isLoading,
    getTodayEvents,
    getUpcomingEvents,
    formatEventTime,
    connectCalendar,
    disconnectCalendar
  };
}