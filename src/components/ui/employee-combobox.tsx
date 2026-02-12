import { useState, useMemo, useRef } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
}

interface EmployeeComboboxProps {
  users: User[];
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
  error?: string;
  showAnyOption?: boolean;
  showAllOption?: boolean;
  allLabel?: string;
  placeholder?: string;
  required?: boolean;
}

export function EmployeeCombobox({
  users,
  value,
  onChange,
  loading = false,
  error,
  showAnyOption = true,
  showAllOption = false,
  allLabel = "All Employees",
  placeholder = "Select an employee...",
  required = false,
}: EmployeeComboboxProps) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedUser = useMemo(() => {
    if (value === "any" || value === "all") return null;
    return users.find((user) => user.id === value);
  }, [users, value]);

  const displayValue = useMemo(() => {
    if (value === "any") return "Any";
    if (value === "all") return allLabel;
    if (selectedUser) return `${selectedUser.first_name} ${selectedUser.last_name}`;
    return placeholder;
  }, [value, selectedUser, placeholder, allLabel]);

  if (loading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <div className="grid gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal",
              error && "border-red-500",
              !value && "text-muted-foreground"
            )}
          >
            {displayValue}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search employee..." />
            <CommandList
              ref={listRef}
              className="max-h-[250px]"
              onWheel={(e) => {
                // Fix mouse wheel scroll inside cmdk popover
                e.stopPropagation();
                const el = listRef.current;
                if (el) {
                  el.scrollTop += e.deltaY;
                }
              }}
            >
              <CommandEmpty>No employee found.</CommandEmpty>
              <CommandGroup>
                {showAllOption && (
                  <CommandItem
                    value="all-employees"
                    onSelect={() => {
                      onChange("all");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === "all" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-medium">{allLabel}</span>
                  </CommandItem>
                )}
                {showAnyOption && (
                  <CommandItem
                    value="any-employee"
                    onSelect={() => {
                      onChange("any");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === "any" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-medium text-primary">Any</span>
                  </CommandItem>
                )}
                {Array.isArray(users) &&
                  users.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={`${user.first_name} ${user.last_name} ${user.email || ""}`}
                      onSelect={() => {
                        onChange(user.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === user.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{user.first_name} {user.last_name}</span>
                        {user.email && (
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
