import { useNavigate } from "react-router-dom";
import SearchInputWithSuggestions from "@/components/ui/SearchInputWithSuggestions";
import { SearchSuggestion } from "@/services/globalSearchService";
import { getCustomerViewUrl } from "@/utils/customerRoutes";

interface CustomerSearchProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  /** When set, suggestions are filtered to this account status (e.g. "Client") */
  accountStatus?: string;
}

/**
 * Customer-specific search component.
 * Wraps SearchInputWithSuggestions with suggestionsFilter="customer"
 * so the same unified search logic, scoring, and ordering is used everywhere.
 */
export const CustomerSearch = ({
  searchTerm,
  onSearch,
  accountStatus,
}: CustomerSearchProps) => {
  const navigate = useNavigate();

  const handleSearch = (text?: string) => {
    const q = text || searchTerm;
    // When pressing Enter without selecting a suggestion,
    // just commit the search term to trigger a list filter
    onSearch(q);
  };

  const handleSuggestionNavigate = (suggestion: SearchSuggestion) => {
    // Navigate directly to the customer detail page using pre-built URL when available
    if (suggestion.url) {
      navigate(suggestion.url);
    } else {
      navigate(
        getCustomerViewUrl(
          suggestion.id,
          suggestion.customer_type,
          suggestion.legacy_client_id
        )
      );
    }
  };

  return (
    <div className="w-full">
      <SearchInputWithSuggestions
        value={searchTerm}
        onChange={onSearch}
        onSearch={handleSearch}
        onSuggestionNavigate={handleSuggestionNavigate}
        placeholder="Search by name, phone, SSN, or zip code..."
        className="w-full"
        showSearchButton
        suggestionsFilter="customer"
        suggestionsAccountStatus={accountStatus}
      />
    </div>
  );
};
