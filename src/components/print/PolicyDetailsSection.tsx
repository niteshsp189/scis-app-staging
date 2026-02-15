
interface PolicyDetails {
  policyNumber: string;
  coverage: string;
  deductible: string;
  premium: string;
  startDate: string;
  endDate: string;
  vehicle?: string;
  licensePlate?: string;
  property?: string;
  propertyType?: string;
  beneficiary?: string;
  type?: string;
  network?: string;
}

interface PolicyDetailsSectionProps {
  policies: string[];
  nextRenewal: string;
}

export const PolicyDetailsSection = ({ policies, nextRenewal }: PolicyDetailsSectionProps) => {
  const getPolicyDetails = (policyName: string): PolicyDetails => {
    const mockPolicyDetails: Record<string, PolicyDetails> = {
      "Auto Insurance": {
        policyNumber: "AUTO-2024-001",
        coverage: "$100,000",
        deductible: "$500",
        premium: "$1,200/year",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        vehicle: "2022 Toyota Camry",
        licensePlate: "ABC-123"
      },
      "Home Insurance": {
        policyNumber: "HOME-2024-002",
        coverage: "$500,000",
        deductible: "$1,000",
        premium: "$2,400/year",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        property: "123 Main Street, Anytown, CA",
        propertyType: "Single Family Home"
      },
      "Life Insurance": {
        policyNumber: "LIFE-2024-003",
        coverage: "$250,000",
        deductible: "N/A",
        premium: "$600/year",
        startDate: "2024-01-01",
        endDate: "2034-12-31",
        beneficiary: "Spouse",
        type: "Term Life"
      },
      "Health Insurance": {
        policyNumber: "HEALTH-2024-004",
        coverage: "$50,000",
        deductible: "$2,000",
        premium: "$4,800/year",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        network: "Blue Cross Network",
        type: "PPO Plan"
      }
    };
    
    return mockPolicyDetails[policyName] || {
      policyNumber: "N/A",
      coverage: "N/A",
      deductible: "N/A",
      premium: "N/A",
      startDate: "N/A",
      endDate: "N/A"
    };
  };

  return `
    <div class="section">
      <h3>Complete Policy Details</h3>
      ${policies.map(policy => {
        const details = getPolicyDetails(policy);
        return `
          <div class="policy-card">
            <h4 style="margin-top: 0; color: #1e40af;">${policy}</h4>
            <div class="detail-row">
              <span class="detail-label">Policy Number:</span>
              <span>${details.policyNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Coverage Amount:</span>
              <span>${details.coverage}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Deductible:</span>
              <span>${details.deductible}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Annual Premium:</span>
              <span>${details.premium}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Policy Period:</span>
              <span>${details.startDate} to ${details.endDate}</span>
            </div>
            ${details.vehicle ? `
              <div class="detail-row">
                <span class="detail-label">Vehicle:</span>
                <span>${details.vehicle}</span>
              </div>
            ` : ''}
            ${details.licensePlate ? `
              <div class="detail-row">
                <span class="detail-label">License Plate:</span>
                <span>${details.licensePlate}</span>
              </div>
            ` : ''}
            ${details.property ? `
              <div class="detail-row">
                <span class="detail-label">Property:</span>
                <span>${details.property}</span>
              </div>
            ` : ''}
            ${details.propertyType ? `
              <div class="detail-row">
                <span class="detail-label">Property Type:</span>
                <span>${details.propertyType}</span>
              </div>
            ` : ''}
            ${details.beneficiary ? `
              <div class="detail-row">
                <span class="detail-label">Beneficiary:</span>
                <span>${details.beneficiary}</span>
              </div>
            ` : ''}
            ${details.type ? `
              <div class="detail-row">
                <span class="detail-label">Type:</span>
                <span>${details.type}</span>
              </div>
            ` : ''}
            ${details.network ? `
              <div class="detail-row">
                <span class="detail-label">Network:</span>
                <span>${details.network}</span>
              </div>
            ` : ''}
            <div style="margin-top: 10px;">
              <span class="badge badge-green">Active</span>
              <span class="badge badge-blue">Renewal Due: ${new Date(nextRenewal).toLocaleDateString('en-US', { timeZone: 'UTC' })}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
};
