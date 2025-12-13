import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  Building2,
  Package,
  Settings,
  Tag,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Shield,
  Clock,
} from "lucide-react";
import { SimplifiedPlanTypesManagement } from "./SimplifiedPlanTypesManagement";
import { SimplifiedPlansManagement } from "./SimplifiedPlansManagement";
import { SimplifiedCompaniesManagement } from "./SimplifiedCompaniesManagement";
import {
  InsuranceCompanyService,
  InsuranceCompany,
} from "@/services/insuranceCompany.service";
import { PlanTypeService, PlanService } from "@/services/planService";

interface InsuranceConfigurationProps {
  className?: string;
}

interface DashboardStats {
  totalCompanies: number;
  activeCompanies: number;
  totalPlanTypes: number;
  activePlanTypes: number;
  totalProducts: number;
  activeProducts: number;
  totalPremiumValue: number;
  averagePremium: number;
}

export function InsuranceConfiguration({
  className,
}: InsuranceConfigurationProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [selectedCompany, setSelectedCompany] =
    useState<InsuranceCompany | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    activeCompanies: 0,
    totalPlanTypes: 0,
    activePlanTypes: 0,
    totalProducts: 0,
    activeProducts: 0,
    totalPremiumValue: 0,
    averagePremium: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await loadCompanies();
      await loadStatistics();
    } catch (error) {
      console.error("Failed to load initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = useCallback(async () => {
    try {
      const response = await InsuranceCompanyService.getAll();
      setCompanies(response.data || []);
    } catch (error) {
      console.error("Failed to load companies:", error);
    }
  }, []);

  const loadStatistics = async () => {
    try {
      const [companiesResponse, planTypeStats, productStats] =
        await Promise.all([
          InsuranceCompanyService.getAll(),
          PlanTypeService.getStatistics(),
          PlanService.getStatistics(),
        ]);

      const companiesData = companiesResponse.data || [];

      // Safely parse numeric values with fallbacks
      const totalPremiumValue =
        parseFloat(productStats.total_premium_value?.toString() || "0") || 0;
      const averagePremium =
        parseFloat(productStats.average_premium?.toString() || "0") || 0;

      setStats({
        totalCompanies: companiesData.length,
        activeCompanies: companiesData.filter((c) => c.status === "Active")
          .length,
        totalPlanTypes: planTypeStats.total_plan_types || 0,
        activePlanTypes: planTypeStats.active_plan_types || 0,
        totalProducts: productStats.total_products || 0,
        activeProducts: productStats.active_products || 0,
        totalPremiumValue: isNaN(totalPremiumValue) ? 0 : totalPremiumValue,
        averagePremium: isNaN(averagePremium) ? 0 : averagePremium,
      });
    } catch (error) {
      console.error("Failed to load statistics:", error);
      // Set default stats on error
      setStats({
        totalCompanies: 0,
        activeCompanies: 0,
        totalPlanTypes: 0,
        activePlanTypes: 0,
        totalProducts: 0,
        activeProducts: 0,
        totalPremiumValue: 0,
        averagePremium: 0,
      });
    }
  };

  const handleCompanySelect = (company: InsuranceCompany | null) => {
    setSelectedCompany(company);
    if (company && activeTab === "overview") {
      setActiveTab("products");
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Insurance Companies
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCompanies} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Plan Categories
            </CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlanTypes}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activePlanTypes} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Insurance Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProducts} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Premium Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.totalPremiumValue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: ${(Number(stats.averagePremium) || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => setActiveTab("companies")}
            >
              <Building2 className="h-6 w-6" />
              <span>Manage Companies</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => setActiveTab("products")}
            >
              <Package className="h-6 w-6" />
              <span>Manage Products</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => window.location.href = '/settings?tab=plan-types'}
            >
              <Tag className="h-6 w-6" />
              <span>Manage Plan Types</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Companies */}
      <Card>
        <CardHeader>
          <CardTitle>Insurance Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {companies.slice(0, 5).map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleCompanySelect(company)}
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">{company.name}</div>
                    <div className="text-sm text-gray-500">
                      {company.industry}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      company.status === "Active" ? "default" : "secondary"
                    }
                    className={
                      company.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : ""
                    }
                  >
                    {company.status}
                  </Badge>
                  <Badge variant="outline">
                    {company.productsCount || 0} products
                  </Badge>
                </div>
              </div>
            ))}
            {companies.length === 0 && (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No insurance companies found</p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => setActiveTab("companies")}
                >
                  Add First Company
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">
            Loading insurance configuration...
          </p>
        </div>
      </div>
    );
  }

  try {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            <p>Loading insurance configuration...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Insurance Configuration
            </h1>
            <p className="text-muted-foreground">
              Manage insurance companies, plan categories, and products
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{stats.totalCompanies} Companies</Badge>
            <Badge variant="outline">{stats.totalPlanTypes} Categories</Badge>
            <Badge variant="outline">{stats.totalProducts} Products</Badge>
          </div>
        </div>

        {/* Selected Company Banner */}
        {selectedCompany && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">
                      {selectedCompany.name}
                    </h3>
                    <p className="text-blue-700">
                      {selectedCompany.industry} •{" "}
                      {selectedCompany.productsCount || 0} products
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCompany(null)}
                >
                  Clear Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Companies
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">{renderOverviewTab()}</TabsContent>

          <TabsContent value="companies">
            <SimplifiedCompaniesManagement
              onCompanySelect={handleCompanySelect}
              onCompaniesChange={loadCompanies}
            />
          </TabsContent>

          <TabsContent value="products">
            <SimplifiedPlansManagement
              companies={companies}
              selectedCompany={selectedCompany}
              onCompanySelect={handleCompanySelect}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error("Error rendering InsuranceConfiguration:", error);
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-2">
          Error Loading Insurance Configuration
        </h2>
        <p className="text-gray-600 mb-4">
          There was an error loading the insurance configuration page.
        </p>
        <pre className="text-left bg-gray-100 p-4 rounded text-sm overflow-auto">
          {error?.toString() || "Unknown error"}
        </pre>
      </div>
    );
  }
}

export default InsuranceConfiguration;
