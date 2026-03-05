import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, User, Plus, Loader2, UserPlus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import globalSearchService from "@/services/globalSearchService";

interface SelectCustomerForDependentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when an existing customer is selected to be added as a dependent */
  onCustomerSelected: (customer: CustomerOption) => void;
  /** Called when user wants to add a new dependent manually (no existing customer) */
  onAddNewDependent: () => void;
  /** Current customer ID to exclude from the list */
  excludeCustomerId?: number;
}

export interface CustomerOption {
  id: number;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export const SelectCustomerForDependentDialog = ({
  open,
  onOpenChange,
  onCustomerSelected,
  onAddNewDependent,
  excludeCustomerId,
}: SelectCustomerForDependentDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout>();

  // Load initial customers when dialog opens
  useEffect(() => {
    if (open) {
      loadInitialCustomers();
    } else {
      // Reset state when dialog closes
      setSearchTerm("");
      setCustomers([]);
      setHasSearched(false);
    }
  }, [open]);

  // Search customers when search term changes (debounced)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!searchTerm.trim()) {
      if (hasSearched) {
        loadInitialCustomers();
        setHasSearched(false);
      }
      return;
    }

    if (searchTerm.trim().length >= 2) {
      debounceRef.current = setTimeout(async () => {
        await searchCustomers(searchTerm.trim());
      }, 300);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  const loadInitialCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/customers", {
        params: {
          per_page: 50,
          sort_by: "created_at",
          sort_direction: "desc",
        },
      });

      if (response.data.data && Array.isArray(response.data.data)) {
        const customerOptions: CustomerOption[] = response.data.data
          .filter((customer: any) => customer.id !== excludeCustomerId)
          .map((customer: any) => ({
            id: customer.id,
            name: `${customer.first_name} ${customer.last_name}`.trim(),
            firstName: customer.first_name || "",
            middleName: customer.middle_name || "",
            lastName: customer.last_name || "",
            email: customer.email || "",
            phone:
              customer.cell_phone ||
              customer.home_phone ||
              customer.work_phone ||
              "",
          }));

        setCustomers(customerOptions);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error("Error loading customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const searchCustomers = async (query: string) => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await globalSearchService.getSuggestions(query, 20);

      const customerSuggestions = response.data.filter(
        (s: any) => s.type === "customer" && s.id !== excludeCustomerId
      );

      const customerOptions: CustomerOption[] = customerSuggestions.map(
        (suggestion: any) => ({
          id: suggestion.id,
          name: suggestion.text,
          email: "",
          phone: suggestion.phone || "",
        })
      );

      setCustomers(customerOptions);
    } catch (error) {
      console.error("Error searching customers:", error);
      // Fallback to API search
      try {
        const response = await api.get("/customers", {
          params: {
            search: query,
            per_page: 20,
          },
        });

        if (response.data.data && Array.isArray(response.data.data)) {
          const customerOptions: CustomerOption[] = response.data.data
            .filter((customer: any) => customer.id !== excludeCustomerId)
            .map((customer: any) => ({
              id: customer.id,
              name: `${customer.first_name} ${customer.last_name}`.trim(),
              firstName: customer.first_name || "",
              middleName: customer.middle_name || "",
              lastName: customer.last_name || "",
              email: customer.email || "",
              phone:
                customer.cell_phone ||
                customer.home_phone ||
                customer.work_phone ||
                "",
            }));
          setCustomers(customerOptions);
        } else {
          setCustomers([]);
        }
      } catch (fallbackError) {
        console.error("Fallback search also failed:", fallbackError);
        setCustomers([]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleCustomerSelect = (customer: CustomerOption) => {
    onCustomerSelected(customer);
    onOpenChange(false);
  };

  const handleAddNewDependent = () => {
    onAddNewDependent();
    onOpenChange(false);
  };

  const noResults = !loading && customers.length === 0 && (searchTerm.trim().length >= 2 || hasSearched);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add Dependent
          </DialogTitle>
          <DialogDescription>
            Choose from an existing customer or create a new dependent.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 h-[calc(90vh-200px)] overflow-y-auto pl-2 pr-2">
          <div className="space-y-4">
            {/* Add New Dependent Button - at the top */}
            <div className="border-b pb-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAddNewDependent}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Dependent
              </Button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Create a new dependent that is not an existing customer
              </p>
            </div>

            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="dependent-search">Search Customers</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="dependent-search"
                  placeholder="Search by name, phone, SSN, or zip code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                  autoComplete="off"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                )}
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
                ) : customers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm
                      ? `No customers found matching "${searchTerm}". Try a different search term.`
                      : "No customers available."}
                  </div>
                ) : (
                  <div className="divide-y">
                    {customers.map((customer) => (
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
                Select an existing customer from the list above to link them as a
                dependent. You can search by name, phone, SSN, or zip code.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
