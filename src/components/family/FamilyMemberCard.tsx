
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Edit, Trash2, Phone, Mail, MapPin } from "lucide-react";
import { FamilyMember } from "@/types/customer";

interface FamilyMemberCardProps {
  member: FamilyMember;
  onEdit: (member: FamilyMember) => void;
  onDelete: (memberId: number) => void;
}

export const FamilyMemberCard = ({ member, onEdit, onDelete }: FamilyMemberCardProps) => {
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getDisplayName = () => {
    if (member.firstName || member.lastName) {
      return `${member.firstName || ''} ${member.middleName ? member.middleName + ' ' : ''}${member.lastName || ''}`.trim();
    }
    return member.name || 'Unknown';
  };

  const getPrimaryPhone = () => {
    return member.cellPhone || member.homePhone || member.workPhone || member.phone || '';
  };

  const getAddress = () => {
    if (!member.address) return '';
    let address = member.address;
    if (member.apartment) {
      address += ` ${member.apartmentType || 'Apt'} ${member.apartment}`;
    }
    if (member.city && member.state) {
      address += `, ${member.city}, ${member.state}`;
    }
    if (member.zipCode) {
      address += ` ${member.zipCode}`;
    }
    return address;
  };

  return (
    <div className="flex items-start justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3 flex-1">
        <div className="p-2 bg-purple-100 rounded-full shrink-0">
          <User className="h-4 w-4 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-medium text-gray-900">{getDisplayName()}</h4>
            <Badge variant="outline" className="text-xs">{member.relationship}</Badge>
            {member.gender && (
              <Badge variant="secondary" className="text-xs">{member.gender}</Badge>
            )}
            {member.dateOfBirth && (
              <Badge variant="secondary" className="text-xs">
                Age {calculateAge(member.dateOfBirth)}
              </Badge>
            )}
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            {member.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span className="truncate">{member.email}</span>
              </div>
            )}
            {getPrimaryPhone() && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{getPrimaryPhone()}</span>
              </div>
            )}
            {getAddress() && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{getAddress()}</span>
              </div>
            )}
            {member.company && (
              <div className="text-xs text-blue-600">
                Company: {member.company}
              </div>
            )}
          </div>
          
          {member.policies.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {member.policies.map((policy, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {policy}
                </Badge>
              ))}
            </div>
          )}
          
          {member.notes && (
            <p className="text-xs text-gray-500 mt-2 italic">{member.notes}</p>
          )}
          
          {/* Additional details for comprehensive view */}
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
            {member.maritalStatus && (
              <span>• {member.maritalStatus}</span>
            )}
            {member.smoker && (
              <span>• Smoker: {member.smoker}</span>
            )}
            {member.ssn && (
              <span>• SSN: ***-**-{member.ssn.slice(-4)}</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex gap-1 shrink-0 ml-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(member)}
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(member.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
