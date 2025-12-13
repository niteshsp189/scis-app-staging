import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { MaskedDisplay } from "@/utils/dataMasking";
import { usePermissions } from "@/contexts/PermissionContext";
import { CustomerData } from "@/types/customer";

interface PhoneOption {
  label: string;
  value: string;
  icon: string;
  color: string;
}

export const usePhoneSelection = () => {
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerData | null>(null);
  const { hasPermission } = usePermissions();
  const canViewSensitive = hasPermission && hasPermission("view_sensitive_data");

  const getPhoneOptions = (customer: CustomerData): PhoneOption[] => {
    const options: PhoneOption[] = [];
    
    if (customer.cellPhone) {
      options.push({
        label: "Cell Phone",
        value: customer.cellPhone,
        icon: "cell",
        color: "text-green-600"
      });
    }
    
    if (customer.homePhone) {
      options.push({
        label: "Home Phone", 
        value: customer.homePhone,
        icon: "home",
        color: "text-blue-600"
      });
    }
    
    if (customer.workPhone) {
      options.push({
        label: "Work Phone",
        value: customer.workPhone, 
        icon: "work",
        color: "text-purple-600"
      });
    }
    
    return options;
  };

  const handleCall = (customer: CustomerData) => {
    const phoneOptions = getPhoneOptions(customer);
    
    // Always show the dialog if there are phone numbers available
    // This way users can see which phone type they're calling
    if (phoneOptions.length > 0) {
      setCurrentCustomer(customer);
      setShowPhoneDialog(true);
      return;
    }
    
    // No phone numbers available - could show a message or do nothing
  };

  const handlePhoneSelect = (phoneNumber: string) => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_self');
    }
    setShowPhoneDialog(false);
    setCurrentCustomer(null);
  };

  const closeDialog = () => {
    setShowPhoneDialog(false);
    setCurrentCustomer(null);
  };

  const PhoneSelectionDialog = () => {
    if (!currentCustomer) return null;
    
    const phoneOptions = getPhoneOptions(currentCustomer);

    return (
      <Dialog open={showPhoneDialog} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Select Phone Number
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {phoneOptions.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start min-h-[4rem]"
                onClick={() => handlePhoneSelect(option.value)}
              >
                <div className="flex items-center gap-3">
                  <Phone className={`h-4 w-4 ${option.color}`} />
                  <div className="text-left">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-600">
                      <MaskedDisplay 
                        value={option.value} 
                        visible={canViewSensitive}
                      />
                    </div>
                  </div>
                </div>
              </Button>
            ))}
            
            {phoneOptions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Phone className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No phone numbers available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return {
    handleCall,
    PhoneSelectionDialog,
    hasPhoneNumbers: (customer: CustomerData) => getPhoneOptions(customer).length > 0
  };
};