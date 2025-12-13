"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Currency } from "@/components/ui/currency";
import { Policy } from "@/types/policy";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "./DataTableColumnHeader";
import { DataTableRowActions } from "./DataTableRowActions";

interface ActionHandlers {
  onViewDetails: (policyId: number) => void;
  onReinstate: (policyId: number) => void;
  onProcessPayment: (policyId: number) => void;
  onAmend: (policyId: number) => void;
  onCancel: (policyId: number) => void;
  onRenew: (policyId: number) => void;
  onSendReminder: (policyId: number) => void;
}

export const createColumns = (handlers: ActionHandlers): ColumnDef<Policy>[] => [
  // {
  //   id: "select",
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={table.getIsAllPageRowsSelected()}
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Select all"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //       aria-label="Select row"
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    accessorKey: "policy_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Policy Number" />
    ),
    cell: ({ row }) => {
      const policyNumber = row.getValue("policy_number") as string;
      return (
        <div className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
             onClick={() => handlers.onViewDetails(row.original.id)}>
          {policyNumber}
        </div>
      );
    },
  },
  {
    accessorKey: "customer.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => {
      const customer = row.original.customer;
      return (
        <div>
          <div className="font-medium">{customer?.name || "Unknown"}</div>
          {customer?.email && (
            <div className="text-sm text-gray-500">{customer.email}</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "plan.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Plan" />
    ),
    cell: ({ row }) => {
      const plan = row.original.plan;
      return (
        <div>
          <div className="font-medium">{plan?.name || "Unknown Plan"}</div>
          <div className="text-sm text-gray-500">{plan?.category || "N/A"}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      let variant: "default" | "secondary" | "destructive" | "outline" = "default";
      
      if (status === "Active") variant = "default";
      if (status === "Cancelled" || status === "Expired" || status === "Lapsed") variant = "destructive";
      if (status === "Pending") variant = "secondary";
      
      return <Badge variant={variant}>{status}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "premium_amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Premium" />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("premium_amount") || "0");
      const frequency = row.original.premium_frequency;

      return (
        <div className="text-right">
          <div className="font-medium">
            <Currency value={amount} showZero={true} placeholder="0" />
          </div>
          <div className="text-sm text-gray-500 capitalize">{frequency}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "start_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Start Date" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("start_date"));
      return (
        <div>
          <div>{date.toLocaleDateString()}</div>
          <div className="text-sm text-gray-500">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
        </div>
      );
    }
  },
  {
    accessorKey: "end_date", 
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="End Date" />
    ),
    cell: ({ row }) => {
      const endDate = row.getValue("end_date");
      if (!endDate) return <span className="text-gray-400">Ongoing</span>;
      
      const date = new Date(endDate as string);
      const isExpiringSoon = date.getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000; // 30 days
      
      return (
        <div>
          <div className={isExpiringSoon ? "text-orange-600 font-medium" : ""}>
            {date.toLocaleDateString()}
          </div>
          <div className="text-sm text-gray-500">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
        </div>
      );
    }
  },
  {
    accessorKey: "updated_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Updated" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("updated_at"));
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      return (
        <div>
          <div>{date.toLocaleDateString()}</div>
          <div className="text-sm text-gray-500">
            {diffDays === 0 ? 'Today' : `${diffDays} days ago`}
          </div>
        </div>
      );
    }
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} handlers={handlers} />,
  },
];
