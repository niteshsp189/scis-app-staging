
import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, DollarSign, TrendingUp } from "lucide-react";
import { DashboardStats as DashboardStatsType } from "@/services/dashboardService";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/hooks/useCurrency";

interface DashboardStatsProps {
  stats?: DashboardStatsType;
  loading?: boolean;
}

export const DashboardStats = ({ stats, loading }: DashboardStatsProps) => {
  const { formatCurrency } = useCurrencyFormatter();
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="professional-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statItems = [
    {
      title: "Total Prospects",
      value: stats.totalLeads.toLocaleString(),
      change: stats.totalLeadsChange,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers?.toLocaleString() ?? "0",
      change: stats.totalCustomersChange ?? "0%",
      icon: Target,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },

    {
      title: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      change: stats.conversionRateChange,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      change: stats.totalRevenueChange,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((stat) => (
        <Card key={stat.title} className="professional-card hover:shadow-professional-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
                {stat.title !== "Total Revenue" && (
                  <p className={`text-sm mt-1 font-medium ${stat.change.startsWith('+') ? 'text-emerald-600' :
                      stat.change.startsWith('-') ? 'text-red-600' : 'text-slate-500'
                    }`}>
                    {stat.change} <span className="font-normal text-slate-500">vs last month</span>
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
