import { toast } from '@/components/ui/use-toast';

interface ErrorResponse {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export const handleApiError = (error: any, options: {
  title?: string,
  defaultMessage?: string,
  showToast?: boolean,
  variant?: 'default' | 'destructive',
} = {}) => {
  const {
    title = 'Error',
    defaultMessage = 'An unexpected error occurred',
    showToast = true,
    variant = 'destructive'
  } = options;

  let message = defaultMessage;
  let validationErrors: Record<string, string[]> = {};
  let success = false;

  // Handle our formatted axios errors
  if (error && typeof error === 'object') {
    // Check if this is actually a success message
    if ('success' in error) {
      success = Boolean(error.success);
    }
    
    if ('message' in error) {
      message = error.message as string;
    }

    if ('errors' in error && error.errors) {
      validationErrors = error.errors as Record<string, string[]>;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  // Handle JSON parsing errors
  if (typeof message === 'string' && message.toLowerCase().includes('unexpected token')) {
    message = 'Server Loading Error. Please try again.';
  }

  if (showToast) {
    toast({
      title,
      description: message,
      variant: success ? 'default' : variant
    });
  }

  return {
    success,
    message,
    errors: validationErrors
  };
};

export const formatValidationErrors = (errors: Record<string, string[]>): Record<string, string> => {
  const formatted: Record<string, string> = {};
  Object.entries(errors).forEach(([key, messages]) => {
    formatted[key] = messages[0]; // Take first error message for each field
  });
  return formatted;
};
