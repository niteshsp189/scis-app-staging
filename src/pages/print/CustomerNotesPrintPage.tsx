/**
 * Customer Notes Print Page
 * Print view for customer notes
 */

import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PrintLayout } from '@/components/print/PrintLayout';
import { PrintStyles } from '@/components/print/PrintStyles';
import { CustomerNotesPrint } from '@/components/print/customer';
import { formatFullName } from '@/utils/printUtils';
import { customerService } from '@/services/customerService';
import { customerNotesService } from '@/services/customerNotesService';

export const CustomerNotesPrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const customerId = Number(id);

  // Fetch customer data
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerService.getCustomer(customerId),
    enabled: !!customerId,
  });

  // Fetch notes
  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ['customer-notes', customerId],
    queryFn: () => customerNotesService.getCustomerNotes(customerId),
    enabled: !!customerId,
  });

  const isLoading = customerLoading || notesLoading;

  // Set page title
  useEffect(() => {
    if (customer) {
      const fullName = formatFullName(
        customer.firstName,
        customer.middleName,
        customer.lastName
      ) || customer.name;
      document.title = `${fullName} - Notes Report`;
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
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading notes data...</p>
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

  const fullName = formatFullName(
    customer.firstName,
    customer.middleName,
    customer.lastName
  ) || customer.name || 'Unknown';

  const notes = Array.isArray(notesData) ? notesData : (notesData?.data || []);

  return (
    <PrintLayout
      title={`${fullName} - Notes Report`}
      showToolbar={true}
      showHeader={true}
      showFooter={true}
    >
      <CustomerNotesPrint notes={notes} />
    </PrintLayout>
  );
};

export default CustomerNotesPrintPage;
