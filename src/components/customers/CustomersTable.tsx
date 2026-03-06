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
import { getCustomerViewUrl } from "@/utils/customerRoutes";
import { usePhoneSelection } from "@/hooks/usePhoneSelection";

interface CustomersTableProps {
  customers: CustomerData[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const navigate = useNavigate();
  const { handleCall, PhoneSelectionDialog, hasPhoneNumbers } = usePhoneSelection();
  
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
                  {customer.email ? (
                    <a href={`mailto:${customer.email}`} className="text-sm text-blue-700 hover:underline hidden sm:block truncate max-w-[200px]">
                      {customer.email}
                    </a>
                  ) : (
                    <div className="text-sm text-gray-500 hidden sm:block truncate max-w-[200px]">No Email</div>
                  )}
                </TableCell>
                <TableCell className="w-[12%] min-w-[100px]">
                  <Badge variant={getStatusVariant(customer.status)} className="capitalize whitespace-nowrap">
                    {customer.status}
                  </Badge>
                </TableCell>
                 <TableCell className="w-[10%] min-w-[80px]">{customer.totalPolicies || 0}</TableCell>
                 <TableCell className="w-[12%] min-w-[100px] whitespace-nowrap">
                   ${customer.totalPremium?.toLocaleString() || '0'}
                 </TableCell>
                 <TableCell className="w-[12%] min-w-[100px]">
                   {customer.dependents?.length || 0}
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
                      to={getCustomerViewUrl(customer.id, customer.status)}
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
