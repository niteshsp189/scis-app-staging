import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Eye,
  RefreshCw,
  ArrowRight,
  Bell,
} from 'lucide-react';
import { PolicyService } from '@/services/policyService';
import { Policy, GracePeriod } from '@/types/policy';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface GracePeriodWidgetProps {
  className?: string;
  onViewAll?: () => void;
  onPolicySelect?: (policyId: number) => void;
}

interface GracePeriodPolicy extends Policy {
  gracePeriod: GracePeriod;
  daysRemaining: number;
  urgencyLevel: 'high' | 'medium' | 'low';
}

export const GracePeriodWidget: React.FC<GracePeriodWidgetProps> = ({
  className = '',
  onViewAll,
  onPolicySelect,
}) => {
  // Query for grace period policies (limit to top 3 for dashboard)
  const {
    data: gracePeriodPolicies = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['grace-period-policies-widget'],
    queryFn: async () => {
      const gracePeriods = await PolicyService.getActiveGracePeriods();

      // Get detailed policy info for each grace period (limit to 3 most urgent)
      const policies = await Promise.all(
        gracePeriods.slice(0, 3).map(async (gp) => {
          const policy = await PolicyService.getPolicy(gp.policy_id, ['customer']);
          const endDate = new Date(gp.end_date);
          const today = new Date();
          const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          let urgencyLevel: 'high' | 'medium' | 'low' = 'low';
          if (daysRemaining <= 3) urgencyLevel = 'high';
          else if (daysRemaining <= 7) urgencyLevel = 'medium';

          return {
            ...policy,
            gracePeriod: gp,
            daysRemaining,
            urgencyLevel,
          } as GracePeriodPolicy;
        })
      );

      // Sort by urgency and days remaining
      return policies.sort((a, b) => {
        const urgencyOrder = { high: 3, medium: 2, low: 1 };
        const urgencyDiff = urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel];
        if (urgencyDiff !== 0) return urgencyDiff;
        return a.daysRemaining - b.daysRemaining;
      });
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  const getUrgencyConfig = (urgencyLevel: 'high' | 'medium' | 'low') => {
    switch (urgencyLevel) {
      case 'high':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          textColor: 'text-red-700',
          icon: AlertTriangle,
        };
      case 'medium':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          textColor: 'text-orange-700',
          icon: Clock,
        };
      case 'low':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          textColor: 'text-yellow-700',
          icon: Clock,
        };
    }
  };

  const handleSendReminder = async (policyId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await PolicyService.sendGracePeriodReminder(policyId);
      toast({
        title: 'Reminder Sent',
        description: 'Grace period reminder has been sent to the customer.',
      });
    } catch (error) {
      toast({
        title: 'Failed to Send Reminder',
        description: 'Unable to send reminder. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Grace Period Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Failed to load grace period alerts.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            Grace Period Alerts
            {gracePeriodPolicies.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {gracePeriodPolicies.length}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : gracePeriodPolicies.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <Clock className="mx-auto h-6 w-6 mb-1 text-gray-400" />
            <p className="text-xs">No policies in grace period</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {gracePeriodPolicies.map((policy) => {
                const urgencyConfig = getUrgencyConfig(policy.urgencyLevel);
                const IconComponent = urgencyConfig.icon;

                return (
                  <div
                    key={policy.id}
                    className="flex items-center justify-between p-2 rounded border hover:bg-gray-50 cursor-pointer"
                    onClick={() => onPolicySelect?.(policy.id)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <IconComponent className={cn('h-3 w-3', urgencyConfig.textColor)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {policy.customer?.name || 'Unknown Customer'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{policy.policy_number}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-2 w-2" />
                            ${policy.outstanding_premium.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className={cn('text-xs', urgencyConfig.color)}>
                        {policy.daysRemaining}d
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => handleSendReminder(policy.id, e)}
                        title="Send reminder"
                      >
                        <Bell className="h-2 w-2" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View All Button */}
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAll}
                className="w-full text-xs h-7"
              >
                View All Grace Period Policies
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GracePeriodWidget;
