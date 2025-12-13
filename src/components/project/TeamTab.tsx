
import React from 'react';
import { TeamMember, Task } from '../../types/project';
import TeamMemberCard from './TeamMemberCard';

interface TeamTabProps {
  teamMembers: TeamMember[];
  tasks: Task[];
}

const TeamTab: React.FC<TeamTabProps> = ({ teamMembers, tasks }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {teamMembers.map((member) => (
        <TeamMemberCard key={member.id} member={member} tasks={tasks} />
      ))}
    </div>
  );
};

export default TeamTab;
