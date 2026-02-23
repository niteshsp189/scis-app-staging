/**
 * Reminders List Print Page
 * Opens in new tab with all filtered reminders
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PrintLayout } from '@/components/print/PrintLayout';
import { ReminderTablePrint } from '@/components/print/reminders';
import reminderService, { ReminderFilters, Reminder } from '@/services/reminderService';

export const RemindersPrintPage = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  // Parse filters from URL params
  const filters: ReminderFilters = {
    status: searchParams.get('status') || undefined,
    created_by: searchParams.get('createdBy') || undefined,
    assigned_to: searchParams.get('assignedTo') || undefined,
    my_reminders: searchParams.get('myReminders') === 'true' ? true : undefined,
    due_date_from: searchParams.get('fromDate') || undefined,
    due_date_to: searchParams.get('toDate') || undefined,
    search: searchParams.get('search') || undefined,
    sort_by: 'reminder_datetime',
    sort_order: 'asc',
    per_page: 500, // Get all reminders for printing
  };

  // Clean up filters - remove undefined and 'all' values
  const cleanFilters: ReminderFilters = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== 'all') {
      (cleanFilters as Record<string, string | number>)[key] = value;
    }
  });

  // Fetch reminders
  const { data: remindersData, isLoading: remindersLoading } = useQuery({
    queryKey: ['reminders-print', cleanFilters],
    queryFn: () => reminderService.getReminders(cleanFilters),
  });

  // Fetch employees for display names
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        // Fetch employees
        const employeesResponse = await fetch('/api/users', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
          },
        });
        if (employeesResponse.ok) {
          const employeesData = await employeesResponse.json();
          if (employeesData.success && Array.isArray(employeesData.data)) {
            setEmployees(employeesData.data.map((e: { id: string; first_name?: string; last_name?: string }) => ({
              id: e.id,
              name: `${e.first_name || ''} ${e.last_name || ''}`.trim(),
            })));
          }
        }

        // Fetch agents
        const agentsResponse = await fetch('/api/users/agents', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
          },
        });
        if (agentsResponse.ok) {
          const agentsData = await agentsResponse.json();
          if (agentsData.success && Array.isArray(agentsData.data)) {
            setAgents(agentsData.data.map((a: { id: string; name?: string; first_name?: string; last_name?: string }) => ({
              id: a.id,
              name: a.name || `${a.first_name || ''} ${a.last_name || ''}`.trim(),
            })));
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchUsersData();
  }, []);

  // Extract reminders from response
  const reminders: Reminder[] = (() => {
    if (!remindersData?.data) return [];
    const data = remindersData.data;
    
    // Handle nested pagination response
    if ('data' in data && Array.isArray(data.data)) {
      return data.data;
    }
    
    // Direct array
    if (Array.isArray(data)) {
      return data;
    }
    
    return [];
  })();

  // Update loading state
  useEffect(() => {
    setIsLoading(remindersLoading);
  }, [remindersLoading]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#6b7280',
      }}>
        Loading reminders...
      </div>
    );
  }

  // Build filter display for print component
  const filterDisplay = {
    status: searchParams.get('status') || undefined,
    createdBy: searchParams.get('createdBy') || undefined,
    assignedTo: searchParams.get('assignedTo') || undefined,
    myReminders: searchParams.get('myReminders') || undefined,
    fromDate: searchParams.get('fromDate') || undefined,
    toDate: searchParams.get('toDate') || undefined,
    search: searchParams.get('search') || undefined,
  };

  return (
    <PrintLayout
      title="Reminders List"
      subtitle={`${reminders.length} reminder${reminders.length !== 1 ? 's' : ''}`}
    >
      <ReminderTablePrint
        reminders={reminders}
        filters={filterDisplay}
        employees={employees}
        agents={agents}
      />
    </PrintLayout>
  );
};

export default RemindersPrintPage;
