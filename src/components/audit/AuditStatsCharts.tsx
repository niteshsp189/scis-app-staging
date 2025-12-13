import { useState } from "react";
import { AuditStats } from '@/types/audit';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO } from "date-fns";

interface AuditStatsChartsProps {
  stats: AuditStats | null;
  loading: boolean;
}

const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  warning: '#f97316',
  success: '#22c55e',
  info: '#06b6d4',
  purple: '#8b5cf6',
};

const PIE_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.danger,
  COLORS.warning,
  COLORS.purple,
  COLORS.info,
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#ec4899', // pink
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#a855f7', // purple
];

export function AuditStatsCharts({ stats, loading }: AuditStatsChartsProps) {
  const [activeTab, setActiveTab] = useState("timeline");

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Unable to load chart data
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare timeline data from activity_timeline
  const timelineData = stats.activity_timeline?.map(item => ({
    date: format(parseISO(item.date), 'MMM dd'),
    count: item.count,
    formattedDate: format(parseISO(item.date), 'MMM dd, yyyy')
  })) || [];

  // Prepare action distribution data from action_distribution
  const rawActionData = stats.action_distribution?.map(item => ({
    name: item.event_label || 'Unknown',
    value: item.count,
    percentage: stats.total_logs > 0 ? ((item.count / stats.total_logs) * 100).toFixed(1) : '0'
  })) || [];

  // Consolidate duplicate action labels and sort by count
  const consolidatedActions = rawActionData.reduce((acc, item) => {
    const existing = acc.find(a => a.name === item.name);
    if (existing) {
      existing.value += item.value;
      existing.percentage = stats.total_logs > 0 ? ((existing.value / stats.total_logs) * 100).toFixed(1) : '0';
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, [] as typeof rawActionData);

  // Sort by count (descending) and take top actions for better visibility
  const actionData = consolidatedActions
    .sort((a, b) => b.value - a.value)
    .slice(0, 12); // Limit to top 12 actions for better visualization

  // Prepare user activity data from top_users
  const topUsersData = stats.top_users?.slice(0, 10).map(user => ({
    name: user.name || 'Unknown User',
    activities: user.activity_count,
    email: user.email || '',
    fullName: user.name || 'Unknown User'
  })) || [];

  // Prepare model distribution data from model_distribution
  const modelData = stats.model_distribution?.map(item => ({
    name: item.model_type_label,
    value: item.count,
    percentage: stats.total_logs > 0 ? ((item.count / stats.total_logs) * 100).toFixed(1) : '0'
  })) || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">Count: {data.value}</p>
          <p className="text-sm">Percentage: {data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="actions">Actions</TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="models">Models</TabsTrigger>
      </TabsList>

      <TabsContent value="timeline" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-sm"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                  interval={timelineData.length > 10 ? Math.ceil(timelineData.length / 8) : 0}
                />
                <YAxis 
                  className="text-sm"
                  tick={{ fontSize: 10 }}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3">
                          <p className="font-medium">{data.formattedDate}</p>
                          <p className="text-sm" style={{ color: payload[0].color }}>
                            Activities: {payload[0].value}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }} 
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: COLORS.primary, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="actions" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Action Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={actionData}
                    cx="50%"
                    cy="40%"
                    outerRadius={90}
                    innerRadius={30}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={1}
                  >
                    {actionData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={PIE_COLORS[index % PIE_COLORS.length]} 
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend 
                    verticalAlign="bottom"
                    height={80}
                    formatter={(value, entry: any) => {
                      const item = actionData.find(d => d.name === value);
                      return `${value} (${item?.percentage || 0}%)`;
                    }}
                    wrapperStyle={{ paddingTop: '20px', fontSize: '11px', lineHeight: '16px' }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions by Count</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={actionData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-sm"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tickFormatter={(value) => value.length > 12 ? value.substring(0, 12) + '...' : value}
                  />
                  <YAxis 
                    className="text-sm"
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="users" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topUsersData} layout="horizontal" margin={{ left: 150, right: 30, top: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  type="number"
                  className="text-sm"
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  className="text-sm"
                  tick={{ fontSize: 10 }}
                  width={140}
                  tickFormatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3">
                          <p className="font-medium">{data.fullName}</p>
                          <p className="text-sm">Activities: {data.activities}</p>
                          <p className="text-sm">Email: {data.email}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="activities" fill={COLORS.secondary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="models" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Model Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={modelData}
                    cx="50%"
                    cy="45%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {modelData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={PIE_COLORS[index % PIE_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend 
                    verticalAlign="bottom"
                    height={60}
                    formatter={(value, entry: any) => {
                      const item = modelData.find(d => d.name === value);
                      return `${value} (${item?.percentage || 0}%)`;
                    }}
                    wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Model Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={modelData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-sm"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
                  />
                  <YAxis 
                    className="text-sm"
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill={COLORS.accent} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
