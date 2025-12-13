
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CustomerData } from "@/types/customer";
import { CustomerHeaderInfo } from "./CustomerHeaderInfo";
import { CustomerHeaderActions } from "./CustomerHeaderActions";

interface DesktopCustomerHeaderProps {
  customerData: CustomerData;
  onEditCustomer?: () => void;
  onConvertProspect?: () => void;
}

export const DesktopCustomerHeader = ({ customerData, onEditCustomer, onConvertProspect }: DesktopCustomerHeaderProps) => {
  const navigate = useNavigate();

  const getBackNavigation = () => {
    switch (customerData.status) {
      case "Prospect":
        return { text: "Back to Prospects", url: "/customers/prospects" };
      case "Former":
        return { text: "Back to Former Customers", url: "/customers/former" };
      case "Deceased":
        return { text: "Back to Deceased Customers", url: "/customers/deceased" };
      default:
        return { text: "Back to Customers", url: "/customers" };
    }
  };

  const { text: backText, url: backUrl } = getBackNavigation();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(backUrl)}
          className="flex items-center gap-2 border border-gray-200 rounded-md"
        >
          <ArrowLeft className="h-4 w-4" />
          {backText}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        <CustomerHeaderInfo customerData={customerData} />
        <CustomerHeaderActions customerData={customerData} onEditCustomer={onEditCustomer} onConvertProspect={onConvertProspect} />
      </div>
    </div>
  );
};
