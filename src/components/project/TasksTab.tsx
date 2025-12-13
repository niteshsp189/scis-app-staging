
import React from 'react';
import { Button } from "@/components/ui/button";
import { Task, TeamMember } from '../../types/project';
import TaskCard from './TaskCard';

interface TasksTabProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  selectedPhase: string;
  phases: string[];
  setSelectedPhase: (phase: string) => void;
}

const TasksTab: React.FC<TasksTabProps> = ({ 
  tasks, 
  teamMembers, 
  selectedPhase, 
  phases, 
  setSelectedPhase 
}) => {
  const filteredTasks = selectedPhase === 'all' ? tasks : tasks.filter(task => task.phase === selectedPhase);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedPhase === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPhase('all')}
        >
          All Phases
        </Button>
        {phases.map((phase) => (
          <Button
            key={phase}
            variant={selectedPhase === phase ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPhase(phase)}
          >
            {phase.split(':')[0]}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredTasks.map((task) => (
          <TaskCard key={task.id} task={task} teamMembers={teamMembers} />
        ))}
      </div>
    </div>
  );
};

export default TasksTab;
