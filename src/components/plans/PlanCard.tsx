
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Layers } from "lucide-react";
import { Plan } from "@/types/planType";

interface PlanCardProps {
  plan: Plan;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function PlanCard({ plan, onEdit, onDelete }: PlanCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Inactive":
        return "bg-red-100 text-red-800";
      case "Draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            <CardDescription className="text-sm">{plan.description}</CardDescription>
          </div>
          <Badge className={getStatusColor(plan.status)}>
            {plan.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-gray-500" />
          <Badge variant="outline">{plan.planTypeName}</Badge>
        </div>

        <div className="space-y-2 text-sm">
          <h4 className="font-medium">Plan Details:</h4>
          {Object.entries(plan.fieldValues).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
              <span className="font-medium">
                {typeof value === 'number' && key.includes('premium') ? `$${value}` : value}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-xs text-gray-500">
            Updated: {new Date(plan.updatedAt).toLocaleDateString()}
          </span>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onEdit(plan.id)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDelete(plan.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
