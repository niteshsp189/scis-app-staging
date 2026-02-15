
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Settings, Shield, Calendar, DollarSign } from "lucide-react";
import { InsuranceProduct } from "@/services/insuranceService";
import { useIsMobile } from "@/hooks/use-mobile";

interface InsuranceProductCardProps {
  product: InsuranceProduct;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function InsuranceProductCard({ product, onEdit, onDelete }: InsuranceProductCardProps) {
  const isMobile = useIsMobile();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-50 text-green-700 border-green-200";
      case "Inactive":
        return "bg-red-50 text-red-700 border-red-200";
      case "Draft":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "medicare":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "auto":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "home":
        return "bg-green-50 text-green-700 border-green-200";
      case "life":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "health":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <Card className="professional-card hover:shadow-lg transition-shadow duration-200">
      <CardHeader className={`${isMobile ? 'pb-3' : 'pb-4'}`}>
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-start justify-between'}`}>
          <div className="flex-1">
            <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} text-slate-900 mb-1`}>
              {product.name}
            </CardTitle>
            <CardDescription className={`text-slate-600 ${isMobile ? 'text-sm' : ''}`}>
              {product.description}
            </CardDescription>
          </div>
          <div className={`flex ${isMobile ? 'flex-row gap-2' : 'flex-col gap-2'} ${isMobile ? '' : 'ml-4'}`}>
            <Badge className={`text-xs font-medium border ${getStatusColor(product.status)}`}>
              {product.status}
            </Badge>
            <Badge className={`text-xs font-medium border ${getCategoryColor(product.category)}`}>
              {product.category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Settings className="h-4 w-4 text-slate-600" />
            <div>
              <p className="text-xs text-slate-500 font-medium">Fields</p>
              <p className="text-sm font-semibold text-slate-900">{product.fields.length}</p>
            </div>
          </div>
          
          {product.eligibilityRules && product.eligibilityRules.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Shield className="h-4 w-4 text-slate-600" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Rules</p>
                <p className="text-sm font-semibold text-slate-900">{product.eligibilityRules.length}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-slate-600" />
            Key Values
          </h4>
          <div className="space-y-2">
            {Object.entries(product.fieldValues).slice(0, isMobile ? 2 : 3).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-md">
                <span className={`text-slate-600 capitalize font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
                <span className={`font-semibold text-slate-900 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {typeof value === 'number' && key.toLowerCase().includes('premium') 
                    ? `$${value.toLocaleString()}` 
                    : value?.toString() || 'N/A'
                  }
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'} pt-4 border-t border-slate-200`}>
          <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-xs'} text-slate-500`}>
            <Calendar className="h-3 w-3" />
            <span>Updated {new Date(product.updatedAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}</span>
          </div>
          
          <div className={`flex gap-2 ${isMobile ? 'justify-center' : ''}`}>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onEdit(product.id)}
              className={isMobile ? 'flex-1' : ''}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onDelete(product.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
