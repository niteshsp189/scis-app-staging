import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarView } from "@/components/CalendarView";
import { MainCalendarView } from "@/components/MainCalendarView";
import { AppointmentsTableView } from "@/components/appointments/AppointmentsTableView";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, UserX, RefreshCw, CalendarDays, Table } from "lucide-react";
import { ScheduleMeetingWithCustomerDialog } from "@/components/dialogs/ScheduleMeetingWithCustomerDialog";
import LeaveManagement from "@/components/leaves/LeaveManagement";
import { CalendarIntegration } from "@/components/calendar/CalendarIntegration";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/components/ui/use-toast";
import { usePermissions } from "@/contexts/PermissionContext";
import { ConditionalAccess } from "@/components/ProtectedRoute";

const Appointments = () => {
  const isMobile = useIsMobile();
  const { hasPermission } = usePermissions();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("main-calendar");
  const mainCalendarRef = useRef<any>(null);
  const calendarViewRef = useRef<any>(null);
  const tableViewRef = useRef<any>(null);

  // Permission checks
  const canViewAppointments = hasPermission("view_appointments");
  const canCreateAppointments = hasPermission("create_appointments");
  const canEditAppointments = hasPermission("edit_appointments");
  const canDeleteAppointments = hasPermission("delete_appointments");

  return (
    <div className={`${isMobile ? "pt-16 pb-20 px-3" : "p-6"} space-y-4 md:space-y-6`}>
      {/* Header Section */}
      <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Appointments
          </h1>
          <p className="text-xs md:text-sm text-gray-600">
            Manage your schedule, leaves, and calendar integrations
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              setIsRefreshing(true);
              try {
                // Refresh the active calendar view
                if (activeTab === "main-calendar" && mainCalendarRef.current) {
                  await mainCalendarRef.current.refreshAppointments();
                } else if (activeTab === "calendar" && calendarViewRef.current) {
                  await calendarViewRef.current.refreshAppointments();
                } else if (activeTab === "table" && tableViewRef.current) {
                  await tableViewRef.current.refreshAppointments();
                }
                toast({
                  title: "Calendar Refreshed",
                  description: "Appointments have been updated successfully.",
                });
              } catch (error) {
                toast({
                  title: "Refresh Failed",
                  description: "Failed to refresh appointments. Please try again.",
                  variant: "destructive",
                });
              } finally {
                setIsRefreshing(false);
              }
            }}
            disabled={isRefreshing}
            size={isMobile ? "sm" : "default"}
            className="flex-1 md:flex-none"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""} ${isMobile ? "" : "mr-2"}`} />
            {!isMobile && (isRefreshing ? "Refreshing..." : "Refresh")}
          </Button>
          <ConditionalAccess
            requiredPermissions={['create_appointments']}
            fallback={null}
          >
            <ScheduleMeetingWithCustomerDialog
              trigger={
                <Button size={isMobile ? "sm" : "default"} className="flex-1 md:flex-none">
                  <Plus className="h-4 w-4 mr-1 md:mr-2" />
                  {isMobile ? "Schedule" : "Schedule Meeting"}
                </Button>
              }
              onScheduled={() => {
                // Refresh the calendar after scheduling
                if (activeTab === "main-calendar" && mainCalendarRef.current) {
                  mainCalendarRef.current.refreshAppointments();
                } else if (activeTab === "calendar" && calendarViewRef.current) {
                  calendarViewRef.current.refreshAppointments();
                } else if (activeTab === "table" && tableViewRef.current) {
                  tableViewRef.current.refreshAppointments();
                }
              }}
            />
          </ConditionalAccess>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="main-calendar" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto gap-1 md:gap-0 p-1">
          <TabsTrigger 
            value="main-calendar" 
            className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-2.5"
          >
            <CalendarDays className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Main Calendar</span>
            <span className="sm:hidden">Main</span>
          </TabsTrigger>
          <TabsTrigger 
            value="calendar" 
            className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-2.5"
          >
            <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">My Appointments</span>
            <span className="sm:hidden">My Appts</span>
          </TabsTrigger>
          <TabsTrigger 
            value="table" 
            className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-2.5"
          >
            <Table className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Table View</span>
            <span className="sm:hidden">Table</span>
          </TabsTrigger>
          <TabsTrigger 
            value="leaves" 
            className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-2.5"
          >
            <UserX className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Leave Management</span>
            <span className="sm:hidden">Leaves</span>
          </TabsTrigger>
          <TabsTrigger 
            value="integration" 
            className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-2.5"
          >
            <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Calendar Sync</span>
            <span className="sm:hidden">Sync</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main-calendar" className="mt-3 md:mt-4 space-y-4">
          <div className="w-full overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
            <MainCalendarView 
              ref={mainCalendarRef}
              permissions={{
                canCreate: canCreateAppointments,
                canEdit: canEditAppointments,
                canDelete: canDeleteAppointments,
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-3 md:mt-4 space-y-4">
          <div className="w-full overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
            <CalendarView 
              ref={calendarViewRef}
              permissions={{
                canCreate: canCreateAppointments,
                canEdit: canEditAppointments,
                canDelete: canDeleteAppointments,
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="table" className="mt-3 md:mt-4 space-y-4">
          <AppointmentsTableView 
            ref={tableViewRef}
            permissions={{
              canCreate: canCreateAppointments,
              canEdit: canEditAppointments,
              canDelete: canDeleteAppointments,
            }}
          />
        </TabsContent>

        <TabsContent value="leaves" className="mt-3 md:mt-4 space-y-4">
          <LeaveManagement />
        </TabsContent>

        <TabsContent value="integration" className="mt-3 md:mt-4 space-y-4">
          <CalendarIntegration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Appointments;
