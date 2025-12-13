import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Bell,
  Cake,
  FileText,
  Calendar,
  Check,
  Clock,
  ChevronDown,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  notificationService,
  type Notification,
} from "@/services/notificationService";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionContext";
import { authService } from "@/services/authService";

const snoozeOptions = [
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "4 hours", minutes: 240 },
  { label: "8 hours", minutes: 480 },
  { label: "1 day", minutes: 1440 },
  { label: "3 days", minutes: 4320 },
  { label: "1 week", minutes: 10080 },
];

const API_BASE_URL = "/api";

const Notifications = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [readStatusFilter, setReadStatusFilter] = useState<string>("unread");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await notificationService.getNotifications();

      // Handle different response structures - same logic as NotificationButton
      let notificationData = [];

      if (result.success && result.data) {
        // API returns {success: true, data: {data: [...], unread_count: 0}}
        if (result.data.data) {
          notificationData = result.data.data;
        } else if (Array.isArray(result.data)) {
          notificationData = result.data;
        }
      } else if (Array.isArray(result.data)) {
        notificationData = result.data;
      } else if (Array.isArray(result)) {
        notificationData = result;
      }

      setNotifications(notificationData);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function for authenticated requests
  const makeAuthenticatedRequest = async (
    url: string,
    options: RequestInit = {},
  ) => {
    const token = authService.getToken();
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: any = new Error(
        `HTTP ${response.status}: ${response.statusText}`,
      );
      try {
        error.response = await response.json();
      } catch (e) {
        // The response might not be a valid JSON
      }
      throw error;
    }

    return response;
  };

  // Permission check functions
  const canApproveLeaveRequest = (notification: Notification) => {
    if (!user || notification.type !== "leave") {
      return false;
    }

    // Check specific permissions using usePermissions hook
    if (hasPermission("approve_leave_requests")) {
      return true;
    }

    // Check if user has admin, super admin, or manager roles
    const userRoles = user?.roles || [];
    const canApproveRoles = [
      "admin",
      "super_admin",
      "manager",
      "system_administrator",
      "administrator",
      "Super Admin",
      "Admin",
      "Manager",
    ];
    const hasApprovalRole = userRoles.some((role) =>
      canApproveRoles.includes(role),
    );

    if (hasApprovalRole) {
      return true;
    }

    // Check if user is the assigned manager for this leave request
    if (notification.data && notification.data.manager_id) {
      return notification.data.manager_id === user.id;
    }

    return false;
  };

  const canRejectLeaveRequest = (notification: Notification) => {
    if (!user || notification.type !== "leave") {
      return false;
    }

    // Check specific permissions using usePermissions hook
    if (hasPermission("reject_leave_requests")) {
      return true;
    }

    // Check if user has admin, super admin, or manager roles
    const userRoles = user?.roles || [];
    const canRejectRoles = [
      "admin",
      "super_admin",
      "manager",
      "system_administrator",
      "administrator",
      "Super Admin",
      "Admin",
      "Manager",
    ];
    const hasRejectionRole = userRoles.some((role) =>
      canRejectRoles.includes(role),
    );

    if (hasRejectionRole) {
      return true;
    }

    // Check if user is the assigned manager for this leave request
    if (notification.data && notification.data.manager_id) {
      return notification.data.manager_id === user.id;
    }

    return false;
  };

  // Leave request approval/rejection handlers
  const handleApproveLeaveRequest = async (notification: Notification) => {
    try {
      const leaveRequestId = notification.data?.leave_id;
      if (!leaveRequestId) {
        throw new Error("Leave request ID not found");
      }

      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/leave-requests/${leaveRequestId}/approve`,
        {
          method: "PATCH",
        },
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Leave request approved successfully",
        });

        // Remove notification from local state
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id),
        );
      }
    } catch (error) {
      console.error("Error approving leave request:", error);
      toast({
        title: "Error",
        description: "Failed to approve leave request",
        variant: "destructive",
      });
    }
  };

  const handleRejectLeaveRequest = async (notification: Notification) => {
    try {
      const leaveRequestId = notification.data?.leave_id;
      if (!leaveRequestId) {
        throw new Error("Leave request ID not found");
      }

      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/leave-requests/${leaveRequestId}/reject`,
        {
          method: "PATCH",
        },
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Leave request rejected successfully",
        });

        // Remove notification from local state
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id),
        );
      }
    } catch (error) {
      console.error("Error rejecting leave request:", error);
      toast({
        title: "Error",
        description: "Failed to reject leave request",
        variant: "destructive",
      });
    }
  };

  const handleCompleteReminder = async (notification: Notification) => {
    try {
      // Extract reminder ID from notification data or ID
      let reminderId = notification.id;
      if (notification.data && notification.data.reminder_id) {
        reminderId = notification.data.reminder_id;
      } else if (notification.id.startsWith("reminder_")) {
        reminderId = notification.id.replace("reminder_", "");
      }

      await notificationService.completeReminder(reminderId);

      toast({
        title: "Success",
        description: "Reminder marked as completed",
      });

      // Remove from local state
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    } catch (error) {
      console.error("Failed to complete reminder:", error);
      toast({
        title: "Error",
        description: "Failed to complete reminder",
        variant: "destructive",
      });
    }
  };

  const handleSnoozeReminder = async (
    notification: Notification,
    minutes: number = 60,
  ) => {
    try {
      // Extract reminder ID from notification data or ID
      let reminderId = notification.id;
      if (notification.data && notification.data.reminder_id) {
        reminderId = notification.data.reminder_id;
      } else if (notification.id.startsWith("reminder_")) {
        reminderId = notification.id.replace("reminder_", "");
      }

      await notificationService.snoozeReminder(reminderId, minutes);

      const label =
        minutes < 60
          ? `${minutes} minutes`
          : minutes < 1440
            ? `${Math.round(minutes / 60)} hours`
            : minutes < 10080
              ? `${Math.round(minutes / 1440)} days`
              : `${Math.round(minutes / 10080)} weeks`;

      toast({
        title: "Success",
        description: `Reminder snoozed for ${label}`,
      });

      // Remove from local state
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    } catch (error) {
      console.error("Failed to snooze reminder:", error);
      toast({
        title: "Error",
        description: "Failed to snooze reminder",
        variant: "destructive",
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "policy":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "appointment":
        return <Calendar className="h-4 w-4 text-green-500" />;
      case "reminder":
        return <Bell className="h-4 w-4 text-yellow-500" />;
      case "leave":
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500";
      case "medium":
        return "border-l-yellow-500";
      case "low":
        return "border-l-green-500";
      default:
        return "border-l-gray-500";
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filteredNotifications = notifications.filter((notification) => {
    // Filter by type
    if (filter !== "all" && notification.type !== filter) {
      return false;
    }
    
    // Filter by read status
    if (readStatusFilter === "read" && !notification.read) {
      return false;
    }
    if (readStatusFilter === "unread" && notification.read) {
      return false;
    }
    
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">
            Stay updated with important reminders and alerts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadNotifications()}
            disabled={loading}
            title="Refresh notifications"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Select value={readStatusFilter} onValueChange={setReadStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter notifications" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notifications</SelectItem>
              <SelectItem value="reminder">Reminders</SelectItem>
              <SelectItem value="policy">Policies</SelectItem>
              <SelectItem value="appointment">Appointments</SelectItem>
              <SelectItem value="leave">Leave Requests</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No notifications
              </h3>
              <p className="text-gray-500">You're all caught up!</p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer transition-colors border-l-4 ${getPriorityColor(notification.priority)} ${
                notification.read ? "bg-gray-50" : "bg-white hover:bg-gray-50"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`font-semibold ${!notification.read ? "text-gray-900" : "text-gray-700"}`}
                        >
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800"
                          >
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400">
                        {notification.time}
                      </p>

                      {/* Action buttons for call forwarded notifications */}
                      {notification.type === "call_forwarded" && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                const notifDbId = notification.data?.notification_db_id;
                                if (notifDbId) {
                                  if (notification.read) {
                                    // Mark as unread - currently not supported, just show message
                                    toast({
                                      title: "Info",
                                      description: "Mark as unread is not supported yet",
                                    });
                                  } else {
                                    // Mark as read
                                    await notificationService.markForwardedCallAsRead(notifDbId);
                                    setNotifications((prev) => 
                                      prev.map((n) => 
                                        n.id === notification.id ? { ...n, read: true } : n
                                      )
                                    );
                                    toast({
                                      title: "Success",
                                      description: "Notification marked as read",
                                    });
                                  }
                                }
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to update notification",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {notification.read ? "Mark as Unread" : "Mark as Read"}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Clock className="h-3 w-3 mr-1" />
                                Snooze
                                <ChevronDown className="h-2 w-2 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32">
                              {snoozeOptions.map((option, index) => (
                                <div key={option.minutes}>
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      try {
                                        const notifDbId = notification.data?.notification_db_id;
                                        if (notifDbId) {
                                          // Mark as read (snooze behavior for call forwarded)
                                          await notificationService.markForwardedCallAsRead(notifDbId);
                                          setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
                                          const label =
                                            option.minutes < 60
                                              ? `${option.minutes} minutes`
                                              : option.minutes < 1440
                                                ? `${Math.round(option.minutes / 60)} hours`
                                                : option.minutes < 10080
                                                  ? `${Math.round(option.minutes / 1440)} days`
                                                  : `${Math.round(option.minutes / 10080)} weeks`;
                                          toast({
                                            title: "Success",
                                            description: `Notification snoozed for ${label}`,
                                          });
                                        }
                                      } catch (error) {
                                        toast({
                                          title: "Error",
                                          description: "Failed to snooze notification",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                    className="text-sm cursor-pointer"
                                  >
                                    <Clock className="h-3 w-3 mr-2" />
                                    {option.label}
                                  </DropdownMenuItem>
                                  {index === 2 && <DropdownMenuSeparator />}
                                </div>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}

                      {/* Action buttons for reminders */}
                      {notification.type === "reminder" && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCompleteReminder(notification)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Mark as Read
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Clock className="h-3 w-3 mr-1" />
                                Snooze
                                <ChevronDown className="h-2 w-2 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32">
                              {snoozeOptions.map((option, index) => (
                                <div key={option.minutes}>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleSnoozeReminder(
                                        notification,
                                        option.minutes,
                                      )
                                    }
                                    className="text-sm cursor-pointer"
                                  >
                                    <Clock className="h-3 w-3 mr-2" />
                                    {option.label}
                                  </DropdownMenuItem>
                                  {index === 2 && <DropdownMenuSeparator />}
                                </div>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4"></div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
