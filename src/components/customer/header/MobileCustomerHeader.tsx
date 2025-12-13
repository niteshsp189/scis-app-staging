
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, MoreVertical, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CustomerData } from "@/types/customer";
import { CustomerHeaderInfo } from "./CustomerHeaderInfo";
import { CustomerHeaderActions } from "./CustomerHeaderActions";

interface MobileCustomerHeaderProps {
  customerData: CustomerData;
  onEditCustomer?: () => void;
  onConvertProspect?: () => void;
}

export const MobileCustomerHeader = ({ customerData, onEditCustomer, onConvertProspect }: MobileCustomerHeaderProps) => {
  const navigate = useNavigate();

  const handleCall = () => {
    window.open(`tel:${customerData.phone}`, '_self');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/customers")}
          className="flex items-center gap-2 p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-bold text-gray-900 flex-1">{customerData.name}</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleCall}>
              <Phone className="h-4 w-4 mr-2" />
              Call
            </DropdownMenuItem>
            {onEditCustomer && (
              <DropdownMenuItem onClick={onEditCustomer}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CustomerHeaderInfo customerData={customerData} isMobile={true} />
      
      <CustomerHeaderActions customerData={customerData} isMobile={true} onEditCustomer={onEditCustomer} onConvertProspect={onConvertProspect} />
    </div>
  );
};
