import { Button } from "@/components/ui/button";
import { 
  Download, 
  RefreshCw,
  Shield,
  Activity
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AuditHeaderProps {
  totalLogs: number;
  onExport: (format: 'xlsx' | 'csv') => void;
  onRefresh: () => void;
}

export function AuditHeader({ totalLogs, onExport, onRefresh }: AuditHeaderProps) {
  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div className="flex items-center space-x-2">
        <Shield className="h-8 w-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitor system activity and user behavior - {totalLogs.toLocaleString()} total logs
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="flex items-center space-x-1"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center space-x-1">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport('xlsx')}>
              Export as Excel (.xlsx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('csv')}>
              Export as CSV (.csv)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
