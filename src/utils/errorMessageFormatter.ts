/**
 * Utility for formatting and beautifying error messages
 * Converts technical Laravel/backend errors into user-friendly messages
 */

/**
 * Formats error messages to be user-friendly by removing technical jargon
 */
export const formatErrorMessage = (error: string | undefined | null): string => {
  if (!error) return "An unexpected error occurred. Please try again.";
  
  let message = error;
  
  // Handle Laravel "No query results" errors
  // Example: "No query results for model [App\Models\Customer] 55"
  if (message.includes("No query results for model")) {
    const modelMatch = message.match(/\[App\\Models\\(\w+)\]/);
    const idMatch = message.match(/\]\s+(\d+)/);
    
    const modelName = modelMatch ? modelMatch[1] : "Record";
    const recordId = idMatch ? idMatch[1] : "";
    
    return recordId 
      ? `${modelName} with ID ${recordId} could not be found.`
      : `The requested ${modelName.toLowerCase()} could not be found.`;
  }
  
  // Handle Laravel model not found errors
  // Example: "Model [App\Models\Policy] not found"
  if (message.includes("[App\\Models\\")) {
    const modelMatch = message.match(/\[App\\Models\\(\w+)\]/);
    const modelName = modelMatch ? modelMatch[1] : "record";
    return `The requested ${modelName.toLowerCase()} could not be found.`;
  }
  
  // Handle SQL/Database errors
  if (message.includes("SQLSTATE") || message.includes("database") || message.includes("SQL")) {
    return "A database error occurred. Please contact support if this persists.";
  }
  
  // Handle validation errors
  if (message.includes("validation failed") || message.includes("validation error")) {
    return "Please check your input and try again.";
  }
  
  // Handle authentication/authorization errors
  if (message.includes("Unauthenticated") || message.includes("401")) {
    return "Your session has expired. Please log in again.";
  }
  
  if (message.includes("Unauthorized") || message.includes("403")) {
    return "You don't have permission to perform this action.";
  }
  
  // Handle server errors
  if (message.includes("500") || message.includes("Internal Server Error")) {
    return "A server error occurred. Please try again or contact support.";
  }
  
  // Handle network errors
  if (message.includes("Network Error") || message.includes("network")) {
    return "Network connection error. Please check your internet connection.";
  }
  
  // Handle timeout errors
  if (message.includes("timeout") || message.includes("timed out")) {
    return "Request timed out. Please try again.";
  }
  
  // If no pattern matches, return the original message if it's user-friendly
  // Otherwise, return a generic message
  if (message.length > 200 || message.includes("Exception") || message.includes("Error:")) {
    return "An error occurred while processing your request. Please try again.";
  }
  
  return message;
};

/**
 * Extracts a user-friendly title from an error
 */
export const getErrorTitle = (error: any): string => {
  const message = error?.message || error?.toString() || "";
  
  if (message.includes("No query results") || message.includes("not found")) {
    return "Not Found";
  }
  
  if (message.includes("403") || message.includes("Unauthorized")) {
    return "Access Denied";
  }
  
  if (message.includes("401") || message.includes("Unauthenticated")) {
    return "Authentication Required";
  }
  
  if (message.includes("validation")) {
    return "Validation Error";
  }
  
  if (message.includes("500") || message.includes("Internal Server Error")) {
    return "Server Error";
  }
  
  if (message.includes("Network Error")) {
    return "Connection Error";
  }
  
  return "Error";
};

/**
 * Formats API error responses into user-friendly messages
 */
export const formatApiError = (error: any): { title: string; message: string } => {
  // Extract error message from various possible locations
  const errorMessage = 
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    error?.toString() ||
    "An unexpected error occurred";
  
  return {
    title: getErrorTitle(error),
    message: formatErrorMessage(errorMessage)
  };
};
