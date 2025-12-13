
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneIncoming, PhoneOutgoing, Mail, Calendar, User, Search, Clock } from "lucide-react";
import { LogActivityDialog } from "@/components/dialogs/LogActivityDialog";

const Activities = () => {
  const [activities, setActivities] = useState([
    {
      id: 1,
      type: "Incoming Call",
      customer: "Sarah Johnson",
      description: "Discussed auto policy renewal options",
      date: "2024-01-15",
      time: "10:30 AM",
      followUpDate: "2024-01-22"
    },
    {
      id: 2,
      type: "Email",
      customer: "Mary Johnson",
      description: "Sent life insurance quote and benefits overview",
      date: "2024-01-14",
      time: "2:15 PM",
      followUpDate: ""
    },
    {
      id: 3,
      type: "Meeting",
      customer: "Robert Davis",
      description: "In-person consultation for business insurance",
      date: "2024-01-13",
      time: "9:00 AM",
      followUpDate: "2024-01-20"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "All" || activity.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const handleLogActivity = (newActivity: any) => {
    setActivities(prev => [newActivity, ...prev]);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "Incoming Call":
        return <PhoneIncoming className="h-4 w-4 text-blue-600" />;
      case "Outgoing Call":
        return <PhoneOutgoing className="h-4 w-4 text-green-600" />;
      case "Email":
        return <Mail className="h-4 w-4 text-purple-600" />;
      case "Meeting":
        return <Calendar className="h-4 w-4 text-orange-600" />;
      case "Follow-up":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "Incoming Call":
        return "bg-blue-100 text-blue-800";
      case "Outgoing Call":
        return "bg-green-100 text-green-800";
      case "Email":
        return "bg-purple-100 text-purple-800";
      case "Meeting":
        return "bg-orange-100 text-orange-800";
      case "Follow-up":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activities</h1>
          <p className="text-gray-600">Track customer interactions and follow-ups</p>
        </div>
        <LogActivityDialog onLogActivity={handleLogActivity} />
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Incoming Call">Incoming Phone Call</SelectItem>
                <SelectItem value="Outgoing Call">Outgoing Phone Call</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="Meeting">Meeting</SelectItem>
                <SelectItem value="Follow-up">Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="p-2 bg-gray-100 rounded-lg">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{activity.customer}</h3>
                    <Badge className={getActivityColor(activity.type)}>
                      {activity.type}
                    </Badge>
                  </div>
                  <p className="text-gray-700 mb-2">{activity.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{activity.date} at {activity.time}</span>
                    {activity.followUpDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Follow-up: {activity.followUpDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {filteredActivities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No activities found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Activities;
