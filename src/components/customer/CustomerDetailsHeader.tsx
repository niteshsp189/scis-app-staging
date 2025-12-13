import { CustomerData } from "@/types/customer";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileCustomerHeader } from "./header/MobileCustomerHeader";
import { DesktopCustomerHeader } from "./header/DesktopCustomerHeader";

interface CustomerDetailsHeaderProps {
  customerData: CustomerData;
  onEditCustomer?: () => void;
  onConvertProspect?: () => void;
}

export const CustomerDetailsHeader = ({
  customerData,
  onEditCustomer,
  onConvertProspect,
}: CustomerDetailsHeaderProps) => {
  const isMobile = useIsMobile();

  // Return null if customerData is not available test
  if (!customerData) {
    return null;
  }

  if (isMobile) {
    return (
      <MobileCustomerHeader
        customerData={customerData}
        onEditCustomer={onEditCustomer}
        onConvertProspect={onConvertProspect}
      />
    );
  }

  return (
    <DesktopCustomerHeader
      customerData={customerData}
      onEditCustomer={onEditCustomer}
      onConvertProspect={onConvertProspect}
    />
  );
};
