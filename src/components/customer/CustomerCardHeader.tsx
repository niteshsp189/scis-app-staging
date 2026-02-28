
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { CustomerTypeSelector, CustomerType } from "../CustomerTypeSelector";

interface Customer {
  id: number;
  name: string;
  company: string;
  status: string;
  familyId: string;
  nextRenewal: string;
  groupPolicy: string | null;
  customerType?: CustomerType;
}

interface CustomerCardHeaderProps {
  customer: Customer;
  onUpdateCustomerType: (customerType: CustomerType) => void;
}

export const CustomerCardHeader = ({ customer, onUpdateCustomerType }: CustomerCardHeaderProps) => {
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

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg p-6">
      <div className="flex flex-col gap-4">
        {/* Customer Name and Avatar */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500 rounded-full shadow-md">
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">
              {customer.name}
            </h2>
            <p className="text-sm text-gray-600 truncate">{customer.company}</p>
          </div>
        </div>

        {/* Status and ID Row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            ID: {customer.familyId}
          </Badge>
          <Badge className={`text-xs font-medium ${getStatusColor(customer.status)}`}>
            {customer.status}
          </Badge>
          {customer.groupPolicy && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
              👥 Group Policy
            </Badge>
          )}
        </div>

        {/* Customer Type */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Type:</span>
          <div className="w-40">
            <CustomerTypeSelector
              value={customer.customerType || "client"}
              onChange={onUpdateCustomerType}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
