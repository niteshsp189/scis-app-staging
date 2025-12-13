/**
 * Phone number formatting utilities
 */

/**
 * Format a phone number for display
 * Handles US phone numbers in various formats and displays them consistently
 * 
 * @param phone - Phone number string (can be raw digits or already formatted)
 * @returns Formatted phone number string or fallback text
 * 
 * @example
 * formatPhoneDisplay("1234567890") // "(123) 456-7890"
 * formatPhoneDisplay("123-456-7890") // "(123) 456-7890"
 * formatPhoneDisplay("") // "Not provided"
 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return "Not provided";
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle different phone number lengths
  if (cleaned.length === 10) {
    // Format as (XXX) XXX-XXXX
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // Format as +1 (XXX) XXX-XXXX
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
  } else if (cleaned.length === 7) {
    // Format as XXX-XXXX (local number)
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}`;
  }
  
  // Return original if it doesn't match expected formats
  return phone;
}

/**
 * Format a phone number for input (remove formatting, keep only digits)
 * 
 * @param phone - Phone number string with any formatting
 * @returns Clean phone number with only digits
 * 
 * @example
 * formatPhoneInput("(123) 456-7890") // "1234567890"
 */
export function formatPhoneInput(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Clean a phone number for storage (remove all formatting)
 * 
 * @param phone - Phone number string
 * @returns Phone number with only digits
 * 
 * @example
 * cleanPhoneForStorage("(123) 456-7890") // "1234567890"
 */
export function cleanPhoneForStorage(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Validate if a phone number is valid (US format)
 * 
 * @param phone - Phone number string
 * @returns true if valid, false otherwise
 * 
 * @example
 * isValidPhone("1234567890") // true
 * isValidPhone("123") // false
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
}
