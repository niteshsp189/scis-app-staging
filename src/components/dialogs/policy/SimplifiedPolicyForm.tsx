import { useState, useEffect, useCallback, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CustomerData } from "@/types/customer";
import { Policy } from "@/types/policy";
import { toast } from "@/components/ui/use-toast";
import policyCreationService, {
  InsuranceCompany,
} from "@/services/policyCreationService";
import planConflictService, {
  ConflictDetail,
} from "@/services/planConflictService";
import LookupService, { PaymentMode } from "@/services/lookupService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DateInput } from "@/components/ui/date-input";
import { useDebounce } from "@/hooks/useDebounce";
import {
  validateField,
  validatePolicyForm,
  getFirstErrorMessage,
  hasValidationErrors,
  PolicyFormData,
  PlanType as PlanTypeValidation
} from "@/schemas/policyValidationSchema";
import { customerCredentialsService } from "@/services/customerCredentialsService";

interface PlanType {
  id: number;
  name: string;
  slug: string;
  conflicting_plan_types: number[] | null;
  extra_fields: Record<
    string,
    { label: string; included: boolean; required: boolean }
  >;
  is_active: boolean;
}

interface Customer {
  id: number;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  customer_number?: string;
  status?: string;
}

interface Company {
  id: number;
  name: string;
}

interface Plan {
  id: number;
  name: string;
  company_id: number;
  plan_type_id: number;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  is_active: boolean;
}

interface FormData {
  customer_id: string;
  customer_name: string;
  company_id: string;
  plan_id: string;
  policy_number: string;
  agent_of_record: string;
  writing_agent: string;
  effective_date: string;
  status?: string;
  extra_fields: Record<string, unknown>;
}

interface PolicyFormProps {
  planType: PlanType;
  customer?: CustomerData;
  onAddPolicy: (data: unknown) => void;
  onCancel: () => void;
  currentStep?: "form" | "preview";
  onProceedToPreview?: () => void;
  onBackToForm?: () => void;
  initialData?: Partial<FormData>;
  isEditMode?: boolean;
}

// Filter customers to only include 'client' status (exclude 'former' and 'deceased')
const filterActiveCustomers = (customers: Customer[]): Customer[] => {
  return customers.filter(customer => 
    customer && 
    customer.status && 
    customer.status.toLowerCase() === 'client'
  );
};

const CustomerSearchDropdown = ({
  customers,
  onSelect,
  selectedCustomerId,
}: {
  customers: Customer[];
  onSelect: (customer: Customer) => void;
  selectedCustomerId?: string;
}) => {
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchValue = useDebounce(searchValue, 500);
  const [displayedCustomers, setDisplayedCustomers] = useState<Customer[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Don't show any customers initially - only show when user types
    if (!searchValue.trim()) {
      setDisplayedCustomers([]);
      setPage(1);
      setHasMore(true);
    }
  }, [customers]);

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchValue.trim()) {
        // Clear results when search is empty
        setDisplayedCustomers([]);
        setPage(1);
        setHasMore(true);
        return;
      }
      setLoadingSearch(true);
      setPage(1);
      try {
        const results =
          await policyCreationService.searchCustomers(debouncedSearchValue);
        const validResults = results.filter(
          (customer) =>
            (customer.first_name && customer.last_name) || customer.name &&
            customer.status &&
            customer.status.toLowerCase() === 'client' // Only include clients
        );
        setDisplayedCustomers(validResults);
        // Show "Load More" if we have any results (let user try to load more)
        setHasMore(validResults.length > 0);
      } catch (error) {
        setDisplayedCustomers([]);
        setHasMore(false);
      } finally {
        setLoadingSearch(false);
      }
    };
    performSearch();
  }, [debouncedSearchValue]);

  const loadMoreResults = async () => {
    if (loadingMore || !hasMore || !debouncedSearchValue.trim()) return;

    setLoadingMore(true);
    try {
      const results = await policyCreationService.searchCustomers(
        debouncedSearchValue,
        page + 1
      );
      const validResults = results.filter(
        (customer) =>
          (customer.first_name && customer.last_name) || customer.name &&
          customer.status &&
          customer.status.toLowerCase() === 'client'
      );
      
      if (validResults.length === 0) {
        // No more results available
        setHasMore(false);
      } else {
        setDisplayedCustomers(prev => [...prev, ...validResults]);
        setPage(prev => prev + 1);
        // Keep showing button as long as we're getting results
      }
    } catch (error) {
      console.error('Error loading more customers:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight;
    
    // Load more when scrolled 80% down
    if (scrollPercentage > 0.8 && hasMore && !loadingMore && !loadingSearch) {
      loadMoreResults();
    }
  };

  if (!Array.isArray(customers)) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        Loading customers...
      </div>
    );
  }

  return (
    <div className="w-full border rounded-md bg-white shadow-lg">
      <div className="p-3 border-b bg-gray-50">
        <input
          type="text"
          placeholder="Search customers by name, email, or phone..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          autoFocus
        />
      </div>

      <div 
        ref={scrollContainerRef}
        className="max-h-64 overflow-y-auto" 
        onWheel={(e) => e.stopPropagation()}
        onScroll={handleScroll}
      >
        {loadingSearch ? (
          <div className="p-6 text-center text-sm text-gray-500">
            Searching...
          </div>
        ) : displayedCustomers.length > 0 ? (
          displayedCustomers.map((customer) => {
            const displayName =
              customer.name ||
              `${customer.first_name || ""} ${customer.last_name || ""}`.trim() ||
              "Unnamed Customer";
            const displayEmail = customer.email || "";
            const displayPhone = customer.phone || "";
            const customerStatus = customer.status || "Unknown";
            
            // Get badge color based on status
            const getBadgeColor = (status: string) => {
              switch (status.toLowerCase()) {
                case 'client':
                  return 'bg-green-100 text-green-800 border-green-200';
                case 'prospect':
                  return 'bg-blue-100 text-blue-800 border-blue-200';
                case 'former':
                  return 'bg-gray-100 text-gray-800 border-gray-200';
                case 'deceased':
                  return 'bg-red-100 text-red-800 border-red-200';
                default:
                  return 'bg-gray-100 text-gray-800 border-gray-200';
              }
            };

            return (
              <div
                key={customer.id}
                onClick={() => onSelect(customer)}
                className={cn(
                  "p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors",
                  selectedCustomerId === customer.id.toString()
                    ? "bg-blue-100"
                    : "",
                )}
              >
                <div className="flex items-center">
                  <Check
                    className={cn(
                      "mr-3 h-4 w-4 text-blue-600",
                      selectedCustomerId === customer.id.toString()
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium text-gray-900">
                        {displayName}
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 text-xs font-medium rounded-md border",
                        getBadgeColor(customerStatus)
                      )}>
                        {customerStatus}
                      </span>
                    </div>
                    {displayEmail && (
                      <div className="text-sm text-gray-600">
                        {displayEmail}
                      </div>
                    )}
                    {displayPhone && (
                      <div className="text-sm text-gray-500">
                        {displayPhone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-center text-sm text-gray-500">
            {searchValue ? (
              <div>
                <div className="mb-2">
                  No customers found matching "{searchValue}"
                </div>
                <div className="text-xs">
                  Try searching by name, email, or phone
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-2 text-gray-600 font-medium">
                  Start typing to search for customers
                </div>
                <div className="text-xs text-gray-500">
                  Search by name, email, or phone number
                </div>
              </div>
            )}
          </div>
        )}
        
        {loadingMore && (
          <div className="p-4 text-center text-sm text-gray-500 border-t">
            <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
            Loading more...
          </div>
        )}
      </div>

      {displayedCustomers.length > 0 && (
        <div className="px-3 py-2 bg-gray-50 border-t">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {displayedCustomers.length} customer
              {displayedCustomers.length !== 1 ? "s" : ""}
              {searchValue && " matching your search"}
            </span>
            {hasMore && !loadingMore && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={loadMoreResults}
                className="h-7 text-xs"
              >
                Load More
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const SimplifiedPolicyForm = ({
  planType,
  customer,
  onAddPolicy,
  onCancel,
  currentStep = "form",
  onProceedToPreview,
  onBackToForm,
  initialData,
  isEditMode = false,
}: PolicyFormProps) => {
  // Form data state - only the 6 core fields + extra fields
  const [formData, setFormData] = useState<FormData>({
    customer_id:
      initialData?.customer_id || (customer?.id ? customer.id.toString() : ""),
    customer_name: initialData?.customer_name || customer?.name || "",
    company_id: initialData?.company_id || "",
    plan_id: initialData?.plan_id || "",
    policy_number: initialData?.policy_number || (isEditMode ? "" : ""),
    agent_of_record: initialData?.agent_of_record || "",
    writing_agent: initialData?.writing_agent || "",
    effective_date: "", // Hidden field - not used for policy creation
    extra_fields: initialData?.extra_fields || {},
    status: initialData?.status || "Active",
  });
  
  // Form data state tracking
  useEffect(() => {
    // Monitor form data changes for debugging
  }, [formData]);

  // API data states
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]); // Team members for agents
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);

  // Loading states
  const [loading, setLoading] = useState({
    companies: false,
    plans: false,
    customers: false,
    users: false,
    paymentModes: false,
    submit: false,
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [policyNumberError, setPolicyNumberError] = useState<string>(""); // Keep for backward compatibility

  // Plan conflict validation
  const [conflictValidation, setConflictValidation] = useState<{
    isChecking: boolean;
    hasConflicts: boolean;
    conflicts: ConflictDetail[];
    blockingConflicts: ConflictDetail[];
    checked: boolean;
  }>({
    isChecking: false,
    hasConflicts: false,
    conflicts: [],
    blockingConflicts: [],
    checked: false,
  });

  // Generate unique policy number
  const generatePolicyNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const time = String(now.getTime()).slice(-6); // Last 6 digits of timestamp for uniqueness

    const policyNumber = `POL-${year}-${month}${day}${time}`;

    handleInputChange("policy_number", policyNumber);

    toast({
      title: "Policy Number Generated",
      description: `Generated policy number: ${policyNumber}`,
    });
  };

  // Validate policy number
  const validatePolicyNumber = (value: string) => {
    if (!value.trim()) {
      setPolicyNumberError("Policy number is required");
      return false;
    }
    if (value.length < 3) {
      setPolicyNumberError("Policy number must be at least 3 characters long");
      return false;
    }
    if (value.length > 50) {
      setPolicyNumberError("Policy number must be less than 50 characters");
      return false;
    }
    // Basic format check - alphanumeric with dashes
    if (/[<>'"&]/.test(value)) {
      setPolicyNumberError("Policy number contains invalid characters");
      return false;
    }
    setPolicyNumberError("");
    return true;
  };

  // Load initial data
  useEffect(() => {
    loadCompaniesForPlanType();
    loadUsers();
    loadPaymentModes();
    if (!customer) {
      loadCustomers();
    }
  }, [planType]);

  // Initialize form data when initialData changes (for edit mode) or on mount (for create mode)
  useEffect(() => {
    // Initialize form data from initialData prop (for edit mode) or localStorage (for create mode)
    if (isEditMode && initialData) {
      const newFormData = {
        customer_id:
          initialData.customer_id ||
          (customer?.id ? customer.id.toString() : ""),
        customer_name: initialData.customer_name || customer?.name || "",
        company_id: initialData.company_id || "",
        plan_id: initialData.plan_id || "",
        policy_number: initialData.policy_number || "",
        agent_of_record: initialData.agent_of_record || "",
        writing_agent: initialData.writing_agent || "",
        effective_date: "", // Hidden field - not used for policy creation
        extra_fields: initialData.extra_fields || {},
        status: "Active", // Always set to Active in edit mode, regardless of original status
      };
      
      setFormData(newFormData);
    } else if (!isEditMode) {
      // Initialize form data from localStorage on component mount (for create mode only)
      try {
        const savedData = localStorage.getItem("simplifiedPolicyFormData");
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setFormData((prev) => ({ ...prev, ...parsedData }));
        }
      } catch (error) {
        console.warn("Failed to load saved policy form data:", error);
      }
    }
  }, [isEditMode, initialData]); // Only run when initialData actually changes

  // Load plans when company changes
  useEffect(() => {
    if (formData.company_id) {
      loadPlansForCompany();
    } else {
      setPlans([]);
      setFormData((prev) => ({ ...prev, plan_id: "" }));
    }
  }, [formData.company_id, planType]);

  // Save form data to localStorage whenever it changes (only in create mode)
  useEffect(() => {
    if (!isEditMode) {
      try {
        localStorage.setItem(
          "simplifiedPolicyFormData",
          JSON.stringify(formData),
        );
      } catch (error) {
        console.warn("Failed to save policy form data:", error);
      }
    }
  }, [formData, isEditMode]);

  // Check for plan conflicts when both customer and plan are selected
  useEffect(() => {
    if (formData.customer_id && formData.plan_id) {
      checkPlanConflicts();
    } else {
      // Reset conflict validation if either customer or plan is not selected
      setConflictValidation({
        isChecking: false,
        hasConflicts: false,
        conflicts: [],
        blockingConflicts: [],
        checked: false,
      });
    }
  }, [formData.customer_id, formData.plan_id]);

  // Mapping of customer credential fields to plan extra field keys
  const CREDENTIAL_TO_EXTRA_FIELD_MAP: Record<string, string> = {
    medicare_number: 'medicare_number',
  };

  /**
   * Fetch customer credentials and auto-populate matching extra fields.
   * Only populates fields that are included in the current plan type
   * and that are currently empty (doesn't overwrite user input).
   */
  const fetchAndApplyCredentials = useCallback(async (customerId: number) => {
    try {
      const credentials = await customerCredentialsService.getCustomerCredentials(customerId);
      if (!credentials) return;

      const includedFields = planType.extra_fields || {};
      const updatedExtraFields: Record<string, unknown> = {};
      let hasUpdates = false;

      for (const [credKey, extraFieldKey] of Object.entries(CREDENTIAL_TO_EXTRA_FIELD_MAP)) {
        const credValue = credentials[credKey as keyof typeof credentials];
        const fieldConfig = includedFields[extraFieldKey];

        // Only populate if: field is included in plan type, credential has a value, and field is currently empty
        if (fieldConfig?.included && credValue && typeof credValue === 'string' && credValue.trim() !== '') {
          updatedExtraFields[extraFieldKey] = credValue;
          hasUpdates = true;
        }
      }

      if (hasUpdates) {
        setFormData(prev => {
          const newExtraFields = { ...prev.extra_fields };
          for (const [key, value] of Object.entries(updatedExtraFields)) {
            // Only set if the field is currently empty
            if (!newExtraFields[key] || String(newExtraFields[key]).trim() === '') {
              newExtraFields[key] = value;
            }
          }
          return { ...prev, extra_fields: newExtraFields };
        });

        toast({
          title: "Credentials Auto-filled",
          description: "Medicare information from customer credentials has been applied.",
        });
      }
    } catch (error) {
      // Silently fail - credentials are optional
      console.warn('Failed to fetch customer credentials for auto-fill:', error);
    }
  }, [planType.extra_fields]);

  // Auto-populate credentials when customer is passed as prop (e.g., from customer detail page)
  useEffect(() => {
    if (customer?.id && !isEditMode) {
      // Check if plan type has any credential-mappable fields
      const includedFields = planType.extra_fields || {};
      const hasMappableFields = Object.values(CREDENTIAL_TO_EXTRA_FIELD_MAP).some(
        fieldKey => includedFields[fieldKey]?.included
      );
      if (hasMappableFields) {
        fetchAndApplyCredentials(customer.id);
      }
    }
  }, [customer?.id, planType.extra_fields, isEditMode, fetchAndApplyCredentials]);

  const loadCompaniesForPlanType = async () => {
    setLoading((prev) => ({ ...prev, companies: true }));
    try {
      // Get all companies that have plans with this plan type
      const response: InsuranceCompany[] =
        await policyCreationService.getCompaniesByPlanType(planType.id);
      setCompanies(response || []);
    } catch (error) {
      console.error("Failed to load companies:", error);
      toast({
        title: "Error",
        description: "Failed to load insurance companies",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, companies: false }));
    }
  };

  const loadPlansForCompany = async () => {
    setLoading((prev) => ({ ...prev, plans: true }));
    try {
      // Get plans for the selected company that match the plan type
      const response = await policyCreationService.getPlansByCompanyAndType(
        parseInt(formData.company_id),
        planType.id,
      );
      setPlans(response || []);
    } catch (error) {
      console.error("Failed to load plans:", error);
      toast({
        title: "Error",
        description: "Failed to load insurance plans",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, plans: false }));
    }
  };

  const loadCustomers = async () => {
    setLoading((prev) => ({ ...prev, customers: true }));
    try {
      const response = await policyCreationService.getCustomers();
      const customersArray = Array.isArray(response) ? response : [];
      // Filter to only include customers with 'client' status
      const activeCustomers = filterActiveCustomers(customersArray);
      setCustomers(activeCustomers);
    } catch (error) {
      console.error("Failed to load customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, customers: false }));
    }
  };

  const loadUsers = async () => {
    setLoading((prev) => ({ ...prev, users: true }));
    try {
      const response = await policyCreationService.getUsers();
      const usersArray = Array.isArray(response) ? response : [];
      // Filter active users only
      setUsers(usersArray.filter((user: User) => user.is_active));
    } catch (error) {
      console.error("Failed to load users:", error);
      toast({
        title: "Error",
        description: "Failed to load team members",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, users: false }));
    }
  };

  const loadPaymentModes = async () => {
    setLoading((prev) => ({ ...prev, paymentModes: true }));
    try {
      const modes = await LookupService.getPaymentModes({ activeOnly: true });
      setPaymentModes(modes);
    } catch (error) {
      console.error("Failed to load payment modes:", error);
      toast({
        title: "Error",
        description: "Failed to load payment modes",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, paymentModes: false }));
    }
  };

  const checkPlanConflicts = async () => {
    if (!formData.customer_id || !formData.plan_id) {
      return;
    }

    setConflictValidation((prev) => ({
      ...prev,
      isChecking: true,
      checked: false,
    }));

    try {
      // Find the selected plan to get its plan_type_id
      const selectedPlan = plans.find(
        (plan) => plan.id.toString() === formData.plan_id,
      );
      if (!selectedPlan) {
        setConflictValidation((prev) => ({
          ...prev,
          isChecking: false,
          checked: true,
        }));
        return;
      }

      const planTypeId = selectedPlan.plan_type_id;

      const result =
        await planConflictService.checkCustomerPolicyConflictsWithPlanType(
          parseInt(formData.customer_id),
          planTypeId,
        );

      setConflictValidation({
        isChecking: false,
        hasConflicts: result.has_conflicts,
        conflicts: result.conflicts,
        blockingConflicts: result.blocking_conflicts,
        checked: true,
      });

      if (result.blocking_conflicts.length > 0) {
        toast({
          title: "Policy Conflicts Detected",
          description: `Found ${result.blocking_conflicts.length} blocking conflict(s) that prevent policy creation.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Plan conflict check failed:", error);
      setConflictValidation((prev) => ({
        ...prev,
        isChecking: false,
        checked: true,
      }));

      // Show user-friendly error message
      toast({
        title: "Conflict Check Failed",
        description:
          "Unable to check for plan conflicts. Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    }
  };

  // Helper function to get user-friendly field names
  const getFieldDisplayName = (fieldKey: string): string => {
    const fieldNames: Record<string, string> = {
      'customer_id': 'Customer',
      'company_id': 'Insurance Company',
      'plan_id': 'Insurance Plan',
      'policy_number': 'Policy Number',
      'agent_of_record': 'Agent of Record',
      'writing_agent': 'Writing Agent',
      'status': 'Policy Status',
    };
    
    // Handle extra fields
    if (fieldKey.startsWith('extra_fields.')) {
      const extraFieldKey = fieldKey.replace('extra_fields.', '');
      const extraField = planType.extra_fields?.[extraFieldKey];
      return extraField?.label || extraFieldKey;
    }
    
    return fieldNames[fieldKey] || fieldKey;
  };
  
  // Helper function to scroll to a field with error
  const scrollToField = (fieldKey: string): void => {
    // Map field keys to actual element IDs
    let elementId = fieldKey;
    
    // Handle extra fields
    if (fieldKey.startsWith('extra_fields.')) {
      elementId = fieldKey.replace('extra_fields.', '');
    }
    
    // Special cases for field IDs
    const fieldIdMap: Record<string, string> = {
      'customer_id': 'customer',
      'company_id': 'company',
      'plan_id': 'plan',
    };
    
    const actualElementId = fieldIdMap[elementId] || elementId;
    
    // Try to find and scroll to the element
    setTimeout(() => {
      const element = document.getElementById(actualElementId) || 
                    document.querySelector(`[name="${actualElementId}"]`) ||
                    document.querySelector(`label[for="${actualElementId}"]`);
      
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Focus the element if it's focusable
        if (element instanceof HTMLElement && 
            (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA')) {
          element.focus();
        }
      }
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If we're on the form step, validate and proceed to preview
    if (currentStep === "form") {
      // Validate the entire form using our validation schema
      const formErrors = validatePolicyForm(formData as PolicyFormData, planType as PlanTypeValidation);
      setValidationErrors(formErrors);
      
      if (hasValidationErrors(formErrors)) {
        // Get the first error and scroll to that field
        const firstErrorField = Object.keys(formErrors)[0];
        const firstErrorMessage = formErrors[firstErrorField];
        
        // Create a more helpful error message
        const fieldName = getFieldDisplayName(firstErrorField);
        const helpfulMessage = `${fieldName}: ${firstErrorMessage}`;
        
        toast({
          title: "Validation Error",
          description: helpfulMessage,
          variant: "destructive",
        });
        
        // Scroll to the first error field
        scrollToField(firstErrorField);
        return;
      }

      // Check for blocking conflicts (only for create mode)
      if (!isEditMode && conflictValidation.blockingConflicts.length > 0) {
        toast({
          title: "Policy Conflicts Detected",
          description:
            "Cannot proceed due to conflicting plan types. Please resolve conflicts first.",
          variant: "destructive",
        });
        return;
      }

      // Proceed to preview
      if (onProceedToPreview) {
        onProceedToPreview();
      }
      return;
    }

    // If we're on the preview step, proceed with actual submission
    setLoading((prev) => ({ ...prev, submit: true }));

    try {
      if (isEditMode) {
        // For editing, call the update function passed via onAddPolicy
        // Handle start_date more robustly for edit mode
        const editFormData = {
          ...formData,
          start_date: (() => {
            // Try multiple sources for effective date in edit mode:
            // 1. formData.extra_fields.effective_date (user modified)
            // 2. formData.field_values?.effective_date (current request data)
            // 3. initialData.extra_fields?.effective_date (from backend)
            // 4. initialData.field_values?.effective_date (backend field_values)
            // 5. formData.effective_date (legacy field)
            // 6. initialData.start_date (if already valid)
            // 7. Today's date (fallback)
            
            const sources = [
              formData.extra_fields?.effective_date,
              (formData as any)?.field_values?.effective_date, // Current request might have field_values
              initialData?.extra_fields?.effective_date,
              (initialData as any)?.field_values?.effective_date, // Backend might send field_values
              formData.effective_date,
              initialData?.start_date,
            ];
            
            for (const source of sources) {
              if (source && typeof source === 'string' && source.trim() !== '') {
                // Handle both date formats: "2025-10-16" and "2025-10-16T00:00:00.000000Z"
                const cleanDate = source.includes('T') ? source.split('T')[0] : source;
                return cleanDate;
              }
            }
            
            const fallbackDate = new Date().toISOString().split('T')[0];
            return fallbackDate;
          })(),
        };
        
        // Additional safety check: if start_date is still empty, force it to today's date
        if (!editFormData.start_date || editFormData.start_date.trim() === '') {
          editFormData.start_date = new Date().toISOString().split('T')[0];
        }
        await onAddPolicy(editFormData);
      } else {
        // For creating, use the create service
        const policyData = {
          customer_id: customer ? customer.id : parseInt(formData.customer_id),
          plan_id: parseInt(formData.plan_id),
          policy_number: formData.policy_number || undefined,
          agent_of_record: formData.agent_of_record,
          writing_agent: formData.writing_agent,
          premium_frequency: "monthly", // Default for simplified flow
          status: "Active",
          // Handle start_date more robustly:
          // 1. Check if plan type has effective_date field
          // 2. Use the value if it exists and is not empty
          // 3. Fall back to today's date for all other cases
          start_date: (() => {
            const effectiveDate = formData.extra_fields?.effective_date;
            
            // If plan type doesn't include effective_date field, use today's date
            if (!hasEffectiveDateField) {
              console.info('Plan type does not include effective_date field, using today\'s date');
              return new Date().toISOString().split('T')[0];
            }
            
            // If plan type has effective_date field but it's empty/null, use today's date
            if (!effectiveDate || typeof effectiveDate !== 'string' || effectiveDate.trim() === '') {
              console.info('Plan type has effective_date field but no value provided, using today\'s date');
              return new Date().toISOString().split('T')[0];
            }
            
            // Use the provided effective date
            console.info('Using effective_date from plan type:', effectiveDate);
            return effectiveDate;
          })(),
          extra_fields: formData.extra_fields,
        };

        const response = await policyCreationService.createPolicy(policyData);

        if (response.success) {
          // Clear localStorage after successful submission
          try {
            localStorage.removeItem("simplifiedPolicyFormData");
          } catch (error) {
            console.warn("Failed to clear saved policy form data:", error);
          }

          onAddPolicy(response.data);
          toast({
            title: "Success",
            description: "Policy created successfully",
          });
          onCancel();
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create policy";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  const handleManualReset = () => {
    // Reset form data - in edit mode, reset to initial data; in create mode, clear all fields
    if (isEditMode && initialData) {
      setFormData({
        customer_id:
          initialData.customer_id ||
          (customer?.id ? customer.id.toString() : ""),
        customer_name: initialData.customer_name || customer?.name || "",
        company_id: initialData.company_id || "",
        plan_id: initialData.plan_id || "",
        policy_number: initialData.policy_number || "",
        agent_of_record: initialData.agent_of_record || "",
        writing_agent: initialData.writing_agent || "",
        effective_date: "", // Hidden field - not used
        extra_fields: initialData.extra_fields || {},
        status: "Active", // Always reset to Active in edit mode
      });
    } else {
      setFormData({
        customer_id: customer?.id ? customer.id.toString() : "",
        customer_name: customer?.name || "",
        company_id: "",
        plan_id: "",
        policy_number: "",
        agent_of_record: "",
        writing_agent: "",
        effective_date: "", // Hidden field - not used
        extra_fields: {},
      });
    }

    // Clear policy number error
    setPolicyNumberError("");

    // Clear all validation errors
    setValidationErrors({});

    // Clear localStorage (only for create mode)
    if (!isEditMode) {
      try {
        localStorage.removeItem("simplifiedPolicyFormData");
      } catch (error) {
        console.warn("Failed to clear saved policy form data:", error);
      }
    }

    // Reset conflict validation
    setConflictValidation({
      isChecking: false,
      hasConflicts: false,
      conflicts: [],
      blockingConflicts: [],
      checked: false,
    });

    // Reset to form step
    if (onBackToForm) {
      onBackToForm();
    }

    // Show success message
    toast({
      title: "Form Reset",
      description: isEditMode
        ? "Form has been reset to original values."
        : "All form fields have been cleared.",
    });
  };

  // Get included extra fields from plan type
  const includedExtraFields = Object.entries(
    planType.extra_fields || {},
  ).filter(([_, field]) => field.included);

  // Check if the selected plan type includes an effective_date field
  const hasEffectiveDateField = includedExtraFields.some(([fieldKey, _]) => fieldKey === 'effective_date');

  // Input change handler with validation
  const handleInputChange = (field: string, value: string | unknown) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Save to localStorage (only for create mode)
    if (!isEditMode) {
      try {
        localStorage.setItem("simplifiedPolicyFormData", JSON.stringify(newFormData));
      } catch (error) {
        console.warn("Failed to save policy form data:", error);
      }
    }

    // Validate the field using our validation schema
    // Don't validate immediately if it's a selection field that might be empty during selection
    if (field === 'customer_id' || field === 'company_id' || field === 'plan_id') {
      // For selection fields, only validate if value is not empty or if it was previously filled
      if (value || validationErrors[field]) {
        const error = validateField(field as keyof PolicyFormData, value, planType as PlanTypeValidation);
        if (error) {
          setValidationErrors({ ...validationErrors, [field]: error });
        } else {
          const newErrors = { ...validationErrors };
          delete newErrors[field];
          setValidationErrors(newErrors);
        }
      }
    } else {
      // For other fields, validate normally
      const error = validateField(field as keyof PolicyFormData, value, planType as PlanTypeValidation);
      if (error) {
        setValidationErrors({ ...validationErrors, [field]: error });
      } else {
        const newErrors = { ...validationErrors };
        delete newErrors[field];
        setValidationErrors(newErrors);
      }
    }

    // Clear policy number error if updating policy number
    if (field === 'policy_number') {
      setPolicyNumberError("");
    }
  };

  // Extra field input change handler with validation
  const handleExtraFieldChange = (field: string, value: string | unknown) => {
    const newExtraFields = { ...formData.extra_fields, [field]: value };
    const newFormData = { ...formData, extra_fields: newExtraFields };
    setFormData(newFormData);

    // Save to localStorage (only for create mode)
    if (!isEditMode) {
      try {
        localStorage.setItem("simplifiedPolicyFormData", JSON.stringify(newFormData));
      } catch (error) {
        console.warn("Failed to save policy form data:", error);
      }
    }

    // Validate the extra field using our validation schema
    const fieldKey = `extra_fields.${field}`;
    const error = validateField(field, value, planType as PlanTypeValidation);
    if (error) {
      setValidationErrors({ ...validationErrors, [fieldKey]: error });
    } else {
      const newErrors = { ...validationErrors };
      delete newErrors[fieldKey];
      setValidationErrors(newErrors);
    }
  };

  // Comprehensive form validation
  const validateForm = (): boolean => {
    const formErrors = validatePolicyForm(formData as PolicyFormData, planType as PlanTypeValidation);
    setValidationErrors(formErrors);
    return !hasValidationErrors(formErrors);
  };

  return (
    <div className="flex flex-col h-full">
      {currentStep === "form" ? (
        <form
          id="simplified-policy-form"
          onSubmit={handleSubmit}
          className="flex-1 space-y-6"
        >
          {/* Customer Selection */}
          {!customer && (
            <div>
              <Label htmlFor="customer">Customer <span className="text-red-500">*</span></Label>
              <Popover
                open={customerSearchOpen}
                onOpenChange={setCustomerSearchOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    id="customer"
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerSearchOpen}
                    className={`w-full justify-between ${
                      validationErrors.customer_id ? "border-red-500" : ""
                    }`}
                    disabled={loading.customers}
                  >
                    {formData.customer_id
                      ? formData.customer_name || "Select customer"
                      : loading.customers
                        ? "Loading customers..."
                        : "Select customer"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <CustomerSearchDropdown
                    customers={customers}
                    onSelect={(customer) => {

                      
                      const customerId = customer.id.toString();
                      const fullName =
                        customer.name ||
                        `${customer.first_name || ""} ${customer.last_name || ""}`.trim();


                      

                      
                      // Update both customer fields at once to avoid stale closure issues
                      const newFormData = { 
                        ...formData, 
                        customer_id: customerId,
                        customer_name: fullName 
                      };
                      

                      
                      setFormData(newFormData);
                      
                      // Save to localStorage (only for create mode)
                      if (!isEditMode) {
                        try {
                          localStorage.setItem("simplifiedPolicyFormData", JSON.stringify(newFormData));
                        } catch (error) {
                          console.warn("Failed to save policy form data:", error);
                        }
                      }

                      // Auto-populate Medicare fields from customer credentials
                      if (customer?.id || parseInt(customerId)) {
                        const cid = parseInt(customerId);
                        if (cid) {
                          fetchAndApplyCredentials(cid);
                        }
                      }
                      
                      // Clear validation errors for customer selection
                      const newErrors = { ...validationErrors };
                      delete newErrors.customer_id;
                      setValidationErrors(newErrors);
                      
                      setCustomerSearchOpen(false);
                      

                    }}
                    selectedCustomerId={formData.customer_id}
                  />
                </PopoverContent>
              </Popover>
              {validationErrors.customer_id && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.customer_id}</p>
              )}
            </div>
          )}

          {customer && (
            <div>
              <Label>Customer</Label>
              <Input value={customer.name} disabled />
            </div>
          )}

          {/* Core 6 Fields in Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Policy Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Company and Plan Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.company_id}
                    onValueChange={(value) => {
                      handleInputChange("company_id", value);
                      
                      // Reset plan when company changes
                      if (formData.plan_id) {
                        handleInputChange("plan_id", "");
                      }
                    }}
                  >
                    <SelectTrigger id="company" className={validationErrors.company_id ? "border-red-500" : ""}>
                      <SelectValue
                        placeholder={
                          loading.companies
                            ? "Loading companies..."
                            : "Select company"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem
                          key={company.id}
                          value={company.id.toString()}
                        >
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.company_id && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.company_id}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="plan">Plan <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.plan_id}
                    onValueChange={(value) => {
                      handleInputChange("plan_id", value);
                    }}
                    disabled={!formData.company_id || loading.plans}
                  >
                    <SelectTrigger id="plan" className={validationErrors.plan_id && formData.company_id ? "border-red-500" : ""}>
                      <SelectValue
                        placeholder={
                          !formData.company_id ? "Select company first" :
                          loading.plans ? "Loading plans..." : "Select plan"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {loading.plans ? (
                        <SelectItem value="loading" disabled>
                          Loading plans...
                        </SelectItem>
                      ) : plans.length > 0 ? (
                        plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id.toString()}>
                            {plan.name}
                          </SelectItem>
                        ))
                      ) : formData.company_id ? (
                        <SelectItem value="no-plans" disabled>
                          No plans available for this company
                        </SelectItem>
                      ) : (
                        <SelectItem value="select-company" disabled>
                          Please select a company first
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {validationErrors.plan_id && formData.company_id && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.plan_id}</p>
                  )}
                </div>
              </div>

              {/* Policy Number */}
              <div>
                {/* Plan Conflict Validation Display */}
                {conflictValidation.isChecking && (
                  <Alert className="mb-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                      Checking for plan conflicts...
                    </AlertDescription>
                  </Alert>
                )}

                {conflictValidation.checked &&
                  conflictValidation.blockingConflicts.length > 0 && (
                    <Alert variant="destructive" className="mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-medium">Policy Creation Blocked</p>
                          <p>
                            This customer already has conflicting plan types
                            that prevent creating this policy:
                          </p>
                          <ul className="list-disc list-inside">
                            {conflictValidation.blockingConflicts.map(
                              (conflict, index) => (
                                <li key={index} className="text-sm">
                                  {conflict.message}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                <Label htmlFor="policy_number">
                  Policy Number <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="policy_number"
                    value={formData.policy_number}
                    onChange={(e) => {
                      handleInputChange("policy_number", e.target.value);
                    }}
                    placeholder="Enter policy number or click generate"
                    className={`
                      ${(validationErrors.policy_number || policyNumberError) ? "border-red-500 focus:border-red-500" : ""}
                    `}
                  />
                  <button
                    type="button"
                    onClick={generatePolicyNumber}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                  >
                    Generate
                  </button>
                </div>
                {(validationErrors.policy_number || policyNumberError) && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.policy_number || policyNumberError}</p>
                )}
              </div>

              {/* Agent Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agent_of_record">Agent of Record <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.agent_of_record}
                    onValueChange={(value) => {
                      handleInputChange("agent_of_record", value);
                    }}
                  >
                    <SelectTrigger id="agent_of_record" className={validationErrors.agent_of_record ? "border-red-500" : ""}>
                      <SelectValue
                        placeholder={
                          loading.users ? "Loading agents..." : "Select agent"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.position})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.agent_of_record && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.agent_of_record}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="writing_agent">Writing Agent <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.writing_agent}
                    onValueChange={(value) => {
                      handleInputChange("writing_agent", value);
                    }}
                  >
                    <SelectTrigger id="writing_agent" className={validationErrors.writing_agent ? "border-red-500" : ""}>
                      <SelectValue
                        placeholder={
                          loading.users ? "Loading agents..." : "Select agent"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.position})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.writing_agent && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.writing_agent}</p>
                  )}
                </div>
              </div>

              {/* Effective Date */}
              {/* Effective Date - Hidden: using plan type effective_date instead */}
            </CardContent>
          </Card>

          {/* Plan Type Specific Extra Fields */}
          {includedExtraFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{planType.name} Specific Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {includedExtraFields.map(([fieldKey, field]) => {
                    const fieldErrorKey = `extra_fields.${fieldKey}`;
                    const hasError = !!validationErrors[fieldErrorKey];
                    
                    return (
                      <div key={fieldKey}>
                        <Label htmlFor={fieldKey}>
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        {fieldKey === "payment_mode" ? (
                          <Select
                            value={String(formData.extra_fields[fieldKey] || "")}
                            onValueChange={(value) => handleExtraFieldChange(fieldKey, value)}
                          >
                            <SelectTrigger className={hasError ? "border-red-500" : ""}>
                              <SelectValue placeholder="Select payment mode" />
                            </SelectTrigger>
                            <SelectContent>
                              {paymentModes.map((mode) => (
                                <SelectItem key={mode.id} value={mode.name}>
                                  {mode.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : fieldKey.includes("date") ? (
                          <DateInput
                            id={fieldKey}
                            value={String(formData.extra_fields[fieldKey] || "")}
                            onChange={(value) => handleExtraFieldChange(fieldKey, value)}
                            placeholder={`Select ${field.label.toLowerCase()}`}
                            className={hasError ? "border-red-500" : ""}
                          />
                        ) : (
                          <Input
                            id={fieldKey}
                            type={
                              fieldKey.includes("number") ||
                              fieldKey.includes("premium") ||
                              fieldKey.includes("value") ||
                              fieldKey.includes("deductible") ||
                              fieldKey.includes("credit") ||
                              fieldKey.includes("payment")
                                ? "text"
                                : "text"
                            }
                            value={String(formData.extra_fields[fieldKey] || "")}
                            onChange={(e) => handleExtraFieldChange(fieldKey, e.target.value)}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            className={hasError ? "border-red-500" : ""}
                          />
                        )}
                        {hasError && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors[fieldErrorKey]}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      ) : (
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Information</CardTitle>
              <CardDescription>
                Please review the information below before submitting.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Customer</Label>
                  <p className="text-sm text-gray-600">{formData.customer_name}</p>
                </div>
                <div>
                  <Label>Company</Label>
                  <p className="text-sm text-gray-600">
                    {companies.find((c) => c.id.toString() === formData.company_id)?.name}
                  </p>
                </div>
                <div>
                  <Label>Plan</Label>
                  <p className="text-sm text-gray-600">
                    {plans.find((p) => p.id.toString() === formData.plan_id)?.name}
                  </p>
                </div>
                <div>
                  <Label>Policy Number</Label>
                  <p className="text-sm text-gray-600">{formData.policy_number}</p>
                </div>
                <div>
                  <Label>Agent of Record</Label>
                  <p className="text-sm text-gray-600">
                    {users.find((u) => u.id === formData.agent_of_record)
                      ? `${users.find((u) => u.id === formData.agent_of_record)?.first_name} ${users.find((u) => u.id === formData.agent_of_record)?.last_name}`
                      : ""}
                  </p>
                </div>
                <div>
                  <Label>Writing Agent</Label>
                  <p className="text-sm text-gray-600">
                    {users.find((u) => u.id === formData.writing_agent)
                      ? `${users.find((u) => u.id === formData.writing_agent)?.first_name} ${users.find((u) => u.id === formData.writing_agent)?.last_name}`
                      : ""}
                  </p>
                </div>
              </div>
              
              {includedExtraFields.length > 0 && (
                <div>
                  <Label>{planType.name} Specific Information</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {includedExtraFields.map(([fieldKey, field]) => (
                      <div key={fieldKey}>
                        <Label className="text-xs text-gray-500">{field.label}</Label>
                        <p className="text-sm text-gray-600">
                          {String(formData.extra_fields[fieldKey] || "")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer Actions */}
      <div className="border-t bg-white p-6 mt-auto">
        <div className="flex justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={handleManualReset}
            disabled={loading.submit}
          >
            {isEditMode ? "Reset to Original" : "Reset Form"}
          </Button>
          <div className="flex space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            {currentStep === "preview" && onBackToForm && (
              <Button
                type="button"
                variant="outline"
                onClick={onBackToForm}
                disabled={loading.submit}
              >
                Edit Information
              </Button>
            )}
            <Button
              type={currentStep === "form" ? "submit" : "button"}
              form={
                currentStep === "form" ? "simplified-policy-form" : undefined
              }
              onClick={currentStep === "preview" ? handleSubmit : undefined}
              disabled={
                loading.submit ||
                (currentStep === "form" && hasValidationErrors(validationErrors)) ||
                (!isEditMode && conflictValidation.blockingConflicts.length > 0)
              }
            >
              {loading.submit && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {currentStep === "form"
                ? !isEditMode && conflictValidation.blockingConflicts.length > 0
                  ? "Policy Creation Blocked"
                  : "Review Information"
                : !isEditMode && conflictValidation.blockingConflicts.length > 0
                  ? "Policy Creation Blocked"
                  : isEditMode
                    ? "Update Policy"
                    : "Create Policy"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedPolicyForm;
