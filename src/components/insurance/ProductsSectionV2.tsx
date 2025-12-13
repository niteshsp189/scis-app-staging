import { useState } from "react";
import { Package, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AddInsuranceProductDialog } from "@/components/dialogs/AddInsuranceProductDialog";
import { InsuranceProductCard } from "./InsuranceProductCard";
import { Company, PlanType } from "@/types/insurance";
import { useIsMobile } from "@/hooks/use-mobile";

// Extended type for display purposes
interface DisplayProduct extends InsuranceProduct {
  planTypeName: string;
  companyName: string;
  status: string;
  category: string;
}

interface ProductsSectionProps {
  selectedCompany: Company | null;
  products: DisplayProduct[];
  onAddProduct: (product: any) => void;
  onEditProduct: (id: number) => void;
  onDeleteProduct: (id: number) => void;
  planTypes: PlanType[];
}

export function ProductsSection({ 
  selectedCompany, 
  products, 
  onAddProduct, 
  onEditProduct, 
  onDeleteProduct,
  planTypes
}: ProductsSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();

  if (!selectedCompany) {
    return (
      <Card className="professional-card">
        <CardContent className={`text-center ${isMobile ? 'py-12' : 'py-16'}`}>
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-slate-900 mb-2`}>Select a Company</h3>
          <p className={`text-slate-600 max-w-md mx-auto ${isMobile ? 'text-sm' : ''}`}>
            Choose a partner company from the sidebar to view and manage their insurance products.
          </p>
        </CardContent>
      </Card>
    );
  }

  const companyProducts = selectedCompany 
    ? products.filter(p => p.companyId === selectedCompany.id)
    : [];
    
  const filteredProducts = companyProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.planTypeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card className="professional-card">
        <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
          <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-row items-center justify-between gap-4'}`}>
            <div className="flex items-center gap-3">
              <Package className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-slate-600`} />
              <div>
                <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-slate-900`}>
                  {selectedCompany.name}
                </h3>
                <p className="text-slate-600 text-sm">
                  {companyProducts.length} products • {filteredProducts.length} filtered
                </p>
              </div>
            </div>
            
            <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center gap-3'}`}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 ${isMobile ? 'w-full' : 'w-64'}`}
                />
              </div>
              <AddInsuranceProductDialog 
                onAddProduct={onAddProduct} 
                companyId={selectedCompany.id}
                planTypes={planTypes}
              />
            </div>
          </div>
        </div>
      </Card>

      {filteredProducts.length > 0 ? (
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 lg:grid-cols-2 gap-6'}`}>
          {filteredProducts.map((product) => (
            <InsuranceProductCard
              key={product.id}
              product={product}
              onEdit={onEditProduct}
              onDelete={onDeleteProduct}
            />
          ))}
        </div>
      ) : (
        <Card className="professional-card">
          <CardContent className={`text-center ${isMobile ? 'py-12' : 'py-16'}`}>
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-slate-900 mb-2`}>
              {searchTerm ? "No products found" : "No products yet"}
            </h3>
            <p className={`text-slate-600 mb-6 max-w-md mx-auto ${isMobile ? 'text-sm' : ''}`}>
              {searchTerm 
                ? `No products match "${searchTerm}" for ${selectedCompany.name}.`
                : `Create your first insurance product for ${selectedCompany.name} to get started.`
              }
            </p>
            {!searchTerm && (
              <AddInsuranceProductDialog 
                onAddProduct={onAddProduct} 
                companyId={selectedCompany.id}
                planTypes={planTypes}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
