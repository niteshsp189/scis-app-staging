import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
} from "lucide-react";
import { format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addMonths, 
  subMonths, 
  isSameMonth, 
  isSameDay, 
  parseISO,
  startOfDay,
  addWeeks,
  subWeeks,
  startOfWeek as getStartOfWeek,
  endOfWeek as getEndOfWeek
} from "date-fns";
import appointmentService, { Appointment } from "@/services/appointmentService";
import { useToast } from "@/hooks/use-toast";
import { ScheduleMeetingDialog } from "@/components/dialogs/ScheduleMeetingDialog";

type CalendarView = "month" | "week" | "day";

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: string;
  priority: string;
  customer?: string;
  location?: string;
  assigned_to?: string;
  status: string;
}

export function MainCalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<CalendarView>("month");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAppointments();
  }, [currentDate, view]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await appointmentService.getAppointments();
      if (response.success) {
        setAppointments(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const navigatePrevious = () => {
    if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const navigateNext = () => {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowScheduleDialog(true);
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    if (!Array.isArray(appointments)) {
      return [];
    }
    
    return appointments
      .filter((apt) => {
        if (!apt || !apt.start_datetime) return false;
        const aptDate = parseISO(apt.start_datetime);
        return isSameDay(aptDate, date);
      })
      .map((apt) => ({
        id: apt.id,
        title: apt.title,
        start: parseISO(apt.start_datetime),
        end: parseISO(apt.end_datetime),
        type: apt.appointment_type,
        priority: apt.priority,
        customer: apt.customer?.first_name + " " + apt.customer?.last_name,
        location: apt.location,
        assigned_to: apt.assigned_to_user?.first_name + " " + apt.assigned_to_user?.last_name,
        status: apt.status,
      }));
  };

  const getViewTitle = () => {
    if (view === "month") {
      return format(currentDate, "MMMM yyyy");
    } else if (view === "week") {
      const startWeek = getStartOfWeek(currentDate, { weekStartsOn: 0 });
      const endWeek = getEndOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(startWeek, "MMM dd")} - ${format(endWeek, "MMM dd, yyyy")}`;
    } else {
      return format(currentDate, "EEEE, MMMM dd, yyyy");
    }
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dayEvents = getEventsForDate(day);
        const isCurrentMonth = isSameMonth(day, currentDate);
        const isToday = isSameDay(day, new Date());
        
        days.push(
          <div
            key={day.toString()}
            className={`min-h-32 border border-gray-200 p-2 cursor-pointer transition-colors hover:bg-gray-50 ${
              isCurrentMonth ? "bg-white" : "bg-gray-50"
            } ${isToday ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => handleDateClick(day)}
          >
            <div className={`text-sm font-medium mb-1 ${
              isCurrentMonth ? "text-gray-900" : "text-gray-400"
            } ${isToday ? "text-blue-600" : ""}`}>
              {format(day, "d")}
            </div>
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className={`text-xs p-1 rounded text-white text-ellipsis overflow-hidden ${
                    event.type === "new_client" ? "bg-green-600" :
                    event.type === "supplement" ? "bg-blue-600" :
                    event.type === "part_d" ? "bg-purple-600" :
                    event.type === "rate_increase" ? "bg-orange-600" :
                    event.type === "under_65" ? "bg-yellow-600" :
                    event.type === "dental_vision" ? "bg-pink-600" :
                    event.type === "review" ? "bg-indigo-600" :
                    event.type === "customer_service" ? "bg-teal-600" :
                    event.type === "field_time" ? "bg-red-600" :
                    event.type === "life_insurance" ? "bg-emerald-600" :
                    "bg-gray-600"
                  }`}
                  title={`${event.title} - ${event.customer}`}
                >
                  {format(event.start, "HH:mm")} {event.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="bg-white rounded-lg border">
        {/* Header with day names */}
        <div className="grid grid-cols-7 border-b">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-4 text-center font-medium text-gray-500 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        {/* Calendar grid */}
        <div>{rows}</div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startWeek = getStartOfWeek(currentDate, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(startWeek, i));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="bg-white rounded-lg border">
        {/* Header */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-4 border-r"></div>
          {days.map((day) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toString()}
                className={`p-4 text-center border-r last:border-r-0 cursor-pointer hover:bg-gray-50 ${
                  isToday ? "bg-blue-50" : ""
                }`}
                onClick={() => handleDateClick(day)}
              >
                <div className={`text-sm font-medium ${isToday ? "text-blue-600" : "text-gray-500"}`}>
                  {format(day, "EEE")}
                </div>
                <div className={`text-lg font-bold ${isToday ? "text-blue-600" : "text-gray-900"}`}>
                  {format(day, "dd")}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Time slots */}
        <div className="grid grid-cols-8">
          <div className="space-y-4">
            {hours.map((hour) => (
              <div key={hour} className="h-16 p-2 border-b text-xs text-gray-500 text-center">
                {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
              </div>
            ))}
          </div>
          {days.map((day) => (
            <div key={day.toString()} className="border-l space-y-4">
              {hours.map((hour) => {
                const dayEvents = getEventsForDate(day).filter(event => 
                  event.start.getHours() === hour
                );
                return (
                  <div key={hour} className="h-16 border-b p-1 relative">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`absolute inset-x-1 top-1 p-1 rounded text-xs text-white ${
                          event.type === "new_client" ? "bg-green-600" :
                          event.type === "supplement" ? "bg-blue-600" :
                          event.type === "part_d" ? "bg-purple-600" :
                          event.type === "rate_increase" ? "bg-orange-600" :
                          event.type === "under_65" ? "bg-yellow-600" :
                          event.type === "dental_vision" ? "bg-pink-600" :
                          event.type === "review" ? "bg-indigo-600" :
                          event.type === "customer_service" ? "bg-teal-600" :
                          event.type === "field_time" ? "bg-red-600" :
                          event.type === "life_insurance" ? "bg-emerald-600" :
                          "bg-gray-600"
                        }`}
                        style={{ height: "calc(100% - 8px)" }}
                        title={`${event.title} - ${event.customer}`}
                      >
                        <div className="font-medium">{event.title}</div>
                        <div className="text-xs opacity-90">{event.customer}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = getEventsForDate(currentDate);

    return (
      <div className="bg-white rounded-lg border">
        {/* Header */}
        <div className="p-4 border-b text-center">
          <div className="text-lg font-bold">{format(currentDate, "EEEE")}</div>
          <div className="text-2xl font-bold text-blue-600">{format(currentDate, "dd")}</div>
          <div className="text-sm text-gray-500">{format(currentDate, "MMMM yyyy")}</div>
        </div>
        
        {/* Day schedule */}
        <div className="grid grid-cols-12">
          <div className="col-span-2 space-y-4">
            {hours.map((hour) => (
              <div key={hour} className="h-16 p-2 border-b text-xs text-gray-500 text-right">
                {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
              </div>
            ))}
          </div>
          <div className="col-span-10 border-l space-y-4">
            {hours.map((hour) => {
              const hourEvents = dayEvents.filter(event => 
                event.start.getHours() === hour
              );
              return (
                <div key={hour} className="h-16 border-b p-2 relative">
                  {hourEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-2 rounded mb-1 text-white ${
                        event.type === "new_client" ? "bg-green-600" :
                        event.type === "supplement" ? "bg-blue-600" :
                        event.type === "part_d" ? "bg-purple-600" :
                        event.type === "rate_increase" ? "bg-orange-600" :
                        event.type === "under_65" ? "bg-yellow-600" :
                        event.type === "dental_vision" ? "bg-pink-600" :
                        event.type === "review" ? "bg-indigo-600" :
                        event.type === "customer_service" ? "bg-teal-600" :
                        event.type === "field_time" ? "bg-red-600" :
                        event.type === "life_insurance" ? "bg-emerald-600" :
                        "bg-gray-600"
                      }`}
                    >
                      <div className="font-medium">{event.title}</div>
                      <div className="text-xs opacity-90 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
                        {event.customer && (
                          <>
                            <User className="h-3 w-3 ml-2" />
                            {event.customer}
                          </>
                        )}
                        {event.location && (
                          <>
                            <MapPin className="h-3 w-3 ml-2" />
                            {event.location}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">{getViewTitle()}</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-md border">
            <Button
              variant={view === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("month")}
              className="rounded-r-none"
            >
              Month
            </Button>
            <Button
              variant={view === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("week")}
              className="rounded-none border-x-0"
            >
              Week
            </Button>
            <Button
              variant={view === "day" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("day")}
              className="rounded-l-none"
            >
              Day
            </Button>
          </div>
          
          <Button onClick={() => setShowScheduleDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="text-gray-500">Loading calendar...</div>
        </div>
      ) : (
        <>
          {view === "month" && renderMonthView()}
          {view === "week" && renderWeekView()}
          {view === "day" && renderDayView()}
        </>
      )}

      {/* Schedule Dialog */}
      {showScheduleDialog && (
        <ScheduleMeetingDialog
          customerId={undefined} // Allow user to select customer
          customerName="Select Customer"
          open={showScheduleDialog}
          onOpenChange={setShowScheduleDialog}
          onScheduled={() => {
            fetchAppointments();
            setShowScheduleDialog(false);
          }}
          defaultDate={selectedDate || new Date()}
        />
      )}
    </div>
  );
}
