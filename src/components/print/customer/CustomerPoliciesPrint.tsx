/**
 * Customer Policies Print Section
 * Displays active policies in the style of the old PHP system
 */

import {
  formatPrintDate,
  formatPrintCurrency,
  calculateIncreasePercent,
} from '@/utils/printUtils';

interface Policy {
  id: number;
  policy_number?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  premium_frequency?: string;
  outstanding_premium?: number;
  field_values?: Record<string, string | number | boolean | null> | string;
  plan?: {
    id: number;
    name?: string;
    planType?: {
      name?: string;
      extra_fields?: Record<string, string | number | boolean | null>;
    };
    plan_type?: {
      name?: string;
      extra_fields?: Record<string, string | number | boolean | null>;
    };
    company?: {
      id: number;
      name: string;
    };
  };
  primaryAgent?: {
    first_name?: string;
    last_name?: string;
  };
  primary_agent?: {
    first_name?: string;
    last_name?: string;
  };
  assistantAgent?: {
    first_name?: string;
    last_name?: string;
  };
  assistant_agent?: {
    first_name?: string;
    last_name?: string;
  };
}

interface CustomerPoliciesPrintProps {
  customerName: string;
  policies: Policy[];
  showAllPolicies?: boolean;
}

const getPremiumValue = (policy: Policy): number => {
  let fieldValues = policy.field_values;
  if (typeof fieldValues === 'string') {
    try {
      fieldValues = JSON.parse(fieldValues);
    } catch (e) {
      return 0;
    }
  }
  
  if (fieldValues && typeof fieldValues === 'object' && 'premium' in fieldValues) {
    const premiumValue = fieldValues.premium;
    if (premiumValue !== undefined && premiumValue !== null && premiumValue !== '') {
      const numericValue = parseFloat(premiumValue.toString());
      if (!isNaN(numericValue)) {
        return numericValue;
      }
    }
  }
  
  return 0;
};

const getOldPremiumValue = (policy: Policy): number | null => {
  let fieldValues = policy.field_values;
  if (typeof fieldValues === 'string') {
    try {
      fieldValues = JSON.parse(fieldValues);
    } catch (e) {
      return null;
    }
  }
  
  if (fieldValues && typeof fieldValues === 'object' && 'old_premium' in fieldValues) {
    const oldPremiumValue = fieldValues.old_premium;
    if (oldPremiumValue !== undefined && oldPremiumValue !== null && oldPremiumValue !== '') {
      const numericValue = parseFloat(oldPremiumValue.toString());
      if (!isNaN(numericValue)) {
        return numericValue;
      }
    }
  }
  
  return null;
};

const getMedicareNumber = (policy: Policy): string | null => {
  let fieldValues = policy.field_values;
  if (typeof fieldValues === 'string') {
    try {
      fieldValues = JSON.parse(fieldValues);
    } catch (e) {
      return null;
    }
  }
  
  if (fieldValues && typeof fieldValues === 'object') {
    const medicareNum = fieldValues.medicare_number || fieldValues.medicareNumber;
    return typeof medicareNum === 'string' ? medicareNum : null;
  }
  
  return null;
};

const getDeductible = (policy: Policy): number => {
  let fieldValues = policy.field_values;
  if (typeof fieldValues === 'string') {
    try {
      fieldValues = JSON.parse(fieldValues);
    } catch (e) {
      return 0;
    }
  }
  
  if (fieldValues && typeof fieldValues === 'object' && 'deductible' in fieldValues) {
    const deductibleValue = fieldValues.deductible;
    if (deductibleValue !== undefined && deductibleValue !== null && deductibleValue !== '') {
      const numericValue = parseFloat(deductibleValue.toString());
      if (!isNaN(numericValue)) {
        return numericValue;
      }
    }
  }
  
  return 0;
};

const getAgentName = (agent?: { first_name?: string; last_name?: string }): string => {
  if (!agent) return 'N/A';
  const firstName = agent.first_name || '';
  const lastName = agent.last_name || '';
  return `${firstName} ${lastName}`.trim() || 'N/A';
};

export const CustomerPoliciesPrint = ({ 
  customerName, 
  policies,
  showAllPolicies = false,
}: CustomerPoliciesPrintProps) => {
  // Filter policies based on mode
  const displayPolicies = showAllPolicies 
    ? policies 
    : policies.filter(
        (p) => p.status?.toLowerCase() === 'active' || p.status?.toLowerCase() === 'in force'
      );

  const sectionTitle = showAllPolicies 
    ? `All Policies for: ${customerName}` 
    : `Active Policies for: ${customerName}`;

  if (displayPolicies.length === 0) {
    return (
      <div className="print-section">
        <h3 className="print-section-title">{sectionTitle}</h3>
        <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
          {showAllPolicies ? 'No policies found.' : 'No active policies found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="print-section">
      <h3 className="print-section-title">{sectionTitle}</h3>
      
      {displayPolicies.map((policy) => {
        const companyName = policy.plan?.company?.name || 'Unknown Company';
        const planType = policy.plan?.planType || policy.plan?.plan_type;
        const typeName = planType?.name || 'Unknown Type';
        const planName = policy.plan?.name || 'Unknown Plan';
        const policyNumber = policy.policy_number || 'N/A';
        const effectiveDate = formatPrintDate(policy.start_date);
        const currentPremium = getPremiumValue(policy);
        const oldPremium = getOldPremiumValue(policy);
        const deductible = getDeductible(policy);
        const medicareNumber = getMedicareNumber(policy);
        const primaryAgent = getAgentName(policy.primaryAgent || policy.primary_agent);
        const assistantAgent = getAgentName(policy.assistantAgent || policy.assistant_agent);
        const increasePercent = calculateIncreasePercent(oldPremium, currentPremium);
        const paymentMode = policy.premium_frequency 
          ? policy.premium_frequency.charAt(0).toUpperCase() + policy.premium_frequency.slice(1).replace('_', ' ')
          : 'N/A';

        // Get status badge styling for non-active policies
        const getStatusBadge = () => {
          const status = policy.status?.toLowerCase() || '';
          if (status === 'active' || status === 'in force') return null;
          
          const statusColors: Record<string, { bg: string; text: string }> = {
            cancelled: { bg: '#fee2e2', text: '#991b1b' },
            terminated: { bg: '#fee2e2', text: '#991b1b' },
            expired: { bg: '#fef3c7', text: '#92400e' },
            pending: { bg: '#dbeafe', text: '#1e40af' },
            lapsed: { bg: '#fee2e2', text: '#991b1b' },
          };
          
          const colors = statusColors[status] || { bg: '#f3f4f6', text: '#374151' };
          return (
            <span style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '9px',
              fontWeight: 500,
              backgroundColor: colors.bg,
              color: colors.text,
              marginLeft: '8px',
            }}>
              {policy.status?.toUpperCase()}
            </span>
          );
        };

        return (
          <div key={policy.id} className="print-policy-card">
            <div className="print-policy-header">
              <span className="print-policy-company">
                CN: {companyName}
                {showAllPolicies && getStatusBadge()}
              </span>
              <span className="print-policy-eff">EFF: {effectiveDate}</span>
            </div>
            
            <div className="print-policy-grid">
              <div className="print-info-row">
                <span className="print-info-label">Type:</span>
                <span className="print-info-value">{typeName}</span>
              </div>
              <div className="print-info-row">
                <span className="print-info-label">POL #:</span>
                <span className="print-info-value highlight">{policyNumber}</span>
              </div>
              <div className="print-info-row">
                <span className="print-info-label">Plan:</span>
                <span className="print-info-value">{planName}</span>
              </div>
              
              <div className="print-info-row">
                <span className="print-info-label">Payment Mode:</span>
                <span className="print-info-value">{paymentMode}</span>
              </div>
              <div className="print-info-row">
                <span className="print-info-label">Pri Agt:</span>
                <span className="print-info-value">{primaryAgent}</span>
              </div>
              <div className="print-info-row">
                <span className="print-info-label">Asst Agt:</span>
                <span className="print-info-value">{assistantAgent}</span>
              </div>
              
              <div className="print-info-row">
                <span className="print-info-label">DED:</span>
                <span className="print-info-value">{formatPrintCurrency(deductible)}</span>
              </div>
              <div className="print-info-row">
                <span className="print-info-label">Curr/New Prem:</span>
                <span className="print-info-value">{formatPrintCurrency(currentPremium)}</span>
              </div>
              <div className="print-info-row">
                <span className="print-info-label">Old Prem:</span>
                <span className="print-info-value">
                  {oldPremium !== null ? formatPrintCurrency(oldPremium) : 'N/A'}
                </span>
              </div>
              
              <div className="print-info-row">
                <span className="print-info-label">Med #:</span>
                <span className="print-info-value">{medicareNumber || 'N/A'}</span>
              </div>
              <div className="print-info-row">
                <span className="print-info-label">PDP-S:</span>
                <span className="print-info-value">N/A</span>
              </div>
              <div className="print-info-row">
                <span className="print-info-label">Incr:</span>
                <span className="print-info-value">{increasePercent}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CustomerPoliciesPrint;
