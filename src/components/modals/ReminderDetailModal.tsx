import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, AlertCircle, CheckCircle, Loader2, Printer } from 'lucide-react';
import { SearchResult } from '@/services/globalSearchService';
import { reminderService, Reminder } from '@/services/reminderService';
import { format } from 'date-fns';

interface ReminderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder: SearchResult | null;
}

const ReminderDetailModal: React.FC<ReminderDetailModalProps> = ({
  isOpen,
  onClose,
  reminder
}) => {
  const [fullReminder, setFullReminder] = useState<Reminder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch full reminder details when modal opens
  useEffect(() => {
    if (!isOpen || !reminder || reminder.type !== 'reminder') {
      setFullReminder(null);
      setError(null);
      return;
    }

    const fetchReminderDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const reminderData = await reminderService.getReminder(reminder.id.toString());
        setFullReminder(reminderData);
      } catch (err) {
        console.error('Failed to fetch reminder details:', err);
        setError('Failed to load reminder details');
        // Fallback to using search result data
        setFullReminder(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReminderDetails();
  }, [isOpen, reminder]);

  if (!reminder || reminder.type !== 'reminder') return null;

  // Use full reminder data if available, otherwise fall back to search result data
  const displayData = fullReminder || reminder;
  const isUsingFullData = !!fullReminder;

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return format(date, 'PPP p');
    } catch {
      return dateTimeString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Reminder Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading reminder details...</span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
              <p className="text-sm text-red-600 mt-1">Showing basic information from search results</p>
            </div>
          )}

          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {isUsingFullData ? fullReminder?.title : reminder.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {isUsingFullData ? fullReminder?.description : reminder.description}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {getStatusIcon(isUsingFullData ? fullReminder?.status || 'pending' : reminder.status)}
              <Badge className={getStatusColor(isUsingFullData ? fullReminder?.status || 'pending' : reminder.status)}>
                {isUsingFullData ? fullReminder?.status : reminder.status}
              </Badge>
            </div>
          </div>

          {/* Main Date & Time Display - Always show this prominently */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900">Scheduled Date & Time</span>
            </div>
            {isUsingFullData && fullReminder?.reminder_datetime ? (
              <div className="space-y-1">
                <p className="text-lg font-medium text-blue-900">
                  {formatDateTime(fullReminder.reminder_datetime)}
                </p>
                {fullReminder.status === 'pending' && (
                  <p className="text-sm text-blue-700">
                    Status: Pending
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-blue-700">
                  {isLoading ? 'Loading date/time...' : 'No date/time available in search results'}
                </p>
                {!isLoading && !error && (
                  <p className="text-xs text-blue-600">
                    Full details are being loaded...
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Details Grid - Only show if we have full data */}
          {isUsingFullData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assigned To */}
              {(fullReminder?.assigned_to || fullReminder?.agent_id) && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Assigned To</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {/* Try to get name from agent relationship first, then fallback to assigned_to field */}
                    {fullReminder?.agent?.name || 
                     fullReminder?.assignedAgent?.name || 
                     fullReminder?.assigned_user?.name ||
                     fullReminder?.assigned_to || 
                     'Unknown User'}
                  </p>
                </div>
              )}

              {/* Created By */}
              {fullReminder?.created_by && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Created By</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {/* Try to get name from creator relationship first, then fallback to created_by field */}
                    {fullReminder?.creator?.name ||
                     fullReminder?.createdBy?.name ||
                     fullReminder?.created_user?.name ||
                     fullReminder?.created_by ||
                     'Unknown User'}
                  </p>
                </div>
              )}

              {/* Recurring Info */}
              {fullReminder?.is_recurring && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Recurring</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Yes {fullReminder.recurring_pattern && `(${fullReminder.recurring_pattern})`}
                  </p>
                  {fullReminder.recurring_end_date && (
                    <p className="text-xs text-gray-500 mt-1">
                      Ends: {formatDateTime(fullReminder.recurring_end_date)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Customer Info from search results */}
          {reminder.details?.customer_name && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Customer</span>
              </div>
              <p className="text-sm text-gray-700">
                {reminder.details.customer_name}
              </p>
            </div>
          )}

          {/* Related Entity */}
          {isUsingFullData && (fullReminder?.customer || fullReminder?.lead || fullReminder?.deal) && (
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-3">Related To</h4>
              {fullReminder.customer && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-blue-600">Customer: </span>
                  <span className="text-sm">
                    {fullReminder.customer.first_name} {fullReminder.customer.last_name}
                  </span>
                  {fullReminder.customer.email && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({fullReminder.customer.email})
                    </span>
                  )}
                </div>
              )}
              {fullReminder.lead && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-orange-600">Lead: </span>
                  <span className="text-sm">
                    {fullReminder.lead.first_name} {fullReminder.lead.last_name}
                  </span>
                  {fullReminder.lead.email && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({fullReminder.lead.email})
                    </span>
                  )}
                </div>
              )}
              {fullReminder.deal && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-green-600">Deal: </span>
                  <span className="text-sm">
                    {fullReminder.deal.title || `Deal #${fullReminder.deal.id}`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-500 pt-4 border-t">
            <div className="flex justify-between">
              <span>Relevance Score: {reminder.relevance_score}</span>
              {isUsingFullData && fullReminder?.created_at && (
                <span>Created: {formatDateTime(fullReminder.created_at)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button 
            onClick={() => window.open(`/reminders/${reminder.id}/print`, '_blank')}
            variant="outline"
            disabled={!reminder?.id}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReminderDetailModal;