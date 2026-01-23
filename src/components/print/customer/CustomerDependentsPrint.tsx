/**
 * Customer Dependents Print Section
 * Displays related people/dependents in table format
 */

import { calculateAge, getRelationshipDisplay, getPrintStatusClass } from '@/utils/printUtils';

interface Dependent {
  id: number;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  name?: string;
  dateOfBirth?: string;
  date_of_birth?: string;
  gender?: string;
  relationship?: string;
  status?: string;
  isDeceased?: boolean;
  is_deceased?: boolean;
}

interface Relationship {
  id: number;
  related_customer?: {
    id: number;
    first_name?: string;
    last_name?: string;
  };
  related_customer_name?: string;
  relationship_type: string;
  status?: string;
}

interface CustomerDependentsPrintProps {
  dependents?: Dependent[];
  relationships?: Relationship[];
}

const getDependentName = (dep: Dependent): string => {
  if (dep.name) return dep.name;
  const firstName = dep.firstName || dep.first_name || '';
  const lastName = dep.lastName || dep.last_name || '';
  return `${firstName} ${lastName}`.trim() || 'Unknown';
};

const getDependentDOB = (dep: Dependent): string | undefined => {
  return dep.dateOfBirth || dep.date_of_birth;
};

const getRelationshipName = (rel: Relationship): string => {
  if (rel.related_customer_name) return rel.related_customer_name;
  if (rel.related_customer) {
    const firstName = rel.related_customer.first_name || '';
    const lastName = rel.related_customer.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown';
  }
  return 'Unknown';
};

export const CustomerDependentsPrint = ({
  dependents = [],
  relationships = [],
}: CustomerDependentsPrintProps) => {
  // Combine dependents and relationships into a unified list
  const allRelatedPeople: Array<{
    id: string;
    name: string;
    age: number | null;
    gender: string;
    relationship: string;
    status: string;
  }> = [];

  // Add dependents
  dependents.forEach((dep) => {
    const dob = getDependentDOB(dep);
    const isDeceased = dep.isDeceased || dep.is_deceased;
    allRelatedPeople.push({
      id: `dep-${dep.id}`,
      name: getDependentName(dep),
      age: dob ? calculateAge(dob) : null,
      gender: dep.gender || 'N/A',
      relationship: dep.relationship || 'Dependent',
      status: isDeceased ? 'Deceased' : dep.status || 'Active',
    });
  });

  // Add relationships
  relationships.forEach((rel) => {
    allRelatedPeople.push({
      id: `rel-${rel.id}`,
      name: getRelationshipName(rel),
      age: null, // Relationships don't typically have age
      gender: 'N/A',
      relationship: getRelationshipDisplay(rel.relationship_type),
      status: rel.status || 'Active',
    });
  });

  if (allRelatedPeople.length === 0) {
    return (
      <div className="print-section">
        <h3 className="print-section-title">Related People</h3>
        <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No related people found.</p>
      </div>
    );
  }

  return (
    <div className="print-section">
      <h3 className="print-section-title">Related People</h3>
      
      <table className="print-table">
        <thead>
          <tr>
            <th>Name</th>
            <th style={{ width: '60px' }}>Age</th>
            <th style={{ width: '80px' }}>Gender</th>
            <th>Relation</th>
          </tr>
        </thead>
        <tbody>
          {allRelatedPeople.map((person) => (
            <tr key={person.id}>
              <td>
                <span style={{ color: '#2563eb' }}>{person.name}</span>
                {person.status === 'Deceased' && (
                  <span style={{ marginLeft: '5px', color: '#6b7280', fontSize: '9px' }}>
                    (Deceased)
                  </span>
                )}
                {person.status === 'Prospect' && (
                  <span style={{ marginLeft: '5px', color: '#92400e', fontSize: '9px' }}>
                    (Prospect)
                  </span>
                )}
              </td>
              <td>{person.age !== null ? person.age : 'N/A'}</td>
              <td>{person.gender}</td>
              <td>{person.relationship}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerDependentsPrint;
