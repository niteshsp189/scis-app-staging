import { useState, useEffect, useCallback } from "react";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerData } from "@/types/customer";
import { PolicyAgentManager } from "@/components/policy/PolicyAgentManager";
import { AgentAssignment } from "@/types/agent";
import policyCreationService from "@/services/policyCreationService";
import planConflictService, { ConflictDetail, ExistingPolicy } from "@/services/planConflictService";
import { taxService, Tax } from "@/services/taxService";
import policyConfigService, { PolicyConfiguration } from "@/services/policyConfigService";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Calculator, Calendar, DollarSign, Lock, Edit, AlertTriangle, Shield, CheckCircle } from "lucide-react";

interface Customer {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  customer_number?: string;
}

interface PolicyFormProps {
  customer?: CustomerData;
  onAddPolicy: (policy: PolicyData) => void;
  onCancel: () => void;
}

interface Company {
  id: number;
  name: string;
  code: string;
  commission_rate?: number;
}

interface Plan {
  id: number;
  name: string;
  code: string;
  plan_type: string;
  company_id: number;
  default_term_length?: number;
  default_term_unit?: string;
  allow_term_override?: boolean;
  common_fields?: {
    hasStartDateOverride?: boolean;
  };
  planType?: {
    id: number;
    name: string;
    grace_period_days: number;
  };
}

interface CustomField {
  id: number;
  name: string;
  field_type: string;
  is_required: boolean;
  options?: string[];
}

interface PremiumCalculation {
  premium_amount: number;
  frequency: string;
  annual_premium: number;
  installment_amount: number;
  total_installments: number;
  coverage_amount: number;
}

interface PolicyTerms {
  start_date: string;
  end_date: string;
  term_length: number;
  term_unit: string;
  grace_period_days: number;
  grace_period_end_date: string;
  total_days: number;
}

interface PolicyData {
  customer_id: number;
  plan_id: number;
  premium_frequency: string;
  start_date: string;
  premium_amount: number;
  coverage_amount: number;
  agent_assignments?: { agent_id: string; agent_type: string; commission_rate: number }[];
  custom_fields: Record<string, unknown>;
  status: string;
  policy_number?: string;
  carrier_policy_number?: string;
  policy_status?: string;
  base_premium?: number;
  taxes_and_fees?: number;
  total_premium?: number;
  down_payment?: number;
  billing_method?: string;
  override_term_length?: number;
  override_term_unit?: string;
}

// Customer search dropdown component

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
  const [displayedCustomers, setDisplayedCustomers] = useState<Customer[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  useEffect(() => {
    if (Array.isArray(customers) && customers.length > 0) {
      const validCustomers = customers.filter(
        (customer) =>
          customer &&
          typeof customer === "object" &&
          customer.id &&
          (customer.first_name || customer.last_name),
      );
      setDisplayedCustomers(validCustomers.slice(0, 10));
    } else {
      setDisplayedCustomers([]);
    }
  }, [customers]);

  // Live search using backend API
  const handleSearch = async (value: string) => {
    setSearchValue(value);
    if (!value.trim()) {
      // Show initial 10 when search is empty
      if (Array.isArray(customers)) {
        const validCustomers = customers.filter(
          (customer) =>
            customer &&
            typeof customer === "object" &&
            customer.id &&
            (customer.first_name || customer.last_name),
        );
        setDisplayedCustomers(validCustomers.slice(0, 10));
      } else {
        setDisplayedCustomers([]);
      }
      return;
    }
    setLoadingSearch(true);
    try {
      const results = await policyCreationService.searchCustomers(value);
      // Double-check for first_name and last_name fields
      const validResults = results.filter(
        (customer) => customer.first_name && customer.last_name
      );
      setDisplayedCustomers(validResults);
    } catch (error) {
      setDisplayedCustomers([]);
    } finally {
      setLoadingSearch(false);
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
      {/* Search Input */}
      <div className="p-3 border-b bg-gray-50">
        <input
          type="text"
          placeholder="Search customers by name, email, or phone..."
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          autoFocus
        />
      </div>

      {/* Customer List */}
      <div className="max-h-64 overflow-y-auto">
        {loadingSearch ? (
          <div className="p-6 text-center text-sm text-gray-500">Searching...</div>
        ) : displayedCustomers.length > 0 ? (
          displayedCustomers.map((customer) => {
            const displayName =
              `${customer.first_name || ""} ${customer.last_name || ""}`.trim() ||
              "Unnamed Customer";
            const displayEmail = customer.email || "";
            const displayPhone = customer.phone || "";

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
                    <div className="font-medium text-gray-900">
                      {displayName} {displayEmail && `(${displayEmail})`}
                    </div>
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
              "No customers available"
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {displayedCustomers.length > 0 && (
        <div className="px-3 py-2 bg-gray-50 border-t text-xs text-gray-500">
          Showing {displayedCustomers.length} customer
          {displayedCustomers.length !== 1 ? "s" : ""}
          {searchValue && " matching your search"}
        </div>
      )}
    </div>
  );
};

export const EnhancedPolicyForm = ({
  customer,
  onAddPolicy,
  onCancel,
}: PolicyFormProps) => {

  // State for form data
  const [formData, setFormData] = useState<{
  customer_id: string;
  dependent_id?: string;
  customer_name: string;
  coverage_amount: string;
  start_date: string;
  premium_amount?: string;
  premium_frequency?: string;
  plan_id?: string;
  company_id?: string;
  custom_fields: Record<string, unknown>;
  // Policy Management Fields
  policy_number?: string;
  carrier_policy_number?: string;
  policy_status?: string;
  base_premium?: string;
  taxes_and_fees?: string;
  total_premium?: string;
  down_payment?: string;
  billing_method?: string;
  }>({
    customer_id: customer?.id ? customer.id.toString() : "",
    customer_name: customer?.name || "",
    coverage_amount: "",
    start_date: "",
    custom_fields: {},
    // Policy Management Fields defaults
    policy_status: "Pending",
    billing_method: "Agency Bill - Invoice / Check",
  });

  // State for API data
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [commonFields, setCommonFields] = useState<Record<string, boolean>>({});
  const [policyConfig, setPolicyConfig] = useState<PolicyConfiguration | null>(null);

  // Customer search state
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);

  // State for calculations
  const [premiumCalculation, setPremiumCalculation] =
    useState<PremiumCalculation | null>(null);
  const [policyTerms, setPolicyTerms] = useState<PolicyTerms | null>(null);

  // State for premium override functionality
  const [premiumOverrideEnabled, setPremiumOverrideEnabled] = useState(false);
  const [overrideAnnualPremium, setOverrideAnnualPremium] = useState("");
  const [overrideInstallmentFee, setOverrideInstallmentFee] = useState("");

  // State for term length override functionality
  const [termLengthOverrideEnabled, setTermLengthOverrideEnabled] = useState(false);
  const [overrideTermLength, setOverrideTermLength] = useState("");
  const [overrideTermUnit, setOverrideTermUnit] = useState<"months" | "years">("months");

  // State for tax options
  const [availableTaxes, setAvailableTaxes] = useState<Tax[]>([]);
  const [selectedTaxId, setSelectedTaxId] = useState<number | null>(null);

  // Derived state
  const selectedPlan = plans.find(
    (p) => p.id === parseInt(formData.plan_id || "0"),
  );
  const selectedCompany = companies.find(
    (c) => c.id === selectedPlan?.company_id,
  );
  const isMedicarePlan = selectedPlan?.plan_type?.name?.includes("Medicare");

  // Loading states
  const [loading, setLoading] = useState<{
    companies: boolean;
    plans: boolean;
    customers: boolean;
    customFields: boolean;
    premium: boolean;
    terms: boolean;
    submit: boolean;
  }>({
    companies: false,
    plans: false,
    customers: false,
    customFields: false,
    premium: false,
    terms: false,
    submit: false,
  });

  // Agent assignment
  const [agentAssignment, setAgentAssignment] = useState<AgentAssignment>({
    aor: undefined,
    writingAgent: undefined,
  });

  // Plan conflict validation
  const [conflictValidation, setConflictValidation] = useState<{
    isChecking: boolean;
    hasConflicts: boolean;
    conflicts: ConflictDetail[];
    existingPolicies: ExistingPolicy[];
    blockingConflicts: ConflictDetail[];
    warningConflicts: ConflictDetail[];
    checked: boolean;
  }>({
    isChecking: false,
    hasConflicts: false,
    conflicts: [],
    existingPolicies: [],
    blockingConflicts: [],
    warningConflicts: [],
    checked: false,
  });

  // Define callback functions before useEffect hooks that reference them
  const loadCustomFields = useCallback(async (planId: number) => {
    
    try {
      const response = await policyCreationService.getPlanFields(planId);

      const fieldsArray = Array.isArray(response?.fields)
        ? response.fields
        : [];
      const commonFieldsArray = Array.isArray(response?.common_fields)
        ? response.common_fields
        : [];

      if (fieldsArray.length > 0) {

      }

      // Ensure each field has proper structure
      const validFields = fieldsArray.map((field) => {
        
        return {
          ...field,
          options:
            field.options && Array.isArray(field.options) ? field.options : [],
        };
      });

      setCustomFields(validFields);

      // Store common fields for use in form - convert array to object for easier access
      
      const commonFieldsObject = {};
      if (Array.isArray(commonFieldsArray)) {
        commonFieldsArray.forEach((field) => {
          commonFieldsObject[field.field_name] = true;
        });
      }
      
      setCommonFields(commonFieldsObject);
    } catch (error) {
      console.error("Failed to load plan fields:", error);
      setCustomFields([]);
    }
  }, []);

  const calculatePremium = useCallback(async () => {
    if (!formData.plan_id || !formData.premium_frequency) return;

    setLoading((prev) => ({ ...prev, premium: true }));

    try {
      // If premium override is enabled, use override values for calculation
      const calculationData = {
        plan_id: parseInt(formData.plan_id),
        coverage_amount: parseFloat(formData.coverage_amount) || 0,
        premium_frequency: formData.premium_frequency,
        custom_fields: formData.custom_fields,
        // Include tax ID if selected
        ...(selectedTaxId && { tax_id: selectedTaxId }),
        // Include override values if enabled
        ...(premiumOverrideEnabled && {
          override_annual_premium: parseFloat(overrideAnnualPremium) || 0,
          override_installment_fee: parseFloat(overrideInstallmentFee) || 0,
        }),
        // Include term length override values if enabled
        ...(termLengthOverrideEnabled && {
          override_term_length: parseInt(overrideTermLength) || 0,
          override_term_unit: overrideTermUnit,
        }),
      };

      const response =
        await policyCreationService.calculatePremium(calculationData);

      if (response.success) {
        setPremiumCalculation(response.data);
        setFormData((prev) => ({
          ...prev,
          premium_amount: response.data.premium_amount.toString(),
        }));
      }
    } catch (error) {
      console.error("Premium calculation failed:", error);
      toast({
        title: "Error",
        description: "Failed to calculate premium. Please check your inputs.",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, premium: false }));
    }
  }, [
    formData.plan_id,
    formData.premium_frequency,
    formData.coverage_amount,
    formData.custom_fields,
    selectedTaxId,
    premiumOverrideEnabled,
    overrideAnnualPremium,
    overrideInstallmentFee,
    termLengthOverrideEnabled,
    overrideTermLength,
    overrideTermUnit,
  ]);

  const calculatePolicyTerms = useCallback(async () => {
    if (!formData.plan_id) return;

    setLoading((prev) => ({ ...prev, terms: true }));
    try {
      const response = await policyCreationService.calculatePolicyTerms({
        plan_id: parseInt(formData.plan_id),
        start_date:
          formData.start_date_override ||
          formData.start_date ||
          new Date().toISOString().split("T")[0],
        // Include term length override values if enabled
        ...(termLengthOverrideEnabled && {
          override_term_length: parseInt(overrideTermLength) || 0,
          override_term_unit: overrideTermUnit,
        }),
      });

      if (response.success) {
        setPolicyTerms(response.data);
        setFormData((prev) => ({
          ...prev,
          start_date: response.data.start_date,
        }));
      }
    } catch (error) {
      console.error("Policy terms calculation failed:", error);
      toast({
        title: "Error",
        description: "Failed to calculate policy terms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, terms: false }));
    }
  }, [
    formData.plan_id,
    formData.start_date,
    formData.start_date_override,
    termLengthOverrideEnabled,
    overrideTermLength,
    overrideTermUnit,
  ]);

  // Plan conflict validation
  const checkPlanConflicts = useCallback(async () => {
    if (!formData.customer_id || !formData.plan_id) {
      setConflictValidation({
        isChecking: false,
        hasConflicts: false,
        conflicts: [],
        existingPolicies: [],
        blockingConflicts: [],
        warningConflicts: [],
        checked: false,
      });
      return;
    }

    setConflictValidation((prev) => ({ ...prev, isChecking: true, checked: false }));

    try {
      const result = await planConflictService.checkCustomerPolicyConflicts(
        parseInt(formData.customer_id),
        parseInt(formData.plan_id)
      );

      setConflictValidation({
        isChecking: false,
        hasConflicts: result.has_conflicts,
        conflicts: result.conflicts,
        existingPolicies: result.existing_policies,
        blockingConflicts: result.blocking_conflicts,
        warningConflicts: result.warning_conflicts,
        checked: true,
      });

      // Show toast notification for conflicts
      if (result.has_conflicts) {
        const blockingCount = result.blocking_conflicts.length;
        const warningCount = result.warning_conflicts.length;

        if (blockingCount > 0) {
          toast({
            title: "Policy Conflicts Detected",
            description: `Found ${blockingCount} blocking conflict(s) that prevent policy creation.`,
            variant: "destructive",
          });
        } else if (warningCount > 0) {
          toast({
            title: "Policy Conflicts Warning",
            description: `Found ${warningCount} warning(s) about potential conflicts.`,
            variant: "default",
          });
        }
      }
    } catch (error) {
      console.error('Plan conflict check failed:', error);
      setConflictValidation((prev) => ({ ...prev, isChecking: false, checked: true }));
      toast({
        title: "Conflict Check Failed",
        description: "Unable to check for plan conflicts. Please try again.",
        variant: "destructive",
      });
    }
  }, [formData.customer_id, formData.plan_id]);
  // Pre-fill form when a customer is passed in
  useEffect(() => {
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customer.id.toString(),
      }));
    }
  }, [customer]);

  // Load initial data
  useEffect(() => {
    loadCompanies();
    loadPolicyConfiguration();
    if (!customer) {
      loadCustomers();
    }
  }, [customer]);

  // Load plans when company changes
  useEffect(() => {
    // First, reset all plan-related state regardless of what changed.
    setFormData((prev) => ({ ...prev, plan_id: "" }));
    setPlans([]);
    setCustomFields([]);
    setCommonFields({});
    setPolicyTerms(null);
    setPremiumCalculation(null);

    // Then, if a company is selected, load its plans.
    if (formData.company_id) {
      loadPlans(parseInt(formData.company_id));
    }
  }, [formData.company_id]);

  // Load custom fields when plan changes
  useEffect(() => {
    if (selectedPlan?.id) {
      loadCustomFields(selectedPlan.id);
    }
  }, [selectedPlan?.id, loadCustomFields]);

  // Calculate premium when relevant fields change
  useEffect(() => {
    if (formData.plan_id && formData.premium_frequency) {
      calculatePremium();
    }
  }, [
    formData.plan_id,
    formData.premium_frequency,
    formData.coverage_amount,
    formData.custom_fields,
    selectedTaxId,
    premiumOverrideEnabled,
    overrideAnnualPremium,
    overrideInstallmentFee,
    termLengthOverrideEnabled,
    overrideTermLength,
    overrideTermUnit,
    calculatePremium,
  ]);

  // Calculate policy terms when plan or start date changes
  useEffect(() => {
    if (formData.plan_id) {
      calculatePolicyTerms();
    }
  }, [
    formData.plan_id,
    formData.start_date,
    formData.start_date_override,
    termLengthOverrideEnabled,
    overrideTermLength,
    overrideTermUnit,
    calculatePolicyTerms,
  ]);

  // Load available taxes on component mount
  useEffect(() => {
    const loadTaxes = async () => {
      try {
        const taxes = await taxService.getActiveTaxes();
        setAvailableTaxes(taxes);
      } catch (error) {
        console.error("Failed to load taxes:", error);
        toast({
          title: "Error",
          description: "Failed to load tax options",
          variant: "destructive",
        });
      }
    };

    loadTaxes();
  }, []);

  // Check plan conflicts when customer or plan changes (with debounce to prevent flickering)
  useEffect(() => {
    if (formData.customer_id && formData.plan_id) {
      // Debounce conflict checking to prevent flickering when multiple actions happen simultaneously
      const timeoutId = setTimeout(() => {
        checkPlanConflicts();
      }, 300); // 300ms delay to allow other operations to complete first

      return () => clearTimeout(timeoutId);
    }
  }, [formData.customer_id, formData.plan_id, checkPlanConflicts]);

  useEffect(() => {
    // Reset conflict validation when customer changes
    setConflictValidation({
      isChecking: false,
      hasConflicts: false,
      conflicts: [],
      existingPolicies: [],
      blockingConflicts: [],
      warningConflicts: [],
      checked: false,
    });
  }, [formData.customer_id]);

  const loadCompanies = async () => {
    setLoading((prev) => ({ ...prev, companies: true }));
    try {
      const response = await policyCreationService.getInsuranceCompanies();
      setCompanies(response || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load insurance companies",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, companies: false }));
    }
  };

  const loadPolicyConfiguration = async () => {
    try {
      const config = await policyConfigService.getConfiguration();
      setPolicyConfig(config);
    } catch (error) {
      console.error("Error loading policy configuration:", error);
      toast({
        title: "Warning",
        description: "Failed to load policy configuration, using defaults",
        variant: "destructive",
      });
      // Service will return fallback configuration on error
      const fallbackConfig = await policyConfigService.getConfiguration();
      setPolicyConfig(fallbackConfig);
    }
  };

  const loadPlans = async (companyId: number) => {
    setLoading((prev) => ({ ...prev, plans: true }));
    try {
      const response = await policyCreationService.getPlansByCompany(companyId);

      // Extract the actual array from the response
      const plansArray = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      setPlans(plansArray);
    } catch (error) {
      console.error("Error loading plans:", error);
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

      // Extract the actual array from the response
      const customersArray = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      setCustomers(customersArray);
    } catch (error) {
      console.error("Error loading customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, customers: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, submit: true }));

    try {
      // Check for blocking conflicts before submission
      if (conflictValidation.blockingConflicts.length > 0) {
        toast({
          title: "Policy Creation Blocked",
          description: `Cannot create policy due to ${conflictValidation.blockingConflicts.length} blocking conflict(s). Please resolve these conflicts first.`,
          variant: "destructive",
        });
        setLoading((prev) => ({ ...prev, submit: false }));
        return;
      }

      // Validate term length override if enabled
      if (termLengthOverrideEnabled) {
        if (!overrideTermLength || !overrideTermUnit) {
          toast({
            title: "Validation Error",
            description: "Please select both term length and unit when override is enabled.",
            variant: "destructive",
          });
          setLoading((prev) => ({ ...prev, submit: false }));
          return;
        }
      }

      const policyData: PolicyData = {
        customer_id: customer ? customer.id : parseInt(formData.customer_id),
        dependent_id: formData.dependent_id ? parseInt(formData.dependent_id) : undefined,
        plan_id: parseInt(formData.plan_id),
        premium_frequency: formData.premium_frequency || "monthly",
        premium_amount: parseFloat(formData.premium_amount || "0"),
        coverage_amount: parseFloat(formData.coverage_amount || "0"),
        start_date:
          formData.start_date || new Date().toISOString().split("T")[0],
        status: "Active",
        // Policy Management Fields
        policy_number: formData.policy_number || undefined,
        carrier_policy_number: formData.carrier_policy_number || undefined,
        policy_status: formData.policy_status || "Pending",
        base_premium: formData.base_premium
          ? parseFloat(formData.base_premium)
          : undefined,
        taxes_and_fees: formData.taxes_and_fees
          ? parseFloat(formData.taxes_and_fees)
          : undefined,
        total_premium: formData.total_premium
          ? parseFloat(formData.total_premium)
          : undefined,
        down_payment: formData.down_payment
          ? parseFloat(formData.down_payment)
          : undefined,
        billing_method: formData.billing_method || "Monthly",
        // Agent assignments
        agent_assignments: [
          ...(agentAssignment.aor
            ? [
              {
                agent_id: agentAssignment.aor.agentId,
                agent_type: "AOR",
                commission_rate: agentAssignment.aor.commissionRate || selectedCompany?.commission_rate || 10,
              },
            ]
            : []),
          ...(agentAssignment.writingAgent
            ? [
              {
                agent_id: agentAssignment.writingAgent.agentId,
                agent_type: "Writing Agent",
                commission_rate:
                  agentAssignment.writingAgent.commissionRate || selectedCompany?.commission_rate || 10,
              },
            ]
            : []),
        ],
        custom_fields: customFields.reduce(
          (acc: Record<string, unknown>, field) => ({
            ...acc,
            [field.name]:
              formData.custom_fields[
              `${field.name || field.field_name}_${field.id}`
              ],
          }),
          {},
        ),
        // Term length override fields
        override_term_length: termLengthOverrideEnabled && overrideTermLength ? parseInt(overrideTermLength) : undefined,
        override_term_unit: termLengthOverrideEnabled && overrideTermUnit ? overrideTermUnit : undefined,
      };

      const response = await policyCreationService.createPolicy(policyData);

      if (response.success) {
        onAddPolicy(response.data);
        toast({
          title: "Success",
          description: response.message,
        });
        onCancel();
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

  return (
    <div className="flex flex-col h-full">
      <form
        id="policy-form"
        onSubmit={handleSubmit}
        className="flex-1 space-y-6"
      >
        {/* Customer Selection */}
        {!customer && (
          <div>
            <Label htmlFor="customer">Customer *</Label>
            <Popover
              open={customerSearchOpen}
              onOpenChange={setCustomerSearchOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={customerSearchOpen}
                  className="w-full justify-between"
                  disabled={loading.customers}
                >
                  {formData.customer_id
                    ? (() => {
                        // Prefer formData fields if set by search
                        const name = formData.customer_name || "";
                        const email = formData.email || "";
                        const number = formData.customer_number || "";
                        let display = name;
                        if (email) display += ` (${email})`;
                        // if (number) display += ` [${number}]`;
                        return display || "Select customer";
                      })()
                    : loading.customers
                      ? "Loading customers..."
                      : "Select customer"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                {loading.customers ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Loading customers...
                  </div>
                ) : (
                  <CustomerSearchDropdown
                    customers={customers || []}
                    onSelect={(customer) => {
                      // Double-check fields from API response
                      const customerId = customer.id ? customer.id.toString() : "";
                      const fullName = customer.name || `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
                      const firstName = customer.first_name || "";
                      const lastName = customer.last_name || "";
                      const email = customer.email || "";
                      const customerNumber = customer.customer_number || "";

                      setFormData((prev) => ({
                        ...prev,
                        customer_id: customerId,
                        customer_name: fullName,
                        first_name: firstName,
                        last_name: lastName,
                        email: email,
                        customer_number: customerNumber,
                      }));
                      setCustomerSearchOpen(false);
                    }}
                    selectedCustomerId={formData.customer_id}
                  />
                )}
              </PopoverContent>
            </Popover>
          </div>
        )}

        {customer && (
          <div>
            <Label>Customer</Label>
            <Input value={customer.name} disabled />
          </div>
        )}

        {/* Company and Plan Selection Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company">Insurance Company *</Label>
            <Select
              value={formData.company_id}
              onValueChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  company_id: value,
                  plan_id: "",
                }));
                setPlans([]);
                setPremiumCalculation(null);
                setPolicyTerms(null);
              }}
            >
              <SelectTrigger>
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
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="plan">Insurance Plan *</Label>
            <Select
              value={formData.plan_id}
              onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, plan_id: value }));
                setPremiumCalculation(null);
                setPolicyTerms(null);
              }}
              disabled={!formData.company_id}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loading.plans ? "Loading plans..." : "Select plan"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => {
                  const planTypeName =
                    plan.plan_type?.name || plan.plan_type || "Unknown Type";
                  return (
                    <SelectItem key={plan.id} value={plan.id.toString()}>
                      {plan.name || "Unnamed Plan"} ({planTypeName})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Plan Conflict Validation Display */}
        <div className="mt-4">
          {conflictValidation.isChecking ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Validating plan compatibility...</span>
            </div>
          ) : conflictValidation.checked && !conflictValidation.hasConflicts ? (
            <div className="flex items-center gap-2 text-sm text-green-600 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5" />
              <span>No conflicts found. This plan is compatible.</span>
            </div>
          ) : conflictValidation.hasConflicts ? (
            <Card className={conflictValidation.blockingConflicts.length > 0 ? "border-red-500" : "border-yellow-500"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {conflictValidation.blockingConflicts.length > 0 ? (
                    <>
                      <Shield className="h-5 w-5 text-red-600" />
                      <span className="text-red-600">Policy Creation Blocked</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <span className="text-yellow-600">Plan Conflict Warning</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Existing Policies */}
                  {conflictValidation.existingPolicies.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Customer's Existing Policies:</h4>
                      <div className="space-y-2">
                        {conflictValidation.existingPolicies.map((policy, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">{policy.plan_name}</span>
                              <span className="text-sm text-gray-600 ml-2">({policy.plan_type_name})</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${policy.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                              {policy.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Blocking Conflicts */}
                  {conflictValidation.blockingConflicts.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Blocking Conflicts ({conflictValidation.blockingConflicts.length})
                      </h4>
                      <div className="space-y-2">
                        {conflictValidation.blockingConflicts.map((conflict, index) => (
                          <div key={index} className="text-sm">
                            <p className="text-red-700 font-medium">{conflict.message}</p>
                            <p className="text-red-600 text-xs mt-1">{conflict.rule.rule_description}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-3 bg-red-100 rounded border border-red-300">
                        <p className="text-red-800 text-sm font-medium">
                          ⚠️ Policy creation is blocked due to these conflicts. Please resolve them before proceeding.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Warning Conflicts */}
                  {conflictValidation.warningConflicts.length > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Warnings ({conflictValidation.warningConflicts.length})
                      </h4>
                      <div className="space-y-2">
                        {conflictValidation.warningConflicts.map((conflict, index) => (
                          <div key={index} className="text-sm">
                            <p className="text-yellow-700 font-medium">{conflict.message}</p>
                            <p className="text-yellow-600 text-xs mt-1">{conflict.rule.rule_description}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-3 bg-yellow-100 rounded border border-yellow-300">
                        <p className="text-yellow-800 text-sm font-medium">
                          ⚠️ Please review these warnings before creating the policy.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Custom Fields */}
        {customFields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Plan Specific Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customFields
                  .filter((field) => field.is_active && field.is_visible) // Filters to only include active and visible fields
                  .map((field, index) => {
                    // Create unique field key combining field name and index to avoid conflicts
                    const fieldKey = `${field.name || field.field_name}_${field.id || index
                      }`;
                    const fieldLabel =
                      field.field_label || field.field_name || "Unnamed Field";

                    return (
                      <div key={`custom-field-${field.id || index}`}>
                        <Label htmlFor={fieldKey}>
                          {fieldLabel} {(field.is_required || field.required) && "*"}
                        </Label>
                        {field.field_type === "select" &&
                          field.options &&
                          Array.isArray(field.options) ? (
                          <Select
                            value={formData.custom_fields[fieldKey] || ""}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                custom_fields: {
                                  ...prev.custom_fields,
                                  [fieldKey]: value,
                                },
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${fieldLabel}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options.map((option, optionIndex) => {
                                // Handle both string options and object options
                                const optionValue =
                                  typeof option === "string"
                                    ? option
                                    : option?.value ||
                                    option?.name ||
                                    String(option);
                                const optionLabel =
                                  typeof option === "string"
                                    ? option
                                    : option?.label ||
                                    option?.name ||
                                    String(option);
                                return (
                                  <SelectItem
                                    key={`${fieldKey}-option-${optionIndex}`}
                                    value={optionValue}
                                  >
                                    {optionLabel}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id={fieldKey}
                            type={
                              field.field_type === "number" ? "number" : "text"
                            }
                            value={formData.custom_fields[fieldKey] || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                custom_fields: {
                                  ...prev.custom_fields,
                                  [fieldKey]: e.target.value,
                                },
                              }))
                            }
                            placeholder={`Enter ${fieldLabel}`}
                            required={field.is_required}
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Information + Term Length Configuration Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Additional Information */}
          {Object.keys(commonFields).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Start Date Override - only show if enabled in insurance product */}
                {commonFields.start_date_override && (
                  <div>
                    <Label htmlFor="start_date_override">
                      Start Date Override
                    </Label>
                    <input
                      id="start_date_override"
                      name="start_date_override"
                      type="date"
                      value={formData.start_date_override || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          start_date_override: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Leave empty to use auto-calculated start date based on
                      policy terms
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

          )}

          {/* Right: Term Length Configuration */}
          {selectedPlan && selectedPlan.allow_term_override && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Term Length Configuration
                  {loading.policyTerms && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Override the default term length for this policy
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Default Term Length Display */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <Label className="text-sm font-medium">Default Term Length</Label>
                        <p className="text-sm text-muted-foreground">
                          {selectedPlan.default_term_length || 12} {selectedPlan.default_term_unit || 'months'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant={termLengthOverrideEnabled ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => {
                          setTermLengthOverrideEnabled(!termLengthOverrideEnabled);
                          if (!termLengthOverrideEnabled) {
                            // Enable override mode - populate with current defaults
                            setOverrideTermLength((selectedPlan.default_term_length || 12).toString());
                            setOverrideTermUnit(selectedPlan.default_term_unit || 'months');
                          } else {
                            // Disable override mode - clear override values
                            setOverrideTermLength("");
                            setOverrideTermUnit("months");
                          }
                        }}
                      >
                        {termLengthOverrideEnabled ? (
                          <>
                            <Lock className="h-4 w-4 mr-1" />
                            Lock to Default
                          </>
                        ) : (
                          <>
                            <Edit className="h-4 w-4 mr-1" />
                            Override Term Length
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Term Length Override Fields */}
                  {termLengthOverrideEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                      <div>
                        <Label htmlFor="override_term_length">Override Term Length *</Label>
                        <Input
                          id="override_term_length"
                          type="number"
                          min="1"
                          max="999"
                          value={overrideTermLength}
                          onChange={(e) => setOverrideTermLength(e.target.value)}
                          placeholder="Enter term length"
                        />
                      </div>
                      <div>
                        <Label htmlFor="override_term_unit">Term Unit *</Label>
                        <Select
                          value={overrideTermUnit}
                          onValueChange={setOverrideTermUnit}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="months">Months</SelectItem>
                            <SelectItem value="years">Years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Override Active Notice */}
                  {termLengthOverrideEnabled && overrideTermLength && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Override Active:</strong> This policy will use {overrideTermLength} {overrideTermUnit} instead of the default {selectedPlan.default_term_length || 12} {selectedPlan.default_term_unit || 'months'}.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Policy Terms & Management Fields in One Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Policy Terms Display (Left) */}
          <div>
            {policyTerms && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Policy Terms
                    {loading.terms && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Updated to a 2-column grid that stacks on mobile */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <div className="font-semibold">
                        {policyTerms.start_date}
                      </div>
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <div className="font-semibold">
                        {policyTerms.end_date}
                      </div>
                    </div>
                    <div>
                      <Label>Term Length</Label>
                      <div className="font-semibold">
                        {policyTerms.term_length} {policyTerms.term_unit}
                      </div>
                    </div>
                    <div>
                      <Label>Grace Period</Label>
                      <div className="font-semibold">
                        {policyTerms.grace_period_days} days
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          {/* Policy Management Fields (Right) */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Policy Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="policy_number">Policy Number</Label>
                    <Input
                      id="policy_number"
                      value={formData.policy_number || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          policy_number: e.target.value,
                        }))
                      }
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                  <div>
                    <Label htmlFor="carrier_policy_number">
                      Carrier Policy Number
                    </Label>
                    <Input
                      id="carrier_policy_number"
                      value={formData.carrier_policy_number || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          carrier_policy_number: e.target.value,
                        }))
                      }
                      placeholder="Enter carrier policy number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="policy_status">Policy Status *</Label>
                    <Select
                      value={formData.policy_status || "Pending"}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, policy_status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Awaiting Signature">
                          Awaiting Signature
                        </SelectItem>
                        <SelectItem value="Submitted to Carrier">
                          Submitted to Carrier
                        </SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                        <SelectItem value="Expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="billing_method">Billing Method *</Label>
                    <Select
                      value={formData.billing_method || "Agency Bill - Invoice / Check"}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, billing_method: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select billing method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Direct Bill (Billed by Carrier)">
                          Direct Bill (Billed by Carrier)
                        </SelectItem>

                        <SelectItem value="Agency Bill - EFT / Bank Draft">
                          Agency Bill - EFT / Bank Draft
                        </SelectItem>

                        <SelectItem value="Agency Bill - Credit Card">
                          Agency Bill - Credit Card
                        </SelectItem>

                        <SelectItem value="Agency Bill - Invoice / Check">
                          Agency Bill - Invoice / Check
                        </SelectItem>

                        <SelectItem value="Premium Financed">
                          Premium Financed
                        </SelectItem>

                        <SelectItem value="Mortgagee Billed">
                          Mortgagee Billed
                        </SelectItem>

                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Premium Override Section */}
        {selectedPlan && (
          <Card>
            <CardHeader>
              <CardTitle>Plan Rate Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="annual_premium">Annual Premium</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="annual_premium"
                      type="number"
                      step="0.01"
                      value={
                        premiumOverrideEnabled
                          ? overrideAnnualPremium
                          : overrideAnnualPremium ||
                          selectedPlan.annual_premium ||
                          ""
                      }
                      onChange={(e) => setOverrideAnnualPremium(e.target.value)}
                      disabled={!premiumOverrideEnabled}
                      placeholder="0.00"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPremiumOverrideEnabled(!premiumOverrideEnabled);

                        if (!premiumOverrideEnabled) {
                          // Enabling override: Use plan's default values as starting point
                          if (!overrideAnnualPremium) {
                            setOverrideAnnualPremium(
                              selectedPlan.annual_premium?.toString() || "",
                            );
                          }
                          if (!overrideInstallmentFee) {
                            setOverrideInstallmentFee(
                              selectedPlan.installment_fee?.toString() || "",
                            );
                          }
                        } else {
                          // Disabling override (reverting to default): Clear override values
                          setOverrideAnnualPremium("");
                          setOverrideInstallmentFee("");
                        }
                      }}
                    >
                      {premiumOverrideEnabled
                        ? "Revert to Default Plan"
                        : "Edit"}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="installment_fee">Installment Fee</Label>
                  <Input
                    id="installment_fee"
                    type="number"
                    step="0.01"
                    value={
                      premiumOverrideEnabled
                        ? overrideInstallmentFee
                        : overrideInstallmentFee ||
                        selectedPlan.installment_fee ||
                        ""
                    }
                    onChange={(e) => setOverrideInstallmentFee(e.target.value)}
                    disabled={!premiumOverrideEnabled}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                This plan's default annual premium is $
                {selectedPlan.annual_premium || "0.00"} and installment fee is $
                {selectedPlan.installment_fee || "0.00"}. Click the Edit button
                to override these values for this policy.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Premium Frequency */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-1">
          <div>
            <Label htmlFor="frequency" className="text-orange-600">Premium Frequency *</Label>
            <Select
              value={formData.premium_frequency}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, premium_frequency: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment frequency from the list" />
              </SelectTrigger>
              <SelectContent>
                {policyConfig?.premium_frequencies.map((frequency) => (
                  <SelectItem key={frequency} value={frequency}>
                    {frequency.charAt(0).toUpperCase() + frequency.slice(1).replace('-', ' ')}
                  </SelectItem>
                )) || (
                  // Fallback options if policyConfig is not loaded yet
                  <>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="semi-annually">Semi-Annually</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Premium Configuration */}
        {premiumCalculation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Premium Configuration
                {loading.premium && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure taxes and down payment
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Tax and Down Payment Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taxes_select">Taxes</Label>
                    <Select
                      value={selectedTaxId?.toString() || ""}
                      onValueChange={(value) => {
                        if (value === "none") {
                          setSelectedTaxId(null);
                          setFormData((prev) => ({
                            ...prev,
                            taxes_and_fees: "0",
                          }));
                        } else {
                          const taxId = parseInt(value);
                          setSelectedTaxId(taxId);
                          const selectedTax = availableTaxes.find(
                            (tax) => tax.id === taxId,
                          );
                          if (
                            selectedTax &&
                            premiumCalculation?.annual_premium
                          ) {
                            const baseAmount = parseFloat(
                              premiumCalculation.annual_premium.toString(),
                            );
                            const taxAmount = taxService.calculateTaxAmount(
                              selectedTax,
                              baseAmount,
                            );
                            setFormData((prev) => ({
                              ...prev,
                              taxes_and_fees: taxAmount.toString(),
                            }));
                          }
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tax type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Tax</SelectItem>
                        {availableTaxes.map((tax) => (
                          <SelectItem key={tax.id} value={tax.id.toString()}>
                            {taxService.formatTaxDisplayName(tax)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedTaxId && (
                      <div className="mt-2 p-2 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">
                          Tax Amount: ${formData.taxes_and_fees || "0.00"}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="down_payment">Down Payment</Label>
                    <Input
                      id="down_payment"
                      type="number"
                      step="0.01"
                      min="0"
                      max={(
                        premiumCalculation.gross_annual_premium ||
                        (premiumCalculation.total_annual_premium ||
                          premiumCalculation.annual_premium) +
                        (premiumCalculation.tax_amount || 0)
                      ).toFixed(2)}
                      value={formData.down_payment || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        const maxAmount =
                          premiumCalculation.gross_annual_premium ||
                          (premiumCalculation.total_annual_premium ||
                            premiumCalculation.annual_premium) +
                          (premiumCalculation.tax_amount || 0);

                        if (value && parseFloat(value) > maxAmount) {
                          toast({
                            title: "Invalid Down Payment",
                            description: `Down payment cannot exceed the total annual premium of $${maxAmount.toFixed(2)}`,
                            variant: "destructive",
                          });
                          return;
                        }

                        setFormData((prev) => ({
                          ...prev,
                          down_payment: value,
                        }));
                      }}
                      placeholder="0.00"
                      className={
                        formData.down_payment &&
                          parseFloat(formData.down_payment) >
                          (premiumCalculation.gross_annual_premium ||
                            (premiumCalculation.total_annual_premium ||
                              premiumCalculation.annual_premium) +
                            (premiumCalculation.tax_amount || 0))
                          ? "border-red-500"
                          : ""
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum: $
                      {(
                        premiumCalculation.gross_annual_premium ||
                        (premiumCalculation.total_annual_premium ||
                          premiumCalculation.annual_premium) +
                        (premiumCalculation.tax_amount || 0)
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Financial Summary & Agency Accounting Row */}
        {premiumCalculation && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial & Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Financial & Payment Summary
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete premium breakdown and payment details
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Term Length Information */}
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="font-semibold text-blue-800">Policy Term</Label>
                      <div className="text-blue-700 font-medium">
                        {premiumCalculation.term_length || formData.override_term_length || selectedPlan?.default_term_length || 12}{' '}
                        {premiumCalculation.term_unit || formData.override_term_unit || selectedPlan?.default_term_unit || 'months'}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-blue-600">Total Installments</Label>
                      <div className="text-blue-700 font-medium">
                        {premiumCalculation.total_installments} payments
                      </div>
                    </div>
                  </div>

                  {/* Premium Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Plan Annual Premium</Label>
                      <div className="font-semibold">
                        ${selectedPlan?.annual_premium ? parseFloat(selectedPlan.annual_premium).toFixed(2) : '0.00'}
                        <span className="text-xs text-muted-foreground ml-1">(from plan)</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <Label>Base Annual Premium</Label>
                      <div className="font-semibold">
                        $
                        {(
                          premiumCalculation.base_annual_premium ||
                          (premiumCalculation.total_annual_premium ||
                            premiumCalculation.annual_premium) -
                          (premiumCalculation.total_installment_fees || 0)
                        ).toFixed(2)}
                        <span className="text-xs text-muted-foreground ml-1">(after adjustments)</span>
                      </div>
                    </div>

                    {premiumCalculation.frequency !== "annually" && (
                      <div className="flex justify-between items-center">
                        <Label>Total Installment Fees</Label>
                        <div className="font-semibold">
                          $
                          {(
                            premiumCalculation.total_installment_fees ||
                            premiumCalculation.installment_fee *
                            premiumCalculation.total_installments
                          ).toFixed(2)}
                          <span className="text-xs text-muted-foreground ml-1">
                            (${premiumCalculation.installment_fee} ×{" "}
                            {premiumCalculation.total_installments})
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <Label>Subtotal (Premium + Fees)</Label>
                      <div className="font-semibold">
                        $
                        {(
                          premiumCalculation.subtotal_premium_fees ||
                          premiumCalculation.total_annual_premium ||
                          premiumCalculation.annual_premium
                        ).toFixed(2)}
                      </div>
                    </div>

                    {premiumCalculation.tax_amount > 0 && (
                      <div className="flex justify-between items-center">
                        <Label>Total Taxes</Label>
                        <div className="font-semibold">
                          ${premiumCalculation.tax_amount.toFixed(2)}
                          {premiumCalculation.tax_details && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({premiumCalculation.tax_details.name})
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Total and Payment Info */}
                  <div className="border-t pt-3 space-y-3">
                    <div className="flex justify-between items-center bg-green-50 p-3 rounded">
                      <Label className="font-bold text-green-800">
                        {(() => {
                          const termLength = premiumCalculation.term_length || formData.override_term_length || selectedPlan?.default_term_length || 12;
                          const termUnit = premiumCalculation.term_unit || formData.override_term_unit || selectedPlan?.default_term_unit || 'months';

                          // Show appropriate label based on term length
                          if (termLength === 12 && termUnit === 'months') {
                            return 'Gross Annual Premium';
                          } else {
                            return `Total Gross Premium (${termLength} ${termUnit})`;
                          }
                        })()}
                      </Label>
                      <div className="text-xl font-bold text-green-600">
                        $
                        {(
                          premiumCalculation.gross_annual_premium ||
                          (premiumCalculation.total_annual_premium ||
                            premiumCalculation.annual_premium) +
                          (premiumCalculation.tax_amount || 0)
                        ).toFixed(2)}
                      </div>
                    </div>

                    {/* Down Payment Impact */}
                    {formData.down_payment &&
                      parseFloat(formData.down_payment) > 0 && (
                        <>
                          <div className="flex justify-between items-center">
                            <Label>Less: Down Payment</Label>
                            <div className="font-semibold text-red-600">
                              -${parseFloat(formData.down_payment).toFixed(2)}
                            </div>
                          </div>
                          <div className="flex justify-between items-center bg-blue-50 p-3 rounded">
                            <Label className="font-bold text-blue-800">
                              Remaining Balance to be Billed
                            </Label>
                            <div className="text-lg font-bold text-blue-600">
                              $
                              {(() => {
                                // Use the same calculation as Gross Annual Premium
                                const grossAnnualPremium = premiumCalculation.gross_annual_premium ||
                                  (premiumCalculation.total_annual_premium ||
                                    premiumCalculation.annual_premium) +
                                  (premiumCalculation.tax_amount || 0);

                                // Subtract down payment from gross annual premium
                                const remainingBalance = grossAnnualPremium - parseFloat(formData.down_payment);
                                return remainingBalance.toFixed(2);
                              })()}
                            </div>
                          </div>
                        </>
                      )}

                    {/* Payment Schedule */}
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="flex justify-between items-center">
                        <Label>
                          Payment per{" "}
                          {premiumCalculation.frequency === "annually"
                            ? "Year"
                            : premiumCalculation.frequency === "monthly"
                              ? "Month"
                              : "Quarter"}
                        </Label>
                        <div className="font-semibold">
                          ${
                            (() => {
                              // If no down payment, use the original installment amount
                              if (!formData.down_payment || parseFloat(formData.down_payment) === 0) {
                                return (premiumCalculation.premium_amount || premiumCalculation.installment_amount || 0).toFixed(2);
                              }

                              // Use the same calculation as Gross Annual Premium
                              const grossAnnualPremium = premiumCalculation.gross_annual_premium ||
                                (premiumCalculation.total_annual_premium ||
                                  premiumCalculation.annual_premium) +
                                (premiumCalculation.tax_amount || 0);

                              // Calculate remaining balance after down payment
                              const downPayment = parseFloat(formData.down_payment);
                              const remainingBalance = grossAnnualPremium - downPayment;

                              // Calculate payment per installment based on remaining balance
                              const totalInstallments = premiumCalculation.total_installments || 12;
                              const paymentPerInstallment = remainingBalance / totalInstallments;

                              return paymentPerInstallment.toFixed(2);
                            })()
                          }
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                        <span>Payment Schedule</span>
                        <span>
                          {premiumCalculation.total_installments} payments
                          {formData.down_payment && parseFloat(formData.down_payment) > 0 && (
                            <span className="text-blue-600 font-medium ml-1">
                              (after down payment)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agency Accounting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Agency Accounting
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Internal financial breakdown
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const basePremium =
                      premiumCalculation.base_annual_premium ||
                      (premiumCalculation.total_annual_premium ||
                        premiumCalculation.annual_premium) -
                      (premiumCalculation.total_installment_fees || 0);

                    // Calculate individual commissions
                    const aorCommissionRate = agentAssignment.aor?.commissionRate || 0;
                    const writingAgentCommissionRate = agentAssignment.writingAgent?.commissionRate || 0;
                    const totalCommissionRate = aorCommissionRate + writingAgentCommissionRate;

                    // Use company's default commission rate if no agents assigned
                    const defaultCommissionRate = selectedCompany?.commission_rate || 10;
                    const effectiveCommissionRate = totalCommissionRate > 0 ? totalCommissionRate : defaultCommissionRate;

                    const aorCommissionAmount = basePremium * (aorCommissionRate / 100);
                    const writingAgentCommissionAmount = basePremium * (writingAgentCommissionRate / 100);
                    const totalCommission = basePremium * (effectiveCommissionRate / 100);
                    const netPremiumToCarrier = basePremium - totalCommission;

                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <Label>Base Annual Premium</Label>
                          <div className="font-semibold">
                            ${basePremium.toFixed(2)}
                          </div>
                        </div>

                        {/* Commission Rate Section */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label>Total Commission Rate</Label>
                            <div className="font-semibold">
                              {effectiveCommissionRate}%
                              {totalCommissionRate === 0 && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  (Default - No agents assigned)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Commission Breakdown */}
                          {(agentAssignment.aor || agentAssignment.writingAgent) && (
                            <div className="ml-4 space-y-1 text-sm text-muted-foreground">
                              {agentAssignment.aor && (
                                <div className="flex justify-between">
                                  <span>• AOR ({agentAssignment.aor.agentName}):</span>
                                  <span>{aorCommissionRate}%</span>
                                </div>
                              )}
                              {agentAssignment.writingAgent && (
                                <div className="flex justify-between">
                                  <span>• Writing Agent ({agentAssignment.writingAgent.agentName}):</span>
                                  <span>{writingAgentCommissionRate}%</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Commission Amount Section */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label>Total Commission Amount</Label>
                            <div className="font-semibold text-green-600">
                              ${totalCommission.toFixed(2)}
                            </div>
                          </div>

                          {/* Commission Amount Breakdown */}
                          {(agentAssignment.aor || agentAssignment.writingAgent) && (
                            <div className="ml-4 space-y-1 text-sm text-muted-foreground">
                              {agentAssignment.aor && (
                                <div className="flex justify-between">
                                  <span>• AOR Commission:</span>
                                  <span>${aorCommissionAmount.toFixed(2)}</span>
                                </div>
                              )}
                              {agentAssignment.writingAgent && (
                                <div className="flex justify-between">
                                  <span>• Writing Agent Commission:</span>
                                  <span>${writingAgentCommissionAmount.toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center border-t pt-2 bg-orange-50 p-3 rounded">
                          <Label className="font-bold text-orange-800">
                            Net Premium to Carrier
                          </Label>
                          <div className="text-lg font-bold text-orange-600">
                            ${netPremiumToCarrier.toFixed(2)}
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-muted-foreground">
                          <p>• Commission calculated on base premium only</p>
                          <p>• Excludes fees and taxes</p>
                          {(agentAssignment.aor || agentAssignment.writingAgent) ? (
                            <p>• Total commission combines all assigned agent commissions</p>
                          ) : (
                            <p>• Using default {defaultCommissionRate}% commission rate (no agents assigned)</p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Agent Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <PolicyAgentManager
              policyId={0} // New policy, no ID yet
              policyNumber={formData.policy_number || "New Policy"}
              agentAssignment={agentAssignment}
              onUpdateAgents={setAgentAssignment}
            />
          </CardContent>
        </Card>
      </form>

      {/* Fixed Footer with Actions */}
      <div className="border-t bg-white p-6 mt-auto">
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="policy-form"
            disabled={
              loading.submit ||
              !premiumCalculation ||
              !policyTerms ||
              conflictValidation.blockingConflicts.length > 0
            }
          >
            {loading.submit && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            {conflictValidation.blockingConflicts.length > 0
              ? "Policy Creation Blocked"
              : "Create Policy"
            }
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPolicyForm;
