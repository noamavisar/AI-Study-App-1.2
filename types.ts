// Fix: Define enums directly in this file to break the circular dependency with constants.ts.
// The enums were implicitly defined by their usage in constants.ts but were not declared anywhere.
export enum TaskStatus {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Done = 'Done',
}

export enum Priority {
  UrgentImportant = 'Urgent & Important',
  ImportantNotUrgent = 'Important, Not Urgent',
  UrgentNotImportant = 'Urgent, Not Important',
  NotUrgentNotImportant = 'Not Urgent, Not Important',
}

export enum ResourceType {
  LearningMaterial = 'Learning Material',
  CourseExercises = 'Course Exercises',
  OldTest = 'Old Test',
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  type: string;
  content: string; // Data URL
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  estimatedTime: number; // in minutes
  dueDate?: string; // e.g., '2024-12-31'
  subtasks?: Subtask[];
  flashcards?: Flashcard[];
  day?: number; // for study sprints
}

export interface LearningResource {
    id: string;
    file: File;
    type: ResourceType;
}

export interface TimerSettings {
    pomodoro: number;
    shortBreak: number;
    longBreak: number;
}

export interface Project {
  id: string;
  name: string;
  tasks: Task[];
  timerSettings: TimerSettings;
  pomodoros: number;
  brainDump: string;
  files: ProjectFile[];
}

export type AIAssistantMode = 'breakdown' | 'tips' | 'first-step';
