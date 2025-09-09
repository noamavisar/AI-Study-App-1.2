import { TaskStatus, Priority, ResourceType } from './types';

export const TASK_STATUSES: TaskStatus[] = [
  TaskStatus.ToDo,
  TaskStatus.InProgress,
  TaskStatus.Done,
];

export const PRIORITIES: Priority[] = [
  Priority.UrgentImportant,
  Priority.ImportantNotUrgent,
  Priority.UrgentNotImportant,
  Priority.NotUrgentNotImportant,
];

export const RESOURCE_TYPES: ResourceType[] = [
  ResourceType.LearningMaterial,
  ResourceType.CourseExercises,
  ResourceType.OldTest,
];

export const PRIORITY_DESCRIPTIONS: { [key in Priority]: string } = {
    [Priority.UrgentImportant]: 'Crises, deadlines, problems. Do these first.',
    [Priority.ImportantNotUrgent]: 'Goals, planning, important preparation. Schedule time for these.',
    [Priority.UrgentNotImportant]: 'Interruptions, some requests. Minimize or handle quickly.',
    [Priority.NotUrgentNotImportant]: 'Trivia, distractions. Do these last, if at all.',
};

export const STATUS_COLORS: { [key in TaskStatus]: { bg: string; text: string; } } = {
  [TaskStatus.ToDo]:       { bg: 'bg-orange-100 dark:bg-red-900/20',       text: 'text-jam-dark dark:text-red-300' },
  [TaskStatus.InProgress]: { bg: 'bg-jam-green-light dark:bg-green-900/20',     text: 'text-jam-dark dark:text-green-300' },
  [TaskStatus.Done]:       { bg: 'bg-jam-blue-light dark:bg-blue-900/20',      text: 'text-jam-dark dark:text-blue-300' },
};

export const PRIORITY_COLORS: { [key in Priority]: { bg: string; text: string; tagBg: string; tagText: string; border: string; } } = {
  [Priority.UrgentImportant]:    { bg: 'bg-jam-orange dark:bg-red-900/50',   text: 'text-jam-dark dark:text-red-200',   tagBg: 'bg-black/10 dark:bg-white/10', tagText: 'text-black/80 dark:text-red-200', border: 'border-l-red-500' },
  [Priority.ImportantNotUrgent]: { bg: 'bg-jam-green dark:bg-green-900/50', text: 'text-jam-dark dark:text-green-200', tagBg: 'bg-black/10 dark:bg-white/10', tagText: 'text-black/80 dark:text-green-200', border: 'border-l-green-500' },
  [Priority.UrgentNotImportant]: { bg: 'bg-jam-yellow dark:bg-yellow-900/50', text: 'text-jam-dark dark:text-yellow-200', tagBg: 'bg-black/10 dark:bg-white/10', tagText: 'text-black/80 dark:text-yellow-200', border: 'border-l-yellow-500' },
  [Priority.NotUrgentNotImportant]:{ bg: 'bg-jam-blue dark:bg-blue-900/50',  text: 'text-jam-dark dark:text-blue-200',  tagBg: 'bg-black/10 dark:bg-white/10', tagText: 'text-black/80 dark:text-blue-200', border: 'border-l-blue-500' },
};