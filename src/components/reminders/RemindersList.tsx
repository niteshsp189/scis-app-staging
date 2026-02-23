import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Check,
  Trash2,
  Clock,
  User,
  Calendar,
  Bell,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ChevronDown,
  Pencil,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { reminderService, type Reminder } from "@/services/reminderService";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const snoozeOptions = [
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "4 hours", minutes: 240 },
  { label: "8 hours", minutes: 480 },
  { label: "1 day", minutes: 1440 },
  { label: "3 days", minutes: 4320 },
  { label: "1 week", minutes: 10080 },
];

interface RemindersListProps {
  reminders: Reminder[];
  loading: boolean;
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onSnooze?: (id: string, minutes: number) => void;
  onEdit?: (reminder: Reminder) => void;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
}

export function RemindersList({
  reminders,
  loading,
  pagination,
  onToggleComplete,
  onDelete,
  onSnooze,
  onEdit,
  onPageChange,
  onPerPageChange,
}: RemindersListProps) {
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className={isMobile ? "text-lg" : "text-xl"}>
            Your Reminders
          </CardTitle>
          <CardDescription>
            Manage your upcoming tasks and follow-ups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle
            className={`${isMobile ? "text-lg" : "text-xl"} flex items-center gap-2`}
          >
            <Bell className="h-5 w-5" />
            Your Reminders
          </CardTitle>
          <CardDescription>
            Manage your upcoming tasks and follow-ups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Rows per page:</span>
              <Select
                value={pagination.per_page.toString()}
                onValueChange={(val) => onPerPageChange?.(Number(val))}
              >
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue placeholder={pagination.per_page.toString()} />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {reminders.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No reminders found</p>
              <p className="text-sm text-gray-400">
                Create your first reminder or adjust your filters
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {reminders.map((reminder) => {
                const isOverdue = reminderService.isOverdue(reminder);
                const isDueToday = reminderService.isDueToday(reminder);
                const contactName = reminderService.getContactName(reminder);
                const contactEmail = reminderService.getContactEmail(reminder);
                const timeUntil = reminderService.getTimeUntil(reminder);

                return (
                  <div
                    key={reminder.id}
                    className={`border rounded-lg transition-all shadow-sm overflow-hidden ${reminder.status === "completed"
                        ? "bg-gray-50 opacity-75"
                        : isOverdue
                          ? "bg-red-50 border-red-200"
                          : isDueToday
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-white hover:bg-gray-50 hover:shadow-md"
                      }`}
                  >
                    {/* Main content area */}
                    <div className="p-4 space-y-3">
                      {/* Title - Clean and prominent */}
                      <h3
                        className={`font-semibold text-lg leading-tight ${reminder.status === "completed"
                            ? "line-through text-gray-500"
                            : "text-gray-900"
                          }`}
                      >
                        {reminder.title}
                      </h3>

                      {/* Status badges row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                        {isDueToday && !isOverdue && (
                          <Badge variant="default" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Due Today
                          </Badge>
                        )}
                        <Badge
                          variant={reminderService.getStatusBadgeVariant(
                            reminder.status,
                          )}
                          className="text-xs"
                        >
                          {reminder.status}
                        </Badge>
                      </div>

                      {/* Description */}
                      {reminder.description && (
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {reminder.description}
                        </p>
                      )}

                      {/* Date and time */}
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>
                          {format(
                            new Date(reminder.reminder_datetime),
                            "MMM dd, yyyy 'at' h:mm a",
                          )}
                        </span>
                        {reminder.status === "pending" && timeUntil && (
                          <>
                            <span className="mx-2">•</span>
                            <Clock className="h-4 w-4 shrink-0" />
                            <span>{timeUntil}</span>
                          </>
                        )}
                      </div>

                      {/* Contact, Assigned To & Created By */}
                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        {contactName !== "No contact" && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 shrink-0" />
                            <span>{contactName}</span>
                          </div>
                        )}
                        {(reminder.assigned_user || reminder.agent) && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">Assigned:</span>
                            <span>
                              {reminder.assigned_user
                                ? `${reminder.assigned_user.first_name} ${reminder.assigned_user.last_name}`
                                : reminder.agent
                                  ? `${reminder.agent.first_name} ${reminder.agent.last_name}`
                                  : ""}
                            </span>
                          </div>
                        )}
                        {reminder.creator && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">By:</span>
                            <span>{reminder.creator.first_name} {reminder.creator.last_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Contact email */}
                      {contactEmail && (
                        <div className="text-xs text-gray-400">
                          {contactEmail}
                        </div>
                      )}
                    </div>

                    {/* Action buttons - Fixed container */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                      <div
                        className={`flex gap-2 ${isMobile ? "flex-col" : "justify-end"}`}
                      >
                        {/* Edit button */}
                        {onEdit && reminder.status !== "completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(reminder)}
                            className={isMobile ? "w-full" : "min-w-0"}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )}

                        <Button
                          variant={
                            reminder.status === "completed"
                              ? "secondary"
                              : "default"
                          }
                          size="sm"
                          onClick={() => onToggleComplete(reminder.id)}
                          className={isMobile ? "w-full" : "min-w-0"}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {reminder.status === "completed"
                            ? "Mark Pending"
                            : "Mark Complete"}
                        </Button>

                        {/* Snooze dropdown */}
                        {onSnooze && reminder.status === "pending" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={isMobile ? "w-full" : "min-w-0"}
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                Snooze
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32">
                              {snoozeOptions.map((option, index) => (
                                <div key={option.minutes}>
                                  <DropdownMenuItem
                                    onClick={() => onSnooze(reminder.id, option.minutes)}
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
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`text-red-600 hover:text-red-700 ${isMobile ? "w-full" : "min-w-0"}`}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Reminder
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "
                                {reminder.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(reminder.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.total > 0 && pagination.last_page > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-500">
                Showing{" "}
                {(pagination.current_page - 1) * pagination.per_page + 1} to{" "}
                {Math.min(
                  pagination.current_page * pagination.per_page,
                  pagination.total,
                )}{" "}
                of {pagination.total} reminders
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {!isMobile && "Previous"}
                </Button>

                <div className="flex items-center gap-1">
                  {[...Array(Math.min(pagination.last_page, 5))].map((_, i) => {
                    let pageNum;
                    if (pagination.last_page <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.current_page <= 3) {
                      pageNum = i + 1;
                    } else if (
                      pagination.current_page >=
                      pagination.last_page - 2
                    ) {
                      pageNum = pagination.last_page - 4 + i;
                    } else {
                      pageNum = pagination.current_page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          pagination.current_page === pageNum
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => onPageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page >= pagination.last_page}
                >
                  {!isMobile && "Next"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
