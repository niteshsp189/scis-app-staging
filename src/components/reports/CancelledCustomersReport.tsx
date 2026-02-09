import { useState } from "react";
import { getCustomerViewUrl } from "@/utils/customerRoutes";
import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/services/reportService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Printer, Search, Loader2, UserX, Download, MoreHorizontal, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export function CancelledCustomersReport() {
  const navigate = useNavigate();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [submitted, setSubmitted] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const { data: reportData, isLoading, isFetching } = useQuery({
    queryKey: ["report-cancelled-customers", activeFilters, page, perPage],
    queryFn: () =>
      reportService.getCancelledCustomers({
        ...activeFilters,
        page,
        per_page: perPage,
      }),
    enabled: submitted,
    retry: 1,
  });

  const getFilters = () => ({
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const handleSubmit = () => { setPage(1); setActiveFilters(getFilters()); setSubmitted(true); };
  const handlePrint = () => reportService.openReportPrint("cancelled-customers", getFilters());
  const handleExportCsv = () => reportService.exportCsv("cancelled-customers", getFilters());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserX className="h-5 w-5 text-red-600" />
          <h2 className="text-xl font-semibold">Cancelled Customers</h2>
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
            <div>
              <Label>Date From</Label>
              <DateInput value={dateFrom} onChange={setDateFrom} placeholder="Select date" />
            </div>
            <div>
              <Label>Date To</Label>
              <DateInput value={dateTo} onChange={setDateTo} placeholder="Select date" />
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
            <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-2">
              <span className="text-amber-800 font-medium">Total records found: {reportData.total}</span>
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
                    <TableHead>Full Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFetching ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : reportData.data.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No records found</TableCell></TableRow>
                  ) : (
                    reportData.data.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>
                          <Badge variant={row.type === "Deceased" ? "destructive" : "secondary"}>{row.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Link to={getCustomerViewUrl(row.id, row.type)} className="text-blue-600 hover:underline">{row.full_name}</Link>
                        </TableCell>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.method}</TableCell>
                        <TableCell>{row.reason}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(getCustomerViewUrl(row.id, row.type))}><Eye className="h-4 w-4 mr-2" />View Profile</DropdownMenuItem>
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
