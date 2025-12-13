/**
 * Utility functions for SSN formatting and validation
 */

/**
 * Formats SSN for display with hyphens (XXX-XX-XXXX)
 * @param ssn - The SSN string to format
 * @returns Formatted SSN string with hyphens
 */
export const formatSSNDisplay = (ssn: string): string => {
  if (!ssn) return '';
  
  // Remove all non-digits
  const digits = ssn.replace(/\D/g, '');
  
  // Format as XXX-XX-XXXX but only add hyphens at appropriate positions
  // Don't format if it's too short to avoid interfering with backspacing
  if (digits.length >= 9) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  } else if (digits.length >= 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  } else if (digits.length >= 4) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  } else {
    return digits;
  }
};

/**
 * Cleans SSN for storage (removes hyphens and spaces)
 * @param ssn - The SSN string to clean
 * @returns Clean SSN string without formatting
 */
export const cleanSSNForStorage = (ssn: string): string => {
  if (!ssn) return '';
  
  // Remove all non-digits
  return ssn.replace(/\D/g, '');
};

/**
 * Formats SSN input as user types with improved deletion handling
 * @param value - The current input value
 * @param previousValue - The previous input value
 * @returns Formatted SSN with smart hyphen management
 */
export const formatSSNInput = (value: string, previousValue: string): string => {
  // Remove all non-digits from both values
  const digits = value.replace(/\D/g, '');
  const previousDigits = previousValue.replace(/\D/g, '');
  
  // Check if user is deleting
  const isDeleting = digits.length < previousDigits.length;
  
  if (isDeleting) {
    // When deleting, maintain formatting unless we're at critical boundaries
    // Only remove hyphens when the user would naturally expect them to disappear
    
    // If we're at exactly 3 digits (just deleted the 4th), don't add first hyphen
    if (digits.length === 3) {
      return digits;
    }
    
    // If we're at exactly 5 digits (just deleted the 6th), don't add second hyphen
    if (digits.length === 5) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    
    // For other lengths during deletion, maintain normal formatting
    if (digits.length >= 9) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
    } else if (digits.length >= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    } else if (digits.length >= 4) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return digits;
    }
  }
  
  // When typing forward, apply normal formatting
  if (digits.length >= 9) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  } else if (digits.length >= 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  } else if (digits.length >= 4) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  } else {
    return digits;
  }
};

/**
 * Validates SSN format
 * @param ssn - The SSN string to validate
 * @returns True if valid SSN format
 */
export const isValidSSNFormat = (ssn: string): boolean => {
  if (!ssn) return true; // Empty SSN is valid (optional field)
  
  const cleanSSN = cleanSSNForStorage(ssn);
  return /^\d{9}$/.test(cleanSSN);
};