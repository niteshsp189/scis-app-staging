
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, PhoneIncoming, PhoneOutgoing, Mail, Calendar, FileText } from "lucide-react";

const recentActivities = [
  {
    id: 1,
    type: "incoming-call",
    title: "Incoming call from John Smith about Auto Policy",
    time: "2 hours ago",
    icon: PhoneIncoming,
  },
  {
    id: 2,
    type: "email",
    title: "Sent quote to Mary Johnson",
    time: "4 hours ago",
    icon: Mail,
  },
  {
    id: 3,
    type: "meeting",
    title: "Meeting with Robert Davis",
    time: "Yesterday",
    icon: Calendar,
  },
  {
    id: 4,
    type: "policy",
    title: "Policy renewal for Sarah Wilson",
    time: "2 days ago",
    icon: FileText,
  },
];

export const DashboardActivities = () => {
  return (
    <Card className="professional-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-slate-900">
          <Activity className="h-5 w-5 text-emerald-600" />
          Recent Activities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors duration-200">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
                <activity.icon className="h-4 w-4 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900 text-sm">{activity.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
