import { OrganizationSettings } from "@/components/settings/OrganizationSettings";
import { EmployeeManagement } from "@/components/settings/EmployeeManagement";
import { OfficeLocations } from "@/components/settings/OfficeLocations";
import { RolesPermissions } from "@/components/settings/RolesPermissions";
import { ReminderSettings } from "@/components/settings/ReminderSettings";
import { CurrencySettings } from "@/components/settings/CurrencySettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { HolidayManagement } from "@/components/holidays/HolidayManagement";
import { FamilyManagementSettings } from "@/components/settings/FamilyManagementSettings";
import { SimplifiedPlanTypesManagement } from "@/components/insurance/SimplifiedPlanTypesManagement";
import { SimplifiedCompaniesManagement } from "@/components/insurance/SimplifiedCompaniesManagement";
import { SimplifiedPlansWrapper } from "@/components/insurance/SimplifiedPlansWrapper";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePermissions } from "@/contexts/PermissionContext";
import { ShieldAlert } from "lucide-react";

interface SettingsContentProps {
  activeTab: string;
}

export function SettingsContent({ activeTab }: SettingsContentProps) {
  const isMobile = useIsMobile();
  const { hasPermission } = usePermissions();

  // Permission mapping for each settings tab
  // Some tabs accept multiple permissions (array means ANY of these permissions work)
  const tabPermissions: Record<string, { view: string | string[]; manage?: string | string[] }> = {
    "organization": { view: "view_company_settings", manage: "manage_company_settings" },
    "locations": { view: "view_office_locations", manage: "manage_office_locations" },
    "employees": { 
      view: "view_users", 
      manage: "manage_users" 
    },
    "roles": { 
      view: "view_roles", 
      manage: "manage_roles" 
    },
    "insurance-companies": { view: "view_insurance_companies_settings", manage: "manage_insurance_companies_settings" },
    "insurance-plans": { view: "view_insurance_plans_settings", manage: "manage_insurance_plans_settings" },
    "plan-types": { view: "view_insurance_plan_types", manage: "manage_insurance_plan_types" },
    "holidays": { view: "view_holidays", manage: "manage_holidays" },
    "reminders": { view: "view_reminder_settings", manage: "manage_reminder_settings" },
    "currency": { view: "view_currency_settings", manage: "manage_currency_settings" },
    "security": { view: "view_security_settings", manage: "manage_security_settings" },
  };

  // Helper to check if user has any of the given permissions
  const hasAnyPermission = (perms: string | string[]): boolean => {
    if (typeof perms === 'string') {
      return hasPermission(perms);
    }
    return perms.some(p => hasPermission(p));
  };

  // Check if user has permission to view this tab
  const canViewTab = (tab: string): boolean => {
    const permissions = tabPermissions[tab];
    if (!permissions) return true; // No specific permission required
    
    // User needs at least view permission OR manage permission OR admin_settings
    return hasPermission("admin_settings") || 
           hasAnyPermission(permissions.view) || 
           (permissions.manage ? hasAnyPermission(permissions.manage) : false);
  };

  // Check if user has manage permission for this tab
  const canManageTab = (tab: string): boolean => {
    const permissions = tabPermissions[tab];
    if (!permissions || !permissions.manage) return false;
    
    return hasPermission("admin_settings") || hasAnyPermission(permissions.manage);
  };

  // Access denied component
  const AccessDenied = ({ section }: { section: string }) => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <ShieldAlert className="h-16 w-16 text-red-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
      <p className="text-gray-600 text-center max-w-md">
        You don't have permission to view {section} settings. Please contact your administrator if you need access.
      </p>
    </div>
  );

  const renderContent = () => {
    // Check permission for current tab
    if (!canViewTab(activeTab)) {
      return <AccessDenied section={activeTab} />;
    }

    const isReadOnly = !canManageTab(activeTab);

    switch (activeTab) {
      case "organization":
        return <OrganizationSettings readOnly={isReadOnly} />;
      case "locations":
        return <OfficeLocations readOnly={isReadOnly} />;
      case "employees":
        return <EmployeeManagement readOnly={isReadOnly} />;
      case "roles":
        return <RolesPermissions readOnly={isReadOnly} />;
      case "insurance-companies":
        return <SimplifiedCompaniesManagement onCompanySelect={() => {}} onCompaniesChange={() => {}} readOnly={isReadOnly} />;
      case "insurance-plans":
        return <SimplifiedPlansWrapper readOnly={isReadOnly} />;
      case "plan-types":
        return <SimplifiedPlanTypesManagement readOnly={isReadOnly} />;
      case "family":
        return <FamilyManagementSettings readOnly={isReadOnly} />;
      case "holidays":
        return <HolidayManagement readOnly={isReadOnly} />;
      case "reminders":
        return <ReminderSettings readOnly={isReadOnly} />;
      case "currency":
        return <CurrencySettings readOnly={isReadOnly} />;
      case "security":
        return <SecuritySettings readOnly={isReadOnly} />;
      default:
        return <OrganizationSettings readOnly={isReadOnly} />;
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className={`${isMobile ? "p-4" : "p-5"} max-w-[auto]`}>
        {renderContent()}
      </div>
    </div>
  );
}
