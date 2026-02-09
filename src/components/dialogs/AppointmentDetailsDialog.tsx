import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  FileText,
  Edit,
  Trash2,
  X,
  Printer,
  UserCheck
} from "lucide-react";
import { Appointment } from "@/services/appointmentService";
import appointmentService from "@/services/appointmentService";
import { toast } from "@/components/ui/use-toast";
import { EditAppointmentDialog } from "./EditAppointmentDialog";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { renderHtmlContent } from "@/lib/htmlUtils";
import { useAuth } from "@/contexts/AuthContext";

interface AppointmentDetailsDialogProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAppointmentUpdated?: () => void;
  onAppointmentDeleted?: () => void;
}

export const AppointmentDetailsDialog = ({
  appointment,
  open,
  onOpenChange,
  onAppointmentUpdated,
  onAppointmentDeleted,
}: AppointmentDetailsDialogProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cancellationNotes, setCancellationNotes] = useState("");
  const { user: currentUser } = useAuth();

  if (!appointment) return null;

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleAssignToMe = async () => {
    if (!currentUser?.id) {
      toast({
        title: "Error",
        description: "Unable to identify current user",
        variant: "destructive",
      });
      return;
    }
    setAssigning(true);
    try {
      await appointmentService.updateAppointment(appointment.id, {
        assigned_to: currentUser.id,
      });
      toast({
        title: "Success",
        description: "Appointment assigned to you successfully",
      });
      onAppointmentUpdated?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to assign appointment:", error);
      toast({
        title: "Error",
        description: "Failed to assign appointment",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleCancel = () => {
    setCancellationNotes("");
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = async () => {
    setShowCancelConfirm(false);
    setCancelling(true);
    try {
      await appointmentService.updateAppointment(appointment.id, {
        status: 'cancelled',
        cancellation_notes: cancellationNotes.trim() || null
      });
      toast({
        title: "Success",
        description: "Appointment cancelled successfully",
      });
      onAppointmentUpdated?.();
      onOpenChange(false);
      setCancellationNotes(""); // Reset for next use
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);
    try {
      await appointmentService.deleteAppointment(appointment.id);
      toast({
        title: "Success",
        description: "Appointment deleted successfully",
      });
      onAppointmentDeleted?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete appointment:", error);
      toast({
        title: "Error",
        description: "Failed to delete appointment",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'new_client': 'bg-green-100 text-green-800 hover:bg-green-100',
      'supplement': 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      'part_d': 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      'rate_increase': 'bg-orange-100 text-orange-800 hover:bg-orange-100',
      'under_65': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      'dental_vision': 'bg-pink-100 text-pink-800 hover:bg-pink-100',
      'review': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
      'customer_service': 'bg-teal-100 text-teal-800 hover:bg-teal-100',
      'field_time': 'bg-red-100 text-red-800 hover:bg-red-100',
      'life_insurance': 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
      'consultation': 'bg-cyan-100 text-cyan-800 hover:bg-cyan-100',
      'follow_up': 'bg-amber-100 text-amber-800 hover:bg-amber-100',
      'policy_review': 'bg-violet-100 text-violet-800 hover:bg-violet-100',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'confirmed': 'bg-green-100 text-green-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'no_show': 'bg-gray-100 text-gray-800',
      'rescheduled': 'bg-purple-100 text-purple-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {appointment.status === 'cancelled' ? 'Cancelled Appointment' : 'Appointment Details'}
            </DialogTitle>
            <DialogDescription>
              {appointment.status === 'cancelled'
                ? 'This appointment has been cancelled'
                : 'View and manage appointment information'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 h-[calc(90vh-200px)] overflow-y-auto">
            <div className="space-y-6">
              {/* Title and Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{appointment.title}</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    {appointment.appointment_type.split(',').map((type, index) => (
                      <Badge key={index} className={getTypeColor(type.trim())}>
                        {appointmentService.getAppointmentTypeLabel(type.trim())}
                      </Badge>
                    ))}
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status === 'cancelled' ? 'Cancelled' :
                        appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1).replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Date and Time */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">Date</div>
                        <div className="text-sm text-gray-600">
                          {new Date(appointment.start_datetime).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">Time</div>
                        <div className="text-sm text-gray-600">
                          {new Date(appointment.start_datetime).toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: true, hour: 'numeric', minute: '2-digit' })} - {new Date(appointment.end_datetime).toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: true, hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>



              {/* Customer and Assignment */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">Customer</div>
                        <div className="text-sm text-gray-600">
                          {appointment.customer ? `${appointment.customer.first_name} ${appointment.customer.last_name}` : 'N/A'}
                        </div>
                        {appointment.customer?.email && (
                          <div className="text-xs text-gray-500">{appointment.customer.email}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">Assigned To</div>
                        <div className="text-sm text-gray-600">
                          {appointment.assigned_user ? `${appointment.assigned_user.first_name} ${appointment.assigned_user.last_name}` : <span className="italic text-gray-400">Any (Unassigned)</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              {appointment.location && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">Location</div>
                        <div className="text-sm text-gray-600">
                          {appointment.office_location
                            ? `${appointment.office_location.name} - ${appointment.office_location.city}, ${appointment.office_location.state}`
                            : appointment.location
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {(appointment.notes || appointment.description) && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Notes</div>
                        <div 
                          className="text-sm text-gray-600 mt-1 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={renderHtmlContent(appointment.notes || appointment.description || '')}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}


              {/* Status */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${appointment.status === 'cancelled' ? 'bg-red-500' :
                      appointment.status === 'confirmed' ? 'bg-green-500' :
                        appointment.status === 'scheduled' ? 'bg-blue-500' :
                          appointment.status === 'in_progress' ? 'bg-yellow-500' :
                            appointment.status === 'completed' ? 'bg-green-500' :
                              'bg-gray-500'
                      }`}></div>
                    <div>
                      <div className="text-sm font-medium">Status</div>
                      <div className={`text-sm font-semibold ${appointment.status === 'cancelled' ? 'text-red-700' :
                        appointment.status === 'confirmed' ? 'text-green-600' :
                          appointment.status === 'scheduled' ? 'text-blue-600' :
                            appointment.status === 'in_progress' ? 'text-yellow-600' :
                              appointment.status === 'completed' ? 'text-green-600' :
                                'text-gray-600'
                        }`}>
                        {appointment.status === 'cancelled' ? 'Cancelled' :
                          appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1).replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Cancellation Notes - Show separately for cancelled appointments */}
              {appointment.status === 'cancelled' && appointment.cancellation_notes && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-red-800">Cancellation Notes</div>
                        <div className="text-sm text-red-700 mt-1 p-3 bg-red-50 border border-red-200 rounded-md">
                          {appointment.cancellation_notes}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
              <Button
                variant="outline"
                onClick={() => window.open(`/appointments/${appointment.id}/print`, '_blank')}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                variant="outline"
                onClick={handleAssignToMe}
                disabled={assigning || appointment.assigned_to === currentUser?.id}
                className="gap-2"
              >
                <UserCheck className="h-4 w-4" />
                {assigning ? "Assigning..." : "Assign to Me"}
              </Button>
              <Button
                variant="outline"
                onClick={handleEdit}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            {(appointment.status === 'confirmed' || appointment.status === 'scheduled') && (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={cancelling}
                className="gap-2 text-orange-600 hover:text-orange-700"
              >
                <X className="h-4 w-4" />
                {cancelling ? "Cancelling..." : "Cancel"}
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {showEditDialog && appointment && (
        <EditAppointmentDialog
          appointment={appointment}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onAppointmentUpdated={() => {
            setShowEditDialog(false);
            onAppointmentUpdated?.();
          }}
        />
      )}

      {/* Confirmation Dialogs */}
      {/* Custom Cancellation Dialog with Notes */}
      <Dialog open={showCancelConfirm} onOpenChange={(open) => {
        setShowCancelConfirm(open);
        if (!open) setCancellationNotes("");
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
              disabled={cancelling}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling..." : "Cancel Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Delete Appointment"
        description="Are you sure you want to permanently delete this appointment? This action cannot be undone."
        confirmButtonText="Delete"
        variant="destructive"
        isLoading={deleting}
      />
    </>
  );
};
