import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity, 
  Shield, 
  AlertTriangle,
  Calendar,
  MousePointer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditStats } from "@/types/audit";

interface AuditStatsCardsProps {
  stats: AuditStats | null;
  loading: boolean;
}

export function AuditStatsCards({ stats, loading }: AuditStatsCardsProps) {
  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
  };

  const formatPercentage = (current: number, previous: number) => {
    if (previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change > 0,
      isNegative: change < 0
    };
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Data</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Unable to load statistics
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalLogsChange = formatPercentage(
    stats.total_logs || 0,
    stats.previous_period?.total_logs || 0
  );

  const activeUsersChange = formatPercentage(
    stats.active_users || 0,
    stats.previous_period?.active_users || 0
  );

  const failedLoginsChange = formatPercentage(
    stats.failed_logins || 0,
    stats.previous_period?.failed_logins || 0
  );

  const activityRateChange = formatPercentage(
    stats.activity_rate || 0,
    stats.previous_period?.activity_rate || 0
  );

  const cards = [
    {
      title: "Total Audit Logs",
      value: formatNumber(stats.total_logs || 0),
      description: "All recorded activities",
      icon: Activity,
      change: totalLogsChange,
      color: "text-blue-600"
    },
    {
      title: "Active Users",
      value: formatNumber(stats.active_users || 0),
      description: "Users with recent activity",
      icon: Users,
      change: activeUsersChange,
      color: "text-green-600"
    },
    {
      title: "Failed Logins",
      value: formatNumber(stats.failed_logins || 0),
      description: "Security incidents",
      icon: AlertTriangle,
      change: failedLoginsChange,
      color: "text-red-600"
    },
    {
      title: "Activity Rate",
      value: `${(stats.activity_rate || 0).toFixed(1)}%`,
      description: "User engagement level",
      icon: TrendingUp,
      change: activityRateChange,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>{card.description}</span>
                {card.change && (
                  <div className={`flex items-center ${
                    card.change.isPositive ? 'text-green-600' : 
                    card.change.isNegative ? 'text-red-600' : 'text-muted-foreground'
                  }`}>
                    {card.change.isPositive ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : card.change.isNegative ? (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    ) : null}
                    {card.change.value}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
