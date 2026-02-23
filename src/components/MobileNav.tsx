
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { 
  Building2, 
  Home, 
  Users, 
  User, 
  FileText, 
  Calendar, 
  Bell, 
  Search, 
  Settings, 
  Menu, 
  LayoutDashboard, 
  Shield,
  UserCheck,
  UserX,
  HeartHandshake,
  BookOpen,
  BarChart3,
  UserMinus,
  Ban,
  Phone,
  ArrowRightLeft,
  FileSearch,
  ClipboardList,
  UsersRound,
  Cake,
  Clock,
  CalendarDays,
  CalendarClock,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChatButton } from "@/components/ChatButton";
import { NotificationButton } from "@/components/NotificationButton";
import { usePermissions } from "@/contexts/PermissionContext";
import { useSecuritySettings } from "@/hooks/useSecuritySettings";
import SearchInputWithSuggestions from "@/components/ui/SearchInputWithSuggestions";
import globalSearchService from "@/services/globalSearchService";

// Settings permissions list - user needs ANY of these to access settings
const settingsPermissions = [
  'admin_settings',
  'manage_users',
  'view_users',
  'manage_roles',
  'view_company_settings',
  'manage_company_settings',
  'view_office_locations',
  'manage_office_locations',
  'view_team_management',
  'manage_team_management',
  'view_roles_permissions',
  'manage_roles_permissions',
  'view_insurance_plan_types',
  'manage_insurance_plan_types',
  'view_insurance_companies_settings',
  'manage_insurance_companies_settings',
  'view_insurance_plans_settings',
  'manage_insurance_plans_settings',
  'view_holidays',
  'manage_holidays',
  'view_reminder_settings',
  'manage_reminder_settings',
  'view_currency_settings',
  'manage_currency_settings',
  'view_security_settings',
  'manage_security_settings',
];

const allNavigationItems = [
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

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { hasPermission } = usePermissions();
  const { auditLoggingEnabled } = useSecuritySettings();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (text?: string) => {
    const query = text || searchTerm;
    if (!query.trim()) return;
    const url = globalSearchService.buildSearchUrl(query.trim());
    navigate(url);
    setSearchTerm("");
  };

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // Filter navigation items based on permissions
  const navigationItems = allNavigationItems.filter(item => {
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

  if (!isMobile) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-2 shadow-sm">
      <Link to="/dashboard" className="flex items-center gap-1.5 flex-shrink-0 hover:opacity-80 transition-opacity">
        <img 
          src="/uploads/Maha-Shahwan-150x150.jpg" 
          alt="SCIS Logo" 
          className="h-7 w-7 flex-shrink-0"
        />
        <span className="text-sm font-bold text-gray-900">SCIS</span>
      </Link>

      <div className="flex-1 min-w-0">
        <SearchInputWithSuggestions
          value={searchTerm}
          onChange={setSearchTerm}
          onSearch={handleSearch}
          placeholder="Search..."
          className="w-full text-sm border border-slate-300 rounded-lg shadow-sm focus-within:border-blue-500"
        />
      </div>
      
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <ChatButton />
        <NotificationButton />
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <Menu className="h-6 w-6" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[80vh]">
            <DrawerHeader>
              <DrawerTitle>Navigation</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto max-h-[60vh]">
              <nav className="space-y-2">
                {navigationItems.map((item) => (
                  <div key={item.title}>
                    {item.submenu ? (
                      // Render parent with submenu items
                      <div className="space-y-1">
                        <div className="flex items-center gap-3 px-4 py-3 text-gray-600 font-medium">
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </div>
                        <div className="ml-4 space-y-1">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.title}
                              to={subItem.url}
                              onClick={() => setOpen(false)}
                              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                                location.pathname === subItem.url 
                                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              <subItem.icon className="h-5 w-5" />
                              <span className="font-medium">{subItem.title}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      // Render single item
                      <Link
                        to={item.url}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          location.pathname === item.url 
                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
