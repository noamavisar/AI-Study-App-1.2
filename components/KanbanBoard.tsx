import React from 'react';
import { Task, TaskStatus, AIAssistantMode, Flashcard, Priority } from '../types';
import KanbanColumn from './KanbanColumn';
import { TASK_STATUSES } from '../constants';

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSubtask: (taskId: string, subtaskText: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onUpdateTaskTime: (taskId: string, newTime: number) => void;
  onUpdateTaskPriority: (taskId: string, newPriority: Priority) => void;
  onUpdateTaskDueDate: (taskId: string, newDueDate: string) => void;
  onOpenAIAssistant: (mode: AIAssistantMode, task: Task) => void;
  onOpenFlashcardTask: (flashcards: Flashcard[]) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = (props) => {
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: TaskStatus) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");
        const sourceStatus = e.dataTransfer.getData("sourceStatus");
        if (taskId && sourceStatus !== newStatus) {
            props.onUpdateTaskStatus(taskId, newStatus);
        }
        e.currentTarget.classList.remove('border-jam-blue', 'dark:border-pink-500', 'bg-slate-100', 'dark:bg-slate-900/50');
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.add('border-jam-blue', 'dark:border-pink-500', 'bg-slate-100', 'dark:bg-slate-900/50');
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('border-jam-blue', 'dark:border-pink-500', 'bg-slate-100', 'dark:bg-slate-900/50');
    };

    const { tasks, onUpdateTaskStatus, ...cardProps } = props;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {TASK_STATUSES.map(status => (
        <div 
            key={status} 
            onDrop={(e) => handleDrop(e, status)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className="border-2 border-transparent rounded-xl transition-colors duration-300"
        >
            <KanbanColumn
              status={status}
              tasks={tasks.filter(task => task.status === status)}
              {...cardProps}
            />
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;