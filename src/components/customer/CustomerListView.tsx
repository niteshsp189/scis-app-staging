import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Calendar, DollarSign, FileText, Eye } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { getCustomerViewUrl } from "@/utils/customerRoutes";
import { CustomerData } from "@/types/customer";
import { usePhoneSelection } from "@/hooks/usePhoneSelection";
import { useMapSelection } from "@/hooks/useMapSelection";
import { MaskedDisplay } from "@/utils/dataMasking";
import { usePermissions } from "@/contexts/PermissionContext";
import { useEffect, useState } from "react";
import { PolicyService } from "@/services/policyService";
import { dependentService } from "@/services/dependentService";
import { Policy } from "@/types/policy";

interface CustomerListViewProps {
  customers: CustomerData[];
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

export const CustomerListView = ({ customers }: CustomerListViewProps) => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canViewSensitive = hasPermission && hasPermission("view_sensitive_data");
  const { handleCall, PhoneSelectionDialog, hasPhoneNumbers } = usePhoneSelection();
  const { handleMapClick, MapSelectionDialog } = useMapSelection();
  
  // State for calculated values per customer
  const [calculatedValues, setCalculatedValues] = useState<Record<number, { premium: number | null; dependents: number | null }>>({});

  // Fetch policies and dependents for all customers
  useEffect(() => {
    const fetchAllData = async () => {
      const newCalculatedValues: Record<number, { premium: number | null; dependents: number | null }> = {};

      await Promise.all(
        customers.map(async (customer) => {
          // Fetch policies and calculate premium
          try {
            const policiesResponse = await PolicyService.getPolicies(1, 100, {
              customer_id: customer.id,
            });
            const policies = policiesResponse.data || [];
            
            const totalPremium = policies.reduce((sum, policy) => {
              const premiumValue = getPremiumValue(policy);
              const planType = policy.plan?.planType || policy.plan?.plan_type;
              if (planType?.extra_fields?.premium && premiumValue > 0) {
                return sum + premiumValue;
              }
              return sum;
            }, 0);
            
            newCalculatedValues[customer.id] = { premium: totalPremium, dependents: null };
          } catch (error) {
            console.error(`Failed to fetch policies for customer ${customer.id}:`, error);
            newCalculatedValues[customer.id] = { premium: customer.totalPremium, dependents: null };
          }

          // Fetch dependents count if needed
          if ((customer.dependents?.length || 0) === 0) {
            try {
              const dependents = await dependentService.getDependents(customer.id);
              newCalculatedValues[customer.id].dependents = dependents.length;
            } catch (error) {
              console.error(`Failed to fetch dependents for customer ${customer.id}:`, error);
              newCalculatedValues[customer.id].dependents = 0;
            }
          } else {
            newCalculatedValues[customer.id].dependents = customer.dependents?.length || 0;
          }
        })
      );

      setCalculatedValues(newCalculatedValues);
    };

    if (customers.length > 0) {
      fetchAllData();
    }
  }, [customers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Renewal Due":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Expired":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
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

  const formatLocation = (customer: CustomerData) => {
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

  const handleEmail = (customer: CustomerData) => {
    if (customer.email) {
      window.open(`mailto:${customer.email}`, '_self');
    }
  };

  return (
    <>
      <div className="space-y-3 w-full">
        {customers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow border-l border-t border-b border-r">
            <CardContent className="p-4">
              {/* Responsive Layout: Stack on mobile, 3 columns on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* First Column: Name, Phone, Email */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {getDisplayName(customer).split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base truncate">{getDisplayName(customer)}</h3>
                      <Badge className={`text-xs ${getStatusColor(customer.status)}`}>
                        {customer.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">
                        <MaskedDisplay 
                          value={getPrimaryPhone(customer) || "N/A"} 
                          type="phone"
                          visible={canViewSensitive}
                        />
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      {customer.email ? (
                        <a href={`mailto:${customer.email}`} className="truncate hover:underline text-blue-700">
                          {customer.email}
                        </a>
                      ) : (
                        <span className="truncate">No Email</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Second Column: Address Only */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span
                      className="text-xs text-blue-700 leading-tight break-words hover:underline cursor-pointer"
                      onClick={() => handleMapClick(formatLocation(customer))}
                    >
                      {formatLocation(customer)}
                    </span>
                  </div>
                </div>
                
                {/* Third Column: Statistics and Buttons */}
                <div className="space-y-3">
                  {/* First Line: Statistics */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-base md:text-lg font-semibold">{customer.totalPolicies || 0}</div>
                      <div className="text-xs text-muted-foreground">Policies</div>
                    </div>
                    <div>
                      <div className="text-base md:text-lg font-semibold truncate">
                        ${calculatedValues[customer.id]?.premium !== undefined 
                          ? calculatedValues[customer.id].premium?.toLocaleString() || '0'
                          : customer.totalPremium?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs text-muted-foreground">Premium</div>
                    </div>
                    <div>
                      <div className="text-base md:text-lg font-semibold">
                        {calculatedValues[customer.id]?.dependents !== undefined 
                          ? calculatedValues[customer.id].dependents 
                          : (customer.dependents?.length || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Dependents</div>
                    </div>
                  </div>
                  
                  {/* Second Line: Action Buttons - Responsive */}
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCall(customer)}
                      disabled={!hasPhoneNumbers(customer)}
                      className="flex-1"
                    >
                      <Phone className="h-3 w-3 md:mr-1" />
                      <span className="hidden md:inline">Call</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEmail(customer)}
                      disabled={!customer.email}
                      className="flex-1"
                    >
                      <Mail className="h-3 w-3 md:mr-1" />
                      <span className="hidden md:inline">Email</span>
                    </Button>
                    <Link 
                      to={getCustomerViewUrl(customer.id, customer.status)}
                      target="_blank"
                      className="flex-1"
                    >
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="w-full"
                      >
                        <Eye className="h-3 w-3 md:mr-1" />
                        <span className="hidden md:inline">Details</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <PhoneSelectionDialog />
      <MapSelectionDialog />
    </>
  );
};
