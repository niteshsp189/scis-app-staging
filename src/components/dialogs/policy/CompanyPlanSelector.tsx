
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, FileText, DollarSign } from "lucide-react";

interface Company {
  id: number;
  name: string;
  status: string;
  plansCount?: number;
}

interface InsurancePlan {
  id: number;
  name: string;
  companyId: number;
  planType: string;
  premium: number;
  status: string;
  description?: string;
}

interface CompanyPlanSelectorProps {
  companies: Company[];
  insurancePlans: InsurancePlan[];
  selectedCompanyId: string;
  selectedPlanId: string;
  onCompanyChange: (companyId: string) => void;
  onPlanChange: (planId: string) => void;
}

export const CompanyPlanSelector = ({
  companies,
  insurancePlans,
  selectedCompanyId,
  selectedPlanId,
  onCompanyChange,
  onPlanChange
}: CompanyPlanSelectorProps) => {
  const filteredPlans = selectedCompanyId 
    ? insurancePlans.filter(plan => 
        plan.companyId === parseInt(selectedCompanyId) && 
        plan.status === "Active"
      )
    : [];

  const selectedCompany = selectedCompanyId 
    ? companies.find(c => c.id === parseInt(selectedCompanyId))
    : null;

  const selectedPlan = selectedPlanId 
    ? filteredPlans.find(p => p.id === parseInt(selectedPlanId))
    : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
        <div>
          <Label htmlFor="company">Insurance Company *</Label>
          <Select value={selectedCompanyId} onValueChange={onCompanyChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              {companies
                .filter(company => company.status === "Active")
                .map((company) => (
                <SelectItem key={company.id} value={company.id.toString()}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{company.name}</span>
                      <span className="text-xs text-gray-500">
                        {company.plansCount || 0} plans available
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCompany && (
            <p className="text-xs text-gray-600 mt-1">
              Status: {selectedCompany.status}
            </p>
          )}
        </div>
        
        <div>
          <Label htmlFor="plan">Insurance Plan *</Label>
          <Select value={selectedPlanId} onValueChange={onPlanChange} disabled={!selectedCompanyId}>
            <SelectTrigger>
              <SelectValue placeholder="Select plan" />
            </SelectTrigger>
            <SelectContent>
              {filteredPlans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id.toString()}>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      <span>{plan.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{plan.planType}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>{plan.premium}/month</span>
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filteredPlans.length === 0 && selectedCompanyId && (
            <p className="text-xs text-orange-600 mt-1">
              No active plans available for this company
            </p>
          )}
        </div>
      </div>

      {selectedPlan && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm text-gray-900 mb-2">Selected Plan Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Plan Type:</span>
              <p className="font-medium">{selectedPlan.planType}</p>
            </div>
            <div>
              <span className="text-gray-500">Monthly Premium:</span>
              <p className="font-medium">${selectedPlan.premium}</p>
            </div>
            {selectedPlan.description && (
              <div className="col-span-2">
                <span className="text-gray-500">Description:</span>
                <p className="font-medium">{selectedPlan.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
