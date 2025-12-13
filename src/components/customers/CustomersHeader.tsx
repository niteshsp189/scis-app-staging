
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { UploadCustomersDialog } from "@/components/dialogs/UploadCustomersDialog";
import { Plus } from "lucide-react";
import { usePermissions } from "@/contexts/PermissionContext";

interface CustomersHeaderProps {
  // Simple usage (from Customers.tsx)
  onAddCustomer?: () => void;
  onUploadCustomers?: (customers: any[]) => void;
  
  // Extended usage (from CustomersByStatus.tsx)  
  title?: string;
  description?: string;
  currentView?: any;
  onViewChange?: (view: any) => void;
  viewMode?: "pagination" | "infinite";
  onViewModeChange?: (mode: "pagination" | "infinite") => void;
  isAddDialogOpen?: boolean;
  onAddDialogToggle?: () => void;
  showAddButton?: boolean;
  buttonText?: string; // Custom button text (e.g., "Add Prospect")
  status?: 'Client' | 'Prospect' | 'Former' | 'Deceased'; // Status for upload dialog
}

export function CustomersHeader({ 
  onAddCustomer, 
  onUploadCustomers,
  title = "Customer Management",
  description = "Manage and nurture your customer relationships",
  currentView,
  onViewChange,
  viewMode,
  onViewModeChange,
  isAddDialogOpen,
  onAddDialogToggle,
  showAddButton = true,
  buttonText = "Add Customer",
  status
}: CustomersHeaderProps) {
  const isMobile = useIsMobile();
  const { hasPermission } = usePermissions();

  // Check permissions based on status
  const isProspectPage = status === 'Prospect';
  const canCreate = isProspectPage 
    ? hasPermission("create_prospects") 
    : hasPermission("create_customers");
  const canImport = isProspectPage 
    ? hasPermission("import_prospects") 
    : hasPermission("create_customers"); // Customers use create_customers for import

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mt-3 m-2">
      <div className={`flex ${isMobile ? 'flex-col gap-4 ' : 'flex-col sm:flex-row sm:items-start sm:justify-between gap-6'}`}>
        <div className="space-y-2 ">
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl sm:text-4xl'} font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent`}>
            {title}
          </h1>
          <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-lg'}`}>{description}</p>
        </div>
        {showAddButton && (
          <div className={`${isMobile ? 'flex flex-col gap-2' : 'shrink-0 flex gap-3'}`}>
            {onUploadCustomers && canImport && (
              <UploadCustomersDialog onUploadCustomers={onUploadCustomers} status={status} />
            )}
            {canCreate && (
              <Button 
                onClick={() => {
                  // Handle both usage patterns
                  if (onAddCustomer) {
                    onAddCustomer();
                  } else if (onAddDialogToggle) {
                    onAddDialogToggle();
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                {buttonText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
