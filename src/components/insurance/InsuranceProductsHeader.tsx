
import { Building2, Package, TrendingUp, Shield } from "lucide-react";
import { AddInsuranceProductDialog } from "@/components/dialogs/AddInsuranceProductDialog";
import { Company, InsuranceProduct } from "@/services/insuranceService";
import { useIsMobile } from "@/hooks/use-mobile";

interface InsuranceProductsHeaderProps {
  companies: Company[];
  products: InsuranceProduct[];
  onAddProduct: (product: Omit<InsuranceProduct, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function InsuranceProductsHeader({ 
  companies, 
  products, 
  onAddProduct 
}: InsuranceProductsHeaderProps) {
  const activeCompanies = companies.filter(c => c.status === "Active");
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === "Active").length;
  const isMobile = useIsMobile();

  return (
    <div className="professional-card">
      <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
        <div className="flex flex-col gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Shield className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-primary-foreground`} />
              </div>
              <div>
                <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-semibold text-slate-900`}>
                  Insurance Products
                </h1>
                <p className={`text-slate-600 mt-1 ${isMobile ? 'text-sm' : ''}`}>
                  Manage your insurance portfolio and product configurations
                </p>
              </div>
            </div>
            
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center gap-4'}`}>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md">
                <Building2 className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">{activeCompanies.length} Companies</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md">
                <Package className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">{activeProducts} Active Products</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md">
                <TrendingUp className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">{totalProducts} Total Products</span>
              </div>
            </div>
          </div>
          
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-row gap-3'} ${isMobile ? '' : 'justify-end'}`}>
            <AddInsuranceProductDialog onAddProduct={onAddProduct} />
          </div>
        </div>
      </div>
    </div>
  );
}
