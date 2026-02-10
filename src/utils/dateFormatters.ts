/**
 * Centralized date/time formatting utilities for the SCIS application.
 * 
 * All appointment datetimes are stored in UTC in the database.
 * These formatters ensure consistent display across all views:
 *   - Always interpret stored datetimes as UTC
 *   - Always display in 12-hour AM/PM format (US convention)
 *   - Consistent date format: "Mon DD, YYYY" or "Weekday, Month DD, YYYY"
 */

const UTC_TIMEZONE = 'UTC';

/**
 * Format a datetime string as time in 12h AM/PM format (UTC).
 * Example: "5:00 PM", "10:30 AM"
 */
export const formatTimeUTC = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleTimeString('en-US', {
      timeZone: UTC_TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateString;
  }
};

/**
 * Format a datetime string as a short date (UTC).
 * Example: "Feb 03, 2026"
 */
export const formatDateUTC = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      timeZone: UTC_TIMEZONE,
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Format a datetime string as a long date (UTC).
 * Example: "Tuesday, February 3, 2026"
 */
export const formatDateLongUTC = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      timeZone: UTC_TIMEZONE,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Format a datetime string as date + time (UTC).
 * Example: "Feb 03, 2026, 5:00 PM"
 */
export const formatDateTimeUTC = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: UTC_TIMEZONE,
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateString;
  }
};

/**
 * Format a time range from two datetime strings (UTC).
 * Example: "5:00 PM - 6:15 PM"
 */
export const formatTimeRangeUTC = (startDatetime: string, endDatetime: string): string => {
  return `${formatTimeUTC(startDatetime)} - ${formatTimeUTC(endDatetime)}`;
};

/**
 * Extract HH:mm (24h) from a datetime string in UTC.
 * Useful for HTML time input values.
 * Example: "17:00"
 */
export const extractTimeHHMM_UTC = (dateString: string): string => {
  try {
    const d = new Date(dateString);
    const hours = d.getUTCHours().toString().padStart(2, '0');
    const minutes = d.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '09:00';
  }
};

/**
 * Get a UTC Date object from a datetime string (for date pickers, etc.)
 * This creates a Date where the local time matches the UTC time of the input.
 */
export const getUTCDate = (dateString: string): Date => {
  const d = new Date(dateString);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(),
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
};
