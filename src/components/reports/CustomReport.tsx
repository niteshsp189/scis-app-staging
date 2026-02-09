import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/services/reportService";
import globalSearchService, { SearchSuggestion } from "@/services/globalSearchService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Printer, Search, Loader2, FileSearch, Download, MoreHorizontal, Eye, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SelectedCustomer {
  id: number;
  text: string;
  customer_type?: string;
}

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export function CustomReport() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState<SelectedCustomer[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [submitted, setSubmitted] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const { data: reportData, isLoading, isFetching } = useQuery({
    queryKey: ["report-custom", activeFilters, page, perPage],
    queryFn: () =>
      reportService.getCustomReport({
        ...activeFilters,
        page,
        per_page: perPage,
      }),
    enabled: submitted,
    retry: 1,
  });

  // Fetch suggestions when search term changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchTerm.trim().length >= 2) {
      debounceRef.current = setTimeout(async () => {
        setIsLoadingSuggestions(true);
        try {
          const response = await globalSearchService.getSuggestions(searchTerm.trim(), 8);
          const customerSuggestions = response.data.filter(
            (s: SearchSuggestion) => s.type === "customer"
          );
          // Exclude already-selected customers
          const filtered = customerSuggestions.filter(
            (s) => !selectedCustomers.some((sel) => sel.id === s.id)
          );
          setSuggestions(filtered);
          setShowSuggestions(true);
          setActiveSuggestionIndex(-1);
        } catch {
          setSuggestions([]);
        } finally {
          setIsLoadingSuggestions(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchTerm, selectedCustomers]);

  // Click outside to close suggestions
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelectSuggestion = useCallback((suggestion: SearchSuggestion) => {
    setSelectedCustomers((prev) => [
      ...prev,
      { id: suggestion.id, text: suggestion.text, customer_type: suggestion.customer_type },
    ]);
    setSearchTerm("");
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    inputRef.current?.focus();
  }, []);

  const handleRemoveCustomer = useCallback((id: number) => {
    setSelectedCustomers((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveSuggestionIndex((p) => (p < suggestions.length - 1 ? p + 1 : 0));
          return;
        case "ArrowUp":
          e.preventDefault();
          setActiveSuggestionIndex((p) => (p > 0 ? p - 1 : suggestions.length - 1));
          return;
        case "Enter":
          e.preventDefault();
          if (activeSuggestionIndex >= 0) {
            handleSelectSuggestion(suggestions[activeSuggestionIndex]);
          } else {
            handleSubmit();
          }
          return;
        case "Escape":
          setShowSuggestions(false);
          setActiveSuggestionIndex(-1);
          return;
      }
    }
    if (e.key === "Backspace" && searchTerm === "" && selectedCustomers.length > 0) {
      handleRemoveCustomer(selectedCustomers[selectedCustomers.length - 1].id);
      return;
    }
    if (e.key === "Enter") handleSubmit();
  };

  const getFilters = () => {
    if (selectedCustomers.length > 0) {
      return {
        customer_ids: selectedCustomers.map((c) => c.id),
        search: searchTerm || undefined,
      };
    }
    return { search: searchTerm || undefined };
  };

  const handleSubmit = () => { setPage(1); setActiveFilters(getFilters()); setSubmitted(true); };
  const handlePrint = () => reportService.openReportPrint("custom", getFilters());
  const handleExportCsv = () => reportService.exportCsv("custom", getFilters());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSearch className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold">Custom Report</h2>
        </div>
        {reportData?.data && reportData.data.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />Print
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2 relative">
              <Label>Search</Label>
              <div
                className="flex flex-wrap items-center gap-1.5 min-h-[40px] rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text"
                onClick={() => inputRef.current?.focus()}
              >
                {selectedCustomers.map((customer) => (
                  <span
                    key={customer.id}
                    className="inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-800 px-2.5 py-0.5 text-xs font-medium"
                  >
                    {customer.text}
                    {customer.customer_type && (
                      <span className="text-purple-500 text-[10px]">({customer.customer_type})</span>
                    )}
                    <button
                      type="button"
                      className="ml-0.5 rounded-full hover:bg-purple-200 p-0.5"
                      onClick={(e) => { e.stopPropagation(); handleRemoveCustomer(customer.id); }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  ref={inputRef}
                  className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground"
                  placeholder={selectedCustomers.length === 0 ? "Type to search customers..." : "Add more..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0 && searchTerm.trim().length >= 2) setShowSuggestions(true);
                  }}
                  autoComplete="off"
                />
                {isLoadingSuggestions && (
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin flex-shrink-0" />
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
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
                      onClick={() => handleSelectSuggestion(suggestion)}
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
                        {(suggestion.phone || suggestion.address) && (
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            {suggestion.phone && (
                              <span className="flex items-center gap-1">
                                <span>📞</span>
                                <span>{suggestion.phone}</span>
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
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {submitted && reportData && (
        <>
          <div className="flex items-center justify-between">
            <div className="bg-purple-50 border border-purple-200 rounded-md px-4 py-2">
              <span className="text-purple-800 font-medium">Total records found: {reportData.total}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Per page:</span>
              <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PER_PAGE_OPTIONS.map((n) => (<SelectItem key={n} value={String(n)}>{n}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Id</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>DOB</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reg Date</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFetching ? (
                    <TableRow><TableCell colSpan={10} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : reportData.data.length === 0 ? (
                    <TableRow><TableCell colSpan={10} className="text-center py-8 text-gray-500">No records found</TableCell></TableRow>
                  ) : (
                    reportData.data.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell><Badge variant="secondary">{row.type}</Badge></TableCell>
                        <TableCell>
                          <Link to={`/customers/${row.id}`} className="text-blue-600 hover:underline">{row.first_name}</Link>
                        </TableCell>
                        <TableCell>{row.last_name}</TableCell>
                        <TableCell>{row.gender}</TableCell>
                        <TableCell>{row.date_of_birth}</TableCell>
                        <TableCell>{row.home_phone}</TableCell>
                        <TableCell>
                          <Badge variant={row.status === "Client" ? "default" : row.status === "Prospect" ? "secondary" : row.status === "Deceased" ? "destructive" : "outline"}>
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.created_at}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/customers/${row.id}`)}><Eye className="h-4 w-4 mr-2" />View Profile</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {reportData.pagination.total_pages > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="flex items-center px-3 text-sm text-gray-600">Page {page} of {reportData.pagination.total_pages}</span>
              <Button variant="outline" size="sm" disabled={page >= reportData.pagination.total_pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
