import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, User, Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { ScheduleMeetingDialog } from "./ScheduleMeetingDialog";
import { api } from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ScheduleMeetingWithCustomerDialogProps {
  trigger?: React.ReactNode;
  onScheduled?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultDate?: Date;
}

interface CustomerOption {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

export const ScheduleMeetingWithCustomerDialog = ({
  trigger,
  onScheduled,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  defaultDate,
}: ScheduleMeetingWithCustomerDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerOption[]>(
    [],
  );
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [schedulingDialogOpen, setSchedulingDialogOpen] = useState(false);

  // Use external open state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  // Load customers when dialog opens
  useEffect(() => {
    if (open) {
      loadCustomers();
    }
  }, [open]);

  // Filter customers based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchLower) ||
          customer.email?.toLowerCase().includes(searchLower) ||
          customer.phone?.includes(searchTerm) ||
          customer.id.toString().includes(searchTerm),
      );
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    setLoading(true);
    try {

      // Use axios API directly to get raw response
      const response = await api.get("/customers", {
        params: {
          per_page: 200,
        },
      });

      if (response.data.data && Array.isArray(response.data.data)) {
        const customerOptions: CustomerOption[] = response.data.data.map(
          (customer: any) => ({
            id: customer.id,
            name: `${customer.first_name} ${customer.last_name}`.trim(),
            email: customer.email || "",
            phone:
              customer.cell_phone ||
              customer.home_phone ||
              customer.work_phone ||
              "",
          }),
        );

        // Sort customers alphabetically by name
        customerOptions.sort((a, b) => a.name.localeCompare(b.name));

        setCustomers(customerOptions);
        setFilteredCustomers(customerOptions);
      } else {
        
        setCustomers([]);
        setFilteredCustomers([]);
      }
    } catch (error) {
      console.error("Error loading customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      });
      setCustomers([]);
      setFilteredCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer: CustomerOption) => {
    setSelectedCustomer(customer);
    setOpen(false);
    setSchedulingDialogOpen(true);
  };

  const handleSchedulingComplete = () => {
    setSchedulingDialogOpen(false);
    setSelectedCustomer(null);
    setSearchTerm("");
    setOpen(false); // Close the customer selection dialog too
    onScheduled?.();
  };

  const handleSchedulingCancel = () => {
    setSchedulingDialogOpen(false);
    setSelectedCustomer(null);
    setOpen(true); // Reopen customer selection dialog
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Customer for Appointment
            </DialogTitle>
            <DialogDescription>
              Choose an existing customer to schedule an appointment with, or
              search for a specific customer.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 h-[calc(90vh-200px)] overflow-y-auto pl-2 pr-2">
            <div className="space-y-4">{/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="search">Search Customers</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, email, phone, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Customer List */}
            <div className="space-y-2">
              <Label>Select Customer</Label>
              <div className="border rounded-md max-h-60 overflow-y-auto">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-3 w-[150px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm
                      ? `No customers found matching "${searchTerm}". Try a different search term.`
                      : "No customers available. Please contact support if this issue persists."}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleCustomerSelect(customer)}
                        className="w-full p-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {customer.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {customer.email && customer.phone
                                ? `${customer.email} • ${customer.phone}`
                                : customer.email ||
                                  customer.phone ||
                                  `ID: ${customer.id}`}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <Plus className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Help Text */}
            <Alert>
              <AlertDescription>
                Select a customer from the list above to schedule an
                appointment. You can search by name, email, or phone number to
                find the right customer quickly.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Meeting Dialog */}
      {selectedCustomer && (
        <ScheduleMeetingDialog
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.name}
          trigger={<div />} // Hidden trigger
          open={schedulingDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              handleSchedulingCancel();
            }
          }}
          onScheduled={handleSchedulingComplete}
          defaultDate={defaultDate}
        />
      )}
    </>
  );
};
