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
import { Printer, Search, Loader2, CalendarCheck, RotateCcw, Download, MoreHorizontal, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export function EffectiveDateReport() {
  const navigate = useNavigate();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [policyStatus, setPolicyStatus] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [planTypeId, setPlanTypeId] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [submitted, setSubmitted] = useState(false);

  const { data: filterOptions } = useQuery<FilterOptions>({
    queryKey: ["report-filter-options"],
    queryFn: () => reportService.getFilterOptions(),
  });

  const getFilters = () => ({
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    status: policyStatus || undefined,
    company_id: companyId || undefined,
    plan_type_id: planTypeId || undefined,
  });

  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const { data: reportData, isLoading, isFetching } = useQuery({
    queryKey: ["report-effective-date", activeFilters, page, perPage],
    queryFn: () => reportService.getEffectiveDate({ ...activeFilters, page, per_page: perPage }),
    enabled: submitted,
    retry: 1,
  });

  const handleSubmit = () => { setPage(1); setActiveFilters(getFilters()); setSubmitted(true); };
  const handlePrint = () => reportService.openReportPrint("effective-date", getFilters());
  const handleExportCsv = () => reportService.exportCsv("effective-date", getFilters());

  const handleReset = () => {
    setDateFrom(""); setDateTo(""); setPolicyStatus(""); setCompanyId(""); setPlanTypeId("");
    setPage(1); setSubmitted(false);
  };

  const formatCurrency = (val: number | string | null | undefined) => {
    if (val === null || val === undefined || val === "") return "-";
    const num = typeof val === "string" ? parseFloat(val) : val;
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-teal-600" />
          <div>
            <h2 className="text-xl font-semibold">Effective Date Report</h2>
            <p className="text-sm text-gray-500">Policy renewal & expiration reminders by effective date</p>
          </div>
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
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Effective Date From</Label><DateInput value={dateFrom} onChange={setDateFrom} placeholder="Select date" /></div>
            <div><Label>Effective Date To</Label><DateInput value={dateTo} onChange={setDateTo} placeholder="Select date" /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Policy Status</Label>
              <Select value={policyStatus} onValueChange={(v) => setPolicyStatus(v === "__all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All</SelectItem>
                  {filterOptions?.policy_statuses?.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Insurance Company</Label>
              <Select value={companyId} onValueChange={(v) => setCompanyId(v === "__all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All</SelectItem>
                  {filterOptions?.companies?.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plan Type</Label>
              <Select value={planTypeId} onValueChange={(v) => setPlanTypeId(v === "__all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All</SelectItem>
                  {filterOptions?.plan_types?.map((pt) => (<SelectItem key={pt.id} value={String(pt.id)}>{pt.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={isLoading || (!dateFrom && !dateTo)} className="w-full md:w-auto">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            Generate Report
          </Button>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Id</TableHead>
                      <TableHead>Policy #</TableHead>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead className="text-right">Premium</TableHead>
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
                      reportData.data.map((row, idx) => (
                        <TableRow key={row.id || idx}>
                          <TableCell>{row.customer_id ?? row.id}</TableCell>
                          <TableCell className="font-mono text-sm">{row.policy_number}</TableCell>
                          <TableCell>
                            <Link to={`/customers/${row.customer_id ?? row.id}`} className="text-blue-600 hover:underline">{row.customer_name}</Link>
                          </TableCell>
                          <TableCell>{row.plan_name}</TableCell>
                          <TableCell>{row.company_name}</TableCell>
                          <TableCell>{row.plan_type}</TableCell>
                          <TableCell>{row.start_date}</TableCell>
                          <TableCell>{row.end_date}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.premium_amount)}</TableCell>
                          <TableCell>
                            <Badge variant={
                              row.status === "Active" ? "default" :
                              row.status === "Cancelled" ? "destructive" : "secondary"
                            }>
                              {row.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/customers/${row.customer_id ?? row.id}`)}><Eye className="h-4 w-4 mr-2" />View Profile</DropdownMenuItem>
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
