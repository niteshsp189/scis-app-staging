import { Card, CardContent } from "@/components/ui/card";
import { Users, DollarSign, FileText, Calendar } from "lucide-react";
import { CustomerData } from "@/types/customer";
import { useIsMobile } from "@/hooks/use-mobile";

interface CustomerQuickStatsProps {
  customerData: CustomerData;
}

export const CustomerQuickStats = ({
  customerData,
}: CustomerQuickStatsProps) => {
  const isMobile = useIsMobile();

  // Return null if customerData is not available
  if (!customerData) {
    return null;
  }

  const totalPolicies = customerData.totalPolicies || 0;
  const activePolicies = customerData.activePolicies || 0;
  const totalPremium = customerData.totalPremium || 0;
  const totalActivePremium = customerData.totalActivePremium || 0;
  const familyMembersCount = customerData.familyMembers?.length || 0;
  
  // Get next renewal date from active policies
  const getNextRenewalDate = () => {
    if (activePolicies === 0) {
      return "No Active Policy";
    }
    
    // Try to get the next renewal date from the customer data
    // This should ideally come from the earliest active policy renewal date
    if (customerData.nextRenewal && customerData.nextRenewal !== "No Active Policy") {
      return new Date(customerData.nextRenewal).toLocaleDateString();
    }
    
    // Fallback to a default date
    return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString();
  };

  const stats = [
    {
      icon: FileText,
      label: isMobile ? "Policies" : "Total Policies",
      value: `${activePolicies} active of ${totalPolicies}`,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: DollarSign,
      label: isMobile ? "Premium" : "Annual Premium",
      value: `$${totalActivePremium.toLocaleString()} of $${totalPremium.toLocaleString()}`,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: Users,
      label: isMobile ? "Dependents" : "Dependents",
      value: familyMembersCount.toString(),
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: Calendar,
      label: isMobile ? "Renewal" : "Next Renewal",
      value: getNextRenewalDate(),
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div
      className={`grid ${isMobile ? "grid-cols-2 gap-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"}`}
    >
      {stats.map((stat, index) => (
        <Card key={index} className="border-0 shadow-sm">
          <CardContent className={`${isMobile ? "p-3" : "p-6"}`}>
            <div className="flex items-center gap-3">
              <div
                className={`${isMobile ? "w-10 h-10" : "w-12 h-12"} ${stat.bgColor} rounded-lg flex items-center justify-center`}
              >
                <stat.icon
                  className={`${isMobile ? "h-4 w-4" : "h-6 w-6"} ${stat.color}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`${isMobile ? "text-xs" : "text-sm"} text-gray-600 truncate`}
                >
                  {stat.label}
                </p>
                <p
                  className={`${isMobile ? "text-lg" : "text-2xl"} font-bold text-gray-900 truncate`}
                >
                  {stat.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};