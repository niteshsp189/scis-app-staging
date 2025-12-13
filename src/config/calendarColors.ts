/**
 * Centralized color configuration for calendar events
 * All appointment types, leave types, and holiday types are defined here
 * Changing colors here will automatically apply to all calendar views (Month, Week, Day)
 */

// Appointment Type Colors
export const APPOINTMENT_COLORS = {
  new_client: {
    background: 'bg-green-500',
    text: 'text-white',
    border: 'border-green-600',
    hover: 'hover:bg-green-600',
  },
  supplement: {
    background: 'bg-blue-500',
    text: 'text-white',
    border: 'border-blue-600',
    hover: 'hover:bg-blue-600',
  },
  part_d: {
    background: 'bg-purple-500',
    text: 'text-white',
    border: 'border-purple-600',
    hover: 'hover:bg-purple-600',
  },
  rate_increase: {
    background: 'bg-orange-500',
    text: 'text-white',
    border: 'border-orange-600',
    hover: 'hover:bg-orange-600',
  },
  under_65: {
    background: 'bg-cyan-500',
    text: 'text-white',
    border: 'border-cyan-600',
    hover: 'hover:bg-cyan-600',
  },
  dental_vision: {
    background: 'bg-pink-500',
    text: 'text-white',
    border: 'border-pink-600',
    hover: 'hover:bg-pink-600',
  },
  review: {
    background: 'bg-indigo-500',
    text: 'text-white',
    border: 'border-indigo-600',
    hover: 'hover:bg-indigo-600',
  },
  customer_service: {
    background: 'bg-teal-500',
    text: 'text-white',
    border: 'border-teal-600',
    hover: 'hover:bg-teal-600',
  },
  field_time: {
    background: 'bg-amber-500',
    text: 'text-white',
    border: 'border-amber-600',
    hover: 'hover:bg-amber-600',
  },
  life_insurance: {
    background: 'bg-emerald-500',
    text: 'text-white',
    border: 'border-emerald-600',
    hover: 'hover:bg-emerald-600',
  },
  meeting: {
    background: 'bg-violet-500',
    text: 'text-white',
    border: 'border-violet-600',
    hover: 'hover:bg-violet-600',
  },
  call: {
    background: 'bg-sky-500',
    text: 'text-white',
    border: 'border-sky-600',
    hover: 'hover:bg-sky-600',
  },
  presentation: {
    background: 'bg-rose-500',
    text: 'text-white',
    border: 'border-rose-600',
    hover: 'hover:bg-rose-600',
  },
  follow_up: {
    background: 'bg-fuchsia-500',
    text: 'text-white',
    border: 'border-fuchsia-600',
    hover: 'hover:bg-fuchsia-600',
  },
  consultation: {
    background: 'bg-lime-500',
    text: 'text-white',
    border: 'border-lime-600',
    hover: 'hover:bg-lime-600',
  },
  quote: {
    background: 'bg-yellow-500',
    text: 'text-gray-900',
    border: 'border-yellow-600',
    hover: 'hover:bg-yellow-600',
  },
  other: {
    background: 'bg-gray-500',
    text: 'text-white',
    border: 'border-gray-600',
    hover: 'hover:bg-gray-600',
  },
} as const;

// Leave Type Colors
export const LEAVE_COLORS = {
  full_day: {
    background: 'bg-[#c83d3d]', // Custom hex color for leave background
    text: 'text-white',
    border: 'border-red-600',
    hover: 'hover:bg-[#b03535]', // Slightly darker for hover
    lightBg: 'bg-red-50',
    badgeBg: 'bg-black', // Badge/heading background for LEAVE label
  },
  partial_day: {
    background: 'bg-[#c83d3d]', // Custom hex color for leave background
    text: 'text-white',
    border: 'border-red-500',
    hover: 'hover:bg-[#b03535]', // Slightly darker for hover
    lightBg: 'bg-red-50',
    badgeBg: 'bg-black', // Badge/heading background for LEAVE label
  },
} as const;

// Holiday Type Colors
export const HOLIDAY_COLORS = {
  public: {
    background: 'bg-orange-500',
    text: 'text-white',
    border: 'border-orange-600',
    hover: 'hover:bg-orange-600',
    lightBg: 'bg-orange-50',
    badgeBg: 'bg-orange-700', // Badge/heading background for HOLIDAY label
  },
  company: {
    background: 'bg-orange-500',
    text: 'text-white',
    border: 'border-orange-600',
    hover: 'hover:bg-orange-600',
    lightBg: 'bg-orange-50',
    badgeBg: 'bg-orange-700', // Badge/heading background for HOLIDAY label
  },
  federal: {
    background: 'bg-orange-500',
    text: 'text-white',
    border: 'border-orange-600',
    hover: 'hover:bg-orange-600',
    lightBg: 'bg-orange-50',
    badgeBg: 'bg-orange-700', // Badge/heading background for HOLIDAY label
  },
  state: {
    background: 'bg-orange-500',
    text: 'text-white',
    border: 'border-orange-600',
    hover: 'hover:bg-orange-600',
    lightBg: 'bg-orange-50',
    badgeBg: 'bg-orange-700', // Badge/heading background for HOLIDAY label
  },
  religious: {
    background: 'bg-orange-500',
    text: 'text-white',
    border: 'border-orange-600',
    hover: 'hover:bg-orange-600',
    lightBg: 'bg-orange-50',
    badgeBg: 'bg-orange-700', // Badge/heading background for HOLIDAY label
  },
  emergency: {
    background: 'bg-red-600',
    text: 'text-white',
    border: 'border-red-700',
    hover: 'hover:bg-red-700',
    lightBg: 'bg-red-50',
    badgeBg: 'bg-red-800', // Badge/heading background for HOLIDAY label
  },
} as const;

// Helper function to get appointment color classes
export const getAppointmentColorClasses = (appointmentType: string) => {
  const type = appointmentType.toLowerCase() as keyof typeof APPOINTMENT_COLORS;
  return APPOINTMENT_COLORS[type] || APPOINTMENT_COLORS.other;
};

// Helper function to get leave color classes
export const getLeaveColorClasses = (leaveType: 'full_day' | 'partial_day') => {
  return LEAVE_COLORS[leaveType] || LEAVE_COLORS.full_day;
};

// Helper function to get holiday color classes
export const getHolidayColorClasses = (holidayType: string) => {
  const type = holidayType.replace('holiday-', '') as keyof typeof HOLIDAY_COLORS;
  return HOLIDAY_COLORS[type] || HOLIDAY_COLORS.public;
};
