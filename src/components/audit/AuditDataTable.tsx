import { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  User,
  Globe,
  Monitor,
  Calendar,
  FileText
} from "lucide-react";
import { AuditLog } from "@/types/audit";
import { format } from "date-fns";

interface AuditDataTableProps {
  data: AuditLog[];
  loading: boolean;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  onPageChange: (page: number) => void;
  onViewDetail: (log: AuditLog) => void;
  onSort: (sortBy: string, sortDirection: 'asc' | 'desc') => void;
}

export function AuditDataTable({
  data,
  loading,
  pagination,
  onPageChange,
  onViewDetail,
  onSort,
}: AuditDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true }
  ]);

  const getActionBadgeColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'logout':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'created':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'updated':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'deleted':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'failed_login':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => {
              const isDesc = column.getIsSorted() === "desc";
              const newDirection = isDesc ? 'asc' : 'desc';
              onSort('created_at', newDirection);
            }}
            className="h-auto p-0 hover:bg-transparent"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Date & Time
            {column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return (
          <div className="flex flex-col">
            <span className="font-medium text-sm">
              {format(date, 'MMM dd, yyyy')}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(date, 'HH:mm:ss')}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "user",
      header: ({ column }) => (
        <div className="flex items-center">
          <User className="mr-2 h-4 w-4" />
          User
        </div>
      ),
      cell: ({ row }) => {
        const user = row.getValue("user") as AuditLog['user'];
        return (
          <div className="flex flex-col">
            <span className="font-medium text-sm">
              {user?.name || 'System'}
            </span>
            {user?.email && (
              <span className="text-xs text-muted-foreground">
                {user.email}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "model_type_label",
      header: "Model",
      cell: ({ row }) => {
        // Prefer the raw auditable_type class basename if available, otherwise fall back to model_type_label
        const auditableType = row.original.auditable_type as string | undefined;
        const rawModelLabel = row.getValue("model_type_label") as string;
        
        // Extract class name from full namespace
        const className = auditableType ? auditableType.split('\\').pop() : rawModelLabel;
        
        // Map technical model names to user-friendly names
        const modelDisplayName = (modelName: string, row: any) => {
          // Handle system actions that don't have an auditable_type
          if (!row.original.auditable_type) {
            if (row.original.event === 'permission_check_success' || row.original.event === 'permission_check_failed') {
              return 'Permission';
            }
            if (row.original.event === 'role_check_success' || row.original.event === 'role_check_failed') {
              return 'Role';
            }
            return 'System';
          }
          
          switch (modelName?.toLowerCase()) {
            case 'user':
              return 'User';
            case 'lead':
              return 'Lead';
            case 'policy':
              return 'Policy';
            case 'customer':
              return 'Customer';
            case 'deal':
              return 'Deal';
            case 'plan':
              return 'Plan';
            case 'familymember':
              return 'Family Member';
            case 'dependent':
              return 'Dependent';
            case 'reminder':
              return 'Reminder';
            default:
              return modelName || 'Unknown';
          }
        };
        
        return (
          <div className="flex flex-col">
            <span className="font-medium text-sm">{modelDisplayName(className, row)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string;
        // Clean the description to remove UUID references and make it more human-friendly
        const cleanDescription = (desc: string, row: any) => {
          if (!desc) return 'No description';
          
          // Remove explicit ID fragment like " (ID: 0198aa3a-...)"
          let cleaned = desc.replace(/\s*\(ID:\s*[^\)]+\)/ig, '');
          
          // Remove any standalone UUID-like patterns in parentheses
          cleaned = cleaned.replace(/\s*\(([0-9a-fA-F]{8}[-][0-9a-fA-F]{4}[-][0-9a-fA-F]{4}[-][0-9a-fA-F]{4}[-][0-9a-fA-F]{12})\)/g, '');
          
          // Convert underscores to spaces and capitalize words for better readability
          cleaned = cleaned.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          // Handle specific cases for permission/role checks
          if (row.original.event === 'permission_check_success' || row.original.event === 'permission_check_failed') {
            cleaned = cleaned.replace(/Passed Permission Check For:/i, 'Checked permission:');
            cleaned = cleaned.replace(/Failed Permission Check For:/i, 'Failed permission check:');
          }
          if (row.original.event === 'role_check_success' || row.original.event === 'role_check_failed') {
            cleaned = cleaned.replace(/Passed Role Check For:/i, 'Checked role:');
            cleaned = cleaned.replace(/Failed Role Check For:/i, 'Failed role check:');
          }
          
          return cleaned.trim();
        };
        
        return (
          <div className="max-w-xs">
            <span className="text-sm line-clamp-2" title={cleanDescription(description, row)}>
              {cleanDescription(description, row)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "ip_address",
      header: ({ column }) => (
        <div className="flex items-center">
          <Globe className="mr-2 h-4 w-4" />
          IP & Browser
        </div>
      ),
      cell: ({ row }) => {
        const ipAddress = row.original.formatted_ip_address;
        const browser = row.original.browser;
        const platform = row.original.platform;
        
        // Show "System" for localhost/internal IPs when browser is also "System"
        const displayIP = (ipAddress === '127.0.0.1' && browser === 'System') ? 'System' : ipAddress;
        
        return (
          <div className="flex flex-col">
            <span className="font-mono text-xs">{displayIP}</span>
            <span className="text-xs text-muted-foreground flex items-center">
              <Monitor className="mr-1 h-3 w-3" />
              {browser} / {platform}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "changes_count",
      header: "Changes",
      cell: ({ row }) => {
        const changesCount = row.getValue("changes_count") as number;
        if (changesCount === 0) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <Badge variant="outline">
            {changesCount} field{changesCount !== 1 ? 's' : ''}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetail(row.original)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View details</span>
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table className="border-l">
          <TableHeader className="border-b border-t">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="divide-x divide-gray-200">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeleton
              [...Array(5)].map((_, index) => (
                <TableRow key={index} className="divide-x divide-gray-200">
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-muted/50 cursor-pointer divide-x divide-gray-200"
                  onClick={() => onViewDetail(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="divide-x divide-gray-200">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No audit logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>
            Showing {pagination.from} to {pagination.to} of{" "}
            {pagination.total.toLocaleString()} entries
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center space-x-2 order-2 sm:order-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.current_page - 1)}
              disabled={pagination.current_page <= 1 || loading}
            >
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={pagination.current_page === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    disabled={loading}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                );
              })}
              
              {pagination.last_page > 5 && (
                <>
                  <span className="text-muted-foreground">...</span>
                  <Button
                    variant={pagination.current_page === pagination.last_page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pagination.last_page)}
                    disabled={loading}
                    className="w-8 h-8 p-0"
                  >
                    {pagination.last_page}
                  </Button>
                </>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.current_page + 1)}
              disabled={pagination.current_page >= pagination.last_page || loading}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
