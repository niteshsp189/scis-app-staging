import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Users, Edit, Trash2 } from "lucide-react";
import { FamilyMemberForm } from "./FamilyMemberForm";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { CustomerData, FamilyMember } from "@/types/customer";
import { dependentService } from "@/services/dependentService";
import { PolicyService } from "@/services/policyService";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";

interface CustomerFamilyTabProps {
  customerData: CustomerData;
  onUpdateFamilyMembers?: (familyMembers: any[]) => void;
}

export const CustomerFamilyTab = ({
  customerData,
  onUpdateFamilyMembers,
}: CustomerFamilyTabProps) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [memberPolicies, setMemberPolicies] = useState<Record<number, any[]>>({});
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<number | null>(null);

  const fetchFamilyMembersAndPolicies = async () => {
    try {
      const members = await dependentService.getDependents(customerData.id);
      setFamilyMembers(members);
      
      // Fetch policies for each dependent
      const policiesMap: Record<number, any[]> = {};
      await Promise.all(
        members.map(async (member) => {
          try {
            const policies = await dependentService.getDependentPolicies(member.id);
            policiesMap[member.id] = policies || [];
          } catch (error) {
            console.error(`Failed to fetch policies for dependent ${member.id}:`, error);
            policiesMap[member.id] = [];
          }
        })
      );
      setMemberPolicies(policiesMap);
    } catch (error) {
      toast({
        title: "Error fetching dependents",
        description: "Could not load dependents. Please try again later.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchFamilyMembersAndPolicies();
  }, [customerData.id]);

  const calculateAge = (dateOfBirth: string): string | null => {
    if (!dateOfBirth) return null;
    
    try {
      const today = new Date();
      let birthDate: Date;
      
      // Handle different date formats
      if (dateOfBirth.includes('T')) {
        // ISO format with time
        birthDate = new Date(dateOfBirth);
      } else if (dateOfBirth.includes('-')) {
        // YYYY-MM-DD format
        birthDate = new Date(dateOfBirth + 'T00:00:00');
      } else {
        // Try parsing as is
        birthDate = new Date(dateOfBirth);
      }
      
      // Check if the date is valid
      if (isNaN(birthDate.getTime())) return null;
      
      const ageInMs = today.getTime() - birthDate.getTime();
      const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
      
      // For very young children (less than 1 year), show detailed age
      if (ageInDays < 365) {
        if (ageInDays < 30) {
          return `${ageInDays} day${ageInDays !== 1 ? 's' : ''}`;
        } else if (ageInDays < 365) {
          const months = Math.floor(ageInDays / 30);
          const remainingDays = ageInDays % 30;
          if (remainingDays === 0) {
            return `${months} month${months !== 1 ? 's' : ''}`;
          } else {
            return `${months} month${months !== 1 ? 's' : ''}, ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
          }
        }
      }
      
      // For older children and adults, show years
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      return `${Math.max(0, age)} year${Math.max(0, age) !== 1 ? 's' : ''}`;
    } catch (error) {
      console.warn('Failed to calculate age for date:', dateOfBirth, error);
      return null;
    }
  };

  const handleSubmitMember = async (formData: Partial<FamilyMember> & { selectedPolicyIds?: number[] }) => {
    try {
      const selectedPolicyIds = formData.selectedPolicyIds || [];

      if (editingMember) {
        const updatedMember = await dependentService.updateDependent(
          editingMember.id,
          formData,
        );

        // Update policy associations for this dependent
        try {
          // Get currently associated policies
          const currentPolicies = memberPolicies[editingMember.id] || [];
          const currentlyAssignedIds = currentPolicies.map((p) => p.id);

          const toAssign = selectedPolicyIds.filter((id) => !currentlyAssignedIds.includes(id));
          const toUnassign = currentlyAssignedIds.filter((id) => !selectedPolicyIds.includes(id));

          // Associate new policies
          for (const policyId of toAssign) {
            try {
              await PolicyService.associatePolicyWithDependent(policyId, updatedMember.id, {
                isPrimaryBeneficiary: false,
                // Let backend calculate smart coverage percentage
                notes: 'Associated via dependent management'
              });
            } catch (error) {
              console.error(`Failed to associate policy ${policyId}:`, error);
            }
          }

          // Disassociate removed policies
          for (const policyId of toUnassign) {
            try {
              await PolicyService.disassociatePolicyFromDependent(policyId, updatedMember.id);
            } catch (error) {
              console.error(`Failed to disassociate policy ${policyId}:`, error);
            }
          }
        } catch (e) {
          console.error("Failed to update policy associations", e);
          toast({
            title: "Partial Success",
            description: "Dependent updated but some policy assignments failed.",
            variant: "destructive",
          });
        }

        // Refresh the dependents and their policies
        await fetchFamilyMembersAndPolicies();
        
        toast({
          title: "Success",
          description: "Dependent updated successfully.",
        });
        
        // Only close dialog and reset on success
        setIsAddMemberOpen(false);
        setEditingMember(null);
      } else {
        const newMember = await dependentService.createDependent({
          ...formData,
          customerId: customerData.id,
        } as Partial<FamilyMember>);

        // Associate selected policies to newly created dependent
        for (const policyId of selectedPolicyIds) {
          try {
            await PolicyService.associatePolicyWithDependent(policyId, newMember.id, {
              isPrimaryBeneficiary: false,
              // Let backend calculate smart coverage percentage
              notes: 'Associated via dependent management'
            });
          } catch (error) {
            console.error(`Failed to associate policy ${policyId} to new dependent:`, error);
          }
        }

        // Refresh the dependents and their policies
        await fetchFamilyMembersAndPolicies();
        
        toast({
          title: "Success",
          description: "Dependent added successfully.",
        });
        
        // Only close dialog and reset on success
        setIsAddMemberOpen(false);
        setEditingMember(null);
      }
    } catch (error: any) {
      console.error('Error saving dependent:', error);
      
      // Check if this is a validation error (422 status code)
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const errors = error.response.data.errors;
        
        // Get the first error message for display
        const firstErrorField = Object.keys(errors)[0];
        const firstErrorMessage = Array.isArray(errors[firstErrorField]) 
          ? errors[firstErrorField][0] 
          : errors[firstErrorField];
        
        // Convert field name to readable format
        const fieldLabel = firstErrorField.replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        toast({
          title: "Validation Error",
          description: `${fieldLabel}: ${firstErrorMessage}`,
          variant: "destructive",
        });
      } else {
        // Generic error
        toast({
          title: "Error",
          description: error.message || "Failed to save dependent. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setIsAddMemberOpen(true);
  };

  const handleDeleteMember = async (memberId: number) => {
    try {
      // First disassociate all policies from this dependent
      const memberPoliciesList = memberPolicies[memberId] || [];
      
      for (const policy of memberPoliciesList) {
        try {
          await PolicyService.disassociatePolicyFromDependent(policy.id, memberId);
        } catch (error) {
          console.error(`Failed to disassociate policy ${policy.id}:`, error);
        }
      }
      
      await dependentService.deleteDependent(memberId);
      
      // Refresh the dependents and their policies
      await fetchFamilyMembersAndPolicies();
      
      toast({
        title: "Success",
        description: "Dependent removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove dependent. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Close the confirmation dialog and reset state
      setIsDeleteConfirmOpen(false);
      setMemberToDelete(null);
    }
  };

  const resetForm = () => {
    setEditingMember(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Dependencies</h3>
        <Button
          variant="default"
          size="sm"
          onClick={() => {
            setEditingMember(null);
            setIsAddMemberOpen(true);
          }}
        >
          <Users className="h-4 w-4 mr-1" />
          Add Dependent
        </Button>
      </div>

      <FamilyMemberForm
        isOpen={isAddMemberOpen}
        onOpenChange={setIsAddMemberOpen}
        editingMember={editingMember}
        onSubmit={handleSubmitMember}
        onReset={resetForm}
        customerId={customerData.id}
        customerData={customerData}
      />

      {/* Current Dependents */}
      {familyMembers.length > 0 && (
        <div className="space-y-3">
          <h5 className="font-medium text-gray-700">Dependents</h5>
          {familyMembers.map((member) => {
            const assignedPolicies = memberPolicies[member.id] || [];
            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <User className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium">
                        {member.firstName} {member.lastName}
                      </h5>
                      {member.dateOfBirth && calculateAge(member.dateOfBirth) && (
                        <Badge variant="secondary">
                          Age {calculateAge(member.dateOfBirth)}
                        </Badge>
                      )}
                      {member.relationship && (
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                          {member.relationship}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {member.email && <span>{member.email} • </span>}
                      {member.phone && <span>{member.phone}</span>}
                    </div>
                    {assignedPolicies.length > 0 ? (
                      <div className="mt-1">
                        <p className="text-xs text-blue-600 font-medium">
                          Connected to: {assignedPolicies.map((policy) => policy.policy_number).join(", ")}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <p className="text-xs text-gray-400">No policies assigned</p>
                      </div>
                    )}
                    {member.notes && (
                      <p className="text-xs text-gray-500 mt-1">{member.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditMember(member)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMemberToDelete(member.id);
                      setIsDeleteConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {familyMembers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No dependents added yet</p>
          <p className="text-sm">
            Click "Add Dependent" to start adding family members covered by this customer's policies
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={() => {
          if (memberToDelete) {
            handleDeleteMember(memberToDelete);
          }
        }}
        title="Delete Dependent"
        description="Are you sure you want to delete this dependent? This action cannot be undone and will also remove all policy associations."
        confirmButtonText="Delete"
        variant="destructive"
      />
    </div>
  );
};