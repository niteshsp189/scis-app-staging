
import { OfficeLocation } from "@/types/organization";

interface OfficeLocationPreviewProps {
  formData: Partial<OfficeLocation>;
  users?: any[];
}

export function OfficeLocationPreview({ formData, users = [] }: OfficeLocationPreviewProps) {
  // Find manager name from users array
  const managerUser = users.find(user => user.id.toString() === formData.manager_id);
  const managerName = managerUser ? `${managerUser.first_name} ${managerUser.last_name} (${managerUser.email})` : formData.manager_id || 'No Manager';

  // Timezone display mapping
  const getTimezoneDisplay = (timezone: string) => {
    if (!timezone) return '';
    const timezoneMap: { [key: string]: string } = {
      'America/New_York': 'Eastern Time (ET) - New York',
      'America/Chicago': 'Central Time (CT) - Chicago',
      'America/Denver': 'Mountain Time (MT) - Denver',
      'America/Los_Angeles': 'Pacific Time (PT) - Los Angeles',
      'Europe/London': 'Greenwich Mean Time (GMT) - London',
      'Europe/Berlin': 'Central European Time (CET) - Berlin',
      'Asia/Kolkata': 'India Standard Time (IST) - Kolkata',
      'Asia/Dubai': 'Gulf Standard Time (GST) - Dubai',
      'Asia/Riyadh': 'Arabia Standard Time (AST) - Riyadh',
      'Europe/Istanbul': 'Turkey Time - Istanbul'
    };
    return timezoneMap[timezone] || timezone;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Review Office Location</h3>

      {/* Location Name */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Location Name *</label>
        </div>
        <div className="p-3 bg-gray-50 rounded-md border">
          {formData.name || ''}
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Address *</label>
        </div>
        <div className="p-3 bg-gray-50 rounded-md border min-h-[80px]">
          {formData.address || ''}
        </div>
      </div>

      {/* City and State */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">City *</label>
          <div className="p-3 bg-gray-50 rounded-md border">
            {formData.city || ''}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">State/Province *</label>
          <div className="p-3 bg-gray-50 rounded-md border">
            {formData.state || ''}
          </div>
        </div>
      </div>

      {/* Postal Code and Country */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Postal Code *</label>
          <div className="p-3 bg-gray-50 rounded-md border">
            {formData.postal_code || ''}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Country *</label>
          <div className="p-3 bg-gray-50 rounded-md border">
            {formData.country || ''}
          </div>
        </div>
      </div>

      {/* Phone and Email */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Phone</label>
          <div className="p-3 bg-gray-50 rounded-md border">
            {formData.phone || ''}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <div className="p-3 bg-gray-50 rounded-md border">
            {formData.email || ''}
          </div>
        </div>
      </div>

      {/* Timezone */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Timezone</label>
        <div className="p-3 bg-gray-50 rounded-md border">
          {getTimezoneDisplay(formData.timezone || '')}
        </div>
      </div>

      {/* Latitude and Longitude */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Latitude</label>
          <div className="p-3 bg-gray-50 rounded-md border">
            {formData.latitude || ''}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Longitude</label>
          <div className="p-3 bg-gray-50 rounded-md border">
            {formData.longitude || ''}
          </div>
        </div>
      </div>

      {/* Manager */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Manager (Optional)</label>
        <div className="p-3 bg-gray-50 rounded-md border">
          {managerName}
        </div>
      </div>

      {/* Primary and Active */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-row items-center justify-between rounded-lg border p-3 bg-gray-50">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">Primary Location</label>
          </div>
          <div className="text-sm">
            {formData.is_primary ? 'Yes' : 'No'}
          </div>
        </div>
        <div className="flex flex-row items-center justify-between rounded-lg border p-3 bg-gray-50">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">Active</label>
          </div>
          <div className="text-sm">
            {formData.is_active ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
    </div>
  );
}
