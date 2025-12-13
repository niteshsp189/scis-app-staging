import { usePermissions } from '@/contexts/PermissionContext';

/**
 * Custom hook for permission-based access control
 * Provides convenient methods for checking user permissions and roles
 */
export const useAuth = () => {
  const {
    userPermissions,
    isLoading,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    refreshPermissions
  } = usePermissions();

  return {
    userPermissions,
    isLoading,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    refreshPermissions
  };
};

/**
 * Hook for role-based access control
 * @param requiredRoles - Array of role names that grant access
 * @returns Object with access status and role checking functions
 */
export const useRoleAccess = (requiredRoles: string[]) => {
  const { hasAnyRole, hasAllRoles, hasRole } = usePermissions();

  return {
    hasAccess: hasAnyRole(requiredRoles),
    hasAllRequiredRoles: hasAllRoles(requiredRoles),
    hasRole,
    hasAnyRole,
    hasAllRoles
  };
};

/**
 * Hook for permission-based access control
 * @param requiredPermissions - Array of permission names that grant access
 * @returns Object with access status and permission checking functions
 */
export const usePermissionAccess = (requiredPermissions: string[]) => {
  const { hasAnyPermission, hasAllPermissions, hasPermission } = usePermissions();

  return {
    hasAccess: hasAnyPermission(requiredPermissions),
    hasAllRequiredPermissions: hasAllPermissions(requiredPermissions),
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  };
};

/**
 * Hook for combined role and permission access control
 * @param requiredRoles - Array of role names that grant access
 * @param requiredPermissions - Array of permission names that grant access
 * @returns Object with access status and checking functions
 */
export const useAccessControl = (requiredRoles?: string[], requiredPermissions?: string[]) => {
  const { canAccess, hasRole, hasPermission } = usePermissions();

  return {
    hasAccess: canAccess(requiredRoles, requiredPermissions),
    hasRole,
    hasPermission,
    canAccess
  };
};

/**
 * Hook specifically for admin-level access
 * Checks for admin or super_admin roles
 */
export const useAdminAccess = () => {
  const { hasAnyRole } = usePermissions();
  
  return {
    isAdmin: hasAnyRole(['admin', 'super_admin']),
    isSuperAdmin: hasAnyRole(['super_admin'])
  };
};

/**
 * Hook for checking specific business permissions
 * Provides shortcuts for common permission patterns
 */
export const useBusinessPermissions = () => {
  const { hasPermission, hasAnyPermission } = usePermissions();

  return {
    // Customer permissions
    canViewCustomers: hasPermission('view_customers'),
    canCreateCustomers: hasPermission('create_customers'),
    canEditCustomers: hasPermission('update_customers'),
    canDeleteCustomers: hasPermission('delete_customers'),
    canManageCustomers: hasAnyPermission(['create_customers', 'update_customers', 'delete_customers']),

    // Policy permissions
    canViewPolicies: hasPermission('view_policies'),
    canCreatePolicies: hasPermission('create_policies'),
    canEditPolicies: hasPermission('update_policies'),
    canDeletePolicies: hasPermission('delete_policies'),
    canManagePolicies: hasAnyPermission(['create_policies', 'update_policies', 'delete_policies']),

    // Administrative permissions
    canViewUsers: hasPermission('view_users'),
    canManageUsers: hasPermission('manage_users'),
    canManageRoles: hasPermission('manage_roles'),
    canViewAuditLogs: hasPermission('view_audit_logs'),
    canManageSystemSettings: hasPermission('manage_system_settings'),

    // Dashboard and reporting
    canViewDashboard: hasPermission('view_dashboard'),
    canViewReports: hasPermission('view_reports'),
    canExportData: hasPermission('export_data'),

    // Check specific permission by name
    hasPermission
  };
};

export default useAuth;
