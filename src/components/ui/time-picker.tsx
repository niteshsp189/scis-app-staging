import React, { useState, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}



interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const [hour, minute, ampm] = useMemo(() => {
    if (!value) return ["", "", ""];
    const [time, modifier] = value.split(" ");
    const [h, m] = time.split(":");
    return [h, m, modifier];
  }, [value]);

  const handleHourChange = (h: string) => {
    const newTime = `${h}:${minute || "00"} ${ampm || "AM"}`;
    onChange(newTime);
  };

  const handleMinuteChange = (m: string) => {
    const newTime = `${hour || "12"}:${m} ${ampm || "AM"}`;
    onChange(newTime);
  };

  const handleAmPmChange = (a: string) => {
    const newTime = `${hour || "12"}:${minute || "00"} ${a}`;
    onChange(newTime);
  };

  const hours = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, "0"),
  );
  const minutes = Array.from({ length: 12 }, (_, i) =>
    (i * 5).toString().padStart(2, "0"),
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          {value || placeholder || "Select a time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="flex flex-nowrap flex-row gap-1">
          <Select value={hour} onValueChange={handleHourChange}>
            <SelectTrigger className="focus:ring-0 focus:ring-offset-0 focus:border-0">
              <SelectValue placeholder="Hour" />
            </SelectTrigger>
            <SelectContent className="max-h-48">
              {hours.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={minute} onValueChange={handleMinuteChange}>
            <SelectTrigger className="focus:ring-0 focus:ring-offset-0 focus:border-0">
              <SelectValue placeholder="Minute" />
            </SelectTrigger>
            <SelectContent className="max-h-48">
              {minutes.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ampm} onValueChange={handleAmPmChange}>
            <SelectTrigger className="focus:ring-0 focus:ring-offset-0 focus:border-0">
              <SelectValue placeholder="AM/PM" />
            </SelectTrigger>
            <SelectContent className="max-h-48">
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
};
