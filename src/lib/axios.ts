import axios from "axios";

// Create axios instance with base URL and default config
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, // Required for handling CSRF token
});

// Add request interceptor to add CSRF token and auth token
api.interceptors.request.use((config) => {
  // Get CSRF token from meta tag
  const token = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute("content");
  if (token) {
    config.headers["X-CSRF-TOKEN"] = token;
  }

  // Get auth token from localStorage
  const authToken = localStorage.getItem("auth_token");
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  return config;
});

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network/connection errors
    if (!error.response) {
      return Promise.reject({
        message:
          "Unable to connect to server. Please check your internet connection and try again.",
        status: 0,
      });
    }

    // Format error response
    const errorResponse = {
      status: error.response.status,
      message:
        error.response.data?.message ||
        "An error occurred while processing your request.",
      errors: error.response.data?.errors || {},
    };

    // Handle specific error codes
    switch (error.response.status) {
      case 400:
        // Bad request, usually validation errors
        errorResponse.message =
          error.response.data?.message || "Invalid request parameters";
        break;

      case 401:
        // Unauthorized - don't automatically clear token, let AuthContext handle it
        errorResponse.message = "Your session has expired. Please sign in again.";
        break;

      case 403:
        // Forbidden
        errorResponse.message =
          error.response.data?.message ||
          "You do not have permission to perform this action";
        break;

      case 404:
        // Not found
        errorResponse.message =
          error.response.data?.message ||
          "The requested resource was not found";
        break;
        
      case 409:
        // Conflict responses - preserve the conflicts array
        errorResponse.message = 
          error.response.data?.message || "Conflict detected";
        errorResponse.conflicts = error.response.data?.conflicts || [];
        break;

      case 422:
        // Validation errors - preserve original message and errors
        errorResponse.message =
          error.response.data?.message || "Validation failed";
        errorResponse.errors = error.response.data?.errors || {};
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors
        errorResponse.message =
          "A system error occurred. Please try again later or contact support if the problem persists.";
        break;
    }

    // Return a rejected promise with the formatted error
    // For validation errors and conflicts, preserve the original error structure
    if (error.response.status === 422 || error.response.status === 409) {
      return Promise.reject({
        response: {
          status: error.response.status,
          data: error.response.data, // Preserve the entire original response data
        },
      });
    }

    return Promise.reject(errorResponse);
  },
);
