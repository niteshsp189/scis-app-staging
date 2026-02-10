import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, FileText, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMapSelection } from "@/hooks/useMapSelection";
import { getCustomerViewUrl } from "@/utils/customerRoutes";
import { Currency } from "@/components/ui/currency";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  location: string;
  status: string;
  totalPolicies: number;
  totalPremium: number;
  nextRenewal: string;
  joinDate: string;
  dependents: Array<{
    name: string;
    relationship: string;
    policies: string[];
  }>;
}

interface CustomerTableViewProps {
  customers: Customer[];
}

export const CustomerTableView = ({ customers }: CustomerTableViewProps) => {
  const navigate = useNavigate();
  const { handleMapClick, MapSelectionDialog } = useMapSelection();

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
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Policies</TableHead>
            <TableHead>Premium</TableHead>
            <TableHead>Family</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {customer.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-muted-foreground">ID: {customer.id}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{customer.company}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm">{customer.phone}</div>
                  {customer.email ? (
                    <a href={`mailto:${customer.email}`} className="text-xs text-blue-700 hover:underline">
                      {customer.email}
                    </a>
                  ) : (
                    <div className="text-xs text-muted-foreground">No Email</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {customer.location && customer.location !== 'N/A' ? (
                  <span
                    className="text-blue-700 hover:underline text-sm cursor-pointer"
                    onClick={() => handleMapClick(customer.location)}
                  >
                    {customer.location}
                  </span>
                ) : (
                  <span>{customer.location}</span>
                )}
              </TableCell>
              <TableCell>
                <Badge className={`text-xs ${getStatusColor(customer.status)}`}>
                  {customer.status}
                </Badge>
              </TableCell>
              <TableCell>{customer.totalPolicies}</TableCell>
              <TableCell>
                <Currency value={customer.totalPremium} />
              </TableCell>
              <TableCell>{customer.dependents.length}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { if (customer.phone) window.open(`tel:${customer.phone}`, '_self'); }} title="Call">
                    <Phone className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { if (customer.email) window.location.href = `mailto:${customer.email}`; }} disabled={!customer.email} title="Email">
                    <Mail className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0"
                    onClick={() => navigate(getCustomerViewUrl(customer.id, customer.status))}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MapSelectionDialog />
    </div>
  );
};
