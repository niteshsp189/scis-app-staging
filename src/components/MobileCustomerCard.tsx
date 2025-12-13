
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, User, MapPin, Users, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  policies: string[];
  familyId: string;
  dependents: Array<{
    name: string;
    relationship: string;
    policies: string[];
  }>;
  groupPolicy: string | null;
}

interface MobileCustomerCardProps {
  customer: Customer;
}

export const MobileCustomerCard = ({ customer }: MobileCustomerCardProps) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Renewal Due":
        return "bg-yellow-100 text-yellow-800";
      case "Expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleCall = () => {
    window.open(`tel:${customer.phone}`, '_self');
  };

  const handleEmail = () => {
    window.open(`mailto:${customer.email}`, '_self');
  };

  const handleViewDetails = () => {
    navigate(`/customers/${customer.id}`);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-blue-100 rounded-full shrink-0">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base truncate">{customer.name}</CardTitle>
              <p className="text-sm text-gray-600 truncate">{customer.company}</p>
            </div>
          </div>
          <Badge className={`text-xs shrink-0 ${getStatusColor(customer.status)}`}>
            {customer.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Policies</span>
            <span className="font-medium">{customer.totalPolicies}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Premium</span>
            <span className="font-medium">${customer.totalPremium.toLocaleString()}</span>
          </div>

          {customer.dependents.length > 0 && (
            <div className="flex items-center justify-between col-span-2">
              <span className="text-gray-600">Dependents</span>
              <span className="font-medium">{customer.dependents.length}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={handleCall}>
            <Phone className="h-3 w-3 mr-1" />
            Call
          </Button>
          <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={handleEmail}>
            <Mail className="h-3 w-3 mr-1" />
            Email
          </Button>
          <Button size="sm" variant="outline" className="text-xs px-2" onClick={handleViewDetails}>
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
