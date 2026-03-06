import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2, User, FileText, Calendar, Target, Bell, Users, Phone, MapPin, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import globalSearchService, { SearchSuggestion } from '@/services/globalSearchService';

interface SearchInputWithSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (searchText?: string) => void;
  onSuggestionSelect?: () => void;
  onSuggestionNavigate?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showSearchButton?: boolean;
  suggestionsFilter?: string;
  /**
   * When set, pass this account_status to the suggestions API so only
   * customers matching the page-level status are returned (e.g. "Client").
   */
  suggestionsAccountStatus?: string;
  /**
   * when true the dropdown expands to the full screen width (useful for mobile)
   */
  fullWidthSuggestions?: boolean;
}

const SearchInputWithSuggestions: React.FC<SearchInputWithSuggestionsProps> = ({
  value,
  onChange,
  onSearch,
  onSuggestionSelect,
  onSuggestionNavigate,
  placeholder = "Search customers, policies, appointments...",
  className,
  disabled = false,
  showSearchButton = false,
  suggestionsFilter,
  suggestionsAccountStatus,
  fullWidthSuggestions = false,
}) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [justSelectedSuggestion, setJustSelectedSuggestion] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const isFocusedRef = useRef(false);
  const [suggestionStyle, setSuggestionStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Don't fetch suggestions if we just selected one or input isn't focused
    if (justSelectedSuggestion || !isFocusedRef.current) {
      return;
    }

    // Only fetch suggestions if input has at least 2 characters
    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(async () => {
        setIsLoadingSuggestions(true);
        try {
          const response = await globalSearchService.getSuggestions(value.trim(), 8, suggestionsAccountStatus);
          const filtered = suggestionsFilter
            ? response.data.filter((s: SearchSuggestion) => s.type === suggestionsFilter)
            : response.data;
          setSuggestions(filtered);
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
  }, [value, justSelectedSuggestion, suggestionsAccountStatus]);

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
        e.preventDefault();
        onSearch();
        // Close dropdown & blur so the user sees the list results
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        inputRef.current?.blur();
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
          // Close dropdown & blur so the user sees the list results
          setShowSuggestions(false);
          setActiveSuggestionIndex(-1);
          inputRef.current?.blur();
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
    // If onSuggestionNavigate is provided, use it for direct navigation
    if (onSuggestionNavigate) {
      onSuggestionNavigate(suggestion);
    } else {
      // Trigger search immediately with the suggestion text
      // Pass the text directly to avoid state timing issues
      onSearch(suggestion.text);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Reset the flag when user manually types
    setJustSelectedSuggestion(false);
    onChange(e.target.value);
  };

  const handleInputFocus = () => {
    isFocusedRef.current = true;
    // Don't show suggestions if we just selected one
    if (justSelectedSuggestion) {
      return;
    }
    if (suggestions && suggestions.length > 0 && value.trim().length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    isFocusedRef.current = false;
  };

  // adjust suggestion container position for full-width mode
  useEffect(() => {
    if (showSuggestions && fullWidthSuggestions && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      // add 10px margin on each side
      const horizontalMargin = 10;
      setSuggestionStyle({
        position: 'fixed',
        top: rect.bottom + window.scrollY,
        left: horizontalMargin,
        width: `calc(100vw - ${horizontalMargin * 2}px)`,
        zIndex: 9999,
      });
    } else {
      setSuggestionStyle({});
    }
  }, [showSuggestions, fullWidthSuggestions, value]);

  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      customer: <User className="h-4 w-4 text-blue-500" />,
      policy: <FileText className="h-4 w-4 text-green-500" />,
      appointment: <Calendar className="h-4 w-4 text-purple-500" />,
      prospect: <Target className="h-4 w-4 text-orange-500" />,
      deal: <FileText className="h-4 w-4 text-yellow-500" />,
      reminder: <Bell className="h-4 w-4 text-red-500" />,
      user: <Users className="h-4 w-4 text-gray-500" />,
    };
    return iconMap[type] || <Search className="h-4 w-4 text-gray-400" />;
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
      <div className={cn("relative", showSearchButton && "flex items-stretch")}>
        <div className="relative flex-1">
          {!showSearchButton && (
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          )}
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className={cn(showSearchButton ? "pl-3 h-10" : "pl-10 h-10", showSearchButton && "rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0", className)}
            disabled={disabled}
            autoComplete="off"
          />
          {isLoadingSuggestions && (
            <Loader2 className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
          )}
        </div>
        {showSearchButton && (
          <button
              type="button"
              onClick={() => {
                // Trigger parent search, then hide suggestions and blur input
                onSearch();
                setShowSuggestions(false);
                setActiveSuggestionIndex(-1);
                inputRef.current?.blur();
              }}
              disabled={disabled || !value.trim()}
              className="inline-flex items-center justify-center px-3 h-10 bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-r-lg border border-l-0 border-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Search className="h-4 w-4" />
            </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className={cn(
            // position classes are mostly for non-full-width mode; style will override when fixed
            "absolute top-full z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto",
            !fullWidthSuggestions && "left-0 right-0"
          )}
          style={fullWidthSuggestions ? suggestionStyle : undefined}
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
              <span className="flex-shrink-0">{getTypeIcon(suggestion.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{suggestion.text}</span>
                  {suggestion.type === 'customer' && suggestion.customer_type && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      {suggestion.customer_type}
                    </span>
                  )}
                  {suggestion.type !== 'customer' && (
                    <span className={cn("text-xs capitalize", getTypeColor(suggestion.type))}>
                      {suggestion.type}
                    </span>
                  )}
                </div>
                {suggestion.type === 'customer' && (suggestion.phone || suggestion.address || suggestion.ssn) && (
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    {suggestion.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{suggestion.phone}</span>
                      </span>
                    )}
                    {suggestion.ssn && (
                      <span className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        <span>{suggestion.ssn}</span>
                      </span>
                    )}
                    {suggestion.address && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3" />
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
  );
};

export default SearchInputWithSuggestions;
