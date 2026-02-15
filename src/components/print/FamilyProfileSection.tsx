
import { FamilyMember } from "@/types/customer";

interface Dependent {
  name: string;
  relationship: string;
  policies: string[];
}

interface FamilyProfileSectionProps {
  familyMembers?: FamilyMember[];
  dependents?: Dependent[];
}

export const FamilyProfileSection = ({ familyMembers, dependents }: FamilyProfileSectionProps) => {
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

  const getDisplayName = (member: FamilyMember) => {
    if (member.firstName || member.lastName) {
      return `${member.firstName || ''} ${member.middleName ? member.middleName + ' ' : ''}${member.lastName || ''}`.trim();
    }
    return member.name || 'Unknown';
  };

  const getAddress = (member: FamilyMember) => {
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

  const getContactInfo = (member: FamilyMember) => {
    const contacts = [];
    if (member.email) contacts.push(`Email: ${member.email}`);
    if (member.cellPhone) contacts.push(`Cell: ${member.cellPhone}`);
    if (member.homePhone) contacts.push(`Home: ${member.homePhone}`);
    if (member.workPhone) contacts.push(`Work: ${member.workPhone}`);
    return contacts.join(' • ');
  };

  let content = '';

  if (familyMembers && familyMembers.length > 0) {
    content += `
      <div class="section">
        <h3>Complete Family Profile</h3>
        ${familyMembers.map(member => `
          <div class="family-card">
            <h4 style="margin-top: 0; color: #7c3aed;">
              ${getDisplayName(member)}
              ${member.gender ? `<span class="badge">${member.gender}</span>` : ''}
              ${member.maritalStatus ? `<span class="badge">${member.maritalStatus}</span>` : ''}
            </h4>
            <div class="detail-row">
              <span class="detail-label">Relationship:</span>
              <span>${member.relationship}</span>
            </div>
            ${member.dateOfBirth ? `
              <div class="detail-row">
                <span class="detail-label">Date of Birth:</span>
                <span>${new Date(member.dateOfBirth).toLocaleDateString('en-US', { timeZone: 'UTC' })}${calculateAge(member.dateOfBirth) ? ` (Age: ${calculateAge(member.dateOfBirth)})` : ''}</span>
              </div>
            ` : ''}
            ${member.ssn ? `
              <div class="detail-row">
                <span class="detail-label">SSN:</span>
                <span>***-**-${member.ssn.slice(-4)}</span>
              </div>
            ` : ''}
            ${getContactInfo(member) ? `
              <div class="detail-row">
                <span class="detail-label">Contact:</span>
                <span>${getContactInfo(member)}</span>
              </div>
            ` : ''}
            ${getAddress(member) ? `
              <div class="detail-row">
                <span class="detail-label">Address:</span>
                <span>${getAddress(member)}</span>
              </div>
            ` : ''}
            ${member.company ? `
              <div class="detail-row">
                <span class="detail-label">Company:</span>
                <span>${member.company}</span>
              </div>
            ` : ''}
            ${member.height || member.weight ? `
              <div class="detail-row">
                <span class="detail-label">Physical:</span>
                <span>${member.height || 'N/A'} • ${member.weight || 'N/A'}${member.smoker ? ` • Smoker: ${member.smoker}` : ''}</span>
              </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Policies:</span>
              <span>${member.policies.length > 0 ? member.policies.join(', ') : 'No policies'}</span>
            </div>
            ${member.notes ? `
              <div class="detail-row">
                <span class="detail-label">Notes:</span>
                <span>${member.notes}</span>
              </div>
            ` : ''}
            ${member.referral ? `
              <div class="detail-row">
                <span class="detail-label">Referral:</span>
                <span>${member.referral}</span>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  if (dependents && dependents.length > 0) {
    content += `
      <div class="section">
        <h3>Legacy Family Members</h3>
        ${dependents.map(dependent => `
          <div class="family-card">
            <h4 style="margin-top: 0; color: #f59e0b;">${dependent.name} <span class="badge badge-yellow">Legacy</span></h4>
            <div class="detail-row">
              <span class="detail-label">Relationship:</span>
              <span>${dependent.relationship}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Policies:</span>
              <span>${dependent.policies.join(', ')}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  return content;
};
