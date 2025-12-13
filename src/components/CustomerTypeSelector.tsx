
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export type CustomerType = "Individual" | "Business";

interface CustomerTypeSelectorProps {
  value: CustomerType;
  onChange: (type: CustomerType) => void;
  readonly?: boolean;
}

export function CustomerTypeSelector({ value, onChange, readonly = false }: CustomerTypeSelectorProps) {
  const typeOptions = [
    { value: "Individual", label: "Individual", class: "bg-green-100 text-green-800" },
    { value: "Business", label: "Business", class: "bg-blue-100 text-blue-800" }
  ];

  const currentType = typeOptions.find(option => option.value === value);

  if (readonly) {
    return (
      <Badge className={currentType?.class}>
        {currentType?.label}
      </Badge>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {typeOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${option.class}`}></div>
              {option.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
