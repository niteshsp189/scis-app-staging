import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  InsuranceProduct,
  getActiveCompanies,
  getProductCategories,
} from "@/services/insuranceService";
import {
  getFieldTemplatesByCategory,
  FieldTemplate,
} from "@/services/fieldTemplatesService";
import { OptimizedFieldConfiguration } from "./OptimizedFieldConfiguration";

interface EditInsuranceProductDialogProps {
  product: InsuranceProduct;
  open: boolean;
  onClose: () => void;
  onUpdateProduct: (product: InsuranceProduct) => void;
}

export function EditInsuranceProductDialog({
  product,
  open,
  onClose,
  onUpdateProduct,
}: EditInsuranceProductDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    companyId: "",
    category: "",
    status: "Draft" as "Active" | "Inactive" | "Draft",
    defaultTermLength: 12,
    defaultTermUnit: "months" as "months" | "years",
    allowTermOverride: false,
    annualPremium: "",
    installmentFee: "",
    isActive: true,
  });

  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [fieldTemplates, setFieldTemplates] = useState<FieldTemplate[]>([]);

  const companies = getActiveCompanies();
  const categories = getProductCategories();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        companyId: product.companyId.toString(),
        category: product.category,
        status: product.status,
        defaultTermLength: product.default_term_length || 12,
        defaultTermUnit: product.default_term_unit || "months",
        allowTermOverride: product.allow_term_override || false,
        annualPremium: product.annual_premium?.toString() || "",
        installmentFee: product.installment_fee?.toString() || "",
        isActive: product.status === "Active",
      });
      setFieldValues(product.fieldValues);

      // Load field templates for the category
      const templates = getFieldTemplatesByCategory(product.category);

      // Match existing product fields with templates
      const updatedTemplates = templates.map((template) => {
        const existingField = product.fields.find(
          (f) => f.id === template.id || f.name === template.name,
        );
        if (existingField) {
          return {
            ...template,
            enabled: true,
            required: existingField.required,
          };
        }
        return template;
      });

      setFieldTemplates(updatedTemplates);
    }
  }, [product]);

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

  const renderField = (field: FieldTemplate) => {
    const value = fieldValues[field.name] || "";

    switch (field.type) {
      case "select":
        return (
          <Select
            value={value}
            onValueChange={(val) => handleFieldValueChange(field.name, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) =>
              handleFieldValueChange(
                field.name,
                parseFloat(e.target.value) || 0,
              )
            }
            placeholder={`Enter ${field.label}`}
            required={field.required}
          />
        );
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldValueChange(field.name, e.target.value)}
            required={field.required}
          />
        );
      case "boolean":
        return (
          <Select
            value={value.toString()}
            onValueChange={(val) =>
              handleFieldValueChange(field.name, val === "true")
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleFieldValueChange(field.name, e.target.value)}
            placeholder={`Enter ${field.label}`}
            required={field.required}
          />
        );
    }
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

    // Update product fields based on enabled templates
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

    const updatedProduct: InsuranceProduct = {
      ...product,
      name: formData.name,
      description: formData.description,
      companyId: parseInt(formData.companyId),
      category: formData.category,
      status: formData.isActive ? "Active" : "Inactive",
      companyName: selectedCompany?.name || "",
      fields: enabledFields,
      fieldValues,
      default_term_length: formData.defaultTermLength,
      default_term_unit: formData.defaultTermUnit,
      allow_term_override: formData.allowTermOverride,
      annual_premium: formData.annualPremium
        ? parseFloat(formData.annualPremium)
        : undefined,
      installment_fee: formData.installmentFee
        ? parseFloat(formData.installmentFee)
        : undefined,
    };

    onUpdateProduct(updatedProduct);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Insurance Product</DialogTitle>
          <DialogDescription>
            Update product information and configure field settings
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="common">Common Fields</TabsTrigger>
              <TabsTrigger value="custom">Custom Fields</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "Active" | "Inactive") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Insurance Company *</Label>
                  <Select
                    value={formData.companyId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, companyId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                </div>
                <div>
                  <Label htmlFor="category">Plan Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="annualPremium">Annual Premium ($)</Label>
                  <Input
                    id="annualPremium"
                    type="number"
                    step="0.01"
                    value={formData.annualPremium}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        annualPremium: e.target.value,
                      })
                    }
                    placeholder="Base annual premium before frequency adjustments"
                  />
                </div>
                <div>
                  <Label htmlFor="installmentFee">Installment Fee ($)</Label>
                  <Input
                    id="installmentFee"
                    type="number"
                    step="0.01"
                    value={formData.installmentFee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        installmentFee: e.target.value,
                      })
                    }
                    placeholder="Fee added per installment for non-annual payments"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="activeProduct"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="activeProduct">Active Product</Label>
              </div>
            </TabsContent>

            <TabsContent value="common" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Policy Number and Agent fields are
                  already included in the policy form by default. Only enable
                  Start Date Override if agents should be able to override the
                  auto-calculated start date.
                </p>
              </div>

              {/* Term Length Configuration */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">
                  Default Policy Term
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultTermLength">
                      Default Term Length *
                    </Label>
                    <Select
                      value={formData.defaultTermLength.toString()}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          defaultTermLength: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12</SelectItem>
                        <SelectItem value="24">24</SelectItem>
                        <SelectItem value="36">36</SelectItem>
                        <SelectItem value="48">48</SelectItem>
                        <SelectItem value="60">60</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="defaultTermUnit">Term Unit *</Label>
                    <Select
                      value={formData.defaultTermUnit}
                      onValueChange={(value: "months" | "years") =>
                        setFormData({ ...formData, defaultTermUnit: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="months">Months</SelectItem>
                        <SelectItem value="years">Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowTermOverride"
                    checked={formData.allowTermOverride}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, allowTermOverride: checked })
                    }
                  />
                  <Label htmlFor="allowTermOverride" className="text-sm">
                    Allow term length override in policy creation
                  </Label>
                </div>
              </div>

              {/* Start Date Override */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="startDateOverride"
                  checked={false}
                  onCheckedChange={() => {}}
                />
                <Label htmlFor="startDateOverride" className="text-sm">
                  Start Date Override
                </Label>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              {fieldTemplates.length > 0 && (
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

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package2 className="h-5 w-5" />
                        Product Field Values
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {fieldTemplates
                          .filter((template) => template.enabled)
                          .map((template) => (
                            <div key={template.id}>
                              <Label htmlFor={template.name}>
                                {template.label} {template.required && "*"}
                              </Label>
                              {renderField(template)}
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Update Product</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
