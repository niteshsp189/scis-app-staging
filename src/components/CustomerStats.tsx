
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, FileText, Calendar, Users, DollarSign } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/hooks/useCurrency";

interface CustomerStatsProps {
  totalCustomers?: number;
  loading?: boolean;
  status?: "Client" | "Former" | "Deceased" | "Prospect";
}

export const CustomerStats = ({ totalCustomers, loading: externalLoading, status }: CustomerStatsProps) => {
  const { stats, loading: internalLoading, error } = useDashboardStats();
  const { formatCurrency } = useCurrencyFormatter();

  // Use external loading state if provided, otherwise fall back to internal
  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <Skeleton className="h-8 w-1/2 mb-4" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    // You can render a more specific error state here if needed
    return null;
  }

  const displayStats = [
    {
      title: "Total Customers",
      value: stats.total_customers,
      icon: User,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Total Dependents",
      value: stats.total_dependents,
      icon: Users,
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "Active Policies",
      value: stats.total_active_policies,
      icon: FileText,
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Renewals Due",
      value: stats.renewals_due_next_30_days,
      icon: Calendar,
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
    },
    {
      title: "Total Premium",
      value: formatCurrency(stats.total_premium),
      icon: DollarSign,
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {displayStats.map((stat, index) => (
        <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-gray-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
              {stat.title === "Renewals Due" && typeof stat.value === 'number' && stat.value > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                  Urgent
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
