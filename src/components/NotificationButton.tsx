import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Bell,
  X,
  Check,
  Trash2,
  Clock,
  ChevronDown,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useNavigate } from "react-router-dom";
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

export function NotificationButton() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Load notifications count on component mount
  useEffect(() => {
    loadNotificationCounts();
  }, []);

  // Listen for refresh notifications event
  useEffect(() => {
    const handleRefresh = () => {
      loadNotificationCounts();
      if (isOpen) {
        loadNotifications();
      }
    };

    window.addEventListener('refreshNotifications', handleRefresh);
    return () => window.removeEventListener('refreshNotifications', handleRefresh);
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await notificationService.getNotifications();

      // Handle different response structures
      let notificationData = [];
      let unreadCountData = 0;

      if (result.success && result.data) {
        // API returns {success: true, data: {data: [...], unread_count: 0}}
        if (result.data.data) {
          notificationData = result.data.data;
          unreadCountData = result.data.unread_count || 0;
        } else if (Array.isArray(result.data)) {
          notificationData = result.data;
        }
      } else if (Array.isArray(result.data)) {
        notificationData = result.data;
      } else if (Array.isArray(result)) {
        notificationData = result;
      }

      // Filter to show only unread notifications in popup
      const unreadNotifications = notificationData.filter((n: Notification) => !n.read);
      setNotifications(unreadNotifications);
      setUnreadCount(unreadCountData);
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

        // Remove notification from local state and reload counts
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id),
        );
        loadNotificationCounts();
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

        // Remove notification from local state and reload counts
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id),
        );
        loadNotificationCounts();
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

  const loadNotificationCounts = async () => {
    try {
      const result = await notificationService.getNotificationCounts();

      if (result.success && result.data) {
        setUnreadCount(result.data.total || 0);
      } else if (result.total !== undefined) {
        setUnreadCount(result.total);
      }
    } catch (error) {
      console.error("Failed to load notification counts:", error);
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

      // Remove from local state and reload
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      loadNotificationCounts();
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

      // Remove from local state and reload
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      loadNotificationCounts();
    } catch (error) {
      console.error("Failed to snooze reminder:", error);
      toast({
        title: "Error",
        description: "Failed to snooze reminder",
        variant: "destructive",
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    if (!notifications.find((n) => n.id === id)?.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (!notifications.find((n) => n.id === id)?.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return "⏰";
      case "appointment":
        return "📅";
      case "leave":
        return "📝";
      case "policy":
        return "🛡️";
      case "birthday":
        return "🎂";
      case "call_forwarded":
        return "📞";
      case "system":
        return "⚙️";
      default:
        return "🔔";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">Notifications</DialogTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-1" />
                Mark All Read
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-col h-[500px]">
          <ScrollArea className="flex-1">
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{loading ? "Loading..." : "No notifications"}</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer transition-colors border-l-4 ${getPriorityColor(notification.priority)} ${
                      notification.read
                        ? "bg-gray-50 opacity-75"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-lg">
                            {getTypeIcon(notification.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4
                                className={`text-sm font-medium truncate ${!notification.read ? "text-gray-900" : "text-gray-600"}`}
                              >
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mb-1">
                              {notification.message}
                            </p>
                            {notification.customer_name && (
                              <p className="text-xs text-blue-600 mb-1">
                                Customer: {notification.customer_name}
                              </p>
                            )}
                            {notification.data?.called_for_user && (
                              <p className="text-xs text-purple-600 mb-1">
                                Called For: {notification.data.called_for_user.first_name} {notification.data.called_for_user.last_name}
                              </p>
                            )}
                            {notification.data?.forwarded_to_user && (
                              <p className="text-xs text-orange-600 mb-1">
                                Forwarded To: {notification.data.forwarded_to_user.first_name} {notification.data.forwarded_to_user.last_name}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {notification.type === "call_forwarded" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const notifDbId = notification.data?.notification_db_id;
                                  if (notifDbId) {
                                    await notificationService.markForwardedCallAsRead(notifDbId);
                                    setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
                                    loadNotificationCounts();
                                    toast({
                                      title: "Success",
                                      description: "Notification marked as read",
                                    });
                                  }
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to mark notification as read",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="h-6 w-6 p-0"
                              title="Mark as read"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          {notification.type === "reminder" && (
                            <>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-6 px-1 py-0 flex items-center gap-1"
                                    title="Snooze reminder"
                                  >
                                    <Clock className="h-3 w-3" />
                                    <ChevronDown className="h-2 w-2" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-32"
                                >
                                  {snoozeOptions.map((option, index) => (
                                    <div key={option.minutes}>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSnoozeReminder(
                                            notification,
                                            option.minutes,
                                          );
                                        }}
                                        className="text-xs cursor-pointer"
                                      >
                                        <Clock className="h-3 w-3 mr-2" />
                                        {option.label}
                                      </DropdownMenuItem>
                                      {index === 2 && <DropdownMenuSeparator />}
                                    </div>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompleteReminder(notification);
                                }}
                                className="h-6 w-6 p-0"
                                title="Mark as completed"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          {notification.type === "leave" && (
                            <>
                              {canApproveLeaveRequest(notification) && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => e.stopPropagation()}
                                      className="h-6 px-1 py-0 flex items-center gap-1 text-green-600 hover:text-green-700"
                                      title="Approve leave request"
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Approve Leave Request
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to approve this
                                        leave request for{" "}
                                        {notification.customer_name ||
                                          "this employee"}
                                        ?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleApproveLeaveRequest(
                                            notification,
                                          )
                                        }
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        Approve
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                              {canRejectLeaveRequest(notification) && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => e.stopPropagation()}
                                      className="h-6 px-1 py-0 flex items-center gap-1 text-red-600 hover:text-red-700"
                                      title="Reject leave request"
                                    >
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Reject Leave Request
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to reject this
                                        leave request for{" "}
                                        {notification.customer_name ||
                                          "this employee"}
                                        ?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleRejectLeaveRequest(notification)
                                        }
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Reject
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </>
                          )}
                          {!notification.read &&
                            notification.type !== "reminder" &&
                            notification.type !== "leave" &&
                            notification.type !== "call_forwarded" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                          {/* <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button> */}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsOpen(false);
                navigate("/notifications");
              }}
            >
              View All Notifications
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
