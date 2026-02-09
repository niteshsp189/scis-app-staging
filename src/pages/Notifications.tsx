import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  Bell,
  Check,
  Clock,
  ChevronDown,
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

const snoozeOptions = [
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "4 hours", minutes: 240 },
  { label: "8 hours", minutes: 480 },
  { label: "1 day", minutes: 1440 },
  { label: "3 days", minutes: 4320 },
  { label: "1 week", minutes: 10080 },
];

function formatSnoozeLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} hours`;
  if (minutes < 10080) return `${Math.round(minutes / 1440)} days`;
  return `${Math.round(minutes / 10080)} weeks`;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [readStatusFilter, setReadStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await notificationService.getNotifications();
      setNotifications(result.data);
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

  const refreshNotificationCounts = () => {
    // Dispatch event so the NotificationButton in the header refreshes its badge count
    window.dispatchEvent(new Event("refreshNotifications"));
  };

  const handleCompleteReminder = async (notification: Notification) => {
    try {
      const reminderId =
        notification.data?.reminder_id ||
        notification.id.replace("reminder_", "");

      await notificationService.completeReminder(reminderId);

      toast({
        title: "Success",
        description: "Reminder marked as completed",
      });

      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      refreshNotificationCounts();
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
    minutes: number,
  ) => {
    try {
      const reminderId =
        notification.data?.reminder_id ||
        notification.id.replace("reminder_", "");

      await notificationService.snoozeReminder(reminderId, minutes);

      toast({
        title: "Success",
        description: `Reminder snoozed for ${formatSnoozeLabel(minutes)}`,
      });

      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      refreshNotificationCounts();
    } catch (error) {
      console.error("Failed to snooze reminder:", error);
      toast({
        title: "Error",
        description: "Failed to snooze reminder",
        variant: "destructive",
      });
    }
  };

  const handleMarkForwardedCallAsRead = async (notification: Notification) => {
    try {
      const notifDbId = notification.data?.notification_db_id;
      if (!notifDbId) return;

      await notificationService.markForwardedCallAsRead(notifDbId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
      refreshNotificationCounts();
      toast({
        title: "Success",
        description: "Notification marked as read",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification",
        variant: "destructive",
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return "⏰";
      case "appointment":
        return "📅";
      case "call_forwarded":
        return "📞";
      case "system":
        return "⚙️";
      default:
        return "🔔";
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
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
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
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
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter notifications" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notifications</SelectItem>
              <SelectItem value="reminder">Reminders</SelectItem>
              <SelectItem value="appointment">Appointments</SelectItem>
              <SelectItem value="call_forwarded">Forwarded Calls</SelectItem>
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
              className={`transition-colors border-l-4 ${getPriorityColor(notification.priority)} ${
                notification.read ? "bg-gray-50" : "bg-white hover:bg-gray-50"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-xl">
                      {getIcon(notification.type)}
                    </span>
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
                      <p className="text-gray-600 text-sm mb-1">
                        {notification.message}
                      </p>
                      {notification.customer_name && (
                        <p className="text-sm text-blue-600 mb-1">
                          Customer: {notification.customer_name}
                        </p>
                      )}
                      {notification.data?.called_for_user && (
                        <p className="text-sm text-purple-600 mb-1">
                          Called For:{" "}
                          {notification.data.called_for_user.first_name}{" "}
                          {notification.data.called_for_user.last_name}
                        </p>
                      )}
                      {notification.data?.forwarded_to_user && (
                        <p className="text-sm text-orange-600 mb-1">
                          Forwarded To:{" "}
                          {notification.data.forwarded_to_user.first_name}{" "}
                          {notification.data.forwarded_to_user.last_name}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {formatTimeAgo(notification.created_at)}
                      </p>

                      {/* Action buttons for call forwarded notifications */}
                      {notification.type === "call_forwarded" &&
                        !notification.read && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleMarkForwardedCallAsRead(notification)
                              }
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark as Read
                            </Button>
                          </div>
                        )}

                      {/* Action buttons for reminders */}
                      {notification.type === "reminder" && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleCompleteReminder(notification)
                            }
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Complete
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
