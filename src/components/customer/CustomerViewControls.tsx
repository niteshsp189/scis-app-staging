
import { Button } from "@/components/ui/button";
import { LayoutGrid, LayoutList, Table } from "lucide-react";
import { usePreferences } from "@/contexts/PreferenceContext";

export type CustomerViewType = "cards" | "list" | "table";

interface CustomerViewControlsProps {
  section?: string; // e.g. 'customers', 'clients', 'former', etc.
  currentView?: CustomerViewType;
  onViewChange?: (view: CustomerViewType) => void;
}

export const CustomerViewControls = ({ 
  section = 'customers',
  currentView: propCurrentView,
  onViewChange: propOnViewChange 
}: CustomerViewControlsProps) => {
  const { getViewMode, setViewMode } = usePreferences();
  
  // Use preferences if no props provided (backward compatibility)
  const currentView = propCurrentView || (getViewMode(section) as CustomerViewType);
  
  const handleViewChange = async (view: CustomerViewType) => {
    if (propOnViewChange) {
      propOnViewChange(view);
    } else {
      try {
        await setViewMode(section, view);
      } catch (error) {
        console.error('Failed to save view preference:', error);
      }
    }
  };

  const views = [
    { type: "cards" as const, icon: LayoutGrid, label: "Cards" },
    { type: "list" as const, icon: LayoutList, label: "List" },
    { type: "table" as const, icon: Table, label: "Table" }
  ];

  return (
    <div className="flex items-center gap-3 bg-muted p-1 rounded-lg">
      {views.map(({ type, icon: Icon, label }) => (
        <Button
          key={type}
          variant={currentView === type ? "default" : "ghost"}
          size="sm"
          onClick={() => handleViewChange(type)}
          className="flex items-center gap-2 text-xs"
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
      ))}
    </div>
  );
};
