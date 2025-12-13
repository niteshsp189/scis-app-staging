import { useState, useEffect } from 'react';
import dashboardService, { DashboardStats, DashboardReminder, DashboardCustomerNote, DashboardAppointment } from '@/services/dashboardService';
import { toast } from '@/components/ui/use-toast';
import { formatPermissionError, isPermissionError, getErrorData } from '@/utils/permissionErrorHandler';

export interface DashboardData {
  stats: DashboardStats;
  reminders: DashboardReminder[];
  customerNotes: DashboardCustomerNote[];
  appointments: DashboardAppointment[];
  upcomingAppointments: number;
  overdueInstallments: number;
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashboardData, appointments] = await Promise.all([
        dashboardService.getDashboardData(),
        dashboardService.getUpcomingAppointments()
      ]);
      setData({
        ...dashboardData,
        appointments
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch dashboard data';
      setError(errorMessage);
      
      if (isPermissionError(err)) {
        const errorData = getErrorData(err);
        toast({
          title: "Insufficient Permissions",
          description: formatPermissionError(errorData),
          variant: "default",
          className: "bg-blue-50 border-blue-200",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    try {
      const stats = await dashboardService.getDashboardStats();
      setData(prev => prev ? { ...prev, stats } : null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to refresh dashboard stats.",
        variant: "destructive",
      });
    }
  };

  const completeReminder = async (reminderId: number) => {
    try {
      await dashboardService.completeReminder(reminderId);
      // Remove the completed reminder from the list
      setData(prev => prev ? {
        ...prev,
        reminders: prev.reminders.filter(r => r.id !== reminderId)
      } : null);
      toast({
        title: "Success",
        description: "Reminder marked as completed.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to complete reminder.",
        variant: "destructive",
      });
    }
  };

  const snoozeReminder = async (reminderId: number, minutes: number) => {
    try {
      await dashboardService.snoozeReminder(reminderId, minutes);
      // Remove the snoozed reminder from the list
      setData(prev => prev ? {
        ...prev,
        reminders: prev.reminders.filter(r => r.id !== reminderId)
      } : null);
      toast({
        title: "Success",
        description: `Reminder snoozed for ${minutes} minutes.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to snooze reminder.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    data,
    loading,
    error,
    refreshData: fetchDashboardData,
    refreshStats,
    completeReminder,
    snoozeReminder
  };
}
