
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

interface OfficeLocation {
  id: string;
  name: string;
  display: string;
  address: string;
}

interface MeetingFormFieldsProps {
  title: string;
  setTitle: (title: string) => void;
  meetingType: string[];
  setMeetingType: (types: string[]) => void;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  setPriority: (priority: 'low' | 'medium' | 'high' | 'urgent') => void;
  location: string;
  setLocation: (location: string) => void;
  description: string;
  setDescription: (description: string) => void;
  errors?: {
    title?: string;
    description?: string;
    location?: string;
    meetingType?: string;
    priority?: string;
    [key: string]: string | undefined;
  };
  hideLocation?: boolean;
}

const appointmentTypes = [
  { value: 'new_client', label: 'New Client' },
  { value: 'supplement', label: 'Supplement' },
  { value: 'part_d', label: 'Part D' },
  { value: 'rate_increase', label: 'Rate increase' },
  { value: 'under_65', label: 'Under 65' },
  { value: 'dental_vision', label: 'Dental & Vision' },
  { value: 'review', label: 'Review' },
  { value: 'customer_service', label: 'Customer Service' },
  { value: 'field_time', label: 'Field Time' },
  { value: 'life_insurance', label: 'Life Insurance' }
];

export const MeetingFormFields = ({
  title,
  setTitle,
  meetingType,
  setMeetingType,
  priority,
  setPriority,
  location,
  setLocation,
  description,
  setDescription,
  errors = {},
  hideLocation = false
}: MeetingFormFieldsProps) => {
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Load office locations when component mounts
  useEffect(() => {
    const loadOfficeLocations = async () => {
      setLoadingLocations(true);
      try {
        const response = await fetch('/api/office-locations/options', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setOfficeLocations(data.data);
          }
        }
      } catch (error) {
        console.error("Failed to load office locations:", error);
      } finally {
        setLoadingLocations(false);
      }
    };

    loadOfficeLocations();
  }, []);

  return (
    <>
      {/* Hide title field as requested */}
      {/* <div className="grid gap-2">
        <Label htmlFor="title">Meeting Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Policy Review Meeting"
          className={errors.title ? 'border-red-500' : ''}
          required
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title}</p>
        )}
      </div> */}

      <div className="grid gap-2">
        <Label htmlFor="meetingType">Appointment Type <span className="text-red-500">*</span></Label>
        <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg">
          {appointmentTypes.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={type.value}
                checked={meetingType.includes(type.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setMeetingType([...meetingType, type.value]);
                  } else {
                    setMeetingType(meetingType.filter(t => t !== type.value));
                  }
                }}
              />
              <Label 
                htmlFor={type.value}
                className="text-sm font-normal cursor-pointer"
              >
                {type.label}
              </Label>
            </div>
          ))}
        </div>
        {errors.meetingType && (
          <p className="text-sm text-red-500">{errors.meetingType}</p>
        )}
        {meetingType.length === 0 && (
          <p className="text-sm text-gray-500">Please select at least one appointment type</p>
        )}
      </div>

      {/* Hide priority field as requested */}
      {/* <div className="grid gap-2">
        <Label htmlFor="priority">Priority *</Label>
        <Select 
          value={priority || 'medium'} 
          onValueChange={(val) => {
            
            setPriority(val as 'low' | 'medium' | 'high' | 'urgent');
          }} 
          required
        >
          <SelectTrigger className={errors.priority ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select priority">
              {priority ? priorityLevels.find(p => p.value === priority)?.label : "Select priority"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {priorityLevels.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.priority && (
          <p className="text-sm text-red-500">{errors.priority}</p>
        )}
        <p className="text-xs text-gray-400">Current value: {priority || 'not set'}</p>
      </div> */}

      {!hideLocation && (
        <div className="grid gap-2">
          <Label htmlFor="location">Office Location</Label>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className={errors.location ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select office location">
                {location ? officeLocations.find(loc => loc.id === location)?.display || location : "Select office location"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {loadingLocations ? (
                <SelectItem value="loading" disabled>
                  Loading locations...
                </SelectItem>
              ) : officeLocations.length === 0 ? (
                <SelectItem value="no-locations" disabled>
                  No office locations available
                </SelectItem>
              ) : (
                officeLocations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.display}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.location && (
            <p className="text-sm text-red-500">{errors.location}</p>
          )}
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="description">Notes</Label>
        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder="Additional notes about the appointment..."
          maxLength={2000}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description}</p>
        )}
      </div>
    </>
  );
};
