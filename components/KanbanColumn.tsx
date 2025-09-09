
import React from 'react';
import { Task, TaskStatus, AIAssistantMode, Priority } from '../types';
import TaskCard from './TaskCard';
import { STATUS_COLORS } from '../constants';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onUpdateTaskPriority: (taskId: string, newPriority: Priority) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenAIAssistant: (mode: AIAssistantMode, task: Task) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, subtaskText: string) => void;
  onOpenFlashcardTask: (task: Task) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = (props) => {
  const { status, tasks, onUpdateTaskStatus, onUpdateTaskPriority, onDeleteTask, onOpenAIAssistant, onToggleSubtask, onAddSubtask, onOpenFlashcardTask } = props;
  const colors = STATUS_COLORS[status];

  return (
    <div className={`rounded-lg p-4 ${colors.bg}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`font-semibold text-lg ${colors.text}`}>{status}</h2>
        <span className={`text-sm font-bold ${colors.text} bg-black/5 dark:bg-black/20 rounded-full px-2 py-1`}>
          {tasks.length}
        </span>
      </div>
      <div className="space-y-4">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onUpdateTaskStatus={onUpdateTaskStatus}
              onUpdateTaskPriority={onUpdateTaskPriority}
              onDeleteTask={onDeleteTask}
              onOpenAIAssistant={onOpenAIAssistant}
              onToggleSubtask={onToggleSubtask}
              onAddSubtask={onAddSubtask}
              onOpenFlashcardTask={onOpenFlashcardTask}
            />
          ))
        ) : (
          <div className="text-center py-8 px-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
            <p className="text-slate-500 dark:text-slate-400">No tasks here yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;