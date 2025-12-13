import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";
import { ValidatedInput } from "@/components/ui/validated-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePermissions } from "@/contexts/PermissionContext";
import { ConditionalAccess } from "@/components/ProtectedRoute";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { Plus, Edit, Trash2, Search, Eye, EyeOff, Tag } from "lucide-react";
import { PlanTypeService } from "@/services/planService";
import { PlanTypePreview } from "./PlanTypePreview";
import { formatPermissionError, isPermissionError, getErrorData } from "@/utils/permissionErrorHandler";

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
  plans_count: number;
  created_at: string;
  updated_at: string;
}

interface ExtraField {
  label: string;
  included: boolean;
  required: boolean;
}

const defaultExtraFields: Record<string, ExtraField> = {
  // coverage_type: { label: "Coverage Type", included: false, required: false },
  // base_premium: { label: "Base Premium", included: false, required: false },
  // policy_term_months: {
  //   label: "Policy Term (Months)",
  //   included: false,
  //   required: false,
  // },
  medicare_number: { label: "Medicare #", included: false, required: false },
  pdp_serial: { label: "PDP Serial", included: false, required: false },
  effective_date: { label: "Effective Date", included: false, required: false },
  part_a_effective_date: {
    label: "Part A Effective Date",
    included: false,
    required: false,
  },
  part_b_effective_date: {
    label: "Part B Effective Date",
    included: false,
    required: false,
  },
  premium: { label: "Premium", included: false, required: false },
  value: { label: "Value", included: false, required: false },
  deductible: { label: "Deductible", included: false, required: false },
  out_of_pocket: { label: "Out Of Pocket", included: false, required: false },
  payment_mode: { label: "Payment Mode", included: false, required: false },
  application_mailed_date: {
    label: "Application Mailed Date",
    included: false,
    required: false,
  },
  policy_mailed_date: {
    label: "Policy Mailed Date",
    included: false,
    required: false,
  },
  credit: { label: "Credit", included: false, required: false },
  payment: { label: "Payment", included: false, required: false },
};

// Default form data moved outside component to prevent recreation
const defaultFormData = {
  name: "",
  slug: "",
  conflicting_plan_types: [] as number[],
  extra_fields: { ...defaultExtraFields },
  is_active: true,
};

export function SimplifiedPlanTypesManagement() {
  const { hasPermission } = usePermissions();
  const [planTypes, setPlanTypes] = useState<PlanType[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);

  // Permission checks
  const canManagePlanTypes = hasPermission("manage_plan_types");
  const canDeletePlanTypes = hasPermission("delete_plan_types");
  const canViewPlanTypeStatistics = hasPermission("view_plan_type_statistics");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [planTypeToDelete, setPlanTypeToDelete] = useState<number | null>(null);
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType | null>(
    null,
  );

  // Multi-step state
  const [currentStep, setCurrentStep] = useState<"form" | "preview">("form");

  // Form state
  const [formData, setFormData] = useState(defaultFormData);

  // Initialize form data from localStorage when opening add modal
  useEffect(() => {
    // Only load from localStorage when adding a new plan type (not editing)
    if (isAddModalOpen && !selectedPlanType) {
      try {
        const savedData = localStorage.getItem("planTypeFormData");
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setFormData({ ...defaultFormData, ...parsedData });
        }
      } catch (error) {
        console.warn("Failed to load saved plan type form data:", error);
      }
    }
  }, [isAddModalOpen, selectedPlanType]);

  const loadPlanTypes = useCallback(async (page: number = 1, pageSize?: number) => {
    const currentPerPage = pageSize || perPage;
    try {
      setLoading(true);
      const response = await PlanTypeService.getAll({ per_page: currentPerPage, page });

      console.log('PlanTypeService response:', response); // Debug log

      let planTypesData: PlanType[] = [];
      let totalCountValue = 0;
      let currentPageValue = 1;
      let lastPageValue = 1;

      if (response && response.data && Array.isArray(response.data)) {
        // New paginated response structure
        planTypesData = response.data;
        totalCountValue = response.meta?.total || response.data.length;
        currentPageValue = response.meta?.current_page || 1;
        lastPageValue = response.meta?.last_page || Math.ceil(response.data.length / currentPerPage);
        console.log('Paginated response - totalCount:', totalCountValue, 'lastPage:', lastPageValue, 'currentPage:', currentPageValue);
      } else if (Array.isArray(response)) {
        // Fallback for array response (backward compatibility)
        planTypesData = response;
        totalCountValue = response.length;
        currentPageValue = 1;
        lastPageValue = Math.ceil(response.length / currentPerPage);
        console.log('Array response - totalCount:', totalCountValue, 'lastPage:', lastPageValue);
      } else {
        console.log('Unexpected response structure:', response);
        planTypesData = [];
        totalCountValue = 0;
        currentPageValue = 1;
        lastPageValue = 1;
      }

      // Sort plan types by created_at descending (latest first)
      const sortedPlanTypes = planTypesData.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log('Final values - planTypesData.length:', planTypesData.length, 'totalCount:', totalCountValue, 'lastPage:', lastPageValue);

      console.log('Setting state - totalCount:', totalCountValue, 'planTypes.length:', planTypesData.length);
      setTotalCount(totalCountValue);
      setPlanTypes(sortedPlanTypes);
      setCurrentPage(currentPageValue);
      setLastPage(lastPageValue);
    } catch (error: any) {
      console.error('Error in loadPlanTypes:', error);
      
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
      
      setPlanTypes([]);
      setTotalCount(0);
      setCurrentPage(1);
      setLastPage(1);
    } finally {
      setLoading(false);
    }
  }, [perPage]);

  useEffect(() => {
    loadPlanTypes();
  }, [loadPlanTypes]);

  // Function to proceed to preview step
  const handleProceedToPreview = () => {
    // Basic validation
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Insurance plan type name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.slug.trim()) {
      toast({
        title: "Validation Error",
        description: "Slug is required",
        variant: "destructive",
      });
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
    if (!selectedPlanType) {
      try {
        localStorage.setItem("planTypeFormData", JSON.stringify(newFormData));
      } catch (error) {
        console.warn("Failed to save insurance plan type form data:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If we're on the form step, proceed to preview instead of submitting
    if (currentStep === "form") {
      handleProceedToPreview();
      return;
    }

    // If we're on the preview step, proceed with actual submission
    try {
      if (selectedPlanType) {
        await PlanTypeService.update(selectedPlanType.id, formData);
        toast({
          title: "Success",
          description: "Insurance plan type updated successfully",
        });
        setIsEditModalOpen(false);
      } else {
        await PlanTypeService.create(formData);
        toast({
          title: "Success",
          description: "Insurance plan type created successfully",
        });

        // Clear localStorage and reset form before closing modal to prevent race conditions
        try {
          localStorage.removeItem("planTypeFormData");
        } catch (error) {
          console.warn(
            "Failed to clear saved insurance plan type form data:",
            error,
          );
        }
        resetForm();
        setIsAddModalOpen(false);
      }
      loadPlanTypes();
    } catch (error: unknown) {
      console.error("Insurance plan type save error:", error);
      toast({
        title: "Error",
        description: "Failed to save insurance plan type",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (planTypeToDelete === null) return;

    try {
      await PlanTypeService.delete(planTypeToDelete);
      toast({
        title: "Success",
        description: "Insurance plan type deleted successfully",
      });
      await loadPlanTypes();
    } catch (error: unknown) {
      console.error("Error deleting insurance plan type:", error);
      toast({
        title: "Error",
        description: "Failed to delete insurance plan type",
        variant: "destructive",
      });
    } finally {
      setIsDeleteConfirmOpen(false);
      setPlanTypeToDelete(null);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await PlanTypeService.toggleActive(id);
      toast({
        title: "Success",
        description: "Insurance plan type status updated successfully",
      });
      loadPlanTypes();
    } catch (error: unknown) {
      console.error("Error toggling insurance plan type status:", error);
      toast({
        title: "Error",
        description: "Failed to toggle insurance plan type status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ ...defaultFormData });
    setSelectedPlanType(null);
    setCurrentStep("form");
  };

  const handleManualReset = () => {
    // Reset form data
    setFormData({ ...defaultFormData });

    // Clear localStorage
    try {
      localStorage.removeItem("planTypeFormData");
    } catch (error) {
      console.warn(
        "Failed to clear saved insurance plan type form data:",
        error,
      );
    }

    // Reset step to form
    setCurrentStep("form");

    // Show success message
    toast({
      title: "Insurance Plan Type Form Reset",
      description: "All form fields have been cleared.",
    });
  };

  const openEditModal = (planType: PlanType) => {
    setFormData({
      name: planType.name,
      slug: planType.slug,
      conflicting_plan_types: planType.conflicting_plan_types || [],
      extra_fields: { ...defaultExtraFields, ...planType.extra_fields },
      is_active: planType.is_active,
    });
    setSelectedPlanType(planType);
    setCurrentStep("form");
    setIsEditModalOpen(true);
  };

  const openAddModal = () => {
    // Only reset if no saved data exists
    const savedData = localStorage.getItem("planTypeFormData");
    if (!savedData) {
      resetForm();
    }
    setCurrentStep("form");
    setIsAddModalOpen(true);
  };

  const handleExtraFieldChange = (
    fieldKey: string,
    property: "included" | "required",
    value: boolean,
  ) => {
    const newFormData = {
      ...formData,
      extra_fields: {
        ...formData.extra_fields,
        [fieldKey]: {
          ...formData.extra_fields[fieldKey],
          [property]: value,
        },
      },
    };
    setFormData(newFormData);

    // Save to localStorage for form persistence (only for add form)
    if (!selectedPlanType) {
      try {
        localStorage.setItem("planTypeFormData", JSON.stringify(newFormData));
      } catch (error) {
        console.warn("Failed to save plan type form data:", error);
      }
    }
  };

  const handleConflictChange = (planTypeId: string, checked: boolean) => {
    const id = parseInt(planTypeId);
    const newFormData = {
      ...formData,
      conflicting_plan_types: checked
        ? [...formData.conflicting_plan_types, id]
        : formData.conflicting_plan_types.filter((ptId) => ptId !== id),
    };
    setFormData(newFormData);

    // Save to localStorage for form persistence (only for add form)
    if (!selectedPlanType) {
      try {
        localStorage.setItem("planTypeFormData", JSON.stringify(newFormData));
      } catch (error) {
        console.warn("Failed to save plan type form data:", error);
      }
    }
  };

  const filteredPlanTypes = planTypes.filter((planType) =>
    planType.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getPlanTypeName = (id: number): string => {
    const planType = planTypes.find((pt) => pt.id === id);
    return planType ? planType.name : `Insurance Plan Type ${id}`;
  };

  const renderFormModal = (
    isEdit: boolean,
    isOpen: boolean,
    onClose: () => void,
  ) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {currentStep === "form"
              ? isEdit
                ? "Edit Insurance Plan Type"
                : "Add Insurance Plan Type"
              : "Review Insurance Plan Type Information"}
          </DialogTitle>
          <DialogDescription>
            {currentStep === "form"
              ? isEdit
                ? "Update insurance plan type details, conflicts, and extra fields"
                : "Create a new insurance plan type with conflicts and extra fields"
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
                Insurance Plan Type Details
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === "form" ? (
            <>
              {/* Form content */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <ValidatedInput
                    id="name"
                    label="Insurance Plan Type Name"
                    value={formData.name}
                    onChange={(value) => {
                      const name = value;
                      const slug = name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, "");

                      // Update both name and slug in a single operation to avoid race conditions
                      const newFormData = {
                        ...formData,
                        name: name,
                        slug: slug,
                      };
                      setFormData(newFormData);

                      // Save to localStorage for form persistence (only for add form)
                      if (!selectedPlanType) {
                        try {
                          localStorage.setItem(
                            "planTypeFormData",
                            JSON.stringify(newFormData),
                          );
                        } catch (error) {
                          console.warn(
                            "Failed to save plan type form data:",
                            error,
                          );
                        }
                      }
                    }}
                    required
                    maxLength={50}
                    placeholder="e.g., Medicare Advantage, Part D, etc."
                    validationHint="Insurance plan type name (max 50 chars)"
                  />
                  <ValidatedInput
                    id="slug"
                    label="Slug"
                    value={formData.slug}
                    onChange={(value) => {
                      const newFormData = { ...formData, slug: value };
                      setFormData(newFormData);

                      // Save to localStorage for form persistence (only for add form)
                      if (!selectedPlanType) {
                        try {
                          localStorage.setItem(
                            "planTypeFormData",
                            JSON.stringify(newFormData),
                          );
                        } catch (error) {
                          console.warn(
                            "Failed to save insurance plan type form data:",
                            error,
                          );
                        }
                      }
                    }}
                    placeholder="auto-generated-from-name"
                    required
                    maxLength={60}
                    validationHint="URL-friendly identifier (max 60 chars)"
                  />
                </div>
              </div>

              {/* Conflicts */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Conflicts</h3>
                <p className="text-sm text-gray-600">
                  Select which insurance plan types conflict with this one
                </p>

                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-3">
                  {planTypes
                    .filter(
                      (pt) =>
                        !selectedPlanType || pt.id !== selectedPlanType.id,
                    )
                    .map((planType) => (
                      <div
                        key={planType.id}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          id={`conflict-${planType.id}`}
                          checked={formData.conflicting_plan_types.includes(
                            planType.id,
                          )}
                          onChange={(e) =>
                            handleConflictChange(
                              planType.id.toString(),
                              e.target.checked,
                            )
                          }
                          className="rounded"
                        />
                        <Label
                          htmlFor={`conflict-${planType.id}`}
                          className="text-sm"
                        >
                          {planType.name}
                        </Label>
                      </div>
                    ))}
                </div>
              </div>

              {/* Extra Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Extra Fields</h3>
                <p className="text-sm text-gray-600">
                  Configure which extra fields are included and required for
                  this plan type
                </p>

                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-4 text-sm font-medium border-b pb-2">
                    <span>Field</span>
                    <span className="text-center">Included</span>
                    <span className="text-center">Required</span>
                  </div>

                  {Object.entries(formData.extra_fields).map(
                    ([fieldKey, field]) => (
                      <div
                        key={fieldKey}
                        className="grid grid-cols-3 gap-4 items-center py-2"
                      >
                        <span className="text-sm">{field.label}</span>
                        <div className="flex justify-center">
                          <Switch
                            checked={field.included}
                            onCheckedChange={(checked) =>
                              handleExtraFieldChange(
                                fieldKey,
                                "included",
                                checked,
                              )
                            }
                          />
                        </div>
                        <div className="flex justify-center">
                          <Switch
                            checked={field.required}
                            onCheckedChange={(checked) =>
                              handleExtraFieldChange(
                                fieldKey,
                                "required",
                                checked,
                              )
                            }
                            disabled={!field.included}
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    handleInputChange("is_active", checked)
                  }
                />
                <Label>Active</Label>
              </div>

              <div className="flex justify-between">
                {!isEdit && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleManualReset}
                  >
                    Reset Form
                  </Button>
                )}
                {isEdit && <div></div>}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {isEdit ? "Review Information" : "Review Information"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Preview content */}
              <PlanTypePreview formData={formData} planTypes={planTypes} />

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToForm}
                >
                  Edit Information
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {isEdit
                      ? "Update Insurance Plan Type"
                      : "Create Insurance Plan Type"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">
            Loading insurance plan types...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Insurance Plan Types ({totalCount})</h2>
          <p className="text-gray-600">
            Manage insurance plan types with conflicts and extra fields
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Insurance Plan Type
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search insurance plan types by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Plan Types Table */}
      <Card>
        
        <CardContent>
          <Table className="table-fixed border-l">
            <TableHeader className="border-b border-t">
              <TableRow className="divide-x divide-gray-200">
                <TableHead className="w-48 min-w-20">Name</TableHead>
                {/* <TableHead className="w-20">Slug</TableHead> */}
                <TableHead className="w-[21%]">Conflicts</TableHead>
                <TableHead>Extra Fields</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlanTypes.map((planType) => (
                <TableRow key={planType.id} className="divide-x divide-gray-200">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-blue-600" />
                      <span className="font-medium capitalize">
                        {planType.name}
                      </span>
                    </div>
                  </TableCell>
                  {/* <TableCell>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {planType.slug}
                    </code>
                  </TableCell> */}
                  <TableCell className="whitespace-normal">
                    {planType.conflicting_plan_types &&
                    planType.conflicting_plan_types.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {planType.conflicting_plan_types
                          .slice(0, 2)
                          .map((id) => (
                            <Badge
                              key={id}
                              variant="outline"
                              className="text-xs px-2 py-1 h-auto leading-relaxed whitespace-normal"
                            >
                              {getPlanTypeName(id)}
                            </Badge>
                          ))}
                        {planType.conflicting_plan_types.length > 2 && (
                          <Badge
                            variant="outline"
                            className="text-xs px-2 py-1 h-auto leading-relaxed whitespace-normal"
                          >
                            +{planType.conflicting_plan_types.length - 2} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="px-2 py-1 h-auto leading-relaxed whitespace-nowrap"
                    >
                      {
                        Object.values(planType.extra_fields || {}).filter(
                          (f) => f.included,
                        ).length
                      }{" "}
                      included
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={planType.is_active ? "default" : "secondary"}
                      className={
                        planType.is_active ? "bg-black text-white" : ""
                      }
                    >
                      {planType.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="px-2 py-1 h-auto leading-relaxed whitespace-nowrap"
                    >
                      {planType.plans_count || 0} products
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(planType)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {/* <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(planType.id)}
                      >
                        {planType.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button> */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPlanTypeToDelete(planType.id);
                          setIsDeleteConfirmOpen(true);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredPlanTypes.length === 0 && (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm
                  ? "No insurance plan types match your search criteria."
                  : "No insurance plan types found"}
              </p>
              {!searchTerm && (
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={openAddModal}
                >
                  Add First Insurance Plan Type
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalCount)} of {totalCount} plan types
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="page-size" className="text-sm">Show:</Label>
              <Select
                value={perPage.toString()}
                onValueChange={(value) => {
                  const newPerPage = parseInt(value);
                  setPerPage(newPerPage);
                  loadPlanTypes(1, newPerPage); // Reset to first page when changing page size
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
              onClick={() => loadPlanTypes(currentPage - 1)}
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
              onClick={() => loadPlanTypes(currentPage + 1)}
              disabled={currentPage === lastPage || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      {renderFormModal(false, isAddModalOpen, () => setIsAddModalOpen(false))}
      {renderFormModal(true, isEditModalOpen, () => setIsEditModalOpen(false))}

      <ConfirmationDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={handleDelete}
        title="Delete Insurance Plan Type"
        description="Are you sure you want to delete this insurance plan type? This action cannot be undone."
        confirmButtonText="Delete"
        variant="destructive"
      />
    </div>
  );
}
