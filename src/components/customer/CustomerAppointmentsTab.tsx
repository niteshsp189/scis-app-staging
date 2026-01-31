import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, User, MapPin, Plus, Edit } from "lucide-react";
import appointmentService, { Appointment } from "@/services/appointmentService";
import { useToast } from "@/hooks/use-toast";
import { renderHtmlContent, stripHtml } from "@/lib/htmlUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScheduleMeetingDialog } from "@/components/dialogs/ScheduleMeetingDialog";
import { EditAppointmentDialog } from "@/components/dialogs/EditAppointmentDialog";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";
import { useEventListener } from "@/hooks/useEventListener";

interface CustomerAppointmentsTabProps {
  customerId: number;
  customerName: string;
}

export function CustomerAppointmentsTab({ customerId, customerName }: CustomerAppointmentsTabProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAppointments();
  }, [customerId]);
  
  // Handle appointment events
  const handleAppointmentEvent = useCallback(() => {
    fetchAppointments();
  }, []);
  
  // Use our custom hooks for event listening
  useEventListener('appointmentCreated', handleAppointmentEvent);
  useEventListener('appointmentUpdated', handleAppointmentEvent);
  
  // Check for expired appointments and update their status if needed
  useEffect(() => {
    const checkExpiredAppointments = async () => {
      if (!appointments.length) return;
      
      const now = new Date();
      const expiredAppointments = appointments.filter(apt => {
        const endTime = new Date(apt.end_datetime);
        return endTime < now && 
               (apt.status === 'scheduled' || apt.status === 'confirmed') &&
               !apt.status.includes('no_show') &&
               !apt.status.includes('cancelled');
      });
      
      // Update expired appointments to "no_show" status
      for (const apt of expiredAppointments) {
        try {
          await appointmentService.updateAppointment(apt.id, {
            status: 'no_show' as any
          });
          // Don't show toast for each update to avoid spamming
        } catch (err) {
          console.error(`Failed to update expired appointment ${apt.id}:`, err);
        }
      }
      
      // If any appointments were updated, refresh the list
      if (expiredAppointments.length > 0) {
        fetchAppointments();
      }
    };
    
    checkExpiredAppointments();
    
    // Set up a timer to check every minute
    const intervalId = setInterval(checkExpiredAppointments, 60000);
    
    return () => clearInterval(intervalId);
  }, [appointments]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await appointmentService.getAppointments({
        customer_id: customerId,
        per_page: 50
      });

      if (response.success) {
        const appointmentData = Array.isArray(response.data) 
          ? response.data 
          : 'data' in response.data 
            ? response.data.data 
            : [];
        setAppointments(appointmentData);
      } else {
        setError('Failed to load appointments');
      }
    } catch (err) {
      setError('Failed to load appointments');
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await appointmentService.updateAppointment(appointmentId, {
        status: newStatus as any
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Appointment status updated successfully",
        });
        fetchAppointments();
      } else {
        toast({
          title: "Error",
          description: "Failed to update appointment status",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive",
      });
    }
  };

  const upcomingAppointments = appointments.filter(apt => 
    appointmentService.isUpcoming(apt.start_datetime)
  );

  const pastAppointments = appointments.filter(apt => 
    appointmentService.isPast(apt.start_datetime)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Customer Appointments</h3>
        <ScheduleMeetingDialog
          customerId={customerId}
          customerName={customerName}
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          }
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <CalendarIcon className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">
              No appointments scheduled for this customer
            </p>
            <ScheduleMeetingDialog
              customerId={customerId}
              customerName={customerName}
              trigger={
                <Button className="mt-4" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule First Meeting
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {upcomingAppointments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {pastAppointments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Past Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pastAppointments.slice(0, 10).map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onStatusUpdate={handleStatusUpdate}
                      showActions={false}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

interface AppointmentCardProps {
  appointment: Appointment;
  onStatusUpdate: (appointmentId: string, newStatus: string) => void;
  showActions?: boolean;
}

function AppointmentCard({ appointment, onStatusUpdate, showActions = true }: AppointmentCardProps) {
  const isUpcoming = appointmentService.isUpcoming(appointment.start_datetime);
  const isToday = appointmentService.isToday(appointment.start_datetime);
  
  // State for confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [statusAction, setStatusAction] = useState<{
    status: string;
    title: string;
    description: string;
    buttonText: string;
    variant: "default" | "destructive";
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = (status: string) => {
    let dialogConfig;
    
    switch (status) {
      case 'confirmed':
        dialogConfig = {
          status,
          title: "Confirm Appointment",
          description: `Are you sure you want to confirm the appointment "${appointment.title}"?`,
          buttonText: "Confirm Appointment",
          variant: "default" as const
        };
        break;
      case 'in_progress':
        dialogConfig = {
          status,
          title: "Start Appointment",
          description: `Are you sure you want to start the appointment "${appointment.title}" now?`,
          buttonText: "Start Now",
          variant: "default" as const
        };
        break;
      case 'completed':
        dialogConfig = {
          status,
          title: "Complete Appointment",
          description: `Are you sure you want to mark the appointment "${appointment.title}" as completed?`,
          buttonText: "Mark as Completed",
          variant: "default" as const
        };
        break;
      case 'cancelled':
        dialogConfig = {
          status,
          title: "Cancel Appointment",
          description: `Are you sure you want to cancel the appointment "${appointment.title}"? This action cannot be undone.`,
          buttonText: "Cancel Appointment",
          variant: "destructive" as const
        };
        break;
      default:
        dialogConfig = {
          status,
          title: "Update Status",
          description: `Are you sure you want to update the status of "${appointment.title}"?`,
          buttonText: "Update Status",
          variant: "default" as const
        };
    }

    setStatusAction(dialogConfig);
    setShowConfirmDialog(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusAction) return;
    
    setLoading(true);
    try {
      await onStatusUpdate(appointment.id, statusAction.status);
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
      setStatusAction(null);
    }
  };

  // Fix title display: avoid 'undefined undefined' by using valid properties and fallback values
  const appointmentTypeLabel = appointmentService.getAppointmentTypeLabel(appointment.appointment_type);
  const assignedUserName = appointment.assigned_user ? `${appointment.assigned_user.first_name} ${appointment.assigned_user.last_name}` : '';
  // If you want to show more info in the title, use only defined values
  const displayTitle = `${appointmentTypeLabel}${assignedUserName ? ' - ' + assignedUserName : ''}`;

  return (
    <div className={`p-4 border rounded-lg hover:bg-gray-50 ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold">{displayTitle}</h4>
            <Badge 
              variant="outline" 
              className={appointmentService.getTypeColor(appointment.appointment_type)}
            >
              {appointmentTypeLabel}
            </Badge>
            {isToday && (
              <Badge variant="default" className="bg-blue-500">
                Today
              </Badge>
            )}
          </div>
          
          {appointment.description && (
            <div className="text-sm text-gray-600 mb-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={renderHtmlContent(appointment.description)} />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <EditAppointmentDialog 
            appointment={appointment}
            trigger={
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Edit className="h-4 w-4" />
              </Button>
            }
          />
          <Badge 
            variant="outline" 
            className={appointmentService.getStatusColor(appointment.status)}
          >
            {appointmentService.getStatusLabel(appointment.status)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>
            {appointmentService.formatDateTime(appointment.start_datetime)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>
            Duration: {appointmentService.getDuration(appointment.start_datetime, appointment.end_datetime)}
          </span>
        </div>
        
        {appointment.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{appointment.location}</span>
          </div>
        )}
        
        {appointment.assigned_user && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Assigned to: {appointment.assigned_user.first_name} {appointment.assigned_user.last_name}</span>
          </div>
        )}
      </div>

      {appointment.notes && (
        <div className="mt-3 pt-3 border-t">
          <div className="text-sm text-gray-600">
            <strong>Notes:</strong> <span dangerouslySetInnerHTML={renderHtmlContent(appointment.notes)} />
          </div>
        </div>
      )}

      {showActions && isUpcoming && (
        <div className="mt-3 pt-3 border-t">
          {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleStatusChange('cancelled')}
              >
                Cancel
              </Button>
            </div>
          )}

          {appointment.status === 'in_progress' && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleStatusChange('completed')}
              >
                Complete
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleStatusChange('cancelled')}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      {statusAction && (
        <ConfirmationDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          onConfirm={handleConfirmStatusChange}
          title={statusAction.title}
          description={statusAction.description}
          confirmButtonText={statusAction.buttonText}
          variant={statusAction.variant}
          isLoading={loading}
        />
      )}
    </div>
  );
}
