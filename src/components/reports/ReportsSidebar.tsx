import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  UserMinus,
  UserX,
  FileSearch,
  FileText,
  ArrowLeftRight,
  Users,
  Cake,
  Clock,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ReportsSection {
  id: string;
  label: string;
  icon: LucideIcon;
  items: {
    id: string;
    label: string;
    icon: LucideIcon;
  }[];
}

interface ReportsSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ReportsSidebar({
  activeTab,
  onTabChange,
}: ReportsSidebarProps) {
  const isMobile = useIsMobile();
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "client-reports",
    "customer-reports",
    "age-date-reports",
  ]);

  const sections: ReportsSection[] = [
    {
      id: "client-reports",
      label: "Client & Policy Reports",
      icon: BarChart3,
      items: [
        { id: "lost-clients", label: "Lost Clients", icon: UserMinus },
        { id: "cancelled-customers", label: "Cancelled Customers", icon: UserX },
        { id: "transfers-report", label: "Transfers Report", icon: ArrowLeftRight },
      ],
    },
    {
      id: "customer-reports",
      label: "Customer Reports",
      icon: Users,
      items: [
        { id: "custom-report", label: "Custom Report", icon: FileSearch },
        { id: "general-report", label: "General Report", icon: FileText },
        { id: "customers-report", label: "Customers Report", icon: Users },
      ],
    },
    {
      id: "age-date-reports",
      label: "Age & Date Reports",
      icon: TrendingUp,
      items: [
        { id: "upcoming-birthdays", label: "Upcoming Birthdays", icon: Cake },
        { id: "turning-age", label: "Turning Age", icon: Clock },
        { id: "effective-date", label: "Effective Date", icon: CalendarCheck },
      ],
    },
  ];

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
          .mobile-reports-scroll {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .mobile-reports-scroll::-webkit-scrollbar {
            display: none;
          }
          .mobile-reports-scroll {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        <div className="mobile-reports-scroll">
          <div className="flex space-x-2 p-3 min-w-max">
            {sections.map((section) =>
              section.items.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "outline"}
                  size="sm"
                  className={`flex-shrink-0 text-xs whitespace-nowrap ${
                    activeTab === item.id
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-white hover:bg-gray-100"
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
        <h2 className="font-semibold text-base text-gray-900">Reports</h2>
        <p className="text-xs text-gray-600">Generate and view reports</p>
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
