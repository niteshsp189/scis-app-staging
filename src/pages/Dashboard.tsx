
import { toast } from "@/components/ui/use-toast";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardReminders } from "@/components/dashboard/DashboardReminders";
import { DashboardCustomerNotes } from "@/components/dashboard/DashboardCustomerNotes";
import { DashboardAppointments } from "@/components/dashboard/DashboardAppointments";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDashboard } from "@/hooks/useDashboard";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { 
    data, 
    loading, 
    error, 
    refreshData, 
    refreshStats, 
    completeReminder, 
    snoozeReminder 
  } = useDashboard();

  const handleRefresh = () => {
    refreshData();
    toast({
      title: "Refreshed",
      description: "Dashboard data has been refreshed.",
    });
  };

  if (error) {
    const isPermissionError = error.toLowerCase().includes('permission') || 
                             error.toLowerCase().includes('unauthorized') || 
                             error.toLowerCase().includes('forbidden') ||
                             error.toLowerCase().includes('403');

    return (
      <div className={`min-h-screen w-full flex flex-col ${isMobile ? "p-4 space-y-6" : "p-8 space-y-8"} bg-gradient-to-br from-blue-50 via-white to-indigo-50`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'}`}>
          <div>
            <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-slate-900 tracking-tight`}>
              Dashboard
            </h1>
            <p className="text-slate-600 mt-1">Welcome back! Here's your business overview.</p>
          </div>
        </div>
        
        <Alert 
          variant={isPermissionError ? "default" : "destructive"}
          className={isPermissionError ? "bg-blue-50 border-blue-200" : ""}
        >
          <AlertCircle className={`h-4 w-4 ${isPermissionError ? 'text-blue-600' : ''}`} />
          <AlertDescription className="space-y-3">
            {isPermissionError ? (
              <>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Insufficient Permissions</p>
                  <p className="text-gray-700">
                    You don't have the required permissions to access the dashboard data.
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <p className="text-sm font-medium text-gray-900 mb-2">Permission required:</p>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span className="text-gray-700"><strong>View Dashboard</strong> - Access to dashboard statistics and overview</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  Please contact your system administrator to request the <strong>View Dashboard</strong> permission.
                </p>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <span>Failed to load dashboard data: {error}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-4"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full flex flex-col ${isMobile ? "pt-20 px-4 pb-4 space-y-6" : "p-8 space-y-8"} bg-slate-50`}>
      <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'}`}>
        <div>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-slate-900 tracking-tight`}>
            Dashboard
          </h1>
          <p className="text-slate-600 mt-1">Welcome back! Here's your business overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      <DashboardStats stats={data?.stats} loading={loading} />
      
      <DashboardReminders 
        reminders={data?.reminders} 
        loading={loading}
        onComplete={completeReminder}
        onSnooze={snoozeReminder}
      />
      
      <DashboardAppointments
        appointments={data?.appointments}
        upcomingCount={data?.upcomingAppointments}
        loading={loading}
        onViewAppointment={(id) => {
          // Navigate to appointment details
          
          navigate(`/appointments/${id}`);
        }}
        onReschedule={(id) => {
          // Open reschedule dialog or navigate to appointments
          
          navigate(`/appointments/${id}/reschedule`);
        }}
      />
      
      <DashboardCustomerNotes 
        customerNotes={data?.customerNotes} 
        loading={loading}
      />
    </div>
  );
};

export default Dashboard;
