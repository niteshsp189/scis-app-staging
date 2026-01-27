/**
 * Policy Print Page
 * Print view for a single policy details
 */

import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PrintLayout } from '@/components/print/PrintLayout';
import { PrintStyles } from '@/components/print/PrintStyles';
import { formatPrintDate, formatPrintCurrency, formatFullName, calculateIncreasePercent } from '@/utils/printUtils';
import { PolicyService } from '@/services/policyService';
import { Policy } from '@/types/policy';

// Helper functions
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
    const premiumValue = (fieldValues as Record<string, unknown>).premium;
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
    const oldPremiumValue = (fieldValues as Record<string, unknown>).old_premium;
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
    const fv = fieldValues as Record<string, unknown>;
    const medicareNum = fv.medicare_number || fv.medicareNumber;
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
    const deductibleValue = (fieldValues as Record<string, unknown>).deductible;
    if (deductibleValue !== undefined && deductibleValue !== null && deductibleValue !== '') {
      const numericValue = parseFloat(deductibleValue.toString());
      if (!isNaN(numericValue)) {
        return numericValue;
      }
    }
  }
  
  return 0;
};

const getAgentName = (agent?: { first_name?: string; last_name?: string; name?: string }): string => {
  if (!agent) return 'N/A';
  if (agent.name) return agent.name;
  const firstName = agent.first_name || '';
  const lastName = agent.last_name || '';
  return `${firstName} ${lastName}`.trim() || 'N/A';
};

export const PolicyPrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const policyId = Number(id);

  // Fetch policy data with all relationships
  const { data: policyResponse, isLoading } = useQuery({
    queryKey: ['policy-print', policyId],
    queryFn: () => PolicyService.getPolicy(policyId, ['customer', 'plan', 'plan.planType', 'plan.company', 'primaryAgent', 'assistantAgent']),
    enabled: !!policyId,
  });

  const policy = policyResponse?.data;

  // Set page title
  useEffect(() => {
    if (policy) {
      document.title = `Policy ${policy.policy_number} - Print`;
    }
  }, [policy]);

  if (isLoading) {
    return (
      <div className="print-loading">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e5e7eb',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading policy data...</p>
        </div>
        <PrintStyles />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!policy) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: '#ef4444', fontSize: '14px' }}>Policy not found</p>
      </div>
    );
  }

  // Extract policy details
  const customer = policy.customer;
  const customerName = customer?.name || 'Unknown Customer';
  
  const companyName = policy.plan?.company?.name || 'Unknown Company';
  const planType = policy.plan?.planType || policy.plan?.plan_type;
  const typeName = planType?.name || 'Unknown Type';
  const planName = policy.plan?.name || 'Unknown Plan';
  const policyNumber = policy.policy_number || 'N/A';
  const effectiveDate = formatPrintDate(policy.start_date);
  const endDate = formatPrintDate(policy.end_date);
  const currentPremium = getPremiumValue(policy);
  const oldPremium = getOldPremiumValue(policy);
  const deductible = getDeductible(policy);
  const medicareNumber = getMedicareNumber(policy);
  // Cast to any for agent access since types may not include all API fields
  const policyAny = policy as unknown as Record<string, unknown>;
  const primaryAgent = getAgentName(policyAny.primaryAgent as { first_name?: string; last_name?: string; name?: string } || policyAny.primary_agent as { first_name?: string; last_name?: string; name?: string });
  const assistantAgent = getAgentName(policyAny.assistantAgent as { first_name?: string; last_name?: string; name?: string } || policyAny.assistant_agent as { first_name?: string; last_name?: string; name?: string });
  const increasePercent = calculateIncreasePercent(oldPremium, currentPremium);
  const paymentMode = policy.premium_frequency 
    ? policy.premium_frequency.charAt(0).toUpperCase() + policy.premium_frequency.slice(1).replace('_', ' ')
    : 'N/A';
  const status = policy.status || 'Unknown';

  // Status badge styling
  const getStatusStyle = () => {
    const statusLower = status.toLowerCase();
    const statusColors: Record<string, { bg: string; text: string }> = {
      active: { bg: '#dcfce7', text: '#166534' },
      'in force': { bg: '#dcfce7', text: '#166534' },
      cancelled: { bg: '#fee2e2', text: '#991b1b' },
      terminated: { bg: '#fee2e2', text: '#991b1b' },
      expired: { bg: '#fef3c7', text: '#92400e' },
      pending: { bg: '#dbeafe', text: '#1e40af' },
      lapsed: { bg: '#fee2e2', text: '#991b1b' },
    };
    return statusColors[statusLower] || { bg: '#f3f4f6', text: '#374151' };
  };

  const statusStyle = getStatusStyle();

  return (
    <PrintLayout
      title={`Policy ${policyNumber}`}
      showToolbar={true}
      showHeader={true}
      showFooter={true}
    >
      {/* Policy Header */}
      <div className="print-section" style={{ marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '12px',
          marginBottom: '16px'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
              Policy: {policyNumber}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
              {companyName} - {typeName}
            </p>
          </div>
          <span style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            backgroundColor: statusStyle.bg,
            color: statusStyle.text,
          }}>
            {status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Customer Information */}
      <div className="print-section" style={{ marginBottom: '24px' }}>
        <h3 className="print-section-title">Customer Information</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '12px',
          backgroundColor: '#f9fafb',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <div className="print-info-row">
            <span className="print-info-label">Name:</span>
            <span className="print-info-value">{customerName}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Email:</span>
            <span className="print-info-value">{customer?.email || 'N/A'}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Phone:</span>
            <span className="print-info-value">
              {customer?.phone || 'N/A'}
            </span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Address:</span>
            <span className="print-info-value">
              {[customer?.address, customer?.city, customer?.state, customer?.zip_code]
                .filter(Boolean)
                .join(', ') || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Policy Details */}
      <div className="print-section" style={{ marginBottom: '24px' }}>
        <h3 className="print-section-title">Policy Details</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '12px',
          backgroundColor: '#f9fafb',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <div className="print-info-row">
            <span className="print-info-label">Policy Number:</span>
            <span className="print-info-value highlight">{policyNumber}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Company:</span>
            <span className="print-info-value">{companyName}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Plan Type:</span>
            <span className="print-info-value">{typeName}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Plan Name:</span>
            <span className="print-info-value">{planName}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Effective Date:</span>
            <span className="print-info-value">{effectiveDate}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">End Date:</span>
            <span className="print-info-value">{endDate}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Payment Mode:</span>
            <span className="print-info-value">{paymentMode}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Status:</span>
            <span className="print-info-value">{status}</span>
          </div>
          {medicareNumber && (
            <div className="print-info-row">
              <span className="print-info-label">Medicare #:</span>
              <span className="print-info-value">{medicareNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Premium Information */}
      <div className="print-section" style={{ marginBottom: '24px' }}>
        <h3 className="print-section-title">Premium Information</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '12px',
          backgroundColor: '#f9fafb',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <div className="print-info-row">
            <span className="print-info-label">Current Premium:</span>
            <span className="print-info-value" style={{ fontWeight: 600, color: '#059669' }}>
              {formatPrintCurrency(currentPremium)}
            </span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Old Premium:</span>
            <span className="print-info-value">
              {oldPremium !== null ? formatPrintCurrency(oldPremium) : 'N/A'}
            </span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Deductible:</span>
            <span className="print-info-value">{formatPrintCurrency(deductible)}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Increase:</span>
            <span className="print-info-value">{increasePercent}</span>
          </div>
        </div>
      </div>

      {/* Agent Information */}
      <div className="print-section" style={{ marginBottom: '24px' }}>
        <h3 className="print-section-title">Agent Information</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '12px',
          backgroundColor: '#f9fafb',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <div className="print-info-row">
            <span className="print-info-label">Primary Agent:</span>
            <span className="print-info-value">{primaryAgent}</span>
          </div>
          <div className="print-info-row">
            <span className="print-info-label">Assistant Agent:</span>
            <span className="print-info-value">{assistantAgent}</span>
          </div>
        </div>
      </div>
    </PrintLayout>
  );
};

export default PolicyPrintPage;
