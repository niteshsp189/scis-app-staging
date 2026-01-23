/**
 * Single Call Detail Print Page
 * Opens in new tab with full call details
 */

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PrintLayout } from '@/components/print/PrintLayout';
import { CallDetailPrint } from '@/components/print/calls';
import { customerActivitiesService, CustomerActivity } from '@/services/customerActivitiesService';
import { formatPrintDate, formatPrintTime } from '@/utils/printUtils';

export const CallDetailPrintPage = () => {
  const { id, customerId } = useParams<{ id: string; customerId: string }>();
  const [searchParams] = useSearchParams();
  const customerName = searchParams.get('customerName') || undefined;
  
  const [isLoading, setIsLoading] = useState(true);
  const [call, setCall] = useState<CustomerActivity | null>(null);
  const [answerCalls, setAnswerCalls] = useState<CustomerActivity[]>([]);
  const [parentCall, setParentCall] = useState<CustomerActivity | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCallDetails = async () => {
      if (!id || !customerId) {
        setError('Missing call or customer ID');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch the main call
        const response = await customerActivitiesService.getActivity(
          parseInt(customerId),
          parseInt(id)
        );

        if (response.success && response.data) {
          setCall(response.data);

          // If this is an answer call, fetch parent
          if (response.data.parent_activity_id) {
            try {
              const parentResponse = await customerActivitiesService.getActivity(
                parseInt(customerId),
                response.data.parent_activity_id
              );
              if (parentResponse.success) {
                setParentCall(parentResponse.data);
              }
            } catch (err) {
              console.error('Error fetching parent call:', err);
            }
          }

          // Fetch answer calls for this call
          try {
            const activitiesResponse = await customerActivitiesService.getCustomerActivities(
              parseInt(customerId),
              { per_page: 100 }
            );
            if (activitiesResponse.success) {
              const answers = activitiesResponse.data.filter(
                (activity: CustomerActivity) => activity.parent_activity_id === parseInt(id)
              );
              setAnswerCalls(answers);
            }
          } catch (err) {
            console.error('Error fetching answer calls:', err);
          }
        } else {
          setError('Call not found');
        }
      } catch (err) {
        console.error('Error fetching call details:', err);
        setError('An error occurred while loading call details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCallDetails();
  }, [id, customerId]);

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
        Loading call details...
      </div>
    );
  }

  if (error || !call) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#ef4444',
      }}>
        {error || 'Call not found'}
      </div>
    );
  }

  // Build subtitle
  const subtitle = `${formatPrintDate(call.activity_date)} at ${formatPrintTime(call.activity_time)}`;

  return (
    <PrintLayout
      title={call.title || 'Call Details'}
      subtitle={subtitle}
      customerName={customerName}
      customerId={customerId ? parseInt(customerId) : undefined}
    >
      <CallDetailPrint
        call={call}
        customerName={customerName}
        answerCalls={answerCalls}
        parentCall={parentCall}
      />
    </PrintLayout>
  );
};

export default CallDetailPrintPage;
