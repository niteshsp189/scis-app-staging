
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { FamilyMemberForm } from "./family/FamilyMemberForm";
import { FamilyMemberCard } from "./family/FamilyMemberCard";
import { FamilyMember } from "@/types/customer";

interface FamilyMembersCardProps {
  customerId: number;
  familyId: string;
  familyMembers: FamilyMember[];
  onUpdateFamilyMembers: (members: FamilyMember[]) => void;
}

export const FamilyMembersCard = ({ 
  customerId, 
  familyId, 
  familyMembers, 
  onUpdateFamilyMembers 
}: FamilyMembersCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  const handleSubmit = (formData: Omit<FamilyMember, 'id'>) => {
    if (editingMember) {
      const updatedMembers = familyMembers.map(member =>
        member.id === editingMember.id
          ? { ...member, ...formData }
          : member
      );
      onUpdateFamilyMembers(updatedMembers);
      toast({
        title: "Family Member Updated",
        description: "Family member information has been updated successfully."
      });
    } else {
      const newMember: FamilyMember = {
        id: Date.now(),
        ...formData
      };
      onUpdateFamilyMembers([...familyMembers, newMember]);
      toast({
        title: "Family Member Added",
        description: "New family member has been added successfully."
      });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (member: FamilyMember) => {
    setEditingMember(member);
    setIsDialogOpen(true);
  };

  const handleDelete = (memberId: number) => {
    const updatedMembers = familyMembers.filter(member => member.id !== memberId);
    onUpdateFamilyMembers(updatedMembers);
    toast({
      title: "Family Member Removed",
      description: "Family member has been removed successfully."
    });
  };

  const resetForm = () => {
    setEditingMember(null);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Family Members
            <Badge variant="outline" className="ml-2">
              Family ID: {familyId}
            </Badge>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-1" />
            Add Member
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {familyMembers.length > 0 ? (
          <div className="space-y-3">
            {familyMembers.map((member) => (
              <FamilyMemberCard
                key={member.id}
                member={member}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No family members added yet</p>
            <p className="text-sm">Click "Add Member" to start building the family profile</p>
          </div>
        )}
      </CardContent>

      <FamilyMemberForm
        member={editingMember}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        onReset={resetForm}
      />
    </Card>
  );
};
