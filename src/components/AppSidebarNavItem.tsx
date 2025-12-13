
import { Link, useLocation } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface AppSidebarNavItemProps {
  item: {
    title: string;
    url: string;
    icon: LucideIcon;
  };
  collapsed?: boolean;
}

export function AppSidebarNavItem({ item, collapsed }: AppSidebarNavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === item.url;

  return (
    <Link
      to={item.url}
      className={`flex items-center ${collapsed ? "justify-center gap-0 px-0" : "gap-3 px-3"} py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group cursor-pointer ${
        isActive
          ? "bg-blue-500 text-white shadow-lg"
          : "text-slate-300 hover:text-white hover:bg-slate-800"
      }`}
      title={collapsed ? item.title : undefined}
    >
      <item.icon
        className={`h-5 w-5 transition-all ${
          isActive ? "text-white" : "text-slate-400 group-hover:text-white"
        }`}
      />
      {!collapsed && <span className="truncate">{item.title}</span>}
    </Link>
  );
}
