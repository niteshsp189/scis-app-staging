/**
 * Appointments Print Page - Table/List View
 * Opens in new tab with filtered appointment list
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PrintLayout } from '@/components/print/PrintLayout';
import { AppointmentTablePrint } from '@/components/print/appointments';
import appointmentService from '@/services/appointmentService';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const AppointmentsPrintPage = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  // Get filter params from URL
  const startDate = searchParams.get('start_date') || format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const endDate = searchParams.get('end_date') || format(endOfMonth(new Date()), 'yyyy-MM-dd');
  const status = searchParams.get('status') || undefined;
  const type = searchParams.get('type') || undefined;
  const assignedTo = searchParams.get('assigned_to') || undefined;
  const createdBy = searchParams.get('created_by') || undefined;
  const location = searchParams.get('location') || undefined;
  const groupByDate = searchParams.get('group_by_date') !== 'false';

  // Fetch appointments with filters
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['appointments-print', startDate, endDate, status, type, assignedTo, createdBy, location],
    queryFn: () => appointmentService.getAppointments({
      start_date: startDate,
      end_date: endDate,
      status: status,
      type: type,
      assigned_to: assignedTo,
      created_by: createdBy,
      location: location,
      per_page: 1000, // Get all for printing
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

  // Format date range for title
  const formatDateRange = () => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
    } catch {
      return '';
    }
  };

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
        Loading appointments...
      </div>
    );
  }

  return (
    <PrintLayout
      title="Appointments List"
      subtitle={formatDateRange()}
    >
      <AppointmentTablePrint
        appointments={appointments}
        filters={{
          startDate,
          endDate,
          status: status || undefined,
          type: type || undefined,
          assignedTo: assignedTo || undefined,
          createdBy: createdBy || undefined,
          location: location || undefined,
        }}
        groupByDate={groupByDate}
      />
    </PrintLayout>
  );
};

export default AppointmentsPrintPage;
