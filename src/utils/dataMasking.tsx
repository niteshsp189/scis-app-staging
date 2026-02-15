import React, { useState } from 'react';

interface MaskedDisplayProps {
  value: string;
  visible?: boolean;
  maskChar?: string;
  type?: 'phone' | 'ssn' | 'email' | 'address';
  children?: React.ReactNode;
  className?: string;
  fallback?: string;
}

export function MaskedDisplay({ 
  value, 
  visible = false, 
  maskChar = '*',
  type,
  children,
  className,
  fallback = ''
}: MaskedDisplayProps) {
  if (visible) {
    const formattedValue = formatValue(value, type);
    return <span className={className}>{formattedValue}</span>;
  }
  
  if (children) {
    return <span className={className}>{children}</span>;
  }
  
  if (fallback && !value) {
    return <span className={className}>{fallback}</span>;
  }
  
  return <span className={className}>{maskChar.repeat(Math.min(value.length, 8))}</span>;
}

/**
 * Format value based on type for display
 */
function formatValue(value: string, type?: string): string {
  if (!value) return '';
  
  switch (type) {
    case 'phone':
      return formatPhone(value);
    case 'ssn':
      return formatSSN(value);
    case 'email':
      return value; // Email doesn't need special formatting
    case 'address':
      return value; // Address is already formatted
    default:
      return value;
  }
}

/**
 * Format phone number for display (same as print format)
 */
function formatPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Handle different digit lengths
  if (digits.length === 10) {
    // Standard 10-digit US number: (xxx)xxx-xxxx
    return `(${digits.slice(0, 3)})${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    // 11 digits starting with 1 (country code): (xxx)xxx-xxxx
    return `(${digits.slice(1, 4)})${digits.slice(4, 7)}-${digits.slice(7)}`;
  } else if (digits.length >= 12) {
    // 12+ digits - use last 10 digits: (xxx)xxx-xxxx
    const last10 = digits.slice(-10);
    return `(${last10.slice(0, 3)})${last10.slice(3, 6)}-${last10.slice(6)}`;
  } else if (digits.length > 10) {
    // More than 10 but less than 12 - use last 10
    const last10 = digits.slice(-10);
    return `(${last10.slice(0, 3)})${last10.slice(3, 6)}-${last10.slice(6)}`;
  }
  
  return phone;
}

/**
 * Format SSN for display (xxx-xx-xxxx)
 */
function formatSSN(ssn: string): string {
  if (!ssn) return '';
  const digits = ssn.replace(/\D/g, '');
  if (digits.length === 9) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }
  return ssn;
}

export function useDataMasking() {
  const [isVisible, setIsVisible] = useState(false);
  
  const toggleVisibility = () => setIsVisible(!isVisible);
  
  return {
    isVisible,
    toggleVisibility,
    setIsVisible
  };
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  
  const maskedLocal = local.length > 2 
    ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    : '*'.repeat(local.length);
    
  return `${maskedLocal}@${domain}`;
}

export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '*'.repeat(cleaned.length);
  
  const masked = '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
  return masked;
}