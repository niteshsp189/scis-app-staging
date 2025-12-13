
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Layers, FileText } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Plan } from "@/types/planType";
import { AddPlanDialog } from "@/components/dialogs/AddPlanDialog";
import { EditPlanDialog } from "@/components/dialogs/EditPlanDialog";
import { mockPlans } from "@/services/insuranceDataService";
import { PlansByCompany } from "./PlansByCompany";

export function InsurancePlans() {
  const [plans, setPlans] = useState<Plan[]>(mockPlans);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const handleAddPlan = (newPlan: any) => {
    const planWithId = {
      ...newPlan,
      id: Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setPlans(prev => [...prev, planWithId]);
    toast({
      title: "Insurance Plan Added",
      description: `${newPlan.name} has been created successfully.`,
    });
  };

  const handleEditPlan = (id: number) => {
    const plan = plans.find(p => p.id === id);
    if (plan) {
      setEditingPlan(plan);
    }
  };

  const handleUpdatePlan = (updatedPlan: Plan) => {
    setPlans(prev => prev.map(p => 
      p.id === updatedPlan.id ? { ...updatedPlan, updatedAt: new Date().toISOString().split('T')[0] } : p
    ));
    setEditingPlan(null);
    toast({
      title: "Insurance Plan Updated",
      description: "Plan information has been updated successfully.",
    });
  };

  const handleDeletePlan = (id: number) => {
    setPlans(prev => prev.filter(p => p.id !== id));
    toast({
      title: "Insurance Plan Deleted",
      description: "Plan has been removed successfully.",
    });
  };

  // Group plans by company
  const companiesWithPlans = plans.reduce((acc, plan) => {
    if (!acc[plan.companyId]) {
      acc[plan.companyId] = {
        companyName: plan.companyName,
        plans: []
      };
    }
    acc[plan.companyId].plans.push(plan);
    return acc;
  }, {} as Record<number, { companyName: string; plans: Plan[] }>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Insurance Plans</h2>
          <p className="text-gray-600">Manage insurance plans with dynamic field configuration</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Companies
          </Button>
          <Button variant="outline" size="sm">
            <Layers className="h-4 w-4 mr-2" />
            Plan Types
          </Button>
          <AddPlanDialog onAddPlan={handleAddPlan} />
        </div>
      </div>

      {plans.length > 0 ? (
        Object.entries(companiesWithPlans).map(([companyId, { companyName, plans: companyPlans }]) => (
          <PlansByCompany
            key={companyId}
            companyName={companyName}
            plans={companyPlans}
            onEditPlan={handleEditPlan}
            onDeletePlan={handleDeletePlan}
          />
        ))
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No insurance plans found</h3>
          <p className="text-gray-500 mb-4">Create your first insurance plan to get started.</p>
          <AddPlanDialog onAddPlan={handleAddPlan} />
        </div>
      )}

      {editingPlan && (
        <EditPlanDialog
          plan={editingPlan}
          open={!!editingPlan}
          onClose={() => setEditingPlan(null)}
          onUpdatePlan={handleUpdatePlan}
        />
      )}
    </div>
  );
}
