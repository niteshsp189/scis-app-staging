import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CustomerData } from "@/types/customer";
import { Eye, Mail, Phone } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { usePhoneSelection } from "@/hooks/usePhoneSelection";
import { useEffect, useState } from "react";
import { PolicyService } from "@/services/policyService";
import { dependentService } from "@/services/dependentService";
import { Policy } from "@/types/policy";

interface CustomersTableProps {
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

export function CustomersTable({ customers }: CustomersTableProps) {
  const navigate = useNavigate();
  const { handleCall, PhoneSelectionDialog, hasPhoneNumbers } = usePhoneSelection();
  
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
  
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "prospect":
        return "default";
      case "inactive":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handleEmail = (customer: CustomerData) => {
    if (customer.email) {
      window.location.href = `mailto:${customer.email}`;
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto w-full">
        <Table className="border-l w-full min-w-full">
          <TableHeader className="border-b border-t">
            <TableRow className="divide-x divide-gray-200">
              <TableHead className="w-[25%] min-w-[150px]">Customer</TableHead>
              <TableHead className="w-[12%] min-w-[100px]">Status</TableHead>
               <TableHead className="w-[10%] min-w-[80px]">Policies</TableHead>
               <TableHead className="w-[12%] min-w-[100px]">Premium</TableHead>
               <TableHead className="w-[12%] min-w-[100px]">Dependents</TableHead>
              <TableHead className="text-right sticky right-0 bg-white shadow-[-2px_0_4px_rgba(0,0,0,0.05)] z-10 w-[15%] min-w-[120px] md:min-w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id} className="divide-x divide-gray-200">
                <TableCell className="w-[25%] min-w-[150px]">
                  <div className="font-medium truncate max-w-[200px]">{customer.fullName || `${customer.firstName} ${customer.lastName}`}</div>
                  <div className="text-sm text-gray-500 hidden sm:block truncate max-w-[200px]">{customer.email}</div>
                </TableCell>
                <TableCell className="w-[12%] min-w-[100px]">
                  <Badge variant={getStatusVariant(customer.status)} className="capitalize whitespace-nowrap">
                    {customer.status}
                  </Badge>
                </TableCell>
                 <TableCell className="w-[10%] min-w-[80px]">{customer.policies ? customer.policies.length : 0}</TableCell>
                 <TableCell className="w-[12%] min-w-[100px] whitespace-nowrap">
                   ${calculatedValues[customer.id]?.premium !== undefined 
                     ? calculatedValues[customer.id].premium?.toLocaleString() || '0'
                     : customer.totalPremium?.toLocaleString() || '0'}
                 </TableCell>
                 <TableCell className="w-[12%] min-w-[100px]">
                   {calculatedValues[customer.id]?.dependents !== undefined 
                     ? calculatedValues[customer.id].dependents 
                     : (customer.dependents?.length || 0)}
                 </TableCell>
                <TableCell className="text-right sticky right-0 bg-white shadow-[-2px_0_4px_rgba(0,0,0,0.05)] z-10 w-[15%] min-w-[120px] md:min-w-[140px]">
                  <div className="flex items-center justify-end gap-1 md:gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0"
                      onClick={() => handleCall(customer)}
                      disabled={!hasPhoneNumbers(customer)}
                      title="Call Customer"
                    >
                      <Phone className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0"
                      onClick={() => handleEmail(customer)}
                      disabled={!customer.email}
                      title="Email Customer"
                    >
                      <Mail className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <Link
                      to={`/customers/${customer.id}`}
                      target="_blank"
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0"
                        title="View Customer Details"
                      >
                        <Eye className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <PhoneSelectionDialog />
    </>
  );
}
