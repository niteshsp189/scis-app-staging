
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
import { Bell, Cake, FileText, AlertTriangle, Calendar, Check, Clock, ChevronDown, Eye } from "lucide-react";
import { DashboardReminder } from "@/services/dashboardService";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface DashboardRemindersProps {
  reminders?: DashboardReminder[];
  loading?: boolean;
  onComplete?: (reminderId: number) => void;
  onSnooze?: (reminderId: number, minutes: number) => void;
}

const reminderIcons = {
  birthday: Cake,
  policy: FileText,
  appointment: Calendar,
  turning65: AlertTriangle,
  medicare: AlertTriangle,
} as const;

const reminderColors = {
  birthday: "text-pink-600",
  policy: "text-blue-600",
  appointment: "text-emerald-600",
  turning65: "text-orange-600",
  medicare: "text-purple-600",
} as const;

const snoozeOptions = [
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "4 hours", minutes: 240 },
  { label: "8 hours", minutes: 480 },
  { label: "1 day", minutes: 1440 },
  { label: "3 days", minutes: 4320 },
  { label: "1 week", minutes: 10080 },
];

export const DashboardReminders = ({ 
  reminders, 
  loading, 
  onComplete, 
  onSnooze 
}: DashboardRemindersProps) => {
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <Card className="professional-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-slate-900">
            <Bell className="h-5 w-5 text-amber-500" />
            Today's Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <Skeleton className="h-5 w-5 rounded" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!reminders || reminders.length === 0) {
    return (
      <Card className="professional-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-slate-900">
            <Bell className="h-5 w-5 text-amber-500" />
            Today's Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No reminders for today</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="professional-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-slate-900">
            <Bell className="h-5 w-5 text-amber-500" />
            Today's Reminders
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate('/reminders')}>
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reminders.map((reminder) => {
            const IconComponent = reminderIcons[reminder.type] || Bell;
            const iconColor = reminderColors[reminder.type] || "text-gray-600";
            
            return (
              <div key={reminder.id} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <IconComponent className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-slate-900">{reminder.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">{reminder.message}</p>
                  {reminder.customer_name && (
                    <p className="text-xs text-slate-500 mt-1">Customer: {reminder.customer_name}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Due: {format(new Date(reminder.due_date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Badge variant={reminder.priority === "high" ? "destructive" : "secondary"} className="text-xs">
                    {reminder.priority}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0"
                      onClick={() => navigate(`/reminders/${reminder.id}`)}
                      title="View details"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    {onComplete && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                        onClick={() => onComplete(reminder.id)}
                        title="Mark as complete"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    {onSnooze && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-1 py-0 flex items-center gap-1"
                            title="Snooze reminder"
                          >
                            <Clock className="h-3 w-3" />
                            <ChevronDown className="h-2 w-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          {snoozeOptions.map((option, index) => (
                            <div key={option.minutes}>
                              <DropdownMenuItem
                                onClick={() => onSnooze(reminder.id, option.minutes)}
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
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
