import React from 'react';
import { Phone, Clock, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

interface Call {
  id: string;
  customer_name: string;
  customer_id: number;
  customer_status?: string;
  scheduled_at: string;
  type: 'scheduled' | 'follow_up' | 'reminder' | 'other';
  notes?: string;
  description?: string;
  status: 'pending' | 'completed' | 'missed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
}

interface DashboardCallsProps {
  calls?: Call[];
  upcomingCount?: number;
  loading?: boolean;
  onViewCall?: (callId: string) => void;
}

export const DashboardCalls: React.FC<DashboardCallsProps> = ({
  calls = [],
  upcomingCount = 0,
  loading = false,
  onViewCall,
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'follow_up':
        return 'bg-green-100 text-green-800';
      case 'reminder':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const timeString = date.toLocaleTimeString('en-US', {
      timeZone: 'UTC',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const dateUTC = date.toLocaleDateString('en-US', { timeZone: 'UTC' });
    const todayUTC = today.toLocaleDateString('en-US', { timeZone: 'UTC' });
    const tomorrowUTC = tomorrow.toLocaleDateString('en-US', { timeZone: 'UTC' });

    if (dateUTC === todayUTC) {
      return `Today at ${timeString}`;
    } else if (dateUTC === tomorrowUTC) {
      return `Tomorrow at ${timeString}`;
    } else {
      return `${date.toLocaleDateString('en-US', {
        timeZone: 'UTC',
        month: 'short',
        day: 'numeric',
      })} at ${timeString}`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Phone className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Calls
              </h3>
              <p className="text-sm text-slate-600">
                {upcomingCount} upcoming call{upcomingCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {upcomingCount > 0 && (
            <Link to="/calls">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="p-6">
        {calls.length === 0 ? (
          <div className="text-center py-8">
            <Phone className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">No upcoming calls</p>
            <p className="text-slate-400 text-xs mt-1">
              Schedule calls to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {calls.map((call) => (
              <div
                key={call.id}
                className={`border rounded-lg p-4 transition-all hover:shadow-md ${getPriorityColor(
                  call.priority
                )}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getTypeColor(call.type)}`}
                      >
                        <span className="capitalize">{call.type.replace('_', ' ')}</span>
                      </Badge>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600 mb-2">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{call.customer_name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDateTime(call.scheduled_at)}</span>
                      </div>
                    </div>

                    {call.notes && (
                      <div className="flex items-start space-x-1 text-sm text-slate-600 bg-slate-50 rounded p-2 mt-2">
                        <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{call.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 sm:ml-4">
                    {onViewCall && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewCall(call.id)}
                        className="border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
