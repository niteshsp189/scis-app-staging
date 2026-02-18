import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LucideIcon, ChevronDown, ChevronRight } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface SubMenuItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  permission?: string | null;
  disabled?: boolean;
}

interface AppSidebarNavItemProps {
  item: {
    title: string;
    url?: string;
    icon: LucideIcon;
    permission?: string | null;
    submenu?: SubMenuItem[];
  };
  collapsed?: boolean;
}

export function AppSidebarNavItemWithSubmenu({
  item,
  collapsed,
}: AppSidebarNavItemProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = item.url ? location.pathname === item.url : false;
  const hasActiveSubmenu = item.submenu?.some(
    (subItem) => location.pathname === subItem.url,
  );

  // Auto-expand if any submenu item is active
  React.useEffect(() => {
    if (hasActiveSubmenu && !collapsed) {
      setIsOpen(true);
    }
  }, [hasActiveSubmenu, collapsed]);

  const handleToggle = (e: React.MouseEvent) => {
    if (item.submenu && !collapsed) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  if (item.submenu && !collapsed) {
    return (
      <div>
        <button
          onClick={handleToggle}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group cursor-pointer ${hasActiveSubmenu
              ? "text-white border border-blue-500"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
        >
          <item.icon
            className={`h-5 w-5 transition-all ${hasActiveSubmenu
                ? "text-white"
                : "text-slate-400 group-hover:text-white"
              }`}
          />
          <span className="truncate flex-1 text-left">{item.title}</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {isOpen && (
          <div className="ml-2 mt-2 mr-1 space-y-1">
            {item.submenu.map((subItem) => {
              if (subItem.disabled) {
                return (
                  <div
                    key={subItem.title}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-not-allowed opacity-50"
                  >
                    {subItem.icon && (
                      <subItem.icon className="h-4 w-4 text-slate-600" />
                    )}
                    <span className="truncate text-slate-600">{subItem.title}</span>
                    <span className="ml-auto text-xs text-slate-600">(Coming Soon)</span>
                  </div>
                );
              }
              return (
                <Link
                  key={subItem.title}
                  to={subItem.url}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 group cursor-pointer ${location.pathname === subItem.url
                      ? "bg-blue-500 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-700"
                    }`}
                >
                  {subItem.icon && (
                    <subItem.icon
                      className={`h-4 w-4 ${location.pathname === subItem.url
                          ? "text-white"
                          : "text-slate-500 group-hover:text-white"
                        }`}
                    />
                  )}
                  <span className="truncate">{subItem.title}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // For collapsed menu with submenu, show the main item with tooltip
  if (item.submenu && collapsed) {
    return (
      <HoverCard openDelay={100} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button
            className={`flex items-center justify-center px-0 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer w-full ${hasActiveSubmenu
                ? "text-white border border-blue-500"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
          >
            <item.icon
              className={`h-5 w-5 transition-all ${hasActiveSubmenu
                  ? "text-white"
                  : "text-slate-400 group-hover:text-white"
                }`}
            />
          </button>
        </HoverCardTrigger>
        <HoverCardContent
          side="right"
          align="start"
          className="ml-2 w-56 bg-slate-800 border-slate-700 shadow-lg p-3 z-[1000000]"
        >
          <div className="text-sm font-medium text-white mb-2 px-2">
            {item.title}
          </div>
          <div className="space-y-1">
            {item.submenu.map((subItem) => {
              if (subItem.disabled) {
                return (
                  <div
                    key={subItem.title}
                    className="flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-not-allowed opacity-50"
                  >
                    {subItem.icon && <subItem.icon className="h-4 w-4 text-slate-600" />}
                    <span className="text-slate-600">{subItem.title}</span>
                  </div>
                );
              }
              return (
                <Link
                  key={subItem.title}
                  to={subItem.url}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-all duration-200 ${location.pathname === subItem.url
                      ? "bg-blue-500 text-white"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                    }`}
                >
                  {subItem.icon && <subItem.icon className="h-4 w-4" />}
                  <span>{subItem.title}</span>
                </Link>
              );
            })}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  // Regular menu item without submenu
  if (collapsed) {
    const linkClass = `flex items-center justify-center gap-0 px-0 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group cursor-pointer w-full ${isActive
        ? "bg-blue-500 text-white shadow-lg"
        : "text-slate-300 hover:text-white hover:bg-slate-800"
      }`;

    const content = (
      <>
        <item.icon
          className={`h-5 w-5 transition-all ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"
            }`}
        />
      </>
    );

    return (
      <HoverCard openDelay={100} closeDelay={100}>
        <HoverCardTrigger asChild>
          {item.url ? (
            <Link to={item.url} className={linkClass}>
              {content}
            </Link>
          ) : (
            <div className={linkClass}>{content}</div>
          )}
        </HoverCardTrigger>
        <HoverCardContent
          side="right"
          align="start"
          className="ml-2 w-auto bg-slate-800 border-slate-700 shadow-lg p-2 z-[10000]"
        >
          <div className="text-sm font-medium text-white whitespace-nowrap">
            {item.title}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  // Expanded regular menu item
  const ItemContent = (
    <>
      <item.icon
        className={`h-5 w-5 transition-all ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"
          }`}
      />
      <span className="truncate">{item.title}</span>
    </>
  );

  const linkClass = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group cursor-pointer ${isActive
      ? "bg-blue-500 text-white shadow-lg"
      : "text-slate-300 hover:text-white hover:bg-slate-800"
    }`;

  if (item.url) {
    return (
      <Link to={item.url} className={linkClass}>
        {ItemContent}
      </Link>
    );
  }

  return <div className={linkClass}>{ItemContent}</div>;
}
