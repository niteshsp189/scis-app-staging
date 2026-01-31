
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/date-input";
import { TimePicker } from "@/components/ui/time-picker";
import { format, addHours } from "date-fns";

interface DateTimeSelectorProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  time: string;
  setTime: (time: string) => void;
  endTime: string;
  setEndTime: (time: string) => void;
  errors?: {
    date?: string;
    time?: string;
    endTime?: string;
    [key: string]: string | undefined;
  };
  isDateOnly?: boolean;
  isTimeOnly?: boolean;
  onValidationChange?: (field: string, error: string | undefined) => void;
}

export const DateTimeSelector = ({
  date,
  setDate,
  time,
  setTime,
  endTime,
  setEndTime,
  errors,
  isDateOnly = false,
  isTimeOnly = false,
  onValidationChange
}: DateTimeSelectorProps) => {
  // Helper function to convert 24-hour time format to 12-hour format
  const to12Hour = (time24: string): string => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHours = h % 12 || 12;
    return `${displayHours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // Helper function to convert 12-hour time format to 24-hour format
  const to24Hour = (time12: string): string => {
    if (!time12) return "";
    const [timePart, modifier] = time12.split(" ");
    let [hours, minutes] = timePart.split(":");
    let h = parseInt(hours, 10);

    if (modifier === "PM" && h < 12) {
      h += 12;
    }
    if (modifier === "AM" && h === 12) {
      h = 0;
    }

    return `${h.toString().padStart(2, "0")}:${minutes}`;
  };

  // Handle time picker change - convert from 12-hour to 24-hour
  const handleTimeChange = (time12: string) => {
    const time24 = to24Hour(time12);
    setTime(time24);
    
    // Revalidate end time when start time changes
    if (endTime && endTime.trim() !== "" && time24) {
      const [startHours, startMinutes] = time24.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);
      
      const startTimeInMinutes = startHours * 60 + startMinutes;
      const endTimeInMinutes = endHours * 60 + endMinutes;
      
      if (endTimeInMinutes <= startTimeInMinutes) {
        const errorMsg = "End time must be after start time";
        if (onValidationChange) {
          onValidationChange('endTime', errorMsg);
        }
      } else {
        // Clear the error if validation passes
        if (onValidationChange) {
          onValidationChange('endTime', undefined);
        }
      }
    }
  };

  // Calculate end time 1 hour after start time
  const calculateEndTime = (startTime24: string): string => {
    if (!startTime24 || !date) return "";
    
    const [hours, minutes] = startTime24.split(":").map(Number);
    const startDateTime = new Date(date);
    startDateTime.setHours(hours, minutes, 0, 0);
    
    const endDateTime = addHours(startDateTime, 1);
    const endHours = endDateTime.getHours().toString().padStart(2, "0");
    const endMinutes = endDateTime.getMinutes().toString().padStart(2, "0");
    
    return `${endHours}:${endMinutes}`;
  };

  // Handle end time change
  const handleEndTimeChange = (time12: string) => {
    const time24 = to24Hour(time12);
    setEndTime(time24);
    
    // Provide immediate validation feedback if end time is before start time
    if (time && time24 && time24.trim() !== "") {
      const [startHours, startMinutes] = time.split(":").map(Number);
      const [endHours, endMinutes] = time24.split(":").map(Number);
      
      const startTimeInMinutes = startHours * 60 + startMinutes;
      const endTimeInMinutes = endHours * 60 + endMinutes;
      
      if (endTimeInMinutes <= startTimeInMinutes) {
        const errorMsg = "End time must be after start time";
        console.warn(errorMsg);
        // Notify parent component of validation error
        if (onValidationChange) {
          onValidationChange('endTime', errorMsg);
        }
      } else {
        // Clear the error if validation passes
        if (onValidationChange) {
          onValidationChange('endTime', undefined);
        }
      }
    } else {
      // Clear error when end time is empty (optional field)
      if (onValidationChange) {
        onValidationChange('endTime', undefined);
      }
    }
  };
  // Render only date field when isDateOnly is true
  if (isDateOnly) {
    return (
      <div className="grid gap-2">
        <Label>Date <span className="text-red-500">*</span></Label>
        <DateInput
          value={date ? format(date, "yyyy-MM-dd") : ""}
          onChange={(value) => {
            if (value) {
              // Parse the date string as local date to avoid timezone issues
              const [year, month, day] = value.split('-').map(Number);
              const selectedDate = new Date(year, month - 1, day, 0, 0, 0, 0); // Set to midnight local time
              setDate(selectedDate);
            } else {
              setDate(undefined);
            }
          }}
          placeholder="Pick a date"
          className={errors?.date ? "border-red-500" : ""}
          required
        />
        {errors?.date && (
          <p className="text-sm text-red-500">{errors.date}</p>
        )}
      </div>
    );
  }

  // Render only time fields when isTimeOnly is true
  if (isTimeOnly) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="time">Start Time <span className="text-red-500">*</span></Label>
          <TimePicker
            value={to12Hour(time)}
            onChange={handleTimeChange}
            placeholder="Select time"
            className={errors?.time ? "border-red-500" : ""}
          />
            <p className="text-xs text-gray-500">
           {/* emptp p for align heigt with end dte structure */}
          </p>
          {errors?.time && (
            <p className="text-sm text-red-500">{errors.time}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="endTime">End Time <span className="text-gray-500">(optional)</span></Label>
          <TimePicker
            value={to12Hour(endTime)}
            onChange={handleEndTimeChange}
            placeholder="Select end time"
            className={errors?.endTime ? "border-red-500" : ""}
          />
          <p className="text-xs text-gray-500">
            Default: 1 hour (can be overridden)
          </p>
          {errors?.endTime && (
            <p className="text-sm text-red-500">{errors.endTime}</p>
          )}
        </div>
      </div>
    );
  }

  // Render the full component (original layout) when neither flag is set
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Date <span className="text-red-500">*</span></Label>
          <DateInput
            value={date ? format(date, "yyyy-MM-dd") : ""}
            onChange={(value) => {
              if (value) {
                // Parse the date string as local date to avoid timezone issues
                const [year, month, day] = value.split('-').map(Number);
                const selectedDate = new Date(year, month - 1, day, 0, 0, 0, 0); // Set to midnight local time
                setDate(selectedDate);
              } else {
                setDate(undefined);
              }
            }}
            placeholder="Pick a date"
            className={errors?.date ? "border-red-500" : ""}
            required
          />
          {errors?.date && (
            <p className="text-sm text-red-500">{errors.date}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="time">Start Time <span className="text-red-500">*</span></Label>
          <TimePicker
            value={to12Hour(time)}
            onChange={handleTimeChange}
            placeholder="Select time"
            className={errors?.time ? "border-red-500" : ""}
          />
          {errors?.time && (
            <p className="text-sm text-red-500">{errors.time}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="endTime">End Time <span className="text-gray-500">(optional)</span></Label>
          <TimePicker
            value={to12Hour(endTime)}
            onChange={handleEndTimeChange}
            placeholder="Select end time"
            className={errors?.endTime ? "border-red-500" : ""}
          />
          {errors?.endTime && (
            <p className="text-sm text-red-500">{errors.endTime}</p>
          )}
        </div>
        
        <div className="flex items-end">
          <p className="text-sm text-gray-500">
            Default duration: 1 hour (can be overridden)
          </p>
        </div>
      </div>
    </div>
  );
};
