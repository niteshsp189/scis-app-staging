import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  requireAll?: boolean; // If true, user must have ALL roles/permissions, not just any
  unauthorizedComponent?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/signin',
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false,
  unauthorizedComponent
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { userPermissions, isLoading: permissionsLoading, hasAnyRole, hasAllRoles, hasAnyPermission, hasAllPermissions } = usePermissions();
  const location = useLocation();

  // Show loading spinner while checking authentication and permissions
  if (isLoading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Only redirect to login if we're sure the user is not authenticated
    // and we're not still loading
    if (!isLoading && !permissionsLoading) {
      // Save the attempted location for redirect after login
      return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }
  }

  // If user is authenticated but trying to access public-only routes (like login)
  if (!requireAuth && isAuthenticated) {
    // Get the intended destination from location state or default to dashboard
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  // If user is authenticated, check role and permission requirements
  if (requireAuth && isAuthenticated) {
    // If no specific roles or permissions required, allow access
    if (requiredRoles.length === 0 && requiredPermissions.length === 0) {
      return <>{children}</>;
    }

    // Check role requirements
    let hasRequiredRoles = true;
    if (requiredRoles.length > 0) {
      hasRequiredRoles = requireAll 
        ? hasAllRoles(requiredRoles)
        : hasAnyRole(requiredRoles);
    }

    // Check permission requirements
    let hasRequiredPermissions = true;
    if (requiredPermissions.length > 0) {
      hasRequiredPermissions = requireAll
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions);
    }

    // Grant access if user has required roles AND permissions
    if (hasRequiredRoles && hasRequiredPermissions) {
      return <>{children}</>;
    }

    // Show unauthorized component or default unauthorized page
    if (unauthorizedComponent) {
      return <>{unauthorizedComponent}</>;
    }

    // Format permission names to be user-friendly
    const formatPermissionName = (perm: string) => {
      return perm
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    // Default unauthorized page with detailed information
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Insufficient Permissions</h1>
          <p className="text-gray-600 mb-6 text-lg">
            You don't have the required permissions to access this page.
          </p>

          {/* Show required permissions */}
          {(requiredPermissions.length > 0 || requiredRoles.length > 0) && (
            <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6 mb-6 text-left">
              <h3 className="font-semibold text-lg mb-4 text-gray-900">Required Access:</h3>
              
              {requiredPermissions.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Permissions needed:</p>
                  <ul className="space-y-2">
                    {requiredPermissions.map((perm) => (
                      <li key={perm} className="flex items-start gap-2 text-sm">
                        <span className="text-blue-600 mt-1">•</span>
                        <span className="text-gray-700">
                          <strong>{formatPermissionName(perm)}</strong>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {requiredRoles.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Roles needed:</p>
                  <ul className="space-y-2">
                    {requiredRoles.map((role) => (
                      <li key={role} className="flex items-start gap-2 text-sm">
                        <span className="text-blue-600 mt-1">•</span>
                        <span className="text-gray-700">
                          <strong>{role}</strong>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-100">
            <p className="text-sm text-gray-700">
              Please contact your system administrator to request the necessary permissions.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.href = "/dashboard"}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User meets the requirements, render the protected content
  return <>{children}</>;
};

/**
 * HOC wrapper for components that require specific permissions
 */
export const withPermissions = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: string[],
  requiredPermissions?: string[],
  requireAll?: boolean
) => {
  return (props: P) => (
    <ProtectedRoute
      requiredRoles={requiredRoles}
      requiredPermissions={requiredPermissions}
      requireAll={requireAll}
    >
      <Component {...props} />
    </ProtectedRoute>
  );
};

/**
 * Conditional rendering component based on permissions
 */
interface ConditionalAccessProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  showLoading?: boolean;
}

export const ConditionalAccess: React.FC<ConditionalAccessProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false,
  fallback = null,
  showLoading = true
}) => {
  const { isAuthenticated } = useAuth();
  const { userPermissions, isLoading, hasAnyRole, hasAllRoles, hasAnyPermission, hasAllPermissions } = usePermissions();

  // Show loading while checking permissions
  if (isLoading && showLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>;
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // If no specific roles or permissions required, show content for authenticated users
  if (requiredRoles.length === 0 && requiredPermissions.length === 0) {
    return <>{children}</>;
  }

  // Check role requirements
  let hasRequiredRoles = true;
  if (requiredRoles.length > 0) {
    hasRequiredRoles = requireAll 
      ? hasAllRoles(requiredRoles)
      : hasAnyRole(requiredRoles);
  }

  // Check permission requirements
  let hasRequiredPermissions = true;
  if (requiredPermissions.length > 0) {
    hasRequiredPermissions = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
  }

  // Show content if user has required roles AND permissions
  if (hasRequiredRoles && hasRequiredPermissions) {
    return <>{children}</>;
  }

  // Show fallback content
  return <>{fallback}</>;
};

export default ProtectedRoute;
