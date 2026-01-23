/**
 * Appointments Calendar Print Page
 * Opens in new tab with calendar grid view of appointments
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PrintLayout } from '@/components/print/PrintLayout';
import { AppointmentCalendarPrint } from '@/components/print/appointments';
import appointmentService from '@/services/appointmentService';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const AppointmentCalendarPrintPage = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  // Get filter params from URL
  const now = new Date();
  const year = parseInt(searchParams.get('year') || String(now.getFullYear()));
  const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1));
  const status = searchParams.get('status') || undefined;
  const type = searchParams.get('type') || undefined;
  const assignedTo = searchParams.get('assigned_to') || undefined;
  const assignedToName = searchParams.get('assigned_to_name') || undefined;
  const location = searchParams.get('location') || undefined;

  // Calculate date range for the month
  const monthDate = new Date(year, month - 1, 1);
  const startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd');

  // Fetch appointments with filters
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['appointments-calendar-print', year, month, status, type, assignedTo, location],
    queryFn: () => appointmentService.getAppointments({
      start_date: startDate,
      end_date: endDate,
      status: status,
      type: type,
      assigned_to: assignedTo,
      location: location,
      per_page: 1000, // Get all for calendar
    }),
  });

  // Extract appointments array from response
  const appointments = (() => {
    if (!appointmentsData?.data) return [];
    
    // Handle different response formats
    if (Array.isArray(appointmentsData.data)) {
      return appointmentsData.data;
    }
    if ('data' in appointmentsData.data && Array.isArray(appointmentsData.data.data)) {
      return appointmentsData.data.data;
    }
    return [];
  })();

  // Update loading state
  useEffect(() => {
    setIsLoading(appointmentsLoading);
  }, [appointmentsLoading]);

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
        Loading calendar...
      </div>
    );
  }

  const monthName = format(monthDate, 'MMMM yyyy');

  return (
    <PrintLayout
      title={`Appointments Calendar - ${monthName}`}
    >
      <AppointmentCalendarPrint
        appointments={appointments}
        year={year}
        month={month}
        filters={{
          status: status || undefined,
          type: type || undefined,
          assignedTo: assignedTo || undefined,
          assignedToName: assignedToName || undefined,
          location: location || undefined,
        }}
      />
    </PrintLayout>
  );
};

export default AppointmentCalendarPrintPage;
