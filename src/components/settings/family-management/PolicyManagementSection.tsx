
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { 
  checkFamilyEligibility,
  inheritPoliciesFromPrimary
} from "@/services/familyManagementService";

interface PolicyManagementSectionProps {
  mockFamilyMembers: any[];
}

export const PolicyManagementSection = ({ mockFamilyMembers }: PolicyManagementSectionProps) => {
  const [selectedPolicyType, setSelectedPolicyType] = useState("");

  const policyTypes = [
    "Life Insurance",
    "Health Insurance", 
    "Auto Insurance",
    "Home Insurance",
    "Travel Insurance"
  ];

  const handlePolicyEligibilityCheck = () => {
    if (!selectedPolicyType) {
      toast({
        title: "Select Policy Type",
        description: "Please select a policy type to check eligibility",
        variant: "destructive"
      });
      return;
    }

    const result = checkFamilyEligibility(mockFamilyMembers, selectedPolicyType);
    
    toast({
      title: "Eligibility Check Complete",
      description: `${result.eligible.length} eligible, ${result.ineligible.length} ineligible members`,
    });
  };

  const handlePolicyInheritance = () => {
    const primaryMember = mockFamilyMembers.find(m => m.relationship === "Primary");
    if (!primaryMember) {
      toast({
        title: "No Primary Member",
        description: "Cannot inherit policies without a primary family member",
        variant: "destructive"
      });
      return;
    }

    const updatedMembers = inheritPoliciesFromPrimary(primaryMember, mockFamilyMembers);
    
    toast({
      title: "Policy Inheritance Complete",
      description: "Policies have been inherited by eligible family members",
    });
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold text-lg mb-4">Family Policy Management</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Policy Eligibility Check */}
        <div className="space-y-3">
          <h4 className="font-medium">Family Eligibility Check</h4>
          <Select value={selectedPolicyType} onValueChange={setSelectedPolicyType}>
            <SelectTrigger>
              <SelectValue placeholder="Select policy type" />
            </SelectTrigger>
            <SelectContent>
              {policyTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handlePolicyEligibilityCheck} 
            variant="outline" 
            className="w-full"
            disabled={!selectedPolicyType}
          >
            Check Family Eligibility
          </Button>
        </div>

        {/* Policy Inheritance */}
        <div className="space-y-3">
          <h4 className="font-medium">Policy Inheritance</h4>
          <p className="text-sm text-gray-600">
            Automatically assign policies to family members based on primary member's coverage.
          </p>
          <Button 
            onClick={handlePolicyInheritance} 
            variant="outline" 
            className="w-full"
          >
            Inherit Policies
          </Button>
        </div>
      </div>
    </div>
  );
};
