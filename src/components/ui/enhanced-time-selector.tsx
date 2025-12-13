import React, { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedTimeSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  startHour?: number;
  endHour?: number;
  interval?: number;
  required?: boolean;
}

// Generate time slots for a 12-hour format display
const generateHours = (is24Hour: boolean = false) => {
  const hours = [];
  
  if (is24Hour) {
    for (let i = 0; i < 24; i++) {
      hours.push({
        value: i,
        display: i.toString().padStart(2, '0')
      });
    }
  } else {
    for (let i = 1; i <= 12; i++) {
      hours.push({
        value: i,
        display: i.toString().padStart(2, '0')
      });
    }
  }
  
  return hours;
};

const generateMinutes = (interval: number = 5) => {
  const minutes = [];
  for (let i = 0; i < 60; i += interval) {
    minutes.push({
      value: i,
      display: i.toString().padStart(2, '0')
    });
  }
  return minutes;
};

export const EnhancedTimeSelector: React.FC<EnhancedTimeSelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Select time",
  className,
  startHour = 0,
  endHour = 24,
  interval = 5,
  required = false
}) => {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [isOpen, setIsOpen] = useState(false);

  // Parse the current value
  React.useEffect(() => {
    if (value) {
      const [hourStr, minuteStr] = value.split(':');
      const hour24 = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);
      
      setSelectedMinute(minute);
      
      if (hour24 === 0) {
        setSelectedHour(12);
        setSelectedPeriod('AM');
      } else if (hour24 < 12) {
        setSelectedHour(hour24);
        setSelectedPeriod('AM');
      } else if (hour24 === 12) {
        setSelectedHour(12);
        setSelectedPeriod('PM');
      } else {
        setSelectedHour(hour24 - 12);
        setSelectedPeriod('PM');
      }
    }
  }, [value]);

  const formatDisplayTime = () => {
    if (selectedHour !== null && selectedMinute !== null) {
      return `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')} ${selectedPeriod}`;
    }
    return placeholder;
  };

  const updateTime = (hour: number | null = selectedHour, minute: number | null = selectedMinute, period: 'AM' | 'PM' = selectedPeriod) => {
    if (hour !== null && minute !== null) {
      let hour24 = hour;
      
      if (period === 'AM' && hour === 12) {
        hour24 = 0;
      } else if (period === 'PM' && hour !== 12) {
        hour24 = hour + 12;
      }
      
      const timeString = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      onValueChange(timeString);
    }
  };

  const handleHourSelect = (hour: number) => {
    setSelectedHour(hour);
    updateTime(hour, selectedMinute, selectedPeriod);
  };

  const handleMinuteSelect = (minute: number) => {
    setSelectedMinute(minute);
    updateTime(selectedHour, minute, selectedPeriod);
  };

  const handlePeriodSelect = (period: 'AM' | 'PM') => {
    setSelectedPeriod(period);
    updateTime(selectedHour, selectedMinute, period);
  };

  const hours = generateHours(false); // Always use 12-hour format for display
  const minutes = generateMinutes(interval);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {formatDisplayTime()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Hours */}
            <div>
              <div className="text-sm font-medium mb-2 text-center">Hour</div>
              <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
                {hours.map((hour) => (
                  <Button
                    key={hour.value}
                    variant={selectedHour === hour.value ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleHourSelect(hour.value)}
                  >
                    {hour.display}
                  </Button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div>
              <div className="text-sm font-medium mb-2 text-center">Minute</div>
              <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
                {minutes.map((minute) => (
                  <Button
                    key={minute.value}
                    variant={selectedMinute === minute.value ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleMinuteSelect(minute.value)}
                  >
                    {minute.display}
                  </Button>
                ))}
              </div>
            </div>

            {/* AM/PM */}
            <div>
              <div className="text-sm font-medium mb-2 text-center">Period</div>
              <div className="grid grid-cols-1 gap-1">
                <Button
                  variant={selectedPeriod === 'AM' ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => handlePeriodSelect('AM')}
                >
                  AM
                </Button>
                <Button
                  variant={selectedPeriod === 'PM' ? "default" : "outline"}
                  size="sm" 
                  className="h-8 text-xs"
                  onClick={() => handlePeriodSelect('PM')}
                >
                  PM
                </Button>
              </div>
            </div>
          </div>

          {/* Current Selection Display */}
          {selectedHour !== null && selectedMinute !== null && (
            <div className="mt-4 p-2 bg-muted rounded text-center">
              <div className="text-sm text-muted-foreground">Selected Time</div>
              <div className="font-medium">{formatDisplayTime()}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setSelectedHour(null);
                setSelectedMinute(null);
                onValueChange('');
                setIsOpen(false);
              }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => setIsOpen(false)}
              disabled={!selectedHour || selectedMinute === null}
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EnhancedTimeSelector;