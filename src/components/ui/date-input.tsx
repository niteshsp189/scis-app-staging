import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  disabledDates?: (date: Date) => boolean;
  maxDate?: Date;
  minDate?: Date;
  modifiers?: Record<string, (date: Date) => boolean>;
  modifiersStyles?: Record<string, React.CSSProperties>;
}

export function DateInput({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  required = false,
  id,
  className,
  disabledDates,
  maxDate,
  minDate,
  modifiers,
  modifiersStyles,
}: DateInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'calendar' | 'month' | 'year'>('calendar');
  const [selectedYear, setSelectedYear] = React.useState<number>(() => {
    if (value) {
      const [year] = value.split('-').map(Number);
      return year;
    }
    return new Date().getFullYear();
  });
  const [selectedMonth, setSelectedMonth] = React.useState<number>(() => {
    if (value) {
      const [, month] = value.split('-').map(Number);
      return month - 1; // month is 0-indexed
    }
    return new Date().getMonth();
  });

  // Update internal state when value prop changes
  React.useEffect(() => {
    if (value) {
      const [year, month] = value.split('-').map(Number);
      setSelectedYear(year);
      setSelectedMonth(month - 1); // month is 0-indexed
    }
  }, [value]);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [preferredSide, setPreferredSide] = React.useState<"top" | "bottom">("bottom");

  // Check available space and determine optimal position
  React.useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // If there's more space above and below is cramped, prefer top
      if (spaceAbove > spaceBelow && spaceBelow < 350) {
        setPreferredSide("top");
      } else {
        setPreferredSide("bottom");
      }
    }
  }, [isOpen]);

  // Combine all disabled date conditions
  const combinedDisabledDates = React.useCallback((date: Date) => {
    // Normalize the date being checked to midnight for accurate comparison
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    // Check min date constraint (normalize minDate to midnight)
    if (minDate) {
      const normalizedMinDate = new Date(minDate);
      normalizedMinDate.setHours(0, 0, 0, 0);
      if (checkDate < normalizedMinDate) {
        return true;
      }
    }
    
    // Check max date constraint (normalize maxDate to midnight)
    if (maxDate) {
      const normalizedMaxDate = new Date(maxDate);
      normalizedMaxDate.setHours(0, 0, 0, 0);
      if (checkDate > normalizedMaxDate) {
        return true;
      }
    }
    
    // Check custom disabled dates function
    if (disabledDates && disabledDates(date)) {
      return true;
    }
    
    return false;
  }, [minDate, maxDate, disabledDates]);

  // Convert string value to Date object using local timezone
  const dateValue = React.useMemo(() => {
    if (!value) return undefined;
    // Parse yyyy-MM-dd format in local timezone to avoid timezone issues
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }, [value]);

  // Generate year options with constraints
  const currentYear = new Date().getFullYear();
  const minYear = minDate ? minDate.getFullYear() : currentYear - 100;
  const maxYear = maxDate ? maxDate.getFullYear() : currentYear + 100;
  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  // Generate month options
  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date && onChange) {
      // Extract local date components to avoid timezone issues
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      // Format as YYYY-MM-DD using local date components
      const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      onChange(formattedDate);
    }
    setIsOpen(false);
  };

  // Handle year selection
  const handleYearSelect = (year: string) => {
    const yearNum = parseInt(year);
    setSelectedYear(yearNum);
    setViewMode('month'); // Switch to month selection after year is selected
  };

  // Handle month selection
  const handleMonthSelect = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
    setViewMode('calendar'); // Switch back to calendar view
  };

  // Handle month/year header click
  const handleHeaderClick = () => {
    if (viewMode === 'calendar') {
      setViewMode('year');
    }
  };

  return (
    <div className={cn("relative", className)} >
      <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            id={id}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-10",
              !value && "text-muted-foreground",
              disabled && "cursor-not-allowed opacity-50"
            )}
            disabled={disabled}
          >
            <span className="flex-1">
              {value ? format(dateValue!, "PPP") : placeholder}
            </span>
            <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[300px] p-0 z-[9999] max-h-[420px] overflow-auto "
          align="start"
          side={preferredSide}
          sideOffset={5}
          alignOffset={0}
          collisionPadding={10}
          avoidCollisions={true}
          sticky="always"
          onOpenAutoFocus={(e) => e.preventDefault()}
         
        >
          <div className="min-h-[240px] max-h-[380px] flex flex-col" >
            {viewMode === 'year' ? (
              <div className="p-3 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <span className="font-medium">Select Year</span>
                  <div className="w-16" /> {/* Spacer */}
                </div>
                <div className="relative z-[1]">
                  <Select value={selectedYear.toString()} onValueChange={handleYearSelect}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent 
                      className="h-[200px] !z-[9999]" 
                      position="popper"
                      side="bottom"
                      align="center"
                      sideOffset={8}
                      alignOffset={0}
                      avoidCollisions={true}
                      collisionPadding={10}
                      sticky="always"
                    >
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : viewMode === 'month' ? (
              <div className="p-3 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('year')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {selectedYear}
                  </Button>
                  <span className="font-medium">Select Month</span>
                  <div className="w-16" /> {/* Spacer */}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {monthOptions.map((month, index) => (
                    <Button
                      key={month}
                      variant={selectedMonth === index ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleMonthSelect(index)}
                      className="h-10"
                    >
                      {month.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1">
                {/* Custom Calendar with clickable header */}
                <div className="px-2 pt-2 pb-1">
                  <div className="flex items-center justify-between mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
                        const newYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
                        setSelectedMonth(newMonth);
                        setSelectedYear(newYear);
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleHeaderClick}
                      className="font-medium hover:bg-accent"
                    >
                      {monthOptions[selectedMonth]} {selectedYear}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
                        const newYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
                        setSelectedMonth(newMonth);
                        setSelectedYear(newYear);
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Calendar
                    mode="single"
                    selected={dateValue}
                    onSelect={handleDateSelect}
                    disabled={combinedDisabledDates}
                    month={new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0)}
                    onMonthChange={(month) => {
                      setSelectedMonth(month.getMonth());
                      setSelectedYear(month.getFullYear());
                    }}
                    today={(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return today;
                    })()}
                    modifiers={modifiers}
                    modifiersStyles={modifiersStyles}
                    classNames={{
                      caption: "hidden", // Hide the default calendar header
                      caption_label: "hidden",
                      nav: "hidden", // Hide default navigation
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Hidden input for form compatibility and validation */}
      <input
        type="hidden"
        value={value || ""}
        required={required}
        onChange={() => { }} // Controlled by the component above
      />
    </div>
  );
}