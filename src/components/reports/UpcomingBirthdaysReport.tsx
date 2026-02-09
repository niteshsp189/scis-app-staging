import { useState } from "react";
import { getCustomerViewUrl } from "@/utils/customerRoutes";
import { useQuery } from "@tanstack/react-query";
import { reportService, type FilterOptions } from "@/services/reportService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Printer, Search, Loader2, Cake, RotateCcw, Download, MoreHorizontal, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const CUSTOMER_TYPES = ["Client", "Prospect", "Former"];
const PER_PAGE_OPTIONS = [10, 25, 50, 100];
const TURNING_IN = [
  { value: "1", label: "1 Month" }, { value: "2", label: "2 Months" }, { value: "3", label: "3 Months" },
  { value: "4", label: "4 Months" }, { value: "5", label: "5 Months" }, { value: "6", label: "6 Months" },
  { value: "7", label: "7 Months" }, { value: "8", label: "8 Months" }, { value: "9", label: "9 Months" },
  { value: "10", label: "10 Months" }, { value: "11", label: "11 Months" }, { value: "12", label: "12 Months" },
];

export function UpcomingBirthdaysReport() {
  const navigate = useNavigate();
  const [customerTypes, setCustomerTypes] = useState<string[]>(["Client"]);
  const [month, setMonth] = useState("1");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [submitted, setSubmitted] = useState(false);

  const getFilters = () => ({
    customer_types: customerTypes.length > 0 ? customerTypes.join(",") : undefined,
    months: month || undefined,
  });

  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const { data: reportData, isLoading, isFetching } = useQuery({
    queryKey: ["report-upcoming-birthdays", activeFilters, page, perPage],
    queryFn: () => reportService.getUpcomingBirthdays({ ...activeFilters, page, per_page: perPage }),
    enabled: submitted,
    retry: 1,
  });

  const toggleType = (type: string) => {
    setCustomerTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  };

  const handleSubmit = () => { setPage(1); setActiveFilters(getFilters()); setSubmitted(true); };
  const handlePrint = () => reportService.openReportPrint("upcoming-birthdays", getFilters());
  const handleExportCsv = () => reportService.exportCsv("upcoming-birthdays", getFilters());

  const handleReset = () => {
    setCustomerTypes(["Client"]);
    setMonth("1");
    setPage(1); setSubmitted(false);
  };

  const getInDaysBadge = (days: number) => {
    if (days <= 7) return "destructive";
    if (days <= 14) return "default";
    if (days <= 30) return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cake className="h-5 w-5 text-pink-600" />
          <h2 className="text-xl font-semibold">Upcoming Birthdays</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />Reset
          </Button>
          {reportData?.data && reportData.data.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleExportCsv}>
                <Download className="h-4 w-4 mr-2" />Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />Print
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div>
              <Label className="mb-2 block">Customer Types</Label>
              <div className="flex flex-wrap gap-3">
                {CUSTOMER_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={customerTypes.includes(type)} onChange={() => toggleType(type)} className="rounded border-gray-300" />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="w-full md:w-48">
              <Label>Turning In</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                <SelectContent>
                  {TURNING_IN.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSubmit} disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {submitted && reportData && (
        <>
          <div className="flex items-center justify-between">
            <div className="bg-green-50 border border-green-200 rounded-md px-4 py-2">
              <span className="text-green-800 font-medium">Total records found: {reportData.total}</span>
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
                      <TableHead>Full Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Date of Birth</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">In Days</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isFetching ? (
                      <TableRow><TableCell colSpan={9} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                    ) : reportData.data.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-500">No records found</TableCell></TableRow>
                    ) : (
                      reportData.data.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.id}</TableCell>
                          <TableCell>
                            <Link to={getCustomerViewUrl(row.id, row.status)} className="text-blue-600 hover:underline">{row.full_name}</Link>
                          </TableCell>
                          <TableCell>{row.gender}</TableCell>
                          <TableCell>{row.date_of_birth}</TableCell>
                          <TableCell>{row.age}</TableCell>
                          <TableCell>{row.home_phone}</TableCell>
                          <TableCell>
                            <Badge variant={row.status === "Client" ? "default" : row.status === "Prospect" ? "secondary" : "outline"}>
                              {row.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={getInDaysBadge(row.in_days)}>{row.in_days} days</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(getCustomerViewUrl(row.id, row.status))}><Eye className="h-4 w-4 mr-2" />View Profile</DropdownMenuItem>
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
