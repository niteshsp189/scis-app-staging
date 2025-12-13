/**
 * Utility for handling permission errors consistently across the application
 */

/**
 * Formats permission error for toast display with proper JSX formatting
 */
export const formatPermissionError = (errorData: any) => {
  const requiredPermissions = errorData?.required_permissions || [];
  
  return (
    <div className="space-y-2">
      <p>You don't have proper permissions to access this resource.</p>
      {requiredPermissions.length > 0 && (
        <>
          <p className="font-semibold mt-2">Additional permissions required:</p>
          <ul className="list-none space-y-1 ml-2">
            {requiredPermissions.map((perm: string) => (
              <li key={perm} className="flex items-start gap-1">
                <span className="text-blue-600">•</span>
                <span>{perm.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm">Please contact your administrator for access.</p>
        </>
      )}
    </div>
  );
};

/**
 * Checks if error is a permission error (403)
 */
export const isPermissionError = (error: any): boolean => {
  return error?.response?.status === 403 || error?.status === 403;
};

/**
 * Gets error data from different error response formats
 */
export const getErrorData = (error: any): any => {
  return error?.response?.data || error?.data || {};
};
