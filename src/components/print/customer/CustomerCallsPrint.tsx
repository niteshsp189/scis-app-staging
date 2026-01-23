/**
 * Customer Calls Print Section
 * Displays call history with customer info and policies for each call
 */

import {
  formatPrintDate,
  formatPrintDateTime,
  formatPrintPhone,
  formatPrintCurrency,
  formatPrintAddress,
  calculateAge,
} from '@/utils/printUtils';

interface Call {
  id: number;
  activity_type: string;
  activity_date: string;
  activity_time?: string;
  description?: string;
  title?: string;
  duration_minutes?: number;
  performer?: {
    first_name?: string;
    last_name?: string;
  };
  calledForUser?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  called_for_user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  answers?: Array<{
    id: number;
    content: string;
    created_at: string;
    user?: {
      first_name?: string;
      last_name?: string;
    };
  }>;
}

interface Policy {
  id: number;
  policy_number?: string;
  status?: string;
  start_date?: string;
  plan?: {
    name?: string;
    company?: {
      name?: string;
    };
    planType?: {
      name?: string;
    };
    plan_type?: {
      name?: string;
    };
  };
  field_values?: Record<string, string | number | boolean | null> | string;
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

interface CustomerCallsPrintProps {
  customerName: string;
  customer: {
    dateOfBirth?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    homePhone?: string;
    cellPhone?: string;
    address?: string;
    apartment?: string;
    apartmentType?: string;
  };
  calls: Call[];
  policies?: Policy[];
  showCustomerInfo?: boolean;
  showPolicies?: boolean;
}

const getAgentName = (agent?: { first_name?: string; last_name?: string }): string => {
  if (!agent) return 'N/A';
  const firstName = agent.first_name || '';
  const lastName = agent.last_name || '';
  return `${firstName} ${lastName}`.trim() || 'N/A';
};

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

const formatCallDateTime = (date: string, time?: string): string => {
  if (!date) return 'N/A';
  
  const dateStr = formatPrintDate(date);
  if (time) {
    // Format time as HH:MM AM/PM
    const timeParts = time.split(':');
    if (timeParts.length >= 2) {
      let hours = parseInt(timeParts[0], 10);
      const minutes = timeParts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${dateStr}, Time: ${hours}:${minutes} ${ampm}`;
    }
  }
  
  return dateStr;
};

export const CustomerCallsPrint = ({
  customerName,
  customer,
  calls,
  policies = [],
  showCustomerInfo = true,
  showPolicies = true,
}: CustomerCallsPrintProps) => {
  if (calls.length === 0) {
    return (
      <div className="print-section">
        <h3 className="print-section-title">Calls for client {customerName}</h3>
        <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No calls found.</p>
      </div>
    );
  }

  const age = calculateAge(customer.dateOfBirth);
  const activePolicies = policies.filter((p) => p.status?.toLowerCase() === 'active');

  return (
    <div className="print-section">
      <h3 className="print-section-title">Calls for client {customerName}</h3>
      
      {calls.map((call) => {
        const calledForUser = call.calledForUser || call.called_for_user;
        const performerName = getAgentName(call.performer);
        const calledForName = calledForUser 
          ? `${calledForUser.first_name || ''} ${calledForUser.last_name || ''}`.trim()
          : 'N/A';

        return (
          <div key={call.id} className="print-call-card">
            {/* Customer Info Header */}
            {showCustomerInfo && (
              <div className="print-call-header">
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  Client: {customerName}
                </div>
                <div className="print-call-client-info">
                  <div className="print-info-row">
                    <span className="print-info-label">DOB:</span>
                    <span className="print-info-value">{formatPrintDate(customer.dateOfBirth)}</span>
                  </div>
                  <div className="print-info-row">
                    <span className="print-info-label">Age:</span>
                    <span className="print-info-value">{age !== null ? age : 'N/A'}</span>
                  </div>
                  <div className="print-info-row">
                    <span className="print-info-label">H-Ph:</span>
                    <span className="print-info-value">{formatPrintPhone(customer.homePhone)}</span>
                  </div>
                  <div className="print-info-row">
                    <span className="print-info-label">C-Ph:</span>
                    <span className="print-info-value">{formatPrintPhone(customer.cellPhone)}</span>
                  </div>
                  <div className="print-info-row">
                    <span className="print-info-label">City:</span>
                    <span className="print-info-value">{customer.city || 'N/A'}</span>
                  </div>
                  <div className="print-info-row">
                    <span className="print-info-label">State:</span>
                    <span className="print-info-value">{customer.state || 'N/A'}</span>
                  </div>
                  <div className="print-info-row">
                    <span className="print-info-label">Zip Code:</span>
                    <span className="print-info-value">{customer.zipCode || 'N/A'}</span>
                  </div>
                  <div className="print-info-row">
                    <span className="print-info-label">Address:</span>
                    <span className="print-info-value">
                      {formatPrintAddress(customer.address, customer.apartment, customer.apartmentType)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Active Policies (abbreviated) */}
            {showPolicies && activePolicies.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>
                  Active Policies for {customerName}
                </div>
                {activePolicies.map((policy) => {
                  const companyName = policy.plan?.company?.name || 'Unknown';
                  const planType = policy.plan?.planType || policy.plan?.plan_type;
                  const typeName = planType?.name || 'Unknown';
                  const planName = policy.plan?.name || 'Unknown';
                  const effectiveDate = formatPrintDate(policy.start_date);
                  const currentPremium = getPremiumValue(policy);
                  const primaryAgent = getAgentName(policy.primaryAgent || policy.primary_agent);
                  const assistantAgent = getAgentName(policy.assistantAgent || policy.assistant_agent);

                  return (
                    <div
                      key={policy.id}
                      style={{
                        fontSize: '9px',
                        padding: '6px',
                        marginBottom: '4px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '3px',
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                        <span><strong>CN:</strong> {companyName}</span>
                        <span><strong>Type:</strong> {typeName}</span>
                        <span><strong>EFF:</strong> {effectiveDate}</span>
                        <span><strong>Plan:</strong> {planName}</span>
                        <span><strong>POL #:</strong> {policy.policy_number || 'N/A'}</span>
                        <span><strong>Pri Agt:</strong> {primaryAgent}</span>
                        <span><strong>Asst Agt:</strong> {assistantAgent}</span>
                        <span><strong>Curr/New Prem:</strong> {formatPrintCurrency(currentPremium)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Call Information */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>
                Call Information
              </div>
              <div className="print-grid">
                <div className="print-info-row">
                  <span className="print-info-label">Date:</span>
                  <span className="print-info-value">
                    {formatCallDateTime(call.activity_date, call.activity_time)}
                  </span>
                </div>
                <div className="print-info-row">
                  <span className="print-info-label">Type:</span>
                  <span className="print-info-value">
                    <span className={`print-badge ${call.activity_type === 'Incoming Call' ? 'badge-green' : 'badge-blue'}`}>
                      {call.activity_type}
                    </span>
                  </span>
                </div>
                <div className="print-info-row">
                  <span className="print-info-label">Called for:</span>
                  <span className="print-info-value">{calledForName}</span>
                </div>
                <div className="print-info-row">
                  <span className="print-info-label">Taken by:</span>
                  <span className="print-info-value">{performerName}</span>
                </div>
              </div>
              
              <div className="print-call-message">
                <strong>Message:</strong> {call.description || call.title || 'No message recorded.'}
              </div>

              {/* Answers */}
              {call.answers && call.answers.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
                    Answers:
                  </div>
                  {call.answers.map((answer, index) => (
                    <div
                      key={answer.id || index}
                      style={{
                        fontSize: '10px',
                        padding: '6px',
                        backgroundColor: '#f0fdf4',
                        borderLeft: '3px solid #22c55e',
                        marginBottom: '4px',
                      }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                        🔄 {getAgentName(answer.user)}
                        <span style={{ fontWeight: 'normal', marginLeft: '10px', color: '#6b7280' }}>
                          {formatPrintDateTime(answer.created_at)}
                        </span>
                      </div>
                      <div>{answer.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CustomerCallsPrint;
