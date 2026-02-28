import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { checkPolicyEligibility } from "@/services/policyEligibilityService";
import planConflictService from "@/services/planConflictService";
import { CustomerData } from "@/types/customer";
import { AgentAssignment } from "@/types/agent";
// ydy
export const usePolicyForm = (customer?: CustomerData, onAddPolicy?: (policy: any) => void) => {
  const [formData, setFormData] = useState({
    customerName: customer?.name || "",
    companyId: "",
    planId: "",
    policyType: "",
    premium: "",
    startDate: "",
    status: "Active",
    customerAge: "",
    income: "",
    employment: ""
  });

  const [medicareData, setMedicareData] = useState({
    medicareNumber: "",
    pdpSerial: "",
    partAEffectiveDate: "",
    partBEffectiveDate: "",
    paymentMode: "",
    applicationMailedDate: "",
    policyMailedDate: "",
    credit: "",
    payment: ""
  });

  const resetForm = () => {
    setFormData({
      customerName: customer?.name || "",
      companyId: "",
      planId: "",
      policyType: "",
      premium: "",
      startDate: "",
      status: "Active",
      customerAge: "",
      income: "",
      employment: ""
    });
    setMedicareData({
      medicareNumber: "",
      pdpSerial: "",
      partAEffectiveDate: "",
      partBEffectiveDate: "",
      paymentMode: "",
      applicationMailedDate: "",
      policyMailedDate: "",
      credit: "",
      payment: ""
    });
  };

  const selectedPolicyEligibility = formData.policyType && customer
    ? checkPolicyEligibility(
        formData.policyType,
        customer,
        formData.customerAge ? parseInt(formData.customerAge) : undefined,
        formData.income ? parseInt(formData.income) : undefined,
        formData.employment
      )
    : null;

  const conflictResult = formData.policyType && customer
    ? planConflictService.checkMultiplePlanConflicts([...customer.policies, formData.policyType])
    : null;

  const handleSubmit = (e: React.FormEvent, companies: any[], insurancePlans: any[], agentAssignment?: AgentAssignment) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.companyId || !formData.planId || !formData.startDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return false;
    }

    if (selectedPolicyEligibility && !selectedPolicyEligibility.eligible) {
      toast({
        title: "Policy Restriction",
        description: "This customer is not eligible for the selected policy type.",
        variant: "destructive",
      });
      return false;
    }

    if (conflictResult && conflictResult.hasConflict) {
      toast({
        title: "Plan Conflict",
        description: "The selected plan conflicts with existing customer policies. Please review the conflicts and choose a different plan.",
        variant: "destructive",
      });
      return false;
    }

    const selectedCompany = companies.find(c => c.id === parseInt(formData.companyId));
    const selectedPlan = insurancePlans.find(plan => plan.id === parseInt(formData.planId));

    if (onAddPolicy) {
      onAddPolicy({
        ...formData,
        ...medicareData,
        id: Date.now(),
        companyName: selectedCompany?.name || "",
        planName: selectedPlan?.name || "",
        premium: selectedPlan?.premium || parseFloat(formData.premium) || 0,
        agentAssignment
      });
    }
    
    resetForm();
    
    toast({
      title: "Policy Added",
      description: "New policy has been created successfully.",
    });

    return true;
  };

  const handleCompanyChange = (companyId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      companyId, 
      planId: "",
      policyType: "",
      premium: ""
    }));
  };

  const handlePlanChange = (planId: string, insurancePlans: any[]) => {
    const plan = insurancePlans.find(p => p.id === parseInt(planId));
    setFormData(prev => ({ 
      ...prev, 
      planId,
      policyType: plan?.planType || "",
      premium: plan?.premium.toString() || ""
    }));
  };

  const handleMedicareDataChange = (field: keyof typeof medicareData, value: string) => {
    setMedicareData(prev => ({ ...prev, [field]: value }));
  };

  return {
    formData,
    medicareData,
    setFormData,
    selectedPolicyEligibility,
    conflictResult,
    handleSubmit,
    handleCompanyChange,
    handlePlanChange,
    handleMedicareDataChange,
    resetForm
  };
};
