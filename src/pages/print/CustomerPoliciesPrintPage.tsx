/**
 * Customer Policies Print Page
 * Print view for customer policies
 */

import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PrintLayout } from '@/components/print/PrintLayout';
import { PrintStyles } from '@/components/print/PrintStyles';
import { CustomerInfoPrint, CustomerPoliciesPrint } from '@/components/print/customer';
import { formatFullName } from '@/utils/printUtils';
import { customerService } from '@/services/customerService';
import { PolicyService } from '@/services/policyService';

export const CustomerPoliciesPrintPage = () => {
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

  const isLoading = customerLoading || policiesLoading;

  // Set page title
  useEffect(() => {
    if (customer) {
      const fullName = formatFullName(
        customer.firstName,
        customer.middleName,
        customer.lastName
      ) || customer.name;
      document.title = `${fullName} - Policies Report`;
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
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading policies data...</p>
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
  };

  const fullName = formatFullName(
    normalizedCustomer.firstName,
    normalizedCustomer.middleName,
    normalizedCustomer.lastName
  ) || normalizedCustomer.name || 'Unknown';

  const policies = Array.isArray(policiesData) ? policiesData : (policiesData?.data || []);

  return (
    <PrintLayout
      title={`${fullName} - Policies Report`}
      showToolbar={true}
      showHeader={true}
      showFooter={true}
    >
      <CustomerInfoPrint customer={normalizedCustomer} canViewSensitive={false} />
      <CustomerPoliciesPrint customerName={fullName} policies={policies} />
    </PrintLayout>
  );
};

export default CustomerPoliciesPrintPage;
