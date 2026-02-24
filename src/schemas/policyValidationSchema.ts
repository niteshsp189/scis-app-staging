import { z } from 'zod';

// Policy form data interface
export interface PolicyFormData {
  customer_id: string;
  customer_name: string;
  company_id: string;
  plan_id: string;
  policy_number: string;
  agent_of_record: string;
  writing_agent: string;
  effective_date: string; // Hidden field - not used for validation
  status?: string;
  extra_fields: Record<string, unknown>;
}

// Plan type interface for validation
export interface PlanType {
  id: number;
  name: string;
  slug: string;
  extra_fields: Record<string, {
    label: string;
    included: boolean;
    required: boolean;
  }>;
  is_active: boolean;
}

// Policy number validation regex - allows alphanumeric, dashes, underscores, dots, spaces, slashes, and other common characters
const policyNumberRegex = /^[a-zA-Z0-9\-_\.\s\/\#\(\)\+]+$/;

// Premium validation regex - allows decimal numbers
const premiumRegex = /^\d+(\.\d{1,2})?$/;

// Medicare number validation regex - flexible format
const medicareNumberRegex = /^[a-zA-Z0-9\-]+$/;

// Date validation function
const validateDate = (dateString: string): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date >= new Date('1900-01-01');
};

// Policy number validation function - flexible to allow manual entry by admin
const validatePolicyNumber = (policyNumber: string): boolean => {
  if (!policyNumber) return false;
  if (policyNumber.trim().length === 0) return false;
  if (policyNumber.length > 100) return false;
  if (/[<>'"&]/.test(policyNumber)) return false;
  return true; // Accept any format that doesn't contain dangerous characters
};

// Premium validation function
const validatePremium = (premium: string): boolean => {
  if (!premium) return false;
  const numericValue = parseFloat(premium);
  return !isNaN(numericValue) && numericValue >= 0 && numericValue <= 999999.99;
};

// Medicare number validation function
const validateMedicareNumber = (medicareNumber: string): boolean => {
  if (!medicareNumber) return false;
  return medicareNumber.length >= 5 && medicareNumber.length <= 20 && medicareNumberRegex.test(medicareNumber);
};

// Generic validation for text fields
const validateTextValue = (value: string, minLength: number = 1, maxLength: number = 255): boolean => {
  if (!value || value.trim().length === 0) return false;
  return value.trim().length >= minLength && value.trim().length <= maxLength;
};

// Generic validation for numeric fields
const validateNumericValue = (value: string, min: number = 0, max: number = 999999.99): boolean => {
  if (!value) return false;
  const numericValue = parseFloat(value);
  return !isNaN(numericValue) && numericValue >= min && numericValue <= max;
};

// Validation function for individual fields
export const validateField = (
  field: keyof PolicyFormData | string, 
  value: unknown, 
  planType?: PlanType
): string | null => {
  const stringValue = String(value || '').trim();

  // Core policy form field validations
  switch (field) {
    case 'customer_id':
      return !stringValue ? 'Customer is required' : null;
    
    case 'company_id':
      return !stringValue ? 'Insurance company is required' : null;
    
    case 'plan_id':
      return !stringValue ? 'Insurance plan is required' : null;
    
    case 'policy_number':
      if (!stringValue) return 'Policy number is required';
      if (!validatePolicyNumber(stringValue)) {
        if (stringValue.length > 100) return 'Policy number must be less than 100 characters';
        if (/[<>'"&]/.test(stringValue)) return 'Policy number contains invalid characters';
        return 'Policy number is invalid';
      }
      return null;
    
    case 'agent_of_record':
      return !stringValue ? 'Agent of Record is required' : null;
    
    case 'writing_agent':
      return !stringValue ? 'Writing Agent is required' : null;
    
    case 'status':
      if (stringValue && !['Active', 'Pending', 'Suspended', 'Cancelled', 'Expired', 'Lapsed'].includes(stringValue)) {
        return 'Invalid policy status';
      }
      return null;
  }

  // Plan type extra field validations
  if (planType && planType.extra_fields && planType.extra_fields[field]) {
    const fieldConfig = planType.extra_fields[field];
    
    // Skip validation if field is not included in the plan type
    if (!fieldConfig.included) {
      return null;
    }

    // Check if required field is empty
    if (fieldConfig.required && !stringValue) {
      return `${fieldConfig.label} is required`;
    }

    // Skip further validation if field is empty and not required
    if (!stringValue && !fieldConfig.required) {
      return null;
    }

    // Field-specific validations for extra fields
    switch (field) {
      case 'effective_date':
      case 'part_a_effective_date':
      case 'part_b_effective_date':
      case 'application_mailed_date':
      case 'policy_mailed_date':
        if (stringValue && !validateDate(stringValue)) {
          return `${fieldConfig.label} must be a valid date`;
        }
        break;
      
      case 'premium':
      case 'value':
      case 'deductible':
      case 'out_of_pocket':
      case 'credit':
      case 'payment':
        if (stringValue && !validatePremium(stringValue)) {
          return `${fieldConfig.label} must be a valid monetary amount`;
        }
        break;
      
      case 'medicare_number':
        if (stringValue && !validateMedicareNumber(stringValue)) {
          return `${fieldConfig.label} must be between 5-20 characters and contain only letters, numbers, and dashes`;
        }
        break;
      
      case 'pdp_serial':
        if (stringValue && !validateTextValue(stringValue, 3, 50)) {
          return `${fieldConfig.label} must be between 3-50 characters`;
        }
        break;
      
      case 'payment_mode':
        if (stringValue && !validateTextValue(stringValue, 2, 50)) {
          return `${fieldConfig.label} is required`;
        }
        break;
      
      default:
        // Generic validation for other text fields
        if (stringValue && !validateTextValue(stringValue, 1, 255)) {
          return `${fieldConfig.label} must be between 1-255 characters`;
        }
        break;
    }
  }

  return null;
};

// Comprehensive validation function for the entire form
export const validatePolicyForm = (
  formData: PolicyFormData, 
  planType?: PlanType
): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Validate core policy fields
  const coreFields: (keyof PolicyFormData)[] = [
    'customer_id',
    'company_id', 
    'plan_id',
    'policy_number',
    'agent_of_record',
    'writing_agent',
    'status'
  ];

  for (const field of coreFields) {
    const error = validateField(field, formData[field], planType);
    if (error) {
      errors[field] = error;
    }
  }

  // Validate extra fields based on plan type configuration
  if (planType && planType.extra_fields && formData.extra_fields) {
    for (const [fieldKey, fieldConfig] of Object.entries(planType.extra_fields)) {
      if (fieldConfig.included) {
        const fieldValue = formData.extra_fields[fieldKey];
        const error = validateField(fieldKey, fieldValue, planType);
        if (error) {
          errors[`extra_fields.${fieldKey}`] = error;
        }
      }
    }
  }

  return errors;
};

// Utility function to get first error message for toast notifications
export const getFirstErrorMessage = (errors: Record<string, string>): string => {
  const firstErrorField = Object.keys(errors)[0];
  if (firstErrorField && errors[firstErrorField]) {
    return errors[firstErrorField];
  }
  return 'Please fix the validation errors and try again.';
};

// Utility function to check if form has any errors
export const hasValidationErrors = (errors: Record<string, string>): boolean => {
  return Object.keys(errors).length > 0;
};

// Utility function to format field names for display
export const formatFieldName = (fieldName: string): string => {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace('_', ' ')
    .trim();
};