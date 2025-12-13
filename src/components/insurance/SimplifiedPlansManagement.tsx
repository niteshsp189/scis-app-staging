import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Grid3X3,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";
import {
  ValidatedInput,
  ValidatedSelect,
} from "@/components/ui/validated-input";
import { usePermissions } from "@/contexts/PermissionContext";
import { ConditionalAccess } from "@/components/ProtectedRoute";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { InsuranceCompany } from "@/services/insuranceCompany.service";
import SimplifiedPlanService, {
  SimplifiedPlan,
  SimplifiedPlanFormData,
} from "@/services/SimplifiedPlanService";
import SimplifiedPlanTypeService from "@/services/SimplifiedPlanTypeService";
import { PlanPreview } from "./PlanPreview";
import { usePreferences } from "@/contexts/PreferenceContext";
import { formatPermissionError, isPermissionError, getErrorData } from "@/utils/permissionErrorHandler";

// Service interfaces (simplified)
interface SimplifiedPlanType {
  id: number;
  name: string;
  slug: string;
}

interface SimplifiedPlansManagementProps {
  companies: InsuranceCompany[];
  selectedCompany?: InsuranceCompany | null;
  onCompanySelect?: (company: InsuranceCompany) => void;
}

export function SimplifiedPlansManagement({
  companies,
  selectedCompany,
  onCompanySelect,
}: SimplifiedPlansManagementProps) {
  const { hasPermission } = usePermissions();
  const { getViewMode, setViewMode } = usePreferences();
  const [plans, setPlans] = useState<SimplifiedPlan[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);

  // Permission checks
  const canManagePlans = hasPermission("manage_plans");
  const canDeletePlans = hasPermission("delete_plans");
  const canViewPlanStatistics = hasPermission("view_plan_statistics");
  const [planTypes, setPlanTypes] = useState<SimplifiedPlanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewModeState] = useState<"table" | "grid">("table");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SimplifiedPlan | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<number | null>(null);

  // Multi-step state
  const [currentStep, setCurrentStep] = useState<"form" | "preview">("form");

  // Default form data
  const defaultFormData: SimplifiedPlanFormData = {
    name: "",
    description: "",
    plan_type_id: 0,
    company_id: 0,
    status: "Active",
  };

  const [formData, setFormData] =
    useState<SimplifiedPlanFormData>(defaultFormData);

  // Initialize form data from localStorage on component mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem("planFormData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData({ ...defaultFormData, ...parsedData });
      }
    } catch (error) {
      console.warn("Failed to load saved plan form data:", error);
    }
  }, [defaultFormData]);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Ref for the first input to manage focus behavior
  const nameInputRef = useRef<HTMLInputElement>(null);

  const loadPlans = useCallback(async (page: number = 1, pageSize?: number) => {
    const currentPerPage = pageSize || perPage;
    try {
      setLoading(true);
      const response = await SimplifiedPlanService.getAll({ page, per_page: currentPerPage });
      // Sort plans by created_at descending (latest first)
      const sortedPlans = (response.data || []).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setPlans(sortedPlans);
      setTotalCount(response.total || 0);
      setCurrentPage(response.current_page || 1);
      setLastPage(Math.ceil((response.total || 0) / currentPerPage));
    } catch (error) {
      console.error("Error loading plans:", error);
      toast({
        title: "Error",
        description: "Failed to load plans",
        variant: "destructive",
      });
      setPlans([]);
      setTotalCount(0);
      setCurrentPage(1);
      setLastPage(1);
    } finally {
      setLoading(false);
    }
  }, [toast, perPage]);

  const loadPlanTypes = useCallback(async () => {
    try {
      const response = await SimplifiedPlanTypeService.getOptions();
      setPlanTypes(response || []);
    } catch (error: any) {
      console.error("Error loading plan types:", error);

      if (isPermissionError(error)) {
        const errorData = getErrorData(error);
        toast({
          title: "Insufficient Permissions",
          description: formatPermissionError(errorData),
          variant: "default",
          className: "bg-blue-50 border-blue-200",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to load plan types",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  useEffect(() => {
    loadPlans();
    loadPlanTypes();
  }, [loadPlans, loadPlanTypes]);

  // Initialize view mode from user preferences
  useEffect(() => {
    const preferredViewMode = getViewMode('insurance_plans');
    setViewModeState(preferredViewMode === 'grid' ? 'grid' : 'table');
  }, [getViewMode]);

  // Handle view mode change with preference persistence
  const handleViewModeChange = async (mode: "table" | "grid") => {
    setViewModeState(mode);
    try {
      await setViewMode('insurance_plans', mode);
    } catch (error) {
      console.error('Failed to save view mode preference:', error);
    }
  };

  // Handle dialog opening and prevent auto-selection of text
  useEffect(() => {
    if ((isEditDialogOpen || isAddDialogOpen) && nameInputRef.current) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus({ preventScroll: true });
      }, 100); // A small delay to ensure the dialog is fully rendered

      return () => clearTimeout(timer);
    }
  }, [isEditDialogOpen, isAddDialogOpen]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Plan name is required";
    }

    if (!formData.plan_type_id) {
      errors.plan_type_id = "Plan type is required";
    }

    if (!formData.company_id) {
      errors.company_id = "Insurance company is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Function to proceed to preview step
  const handleProceedToPreview = () => {
    if (!validateForm()) {
      return;
    }

    setCurrentStep("preview");
  };

  // Function to go back to form from preview
  const handleBackToForm = () => {
    setCurrentStep("form");
  };

  // Updated input change handler with localStorage persistence
  const handleInputChange = (field: string, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Save to localStorage for form persistence (only for add form)
    if (!editingPlan) {
      try {
        localStorage.setItem("planFormData", JSON.stringify(newFormData));
      } catch (error) {
        console.warn("Failed to save plan form data:", error);
      }
    }

    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async () => {
    // If we're on the form step, proceed to preview instead of submitting
    if (currentStep === "form") {
      handleProceedToPreview();
      return;
    }

    // If we're on the preview step, proceed with actual submission
    try {
      if (editingPlan) {
        await SimplifiedPlanService.update(editingPlan.id, formData);
        toast({
          title: "Success",
          description: "Plan updated successfully",
        });
      } else {
        await SimplifiedPlanService.create(formData);
        toast({
          title: "Success",
          description: "Plan created successfully",
        });

        // Clear localStorage after successful submission
        try {
          localStorage.removeItem("planFormData");
        } catch (error) {
          console.warn("Failed to clear saved plan form data:", error);
        }
      }

      resetForm();
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      loadPlans();
    } catch (error) {
      console.error("Error saving plan:", error);
      toast({
        title: "Error",
        description: "Failed to save plan",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (plan: SimplifiedPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      plan_type_id: plan.plan_type_id,
      company_id: plan.insurance_company_id,
      status: plan.is_active ? "Active" : "Inactive",
    });
    setCurrentStep("form");
    setIsEditDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;

    try {
      await SimplifiedPlanService.delete(planToDelete);
      toast({
        title: "Success",
        description: "Plan deleted successfully",
      });
      loadPlans();
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast({
        title: "Error",
        description: "Failed to delete plan",
        variant: "destructive",
      });
    } finally {
      setIsDeleteConfirmOpen(false);
      setPlanToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      plan_type_id: 0,
      company_id: 0,
      status: "Active",
    });
    setFormErrors({});
    setEditingPlan(null);
    setCurrentStep("form");
  };

  const handleManualReset = () => {
    // Reset form data
    setFormData({
      name: "",
      description: "",
      plan_type_id: 0,
      company_id: 0,
      status: "Active",
    });

    // Clear localStorage
    try {
      localStorage.removeItem("planFormData");
    } catch (error) {
      console.warn("Failed to clear saved plan form data:", error);
    }

    // Clear form errors
    setFormErrors({});

    // Reset step to form
    setCurrentStep("form");

    // Show success message
    toast({
      title: "Form Reset",
      description: "All form fields have been cleared.",
    });
  };

  const filteredPlans = plans.filter(
    (plan) =>
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.plan_type?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.insurance_company?.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Permission check */}
      {!hasPermission("view_plan_types") && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view insurance plans. Please contact your administrator.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Insurance Plans ({totalCount})
          </h1>
          <p className="text-gray-600">Manage insurance plan information</p>
        </div>
        <ConditionalAccess
          requiredPermissions={['manage_plans']}
          fallback={null}
        >
          <Button
            onClick={() => {
              resetForm();
              setCurrentStep("form");
              setIsAddDialogOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Insurance Plan
          </Button>
        </ConditionalAccess>
      </div>

      {/* Search and View Toggle */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search plans by name, type, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        {/* View Mode Toggle */}
        <div className="flex items-center border border-gray-200 rounded-lg p-1">
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleViewModeChange("table")}
            className="h-8 px-3"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleViewModeChange("grid")}
            className="h-8 px-3"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Plans Display */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading plans...</div>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No plans found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? "No plans match your search criteria."
                  : "Get started by creating your first insurance plan."}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => {
                    resetForm();
                    setCurrentStep("form");
                    setIsAddDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Plan
                </Button>
              )}
            </div>
          ) : viewMode === "table" ? (
            // Table View
            <Table className="border-l">
              <TableHeader className="border-b border-t">
                <TableRow className="divide-x divide-gray-200">
                  <TableHead>Insurance Plan Name</TableHead>
                  <TableHead>Insurance Type</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((plan) => (
                  <TableRow key={plan.id} className="divide-x divide-gray-200">
                    <TableCell>
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        {plan.description && (
                          <div className="text-sm text-gray-500">
                            {plan.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {plan.plan_type?.name || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {plan.insurance_company?.name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ConditionalAccess
                          requiredPermissions={['manage_plans']}
                          fallback={null}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </ConditionalAccess>
                        <ConditionalAccess
                          requiredPermissions={['delete_plans']}
                          fallback={null}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPlanToDelete(plan.id);
                              setIsDeleteConfirmOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </ConditionalAccess>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            // Grid View
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                {filteredPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg text-blue-600 break-words">
                        {plan.name}
                      </h3>
                      <div className="flex items-center space-x-1 ml-2">
                        <Button
                          onClick={() => handleEdit(plan)}
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => {
                            setPlanToDelete(plan.id);
                            setIsDeleteConfirmOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {plan.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {plan.description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <Badge variant="outline" className="text-xs">
                          {plan.plan_type?.name || "Unknown"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Company:</span>
                        <span className="font-medium ml-2">
                          {plan.insurance_company?.name || "Unknown"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <Badge
                        variant={plan.is_active ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalCount)} of {totalCount} plans
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="page-size" className="text-sm">Show:</Label>
              <Select
                value={perPage.toString()}
                onValueChange={(value) => {
                  const newPerPage = parseInt(value);
                  setPerPage(newPerPage);
                  loadPlans(1, newPerPage); // Reset to first page when changing page size
                }}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPlans(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {lastPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPlans(currentPage + 1)}
              disabled={currentPage === lastPage || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {currentStep === "form"
                ? editingPlan
                  ? "Edit Insurance Plan"
                  : "Add New Insurance Plan"
                : "Review Insurance Plan Information"}
            </DialogTitle>
            <DialogDescription>
              {currentStep === "form"
                ? editingPlan
                  ? "Update plan details and configuration"
                  : "Create a new insurance plan with company and type details"
                : "Please review the information below before submitting."}
            </DialogDescription>

            {/* Step Indicators */}
            <div className="flex items-center justify-center space-x-4 mt-4">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === "form"
                      ? "bg-blue-600 text-white"
                      : "bg-green-600 text-white"
                  }`}
                >
                  1
                </div>
                <span
                  className={`ml-2 text-sm ${currentStep === "form" ? "text-blue-600 font-medium" : "text-gray-500"}`}
                >
                  Plan Details
                </span>
              </div>

              <div
                className={`w-8 h-0.5 ${currentStep === "preview" ? "bg-green-600" : "bg-gray-300"}`}
              ></div>

              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === "preview"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-500"
                  }`}
                >
                  2
                </div>
                <span
                  className={`ml-2 text-sm ${currentStep === "preview" ? "text-blue-600 font-medium" : "text-gray-500"}`}
                >
                  Review & Submit
                </span>
              </div>
            </div>
          </DialogHeader>

          {currentStep === "form" ? (
            <>
              {/* Form content */}
              <div className="space-y-4 pt-4">
                <ValidatedInput
                  id="name"
                  label="Insurance Plan Name"
                  value={formData.name}
                  onChange={(value) => handleInputChange("name", value)}
                  error={formErrors.name}
                  required
                  maxLength={100}
                  placeholder="e.g., Premium Health Plan, Auto Plus Coverage"
                  validationHint="Plan name (max 100 chars)"
                />

                <ValidatedSelect
                  id="plan_type_id"
                  label="Insurance Plan Type"
                  value={
                    formData.plan_type_id > 0
                      ? formData.plan_type_id.toString()
                      : ""
                  }
                  onChange={(value) =>
                    handleInputChange("plan_type_id", parseInt(value) || 0)
                  }
                  error={formErrors.plan_type_id}
                  required
                  placeholder="Select insurance type"
                  validationHint="Select the type of insurance plan"
                  maxHeight="max-h-48"
                >
                  {planTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </ValidatedSelect>

                <ValidatedSelect
                  id="company_id"
                  label="Insurance Company"
                  value={
                    formData.company_id > 0
                      ? formData.company_id.toString()
                      : ""
                  }
                  onChange={(value) =>
                    handleInputChange("company_id", parseInt(value) || 0)
                  }
                  error={formErrors.company_id}
                  required
                  placeholder="Select company"
                  validationHint="Select the insurance company"
                  maxHeight="max-h-48"
                >
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </ValidatedSelect>

                <ValidatedSelect
                  id="status"
                  label="Status"
                  value={formData.status || "Active"}
                  onChange={(value) => handleInputChange("status", value)}
                  error={formErrors.status}
                  placeholder="Select status"
                  validationHint="Select the plan status"
                >
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </ValidatedSelect>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 500) {
                        handleInputChange("description", value);
                      }
                    }}
                    placeholder="Brief description of plan features, benefits, and coverage details..."
                    rows={3}
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {formData.description.length}/500 characters
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  {!editingPlan && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleManualReset}
                    >
                      Reset Form
                    </Button>
                  )}
                  {editingPlan && <div></div>}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        setIsEditDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                      {editingPlan
                        ? "Review Information"
                        : "Review Information"}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Preview content */}
              <div className="pt-4">
                <PlanPreview
                  formData={formData}
                  companies={companies}
                  planTypes={planTypes}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToForm}
                >
                  Edit Information
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setIsEditDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingPlan ? "Update Plan" : "Create Plan"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={isDeleteConfirmOpen}
        onOpenChange={(open) => {
          setIsDeleteConfirmOpen(open);
          if (!open) {
            setPlanToDelete(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Plan"
        description="Are you sure you want to delete this plan? This action cannot be undone."
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
