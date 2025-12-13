import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface CustomerSearchProps {
  searchTerm: string;
  onSearch: (term: string) => void;
}

export const CustomerSearch = ({
  searchTerm,
  onSearch
}: CustomerSearchProps) => {
  const handleClear = () => {
    onSearch('');
  };

  return (
    <div className="w-full">
      <div className="relative w-full">
        <Input
          placeholder="Search by name, email, or company..."
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full pr-10 pl-3"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-8 flex items-center pr-1 hover:bg-gray-100 rounded"
            type="button"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );
};
