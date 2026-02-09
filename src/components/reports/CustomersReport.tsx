import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportService, type FilterOptions } from "@/services/reportService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Printer, Search, Loader2, Users, RotateCcw, Download, MoreHorizontal, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const CUSTOMER_TYPES = ["Client", "Prospect", "Former", "Deceased"];
const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export function CustomersReport() {
  const navigate = useNavigate();
  const [customerTypes, setCustomerTypes] = useState<string[]>([]);
  const [agentId, setAgentId] = useState("");
  const [gender, setGender] = useState("");
  const [referral, setReferral] = useState("");
  const [status, setStatus] = useState("");
  const [smoker, setSmoker] = useState("");
  const [dontCall, setDontCall] = useState("");
  const [clientBook, setClientBook] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [zipCodes, setZipCodes] = useState("");
  const [birthdayFrom, setBirthdayFrom] = useState("");
  const [birthdayTo, setBirthdayTo] = useState("");
  const [ageFrom, setAgeFrom] = useState("");
  const [ageTo, setAgeTo] = useState("");
  const [premiumFrom, setPremiumFrom] = useState("");
  const [premiumTo, setPremiumTo] = useState("");
  const [effectiveDateFrom, setEffectiveDateFrom] = useState("");
  const [effectiveDateTo, setEffectiveDateTo] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [planTypeId, setPlanTypeId] = useState("");
  const [policyStatus, setPolicyStatus] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [noCancelledPolicies, setNoCancelledPolicies] = useState(false);
  const [newClientsOnly, setNewClientsOnly] = useState(false);
  const [sort1, setSort1] = useState("");
  const [sort2, setSort2] = useState("");
  const [sort3, setSort3] = useState("");
  const [sort4, setSort4] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [submitted, setSubmitted] = useState(false);

  const { data: filterOptions } = useQuery<FilterOptions>({
    queryKey: ["report-filter-options"],
    queryFn: () => reportService.getFilterOptions(),
  });

  const getFilters = () => ({
    customer_types: customerTypes.length > 0 ? customerTypes.join(",") : undefined,
    agent_id: agentId || undefined,
    gender: gender || undefined,
    referral: referral || undefined,
    status: status || undefined,
    smoker: smoker || undefined,
    dont_call: dontCall || undefined,
    client_book: clientBook || undefined,
    state: state || undefined,
    city: city || undefined,
    zip_codes: zipCodes || undefined,
    birthday_from: birthdayFrom || undefined,
    birthday_to: birthdayTo || undefined,
    age_from: ageFrom || undefined,
    age_to: ageTo || undefined,
    premium_from: premiumFrom || undefined,
    premium_to: premiumTo || undefined,
    effective_date_from: effectiveDateFrom || undefined,
    effective_date_to: effectiveDateTo || undefined,
    company_id: companyId || undefined,
    plan_type_id: planTypeId || undefined,
    policy_status: policyStatus || undefined,
    policy_number: policyNumber || undefined,
    no_cancelled_policies: noCancelledPolicies || undefined,
    new_clients_only: newClientsOnly || undefined,
    sort_1: sort1 || undefined,
    sort_2: sort2 || undefined,
    sort_3: sort3 || undefined,
    sort_4: sort4 || undefined,
  });

  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const { data: reportData, isLoading, isFetching } = useQuery({
    queryKey: ["report-customers", activeFilters, page, perPage],
    queryFn: () => reportService.getCustomersReport({ ...activeFilters, page, per_page: perPage }),
    enabled: submitted,
    retry: 1,
  });

  const toggleType = (type: string) => {
    setCustomerTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  };

  const handleSubmit = () => { setPage(1); setActiveFilters(getFilters()); setSubmitted(true); };
  const handlePrint = () => reportService.openReportPrint("customers", getFilters());
  const handleExportCsv = () => reportService.exportCsv("customers", getFilters());

  const handleReset = () => {
    setCustomerTypes([]); setAgentId(""); setGender(""); setReferral(""); setStatus("");
    setSmoker(""); setDontCall(""); setClientBook(""); setState(""); setCity("");
    setZipCodes(""); setBirthdayFrom(""); setBirthdayTo(""); setAgeFrom(""); setAgeTo("");
    setPremiumFrom(""); setPremiumTo(""); setEffectiveDateFrom(""); setEffectiveDateTo("");
    setCompanyId(""); setPlanTypeId(""); setPolicyStatus(""); setPolicyNumber("");
    setNoCancelledPolicies(false); setNewClientsOnly(false);
    setSort1(""); setSort2(""); setSort3(""); setSort4("");
    setPage(1); setSubmitted(false);
  };

  const sortOptions = filterOptions?.sort_fields ? Object.entries(filterOptions.sort_fields) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-semibold">Customers Report</h2>
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
          {/* Customer Types */}
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

          {/* Row 1: Agent, Gender, Referral */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Agent</Label>
              <Select value={agentId || "__all"} onValueChange={(v) => setAgentId(v === "__all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="All Agents" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All Agents</SelectItem>
                  {filterOptions?.agents?.map((a) => (<SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={gender} onValueChange={(v) => setGender(v === "__all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All</SelectItem>
                  {filterOptions?.genders?.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Referral Source</Label>
              <Select value={referral} onValueChange={(v) => setReferral(v === "__all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All</SelectItem>
                  {filterOptions?.referral_sources?.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Smoker, Don't Call, Client Book */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Smoker</Label>
              <Select value={smoker} onValueChange={(v) => setSmoker(v === "__all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Don't Call List</Label>
              <Select value={dontCall} onValueChange={(v) => setDontCall(v === "__all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Client Book</Label>
              <Select value={clientBook} onValueChange={(v) => setClientBook(v === "__all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: State, City, Zip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>State</Label>
              <Select value={state} onValueChange={(v) => setState(v === "__all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="All States" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All States</SelectItem>
                  {filterOptions?.states?.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>City</Label><Input placeholder="City..." value={city} onChange={(e) => setCity(e.target.value)} /></div>
            <div><Label>Zip Code(s)</Label><Input placeholder="Comma-separated..." value={zipCodes} onChange={(e) => setZipCodes(e.target.value)} /></div>
          </div>

          {/* Row 4: Birthday, Age Range */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><Label>Birthday From</Label><DateInput value={birthdayFrom} onChange={setBirthdayFrom} placeholder="Select date" /></div>
            <div><Label>Birthday To</Label><DateInput value={birthdayTo} onChange={setBirthdayTo} placeholder="Select date" /></div>
            <div><Label>Age From</Label><Input type="number" placeholder="Min age" value={ageFrom} onChange={(e) => setAgeFrom(e.target.value)} /></div>
            <div><Label>Age To</Label><Input type="number" placeholder="Max age" value={ageTo} onChange={(e) => setAgeTo(e.target.value)} /></div>
          </div>

          {/* Row 5: Premium, Effective Date */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><Label>Premium From ($)</Label><Input type="number" placeholder="Min" value={premiumFrom} onChange={(e) => setPremiumFrom(e.target.value)} /></div>
            <div><Label>Premium To ($)</Label><Input type="number" placeholder="Max" value={premiumTo} onChange={(e) => setPremiumTo(e.target.value)} /></div>
            <div><Label>Effective Date From</Label><DateInput value={effectiveDateFrom} onChange={setEffectiveDateFrom} placeholder="Select date" /></div>
            <div><Label>Effective Date To</Label><DateInput value={effectiveDateTo} onChange={setEffectiveDateTo} placeholder="Select date" /></div>
          </div>

          {/* Row 6: Insurance, Plan Type, Policy Status, Policy # */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div><Label>Policy Number</Label><Input placeholder="Search policy #" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} /></div>
          </div>

          {/* Row 7: Checkboxes */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={noCancelledPolicies} onChange={(e) => setNoCancelledPolicies(e.target.checked)} className="rounded border-gray-300" />
              <span className="text-sm">No Cancelled Policies</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={newClientsOnly} onChange={(e) => setNewClientsOnly(e.target.checked)} className="rounded border-gray-300" />
              <span className="text-sm">New Clients Only (Last 30 Days)</span>
            </label>
          </div>

          {/* Row 8: Sort */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[{ val: sort1, set: setSort1, label: "Sort 1" }, { val: sort2, set: setSort2, label: "Sort 2" },
              { val: sort3, set: setSort3, label: "Sort 3" }, { val: sort4, set: setSort4, label: "Sort 4" }].map(({ val, set, label }) => (
              <div key={label}>
                <Label>{label}</Label>
                <Select value={val} onValueChange={(v) => set(v === "__none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">None</SelectItem>
                    {sortOptions.map(([key, displayName]) => (<SelectItem key={key} value={key}>{displayName}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            ))}
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
            <div className="bg-indigo-50 border border-indigo-200 rounded-md px-4 py-2">
              <span className="text-indigo-800 font-medium">Total records found: {reportData.total}</span>
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
                      <TableHead>Home Phone</TableHead>
                      <TableHead>Cell Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Zip</TableHead>
                      <TableHead>Referral</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isFetching ? (
                      <TableRow><TableCell colSpan={14} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                    ) : reportData.data.length === 0 ? (
                      <TableRow><TableCell colSpan={14} className="text-center py-8 text-gray-500">No records found</TableCell></TableRow>
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
                          <TableCell>{row.cell_phone}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{row.email}</TableCell>
                          <TableCell>{row.city}</TableCell>
                          <TableCell>{row.state}</TableCell>
                          <TableCell>{row.zip_code}</TableCell>
                          <TableCell>{row.referral}</TableCell>
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
