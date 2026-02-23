
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChatButton } from "@/components/ChatButton";
import { NotificationButton } from "@/components/NotificationButton";
import { UserProfileButton } from "@/components/UserProfileButton";
import { SidebarTrigger } from "@/components/ui/sidebar";
import SearchInputWithSuggestions from "@/components/ui/SearchInputWithSuggestions";
import globalSearchService from "@/services/globalSearchService";

export function TopNav() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (text?: string) => {
    const query = text || searchTerm;
    if (!query.trim()) return;
    const url = globalSearchService.buildSearchUrl(query.trim());
    navigate(url);
    setSearchTerm("");
  };

  return (
    <div className="professional-nav px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img 
            src="/uploads/Maha-Shahwan-150x150.jpg" 
            alt="SCIS Logo" 
            className="h-8 w-8 rounded-lg shadow-sm"
          />
          <span className="text-xl font-semibold text-slate-900">SCIS</span>
        </Link>
      </div>
      <div className="flex-1 max-w-xl mx-6">
        <SearchInputWithSuggestions
          value={searchTerm}
          onChange={setSearchTerm}
          onSearch={handleSearch}
          placeholder="Search customers, policies..."
          className="w-full border border-slate-300 rounded-lg shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
        />
      </div>
      <div className="flex items-center gap-3">
        <ChatButton />
        <NotificationButton />
        <UserProfileButton />
      </div>
    </div>
  );
}
