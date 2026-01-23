/**
 * Single Appointment Print Page
 * Opens in new tab with full appointment details
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PrintLayout } from '@/components/print/PrintLayout';
import { AppointmentDetailPrint } from '@/components/print/appointments';
import appointmentService, { Appointment } from '@/services/appointmentService';
import { PolicyService } from '@/services/policyService';
import { customerService } from '@/services/customerService';
import { formatPrintDate, formatPrintTime } from '@/utils/printUtils';

// Type for customer data from service (handles both camelCase and snake_case)
interface CustomerDataResponse {
  id: number;
  first_name?: string;
  firstName?: string;
  middle_name?: string;
  middleName?: string;
  last_name?: string;
  lastName?: string;
  date_of_birth?: string;
  dateOfBirth?: string;
  gender?: string;
  cell_phone?: string;
  cellPhone?: string;
  home_phone?: string;
  homePhone?: string;
  work_phone?: string;
  workPhone?: string;
  email?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  zipCode?: string;
}

export const AppointmentDetailPrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch appointment
  const { data: appointmentData, isLoading: appointmentLoading } = useQuery({
    queryKey: ['appointment-print', id],
    queryFn: () => appointmentService.getAppointment(id!),
    enabled: !!id,
  });

  // Extract appointment from response - handle nested response structure
  const appointment: Appointment | null = (() => {
    if (!appointmentData?.data) return null;
    const data = appointmentData.data;
    
    // If it's an array, get first item
    if (Array.isArray(data)) {
      return data[0] || null;
    }
    
    // If it has 'data' property (nested), extract it
    if (typeof data === 'object' && 'data' in data) {
      const nested = (data as { data: Appointment[] }).data;
      if (Array.isArray(nested)) {
        return nested[0] || null;
      }
    }
    
    // Direct appointment object
    if ('id' in data && 'start_datetime' in data) {
      return data as Appointment;
    }
    
    return null;
  })();

  // Get customer ID from appointment
  const customerId = appointment?.customer_id;

  // Fetch customer details if available
  const { data: customerData, isLoading: customerLoading } = useQuery({
    queryKey: ['customer-for-appointment', customerId],
    queryFn: () => customerService.getCustomer(customerId!),
    enabled: !!customerId,
  });

  // Fetch customer's policies if available
  const { data: policiesData, isLoading: policiesLoading } = useQuery({
    queryKey: ['policies-for-appointment', customerId],
    queryFn: () => PolicyService.getPolicies(1, 100, { 
      customer_id: customerId!,
    }),
    enabled: !!customerId,
  });

  // Extract policies array
  const policies = (() => {
    if (!policiesData?.data) return [];
    if (Array.isArray(policiesData.data)) {
      return policiesData.data;
    }
    if ('data' in policiesData && Array.isArray(policiesData.data)) {
      return policiesData.data;
    }
    return [];
  })();

  // Update loading state
  useEffect(() => {
    setIsLoading(appointmentLoading || (customerId ? customerLoading || policiesLoading : false));
  }, [appointmentLoading, customerLoading, policiesLoading, customerId]);

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
        Loading appointment details...
      </div>
    );
  }

  if (!appointment) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#ef4444',
      }}>
        Appointment not found
      </div>
    );
  }

  // Build subtitle with date and time
  const subtitle = `${formatPrintDate(appointment.start_datetime)} at ${formatPrintTime(appointment.start_datetime)}`;

  // Cast customer data for flexible property access
  const cust = customerData as CustomerDataResponse | undefined;

  // Get customer name - handle different property naming conventions
  const customerName = cust
    ? `${cust.first_name || cust.firstName || ''} ${cust.last_name || cust.lastName || ''}`.trim()
    : undefined;

  // Transform customer data for the print component
  const customerForPrint = cust ? {
    id: cust.id,
    first_name: cust.first_name || cust.firstName || '',
    middle_name: cust.middle_name || cust.middleName,
    last_name: cust.last_name || cust.lastName || '',
    date_of_birth: cust.date_of_birth || cust.dateOfBirth,
    gender: cust.gender,
    cell_phone: cust.cell_phone || cust.cellPhone,
    home_phone: cust.home_phone || cust.homePhone,
    work_phone: cust.work_phone || cust.workPhone,
    email: cust.email,
    address: cust.address,
    address2: cust.address2,
    city: cust.city,
    state: cust.state,
    zip_code: cust.zip_code || cust.zipCode,
  } : null;

  return (
    <PrintLayout
      title={appointment.title || 'Appointment Details'}
      subtitle={subtitle}
      customerName={customerName}
      customerId={cust?.id}
    >
      <AppointmentDetailPrint
        appointment={appointment}
        customer={customerForPrint}
        policies={policies}
      />
    </PrintLayout>
  );
};

export default AppointmentDetailPrintPage;
