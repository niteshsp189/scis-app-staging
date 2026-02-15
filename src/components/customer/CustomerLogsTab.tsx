import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Plus,
  PhoneIncoming,
  PhoneOutgoing,
  Mail,
  MessageSquare,
  Calendar,
  Users,
  Shield,
  CreditCard,
  AlertCircle,
  Activity,
  Search,
  Filter,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogActivityDialog } from "@/components/dialogs/LogActivityDialog";
import { EditActivityDialog } from "@/components/dialogs/EditActivityDialog";
import { ScheduleMeetingDialog } from "@/components/dialogs/ScheduleMeetingDialog";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";
import {
  customerActivitiesService,
  CustomerActivity,
} from "@/services/customerActivitiesService";
import { toast } from "@/components/ui/use-toast";
import { formatDisplayDate } from "@/utils/dateFormatters";

interface CustomerLogsTabProps {
  customerId: number;
  customerName: string;
  logType?: "appointments" | "calls";
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "Incoming Call":
      return <PhoneIncoming className="h-4 w-4" />;
    case "Outgoing Call":
      return <PhoneOutgoing className="h-4 w-4" />;
    case "Email":
      return <Mail className="h-4 w-4" />;
    case "Meeting":
      return <Users className="h-4 w-4" />;
    case "Follow-up":
      return <Clock className="h-4 w-4" />;
    case "Policy Review":
      return <MessageSquare className="h-4 w-4" />;
    case "Claim Discussion":
      return <Shield className="h-4 w-4" />;
    case "Payment":
      return <CreditCard className="h-4 w-4" />;
    case "Complaint":
      return <AlertCircle className="h-4 w-4" />;
    case "General":
      return <Activity className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "Incoming Call":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Outgoing Call":
      return "bg-green-100 text-green-800 border-green-200";
    case "Email":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "Meeting":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "Follow-up":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Policy Review":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "Claim Discussion":
      return "bg-red-100 text-red-800 border-red-200";
    case "Payment":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Complaint":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "General":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const CustomerLogsTab = ({
  customerId,
  customerName,
  logType,
}: CustomerLogsTabProps) => {
  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterOutcome, setFilterOutcome] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [editingActivity, setEditingActivity] =
    useState<CustomerActivity | null>(null);
  const [deletingActivity, setDeletingActivity] =
    useState<CustomerActivity | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadActivities();
  }, [
    customerId,
    logType,
    currentPage,
    searchTerm,
    filterType,
    filterOutcome,
    filterStatus,
  ]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {
        page: currentPage,
        per_page: 20,
      };

      if (searchTerm) {
        filters.search = searchTerm;
      }

      if (filterType && filterType !== "all") {
        filters.activity_type = filterType;
      }

      if (filterOutcome && filterOutcome !== "all") {
        filters.outcome = filterOutcome;
      }

      if (filterStatus && filterStatus !== "all") {
        filters.status = filterStatus;
      }

      // Note: logType filtering is now done client-side after getting all activities
      // This avoids issues with comma-separated activity types in the backend

      const response = await customerActivitiesService.getCustomerActivities(
        customerId,
        filters,
      );

      if (response.success) {
        setActivities(response.data);
        setTotalPages(response.pagination.last_page);
      } else {
        setError("Failed to load activities");
      }
    } catch (err) {
      setError("An error occurred while loading activities");
      console.error("Error loading activities:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogActivity = async (activityData: any) => {
    try {
      const response = await customerActivitiesService.createActivity(
        customerId,
        activityData,
      );
      if (response.success) {
        toast({
          title: "Success",
          description: "Activity logged successfully",
        });
        loadActivities();
        
        // Refresh notifications if call was forwarded
        if (activityData.call_forwarded_to_user_id) {
          // Add small delay to ensure backend notification is created
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('refreshNotifications'));
          }, 500);
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to log activity",
        variant: "destructive",
      });
      console.error("Error creating activity:", err);
    }
  };

  const handleUpdateActivity = async (
    activityId: number,
    activityData: any,
  ) => {
    try {
      // Get original activity to check for changes in forwarded user
      const originalActivity = activities.find(a => a.id === activityId);
      const originalForwardedToUserId = originalActivity?.call_forwarded_to_user_id || "";
      const newForwardedToUserId = activityData.call_forwarded_to_user_id || "";
      
      const response = await customerActivitiesService.updateActivity(
        customerId,
        activityId,
        activityData,
      );
      if (response.success) {
        toast({
          title: "Success",
          description: "Activity updated successfully",
        });
        setEditingActivity(null);
        loadActivities();
        
        // Refresh notifications only if forwarded user changed
        // Scenarios:
        // 1. No forwarded before, now forwarded (originalForwardedToUserId is empty, newForwardedToUserId has value)
        // 2. Forwarded user changed (originalForwardedToUserId != newForwardedToUserId)
        // 3. Forwarded was removed (originalForwardedToUserId has value, newForwardedToUserId is empty) - no notification needed
        const forwardedUserChanged = originalForwardedToUserId !== newForwardedToUserId;
        const newForwardAssigned = !originalForwardedToUserId && newForwardedToUserId;
        const forwardReassigned = originalForwardedToUserId && newForwardedToUserId && forwardedUserChanged;
        
        if (newForwardAssigned || forwardReassigned) {
          // Add small delay to ensure backend notification is created
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('refreshNotifications'));
          }, 500);
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update activity",
        variant: "destructive",
      });
      console.error("Error updating activity:", err);
    }
  };

  const handleDeleteActivity = async (activity: CustomerActivity) => {
    try {
      await customerActivitiesService.deleteActivity(customerId, activity.id);
      toast({
        title: "Success",
        description: "Activity deleted successfully",
      });
      setDeletingActivity(null);
      loadActivities();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete activity",
        variant: "destructive",
      });
      console.error("Error deleting activity:", err);
    }
  };

  const getTabTitle = () => {
    if (logType === "calls") return "Call Logs";
    if (logType === "appointments") return "Appointments";
    return "Activity Logs";
  };

  // Apply client-side filtering for logType since backend doesn't handle comma-separated types
  const filteredActivities = activities.filter((activity) => {
    // First apply logType filtering
    if (logType === "calls") {
      const isCallType =
        activity.activity_type === "Incoming Call" ||
        activity.activity_type === "Outgoing Call";
      if (!isCallType) return false;
    } else if (logType === "appointments") {
      const isAppointmentType =
        activity.activity_type === "Meeting" ||
        activity.activity_type === "Follow-up";
      if (!isAppointmentType) return false;
    }

    return true;
  });

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{getTabTitle()}</h3>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-300 mx-auto mb-4" />
            <p className="text-red-500">{error}</p>
            <Button variant="outline" onClick={loadActivities} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{getTabTitle()}</h3>
        {logType === "appointments" ? (
          <ScheduleMeetingDialog
            customerId={customerId}
            customerName={customerName}
            onScheduled={loadActivities}
            trigger={
              <Button className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Set Appointment
              </Button>
            }
          />
        ) : (
          <LogActivityDialog
            customerId={customerId}
            customerName={customerName}
            onLogActivity={handleLogActivity}
            logType={logType}
          />
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {!logType && (
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.keys(
                    customerActivitiesService.getPredefinedActivityTypes(),
                  ).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={filterOutcome} onValueChange={setFilterOutcome}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                {customerActivitiesService.getOutcomeOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {customerActivitiesService.getStatusOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading activities...</p>
          </CardContent>
        </Card>
      ) : filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No {logType || "activity"} logs yet</p>
            <p className="text-sm text-gray-400 mt-1">
              {logType === "calls"
                ? "Start logging call interactions to track communication history"
                : logType === "appointments"
                  ? "Schedule meetings and appointments to track them here"
                  : "Start logging customer interactions to track communication history"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <Card
              key={activity.id}
              className="border-l-4 border-l-gray-300 hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      className={`text-xs flex items-center gap-1 ${getTypeColor(activity.activity_type)}`}
                    >
                      {getTypeIcon(activity.activity_type)}
                      {activity.activity_type}
                    </Badge>

                    <Badge
                      className={`text-xs ${customerActivitiesService.getOutcomeColorClass(activity.outcome)}`}
                    >
                      {activity.outcome}
                    </Badge>

                    <Badge
                      className={`text-xs ${customerActivitiesService.getPriorityColorClass(activity.priority)}`}
                    >
                      {activity.priority} Priority
                    </Badge>

                    <span className="text-sm text-gray-600">
                      {customerActivitiesService.formatActivityDateTime(
                        activity.activity_date,
                        activity.activity_time,
                      )}
                    </span>

                    {activity.duration_minutes > 0 && (
                      <span className="text-xs text-gray-500">
                        Duration:{" "}
                        {customerActivitiesService.formatDuration(
                          activity.duration_minutes,
                        )}
                      </span>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingActivity(activity)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingActivity(activity)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">{activity.title}</h4>

                  {activity.description && (
                    <p className="text-sm text-gray-700">
                      {activity.description}
                    </p>
                  )}

                  {activity.notes && (
                    <div className="bg-gray-50 p-2 rounded text-sm">
                      <strong>Notes:</strong> {activity.notes}
                    </div>
                  )}

                  {activity.follow_up_date && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>
                        Follow-up scheduled for{" "}
                        {formatDisplayDate(activity.follow_up_date)}
                      </span>
                    </div>
                  )}

                  {activity.follow_up_notes && (
                    <div className="text-xs text-gray-600">
                      <strong>Follow-up notes:</strong>{" "}
                      {activity.follow_up_notes}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <span>
                      Performed by:{" "}
                      {customerActivitiesService.getFullName(
                        activity.performer,
                      ) || "Unknown"}
                    </span>
                    {activity.assignedUser && (
                      <span>
                        Assigned to:{" "}
                        {customerActivitiesService.getFullName(
                          activity.assignedUser,
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Edit Activity Dialog */}
      {editingActivity && (
        <EditActivityDialog
          activity={editingActivity}
          customerId={customerId}
          customerName={customerName}
          open={!!editingActivity}
          onOpenChange={(open) => !open && setEditingActivity(null)}
          onUpdateActivity={handleUpdateActivity}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingActivity && (
        <ConfirmationDialog
          open={!!deletingActivity}
          onOpenChange={(open) => !open && setDeletingActivity(null)}
          onConfirm={() => handleDeleteActivity(deletingActivity)}
          title="Delete Activity"
          description={`Are you sure you want to delete this ${deletingActivity.activity_type.toLowerCase()}? This action cannot be undone.`}
          confirmButtonText="Delete"
          cancelButtonText="Cancel"
          variant="destructive"
        />
      )}
    </div>
  );
};
