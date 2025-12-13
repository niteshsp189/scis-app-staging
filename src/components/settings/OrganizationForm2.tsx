import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { organizationApi } from '@/services/api/organization';
import { DateInput } from '@/components/ui/date-input';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { timezoneApi } from '@/services/api/timezone';
import { Timezone } from '@/types/organization';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const formSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255, 'Organization name must be less than 255 characters'),
  industry: z.string().max(255, 'Industry must be less than 255 characters').optional().or(z.literal('')),
  website: z.string().url('Please enter a valid URL').max(255, 'Website URL must be less than 255 characters').optional().or(z.literal('')),
  phone: z.string().regex(/^[\+]?[\d\s\(\)\-]+$/, 'Please enter a valid phone number (numbers, spaces, parentheses, and hyphens only)').max(50, 'Phone number must be less than 50 characters').optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email address').max(255, 'Email must be less than 255 characters').optional().or(z.literal('')),
  address: z.string().max(1000, 'Address must be less than 1000 characters').optional().or(z.literal('')),
  city: z.string().max(255, 'City must be less than 255 characters').optional().or(z.literal('')),
  state: z.string().max(255, 'State must be less than 255 characters').optional().or(z.literal('')),
  postal_code: z.string().max(20, 'Zip code must be less than 20 characters').regex(/^[A-Za-z0-9\s\-]*$/, 'Zip code can only contain letters, numbers, spaces, and hyphens').optional().or(z.literal('')),
  country: z.string().max(255, 'Country must be less than 255 characters').optional().or(z.literal('')),
  timezone: z.string().max(255, 'Timezone must be less than 255 characters').optional().or(z.literal('')),
  tax_id: z.string().max(50, 'Tax ID must be less than 50 characters').regex(/^[A-Za-z0-9\-\s]*$/, 'Tax ID can only contain letters, numbers, spaces, and hyphens').optional().or(z.literal('')),
  registration_number: z.string().max(50, 'Registration number must be less than 50 characters').regex(/^[A-Za-z0-9\-\s]*$/, 'Registration number can only contain letters, numbers, spaces, and hyphens').optional().or(z.literal('')),
  established_date: z.string().optional().or(z.literal('')),
});
export type OrganizationFormData = z.infer<typeof formSchema>;
// Auto-Hide Form Message Component
interface AutoHideFormMessageProps {
  error?: string;
  className?: string;
  submissionKey?: number; // Add key to force re-render on new submissions
}
const AutoHideFormMessage: React.FC<AutoHideFormMessageProps> = ({ error, className, submissionKey }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [lastSubmissionKey, setLastSubmissionKey] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (error) {
      // Show message if there's an error and either:
      // 1. It's a new error (first time)
      // 2. It's a new submission (submissionKey changed)
      const isNewSubmission = submissionKey !== undefined && submissionKey !== lastSubmissionKey;
      if (isNewSubmission || !isVisible) {
        setIsVisible(true);
        setLastSubmissionKey(submissionKey || 0);
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        // Set new timeout to hide after 5 seconds
        timeoutRef.current = setTimeout(() => {
          setIsVisible(false);
        }, 5000);
      }
    } else {
      setIsVisible(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [error, submissionKey, lastSubmissionKey, isVisible]);
  if (!error || !isVisible) return null;
  return (
    <div className={cn(
      "text-xs text-red-600 transition-opacity duration-300",
      isVisible ? "opacity-100" : "opacity-0",
      className
    )}>
      {error}
    </div>
  );
};

// Validation Hint Component for better user guidance
interface ValidationHintProps {
  value: string;
  maxLength?: number;
  hint?: string;
  error?: boolean;
  pattern?: string;
  examples?: string[];
}

const ValidationHint: React.FC<ValidationHintProps> = ({
  value,
  maxLength,
  hint,
  error,
  pattern,
  examples = []
}) => {
  const currentLength = value?.length || 0;
  const isNearLimit = maxLength && currentLength >= maxLength * 0.8;
  const isAtLimit = maxLength && currentLength >= maxLength;

  if (error) return null; // Don't show helper when there's an error

  return (
    <div className="space-y-1">
      {/* Main hint */}
      {hint && (
        <div className="flex justify-between items-start text-xs">
          <span className="text-gray-500 flex-1">
            {hint}
          </span>
          {maxLength && (
            <span className={cn(
              "font-medium ml-2",
              isAtLimit ? "text-red-500" :
                isNearLimit ? "text-orange-500" : "text-gray-400"
            )}>
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      )}

      {/* Pattern info */}
      {pattern && (
        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
          <span className="font-medium">Allowed:</span> {pattern}
        </div>
      )}

      {/* Examples */}
      {examples.length > 0 && (
        <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
          <span className="font-medium">Examples:</span> {examples.join(', ')}
        </div>
      )}
    </div>
  );
};

// Focused Validation Hint - Only shows when field is focused or has content
interface FocusedValidationHintProps {
  isFocused: boolean;
  hasValue: boolean;
  pattern?: string;
  examples?: string[];
}

const FocusedValidationHint: React.FC<FocusedValidationHintProps> = ({
  isFocused,
  hasValue,
  pattern,
  examples = []
}) => {
  // Only show when field is actively focused
  if (!isFocused) return null;

  return (
    <div className="mt-1 space-y-1 transition-all duration-200 ease-in-out">
      {/* Pattern info - only when focused */}
      {pattern && (
        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
          <span className="font-medium">Allowed:</span> {pattern}
        </div>
      )}

      {/* Examples - only when focused */}
      {examples.length > 0 && (
        <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
          <span className="font-medium">Examples:</span> {examples.join(', ')}
        </div>
      )}
    </div>
  );
};

// Field Label with Character Count
interface FieldLabelWithCountProps {
  label: string;
  required?: boolean;
  currentLength?: number;
  maxLength?: number;
  showCount: boolean;
  isFocused?: boolean;
}

const FieldLabelWithCount: React.FC<FieldLabelWithCountProps> = ({
  label,
  required,
  currentLength = 0,
  maxLength,
  showCount,
  isFocused = false
}) => {
  const isNearLimit = maxLength && currentLength >= maxLength * 0.8;
  const isAtLimit = maxLength && currentLength >= maxLength;

  return (
    <div className="flex justify-between items-center">
      <span>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      {showCount && maxLength && isFocused && (
        <span className={cn(
          "text-xs font-medium transition-colors",
          isAtLimit ? "text-red-500" :
            isNearLimit ? "text-orange-500" : "text-blue-600"
        )}>
          {currentLength}/{maxLength}
        </span>
      )}
    </div>
  );
};
export function OrganizationForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [submissionCounter, setSubmissionCounter] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  // Focus state tracking for validation hints
  const [focusedFields, setFocusedFields] = useState<Set<string>>(new Set());
  const [timezones, setTimezones] = useState<Timezone[]>([]);

  const handleFieldFocus = (fieldName: string) => {
    setFocusedFields(prev => new Set(prev).add(fieldName));
  };

  const handleFieldBlur = (fieldName: string) => {
    setFocusedFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldName);
      return newSet;
    });
  };
  // Helper function to get field display name (handles snake_case and camelCase)
  const getFieldDisplayName = (fieldName: string) => {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // split camelCase
      .replace(/\b\w/g, l => l.toUpperCase());
  };
  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      industry: '',
      website: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      timezone: '',
      tax_id: '',
      registration_number: '',
      established_date: '',
    },
  });
  // Load form data from localStorage on component mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('organizationFormData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        form.reset(parsedData);
      }
    } catch (error) {
      console.warn('Failed to load saved organization form data:', error);
    }
  }, [form]);
  // Save form data to localStorage whenever it changes
  useEffect(() => {
    const subscription = form.watch((data) => {
      try {
        localStorage.setItem('organizationFormData', JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save organization form data:', error);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);
  useEffect(() => {
    const loadOrganizationSettings = async () => {
      try {
        setIsInitialLoading(true);
        const settings = await organizationApi.getOrganizationSettings();
        // Map settings to form data
        form.reset({
          name: settings['company.name']?.value || '',
          industry: settings['company.industry']?.value || '',
          website: settings['company.website']?.value || '',
          phone: settings['company.phone']?.value || '',
          email: settings['company.email']?.value || '',
          address: settings['company.address']?.value || '',
          city: settings['company.city']?.value || '',
          state: settings['company.state']?.value || '',
          postal_code: settings['company.postal_code']?.value || '',
          country: settings['company.country']?.value || '',
          timezone: settings['company.timezone']?.value || '',
          tax_id: settings['company.tax_id']?.value || '',
          registration_number: settings['company.registration_number']?.value || '',
          established_date: settings['company.established_date']?.value || '',
        });
        // Show success feedback
        toast({
          title: 'Settings Loaded',
          description: 'Organization settings loaded successfully',
        });
      } catch (error) {
        console.error('Failed to load organization settings:', error);
        toast({
          variant: 'destructive',
          title: 'Loading Error',
          description: 'Failed to load organization settings. Please refresh the page.',
        });
      } finally {
        setIsInitialLoading(false);
      }
    };

    const loadTimezones = async () => {
      try {
        const data = await timezoneApi.getTimezones({ active_only: true });
        setTimezones(data);
      } catch (error) {
        console.error('Failed to load timezones:', error);
        // Don't show error toast for timezones as it's not critical
      }
    };

    loadOrganizationSettings();
    loadTimezones();
  }, [form, toast]);
  const onSubmit = async (data: OrganizationFormData) => {
    // Increment submission counter for consistent validation message display
    setSubmissionCounter(prev => prev + 1);
    // Show loading toast immediately
    const loadingToast = toast({
      title: 'Saving...',
      description: 'Updating organization settings...',
      duration: Infinity, // Keep it open until we dismiss it
    });
    try {
      setIsLoading(true);
      setSaveStatus('saving');
      // reset any previous client/server error tracking (handled via form.setError)
      await organizationApi.updateOrganizationSettings(data);
      setSaveStatus('success');
      // Dismiss loading toast and show success
      loadingToast.dismiss();
      toast({
        title: 'Success',
        description: 'Organization settings updated successfully',
        duration: 3000,
      });
      // Clear saved form data after successful submission
      try {
        localStorage.removeItem('organizationFormData');
      } catch (error) {
        console.warn('Failed to clear saved organization form data:', error);
      }
      // Reset success status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Failed to update organization settings:', error);
      setSaveStatus('error');
      // Dismiss loading toast
      loadingToast.dismiss();
      // Check if this is a validation error (422 status code)
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        let firstErrorField = '';
        // Set form errors for each field
        Object.entries(serverErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            // Convert snake_case to camelCase for react-hook-form field names
            const camelCaseField = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            form.setError(camelCaseField as keyof OrganizationFormData, {
              type: "server",
              message: messages[0]
            });
            // Track first error field for scrolling
            if (!firstErrorField) {
              firstErrorField = camelCaseField;
            }
          }
        });
        // Scroll to first error field after a short delay to allow DOM updates
        if (firstErrorField) {
          const scrollToErrorField = () => {
            const errorElement = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
            if (errorElement) {
              // Use scrollIntoView for better layout-aware positioning
              errorElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center', // Center the element in the viewport
                inline: 'nearest'
              });
              // After scrollIntoView, fine-tune the position
              setTimeout(() => {
                const rect = errorElement.getBoundingClientRect();
                const currentScrollY = window.pageYOffset;
                const elementTop = rect.top + currentScrollY;
                const viewportHeight = window.innerHeight;
                // Calculate ideal position (element should be in upper third of viewport)
                const idealPosition = elementTop - (viewportHeight * 0.25);
                window.scrollTo({
                  top: Math.max(0, idealPosition),
                  behavior: 'smooth'
                });
                // Focus on the error field after positioning
                setTimeout(() => {
                  if (errorElement instanceof HTMLInputElement || errorElement instanceof HTMLTextAreaElement) {
                    errorElement.focus({ preventScroll: true });
                    errorElement.select();
                  }
                }, 300);
              }, 500);
            }
          };
          // Execute with delay to ensure DOM is ready
          setTimeout(scrollToErrorField, 100);
        }
        // Show toast with first error message
        const firstErrorFieldKey = Object.keys(serverErrors)[0];
        const firstErrorMessage = Array.isArray(serverErrors[firstErrorFieldKey])
          ? serverErrors[firstErrorFieldKey][0]
          : "Validation error occurred";
        toast({
          title: "Validation Error",
          description: `${getFieldDisplayName(firstErrorFieldKey)}: ${firstErrorMessage}`,
          variant: "destructive",
          duration: 5000,
        });
      } else {
        // Generic error
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to update organization settings',
          duration: 5000,
        });
      }
      // Reset error status after 5 seconds
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setIsLoading(false);
    }
  };
  // Handle client-side validation failures from react-hook-form
  const onInvalid = (errors: any) => {
    // Increment submission counter for consistent validation message display
    setSubmissionCounter(prev => prev + 1);
    try {
      const firstField = Object.keys(errors)[0];
      if (firstField) {
        const scrollToErrorField = () => {
          const el = document.querySelector(`[name="${firstField}"]`) as HTMLElement;
          if (el) {
            // Use scrollIntoView for better layout-aware positioning
            el.scrollIntoView({
              behavior: 'smooth',
              block: 'center', // Center the element in the viewport
              inline: 'nearest'
            });
            // After scrollIntoView, fine-tune the position
            setTimeout(() => {
              const rect = el.getBoundingClientRect();
              const currentScrollY = window.pageYOffset;
              const elementTop = rect.top + currentScrollY;
              const viewportHeight = window.innerHeight;
              // Calculate ideal position (element should be in upper third of viewport)
              const idealPosition = elementTop - (viewportHeight * 0.25);
              window.scrollTo({
                top: Math.max(0, idealPosition),
                behavior: 'smooth'
              });
              // Focus on the error field after positioning
              setTimeout(() => {
                if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                  el.focus({ preventScroll: true });
                  el.select();
                }
              }, 300);
            }, 500);
          }
        };
        // Execute with delay to ensure DOM is ready
        setTimeout(scrollToErrorField, 100);
        const message = errors[firstField]?.message || 'Please check this field.';
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: `${getFieldDisplayName(firstField)}: ${message}`,
          duration: 5000,
        });
      }
    } catch (e) {
      console.warn('onInvalid handler failed', e);
    }
  };
  return (
    <div className="space-y-5">
      {/* Loading State */}
      {isInitialLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 14 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="h-10 bg-gray-200 rounded animate-pulse w-32"></div>
        </div>
      )}
      {/* Form */}
      {!isInitialLoading && (
        <Form {...form}>
          <form
            ref={formRef}
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            className="space-y-6"
            noValidate
          >
            {/* Success Banner */}
            {saveStatus === 'success' && (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-green-800 font-medium text-sm">Settings saved successfully!</span>
              </div>
            )}
            {/* Error Banner */}
            {saveStatus === 'error' && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span className="text-red-800 font-medium text-sm">Please check the errors below and try again.</span>
              </div>
            )}
            
            {/* TEST: Minimal grid with just save button */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex items-center gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "min-w-[140px] h-10 font-medium transition-all duration-200",
                    saveStatus === 'success' && "bg-green-600 hover:bg-green-700 border-green-600",
                    saveStatus === 'error' && "bg-red-600 hover:bg-red-700 border-red-600",
                    "shadow-sm"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : saveStatus === 'success' ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Saved!
                    </>
                  ) : saveStatus === 'error' ? (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Try Again
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
