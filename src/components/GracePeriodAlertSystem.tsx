import React, { useState } from 'react';
import { AxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Currency } from '@/components/ui/currency';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Phone,
  Mail,
  Eye,
  RefreshCw,
  Calendar,
  User,
  Bell,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PolicyService } from '@/services/policyService';
import { Policy, GracePeriod } from '@/types/policy';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface GracePeriodAlertSystemProps {
  className?: string;
  showTitle?: boolean;
  maxDisplay?: number;
  autoRefresh?: boolean;
  onPolicySelect?: (policyId: number) => void;
  defaultCollapsed?: boolean;
}

export const GracePeriodAlertSystem: React.FC<GracePeriodAlertSystemProps> = ({
  className = '',
  showTitle = true,
  maxDisplay = 10,
  autoRefresh = true,
  onPolicySelect,
  defaultCollapsed = false,
}) => {

interface GracePeriodPolicy extends Policy {
  gracePeriod: GracePeriod;
  daysRemaining: number;
  urgencyLevel: 'high' | 'medium' | 'low';
}
  const [selectedPolicy, setSelectedPolicy] = useState<GracePeriodPolicy | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Query for grace period policies
  const {
    data: gracePeriodPolicies = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['grace-period-policies'],
    queryFn: async () => {
      const gracePeriods = await PolicyService.getActiveGracePeriods();

      // Process grace periods - they already include policy and customer data
      const policies = gracePeriods.map((gp) => {
        const endDate = new Date(gp.grace_period_end);
        const today = new Date();
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        let urgencyLevel: 'high' | 'medium' | 'low' = 'low';
        if (daysRemaining <= 3) urgencyLevel = 'high';
        else if (daysRemaining <= 7) urgencyLevel = 'medium';

        return {
          ...gp.policy, // Use the policy data from the grace period response
          gracePeriod: gp,
          daysRemaining,
          urgencyLevel,
        } as GracePeriodPolicy;
      });

      // Sort by urgency and days remaining
      return policies.sort((a, b) => {
        const urgencyOrder = { high: 3, medium: 2, low: 1 };
        const urgencyDiff = urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel];
        if (urgencyDiff !== 0) return urgencyDiff;
        return a.daysRemaining - b.daysRemaining;
      });
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: autoRefresh ? 5 * 60 * 1000 : false, // 5 minutes if auto-refresh enabled
  });

  const displayedPolicies = gracePeriodPolicies.slice(0, maxDisplay);

  const getUrgencyConfig = (urgencyLevel: 'high' | 'medium' | 'low') => {
    switch (urgencyLevel) {
      case 'high':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertTriangle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        };
      case 'medium':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: Clock,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
        };
      case 'low':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Clock,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
        };
    }
  };

  const handlePolicyClick = (policy: GracePeriodPolicy) => {
    setSelectedPolicy(policy);
    setIsDetailModalOpen(true);
    // Don't call onPolicySelect here to avoid double popups
    // onPolicySelect?.(policy.id);
  };

  const handleSendReminder = async (policyId: number) => {
    try {
      // Find the grace period for this policy
      const policy = gracePeriodPolicies.find(p => p.id === policyId);
      if (!policy?.gracePeriod?.id) {
        throw new Error('Grace period not found for this policy');
      }
      
      await PolicyService.sendGracePeriodReminder(policy.gracePeriod.id);
      
      // Refresh the data to show updated notification history
      await refetch();
      
      toast({
        title: 'Reminder Sent',
        description: 'Grace period reminder has been sent to the customer.',
      });
    } catch (error: unknown) {
      console.error('Error sending grace period reminder:', error);
      
      // Extract the error message from the response if available
      let errorMessage = 'Unable to send reminder. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }
      
      toast({
        title: 'Failed to Send Reminder',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: 'Refreshed',
        description: 'Grace period alerts have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: 'Unable to refresh data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderPolicyCard = (policy: GracePeriodPolicy) => {
    const urgencyConfig = getUrgencyConfig(policy.urgencyLevel);
    const IconComponent = urgencyConfig.icon;
    // Create a unique key by combining policy ID and grace period ID
    const uniqueKey = `policy-${policy.id}-grace-${policy.gracePeriod?.id || 'none'}`;

    return (
      <Card
        key={uniqueKey}
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          urgencyConfig.bgColor,
          urgencyConfig.borderColor
        )}
        onClick={() => handlePolicyClick(policy)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                <span className="font-medium text-sm">
                  {policy.customer?.name || 'Unknown Customer'}
                </span>
                <Badge variant="outline" className={urgencyConfig.color}>
                  {policy.daysRemaining} days left
                </Badge>
              </div>

              <div className="text-xs text-gray-600 space-y-1">
                <div>Policy: {policy.policy_number}</div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Outstanding: <Currency value={policy.outstanding_premium || 0} />
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Grace ends: {new Date(policy.gracePeriod.grace_period_end).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex gap-1 ml-2">
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                disabled={policy.gracePeriod.status !== 'active'}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendReminder(policy.id);
                }}
                title={policy.gracePeriod.status !== 'active' ? 'Grace period is not active' : 'Send reminder to customer'}
              >
                {policy.gracePeriod.status === 'active' ? 'Send Reminder' : 'Inactive'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePolicyClick(policy);
                }}
                title="View details"
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load grace period alerts.
              <Button
                variant="link"
                className="p-0 h-auto ml-1"
                onClick={() => refetch()}
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)} className={className}>
        <Card>
          <div className="relative">
            <CardHeader className="pb-3 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center gap-2 w-full">
                    {showTitle && (
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        Grace Period Alerts
                        {gracePeriodPolicies.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {gracePeriodPolicies.length}
                          </Badge>
                        )}
                      </CardTitle>
                    )}
                    <span className="sr-only">
                      {isCollapsed ? 'Expand' : 'Collapse'} grace period alerts
                    </span>
                    <div className="ml-auto">
                      {isCollapsed ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefresh();
                  }}
                  disabled={isLoading || isRefreshing}
                  className="h-8 w-8 p-0"
                  aria-label="Refresh grace period alerts"
                >
                  <RefreshCw className={cn('h-4 w-4', (isLoading || isRefreshing) && 'animate-spin')} />
                </Button>
              </div>
            </CardHeader>
          </div>

          <CollapsibleContent>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : gracePeriodPolicies.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Clock className="mx-auto h-8 w-8 mb-2 text-gray-400" />
                  <p className="text-sm">No policies in grace period</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {displayedPolicies.map(renderPolicyCard)}
                  </div>

                  {gracePeriodPolicies.length > maxDisplay && (
                    <div className="text-center pt-2">
                      <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="link" className="text-sm">
                        View all {gracePeriodPolicies.length} policies in grace period
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>All Grace Period Policies</DialogTitle>
                        <DialogDescription>
                          Complete list of policies currently in their grace period
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        {gracePeriodPolicies.map(renderPolicyCard)}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </>
          )}
        </CardContent>
      </CollapsibleContent>
    </Card>
  </Collapsible>

      {/* Policy Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Grace Period Details</DialogTitle>
            <DialogDescription>
              Policy {selectedPolicy?.policy_number} grace period information
            </DialogDescription>
          </DialogHeader>

          {selectedPolicy && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Customer:</span>
                  <p className="text-gray-600">{selectedPolicy.customer?.name}</p>
                </div>
                <div>
                  <span className="font-medium">Policy Number:</span>
                  <p className="text-gray-600">{selectedPolicy.policy_number}</p>
                </div>
                <div>
                  <span className="font-medium">Outstanding Amount:</span>
                  <p className="text-gray-600 font-semibold">
                    ${parseFloat(selectedPolicy.outstanding_premium || '0').toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Days Remaining:</span>
                  <Badge className={getUrgencyConfig(selectedPolicy.urgencyLevel).color}>
                    {selectedPolicy.daysRemaining} days
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Grace Period Started:</span>
                  <p className="text-gray-600">
                    {new Date(selectedPolicy.gracePeriod.grace_period_start).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Grace Period Ends:</span>
                  <p className="text-gray-600">
                    {new Date(selectedPolicy.gracePeriod.grace_period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This policy will lapse if payment is not received by the grace period end date.
                  The customer should be contacted immediately.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleSendReminder(selectedPolicy.id)}
                  className="flex-1"
                  disabled={selectedPolicy.daysRemaining <= 0}
                  title={selectedPolicy.daysRemaining <= 0 ? "Grace period expired - cannot send reminder" : "Send reminder to customer"}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  {selectedPolicy.daysRemaining <= 0 ? "Grace Period Expired" : "Send Reminder"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Navigate to policy details - this would be implemented based on routing
                    onPolicySelect?.(selectedPolicy.id);
                  }}
                  className="flex-1"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Policy
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GracePeriodAlertSystem;
