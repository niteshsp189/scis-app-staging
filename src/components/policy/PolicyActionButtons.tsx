import React from "react";
import { Button } from "@/components/ui/button";
import {
  Eye,
  RefreshCw,
  DollarSign,
  Edit,
  Ban,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Currency } from "@/components/ui/currency";
import { Policy, PolicyStatus } from "@/types/policy";
import { cn } from "@/lib/utils";

interface PolicyActionButtonsProps {
  policy: Policy;
  onViewDetails: (policyId: number) => void;
  onReinstate?: (policyId: number) => void;
  onProcessPayment?: (policyId: number) => void;
  onAmend?: (policyId: number) => void;
  onCancel?: (policyId: number) => void;
  onRenew?: (policyId: number) => void;
  onSendReminder?: (policyId: number) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
  showViewDetails?: boolean; // New prop to control View Details button visibility
}

export const PolicyActionButtons: React.FC<PolicyActionButtonsProps> = ({
  policy,
  onViewDetails,
  onReinstate,
  onProcessPayment,
  onAmend,
  onCancel,
  onRenew,
  onSendReminder,
  showActions = true,
  compact = false,
  className,
  showViewDetails = true, // Default to true to maintain backward compatibility
}) => {
  const outstandingPremium = parseFloat(
    String(policy.outstanding_premium || "0"),
  );
  const hasOutstandingPayments = outstandingPremium > 0;
  const isInGracePeriod = policy.gracePeriods?.some(
    (gp) => gp.status === "active",
  );
  const isRenewalDue =
    policy.status === "Active" &&
    policy.next_renewal_date &&
    new Date(policy.next_renewal_date) <=
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const getStatusBadge = () => {
    const statusConfig = {
      Active: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        label: "Active",
      },
      Pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        label: "Pending",
      },
      Suspended: {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: AlertCircle,
        label: "Suspended",
      },
      Cancelled: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: Ban,
        label: "Cancelled",
      },
      Expired: {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: AlertCircle,
        label: "Expired",
      },
      Lapsed: {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: AlertCircle,
        label: "Lapsed",
      },
    };

    const config =
      statusConfig[policy.status as PolicyStatus] || statusConfig.Pending;
    const IconComponent = config.icon;

    return (
      <Badge
        variant="outline"
        className={cn("flex items-center gap-1 text-xs", config.color)}
      >
        <IconComponent className="h-3 w-3" />
        {config.label}
        {/* {hasOutstandingPayments && (
          <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1">
            <Currency value={outstandingPremium} />
          </span>
        )} */}
        {isInGracePeriod && (
          <span className="ml-1 text-xs bg-orange-500 text-white rounded-full px-1">
            Grace
          </span>
        )}
      </Badge>
    );
  };

  const getPrimaryActions = () => {
    const actions = [];

    // Show View Details only if showViewDetails is true
    if (showViewDetails) {
      actions.push(
        <Button
          key="view"
          variant="outline"
          size={compact ? "sm" : "default"}
          onClick={() => onViewDetails(policy.id)}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          {!compact && "View Details"}
        </Button>,
      );
    }

    // Status-specific actions
    switch (policy.status) {
      case "Active":
        // Payment processing for overdue amounts
        // if (hasOutstandingPayments && onProcessPayment) {
        //   actions.push(
        //     <Button
        //       key="payment"
        //       variant="default"
        //       size={compact ? "sm" : "default"}
        //       onClick={() => onProcessPayment(policy.id)}
        //       className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        //     >
        //       <DollarSign className="h-4 w-4" />
        //       {!compact && (
        //         <>
        //           Pay <Currency value={parseFloat(policy.outstanding_premium || '0')} />
        //         </>
        //       )}
        //     </Button>
        //   );
        // }

        // Send reminder for grace period policies
        // if (isInGracePeriod && onSendReminder) {
        //   actions.push(
        //     <Button
        //       key="reminder"
        //       variant="outline"
        //       size={compact ? "sm" : "default"}
        //       onClick={() => onSendReminder(policy.id)}
        //       className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
        //     >
        //       <AlertCircle className="h-4 w-4" />
        //       {!compact && "Send Reminder"}
        //     </Button>
        //   );
        // }

        // Renewal for policies due for renewal
        // if (isRenewalDue && onRenew) {
        //   actions.push(
        //     <Button
        //       key="renew"
        //       variant="outline"
        //       size={compact ? "sm" : "default"}
        //       onClick={() => onRenew(policy.id)}
        //       className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
        //     >
        //       <RefreshCw className="h-4 w-4" />
        //       {!compact && "Renew"}
        //     </Button>
        //   );
        // }

        // Amendment option
        // if (onAmend) {
        //   actions.push(
        //     <Button
        //       key="amend"
        //       variant="outline"
        //       size={compact ? "sm" : "default"}
        //       onClick={() => onAmend(policy.id)}
        //       className="flex items-center gap-2"
        //     >
        //       <Edit className="h-4 w-4" />
        //       {!compact && "Amend"}
        //     </Button>
        //   );
        // }
        break;

      case "Cancelled":
        // No reinstate button for cancelled policies in simplified system
        break;

      case "Lapsed":
        // Reinstatement option for lapsed policies only
        // if (onReinstate) {
        //   actions.push(
        //     <Button
        //       key="reinstate"
        //       variant="default"
        //       size={compact ? "sm" : "default"}
        //       onClick={() => onReinstate(policy.id)}
        //       className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        //     >
        //       <RotateCcw className="h-4 w-4" />
        //       {!compact && "Reinstate Policy"}
        //     </Button>,
        //   );
        // }
        break;

      case "Expired":
        // Renewal option
        // if (onRenew) {
        //   actions.push(
        //     <Button
        //       key="renew"
        //       variant="default"
        //       size={compact ? "sm" : "default"}
        //       onClick={() => onRenew(policy.id)}
        //       className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        //     >
        //       <RefreshCw className="h-4 w-4" />
        //       {!compact && "Renew Policy"}
        //     </Button>,
        //   );
        // }
        break;

      case "Pending":
        // Cancel option for pending policies
        // if (onCancel) {
        //   actions.push(
        //     <Button
        //       key="cancel"
        //       variant="outline"
        //       size={compact ? "sm" : "default"}
        //       onClick={() => onCancel(policy.id)}
        //       className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-50"
        //     >
        //       <Ban className="h-4 w-4" />
        //       {!compact && "Cancel"}
        //     </Button>,
        //   );
        // }
        break;
    }

    return actions;
  };

  const getSecondaryActions = () => {
    const actions = [];

    // Cancel option for active policies
    if (policy.status === "Active" && onCancel) {
      actions.push(
        <Button
          key="cancel"
          variant="ghost"
          size={compact ? "sm" : "default"}
          onClick={() => onCancel(policy.id)}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Ban className="h-4 w-4" />
          {!compact && "Cancel Policy"}
        </Button>,
      );
    }

    return actions;
  };

  const primaryActions = getPrimaryActions();
  const secondaryActions = getSecondaryActions();

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {getStatusBadge()}
        <div className="flex items-center gap-1">
          {/* Add title/tooltip to first two action buttons */}
          {primaryActions.slice(0, 2).map((action, idx) => {
            if (React.isValidElement(action)) {
              let title = "";
              switch (action.key) {
                case "view":
                  title = "View details";
                  break;
                case "payment":
                  title = "Process payment";
                  break;
                case "reminder":
                  title = "Send payment reminder";
                  break;
                case "renew":
                  title = "Renew policy";
                  break;
                case "amend":
                  title = "Amend policy";
                  break;
                case "reinstate":
                  title = "Reinstate policy";
                  break;
                case "cancel":
                  title = "Cancel policy";
                  break;
                default:
                  title = "";
              }
              // Return element with title as a div wrapper instead of cloning
              return (
                <div key={idx} title={title}>
                  {action}
                </div>
              );
            }
            return action;
          })}
          {primaryActions.length > 2 && (
            <Button
              variant="outline"
              size="sm"
              className="px-2"
              onClick={() => onViewDetails(policy.id)}
              title={`Show ${primaryActions.length - 2} more actions`}
            >
              +{primaryActions.length - 2}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        {getStatusBadge()}
        {hasOutstandingPayments && (
          <div className="flex items-center gap-1 text-sm text-red-600">
            <CreditCard className="h-4 w-4" />
            <span className="font-medium">
              <Currency
                value={parseFloat(String(policy.outstanding_premium || "0"))}
              />{" "}
              due
            </span>
          </div>
        )}
      </div>

      {/* Primary Actions */}
      {showActions && primaryActions.length > 0 && (
        <div className="flex flex-wrap gap-2">{primaryActions}</div>
      )}

      {/* Secondary Actions */}
      {showActions && secondaryActions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {secondaryActions}
        </div>
      )}

      {/* Additional Info */}
      {(isRenewalDue || isInGracePeriod) && (
        <div className="text-xs text-gray-600 space-y-1">
          {isRenewalDue && (
            <div className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              <span>
                Renewal due:{" "}
                {new Date(policy.next_renewal_date!).toLocaleDateString('en-US', { timeZone: 'UTC' })}
              </span>
            </div>
          )}
          {isInGracePeriod && (
            <div className="flex items-center gap-1 text-orange-600">
              <AlertCircle className="h-3 w-3" />
              <span>Policy in grace period</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PolicyActionButtons;
