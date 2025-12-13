
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getActiveCompanies } from "@/services/insuranceDataService";

// Get product categories from the field templates service
const getProductCategories = () => ["Medicare", "Auto", "Home", "Life", "Health", "Business"];

interface ProductBasicInfoFormProps {
  formData: {
    name: string;
    description: string;
    companyId: string;
    category: string;
    status: "Draft";
    defaultTermLength: number;
    defaultTermUnit: "months" | "years";
    allowTermOverride: boolean;
  };
  onUpdate: (updates: Partial<ProductBasicInfoFormProps['formData']>) => void;
}

export function ProductBasicInfoForm({ formData, onUpdate }: ProductBasicInfoFormProps) {
  const companies = getActiveCompanies();
  const categories = getProductCategories();

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company">Insurance Company *</Label>
          <Select value={formData.companyId} onValueChange={(value) => onUpdate({ companyId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select company" />
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
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => onUpdate({ category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
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

      <div>
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Enter product name"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          rows={3}
          placeholder="Describe this insurance product..."
        />
      </div>

      {/* Default Term Length Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900">Default Policy Term</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="defaultTermLength">Default Term Length</Label>
            <Select 
              value={formData.defaultTermLength.toString()} 
              onValueChange={(value) => onUpdate({ defaultTermLength: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select term length" />
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
            <Label htmlFor="defaultTermUnit">Term Unit</Label>
            <Select 
              value={formData.defaultTermUnit} 
              onValueChange={(value: "months" | "years") => onUpdate({ defaultTermUnit: value })}
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
      </div>
    </>
  );
}
