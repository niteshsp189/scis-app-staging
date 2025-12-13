import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  UserCheck,
  Workflow,
  Settings as SettingsIcon,
  Bell,
  DollarSign,
  Shield,
  Calendar,
  UsersRound,
  MapPin,
  Package,
  Tag,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { usePermissions } from "@/contexts/PermissionContext";

interface SettingsSection {
  id: string;
  label: string;
  icon: LucideIcon;
  permission?: string;
  items: {
    id: string;
    label: string;
    icon: LucideIcon;
    permission?: string;
  }[];
}

interface SettingsSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function SettingsSidebar({
  activeTab,
  onTabChange,
}: SettingsSidebarProps) {
  const isMobile = useIsMobile();
  const { hasPermission } = usePermissions();
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "organization",
    "insurance",
    "system",
  ]);

  const allSections: SettingsSection[] = [
    {
      id: "organization",
      label: "Organization & Structure",
      icon: Building2,
      items: [
        { id: "organization", label: "Company Settings", icon: Building2, permission: "view_company_settings" },
        { id: "locations", label: "Office Locations", icon: MapPin, permission: "view_office_locations" },
        { id: "employees", label: "Team Management", icon: Users, permission: "view_users" },
        { id: "roles", label: "Roles & Permissions", icon: UserCheck, permission: "view_roles" },
      ],
    },
    {
      id: "insurance",
      label: "Insurance Management",
      icon: Shield,
      items: [
        {
          id: "plan-types",
          label: "Insurance Plan Types",
          icon: Tag,
          permission: "view_insurance_plan_types",
        },
        {
          id: "insurance-companies",
          label: "Insurance Companies",
          icon: Building2,
          permission: "view_insurance_companies_settings",
        },
        {
          id: "insurance-plans",
          label: "Insurance Plans",
          icon: Package,
          permission: "view_insurance_plans_settings",
        },
      ],
    },
    {
      id: "time",
      label: "Time & Schedule",
      icon: Calendar,
      items: [
        { id: "holidays", label: "Holiday Management", icon: Calendar, permission: "view_holidays" },
        { id: "reminders", label: "Reminder Settings", icon: Bell, permission: "view_reminder_settings" },
      ],
    },
    {
      id: "system",
      label: "System & Security",
      icon: SettingsIcon,
      items: [
        // { id: "family", label: "Family Management", icon: UsersRound },
        { id: "currency", label: "Currency Settings", icon: DollarSign, permission: "view_currency_settings" },
        { id: "security", label: "Security Settings", icon: Shield, permission: "view_security_settings" },
      ],
    },
  ];

  // Filter sections and items based on permissions
  const sections = allSections
    .map(section => {
      // Filter items within each section based on permissions
      const filteredItems = section.items.filter(item => 
        !item.permission || hasPermission(item.permission)
      );
      
      return {
        ...section,
        items: filteredItems
      };
    })
    .filter(section => section.items.length > 0); // Only show sections that have visible items

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    );
  };

  const isExpanded = (sectionId: string) =>
    expandedSections.includes(sectionId);

  if (isMobile) {
    return (
      <div className="border-b bg-white">
        <style>{`
          .mobile-settings-scroll {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .mobile-settings-scroll::-webkit-scrollbar {
            display: none;
          }
          .mobile-settings-scroll {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        <div className="mobile-settings-scroll">
          <div className="flex space-x-2 p-3 min-w-max">
            {sections.map((section) =>
              section.items.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "outline"}
                  size="sm"
                  className={`flex-shrink-0 text-xs whitespace-nowrap ${
                    activeTab === item.id 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-white hover:bg-gray-100'
                  }`}
                  onClick={() => onTabChange(item.id)}
                >
                  <item.icon className="h-3.5 w-3.5 mr-1.5" />
                  {item.label}
                </Button>
              )),
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 border-r bg-gray-50/50 h-full flex flex-col">
      <div className="p-3 border-b">
        <h2 className="font-semibold text-base text-gray-900">Settings</h2>
        <p className="text-xs text-gray-600">Manage your organization</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {sections.map((section) => (
            <div key={section.id} className="py-1">
              <Button
                variant="ghost"
                className="w-full justify-between py-1.5 px-2 h-auto"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center gap-1.5">
                  <section.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{section.label}</span>
                </div>
                {isExpanded(section.id) ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </Button>

              {isExpanded(section.id) && (
                <div className="ml-2 mt-0.5 space-y-0.5">
                  {section.items.map((item) => (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start py-1.5 px-2 h-auto text-sm",
                        activeTab === item.id && "bg-blue-50 text-blue-900",
                      )}
                      onClick={() => onTabChange(item.id)}
                    >
                      <item.icon className="h-3.5 w-3.5 mr-1.5" />
                      {item.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
