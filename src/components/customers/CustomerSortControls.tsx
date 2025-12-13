import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from 'lucide-react';

interface CustomerSortControlsProps {
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortDirection: 'asc' | 'desc') => void;
}

const sortOptions = [
  // { value: 'opt_in', label: 'Opt-in' },
  { value: 'created_at', label: 'Date Created' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'status', label: 'Status' },
  { value: 'updated_at', label: 'Last Updated' },
];

export function CustomerSortControls({ sortBy, sortDirection, onSortChange }: CustomerSortControlsProps) {
  const handleSortByChange = (newSortBy: string) => {
    onSortChange(newSortBy, sortDirection);
  };

  const toggleSortDirection = () => {
    const newSortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(sortBy, newSortDirection);
  };

  return (
    <div className="flex items-center gap-2 ">
      <span className="text-sm text-muted-foreground">Sort by</span>
      <Select value={sortBy} onValueChange={handleSortByChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="icon" onClick={toggleSortDirection}>
        {sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
      </Button>
    </div>
  );
}
