import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Clock, User, Phone, MapPin, Edit, Eye } from "lucide-react";
import appointmentService, { Appointment } from "@/services/appointmentService";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditAppointmentDialog } from "@/components/dialogs/EditAppointmentDialog";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";
import { AppointmentDetailsDialog } from "@/components/dialogs/AppointmentDetailsDialog";
import { authService } from "@/services/authService";
import { useEventListener } from "@/hooks/useEventListener";
import { useIsMobile } from "@/hooks/use-mobile";

export const CalendarView = forwardRef<{ refreshAppointments: () => Promise<void> }>((props, ref) => {
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);
  const [cancellationNotes, setCancellationNotes] = useState("");
  const [statusAction, setStatusAction] = useState<{
    appointmentId: string;
    status: string;
    title: string;
    description: string;
    buttonText: string;
    variant: "default" | "destructive";
  } | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const { toast } = useToast();

  useImperativeHandle(ref, () => ({
    refreshAppointments: fetchMonthAppointments
  }));

  useEffect(() => {
    if (selectedDate) {
      fetchMonthAppointments();
    }
  }, [selectedDate]);

  // Listen for appointment creation events to refresh the view
  useEventListener("appointmentCreated", () => {
    fetchMonthAppointments();
  });

  const fetchMonthAppointments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const currentDate = selectedDate || new Date();
      // Fix timezone issue by using local date constructor
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

      // Get current user ID to filter appointments
      let currentUserId = null;
      try {
        const currentUser = await authService.getProfile();
        currentUserId = currentUser?.id;
        
      } catch (error) {
        console.warn("Could not get current user profile for month view:", error);
      }
      
      const filters: any = {
        start_date: `${year}-${(month + 1).toString().padStart(2, '0')}-01T00:00:00`,
        end_date: `${year}-${(month + 1).toString().padStart(2, '0')}-${new Date(year, month + 1, 0).getDate().toString().padStart(2, '0')}T23:59:59`,
      };
      
      // TEMPORARILY: Disable user filtering to debug
      // Filter by current user's assignments only
      // if (currentUserId) {
      //   filters.assigned_to = currentUserId;
      // }

      const response = await appointmentService.getAppointments(filters);

      if (response.success) {
        const monthAppointmentData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        
        setAllAppointments(monthAppointmentData);
      }
    } catch (err) {
      console.error("Error fetching month appointments:", err);
      setError("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const getDatesWithAppointments = () => {
    const datesWithAppointments = new Set<string>();

    allAppointments.forEach((appointment) => {
      const appointmentDate = new Date(appointment.start_datetime);
      const dateString = appointmentDate.toDateString();
      
      datesWithAppointments.add(dateString);
    });

    return datesWithAppointments;
  };

  const datesWithAppointments = getDatesWithAppointments();

  const todayAppointments = allAppointments.filter(
    (apt) => {
      if (!selectedDate) return false;
      
      const appointmentDate = new Date(apt.start_datetime);
      const selectedDateString = selectedDate.toDateString();
      const appointmentDateString = appointmentDate.toDateString();

      return appointmentDateString === selectedDateString;
    }
  );

  const handleStatusChange = (
    appointmentId: string,
    status: string,
    appointmentTitle: string,
  ) => {
    let dialogConfig;

    switch (status) {
      case "confirmed":
        dialogConfig = {
          appointmentId,
          status,
          title: "Confirm Appointment",
          description: `Are you sure you want to confirm the appointment "${appointmentTitle}"?`,
          buttonText: "Confirm Appointment",
          variant: "default" as const,
        };
        break;
      case "in_progress":
        dialogConfig = {
          appointmentId,
          status,
          title: "Start Appointment",
          description: `Are you sure you want to start the appointment "${appointmentTitle}" now?`,
          buttonText: "Start Now",
          variant: "default" as const,
        };
        break;
      case "completed":
        dialogConfig = {
          appointmentId,
          status,
          title: "Complete Appointment",
          description: `Are you sure you want to mark the appointment "${appointmentTitle}" as completed?`,
          buttonText: "Mark as Completed",
          variant: "default" as const,
        };
        break;
      case "cancelled":
        dialogConfig = {
          appointmentId,
          status,
          title: "Cancel Appointment",
          description: `Are you sure you want to cancel the appointment "${appointmentTitle}"? This action cannot be undone.`,
          buttonText: "Cancel Appointment",
          variant: "destructive" as const,
        };
        break;
      default:
        dialogConfig = {
          appointmentId,
          status,
          title: "Update Status",
          description: `Are you sure you want to update the status of "${appointmentTitle}"?`,
          buttonText: "Update Status",
          variant: "default" as const,
        };
    }

    setStatusAction(dialogConfig);
    setShowConfirmDialog(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusAction) return;

    setStatusUpdateLoading(true);
    try {
      const response = await appointmentService.updateAppointment(
        statusAction.appointmentId,
        {
          status: statusAction.status as any,
        },
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Appointment status updated successfully",
        });
        fetchMonthAppointments();
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
    } finally {
      setStatusUpdateLoading(false);
      setShowConfirmDialog(false);
      setStatusAction(null);
    }
  };

  const handleCancelAppointment = (appointment: Appointment) => {
    setCancellingAppointment(appointment);
    setCancellationNotes("");
    setShowCancelConfirm(true);
  };

  const handleConfirmCancelAppointment = async () => {
    if (!cancellingAppointment) return;

    setStatusUpdateLoading(true);
    try {
      const response = await appointmentService.updateAppointment(
        cancellingAppointment.id,
        {
          status: 'cancelled',
          cancellation_notes: cancellationNotes.trim() || null
        },
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Appointment cancelled successfully",
        });
        fetchMonthAppointments();
        setShowCancelConfirm(false);
        setCancellingAppointment(null);
        setCancellationNotes("");
      } else {
        toast({
          title: "Error",
          description: "Failed to cancel appointment",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive",
      });
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
      <div className="w-full lg:w-2/5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              onMonthChange={(month) => {
                // When month changes, update selectedDate to first day of new month
                // This will trigger fetchMonthAppointments
                const newDate = new Date(month.getFullYear(), month.getMonth(), 1);
                setSelectedDate(newDate);
              }}
              className="w-full rounded-md border"
              classNames={{
                months: "flex w-full flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4 w-full",
                caption: "flex justify-center py-2 relative items-center",
                caption_label: "text-lg font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-9 w-9 bg-transparent p-0 opacity-50 hover:opacity-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] flex-1 text-center p-2",
                row: "flex w-full mt-2",
                cell: "text-center text-sm p-0 relative flex-1 mx-1 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
              modifiers={{
                hasAppointment: (date) =>
                  datesWithAppointments.has(date.toDateString()),
              }}
              modifiersClassNames={{
                hasAppointment: "text-blue-600 font-semibold",
              }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="w-full lg:w-3/5">
        <Card>
          <CardHeader>
            <CardTitle>
              All Appointments for{" "}
              {selectedDate?.toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {/* <span className="text-sm font-normal text-gray-600 block">
                DEBUG: Showing all appointments (user filter disabled)
              </span> */}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : todayAppointments.length > 0 ? (
            <div className="space-y-2 md:space-y-3">
              {todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-3 md:p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2 md:mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-base md:text-lg">
                          {appointment.title}
                        </h4>
                      </div>
                      
                      <div className="mb-1">
                        <Badge
                          variant="outline"
                          className={appointmentService.getTypeColor(
                            appointment.appointment_type,
                          )}
                        >
                          {appointmentService.getAppointmentTypeLabel(
                            appointment.appointment_type,
                          )}
                        </Badge>
                      </div>

                      {/* {appointment.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {appointment.description}
                        </p>
                      )} */}
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={appointmentService.getStatusColor(
                          appointment.status,
                        )}
                      >
                        {appointmentService.getStatusLabel(appointment.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {appointmentService.formatTime(
                          appointment.start_datetime,
                        )}{" "}
                        -{" "}
                        {appointmentService.formatTime(
                          appointment.end_datetime,
                        )}
                      </span>
                      <span className="text-gray-400">
                        (
                        {appointmentService.getDuration(
                          appointment.start_datetime,
                          appointment.end_datetime,
                        )}
                        )
                      </span>
                    </div>

                    {appointment.customer && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>
                          {appointment.customer.first_name}{" "}
                          {appointment.customer.last_name}
                        </span>
                        {appointment.customer.cell_phone && (
                          <a
                            href={`tel:${appointment.customer.cell_phone}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    )}

                    {appointment.lead && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>
                          {appointment.lead.first_name}{" "}
                          {appointment.lead.last_name}
                        </span>
                        {appointment.lead.phone && (
                          <a
                            href={`tel:${appointment.lead.phone}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    )}

                    {appointment.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{appointment.location}</span>
                      </div>
                    )}

                    {appointment.assigned_user && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>
                          Assigned to: {appointment.assigned_user.first_name}{" "}
                          {appointment.assigned_user.last_name}
                        </span>
                      </div>
                    )}
                  </div>

                  {appointment.notes && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-gray-600">
                        <strong>Notes:</strong> {appointment.notes}
                      </p>
                    </div>
                  )}

                  <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t flex flex-wrap gap-1.5 md:gap-2">
                    <Button
                      size={isMobile ? "sm" : "default"}
                      variant="outline"
                      onClick={() => setViewingAppointment(appointment)}
                      className="text-xs md:text-sm"
                    >
                      <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size={isMobile ? "sm" : "default"}
                      variant="outline"
                      onClick={() => setEditingAppointment(appointment)}
                      className="text-xs md:text-sm"
                    >
                      <Edit className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                      Edit
                    </Button>
{/* 
                    {appointment.status === "scheduled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleStatusChange(
                            appointment.id,
                            "confirmed",
                            appointment.title,
                          )
                        }
                      >
                        Confirm
                      </Button>
                    )} */}

                    {/* {(appointment.status === "scheduled" ||
                      appointment.status === "confirmed") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleStatusChange(
                            appointment.id,
                            "in_progress",
                            appointment.title,
                          )
                        }
                      >
                        Start
                      </Button>
                    )} */}

                    {appointment.status === "in_progress" && (
                      <Button
                        size={isMobile ? "sm" : "default"}
                        variant="outline"
                        onClick={() =>
                          handleStatusChange(
                            appointment.id,
                            "completed",
                            appointment.title,
                          )
                        }
                        className="text-xs md:text-sm"
                      >
                        Complete
                      </Button>
                    )}

                    {appointment.status !== "cancelled" &&
                      appointment.status !== "completed" && (
                        <Button
                          size={isMobile ? "sm" : "default"}
                          variant="outline"
                          onClick={() => handleCancelAppointment(appointment)}
                          className="text-xs md:text-sm"
                        >
                          Cancel
                        </Button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No appointments for this day
            </p>
          )}
        </CardContent>
      </Card>
      </div>

      {editingAppointment && (
        <EditAppointmentDialog
          appointment={editingAppointment}
          open={!!editingAppointment}
          onOpenChange={(open) => {
            if (!open) {
              setEditingAppointment(null);
            }
          }}
          onAppointmentUpdated={() => {
            setEditingAppointment(null);
            fetchMonthAppointments();
          }}
        />
      )}

      {viewingAppointment && (
        <AppointmentDetailsDialog
          appointment={viewingAppointment}
          open={!!viewingAppointment}
          onOpenChange={(open) => {
            if (!open) {
              setViewingAppointment(null);
            }
          }}
          onAppointmentUpdated={() => {
            setViewingAppointment(null);
            fetchMonthAppointments();
          }}
          onAppointmentDeleted={() => {
            setViewingAppointment(null);
            fetchMonthAppointments();
          }}
        />
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
          isLoading={statusUpdateLoading}
        />
      )}

      {/* Cancellation Confirmation Dialog */}
      <Dialog open={showCancelConfirm} onOpenChange={(open) => {
        setShowCancelConfirm(open);
        if (!open) {
          setCancellationNotes("");
          setCancellingAppointment(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action will change the appointment status to cancelled.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancellation-notes">Cancellation Notes (Optional)</Label>
              <Textarea
                id="cancellation-notes"
                placeholder="Please provide a reason for cancellation..."
                value={cancellationNotes}
                onChange={(e) => setCancellationNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(false)}
              disabled={statusUpdateLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancelAppointment}
              disabled={statusUpdateLoading}
            >
              {statusUpdateLoading ? "Cancelling..." : "Cancel Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
