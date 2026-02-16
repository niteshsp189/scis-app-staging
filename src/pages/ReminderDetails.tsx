import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Edit, 
  Trash2,
  CheckCircle,
  Bell,
  Cake,
  FileText,
  AlertTriangle
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import reminderService, { Reminder } from "@/services/reminderService";
import { getCustomerViewUrl } from "@/utils/customerRoutes";
import { format } from "date-fns";

const ReminderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) {
      loadReminder();
    }
  }, [id]);

  const loadReminder = async () => {
    try {
      setLoading(true);
      const data = await reminderService.getReminder(id!);
      setReminder(data);
    } catch (error: any) {
      console.error("Failed to fetch reminder:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load reminder",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!reminder) return;
    
    try {
      await reminderService.updateReminder(reminder.id, { status: "completed" });
      toast({
        title: "Success",
        description: "Reminder marked as completed",
      });
      loadReminder();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update reminder",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!reminder) return;

    try {
      await reminderService.deleteReminder(reminder.id);
      toast({
        title: "Success",
        description: "Reminder deleted successfully",
      });
      setShowDeleteDialog(false);
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete reminder",
        variant: "destructive",
      });
      setShowDeleteDialog(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getReminderIcon = (type?: string) => {
    switch (type) {
      case "birthday":
        return <Cake className="h-5 w-5 text-pink-600" />;
      case "policy":
        return <FileText className="h-5 w-5 text-blue-600" />;
      case "appointment":
        return <Calendar className="h-5 w-5 text-emerald-600" />;
      case "turning65":
      case "medicare":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    try {
      return format(new Date(dateTimeString), "PPP p");
    } catch {
      return dateTimeString;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading reminder details...</p>
        </div>
      </div>
    );
  }

  if (!reminder) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Reminder Not Found</h2>
          <p className="text-gray-600 mb-4">The reminder you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              {getReminderIcon(reminder.reminder_type)}
              {reminder.title}
            </h1>
            <p className="text-gray-600">Reminder Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(reminder.status)}>
            {reminder.status}
          </Badge>
          {reminder.status === "pending" && (
            <Button onClick={handleComplete} size="sm" variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          )}
          <Button onClick={() => setShowDeleteDialog(true)} size="sm" variant="outline">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reminder Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Reminder Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Title</label>
              <p className="text-gray-900 font-semibold">{reminder.title}</p>
            </div>

            {reminder.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-900">{reminder.description}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Reminder Date & Time
              </label>
              <p className="text-gray-900">{formatDateTime(reminder.reminder_datetime)}</p>
            </div>

            {reminder.reminder_type && (
              <div>
                <label className="text-sm font-medium text-gray-500">Type</label>
                <p className="text-gray-900 capitalize">{reminder.reminder_type}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="text-gray-900">
                <Badge className={getStatusColor(reminder.status)}>
                  {reminder.status}
                </Badge>
              </p>
            </div>

            {reminder.is_recurring && (
              <div>
                <label className="text-sm font-medium text-gray-500">Recurring</label>
                <p className="text-gray-900">
                  <Badge variant="secondary">Recurring Reminder</Badge>
                </p>
                {reminder.recurring_end_date && (
                  <p className="text-sm text-gray-600 mt-1">
                    Until: {formatDateTime(reminder.recurring_end_date)}
                  </p>
                )}
              </div>
            )}

            {reminder.notification_methods && reminder.notification_methods.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Notification Methods</label>
                <div className="flex gap-2 mt-1">
                  {reminder.notification_methods.map((method) => (
                    <Badge key={method} variant="outline" className="capitalize">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer/Lead Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Related Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reminder.customer && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer Name</label>
                  <p className="text-gray-900">
                    <Link 
                      to={getCustomerViewUrl(reminder.customer.id.toString(), "active")}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {reminder.customer.first_name} {reminder.customer.last_name}
                    </Link>
                  </p>
                </div>

                {reminder.customer.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      Email
                    </label>
                    <p className="text-gray-900">
                      <a href={`mailto:${reminder.customer.email}`} className="text-blue-600 hover:underline">
                        {reminder.customer.email}
                      </a>
                    </p>
                  </div>
                )}

                {reminder.customer.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Phone
                    </label>
                    <p className="text-gray-900">
                      <a href={`tel:${reminder.customer.phone}`} className="text-blue-600 hover:underline">
                        {reminder.customer.phone}
                      </a>
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(getCustomerViewUrl(reminder.customer!.id.toString(), "active"))}
                    className="w-full"
                  >
                    View Customer Profile
                  </Button>
                </div>
              </>
            )}

            {reminder.lead && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-500">Lead Name</label>
                  <p className="text-gray-900">
                    {reminder.lead.first_name} {reminder.lead.last_name}
                  </p>
                </div>

                {reminder.lead.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      Email
                    </label>
                    <p className="text-gray-900">
                      <a href={`mailto:${reminder.lead.email}`} className="text-blue-600 hover:underline">
                        {reminder.lead.email}
                      </a>
                    </p>
                  </div>
                )}

                {reminder.lead.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Phone
                    </label>
                    <p className="text-gray-900">
                      <a href={`tel:${reminder.lead.phone}`} className="text-blue-600 hover:underline">
                        {reminder.lead.phone}
                      </a>
                    </p>
                  </div>
                )}
              </>
            )}

            {reminder.policy && (
              <div>
                <label className="text-sm font-medium text-gray-500">Policy</label>
                <p className="text-gray-900">
                  {reminder.policy.policy_number} - {reminder.policy.type}
                </p>
              </div>
            )}

            {reminder.appointment && (
              <div>
                <label className="text-sm font-medium text-gray-500">Related Appointment</label>
                <p className="text-gray-900">{reminder.appointment.title}</p>
                <p className="text-sm text-gray-600">
                  {formatDateTime(reminder.appointment.start_time)}
                </p>
              </div>
            )}

            {reminder.assigned_user && (
              <div>
                <label className="text-sm font-medium text-gray-500">Assigned To</label>
                <p className="text-gray-900">
                  {reminder.assigned_user.first_name} {reminder.assigned_user.last_name}
                </p>
              </div>
            )}

            {!reminder.customer && !reminder.lead && !reminder.policy && !reminder.appointment && (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No related information</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reminder.creator && (
              <div>
                <label className="font-medium text-gray-500">Created By</label>
                <p className="text-gray-900">
                  {reminder.creator.first_name} {reminder.creator.last_name}
                </p>
              </div>
            )}
            <div>
              <label className="font-medium text-gray-500">Created Date</label>
              <p className="text-gray-900">{formatDateTime(reminder.created_at)}</p>
            </div>
            <div>
              <label className="font-medium text-gray-500">Last Updated</label>
              <p className="text-gray-900">{formatDateTime(reminder.updated_at)}</p>
            </div>
            <div>
              <label className="font-medium text-gray-500">Reminder ID</label>
              <p className="text-gray-900 font-mono">{reminder.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
        {reminder.status === "pending" && (
          <Button onClick={handleComplete}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Complete
          </Button>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reminder? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReminderDetails;
