import React from 'react';

interface LeaveRequestPreviewProps {
  formData: any;
  users: any[];
}

// Utility function to format time from 24-hour to 12-hour format with AM/PM
const formatTimeTo12Hour = (timeString: string): string => {
  if (!timeString) return "";
  
  // If already in 12-hour format (contains AM/PM), return as is
  if (timeString.includes("AM") || timeString.includes("PM")) {
    return timeString;
  }
  
  // Parse 24-hour format (HH:MM or HH:MM:SS)
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours, 10);
  const minute = parseInt(minutes, 10);
  
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
};

export const LeaveRequestPreview: React.FC<LeaveRequestPreviewProps> = ({ formData, users }) => {
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id.toString() === userId);
    return user ? `${user.first_name} ${user.last_name}` : 'Unknown User';
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Employee</h3>
        <p>{getUserName(formData.user_id)}</p>
      </div>
      <div>
        <h3 className="font-semibold">Manager</h3>
        <p>{getUserName(formData.manager_id)}</p>
      </div>
      <div>
        <h3 className="font-semibold">Leave Type</h3>
        <p>{formData.leave_type === 'full_day' ? 'Full Day' : 'Partial Day'}</p>
      </div>
      <div>
        <h3 className="font-semibold">Dates</h3>
        <p>{formData.start_date} {formData.end_date && `- ${formData.end_date}`}</p>
      </div>
      {formData.leave_type === 'partial_day' && (
        <div>
          <h3 className="font-semibold">Times</h3>
          <p>{formatTimeTo12Hour(formData.start_time)} - {formatTimeTo12Hour(formData.end_time)}</p>
        </div>
      )}
      <div>
        <h3 className="font-semibold">Reason</h3>
        <p>{formData.reason}</p>
      </div>
    </div>
  );
};
