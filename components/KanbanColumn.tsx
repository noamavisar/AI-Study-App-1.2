import React from 'react';
import { Task, TaskStatus, AIAssistantMode, Flashcard, Priority } from '../types';
import TaskCard from './TaskCard';
import { STATUS_COLORS } from '../constants';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onDeleteTask: (taskId: string) => void;
  onAddSubtask: (taskId: string, subtaskText: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onUpdateTaskTime: (taskId: string, newTime: number) => void;
  onUpdateTaskPriority: (taskId: string, newPriority: Priority) => void;
  onOpenAIAssistant: (mode: AIAssistantMode, task: Task) => void;
  onOpenFlashcardTask: (flashcards: Flashcard[]) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, tasks, ...props }) => {
  const statusConfig = STATUS_COLORS[status];

  return (
    <div className={`rounded-lg p-4 ${statusConfig.bg} h-full`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`font-bold text-lg ${statusConfig.text}`}>{status}</h2>
        <span className={`px-2 py-1 text-sm font-semibold rounded-full bg-white/50 dark:bg-slate-900/50 ${statusConfig.text}`}>
          {tasks.length}
        </span>
      </div>
      <div className="space-y-4">
        {tasks
          .sort((a, b) => (a.day || Infinity) - (b.day || Infinity)) // Sort by sprint day if it exists
          .map(task => (
            <TaskCard 
              key={task.id}
              task={task}
              {...props}
            />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg h-32 flex items-center justify-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">Drag tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;