import React from 'react';
import { Calendar, Clock, User, MapPin, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { renderHtmlContent, stripHtml } from '@/lib/htmlUtils';

interface Appointment {
  id: string;
  title: string;
  customer_name: string;
  customer_id: number;
  start_datetime: string;
  end_datetime: string;
  type: 'in_person' | 'phone' | 'video' | 'other';
  location?: string;
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

interface DashboardAppointmentsProps {
  appointments?: Appointment[];
  upcomingCount?: number;
  loading?: boolean;
  onViewAppointment?: (appointmentId: string) => void;
  onReschedule?: (appointmentId: string) => void;
}

export const DashboardAppointments: React.FC<DashboardAppointmentsProps> = ({
  appointments = [],
  upcomingCount = 0,
  loading = false,
  onViewAppointment,
  onReschedule,
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'in_person':
        return <MapPin className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'phone':
        return 'bg-green-100 text-green-800';
      case 'video':
        return 'bg-purple-100 text-purple-800';
      case 'in_person':
        return 'bg-blue-100 text-blue-800';
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
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${timeString}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${timeString}`;
    } else {
      return `${date.toLocaleDateString('en-US', {
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
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Calendar className="h-5 w-5 text-indigo-600" />
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
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Calendar className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Upcoming Appointments
              </h3>
              <p className="text-sm text-slate-600">
                {upcomingCount} appointment{upcomingCount !== 1 ? 's' : ''} scheduled
              </p>
            </div>
          </div>
          {upcomingCount > 0 && (
            <Button variant="outline" size="sm">
              View All
            </Button>
          )}
        </div>
      </div>

      <div className="p-6">
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">No upcoming appointments</p>
            <p className="text-slate-400 text-xs mt-1">
              Schedule appointments to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className={`border rounded-lg p-4 transition-all hover:shadow-md ${getPriorityColor(
                  appointment.priority
                )}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-slate-900">
                        {appointment.title}
                      </h4>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getTypeColor(appointment.type)}`}
                      >
                        <span className="flex items-center space-x-1">
                          {getTypeIcon(appointment.type)}
                          <span className="capitalize">{appointment.type.replace('_', ' ')}</span>
                        </span>
                      </Badge>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600 mb-2">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{appointment.customer_name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDateTime(appointment.start_datetime)}</span>
                      </div>
                    </div>

                    {appointment.location && (
                      <div className="flex items-center space-x-1 text-sm text-slate-600 mb-2">
                        <MapPin className="h-4 w-4" />
                        <span>{appointment.location}</span>
                      </div>
                    )}

                    {appointment.notes && (
                      <div className="text-sm text-slate-600 bg-slate-50 rounded p-2 mt-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={renderHtmlContent(appointment.notes)} />
                    )}
                  </div>

                  <div className="flex items-center space-x-2 sm:ml-4">
                    {onViewAppointment && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewAppointment(appointment.id)}
                      >
                        View
                      </Button>
                    )}
                    {onReschedule && (
                      <Button
                        variant="ghost"
                        size="sm"
                        // onClick={() => onReschedule(appointment.id)}
                      >
                        Reschedule
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
