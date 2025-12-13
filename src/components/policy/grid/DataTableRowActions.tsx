"use client"

import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { Row } from "@tanstack/react-table"
import { Policy } from "@/types/policy"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ActionHandlers {
  onViewDetails: (policyId: number) => void;
  onReinstate: (policyId: number) => void;
  onProcessPayment: (policyId: number) => void;
  onAmend: (policyId: number) => void;
  onCancel: (policyId: number) => void;
  onRenew: (policyId: number) => void;
  onSendReminder: (policyId: number) => void;
}

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  handlers: ActionHandlers
}

export function DataTableRowActions<TData>({
  row,
  handlers,
}: DataTableRowActionsProps<TData>) {
  const policy = row.original as Policy;

  const handleAction = (action: keyof ActionHandlers) => {
    handlers[action](policy.id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={() => handleAction('onViewDetails')}>
          View Details
        </DropdownMenuItem>
        
        {policy.status === "Lapsed" && (
          <DropdownMenuItem onClick={() => handleAction('onReinstate')}>
            Reinstate Policy
          </DropdownMenuItem>
        )}
        
        {(policy.status === "Active" || policy.status === "Pending") && (
          <>
            <DropdownMenuItem onClick={() => handleAction('onProcessPayment')}>
              Process Payment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('onAmend')}>
              Amend Policy
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('onSendReminder')}>
              Send Reminder
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        {policy.status === "Active" && (
          <DropdownMenuItem onClick={() => handleAction('onRenew')}>
            Renew Policy
          </DropdownMenuItem>
        )}
        
        {(policy.status === "Active" || policy.status === "Pending") && (
          <DropdownMenuItem 
            onClick={() => handleAction('onCancel')}
            className="text-red-600"
          >
            Cancel Policy
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
