
import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Company, InsuranceProduct } from "@/services/insuranceService";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CompaniesSidebarProps {
  companies: Company[];
  products: InsuranceProduct[];
  selectedCompany: Company | null;
  onSelectCompany: (company: Company) => void;
}

export function CompaniesSidebar({ 
  companies, 
  products, 
  selectedCompany, 
  onSelectCompany 
}: CompaniesSidebarProps) {
  const activeCompanies = companies.filter(c => c.status === "Active");
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Card className="professional-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-slate-600" />
            Partner Companies
            <Badge variant="secondary" className="ml-auto text-xs">
              {activeCompanies.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <ScrollArea className="h-32">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {activeCompanies.map((company) => {
                const companyProductCount = products.filter(p => p.companyId === company.id).length;
                const isSelected = selectedCompany?.id === company.id;
                
                return (
                  <div
                    key={company.id}
                    className={`flex-shrink-0 p-3 rounded-lg cursor-pointer transition-all duration-200 border min-w-[120px] ${
                      isSelected
                        ? "bg-primary/5 border-primary/20 shadow-sm"
                        : "bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    }`}
                    onClick={() => onSelectCompany(company)}
                  >
                    <div className="text-center">
                      <h4 className={`font-semibold text-xs ${isSelected ? 'text-primary' : 'text-slate-900'}`}>
                        {company.name}
                      </h4>
                      <p className={`text-xs mt-1 ${isSelected ? 'text-primary/70' : 'text-slate-600'}`}>
                        {companyProductCount} products
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="professional-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-lg">
          <Building2 className="h-5 w-5 text-slate-600" />
          Partner Companies
          <Badge variant="secondary" className="ml-auto">
            {activeCompanies.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4">
        {activeCompanies.map((company) => {
          const companyProductCount = products.filter(p => p.companyId === company.id).length;
          const isSelected = selectedCompany?.id === company.id;
          
          return (
            <div
              key={company.id}
              className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border ${
                isSelected
                  ? "bg-primary/5 border-primary/20 shadow-sm"
                  : "bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
              }`}
              onClick={() => onSelectCompany(company)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-slate-900'}`}>
                    {company.name}
                  </h4>
                  <p className={`text-xs mt-1 ${isSelected ? 'text-primary/70' : 'text-slate-600'}`}>
                    {company.industry}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-lg font-bold ${isSelected ? 'text-primary' : 'text-slate-900'}`}>
                    {companyProductCount}
                  </span>
                  <span className={`text-xs ${isSelected ? 'text-primary/70' : 'text-slate-500'}`}>
                    products
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
