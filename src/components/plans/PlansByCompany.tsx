
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { Plan } from "@/types/planType";
import { PlanCard } from "./PlanCard";

interface PlansByCompanyProps {
  companyName: string;
  plans: Plan[];
  onEditPlan: (id: number) => void;
  onDeletePlan: (id: number) => void;
}

export function PlansByCompany({ companyName, plans, onEditPlan, onDeletePlan }: PlansByCompanyProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b pb-2">
        <Building2 className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">{companyName}</h3>
        <Badge variant="outline">{plans.length} plans</Badge>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 ml-4">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onEdit={onEditPlan}
            onDelete={onDeletePlan}
          />
        ))}
      </div>
    </div>
  );
}
