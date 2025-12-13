
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User } from "lucide-react";
import { TeamMember, Task } from '../../types/project';
import { getStatusColor } from '../../utils/projectUtils';

interface TeamMemberCardProps {
  member: TeamMember;
  tasks: Task[];
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member, tasks }) => {
  const memberTasks = tasks.filter(task => task.assignee === member.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {member.name}
        </CardTitle>
        <CardDescription>{member.role}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Workload</span>
            <span>{member.currentLoad}h / {member.capacity}h</span>
          </div>
          <Progress value={(member.currentLoad / member.capacity) * 100} />
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Assigned Tasks:</h4>
          {memberTasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
              <span>{task.id}</span>
              <Badge className={getStatusColor(task.status)}>
                {task.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamMemberCard;
