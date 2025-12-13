
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Target, Phone, Mail, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

export const DashboardLeadActions = () => {
  const navigate = useNavigate();

  const handleProspectAction = (action: string) => {
    switch (action) {
      case 'view-prospects':
        navigate('/prospects');
        break;
      case 'add-prospect':
        navigate('/prospects');
        toast({
          title: "Add New Prospect",
          description: "Redirecting to prospects page to add a new prospect.",
        });
        break;
      case 'prospect-assignments':
        navigate('/prospects');
        toast({
          title: "Prospect Assignments",
          description: "View and manage prospect assignments.",
        });
        break;
      case 'follow-up-prospects':
        toast({
          title: "Follow-up Prospects",
          description: "View prospects requiring follow-up action.",
        });
        break;
      case 'prospect-reports':
        navigate('/reports');
        toast({
          title: "Prospect Reports",
          description: "View detailed prospect performance reports.",
        });
        break;
      default:
        break;
    }
  };

  return (
    <Card className="professional-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-slate-900">
          <Users className="h-5 w-5 text-blue-600" />
          Prospect Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-3 border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
            onClick={() => handleProspectAction('view-prospects')}
          >
            <Users className="h-5 w-5 text-slate-600" />
            <span className="font-medium text-sm">View All Prospects</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-20 flex-col gap-3 border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200"
            onClick={() => handleProspectAction('add-prospect')}
          >
            <UserPlus className="h-5 w-5 text-slate-600" />
            <span className="font-medium text-sm">Add New Prospect</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-20 flex-col gap-3 border-2 border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
            onClick={() => handleProspectAction('prospect-assignments')}
          >
            <Target className="h-5 w-5 text-slate-600" />
            <span className="font-medium text-sm">Prospect Assignments</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-20 flex-col gap-3 border-2 border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
            onClick={() => handleProspectAction('follow-up-prospects')}
          >
            <Phone className="h-5 w-5 text-slate-600" />
            <span className="font-medium text-sm">Follow-up Prospects</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-20 flex-col gap-3 border-2 border-slate-200 hover:border-pink-300 hover:bg-pink-50 transition-all duration-200"
            onClick={() => handleProspectAction('prospect-reports')}
          >
            <FileText className="h-5 w-5 text-slate-600" />
            <span className="font-medium text-sm">Prospect Reports</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
