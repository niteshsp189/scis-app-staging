
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, User, Target } from "lucide-react";
import { Task, TeamMember } from '../../types/project';
import { getStatusIcon, getStatusColor, getPriorityColor, calculateProgress } from '../../utils/projectUtils';

interface TaskCardProps {
  task: Task;
  teamMembers: TeamMember[];
}

const TaskCard: React.FC<TaskCardProps> = ({ task, teamMembers }) => {
  const StatusIcon = getStatusIcon(task.status);

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <StatusIcon className="h-4 w-4 text-gray-500" />
              <CardTitle className="text-lg">{task.id}: {task.name}</CardTitle>
            </div>
            <CardDescription>{task.description}</CardDescription>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge className={getStatusColor(task.status)}>
              {task.status.replace('-', ' ')}
            </Badge>
            <Badge className={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span>{teamMembers.find(tm => tm.id === task.assignee)?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>{task.startDate} - {task.endDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>{task.actualHours || 0}h / {task.estimatedHours}h</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-gray-500" />
            <span>{Math.round(calculateProgress(task))}% Complete</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-600">
              {task.subtasks.filter(st => st.status === 'completed').length} / {task.subtasks.length} subtasks
            </span>
          </div>
          <Progress value={calculateProgress(task)} />
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Subtasks:</h4>
          <div className="grid gap-2">
            {task.subtasks.map((subtask) => {
              const SubtaskIcon = getStatusIcon(subtask.status);
              return (
                <div key={subtask.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <SubtaskIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{subtask.name}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {subtask.actualHours || 0}h / {subtask.estimatedHours}h
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {task.dependencies && (
          <div className="text-sm">
            <span className="font-medium">Dependencies: </span>
            <span className="text-gray-600">{task.dependencies.join(', ')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskCard;
