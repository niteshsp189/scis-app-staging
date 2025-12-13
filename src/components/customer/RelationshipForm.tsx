import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Search, User } from "lucide-react";
import {
  customerRelationshipService,
  relationshipUtils,
  CustomerSearchResult,
  CreateRelationshipData,
} from "@/services/customerRelationshipService";
import { toast } from "@/components/ui/use-toast";

interface RelationshipFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  onSuccess: () => void;
  editingRelationship?: {
    id: number;
    related_customer: {
      id: number;
      first_name: string;
      last_name: string;
    };
    related_customer_name?: string;
    relationship_type: string;
  } | null;
}

export const RelationshipForm = ({
  isOpen,
  onOpenChange,
  customerId,
  onSuccess,
  editingRelationship,
}: RelationshipFormProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [relationshipType, setRelationshipType] = useState("");
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>(
    [],
  );
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when editing a relationship
  useEffect(() => {
    if (isOpen && editingRelationship) {
      // Set the relationship type
      setRelationshipType(editingRelationship.relationship_type);
      
      // Set the selected customer
      const relatedCustomer = {
        id: editingRelationship.related_customer.id,
        first_name: editingRelationship.related_customer.first_name,
        last_name: editingRelationship.related_customer.last_name,
        name: editingRelationship.related_customer_name || 
              `${editingRelationship.related_customer.first_name} ${editingRelationship.related_customer.last_name}`,
      };
      setSelectedCustomer(relatedCustomer);
      setSearchTerm(relatedCustomer.name);
    } else if (isOpen && !editingRelationship) {
      // Reset form for new relationship
      setSearchTerm("");
      setRelationshipType("");
      setSelectedCustomer(null);
      setSearchResults([]);
    }
  }, [isOpen, editingRelationship]);

  // Search for customers when search term changes
  useEffect(() => {
    const searchCustomers = async () => {
      // Don't search if search term is too short or if we have a selected customer and are editing
      if (searchTerm.length < 2 || (editingRelationship && selectedCustomer)) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await customerRelationshipService.searchCustomers(
          searchTerm,
          customerId,
        );
        setSearchResults(results);
      } catch (error) {
        console.error("Error searching customers:", error);
        toast({
          title: "Search Error",
          description: "Failed to search for customers. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchCustomers, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchTerm, customerId, editingRelationship, selectedCustomer]);

  const handleSubmit = async () => {
    if (!selectedCustomer || !relationshipType) {
      toast({
        title: "Validation Error",
        description: "Please select a customer and relationship type.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRelationship) {
        // Update existing relationship
        const updateData = {
          relationship_type: relationshipType,
        };

        await customerRelationshipService.updateRelationship(editingRelationship.id, updateData);

        toast({
          title: "Success",
          description: `Relationship with ${selectedCustomer.name} has been updated successfully.`,
        });
      } else {
        // Create new relationship
        const relationshipData: CreateRelationshipData = {
          customer_id: customerId,
          related_customer_id: selectedCustomer.id,
          relationship_type: relationshipType,
          status: "Active",
        };

        const validation = relationshipUtils.validateRelationshipData(relationshipData);
        if (!validation.isValid) {
          toast({
            title: "Validation Error",
            description: validation.errors.join(", "),
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        await customerRelationshipService.createRelationship(relationshipData);

        toast({
          title: "Success",
          description: `Relationship with ${selectedCustomer.name} has been created successfully.`,
        });
      }

      // Reset form
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating relationship:", error);

      let errorMessage = "Failed to create relationship. Please try again.";
      if (error.response?.status === 409) {
        errorMessage = "A relationship already exists between these customers.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSearchTerm("");
    setRelationshipType("");
    setSearchResults([]);
    setSelectedCustomer(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const handleCustomerSelect = (customer: CustomerSearchResult) => {
    setSelectedCustomer(customer);
    setSearchTerm(customer.name);
    setSearchResults([]);
  };

  const relationshipTypes = relationshipUtils.getRelationshipTypes();

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingRelationship ? "Edit People" : "Add People"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Search */}
          <div className="space-y-2">
            <Label htmlFor="customerSearch">Search Customer *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="customerSearch"
                placeholder={editingRelationship && selectedCustomer ? "Selected customer (cannot be changed)" : "Type to search customers..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={isSubmitting || (editingRelationship && selectedCustomer !== null)}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && !selectedCustomer && (
              <div className="border rounded-md bg-white shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleCustomerSelect(customer)}
                    className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {customer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {customer.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {customer.email}
                        {customer.phone && ` • ${customer.phone}`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Customer Display */}
            {selectedCustomer && (
              <div className="border rounded-md p-3 bg-blue-50 border-blue-200 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {selectedCustomer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {selectedCustomer.name}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {selectedCustomer.email}
                    {selectedCustomer.phone && ` • ${selectedCustomer.phone}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setSearchTerm("");
                    setSearchResults([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
            )}

            {/* No results message */}
            {searchTerm.length >= 2 &&
              searchResults.length === 0 &&
              !isSearching &&
              !selectedCustomer && (
                <p className="text-sm text-gray-500 p-3 text-center border rounded-md bg-gray-50">
                  No customers found matching "{searchTerm}"
                </p>
              )}
          </div>

          {/* Relationship Type */}
          <div className="space-y-2">
            <Label htmlFor="relationshipType">Relationship Type *</Label>
            <Select
              value={relationshipType}
              onValueChange={setRelationshipType}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select relationship type" />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!selectedCustomer || !relationshipType || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                {editingRelationship ? "Updating Relationship..." : "Creating Relationship..."}
              </>
            ) : (
              editingRelationship ? "Update Relationship" : "Add People"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
