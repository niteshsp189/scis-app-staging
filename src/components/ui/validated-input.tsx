import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  showCharCount?: boolean;
  validationHint?: string;
  min?: string;
  max?: string;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
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
  showCharCount = true,
  validationHint,
  min,
  max,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const currentLength = value?.length || 0;
  const isNearLimit = maxLength && currentLength >= maxLength * 0.8;
  const isAtLimit = maxLength && currentLength > maxLength;
  const isAtMaxLength = maxLength && currentLength === maxLength;

  const getValidationMessage = () => {
    if (error) return error;
    if (isAtLimit && maxLength) return `Maximum ${maxLength} characters exceeded`;
    if (isNearLimit && maxLength) return `${maxLength - currentLength} characters remaining`;
    if (validationHint) return validationHint;
    return null;
  };

  const getMessageType = () => {
    if (error) return "error";
    if (isAtLimit) return "warning";
    if (isNearLimit) return "info";
    return "hint";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Prevent typing beyond maxLength
    if (maxLength && newValue.length > maxLength) {
      return; // Don't update if exceeding maxLength
    }
    onChange(newValue);
  };

  const messageType = getMessageType();
  const validationMessage = getValidationMessage();
  const shouldShowMessage = error || (validationHint && (isNearLimit || isAtLimit));

  return (
    <div className="space-y-1 group">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {maxLength && showCharCount && (
          <span
            className={cn(
              "text-xs invisible group-focus-within:visible",
              isAtLimit ? "text-red-500 font-medium" : 
              isAtMaxLength ? "text-gray-600" :
              isNearLimit ? "text-orange-500" : "text-gray-500"
            )}
          >
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
      
      <Input
        ref={inputRef}
        id={id}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        min={min}
        max={max}
        maxLength={maxLength} // Add maxLength attribute as backup
        className={cn(
          className,
          error && "border-red-500 focus:border-red-500",
          isAtLimit && !error && "border-orange-500 focus:border-orange-500"
        )}
        aria-required={required}
      />
      
      <div className="relative h-4">
        {validationMessage && (
          <div
            className={cn(
              "text-xs px-2 py-0.5 rounded absolute transition-opacity duration-300",
              "opacity-0 group-focus-within:opacity-100",
              messageType === "error" && "text-red-600 bg-red-50 border border-red-200 opacity-100",
              messageType === "warning" && "text-orange-600 bg-orange-50 border border-orange-200 opacity-100",
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
};

interface ValidatedSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
  validationHint?: string;
  maxHeight?: string;
  contentClassName?: string;
}

export const ValidatedSelect: React.FC<ValidatedSelectProps> = ({
  id,
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder,
  children,
  className,
  validationHint,
  maxHeight = "max-h-60", // Default to 15rem (240px) which is smaller than the original 24rem
  contentClassName,
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
        onValueChange={onChange}
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
        <SelectContent 
          className={cn(
            // Override the default max-h-96 with our custom maxHeight
            "overflow-y-auto",
            maxHeight,
            contentClassName
          )}
        >
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