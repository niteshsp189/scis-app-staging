import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuditService } from "@/services/auditService";
import { AuditLog, AuditLogFilters } from "@/types/audit";
import { toast } from "@/hooks/use-toast";
import { 
  Users, 
  Activity, 
  Clock, 
  Calendar, 
  Search,
  TrendingUp,
  BarChart3,
  User
} from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  total_activities: number;
  recent_activities: number;
  last_activity: string;
  most_common_action: string;
  avatar_url?: string;
}

interface StaffActivityData {
  staff_members: StaffMember[];
  activity_timeline: Array<{
    date: string;
    activities_by_staff: Record<string, number>;
  }>;
  action_distribution_by_staff: Record<string, Array<{
    action: string;
    count: number;
  }>>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function StaffActivity() {
  const [staffData, setStaffData] = useState<StaffActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

  const loadStaffActivity = async (period: string = "month") => {
    try {
      setLoading(true);
      
      // Get audit logs with multiple pages to gather comprehensive data
      let allLogs: any[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      
      // Fetch multiple pages to get more comprehensive data
      while (hasMorePages && currentPage <= 10) { // Limit to 10 pages max (1000 records)
        const filters: AuditLogFilters = {
          per_page: 100, // Maximum allowed by the API
          page: currentPage,
        };

        const response = await AuditService.getAuditLogs(filters);
        allLogs = [...allLogs, ...response.data];
        
        // Check if there are more pages
        hasMorePages = currentPage < response.pagination.last_page;
        currentPage++;
        
        // Break if we have enough data or no more pages
        if (!hasMorePages || allLogs.length >= 1000) {
          break;
        }
      }

      const logs = allLogs;

      // Process the data to extract staff activity information
      const staffMap = new Map<string, StaffMember>();
      const timelineMap = new Map<string, Record<string, number>>();
      const actionsByStaff = new Map<string, Map<string, number>>();

      logs.forEach((log: AuditLog) => {
        if (!log.user) return;

        const userId = log.user.id;
        const userName = log.user.name;
        const userEmail = log.user.email;
        const date = format(parseISO(log.created_at), 'MMM dd');

        // Update staff member data
        if (!staffMap.has(userId)) {
          staffMap.set(userId, {
            id: userId,
            name: userName,
            email: userEmail,
            total_activities: 0,
            recent_activities: 0,
            last_activity: log.created_at,
            most_common_action: log.event || 'unknown',
          });
        }

        const staff = staffMap.get(userId)!;
        staff.total_activities++;
        
        // Update last activity if this is more recent
        if (new Date(log.created_at) > new Date(staff.last_activity)) {
          staff.last_activity = log.created_at;
        }

        // Timeline data
        if (!timelineMap.has(date)) {
          timelineMap.set(date, {});
        }
        const dayData = timelineMap.get(date)!;
        dayData[userName] = (dayData[userName] || 0) + 1;

        // Action distribution by staff
        if (!actionsByStaff.has(userId)) {
          actionsByStaff.set(userId, new Map());
        }
        const userActions = actionsByStaff.get(userId)!;
        userActions.set(log.event, (userActions.get(log.event) || 0) + 1);
      });

      // Convert maps to arrays and calculate most common actions
      const staffMembers = Array.from(staffMap.values()).map(staff => {
        const userActions = actionsByStaff.get(staff.id);
        if (userActions && userActions.size > 0) {
          const sortedActions = Array.from(userActions.entries()).sort((a, b) => b[1] - a[1]);
          staff.most_common_action = sortedActions[0][0];
        }
        return staff;
      }).sort((a, b) => b.total_activities - a.total_activities);

      const activityTimeline = Array.from(timelineMap.entries())
        .map(([date, activities]) => ({ date, activities_by_staff: activities }))
        .sort((a, b) => new Date(a.date + " 2025").getTime() - new Date(b.date + " 2025").getTime());

      const actionDistributionByStaff: Record<string, Array<{action: string; count: number}>> = {};
      actionsByStaff.forEach((actions, staffId) => {
        actionDistributionByStaff[staffId] = Array.from(actions.entries())
          .map(([action, count]) => ({ action, count }))
          .sort((a, b) => b.count - a.count);
      });

      setStaffData({
        staff_members: staffMembers,
        activity_timeline: activityTimeline,
        action_distribution_by_staff: actionDistributionByStaff,
      });

    } catch (err: any) {
      console.error('Error loading staff activity:', err);
      toast({
        title: "Error",
        description: "Failed to load staff activity data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffActivity(selectedPeriod);
  }, [selectedPeriod]);

  const filteredStaff = staffData?.staff_members.filter(staff => 
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatActionName = (action: string) => {
    if (!action) return 'Unknown';
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Staff Activity Tracking</h2>
          <p className="text-muted-foreground">Monitor individual staff member activity and performance</p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStaff.length}</div>
            <p className="text-xs text-muted-foreground">
              Active staff members
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredStaff.reduce((sum, staff) => sum + staff.total_activities, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all staff
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Activity</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredStaff.length > 0 
                ? Math.round(filteredStaff.reduce((sum, staff) => sum + staff.total_activities, 0) / filteredStaff.length)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Per staff member
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search staff members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Staff List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredStaff.map((staff) => (
          <Card 
            key={staff.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedStaff === staff.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedStaff(selectedStaff === staff.id ? null : staff.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {getInitials(staff.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{staff.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{staff.email}</p>
                  
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <Activity className="h-3 w-3 text-blue-500" />
                      <span className="text-xs font-medium">{staff.total_activities}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-green-500" />
                      <span className="text-xs">
                        {format(parseISO(staff.last_activity), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {formatActionName(staff.most_common_action)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Timeline Chart */}
      {staffData && staffData.activity_timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={staffData.activity_timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  {filteredStaff.slice(0, 5).map((staff, index) => (
                    <Line
                      key={staff.id}
                      type="monotone"
                      dataKey={`activities_by_staff.${staff.name}`}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      name={staff.name}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Staff Details */}
      {selectedStaff && staffData && (
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredStaff.find(s => s.id === selectedStaff)?.name} - Action Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={staffData.action_distribution_by_staff[selectedStaff] || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="action" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
