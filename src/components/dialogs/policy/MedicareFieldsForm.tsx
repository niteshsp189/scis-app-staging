
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MedicareData {
  medicareNumber: string;
  pdpSerial: string;
  partAEffectiveDate: string;
  partBEffectiveDate: string;
  paymentMode: string;
  applicationMailedDate: string;
  policyMailedDate: string;
  credit: string;
  payment: string;
}

interface MedicareFieldsFormProps {
  medicareData: MedicareData;
  onMedicareDataChange: (field: keyof MedicareData, value: string) => void;
}

export const MedicareFieldsForm = ({ medicareData, onMedicareDataChange }: MedicareFieldsFormProps) => {
  return (
    <div className="p-4 bg-green-50 rounded-lg space-y-4">
      <h3 className="font-medium text-green-800">Medicare Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="medicareNumber">Medicare Number</Label>
          <Input
            id="medicareNumber"
            value={medicareData.medicareNumber}
            onChange={(e) => onMedicareDataChange('medicareNumber', e.target.value)}
            placeholder="Medicare number"
          />
        </div>
        <div>
          <Label htmlFor="pdpSerial">PDP Serial</Label>
          <Input
            id="pdpSerial"
            value={medicareData.pdpSerial}
            onChange={(e) => onMedicareDataChange('pdpSerial', e.target.value)}
            placeholder="PDP serial number"
          />
        </div>
        <div>
          <Label htmlFor="partAEffectiveDate">Part A Effective Date</Label>
          <Input
            id="partAEffectiveDate"
            type="date"
            value={medicareData.partAEffectiveDate}
            onChange={(e) => onMedicareDataChange('partAEffectiveDate', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="partBEffectiveDate">Part B Effective Date</Label>
          <Input
            id="partBEffectiveDate"
            type="date"
            value={medicareData.partBEffectiveDate}
            onChange={(e) => onMedicareDataChange('partBEffectiveDate', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="paymentMode">Payment Mode</Label>
          <Select 
            value={medicareData.paymentMode} 
            onValueChange={(value) => onMedicareDataChange('paymentMode', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Monthly">Monthly</SelectItem>
              <SelectItem value="Quarterly">Quarterly</SelectItem>
              <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
              <SelectItem value="Annual">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="applicationMailedDate">Application Mailed Date</Label>
          <Input
            id="applicationMailedDate"
            type="date"
            value={medicareData.applicationMailedDate}
            onChange={(e) => onMedicareDataChange('applicationMailedDate', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="policyMailedDate">Policy Mailed Date</Label>
          <Input
            id="policyMailedDate"
            type="date"
            value={medicareData.policyMailedDate}
            onChange={(e) => onMedicareDataChange('policyMailedDate', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="credit">Credit</Label>
          <Input
            id="credit"
            type="number"
            step="0.01"
            value={medicareData.credit}
            onChange={(e) => onMedicareDataChange('credit', e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <Label htmlFor="payment">Payment</Label>
          <Input
            id="payment"
            type="number"
            step="0.01"
            value={medicareData.payment}
            onChange={(e) => onMedicareDataChange('payment', e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>
    </div>
  );
};
