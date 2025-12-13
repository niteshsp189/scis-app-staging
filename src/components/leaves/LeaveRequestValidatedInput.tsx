import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ValidatedInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  maxLength?: number;
  type?: string;
  placeholder?: string;
  className?: string;
  validationHint?: string;
}

export const LeaveRequestValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>((
  {
    id,
    label,
    value,
    onChange,
    error,
    required = false,
    maxLength,
    type = "text",
    placeholder,
    className,
    validationHint,
  },
  ref
) => {
  const [isFocused, setIsFocused] = useState(false);

  const currentLength = value?.length || 0;
  const isAtLimit = maxLength && currentLength > maxLength;

  const getValidationMessage = () => {
    if (error) return error;
    if (validationHint) return validationHint;
    return null;
  };

  const getMessageType = () => {
    if (error) return "error";
    if (isFocused) return "info";
    return "hint";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    onChange(newValue);
  };

  const messageType = getMessageType();
  const validationMessage = getValidationMessage();

  const shouldShowValidation = error || (validationHint && isFocused);

  return (
    <div className="space-y-2 group">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className={cn("text-sm font-medium", error && "text-red-600")}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {maxLength && (
          <span
            className={cn(
              "text-xs invisible group-focus-within:visible",
              isAtLimit ? "text-red-500 font-medium" : "text-gray-500"
            )}
          >
            {currentLength}/{maxLength}
          </span>
        )}
      </div>

      <Input
        ref={ref}
        id={id}
        type={type}
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={cn(
          className,
          error && "border-red-500 focus:border-red-500"
        )}
      />

      <div className={cn("relative transition-all duration-300", shouldShowValidation ? "h-6" : "h-0")}>
        {validationMessage && (
          <div
            className={cn(
              "text-xs px-2 mb-4 py-0.5 rounded absolute transition-opacity duration-300 -translate-y-0.5",
              shouldShowValidation ? "opacity-100" : "opacity-0",
              messageType === "error" && "text-red-600 bg-red-50 border border-red-200",
              messageType === "info" && "text-blue-600 bg-blue-50 border border-blue-200",
              messageType === "hint" && "text-gray-600 bg-gray-50 border border-gray-200"
            )}
          >
            {validationMessage}
          </div>
        )}
      </div>
    </div>
  );
});

interface ValidatedSelectProps {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
  validationHint?: string;
}

export const LeaveRequestValidatedSelect: React.FC<ValidatedSelectProps> = ({
  id,
  label,
  value,
  onValueChange,
  error,
  required = false,
  placeholder,
  children,
  className,
  validationHint,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <Select
        value={value}
        onValueChange={onValueChange}
        onOpenChange={(open) => {
          if (open) setIsFocused(true);
          else setIsFocused(false);
        }}
      >
        <SelectTrigger
          className={cn(
            className,
            error && "border-red-500"
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>

      {error && (
        <div className="text-xs px-2 py-1 rounded text-red-600 bg-red-50 border border-red-200">
          {error}
        </div>
      )}

      {!error && validationHint && isFocused && (
        <div className="text-xs px-2 py-1 rounded text-gray-600 bg-gray-50 border border-gray-200">
          {validationHint}
        </div>
      )}
    </div>
  );
};
