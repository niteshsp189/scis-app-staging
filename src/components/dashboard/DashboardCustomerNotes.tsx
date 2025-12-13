
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Star } from "lucide-react";
import { DashboardCustomerNote } from "@/services/dashboardService";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface DashboardCustomerNotesProps {
  customerNotes?: DashboardCustomerNote[];
  loading?: boolean;
}

export const DashboardCustomerNotes = ({ customerNotes, loading }: DashboardCustomerNotesProps) => {
  if (loading) {
    return (
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-900">
            <FileText className="h-5 w-5 text-indigo-600" />
            Important Customer Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-500">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!customerNotes || customerNotes.length === 0) {
    return (
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-900">
            <FileText className="h-5 w-5 text-indigo-600" />
            Important Customer Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No important customer notes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="professional-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-slate-900">
          <FileText className="h-5 w-5 text-indigo-600" />
          Important Customer Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {customerNotes.map((note) => (
            <div 
              key={note.id} 
              className={`flex items-start gap-4 p-4 rounded-lg border-l-4 ${
                note.priority === 'high' ? 'bg-red-50 border-red-500' :
                note.priority === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                'bg-indigo-50 border-indigo-500'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm text-slate-900">{note.customer_name}</h4>
                  {note.is_important && (
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  )}
                  <Badge 
                    variant={note.priority === 'high' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {note.priority}
                  </Badge>
                </div>
                <p className="text-sm text-slate-700 mt-1 mb-2">{note.note}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Category: {note.category}</span>
                  <span>By: {note.created_by}</span>
                  <span>{formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
