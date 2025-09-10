import React from 'react';
import { Task, TaskStatus, AIAssistantMode, Flashcard, Priority, FlashcardDeck } from '../types';
import TaskCard from './TaskCard';
import { STATUS_COLORS } from '../constants';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onDeleteTask: (taskId: string) => void;
  onAddSubtask: (taskId: string, subtaskText: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onUpdateTaskTime: (taskId: string, newTime: number) => void;
  onUpdateTaskPriority: (taskId: string, newPriority: Priority) => void;
  onUpdateTaskDueDate: (taskId: string, newDueDate: string) => void;
  onOpenAIAssistant: (mode: AIAssistantMode, task: Task) => void;
  // FIX: Changed prop type from Flashcard[] to FlashcardDeck to match the handler in App.tsx.
  onOpenFlashcardTask: (deck: FlashcardDeck) => void;
}

// Helper to determine if a date is in the future (and not today)
const isUpcomingDate = (dueDateString?: string): boolean => {
    if (!dueDateString) return false;
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const parts = dueDateString.split('-').map(p => parseInt(p, 10));
        const dueDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        return dueDate > today;
    } catch {
        return false;
    }
};

// A palette of distinct Tailwind CSS border colors for grouping tasks.
// Excludes red and green which are used for overdue and today.
const SHARED_DATE_COLORS = [
  'border-t-blue-500',
  'border-t-purple-500',
  'border-t-indigo-500',
  'border-t-pink-500',
  'border-t-teal-500',
  'border-t-cyan-500',
  'border-t-amber-500',
];

const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, tasks, ...props }) => {
  const statusConfig = STATUS_COLORS[status];

  // Create a map of upcoming due dates to unique colors for grouping.
  const upcomingDueDates = tasks
    .filter(task => isUpcomingDate(task.dueDate))
    .map(task => task.dueDate!);

  const dateCounts = upcomingDueDates.reduce((acc, date) => {
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sharedDates = Object.keys(dateCounts).filter(date => dateCounts[date] > 1);

  const dateColorMap = new Map<string, string>();
  sharedDates.forEach((date, index) => {
    dateColorMap.set(date, SHARED_DATE_COLORS[index % SHARED_DATE_COLORS.length]);
  });

  const sortedTasks = [...tasks].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));

  return (
    <div className={`rounded-lg p-4 ${statusConfig.bg} h-full`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`font-bold text-lg ${statusConfig.text}`}>{status}</h2>
        <span className={`px-2 py-1 text-sm font-semibold rounded-full bg-white/50 dark:bg-slate-900/50 ${statusConfig.text}`}>
          {tasks.length}
        </span>
      </div>
      <div className="space-y-4">
        {sortedTasks.map(task => (
            <TaskCard 
              key={task.id}
              task={task}
              sharedDateColor={task.dueDate ? dateColorMap.get(task.dueDate) : undefined}
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