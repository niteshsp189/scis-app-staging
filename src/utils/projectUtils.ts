
import { CheckCircle, Clock, AlertCircle, Circle } from "lucide-react";
import { Task } from '../types/project';

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return CheckCircle;
    case 'in-progress':
      return Clock;
    case 'blocked':
      return AlertCircle;
    default:
      return Circle;
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in-progress':
      return 'bg-blue-100 text-blue-800';
    case 'blocked':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const calculateProgress = (task: Task) => {
  const completedSubtasks = task.subtasks.filter(st => st.status === 'completed').length;
  return (completedSubtasks / task.subtasks.length) * 100;
};

export const calculateOverallProgress = (tasks: Task[]) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  return (completedTasks / totalTasks) * 100;
};
