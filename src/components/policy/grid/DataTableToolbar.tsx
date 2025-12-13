"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "./DataTableViewOptions"
import { DataTableFacetedFilter } from "./DataTableFacetedFilter"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Mail, FileText, Download } from "lucide-react"

import { statuses } from "../data/data"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const hasSelectedRows = selectedRows.length > 0

  const handleBulkAction = (action: string) => {
    // TODO: Implement bulk actions
    
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    
  }

  // Find the policy number column - try different possible accessorKey formats
  const findPolicyNumberColumn = () => {
    const possibleKeys = ["policy.policy_number", "policy_number", "policyNumber"];
    for (const key of possibleKeys) {
      const column = table.getColumn(key);
      if (column) return column;
    }
    return null;
  };

  // Find the status column - try different possible accessorKey formats
  const findStatusColumn = () => {
    const possibleKeys = ["renewal_status", "status", "renewalStatus"];
    for (const key of possibleKeys) {
      const column = table.getColumn(key);
      if (column) return column;
    }
    return null;
  };

  const policyNumberColumn = findPolicyNumberColumn();
  const statusColumn = findStatusColumn();

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter policies..."
          value={(policyNumberColumn?.getFilterValue() as string) ?? ""}
          onChange={(event) => {
            if (policyNumberColumn) {
              policyNumberColumn.setFilterValue(event.target.value);
            }
          }}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {statusColumn && (
          <DataTableFacetedFilter
            column={statusColumn}
            title="Status"
            options={statuses}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {/* {hasSelectedRows && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {selectedRows.length} selected
            </span>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4 mr-1" />
                  Bulk Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleBulkAction('send-reminder')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Reminders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('export-selected')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('assign-agent')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Assign to Agent
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )} */}
        
        {/* <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button> */}
        
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}
