/**
 * Single Reminder Print Page
 * Opens in new tab with full reminder details
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PrintLayout } from '@/components/print/PrintLayout';
import { ReminderDetailPrint } from '@/components/print/reminders';
import reminderService, { Reminder } from '@/services/reminderService';
import { formatPrintDate, formatPrintTime } from '@/utils/printUtils';

export const ReminderDetailPrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch reminder
  const { data: reminder, isLoading: reminderLoading } = useQuery({
    queryKey: ['reminder-print', id],
    queryFn: () => reminderService.getReminder(id!),
    enabled: !!id,
  });

  // Update loading state
  useEffect(() => {
    setIsLoading(reminderLoading);
  }, [reminderLoading]);

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
        Loading reminder details...
      </div>
    );
  }

  if (!reminder) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#ef4444',
      }}>
        Reminder not found
      </div>
    );
  }

  // Build subtitle with due date/time
  const subtitle = `Due: ${formatPrintDate(reminder.reminder_datetime)} at ${formatPrintTime(reminder.reminder_datetime)}`;

  // Get contact name if available
  const customerName = reminder.customer 
    ? `${reminder.customer.first_name} ${reminder.customer.last_name}`
    : reminder.lead 
      ? `${reminder.lead.first_name} ${reminder.lead.last_name}`
      : undefined;

  const customerId = reminder.customer?.id || reminder.lead?.id;

  return (
    <PrintLayout
      title={reminder.title || 'Reminder Details'}
      subtitle={subtitle}
      customerName={customerName}
      customerId={customerId}
    >
      <ReminderDetailPrint reminder={reminder} />
    </PrintLayout>
  );
};

export default ReminderDetailPrintPage;
