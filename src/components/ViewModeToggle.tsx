import { Button } from "@/components/ui/button";
import { MoreHorizontal, ArrowDown } from "lucide-react";

interface ViewModeToggleProps {
  mode: "pagination" | "infinite";
  onModeChange: (mode: "pagination" | "infinite") => void;
}

export function ViewModeToggle({ mode, onModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
      {/* <Button
        variant={mode === "pagination" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange("pagination")}
        className="h-8 px-3"
      >
        <MoreHorizontal className="h-4 w-4 mr-1" />
        Pages
      </Button> */}
      {/* <Button
        variant={mode === "infinite" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange("infinite")}
        className="h-8 px-3"
      >
        <ArrowDown className="h-4 w-4 mr-1" />
        Scroll
      </Button> */}
    </div>
  );
}