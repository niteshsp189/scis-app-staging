/**
 * Customer Calls Print Page
 * Print view for customer calls with related info
 */

import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PrintLayout } from '@/components/print/PrintLayout';
import { PrintStyles } from '@/components/print/PrintStyles';
import { CustomerCallsPrint } from '@/components/print/customer';
import { formatFullName } from '@/utils/printUtils';
import { customerService } from '@/services/customerService';
import { PolicyService } from '@/services/policyService';
import { customerActivitiesService } from '@/services/customerActivitiesService';

export const CustomerCallsPrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const customerId = Number(id);

  // Fetch customer data
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerService.getCustomer(customerId),
    enabled: !!customerId,
  });

  // Fetch policies
  const { data: policiesData, isLoading: policiesLoading } = useQuery({
    queryKey: ['customer-policies', customerId],
    queryFn: () => PolicyService.getPolicies(1, 100, { customer_id: customerId }),
    enabled: !!customerId,
  });

  // Fetch calls
  const { data: callsData, isLoading: callsLoading } = useQuery({
    queryKey: ['customer-calls', customerId],
    queryFn: () => customerActivitiesService.getCustomerActivities(customerId),
    enabled: !!customerId,
  });

  const isLoading = customerLoading || policiesLoading || callsLoading;

  // Set page title
  useEffect(() => {
    if (customer) {
      const fullName = formatFullName(
        customer.firstName,
        customer.middleName,
        customer.lastName
      ) || customer.name;
      document.title = `${fullName} - Calls Report`;
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
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading calls data...</p>
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

  const normalizedCustomer = {
    dateOfBirth: customer.dateOfBirth,
    city: customer.city,
    state: customer.state,
    zipCode: customer.zipCode,
    homePhone: customer.homePhone,
    cellPhone: customer.cellPhone,
    address: customer.address,
    apartment: customer.apartment,
    apartmentType: customer.apartmentType,
  };

  const fullName = formatFullName(
    customer.firstName,
    customer.middleName,
    customer.lastName
  ) || customer.name || 'Unknown';

  const policies = Array.isArray(policiesData) ? policiesData : (policiesData?.data || []);
  const calls = Array.isArray(callsData) ? callsData : (callsData?.data || []);

  return (
    <PrintLayout
      title={`${fullName} - Calls Report`}
      showToolbar={true}
      showHeader={true}
      showFooter={true}
    >
      <CustomerCallsPrint
        customerName={fullName}
        customer={normalizedCustomer}
        calls={calls}
        policies={policies}
        showCustomerInfo={true}
        showPolicies={true}
      />
    </PrintLayout>
  );
};

export default CustomerCallsPrintPage;
