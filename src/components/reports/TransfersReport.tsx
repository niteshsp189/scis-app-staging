import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportService, type FilterOptions } from "@/services/reportService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Printer, Search, Loader2, ArrowRightLeft, Download, MoreHorizontal, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export function TransfersReport() {
  const navigate = useNavigate();
  const [fromCompanyId, setFromCompanyId] = useState("");
  const [toCompanyId, setToCompanyId] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [submitted, setSubmitted] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const { data: filterOptions } = useQuery<FilterOptions>({
    queryKey: ["report-filter-options"],
    queryFn: () => reportService.getFilterOptions(),
  });

  const { data: reportData, isLoading, isFetching } = useQuery({
    queryKey: ["report-transfers", activeFilters, page, perPage],
    queryFn: () =>
      reportService.getTransfersReport({
        ...activeFilters,
        page,
        per_page: perPage,
      }),
    enabled: submitted,
    retry: 1,
  });

  const getFilters = () => ({
    from_company_id: fromCompanyId,
    to_company_id: toCompanyId,
  });

  const handleSubmit = () => { if (!fromCompanyId || !toCompanyId) return; setPage(1); setActiveFilters(getFilters()); setSubmitted(true); };
  const handlePrint = () => reportService.openReportPrint("transfers", getFilters());
  const handleExportCsv = () => reportService.exportCsv("transfers", getFilters());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-teal-600" />
          <h2 className="text-xl font-semibold">Transfers Report</h2>
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
              <Label>From Company</Label>
              <Select value={fromCompanyId} onValueChange={setFromCompanyId}>
                <SelectTrigger><SelectValue placeholder="Select company..." /></SelectTrigger>
                <SelectContent>
                  {filterOptions?.companies?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>To Company</Label>
              <Select value={toCompanyId} onValueChange={setToCompanyId}>
                <SelectTrigger><SelectValue placeholder="Select company..." /></SelectTrigger>
                <SelectContent>
                  {filterOptions?.companies?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSubmit} disabled={isLoading || !fromCompanyId || !toCompanyId}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {submitted && reportData && (
        <>
          <div className="flex items-center justify-between">
            <div className="bg-teal-50 border border-teal-200 rounded-md px-4 py-2">
              <span className="text-teal-800 font-medium">Total records found: {reportData.total}</span>
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
                    <TableHead>Full Name</TableHead>
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
                    <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : reportData.data.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">No transfer records found</TableCell></TableRow>
                  ) : (
                    reportData.data.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>
                          <Link to={`/customers/${row.id}`} className="text-blue-600 hover:underline">{row.full_name}</Link>
                        </TableCell>
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
