import { useState } from "react";
import { Package, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InsuranceProductCard } from "./InsuranceProductCard";
import { Company, InsuranceProduct } from "@/services/insuranceService";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductsSectionProps {
  selectedCompany: Company | null;
  products: InsuranceProduct[];
  onAddProduct: (
    product: Omit<InsuranceProduct, "id" | "createdAt" | "updatedAt">,
  ) => void;
  onEditProduct: (id: number) => void;
  onDeleteProduct: (id: number) => void;
}

export function ProductsSection({
  selectedCompany,
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
}: ProductsSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();

  if (!selectedCompany) {
    return (
      <Card className="professional-card">
        <CardContent className="py-20 px-8">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-2xl font-semibold text-slate-900 mb-3">
            Select a Company
          </h3>
          <p className="text-slate-600 max-w-lg mx-auto text-lg">
            Choose a partner company from the sidebar to view and manage their
            insurance products.
          </p>
        </CardContent>
      </Card>
    );
  }

  const companyProducts = products.filter(
    (p) => p.companyId === selectedCompany.id,
  );
  const filteredProducts = companyProducts
    .filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      // Sort by creation date/ID in descending order (newest first)
      const aValue = a.createdAt ? new Date(a.createdAt).getTime() : a.id;
      const bValue = b.createdAt ? new Date(b.createdAt).getTime() : b.id;
      return bValue - aValue; // Descending order
    });

  return (
    <div className="space-y-6">
      <Card className="professional-card">
        <div className="px-4 py-6" style={{ width: "fit-content" }}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Package className="h-8 w-8 text-slate-600" />
              <div>
                <h3 className="text-2xl font-semibold text-slate-900 mb-1">
                  {selectedCompany.name}66
                </h3>
                <p className="text-slate-600 text-base">
                  {companyProducts.length} products •{" "}
                  {filteredProducts.filter((p) => p.status === "Active").length}{" "}
                  active
                </p>
              </div>
            </div>

            <div className="relative flex-shrink-0">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 w-full lg:w-80 h-12 text-base"
              />
            </div>
          </div>
        </div>
      </Card>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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
          <CardContent className="py-20 px-8">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-3">
              {searchTerm ? "No products found" : "No products yet"}
            </h3>
            <p className="text-slate-600 mb-8 max-w-lg mx-auto text-lg">
              {searchTerm
                ? `No products match "${searchTerm}" for ${selectedCompany.name}.`
                : `No products found for ${selectedCompany.name}.`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
