import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import globalSearchService, { SearchSuggestion } from "@/services/globalSearchService";
import { getCustomerViewUrl } from "@/utils/customerRoutes";

interface CustomerSearchProps {
  searchTerm: string;
  onSearch: (term: string) => void;
}

export const CustomerSearch = ({
  searchTerm,
  onSearch
}: CustomerSearchProps) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [justSelectedSuggestion, setJustSelectedSuggestion] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const navigate = useNavigate();

  // Fetch suggestions when search term changes
  useEffect(() => {
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Don't fetch suggestions if we just selected one
    if (justSelectedSuggestion) {
      return;
    }

    // Only fetch suggestions if input has at least 2 characters
    if (searchTerm.trim().length >= 2) {
      debounceRef.current = setTimeout(async () => {
        setIsLoadingSuggestions(true);
        try {
          // Filter to only show customer suggestions
          const response = await globalSearchService.getSuggestions(searchTerm.trim(), 8);
          // Filter to show only customer type suggestions
          const customerSuggestions = response.data.filter(
            (s: SearchSuggestion) => s.type === 'customer'
          );
          setSuggestions(customerSuggestions);
          setShowSuggestions(true);
          setActiveSuggestionIndex(-1);
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
          setSuggestions([]);
        } finally {
          setIsLoadingSuggestions(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, justSelectedSuggestion]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    onSearch('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Reset the flag when user manually types
    setJustSelectedSuggestion(false);
    onSearch(e.target.value);
  };

  const handleInputFocus = () => {
    // Don't show suggestions if we just selected one
    if (justSelectedSuggestion) {
      return;
    }
    if (suggestions && suggestions.length > 0 && searchTerm.trim().length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Enter key regardless of suggestion state
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0 && activeSuggestionIndex >= 0) {
        handleSuggestionClick(suggestions[activeSuggestionIndex]);
      } else {
        // Close suggestions and blur to commit the current search term
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        inputRef.current?.blur();
      }
      return;
    }

    if (!showSuggestions || !suggestions || suggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < (suggestions?.length || 0) - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : (suggestions?.length || 0) - 1
        );
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    inputRef.current?.blur();
    // Navigate directly to the customer detail page
    navigate(getCustomerViewUrl(suggestion.id, suggestion.customer_type, suggestion.legacy_client_id));
  };

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      customer: 'text-blue-600',
      policy: 'text-green-600',
      appointment: 'text-purple-600',
      prospect: 'text-orange-600',
      deal: 'text-yellow-600',
      reminder: 'text-red-600',
      user: 'text-gray-600',
    };
    return colorMap[type] || 'text-gray-500';
  };

  return (
    <div className="w-full">
      <div className="relative w-full">
        <Input
          ref={inputRef}
          placeholder="Search by name, phone, SSN, or zip code..."
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          className="w-full pr-10 pl-3"
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isLoadingSuggestions ? (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-gray-400 pointer-events-none" />
          )}
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

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.id}`}
                type="button"
                className={cn(
                  "w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center gap-3 border-b border-gray-100 last:border-b-0",
                  activeSuggestionIndex === index && "bg-gray-50"
                )}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setActiveSuggestionIndex(index)}
              >
                <span className="text-lg">👤</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{suggestion.text}</span>
                    {suggestion.customer_type && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                        {suggestion.customer_type}
                      </span>
                    )}
                  </div>
                  {(suggestion.phone || suggestion.address || suggestion.ssn) && (
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      {suggestion.phone && (
                        <span className="flex items-center gap-1">
                          <span>📞</span>
                          <span>{suggestion.phone}</span>
                        </span>
                      )}
                      {suggestion.ssn && (
                        <span className="flex items-center gap-1">
                          <span>🔒</span>
                          <span>{suggestion.ssn}</span>
                        </span>
                      )}
                      {suggestion.address && (
                        <span className="flex items-center gap-1 truncate">
                          <span>🗺️</span>
                          <span className="truncate">{suggestion.address}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
