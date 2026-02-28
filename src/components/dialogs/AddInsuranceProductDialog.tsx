import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  getFieldTemplatesByCategory,
  FieldTemplate,
} from "@/services/fieldTemplatesService";
import { getActiveCompanies } from "@/services/insuranceDataService";
import { OptimizedFieldConfiguration } from "./OptimizedFieldConfiguration";
import { ProductBasicInfoForm } from "./add-product/ProductBasicInfoForm";
import { CommonPolicyFieldsSection } from "./add-product/CommonPolicyFieldsSection";
import { FieldValuesSection } from "./add-product/FieldValuesSection";

interface AddInsuranceProductDialogProps {
  onAddProduct: (product: any) => void;
}

export function AddInsuranceProductDialog({
  onAddProduct,
}: AddInsuranceProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    companyId: "",
    category: "",
    status: "Active" as const,
    defaultTermLength: 12,
    defaultTermUnit: "months" as const,
    allowTermOverride: false,
  });

  // Common policy fields
  const [commonFields, setCommonFields] = useState({
    hasCompanyField: true,
    hasPolicyNumberField: true,
    hasAgentOfRecordField: true,
    hasWritingAgentField: true,
    hasStartDateField: true,
  });

  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [fieldTemplates, setFieldTemplates] = useState<FieldTemplate[]>([]);

  const companies = getActiveCompanies();

  // Load field templates when category changes
  useEffect(() => {
    if (formData.category) {
      const templates = getFieldTemplatesByCategory(formData.category);

      setFieldTemplates([...templates]);

      // Set default values for template fields
      const defaultValues: Record<string, any> = {};
      templates.forEach((template) => {
        if (template.defaultValue && template.enabled) {
          defaultValues[template.name] = template.defaultValue;
        }
      });
      setFieldValues(defaultValues);
    }
  }, [formData.category]);

  const handleFieldEnabledChange = (fieldId: string, enabled: boolean) => {
    setFieldTemplates((prev) =>
      prev.map((template) =>
        template.id === fieldId ? { ...template, enabled } : template,
      ),
    );
  };

  const handleFieldRequiredChange = (fieldId: string, required: boolean) => {
    setFieldTemplates((prev) =>
      prev.map((template) =>
        template.id === fieldId ? { ...template, required } : template,
      ),
    );
  };

  const handleEnableAll = () => {
    setFieldTemplates((prev) =>
      prev.map((template) => ({ ...template, enabled: true })),
    );
  };

  const handleEnableRequired = () => {
    setFieldTemplates((prev) =>
      prev.map((template) => ({
        ...template,
        enabled: template.required,
      })),
    );
  };

  const handleReset = () => {
    if (formData.category) {
      const templates = getFieldTemplatesByCategory(formData.category);
      setFieldTemplates([...templates]);
    }
  };

  const handleFieldValueChange = (fieldName: string, value: any) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.companyId || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const selectedCompany = companies.find(
      (c) => c.id === parseInt(formData.companyId),
    );

    // Combine common fields with enabled template fields
    const commonPolicyFields = [
      ...(commonFields.hasCompanyField
        ? [
            {
              id: "company",
              name: "company",
              label: "Company",
              type: "select",
              required: true,
            },
          ]
        : []),
      ...(commonFields.hasPolicyNumberField
        ? [
            {
              id: "policy_number",
              name: "policyNumber",
              label: "Policy Number",
              type: "text",
              required: true,
            },
          ]
        : []),
      ...(commonFields.hasAgentOfRecordField
        ? [
            {
              id: "agent_of_record",
              name: "agentOfRecord",
              label: "Agent of Record",
              type: "select",
              required: false,
            },
          ]
        : []),
      ...(commonFields.hasWritingAgentField
        ? [
            {
              id: "writing_agent",
              name: "writingAgent",
              label: "Writing Agent",
              type: "select",
              required: false,
            },
          ]
        : []),
      ...(commonFields.hasStartDateField
        ? [
            {
              id: "start_date",
              name: "startDate",
              label: "Start Date",
              type: "date",
              required: true,
            },
          ]
        : []),
    ];

    const enabledFields = fieldTemplates
      .filter((template) => template.enabled)
      .map((template) => ({
        id: template.id,
        name: template.name,
        label: template.label,
        type: template.type,
        required: template.required,
        options: template.options,
      }));

    const product = {
      ...formData,
      companyId: parseInt(formData.companyId),
      companyName: selectedCompany?.name || "",
      fields: [...commonPolicyFields, ...enabledFields],
      fieldValues,
      commonFields,
    };

    onAddProduct(product);
    setOpen(false);

    // Reset form
    setFormData({
      name: "",
      description: "",
      companyId: "",
      category: "",
      status: "Active",
      defaultTermLength: 12,
      defaultTermUnit: "months",
      allowTermOverride: false,
    });
    setFieldValues({});
    setFieldTemplates([]);
    setCommonFields({
      hasCompanyField: true,
      hasPolicyNumberField: true,
      hasAgentOfRecordField: true,
      hasWritingAgentField: true,
      hasStartDateField: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Insurance Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Insurance Product</DialogTitle>
          <DialogDescription>
            Create a new insurance product with optimized field configuration
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="common">Common Fields</TabsTrigger>
              <TabsTrigger value="custom">Custom Fields</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <ProductBasicInfoForm
                formData={formData}
                onUpdate={(updates) =>
                  setFormData((prev) => ({ ...prev, ...updates }))
                }
              />
            </TabsContent>

            <TabsContent value="common" className="space-y-6">
              <CommonPolicyFieldsSection
                commonFields={commonFields}
                onUpdate={(updates) =>
                  setCommonFields((prev) => ({ ...prev, ...updates }))
                }
                allowTermOverride={formData.allowTermOverride}
                onAllowTermOverrideChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    allowTermOverride: checked,
                  }))
                }
              />
            </TabsContent>

            <TabsContent value="custom" className="space-y-6">
              {/* Auto Field Configuration - Only shown when category is selected */}
              {formData.category && fieldTemplates.length > 0 ? (
                <>
                  <OptimizedFieldConfiguration
                    category={formData.category}
                    fieldTemplates={fieldTemplates}
                    onEnabledChange={handleFieldEnabledChange}
                    onRequiredChange={handleFieldRequiredChange}
                    onEnableAll={handleEnableAll}
                    onEnableRequired={handleEnableRequired}
                    onReset={handleReset}
                  />

                  <FieldValuesSection
                    fieldTemplates={fieldTemplates}
                    fieldValues={fieldValues}
                    onFieldValueChange={handleFieldValueChange}
                  />
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Select a plan category in Basic Information to configure
                    custom fields.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Product</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
