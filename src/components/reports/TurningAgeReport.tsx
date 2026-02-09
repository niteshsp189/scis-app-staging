import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/services/reportService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Printer, Search, Loader2, Clock, RotateCcw, Download, MoreHorizontal, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const CUSTOMER_TYPES = ["Client", "Prospect", "Former"];
const PER_PAGE_OPTIONS = [10, 25, 50, 100];
const TURNING_IN = [
  { value: "1", label: "1 Month" }, { value: "2", label: "2 Months" }, { value: "3", label: "3 Months" },
  { value: "4", label: "4 Months" }, { value: "5", label: "5 Months" }, { value: "6", label: "6 Months" },
  { value: "7", label: "7 Months" }, { value: "8", label: "8 Months" }, { value: "9", label: "9 Months" },
  { value: "10", label: "10 Months" }, { value: "11", label: "11 Months" }, { value: "12", label: "12 Months" },
];

export function TurningAgeReport() {
  const navigate = useNavigate();
  const [customerTypes, setCustomerTypes] = useState<string[]>(["Client"]);
  const [targetAge, setTargetAge] = useState("65");
  const [month, setMonth] = useState("1");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [submitted, setSubmitted] = useState(false);

  const getFilters = () => ({
    customer_types: customerTypes.length > 0 ? customerTypes.join(",") : undefined,
    age: targetAge || undefined,
    months: month || undefined,
  });

  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const { data: reportData, isLoading, isFetching } = useQuery({
    queryKey: ["report-turning-age", activeFilters, page, perPage],
    queryFn: () => reportService.getTurningAge({ ...activeFilters, page, per_page: perPage }),
    enabled: submitted,
    retry: 1,
  });

  const toggleType = (type: string) => {
    setCustomerTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  };

  const handleSubmit = () => { setPage(1); setActiveFilters(getFilters()); setSubmitted(true); };
  const handlePrint = () => reportService.openReportPrint("turning-age", getFilters());
  const handleExportCsv = () => reportService.exportCsv("turning-age", getFilters());

  const handleReset = () => {
    setCustomerTypes(["Client"]);
    setTargetAge("65");
    setMonth("1");
    setPage(1); setSubmitted(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-600" />
          <h2 className="text-xl font-semibold">Turning Age Report</h2>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Target Age</Label>
              <Input type="number" value={targetAge} onChange={(e) => setTargetAge(e.target.value)} placeholder="e.g. 65" min="1" max="120" />
            </div>
            <div>
              <Label>Turning In</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                <SelectContent>
                  {TURNING_IN.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={isLoading} className="w-full md:w-auto">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            Generate Report
          </Button>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Id</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Date of Birth</TableHead>
                      <TableHead>Current Age</TableHead>
                      <TableHead>Turning Age</TableHead>
                      <TableHead>Turning Date</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">In Days</TableHead>
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
                          <TableCell>
                            <Link to={`/customers/${row.id}`} className="text-blue-600 hover:underline">{row.full_name}</Link>
                          </TableCell>
                          <TableCell>{row.gender}</TableCell>
                          <TableCell>{row.date_of_birth}</TableCell>
                          <TableCell>{row.current_age}</TableCell>
                          <TableCell className="font-semibold">{row.turning_age}</TableCell>
                          <TableCell>{row.turning_date}</TableCell>
                          <TableCell>{row.home_phone}</TableCell>
                          <TableCell>
                            <Badge variant={row.status === "Client" ? "default" : row.status === "Prospect" ? "secondary" : "outline"}>
                              {row.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={row.in_days <= 30 ? "destructive" : row.in_days <= 90 ? "default" : "secondary"}>
                              {row.in_days} days
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
