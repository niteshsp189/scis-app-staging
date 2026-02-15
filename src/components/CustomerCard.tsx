import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomerViewUrl } from "@/utils/customerRoutes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  DollarSign, 
  FileText, 
  Eye,
  Users,
  MoreVertical,
  UserCheck
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { CustomerData } from "@/types/customer";
import { MaskedDisplay } from "@/utils/dataMasking";
import { usePermissions } from "@/contexts/PermissionContext";
import { usePhoneSelection } from "@/hooks/usePhoneSelection";
import { useMapSelection } from "@/hooks/useMapSelection";
import { useState } from "react";
import { Policy } from "@/types/policy";
import { EditCustomerDialog } from "@/components/dialogs/EditCustomerDialog";
import { formatDisplayDate } from "@/utils/dateFormatters";

interface CustomerCardProps {
  customer: CustomerData;
  isAdmin: boolean;
}

// Helper function to get premium value from policy (same as CustomerPoliciesTab)
const getPremiumValue = (policy: Policy): number => {
  // Check if the policy has a plan with plan type that includes premium in extra fields
  const planType = policy.plan?.planType || policy.plan?.plan_type;

  // Parse field_values if it's a string
  let fieldValues = policy.field_values;
  if (typeof fieldValues === "string") {
    try {
      fieldValues = JSON.parse(fieldValues);
    } catch (e) {
      console.error("Failed to parse field_values:", e);
      return 0;
    }
  }

  // If plan type has premium in extra fields and policy has field_values
  if (
    planType?.extra_fields?.premium &&
    fieldValues &&
    typeof fieldValues === "object"
  ) {
    const premiumValue = fieldValues.premium;

    if (
      premiumValue !== undefined &&
      premiumValue !== null &&
      premiumValue !== ""
    ) {
      const numericValue = parseFloat(premiumValue.toString());
      if (!isNaN(numericValue)) {
        return numericValue;
      }
    }
  }

  // For all other cases (no premium in extra fields, no field_values, or empty premium), return 0
  return 0;
};

export const CustomerCard = ({ customer, isAdmin }: CustomerCardProps) => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canViewSensitive = hasPermission && hasPermission("view_sensitive_data");
  const { handleCall, PhoneSelectionDialog, hasPhoneNumbers } = usePhoneSelection();
  const { handleMapClick, MapSelectionDialog } = useMapSelection();
  
  // State for edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Use data from API response instead of making separate API calls (N+1 problem fix)
  // The policies and dependents are already loaded with the customer list from the API
  const policies = customer.policies || [];
  const dependentsCount = customer.dependents?.length || 0;
  
  // Calculate total premium from already-loaded policies data
  const calculatedPremium = policies.reduce((sum: number, policy: any) => {
    const premiumValue = getPremiumValue(policy);
    const planType = policy.plan?.planType || policy.plan?.plan_type;
    if (planType?.extra_fields?.premium && premiumValue > 0) {
      return sum + premiumValue;
    }
    return sum;
  }, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200";
      case "Renewal Due":
        return "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200";
      case "Expired":
        return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200";
    }
  };

  const formatPhone = (phone: string) => {
    if (!phone) return "N/A";
    return phone;
  };

  const formatLocation = (customer: CustomerData) => {
    // Combine full address
    const parts = [
      customer.address,
      customer.apartment,
      customer.city,
      customer.state,
      customer.zipCode,
      customer.country
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : "N/A";
  };

  const getDisplayName = (customer: CustomerData) => {
    if (customer.name) return customer.name;
    if (customer.firstName || customer.lastName) {
      const parts = [customer.firstName, customer.middleName, customer.lastName].filter(Boolean);
      return parts.join(' ').trim();
    }
    return "N/A";
  };

  const getPrimaryPhone = (customer: CustomerData) => {
    return customer.phone || customer.cellPhone || customer.homePhone || "";
  };

  const handleEmail = () => {
    window.open(`mailto:${customer.email}`, '_self');
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md shrink-0">
              {getDisplayName(customer).split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle 
                className="text-lg font-semibold text-gray-900 leading-tight"
                title={getDisplayName(customer)}
              >
                <div className="break-words hyphens-auto">
                  {getDisplayName(customer)}
                </div>
              </CardTitle>
              <div className="text-sm text-gray-600 flex items-start gap-1 min-w-0 mt-1" title={customer.email || "No Email"}>
                <Mail className="h-3 w-3 shrink-0 mt-0.5" />
                {customer.email ? (
                  <a href={`mailto:${customer.email}`} className="text-xs leading-tight hover:underline text-blue-700 truncate">
                    {customer.email}
                  </a>
                ) : (
                  <span className="text-xs leading-tight">No Email</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              className={`text-xs px-2 py-1 shrink-0 transition-colors ${getStatusColor(customer.status)}`}
              title={`Customer Status: ${customer.status}`}
            >
              {customer.status}
            </Badge>
            {customer.status === "Prospect" && hasPermission("convert_qualified_prospects") && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Convert to Client
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="h-4 w-4 text-blue-500 shrink-0" />
            <span className="truncate">
              <MaskedDisplay 
                value={getPrimaryPhone(customer) || "N/A"} 
                type="phone"
                visible={canViewSensitive}
              />
            </span>
          </div>
         
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
            <span
              className="truncate hover:underline text-blue-700 cursor-pointer"
              title={formatLocation(customer)}
              onClick={() => handleMapClick(formatLocation(customer))}
            >
              {formatLocation(customer)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4 text-blue-500 shrink-0" />
            <span>
              {customer.dateOfBirth
                ? (() => {
                    const dob = new Date(customer.dateOfBirth);
                    const day = dob.getUTCDate();
                    const month = dob.toLocaleString('default', { month: 'long', timeZone: 'UTC' });
                    const year = dob.getUTCFullYear();
                    const age = customer.age !== undefined ? customer.age : '';
                    return `${day} ${month}, ${year}${age ? ` (${age} years)` : ''}`;
                  })()
                : "DOB N/A"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{customer.totalPolicies}</div>
            <div className="text-xs text-gray-500">Policies</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-emerald-600">
              ${calculatedPremium !== null ? calculatedPremium.toLocaleString() : customer.totalPremium.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Premium</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {dependentsCount !== null ? dependentsCount : (customer.dependents?.length || 0)}
            </div>
            <div className="text-xs text-gray-500">Dependents</div>
          </div>
        </div>

        <div className="flex gap-2 pt-3">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 text-xs"
            onClick={() => handleCall(customer)}
            disabled={!hasPhoneNumbers(customer)}
          >
            <Phone className="h-3 w-3 mr-1" />
            Call
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 text-xs"
            onClick={handleEmail}
            disabled={!customer.email}
          >
            <Mail className="h-3 w-3 mr-1" />
            Email
          </Button>
          <Link 
            to={getCustomerViewUrl(customer.id, customer.status)}
            className="flex-1"
          >
            <Button 
              size="sm" 
              className="w-full text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
          </Link>
        </div>
      </CardContent>

      <PhoneSelectionDialog />
      <MapSelectionDialog />
      
      {customer.status === "Prospect" && (
        <EditCustomerDialog
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          customer={customer}
          forceClientValidation={true}
          onCustomerUpdated={() => {
            setShowEditDialog(false);
            // Refresh the page to show updated data
            window.location.reload();
          }}
        />
      )}
    </Card>
  );
};
