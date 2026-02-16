
import React from 'react';
import {
  Home,
  LayoutDashboard,
  Settings,
  User,
  Users,
  FileText,
  Calendar,
  Search,
  Bell,
  RefreshCw,
  Shield,
  UserCheck,
  UserX,
  HeartHandshake,
  BookOpen,
  CalendarClock,
  Phone,
  BarChart3,
  UserMinus,
  Ban,
  ArrowRightLeft,
  FileSearch,
  ClipboardList,
  UsersRound,
  Cake,
  Clock,
  CalendarDays,
} from "lucide-react";

import { useLocation, Link } from "react-router-dom";
import { AppSidebarNavItemWithSubmenu } from "./AppSidebarNavItemWithSubmenu";
import { useSidebar } from "@/components/ui/sidebar";
import { usePermissions } from "@/contexts/PermissionContext";
import { useSecuritySettings } from "@/hooks/useSecuritySettings";

export function AppSidebar() {
  const { hasPermission, userPermissions } = usePermissions();
  const { auditLoggingEnabled } = useSecuritySettings();
  const sidebarRef = React.useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const isSettingsPage = location.pathname.startsWith('/settings');

  // Log user permissions for debugging
  React.useEffect(() => {
    if (userPermissions) {

    } else {

    }
  }, [userPermissions]);

  // Force the background color using an inline style with !important for browsers
  // that may ignore stylesheet rules. Using setProperty with 'important' ensures
  // it overrides other cascade rules (e.g. Brave-specific behavior or late-loaded CSS).
  React.useEffect(() => {
    if (sidebarRef.current) {
      try {
        // Force a solid color to ensure Brave/other browsers apply it
        sidebarRef.current.style.setProperty('background-color', '#020817', 'important');
      } catch (e) {
        // fallback: set inline style without important
        sidebarRef.current.style.backgroundColor = '#020817';
      }
    }
  }, []);

  // Settings permissions list - user needs ANY of these to access settings
  const settingsPermissions = [
    'admin_settings',
    // User Management permissions (these also grant Settings access)
    'manage_users',
    'view_users',
    'manage_roles',
    // Organization & Structure
    'view_company_settings',
    'manage_company_settings',
    'view_office_locations',
    'manage_office_locations',
    'view_team_management',
    'manage_team_management',
    'view_roles_permissions',
    'manage_roles_permissions',
    // Insurance Management
    'view_insurance_plan_types',
    'manage_insurance_plan_types',
    'view_insurance_companies_settings',
    'manage_insurance_companies_settings',
    'view_insurance_plans_settings',
    'manage_insurance_plans_settings',
    // Time & Schedule
    'view_holidays',
    'manage_holidays',
    'view_reminder_settings',
    'manage_reminder_settings',
    // System & Security
    'view_currency_settings',
    'manage_currency_settings',
    'view_security_settings',
    'manage_security_settings',
  ];

  const allItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, permission: null },
    {
      title: "Consumers",
      icon: Users,
      permission: "view_customers",
      submenu: [
        { title: "Clients", url: "/clients", icon: UserCheck, permission: "view_clients" },
        { title: "Former", url: "/formers", icon: UserX, permission: "view_former_customers" },
        { title: "Deceased", url: "/deceaseds", icon: HeartHandshake, permission: "view_deceased_customers" },
        { title: "Prospects", url: "/prospects", icon: User, permission: "view_prospects" },
      ]
    },
    { title: "Policies", url: "/policies", icon: FileText, permission: "view_policies" },
    {
      title: "Schedule",
      icon: CalendarClock,
      permission: null,
      submenu: [
        { title: "Appointments", url: "/appointments", icon: Calendar, permission: "view_appointments" },
        { title: "Reminders", url: "/reminders", icon: Bell, permission: "view_reminders" },
        { title: "Calls", url: "/calls", icon: Phone, permission: null },
      ]
    },
    {
      title: "Lookup Service",
      icon: Search,
      permission: null,
      submenu: [
        { title: "Global Search", url: "/lookup", icon: Search, permission: "view_global_search" },
      ]
    },
    {
      title: "Reports",
      icon: BarChart3,
      permission: "view_reports",
      submenu: [
        { title: "Client Book", url: "/global-book", icon: BookOpen, permission: "view_customers" },
        { title: "Lost Clients", url: "/reports/lost-clients", icon: UserMinus, permission: "view_reports" },
        { title: "Cancelled Customers", url: "/reports/cancelled-customers", icon: Ban, permission: "view_reports" },
        { title: "Transfers Report", url: "/reports/transfers", icon: ArrowRightLeft, permission: "view_reports" },
        { title: "Custom Report", url: "/reports/custom", icon: FileSearch, permission: "view_reports" },
        { title: "General Report", url: "/reports/general", icon: ClipboardList, permission: "view_reports" },
        { title: "Customers Report", url: "/reports/customers", icon: UsersRound, permission: "view_reports" },
        { title: "Upcoming Birthdays", url: "/reports/upcoming-birthdays", icon: Cake, permission: "view_reports" },
        { title: "Turning Age", url: "/reports/turning-age", icon: Clock, permission: "view_reports" },
        { title: "Effective Date", url: "/reports/effective-date", icon: CalendarDays, permission: "view_reports" },
      ]
    },
    { title: "Audit Logs", url: "/audit", icon: Shield, permission: "view_audit_logs" },
    { title: "Settings", url: "/settings", icon: Settings, permissions: settingsPermissions, checkAny: true },
  ];

  // Filter items based on permissions and security settings
  const items = allItems.filter(item => {
    // Check if item has multiple permissions (permissions array with checkAny)
    if (item.permissions && item.checkAny) {
      // User needs at least ONE of the permissions
      const hasAnyPermission = item.permissions.some(perm => hasPermission(perm));
      if (!hasAnyPermission) {
        return false;
      }
    } else if (item.permission && !hasPermission(item.permission)) {
      // Check single permission
      return false;
    }

    // Filter submenu items based on permissions
    if (item.submenu) {
      item.submenu = item.submenu.filter(subItem => {
        return !subItem.permission || hasPermission(subItem.permission);
      });
      // Hide the parent item if no submenu items are visible
      if (item.submenu.length === 0) {
        return false;
      }
    }

    // Special case: Hide Audit Logs menu when audit logging is disabled
    if (item.title === "Audit Logs" && !auditLoggingEnabled) {
      return false;
    }

    return true;
  });

  const { state, toggleSidebar } = useSidebar();

  const isCollapsed = state === "collapsed";

  return (
    <div
      ref={sidebarRef}
      className={`professional-sidebar sticky top-0 flex flex-col h-screen py-6 ${isCollapsed ? "px-2 w-[56px] min-w-[56px]" : "px-4 w-[240px] min-w-[240px]"} transition-all duration-300 bg-sidebar z-10`}
      data-state={state}
    >
      <style>{`
        .professional-sidebar.bg-sidebar { background-color: hsl(var(--sidebar-background)) !important; }
        
        /* Custom scrollbar styles for the sidebar navigation */
        .professional-sidebar nav::-webkit-scrollbar {
          width: 6px;
        }
        
        .professional-sidebar nav::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 3px;
        }
        
        .professional-sidebar nav::-webkit-scrollbar-thumb {
          background: #3341554d;
          border-radius: 3px;
          height: 20px;
        }
        
        .professional-sidebar nav::-webkit-scrollbar-thumb:hover {
          background: rgb(37 99 235 / var(--tw-bg-opacity, 1));
        }
        
        .professional-sidebar nav::-webkit-scrollbar-thumb:active {
          background: rgb(29 78 216 / var(--tw-bg-opacity, 1));
        }
        
        /* Firefox scrollbar styling */
        .professional-sidebar nav {
          scrollbar-width: thin;
          // scrollbar-color: rgb(59 130 246 / var(--tw-bg-opacity, 1)) rgba(51, 65, 85, 0.3);
          // scrollbar-color: rgba(51, 65, 85, 0.3) rgba(51, 65, 85, 0.3);
          scrollbar-color: #8dbcff94 rgba(51, 65, 85, 0.3);
        }

        .professional-sidebar nav {
  /* Enable scrolling */
  overflow-x: auto; /* For horizontal scrolling */
  overflow-y: auto; /* For vertical scrolling */
  
  /* Hide scrollbar for Webkit browsers (Chrome, Safari, Opera) */
  -webkit-scrollbar {
    display: none;
  }
  
  /* Hide scrollbar for Internet Explorer and Edge */
  -ms-overflow-style: none;
  
  /* Hide scrollbar for Firefox */
  scrollbar-width: none;
}
      `}</style>
      <div className={`mb-8 w-full flex items-center justify-center ${isCollapsed ? "px-0" : "px-3"}`}>
        <div className={`flex items-center ${isCollapsed ? "space-x-0" : "space-x-3"}`}>
          <Link to="/dashboard" className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
            <Home className="text-white h-5 w-5" />
          </Link>
          {!isCollapsed && (
            <span className="text-xl font-semibold text-white tracking-tight">
              SCIS
            </span>
          )}
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <AppSidebarNavItemWithSubmenu key={item.title} item={item} collapsed={isCollapsed} />
        ))}
      </nav>
      <div className="mt-auto pt-6 border-t border-slate-700">
        {!isCollapsed && (
          <div className="px-3 text-xs text-slate-400 text-center">
            © {new Date().getFullYear()} SCIS
          </div>
        )}
      </div>
    </div>
  );
}
