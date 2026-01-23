/**
 * Print Utilities
 * Common formatting functions for print components
 */

/**
 * Format date for print display
 */
export const formatPrintDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

/**
 * Format date and time for print display
 */
export const formatPrintDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format time only for print display
 */
export const formatPrintTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format currency for print display
 */
export const formatPrintCurrency = (
  value: number | string | null | undefined,
  showCurrency = true
): string => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'N/A';
  
  const formatted = numValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return showCurrency ? `$${formatted}USD` : formatted;
};

/**
 * Format phone number for print display
 */
export const formatPrintPhone = (phone: string | null | undefined): string => {
  if (!phone) return 'N/A';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  return phone;
};

/**
 * Mask SSN for print display (shows last 4 digits)
 */
export const maskSSN = (ssn: string | null | undefined): string => {
  if (!ssn) return 'N/A';
  const digits = ssn.replace(/\D/g, '');
  if (digits.length >= 4) {
    return `***-**-${digits.slice(-4)}`;
  }
  return '***-**-****';
};

/**
 * Mask phone number for print display
 */
export const maskPhone = (phone: string | null | undefined): string => {
  if (!phone) return 'N/A';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 4) {
    return `(***) ***-${digits.slice(-4)}`;
  }
  return '(***) ***-****';
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth: string | null | undefined): number | null => {
  if (!dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  if (isNaN(birthDate.getTime())) return null;
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return Math.max(0, age);
};

/**
 * Calculate percentage increase between two values
 */
export const calculateIncreasePercent = (
  oldValue: number | null | undefined,
  newValue: number | null | undefined
): string => {
  if (!oldValue || !newValue || oldValue === 0) return 'N/A';
  
  const increase = ((newValue - oldValue) / oldValue) * 100;
  return `${increase.toFixed(2)}%`;
};

/**
 * Format full name from parts
 */
export const formatFullName = (
  firstName?: string | null,
  middleName?: string | null,
  lastName?: string | null
): string => {
  return [firstName, middleName, lastName]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Unknown';
};

/**
 * Format address for print display
 */
export const formatPrintAddress = (
  address?: string | null,
  apartment?: string | null,
  apartmentType?: string | null,
  city?: string | null,
  state?: string | null,
  zipCode?: string | null
): string => {
  const parts: string[] = [];
  
  if (address) {
    let addressLine = address;
    if (apartment) {
      addressLine += apartmentType ? `, ${apartmentType} ${apartment}` : `, ${apartment}`;
    }
    parts.push(addressLine);
  }
  
  const cityStateZip = [city, state, zipCode].filter(Boolean).join(', ');
  if (cityStateZip) {
    parts.push(cityStateZip);
  }
  
  return parts.join(', ') || 'N/A';
};

/**
 * Get note color class for print
 */
export const getPrintNoteColorClass = (color: string): string => {
  const colorMap: Record<string, string> = {
    black: 'note-black',
    red: 'note-red',
    blue: 'note-blue',
    purple: 'note-purple',
    green: 'note-green',
    orange: 'note-orange',
    yellow: 'note-yellow',
    pink: 'note-pink',
    brown: 'note-brown',
  };
  return colorMap[color] || 'note-black';
};

/**
 * Get status badge class for print
 */
export const getPrintStatusClass = (status: string): string => {
  const statusLower = status?.toLowerCase() || '';
  if (statusLower === 'active' || statusLower === 'client') return 'badge-green';
  if (statusLower === 'pending' || statusLower === 'prospect') return 'badge-yellow';
  if (statusLower === 'cancelled' || statusLower === 'former') return 'badge-red';
  if (statusLower === 'deceased') return 'badge-gray';
  return 'badge-blue';
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string | null | undefined, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Format height for print display (feet and inches)
 */
export const formatPrintHeight = (height: string | null | undefined): string => {
  if (!height) return 'N/A';
  
  // Try to parse feet'inches" format
  const match = height.match(/(\d+)'?\s*(\d+)?"?/);
  if (match) {
    const feet = match[1] || '';
    const inches = match[2] || '';
    if (feet && inches) {
      return `${feet}' ${inches}"`;
    } else if (feet) {
      return `${feet}'`;
    }
  }
  
  return height;
};

/**
 * Format weight for print display
 */
export const formatPrintWeight = (weight: string | number | null | undefined): string => {
  if (weight === null || weight === undefined || weight === '') return 'N/A';
  const numWeight = typeof weight === 'string' ? parseFloat(weight) : weight;
  if (isNaN(numWeight)) return String(weight);
  return `${numWeight} lbs`;
};

/**
 * Get relationship display name
 */
export const getRelationshipDisplay = (relationship: string | null | undefined): string => {
  if (!relationship) return 'Related';
  
  // Capitalize first letter of each word
  return relationship
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Generate unique print ID
 */
export const generatePrintId = (): string => {
  return `print-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
