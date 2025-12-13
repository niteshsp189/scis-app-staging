
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, ChevronDown } from "lucide-react";
import { CustomerData } from "@/types/customer";
import { Policy } from "@/types/policy";
import SimplifiedPolicyForm from "./policy/SimplifiedPolicyForm";
import { PlanTypeService, type PlanType } from "@/services/PlanTypeService"; 
import SimplifiedPlanService, { SimplifiedPlan } from "@/services/SimplifiedPlanService";
import { toast } from "@/components/ui/use-toast";
import { formatPermissionError, isPermissionError, getErrorData } from "@/utils/permissionErrorHandler";

// Extended PlanType interface with counts
interface PlanTypeWithCounts extends PlanType {
  planCount?: number;
  companyCount?: number;
}

interface AddPolicyDialogProps {
  onAddPolicy: (policy: Policy) => void;
  customer?: CustomerData;
}

export const AddPolicyDialog = ({ onAddPolicy, customer }: AddPolicyDialogProps) => {
  const [open, setOpen] = useState(false);
  const [planTypes, setPlanTypes] = useState<PlanTypeWithCounts[]>([]);
  const [selectedPlanType, setSelectedPlanType] = useState<PlanTypeWithCounts | null>(null);
  const [loading, setLoading] = useState(false);

  // Multi-step state
  const [currentStep, setCurrentStep] = useState<'form' | 'preview'>('form');

  useEffect(() => {
    loadPlanTypes();
  }, []);

  // Initialize form data from localStorage on component mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('addPolicyFormData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Restore dialog state if it was saved
        if (parsedData.open !== undefined) {
          setOpen(parsedData.open);
        }
        if (parsedData.selectedPlanType) {
          setSelectedPlanType(parsedData.selectedPlanType);
        }
        if (parsedData.currentStep) {
          setCurrentStep(parsedData.currentStep);
        }
      }
    } catch (error) {
      console.warn('Failed to load saved policy form data:', error);
    }
  }, []);

  const loadPlanTypes = async () => {
    try {
      setLoading(true);
      
      // Fetch both plan types and simplified plans
      const [planTypesResponse, simplifiedPlansResponse] = await Promise.all([
        PlanTypeService.getAll(),
        SimplifiedPlanService.getAll().catch(() => ({ data: [], total: 0, current_page: 1, last_page: 1 })) // Fallback to empty response object
      ]);
      
      // Handle different response formats for plan types
      const planTypesArray = Array.isArray(planTypesResponse) ? planTypesResponse : planTypesResponse.data || [];
      const activePlanTypes = planTypesArray.filter((pt: PlanType) => pt.is_active);
      
      // Extract the data array from simplified plans response
      const simplifiedPlansArray = Array.isArray(simplifiedPlansResponse) 
        ? simplifiedPlansResponse 
        : simplifiedPlansResponse?.data || [];
      
      // Calculate counts for each plan type
      const planTypesWithCounts: PlanTypeWithCounts[] = activePlanTypes.map(planType => {
        // Filter simplified plans by plan type
        const plansForThisType = simplifiedPlansArray.filter((plan: SimplifiedPlan) => 
          plan.plan_type_id === planType.id && plan.is_active
        );
        
        // Get unique companies for this plan type
        const uniqueCompanies = new Set(
          plansForThisType
            .filter((plan: SimplifiedPlan) => plan.insurance_company_id)
            .map((plan: SimplifiedPlan) => plan.insurance_company_id)
        );
        
        return {
          ...planType,
          planCount: plansForThisType.length,
          companyCount: uniqueCompanies.size
        };
      });
      
      setPlanTypes(planTypesWithCounts);
    } catch (error: any) {
      console.error("Failed to load plan types:", error);
      
      if (isPermissionError(error)) {
        const errorData = getErrorData(error);
        toast({
          title: "Insufficient Permissions",
          description: formatPermissionError(errorData),
          variant: "default",
          className: "bg-blue-50 border-blue-200",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to load plan types. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlanTypeSelect = (planType: PlanTypeWithCounts) => {
    setSelectedPlanType(planType);
    setOpen(true);
    setCurrentStep('form'); // Reset to form step when selecting new plan type
    
    // Save to localStorage
    try {
      localStorage.setItem('addPolicyFormData', JSON.stringify({
        open: true,
        selectedPlanType: planType,
        currentStep: 'form'
      }));
    } catch (error) {
      console.warn('Failed to save policy form data:', error);
    }
  };

  const handleAddPolicy = (policy: Policy) => {
    onAddPolicy(policy);
    setOpen(false);
    setSelectedPlanType(null);
    setCurrentStep('form'); // Reset step
    
    // Clear localStorage after successful policy creation
    try {
      localStorage.removeItem('addPolicyFormData');
    } catch (error) {
      console.warn('Failed to clear saved policy form data:', error);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedPlanType(null);
    setCurrentStep('form'); // Reset step
    
    // Clear localStorage when closing
    try {
      localStorage.removeItem('addPolicyFormData');
    } catch (error) {
      console.warn('Failed to clear saved policy form data:', error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            New Policy
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto">
          {planTypes.map((planType) => (
            <DropdownMenuItem
              key={planType.id}
              onClick={() => handlePlanTypeSelect(planType)}
              className="cursor-pointer"
            >
              <div className="flex flex-col w-full">
                <span className="font-medium">{planType.name}</span>
                <span className="text-xs text-gray-500">
                  ({planType.companyCount || 0} companies, {planType.planCount || 0} plans)
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        }
      }}>
        <DialogContent 
          className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {currentStep === 'form' ? `Create New ${selectedPlanType?.name} Policy` : `Review ${selectedPlanType?.name} Policy Information`}
            </DialogTitle>
            <DialogDescription className="mt-1">
              {currentStep === 'form' 
                ? `Create a new ${selectedPlanType?.name} insurance policy for a customer.`
                : 'Please review the policy information below before submitting.'
              }
            </DialogDescription>
            
            {/* Step Indicators */}
            <div className="flex items-center justify-center space-x-4 mt-4">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 'form' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                }`}>
                  1
                </div>
                <span className={`ml-2 text-sm ${currentStep === 'form' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  Policy Details
                </span>
              </div>
              
              <div className={`w-8 h-0.5 ${currentStep === 'preview' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'
                }`}>
                  2
                </div>
                <span className={`ml-2 text-sm ${currentStep === 'preview' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  Review & Submit
                </span>
              </div>
            </div>
          </DialogHeader>

          {/* Form Content */}
          <div className="space-y-6">
            {selectedPlanType && (
              <SimplifiedPolicyForm
                planType={selectedPlanType}
                customer={customer}
                onAddPolicy={handleAddPolicy}
                onCancel={handleClose}
                currentStep={currentStep}
                onProceedToPreview={() => setCurrentStep('preview')}
                onBackToForm={() => setCurrentStep('form')}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
