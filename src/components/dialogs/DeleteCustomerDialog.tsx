import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { customerService } from "@/services/customerService";
import { CustomerData } from "@/types/customer";

interface DeleteCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerData | null;
  onCustomerDeleted?: () => void;
}

export function DeleteCustomerDialog({ isOpen, onClose, customer, onCustomerDeleted }: DeleteCustomerDialogProps) {
  const isProspect = customer?.status === 'Prospect';
  const entityName = isProspect ? 'prospect' : 'customer';
  const EntityName = isProspect ? 'Prospect' : 'Customer';
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!customer) return;

    setLoading(true);
    
    try {
      await customerService.deleteCustomer(customer.id);
      
      if (onCustomerDeleted) {
        onCustomerDeleted();
      }

      onClose();
      
      toast({
        title: "Success",
        description: `${customer.firstName} ${customer.lastName} has been deleted successfully.`,
      });

    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete {EntityName}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this {entityName}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-medium">{customer.firstName} {customer.lastName}</p>
            <p className="text-sm text-gray-600">{customer.email}</p>
            <p className="text-sm text-gray-600">{customer.phone}</p>
            {customer.company && (
              <p className="text-sm text-gray-600">{customer.company}</p>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : `Delete ${EntityName}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
