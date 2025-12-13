import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import globalSearchService, { SearchSuggestion } from '@/services/globalSearchService';

interface SearchInputWithSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onSuggestionSelect?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const SearchInputWithSuggestions: React.FC<SearchInputWithSuggestionsProps> = ({
  value,
  onChange,
  onSearch,
  onSuggestionSelect,
  placeholder = "Search customers, policies, appointments...",
  className,
  disabled = false,
}) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [justSelectedSuggestion, setJustSelectedSuggestion] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

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
    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(async () => {
        setIsLoadingSuggestions(true);
        try {
          const response = await globalSearchService.getSuggestions(value.trim(), 8);
          setSuggestions(response.data);
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
  }, [value, justSelectedSuggestion]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || !suggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        onSearch();
      }
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
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[activeSuggestionIndex]);
        } else {
          onSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setJustSelectedSuggestion(true);
    onChange(suggestion.text);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    // Blur the input to prevent auto-focus after search
    inputRef.current?.blur();
    // Notify parent that a suggestion was selected
    onSuggestionSelect?.();
    // Trigger search after a short delay to allow state to update
    setTimeout(() => onSearch(), 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Reset the flag when user manually types
    setJustSelectedSuggestion(false);
    onChange(e.target.value);
  };

  const handleInputFocus = () => {
    // Don't show suggestions if we just selected one
    if (justSelectedSuggestion) {
      return;
    }
    if (suggestions && suggestions.length > 0 && value.trim().length >= 2) {
      setShowSuggestions(true);
    }
  };

  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      customer: '👤',
      policy: '📄',
      appointment: '📅',
      prospect: '🎯',
      deal: '💰',
      reminder: '🔔',
      user: '👥',
    };
    return iconMap[type] || '🔍';
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
    <div className="relative flex-1">
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          className={cn("pl-10", className)}
          disabled={disabled}
          autoComplete="off"
        />
        {isLoadingSuggestions && (
          <Loader2 className="h-4 w-4 absolute right-3 top-3 text-gray-400 animate-spin" />
        )}
      </div>

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
              <span className="text-lg">{getTypeIcon(suggestion.type)}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{suggestion.text}</span>
                  <span className={cn("text-xs capitalize", getTypeColor(suggestion.type))}>
                    {suggestion.type}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchInputWithSuggestions;
