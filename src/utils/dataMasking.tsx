import React, { useState } from 'react';

interface MaskedDisplayProps {
  value: string;
  visible?: boolean;
  maskChar?: string;
  children?: React.ReactNode;
}

export function MaskedDisplay({ 
  value, 
  visible = false, 
  maskChar = '*',
  children 
}: MaskedDisplayProps) {
  if (visible) {
    return <>{value}</>;
  }
  
  if (children) {
    return <>{children}</>;
  }
  
  return <>{maskChar.repeat(Math.min(value.length, 8))}</>;
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