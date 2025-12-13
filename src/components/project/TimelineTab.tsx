
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Task } from '../../types/project';
import { getStatusIcon } from '../../utils/projectUtils';

interface TimelineTabProps {
  phases: string[];
  tasks: Task[];
}

const TimelineTab: React.FC<TimelineTabProps> = ({ phases, tasks }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Timeline - 10 Week Development Plan</CardTitle>
        <CardDescription>Phase-by-phase breakdown of the insurance CRM development</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {phases.map((phase, index) => {
            const StatusIcon = getStatusIcon('not-started');
            return (
              <div key={phase} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-24 text-sm font-medium text-gray-600">
                  Week {index + 1}{index < 2 ? '-' + (index + 2) : ''}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{phase}</h3>
                  <div className="mt-2 space-y-1">
                    {tasks.filter(task => task.phase === phase).map((task) => {
                      const TaskStatusIcon = getStatusIcon(task.status);
                      return (
                        <div key={task.id} className="flex items-center gap-2 text-sm text-gray-600">
                          <TaskStatusIcon className="h-4 w-4" />
                          <span>{task.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimelineTab;
