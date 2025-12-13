import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { TrendingUp, Users, Target, DollarSign, FileText, Calendar, Download, Filter } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const Reports = () => {
  const [dateRange, setDateRange] = useState("current");
  const [selectedMetrics, setSelectedMetrics] = useState(["revenue", "policies", "renewals"]);
  const [filterOpen, setFilterOpen] = useState(false);

  const salesData = [
    { month: "Jan", newPolicies: 12, renewals: 8, revenue: 45000 },
    { month: "Feb", newPolicies: 15, renewals: 12, revenue: 62000 },
    { month: "Mar", newPolicies: 18, renewals: 15, revenue: 78000 },
    { month: "Apr", newPolicies: 22, renewals: 18, revenue: 95000 },
    { month: "May", newPolicies: 20, renewals: 22, revenue: 88000 },
    { month: "Jun", newPolicies: 25, renewals: 20, revenue: 105000 },
  ];

  const policyTypeData = [
    { name: "Auto Insurance", value: 35, color: "#3B82F6" },
    { name: "Home Insurance", value: 25, color: "#10B981" },
    { name: "Life Insurance", value: 20, color: "#F59E0B" },
    { name: "Business Insurance", value: 20, color: "#EF4444" },
  ];

  const conversionData = [
    { stage: "Leads", count: 245 },
    { stage: "Qualified", count: 180 },
    { stage: "Proposal", count: 120 },
    { stage: "Negotiation", count: 80 },
    { stage: "Closed Won", count: 45 },
  ];

  const agentPerformance = [
    { agent: "Mike Johnson", policies: 28, revenue: 156000, conversionRate: 24 },
    { agent: "Sarah Davis", policies: 22, revenue: 134000, conversionRate: 28 },
    { agent: "Robert Chen", policies: 18, revenue: 98000, conversionRate: 22 },
    { agent: "Lisa Wilson", policies: 15, revenue: 89000, conversionRate: 26 },
  ];

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

  const handleApplyFilters = () => {
    setFilterOpen(false);
    toast({
      title: "Filters Applied",
      description: "Report data has been updated based on your filter selections.",
    });
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your report is being prepared for download.",
    });
  };

  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Track performance and gain insights into your insurance business</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Month</SelectItem>
              <SelectItem value="last">Last Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report Filters</DialogTitle>
                <DialogDescription>
                  Customize your report by selecting specific metrics and criteria.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Metrics to Include</Label>
                  <div className="mt-2 space-y-2">
                    {[
                      { id: "revenue", label: "Revenue Data" },
                      { id: "policies", label: "Policy Information" },
                      { id: "renewals", label: "Renewal Rates" },
                      { id: "agents", label: "Agent Performance" },
                      { id: "conversion", label: "Conversion Funnel" }
                    ].map(metric => (
                      <div key={metric.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={metric.id}
                          checked={selectedMetrics.includes(metric.id)}
                          onCheckedChange={() => handleMetricToggle(metric.id)}
                        />
                        <Label htmlFor={metric.id}>{metric.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="agentFilter">Filter by Agent</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All Agents" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Agents</SelectItem>
                      <SelectItem value="mike">Mike Johnson</SelectItem>
                      <SelectItem value="sarah">Sarah Davis</SelectItem>
                      <SelectItem value="robert">Robert Chen</SelectItem>
                      <SelectItem value="lisa">Lisa Wilson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="policyFilter">Filter by Policy Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All Policy Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="auto">Auto Insurance</SelectItem>
                      <SelectItem value="home">Home Insurance</SelectItem>
                      <SelectItem value="life">Life Insurance</SelectItem>
                      <SelectItem value="business">Business Insurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={handleApplyFilters} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">$473,000</p>
                <p className="text-sm text-green-600 font-medium">+18% vs last month</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">New Policies</p>
                <p className="text-2xl font-bold text-gray-900">132</p>
                <p className="text-sm text-green-600 font-medium">+12% vs last month</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Renewal Rate</p>
                <p className="text-2xl font-bold text-gray-900">87%</p>
                <p className="text-sm text-green-600 font-medium">+5% vs last month</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">18.4%</p>
                <p className="text-sm text-green-600 font-medium">+2% vs last month</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="newPolicies" stroke="#3B82F6" strokeWidth={2} name="New Policies" />
                <Line type="monotone" dataKey="renewals" stroke="#10B981" strokeWidth={2} name="Renewals" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Policy Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Policy Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={policyTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {policyTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Agent Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agentPerformance.map((agent, index) => (
                <div key={agent.agent} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{agent.agent}</p>
                      <p className="text-sm text-gray-600">{agent.policies} policies</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${agent.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">{agent.conversionRate}% conversion</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#3B82F6" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
