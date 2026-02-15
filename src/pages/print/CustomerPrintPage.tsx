/**
 * Customer Full Print Page
 * Comprehensive print view with all customer data
 * Opens in new tab with print/PDF options
 */

import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PrintLayout } from '@/components/print/PrintLayout';
import { PrintStyles } from '@/components/print/PrintStyles';
import {
  CustomerInfoPrint,
  CustomerPoliciesPrint,
  CustomerCallsPrint,
  CustomerNotesPrint,
  CustomerDependentsPrint,
  CustomerAppointmentsPrint,
  CustomerHistoryPrint,
  CustomerCredentialsPrint,
} from '@/components/print/customer';
import { formatFullName } from '@/utils/printUtils';
import { customerService } from '@/services/customerService';
import { PolicyService } from '@/services/policyService';
import { customerActivitiesService } from '@/services/customerActivitiesService';
import { customerNotesService } from '@/services/customerNotesService';
import { AuditService } from '@/services/auditService';
import appointmentService from '@/services/appointmentService';
import { customerCredentialsService } from '@/services/customerCredentialsService';

export const CustomerPrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  
  // Get sections to include from query params (default to all)
  const sections = useMemo(() => {
    const param = searchParams.get('sections');
    return param ? param.split(',') : [
      'info',
      'policies',
      'calls',
      'notes',
      'dependents',
      'appointments',
      'history',
      'credentials',
    ];
  }, [searchParams]);

  // Check if we should include all policies (V2 mode)
  const includeAllPolicies = searchParams.get('allPolicies') === 'true';

  const customerId = Number(id);

  // Fetch customer data
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerService.getCustomer(customerId),
    enabled: !!customerId,
  });

  // Fetch policies - if allPolicies=true, don't filter by status
  const { data: policiesData, isLoading: policiesLoading } = useQuery({
    queryKey: ['customer-policies', customerId, includeAllPolicies],
    queryFn: () => PolicyService.getPolicies(1, 100, { 
      customer_id: customerId,
      // When allPolicies is true, don't add status filter - get all policies
      // When false/not set, the API returns all by default which we'll filter on frontend
    }),
    enabled: !!customerId && sections.includes('policies'),
  });

  // Fetch calls
  const { data: callsData, isLoading: callsLoading } = useQuery({
    queryKey: ['customer-calls', customerId],
    queryFn: () => customerActivitiesService.getCustomerActivities(customerId),
    enabled: !!customerId && sections.includes('calls'),
  });

  // Fetch notes
  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ['customer-notes', customerId],
    queryFn: () => customerNotesService.getCustomerNotes(customerId),
    enabled: !!customerId && sections.includes('notes'),
  });

  // Fetch history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['customer-history', customerId],
    queryFn: () => AuditService.getCustomerAuditLogs(customerId.toString(), { per_page: 50 }),
    enabled: !!customerId && sections.includes('history'),
  });

  // Fetch appointments
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['customer-appointments', customerId],
    queryFn: () => appointmentService.getAppointments({ customer_id: customerId }),
    enabled: !!customerId && sections.includes('appointments'),
  });

  // Fetch credentials
  const { data: credentialsData, isLoading: credentialsLoading } = useQuery({
    queryKey: ['customer-credentials', customerId],
    queryFn: () => customerCredentialsService.getCustomerCredentials(customerId),
    enabled: !!customerId && sections.includes('credentials'),
  });

  // Calculate loading state
  useEffect(() => {
    const loading =
      customerLoading ||
      (sections.includes('policies') && policiesLoading) ||
      (sections.includes('calls') && callsLoading) ||
      (sections.includes('notes') && notesLoading) ||
      (sections.includes('history') && historyLoading) ||
      (sections.includes('appointments') && appointmentsLoading) ||
      (sections.includes('credentials') && credentialsLoading);

    setIsLoading(loading);
  }, [
    customerLoading,
    policiesLoading,
    callsLoading,
    notesLoading,
    historyLoading,
    appointmentsLoading,
    credentialsLoading,
    sections,
  ]);

  // Set page title when customer loads
  useEffect(() => {
    if (customer) {
      const fullName = formatFullName(
        customer.firstName,
        customer.middleName,
        customer.lastName
      ) || customer.name;
      document.title = `${fullName} - Customer Report`;
    }
  }, [customer]);

  if (isLoading) {
    return (
      <div className="print-loading">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e5e7eb',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading customer data...</p>
        </div>
        <PrintStyles />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: '#ef4444', fontSize: '14px' }}>Customer not found</p>
      </div>
    );
  }

  // Normalize customer data for print components
  const normalizedCustomer = {
    id: customer.id,
    firstName: customer.firstName,
    middleName: customer.middleName,
    lastName: customer.lastName,
    name: customer.name,
    gender: customer.gender,
    dateOfBirth: customer.dateOfBirth,
    ssn: customer.ssn,
    maritalStatus: customer.maritalStatus,
    status: customer.status,
    joinDate: customer.joinDate || customer.createdAt,
    email: customer.email,
    homePhone: customer.homePhone,
    cellPhone: customer.cellPhone,
    workPhone: customer.workPhone,
    fax: customer.fax,
    address: customer.address,
    apartment: customer.apartment,
    apartmentType: customer.apartmentType,
    city: customer.city,
    state: customer.state,
    zipCode: customer.zipCode,
    differentMailingAddress: customer.differentMailingAddress,
    mailingAddress: customer.mailingAddress,
    mailingApartment: customer.mailingApartment,
    mailingApartmentType: customer.mailingApartmentType,
    mailingCity: customer.mailingCity,
    mailingState: customer.mailingState,
    mailingZipCode: customer.mailingZipCode,
    height: customer.height,
    weight: customer.weight,
    smoker: customer.smoker,
    referral: customer.referral,
  };

  const fullName = formatFullName(
    normalizedCustomer.firstName,
    normalizedCustomer.middleName,
    normalizedCustomer.lastName
  ) || normalizedCustomer.name || 'Unknown';

  // Get all policies from response
  const allPolicies = Array.isArray(policiesData) ? policiesData : (policiesData?.data || []);
  
  // Filter policies based on mode - V2 shows all, normal shows only active
  const policies = includeAllPolicies 
    ? allPolicies 
    : allPolicies.filter((p: { status?: string }) => 
        p.status?.toLowerCase() === 'active' || p.status?.toLowerCase() === 'in force'
      );

  const calls = Array.isArray(callsData) ? callsData : (callsData?.data || []);
  const notes = Array.isArray(notesData) ? notesData : (notesData?.data || []);
  const history = Array.isArray(historyData) ? historyData : (historyData?.data || []);
  
  // Normalize appointments array - handle nested response structure
  const appointmentsList = (() => {
    if (!appointmentsData) return [];
    // Direct array
    if (Array.isArray(appointmentsData)) return appointmentsData;
    // AppointmentResponse with data property
    if ('data' in appointmentsData) {
      const innerData = appointmentsData.data;
      if (Array.isArray(innerData)) return innerData;
      // Nested pagination structure { data: { data: [...] } }
      if (innerData && typeof innerData === 'object' && 'data' in innerData && Array.isArray(innerData.data)) {
        return innerData.data;
      }
      // Single appointment
      if (innerData && typeof innerData === 'object' && 'id' in innerData) {
        return [innerData as unknown as { id: string; title?: string; appointment_type: string; status: string; start_datetime: string; end_datetime: string }];
      }
    }
    return [];
  })();

  // Normalize dependents for print component
  const dependentsList = (customer.dependents || []).map((dep, index) => ({
    id: (dep as { id?: number }).id ?? index + 1,
    firstName: (dep as { firstName?: string }).firstName || (dep as { first_name?: string }).first_name,
    lastName: (dep as { lastName?: string }).lastName || (dep as { last_name?: string }).last_name,
    name: (dep as { name?: string }).name,
    dateOfBirth: (dep as { dateOfBirth?: string }).dateOfBirth || (dep as { date_of_birth?: string }).date_of_birth,
    gender: (dep as { gender?: string }).gender,
    relationship: (dep as { relationship?: string }).relationship,
    status: (dep as { status?: string }).status,
    isDeceased: (dep as { isDeceased?: boolean }).isDeceased || (dep as { is_deceased?: boolean }).is_deceased,
  }));
  
  // Get credentials from API response - handle wrapped response { success, data }
  const credentialsRaw = (() => {
    if (!credentialsData) return null;
    // Check if wrapped in { success, data } structure
    if ('success' in (credentialsData as object) && 'data' in (credentialsData as object)) {
      return (credentialsData as unknown as { success: boolean; data: typeof credentialsData }).data;
    }
    return credentialsData;
  })();
  const credentials = credentialsRaw ? {
    medicare_number: credentialsRaw.medicare_number || '',
    bank_account_type: credentialsRaw.bank_account_type || '',
    routing_number: credentialsRaw.routing_number || '',
    account_number: credentialsRaw.account_number || '',
    medicare_gov_username: credentialsRaw.medicare_gov_username || '',
    medicare_gov_password: credentialsRaw.medicare_gov_password || '',
    medications: (credentialsRaw.medications || []).map((med) => ({
      name: med.name || '',
      dosage: med.dosage || '',
      frequency: med.frequency || '',
    })),
  } : {
    medicare_number: '',
    bank_account_type: '',
    routing_number: '',
    account_number: '',
    medicare_gov_username: '',
    medicare_gov_password: '',
    medications: [],
  };

  // Debug logging
  console.log('Print Page Data:', {
    raw: { appointmentsData, historyData, credentialsData },
    processed: {
      appointmentsList: appointmentsList?.length || 0,
      history: history?.length || 0,
      credentialsRaw,
      credentials,
    },
  });

  const reportTitle = includeAllPolicies 
    ? `${fullName} - Customer Report (All Policies)`
    : `${fullName} - Customer Report`;

  return (
    <PrintLayout
      title={reportTitle}
      showToolbar={true}
      showHeader={true}
      showFooter={true}
    >
      {sections.includes('info') && (
        <CustomerInfoPrint customer={normalizedCustomer} canViewSensitive={true} />
      )}

      {sections.includes('policies') && (
        <CustomerPoliciesPrint 
          customerName={fullName} 
          policies={policies} 
          showAllPolicies={includeAllPolicies}
        />
      )}

      {sections.includes('calls') && (
        <CustomerCallsPrint
          customerName={fullName}
          customer={normalizedCustomer}
          calls={calls}
          policies={policies}
          showCustomerInfo={false}
          showPolicies={false}
        />
      )}

      {sections.includes('notes') && <CustomerNotesPrint notes={notes} />}

      {sections.includes('dependents') && dependentsList.length > 0 && (
        <CustomerDependentsPrint dependents={dependentsList} />
      )}

      {sections.includes('appointments') && (
        <CustomerAppointmentsPrint appointments={appointmentsList} />
      )}

      {sections.includes('credentials') && (
        <CustomerCredentialsPrint credentials={credentials} canViewSensitive={true} />
      )}

      {sections.includes('history') && <CustomerHistoryPrint historyLogs={history} />}
    </PrintLayout>
  );
};

export default CustomerPrintPage;
