import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { authService } from '@/services/authService';

export interface Role {
  id: string;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
}

export interface UserPermissions {
  roles: Role[];
  permissions: Permission[];
  roleNames: string[];
  permissionNames: string[];
}

interface PermissionContextType {
  userPermissions: UserPermissions | null;
  isLoading: boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
  hasAllRoles: (roleNames: string[]) => boolean;
  hasPermission: (permissionName: string) => boolean;
  hasAnyPermission: (permissionNames: string[]) => boolean;
  hasAllPermissions: (permissionNames: string[]) => boolean;
  canAccess: (requiredRoles?: string[], requiredPermissions?: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize permissions when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserPermissions();
    } else {
      setUserPermissions(null);
    }
  }, [isAuthenticated, user]);

  const fetchUserPermissions = async (): Promise<void> => {
    if (!isAuthenticated || !authService.getToken()) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Try to get fresh user data with roles and permissions
      const userProfile = await authService.getProfile();
      
      // Extract roles and permissions from user data
      const roles: Role[] = userProfile.roles?.map(roleName => ({
        id: roleName,
        name: roleName,
        guard_name: 'web',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) || [];

      const permissions: Permission[] = userProfile.permissions?.map(permissionName => ({
        id: permissionName,
        name: permissionName,
        guard_name: 'web',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) || [];

      const roleNames = userProfile.roles || [];
      const permissionNames = userProfile.permissions || [];

      setUserPermissions({
        roles,
        permissions,
        roleNames,
        permissionNames,
      });
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
      setUserPermissions(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPermissions = async (): Promise<void> => {
    await fetchUserPermissions();
  };

  // Role checking functions
  const hasRole = (roleName: string): boolean => {
    if (!userPermissions) return false;
    return userPermissions.roleNames.includes(roleName);
  };

  const hasAnyRole = (roleNames: string[]): boolean => {
    if (!userPermissions || roleNames.length === 0) return false;
    return roleNames.some(roleName => userPermissions.roleNames.includes(roleName));
  };

  const hasAllRoles = (roleNames: string[]): boolean => {
    if (!userPermissions || roleNames.length === 0) return false;
    return roleNames.every(roleName => userPermissions.roleNames.includes(roleName));
  };

  // Permission checking functions
  const hasPermission = (permissionName: string): boolean => {
    if (!userPermissions) return false;
    return userPermissions.permissionNames.includes(permissionName);
  };

  const hasAnyPermission = (permissionNames: string[]): boolean => {
    if (!userPermissions || permissionNames.length === 0) return false;
    return permissionNames.some(permissionName => userPermissions.permissionNames.includes(permissionName));
  };

  const hasAllPermissions = (permissionNames: string[]): boolean => {
    if (!userPermissions || permissionNames.length === 0) return false;
    return permissionNames.every(permissionName => userPermissions.permissionNames.includes(permissionName));
  };

  // Combined access checking
  const canAccess = (requiredRoles?: string[], requiredPermissions?: string[]): boolean => {
    // If no requirements specified, allow access (authenticated users only)
    if (!requiredRoles?.length && !requiredPermissions?.length) {
      return isAuthenticated;
    }

    // If not authenticated, deny access
    if (!isAuthenticated || !userPermissions) {
      return false;
    }

    // Check roles (if specified)
    const roleCheck = !requiredRoles?.length || hasAnyRole(requiredRoles);
    
    // Check permissions (if specified)
    const permissionCheck = !requiredPermissions?.length || hasAnyPermission(requiredPermissions);

    // Both checks must pass
    return roleCheck && permissionCheck;
  };

  const value: PermissionContextType = {
    userPermissions,
    isLoading,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    refreshPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

export default PermissionContext;
