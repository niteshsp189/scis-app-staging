import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Check,
  Clock,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { useNavigate } from "react-router-dom";
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

// Poll for notification counts every 60 seconds
const POLL_INTERVAL = 60000;

export function NotificationButton() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load notification counts on mount + start polling
  useEffect(() => {
    loadNotificationCounts();

    pollTimerRef.current = setInterval(() => {
      loadNotificationCounts();
    }, POLL_INTERVAL);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  // Load full notifications when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Listen for refresh notifications event (e.g., after creating a reminder)
  useEffect(() => {
    const handleRefresh = () => {
      loadNotificationCounts();
      if (isOpen) {
        loadNotifications();
      }
    };

    window.addEventListener("refreshNotifications", handleRefresh);
    return () =>
      window.removeEventListener("refreshNotifications", handleRefresh);
  }, [isOpen]);

  const loadNotificationCounts = useCallback(async () => {
    try {
      const counts = await notificationService.getNotificationCounts();
      setUnreadCount(counts.total || 0);
    } catch (error) {
      console.error("Failed to load notification counts:", error);
    }
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await notificationService.getNotifications();
      // Show only unread notifications in popup
      const unreadNotifications = result.data.filter((n) => !n.read);
      setNotifications(unreadNotifications);
      setUnreadCount(result.unread_count);
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
    minutes: number,
  ) => {
    try {
      const reminderId =
        notification.data?.reminder_id ||
        notification.id.replace("reminder_", "");

      await notificationService.snoozeReminder(reminderId, minutes);

      const label = formatSnoozeLabel(minutes);

      toast({
        title: "Success",
        description: `Reminder snoozed for ${label}`,
      });

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

  const handleMarkForwardedCallAsRead = async (notification: Notification) => {
    try {
      const notifDbId = notification.data?.notification_db_id;
      if (!notifDbId) return;

      await notificationService.markForwardedCallAsRead(notifDbId);
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      loadNotificationCounts();
      toast({
        title: "Success",
        description: "Notification marked as read",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
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

  const getTypeIcon = (type: string) => {
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
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
          </div>
        </DialogHeader>

        <div className="flex flex-col h-[500px]">
          <ScrollArea className="flex-1">
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{loading ? "Loading..." : "No new notifications"}</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer transition-colors border-l-4 ${getPriorityColor(notification.priority)} bg-white hover:bg-gray-50`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-lg">
                            {getTypeIcon(notification.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium truncate text-gray-900">
                                {notification.title}
                              </h4>
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
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
                                Called For:{" "}
                                {notification.data.called_for_user.first_name}{" "}
                                {notification.data.called_for_user.last_name}
                              </p>
                            )}
                            {notification.data?.forwarded_to_user && (
                              <p className="text-xs text-orange-600 mb-1">
                                Forwarded To:{" "}
                                {
                                  notification.data.forwarded_to_user.first_name
                                }{" "}
                                {notification.data.forwarded_to_user.last_name}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {/* Call forwarded: mark as read */}
                          {notification.type === "call_forwarded" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkForwardedCallAsRead(notification);
                              }}
                              className="h-6 w-6 p-0"
                              title="Mark as read"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          {/* Reminder: snooze + complete */}
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

function formatSnoozeLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} hours`;
  if (minutes < 10080) return `${Math.round(minutes / 1440)} days`;
  return `${Math.round(minutes / 10080)} weeks`;
}
