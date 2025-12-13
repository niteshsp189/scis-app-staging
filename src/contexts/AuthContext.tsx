import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, LoginCredentials, RegisterData } from '@/services/authService';
import { handleApiError } from '@/utils/error';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<boolean>;
  uploadAvatar: (avatarFile: File) => Promise<boolean>;
  deleteAvatar: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && authService.isAuthenticated();

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = authService.getToken();
      
      if (token) {
        try {
          const userProfile = await authService.getProfile();
          setUser(userProfile);
        } catch (error: any) {
          console.error('Failed to fetch user profile:', error);
          // Only clear token if it's definitely a 401 (expired/invalid)
          // Don't clear token for network errors, server errors, etc.
          if (error?.status === 401) {
            authService.clearToken();
            setUser(null);
            handleApiError(error, {
              title: 'Session Expired',
              defaultMessage: 'Your session has expired. Please sign in again.'
            });
          }
          // For other errors (500, network issues), assume user is still authenticated
          // We'll try to get the profile again later or on next API call
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);

      if (response.success && response.user) {
        setUser(response.user);
        handleApiError({ 
          message: `Hello ${response.user.first_name}! You're now logged in.` 
        }, {
          title: 'Welcome back!',
          variant: 'default'
        });
        setIsLoading(false);
        return true;
      } else {
        // Check if this is a 2FA requirement - don't show error toast for this
        if (response.requires_2fa) {
          setIsLoading(false); // Set loading to false to show the 2FA form
          // Let the component handle the 2FA flow
          throw response;
        }
        
        setIsLoading(false);
        handleApiError(response, {
          title: 'Login Failed',
          defaultMessage: 'Invalid credentials'
        });
        return false;
      }
    } catch (error) {
      // If it's a 2FA requirement, re-throw it for the component to handle
      if (error && typeof error === 'object' && 'requires_2fa' in error) {
        setIsLoading(false); // Set loading to false to show the 2FA form
        throw error;
      }
      
      setIsLoading(false);
      handleApiError(error, {
        title: 'Login Failed',
        defaultMessage: 'An error occurred while trying to log in'
      });
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authService.register(userData);

      if (response.success && response.user) {
        setUser(response.user);
        handleApiError({ 
          message: `Welcome to SCIS, ${response.user.first_name}!` 
        }, {
          title: 'Registration Successful',
          variant: 'default'
        });
        return true;
      } else {
        handleApiError(response, {
          title: 'Registration Failed',
          defaultMessage: 'Unable to create your account'
        });
        return false;
      }
    } catch (error) {
      handleApiError(error, {
        title: 'Registration Failed',
        defaultMessage: 'An error occurred while trying to create your account'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      handleApiError({ 
        message: 'You have been successfully logged out.' 
      }, {
        title: 'Logged Out',
        variant: 'default'
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if API call fails
      setUser(null);
      handleApiError({ 
        message: 'You have been logged out.' 
      }, {
        title: 'Logged Out',
        variant: 'default'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logoutAll = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.logoutAll();
      setUser(null);
      handleApiError({ 
        message: 'You have been logged out from all devices.' 
      }, {
        title: 'Logged Out',
        variant: 'default'
      });
    } catch (error) {
      console.error('Logout all failed:', error);
      // Still clear local state even if API call fails
      setUser(null);
      handleApiError({ 
        message: 'You have been logged out from all devices.' 
      }, {
        title: 'Logged Out',
        variant: 'default'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData: Partial<User>): Promise<boolean> => {
    try {
      setIsLoading(true);
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
      handleApiError({ 
        message: 'Your profile has been updated successfully.' 
      }, {
        title: 'Profile Updated',
        variant: 'default'
      });
      return true;
    } catch (error) {
      handleApiError(error, {
        title: 'Profile Update Failed',
        defaultMessage: 'Unable to update your profile'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadAvatar = async (avatarFile: File): Promise<boolean> => {
    try {
      setIsLoading(true);
      const updatedUser = await authService.uploadAvatar(avatarFile);
      setUser(updatedUser);
      handleApiError({ 
        message: 'Your profile photo has been updated successfully.' 
      }, {
        title: 'Photo Updated',
        variant: 'default'
      });
      return true;
    } catch (error) {
      handleApiError(error, {
        title: 'Photo Upload Failed',
        defaultMessage: 'Unable to upload your profile photo'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAvatar = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const updatedUser = await authService.deleteAvatar();
      setUser(updatedUser);
      handleApiError({ 
        message: 'Your profile photo has been removed successfully.' 
      }, {
        title: 'Photo Removed',
        variant: 'default'
      });
      return true;
    } catch (error) {
      handleApiError(error, {
        title: 'Photo Deletion Failed',
        defaultMessage: 'Unable to remove your profile photo'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      if (authService.isAuthenticated()) {
        const userProfile = await authService.getProfile();
        setUser(userProfile);
      }
    } catch (error: any) {
      console.error('Failed to refresh user:', error);
      // Only clear token if it's definitely a 401 (expired/invalid)
      if (error?.status === 401) {
        setUser(null);
        authService.clearToken();
        handleApiError(error, {
          title: 'Session Expired',
          defaultMessage: 'Your session has expired. Please sign in again.'
        });
      }
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    logoutAll,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
