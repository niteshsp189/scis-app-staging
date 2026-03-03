import { Button } from "@/components/ui/button";
import { Phone, Clock, Edit, Trash2, UserCheck, Share2 } from "lucide-react";
import { ScheduleMeetingDialog } from "@/components/dialogs/ScheduleMeetingDialog";
import { SetReminderDialog } from "@/components/dialogs/SetReminderDialog";
import { EnhancedCustomerDeletionDialog } from "@/components/dialogs/enhanced-customer-deletion/EnhancedCustomerDeletionDialog";
import { PrintButton } from "@/components/print";
import { CustomerData } from "@/types/customer";
import { usePhoneSelection } from "@/hooks/usePhoneSelection";
import { usePermissions } from "@/contexts/PermissionContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface CustomerHeaderActionsProps {
  customerData: CustomerData;
  isMobile?: boolean;
  onEditCustomer?: () => void;
  onConvertProspect?: () => void;
}

export const CustomerHeaderActions = ({
  customerData,
  isMobile = false,
  onEditCustomer,
  onConvertProspect,
}: CustomerHeaderActionsProps) => {
  const { handleCall, PhoneSelectionDialog, hasPhoneNumbers } =
    usePhoneSelection();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const [showEnhancedDeleteDialog, setShowEnhancedDeleteDialog] = useState(false);

  // Return null if customerData is not available
  if (!customerData) {
    return null;
  }

  const customerId = customerData.id || 0;
  const customerName =
    customerData.name ||
    `${customerData.firstName || ""} ${customerData.lastName || ""}`.trim() ||
    "Unknown Customer";
  // Share the current frontend URL directly — the server handles OG tags for crawlers
  const shareUrl = window.location.href;

  // Check permissions based on customer status
  const isProspect = customerData.status === "Prospect";
  const canDelete = isProspect 
    ? hasPermission("delete_prospects") 
    : hasPermission("delete_customers");
  const canConvert = hasPermission("convert_qualified_prospects");

  const handleDeleteSuccess = () => {
    // Navigate back to customers list with a refresh flag
    navigate("/clients", { state: { refresh: true } });
    setShowEnhancedDeleteDialog(false);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Share link copied",
        description: shareUrl,
      });
    } catch (error) {
      toast({
        title: "Unable to copy link",
        description: "Please copy the share link manually.",
        variant: "destructive",
      });
    }
  };

  if (isMobile) {
    return (
      <>
        {onConvertProspect && canConvert && (
          <div className="mb-3">
            <Button
              size="sm"
              className="w-full text-xs bg-blue-600 hover:bg-blue-700"
              onClick={onConvertProspect}
            >
              <UserCheck className="h-3 w-3 mr-1" />
              Convert to Client
            </Button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            className="text-xs"
            onClick={() => handleCall(customerData)}
            disabled={!hasPhoneNumbers(customerData)}
          >
            <Phone className="h-3 w-3 mr-1" />
            Call
          </Button>
          {onEditCustomer && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={onEditCustomer}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <ScheduleMeetingDialog
            customerId={customerId}
            customerName={customerName}
            trigger={
              <Button variant="outline" size="sm" className="w-full text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Set Appointment
              </Button>
            }
          />
          <SetReminderDialog
            customerId={customerId}
            customerName={customerName}
            trigger={
              <Button variant="outline" size="sm" className="w-full text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Reminder
              </Button>
            }
          />
        </div>

        {/* share link and delete actions intentionally hidden on mobile per requirements */}

        <div className="mt-3">
          <PrintButton
            customerId={customerId}
            customerName={customerName}
            size="sm"
            className="w-full"
          />
        </div>
        <PhoneSelectionDialog />

        <EnhancedCustomerDeletionDialog
          open={showEnhancedDeleteDialog}
          onOpenChange={setShowEnhancedDeleteDialog}
          customer={customerData}
          onDeleteSuccess={handleDeleteSuccess}
        />
      </>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 lg:gap-4 lg:justify-end">
      {onConvertProspect && canConvert && (
        <Button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          onClick={onConvertProspect}
        >
          <UserCheck className="h-4 w-4" />
          Convert to Client
        </Button>
      )}
      <Button
        className="flex items-center gap-2"
        onClick={() => handleCall(customerData)}
        disabled={!hasPhoneNumbers(customerData)}
      >
        <Phone className="h-4 w-4" />
        Call
      </Button>
      {onEditCustomer && (
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={onEditCustomer}
        >
          <Edit className="h-4 w-4" />
          Edit
        </Button>
      )}
      <ScheduleMeetingDialog
        customerId={customerId}
        customerName={customerName}
        trigger={
          <Button variant="outline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Set Appointment
          </Button>
        }
      />
      <SetReminderDialog
        customerId={customerId}
        customerName={customerName}
        trigger={
          <Button variant="outline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Set Reminder
          </Button>
        }
      />
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={handleShare}
      >
        <Share2 className="h-4 w-4" />
        Copy Share Link
      </Button>
      {canDelete && (
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => setShowEnhancedDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4" />
          {isProspect ? "Delete Prospect" : "Delete Customer"}
        </Button>
      )}
      <PrintButton
        customerId={customerId}
        customerName={customerName}
        showDropdown={true}
      />
      <PhoneSelectionDialog />

      <EnhancedCustomerDeletionDialog
        open={showEnhancedDeleteDialog}
        onOpenChange={setShowEnhancedDeleteDialog}
        customer={customerData}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  );
};
