
import React, { useState } from 'react';
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { tasks, teamMembers, phases } from '../data/projectData';
import { calculateOverallProgress } from '../utils/projectUtils';
import TasksTab from './project/TasksTab';
import TeamTab from './project/TeamTab';
import TimelineTab from './project/TimelineTab';
import ReportsTab from './project/ReportsTab';

const ProjectTracker = () => {
  const [selectedPhase, setSelectedPhase] = useState('all');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Insurance CRM Project Tracker</h1>
          <p className="text-gray-600">Track development progress, team workload, and project milestones</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Overall Progress</p>
            <p className="text-2xl font-bold text-blue-600">{Math.round(calculateOverallProgress(tasks))}%</p>
          </div>
          <Progress value={calculateOverallProgress(tasks)} className="w-32" />
        </div>
      </div>

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <TasksTab 
            tasks={tasks}
            teamMembers={teamMembers}
            selectedPhase={selectedPhase}
            phases={phases}
            setSelectedPhase={setSelectedPhase}
          />
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <TeamTab teamMembers={teamMembers} tasks={tasks} />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <TimelineTab phases={phases} tasks={tasks} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportsTab tasks={tasks} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectTracker;
