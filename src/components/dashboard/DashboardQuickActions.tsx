
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Target, Calendar, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

export const DashboardQuickActions = () => {
  const navigate = useNavigate();

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'schedule-call':
        navigate('/appointments');
        toast({
          title: "Schedule Call",
          description: "Redirecting to appointments page.",
        });
        break;
      case 'generate-quote':
        toast({
          title: "Generate Quote",
          description: "Quote generation feature will be available soon.",
        });
        break;
      default:
        break;
    }
  };

  return (
    <Card className="professional-card">
      <CardHeader>
        <CardTitle className="text-slate-900">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="h-24 flex-col gap-3 border-2 border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
            onClick={() => handleQuickAction('schedule-call')}
          >
            <Calendar className="h-6 w-6 text-slate-600" />
            <span className="font-medium">Schedule Call</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex-col gap-3 border-2 border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
            onClick={() => handleQuickAction('generate-quote')}
          >
            <FileText className="h-6 w-6 text-slate-600" />
            <span className="font-medium">Generate Quote</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
