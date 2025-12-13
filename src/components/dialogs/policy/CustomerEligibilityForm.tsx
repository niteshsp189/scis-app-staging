
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomerData } from "@/types/customer";

interface CustomerEligibilityFormProps {
  customer?: CustomerData;
  customerAge: string;
  income: string;
  employment: string;
  onAgeChange: (age: string) => void;
  onIncomeChange: (income: string) => void;
  onEmploymentChange: (employment: string) => void;
}

export const CustomerEligibilityForm = ({
  customer,
  customerAge,
  income,
  employment,
  onAgeChange,
  onIncomeChange,
  onEmploymentChange
}: CustomerEligibilityFormProps) => {
  if (!customer) return null;

  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
      <div>
        <Label htmlFor="customerAge">Customer Age</Label>
        <Input
          id="customerAge"
          type="number"
          value={customerAge}
          onChange={(e) => onAgeChange(e.target.value)}
          placeholder="Age"
        />
      </div>
      <div>
        <Label htmlFor="income">Annual Income</Label>
        <Input
          id="income"
          type="number"
          value={income}
          onChange={(e) => onIncomeChange(e.target.value)}
          placeholder="Income"
        />
      </div>
      <div>
        <Label htmlFor="employment">Employment</Label>
        <Select value={employment} onValueChange={onEmploymentChange}>
          <SelectTrigger>
            <SelectValue placeholder="Employment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Employed">Employed</SelectItem>
            <SelectItem value="Self-Employed">Self-Employed</SelectItem>
            <SelectItem value="Unemployed">Unemployed</SelectItem>
            <SelectItem value="Retired">Retired</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
