import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 - unauthorized - don't automatically clear token
    if (error.response?.status === 401) {
      console.warn("Authentication required - token may be expired");
    }
    
    // Handle 403 - forbidden
    if (error.response?.status === 403) {
      console.warn("Access denied");
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
