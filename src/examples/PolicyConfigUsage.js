// Example of how to use the centralized policy configuration in the frontend

// 1. Fetch all policy configurations at once
export const fetchPolicyConfig = async () => {
  try {
    const response = await fetch('/api/policy-config', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch policy config:', error);
    return null;
  }
};

// 2. Fetch only premium frequencies
export const fetchPremiumFrequencies = async () => {
  try {
    const response = await fetch('/api/policy-config/premium-frequencies', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to fetch premium frequencies:', error);
    return {};
  }
};

// 3. Example React component using the centralized config
import React, { useState, useEffect } from 'react';

const PolicyForm = () => {
  const [premiumFrequencies, setPremiumFrequencies] = useState({});
  const [policyStatuses, setPolicyStatuses] = useState({});
  const [billingMethods, setBillingMethods] = useState({});

  useEffect(() => {
    const loadConfig = async () => {
      const config = await fetchPolicyConfig();
      if (config) {
        setPremiumFrequencies(config.premium_frequencies);
        setPolicyStatuses(config.policy_statuses);
        setBillingMethods(config.billing_methods);
      }
    };
    loadConfig();
  }, []);

  return (
    <form>
      {/* Premium Frequency Dropdown */}
      <select name="premium_frequency">
        <option value="">Select Frequency</option>
        {Object.entries(premiumFrequencies).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      {/* Policy Status Dropdown */}
      <select name="policy_status">
        <option value="">Select Status</option>
        {Object.entries(policyStatuses).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      {/* Billing Method Dropdown */}
      <select name="billing_method">
        <option value="">Select Billing Method</option>
        {Object.entries(billingMethods).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </form>
  );
};

// 4. Example of updating the existing EnhancedPolicyForm.tsx
// Replace the hardcoded values in your SelectContent with dynamic ones:

// OLD (hardcoded):
// <SelectContent>
//   <SelectItem value="monthly">Monthly</SelectItem>
//   <SelectItem value="quarterly">Quarterly</SelectItem>
//   <SelectItem value="semi-annually">Semi-Annually</SelectItem>
//   <SelectItem value="annually">Annually</SelectItem>
// </SelectContent>

// NEW (dynamic):
// <SelectContent>
//   {Object.entries(premiumFrequencies).map(([key, label]) => (
//     <SelectItem key={key} value={key}>
//       {label}
//     </SelectItem>
//   ))}
// </SelectContent>

export default PolicyForm;
