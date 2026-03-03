
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
        return { text: "Back to Prospects", url: "/prospects" };
      case "Former":
        return { text: "Back to Former Customers", url: "/formers" };
      case "Deceased":
        return { text: "Back to Deceased Customers", url: "/deceaseds" };
      default:
        return { text: "Back to Customers", url: "/clients" };
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

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1 min-w-0 lg:pr-4">
          <CustomerHeaderInfo customerData={customerData} />
        </div>
        <div className="flex-none w-full lg:w-auto lg:max-w-[60%]">
          <CustomerHeaderActions customerData={customerData} onEditCustomer={onEditCustomer} onConvertProspect={onConvertProspect} />
        </div>
      </div>
    </div>
  );
};
