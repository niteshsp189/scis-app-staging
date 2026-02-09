import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportService, type FilterOptions } from "@/services/reportService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Printer, Search, Loader2, FileText, Download, MoreHorizontal, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const CUSTOMER_TYPES = ["Client", "Prospect", "Former", "Deceased"];
const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export function GeneralReport() {
  const navigate = useNavigate();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [birthdayFrom, setBirthdayFrom] = useState("");
  const [birthdayTo, setBirthdayTo] = useState("");
  const [sort1, setSort1] = useState("");
  const [sort2, setSort2] = useState("");
  const [sort3, setSort3] = useState("");
  const [sort4, setSort4] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [submitted, setSubmitted] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const { data: filterOptions } = useQuery<FilterOptions>({
    queryKey: ["report-filter-options"],
    queryFn: () => reportService.getFilterOptions(),
  });

  const { data: reportData, isLoading, isFetching } = useQuery({
    queryKey: ["report-general", activeFilters, page, perPage],
    queryFn: () =>
      reportService.getGeneralReport({
        ...activeFilters,
        page,
        per_page: perPage,
      }),
    enabled: submitted,
    retry: 1,
  });

  const getFilters = () => ({
    types: selectedTypes.length > 0 ? selectedTypes.join(",") : undefined,
    birthday_from: birthdayFrom || undefined,
    birthday_to: birthdayTo || undefined,
    sort_1: sort1 || undefined, sort_2: sort2 || undefined,
    sort_3: sort3 || undefined, sort_4: sort4 || undefined,
  });

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  };

  const handleSubmit = () => { setPage(1); setActiveFilters(getFilters()); setSubmitted(true); };
  const handlePrint = () => reportService.openReportPrint("general", getFilters());
  const handleExportCsv = () => reportService.exportCsv("general", getFilters());

  const sortOptions = filterOptions?.sort_fields ? Object.entries(filterOptions.sort_fields) : [];

  const renderSortSelect = (value: string, onChange: (v: string) => void, label: string) => (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__none">None</SelectItem>
          {sortOptions.map(([key, displayName]) => (
            <SelectItem key={key} value={key}>{displayName}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold">General Report</h2>
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
        <CardContent className="pt-4 space-y-4">
          <div>
            <Label className="mb-2 block">Customer Types</Label>
            <div className="flex flex-wrap gap-3">
              {CUSTOMER_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={selectedTypes.includes(type)} onChange={() => toggleType(type)} className="rounded border-gray-300" />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Birthday From</Label><DateInput value={birthdayFrom} onChange={setBirthdayFrom} placeholder="Select date" /></div>
            <div><Label>Birthday To</Label><DateInput value={birthdayTo} onChange={setBirthdayTo} placeholder="Select date" /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {renderSortSelect(sort1, (v) => setSort1(v === "__none" ? "" : v), "Sort 1")}
            {renderSortSelect(sort2, (v) => setSort2(v === "__none" ? "" : v), "Sort 2")}
            {renderSortSelect(sort3, (v) => setSort3(v === "__none" ? "" : v), "Sort 3")}
            {renderSortSelect(sort4, (v) => setSort4(v === "__none" ? "" : v), "Sort 4")}
          </div>

          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            Generate Report
          </Button>
        </CardContent>
      </Card>

      {submitted && reportData && (
        <>
          <div className="flex items-center justify-between">
            <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-2">
              <span className="text-blue-800 font-medium">Total records found: {reportData.total}</span>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Id</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>DOB</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Zip</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isFetching ? (
                      <TableRow><TableCell colSpan={11} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                    ) : reportData.data.length === 0 ? (
                      <TableRow><TableCell colSpan={11} className="text-center py-8 text-gray-500">No records found</TableCell></TableRow>
                    ) : (
                      reportData.data.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.id}</TableCell>
                          <TableCell><Badge variant="secondary">{row.type}</Badge></TableCell>
                          <TableCell>
                            <Link to={`/customers/${row.id}`} className="text-blue-600 hover:underline">{row.full_name}</Link>
                          </TableCell>
                          <TableCell>{row.gender}</TableCell>
                          <TableCell>{row.date_of_birth}</TableCell>
                          <TableCell>{row.home_phone}</TableCell>
                          <TableCell>{row.city}</TableCell>
                          <TableCell>{row.state}</TableCell>
                          <TableCell>{row.zip_code}</TableCell>
                          <TableCell>
                            <Badge variant={row.status === "Client" ? "default" : row.status === "Prospect" ? "secondary" : row.status === "Deceased" ? "destructive" : "outline"}>
                              {row.status}
                            </Badge>
                          </TableCell>
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
              </div>
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
