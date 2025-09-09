
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

export type AIAssistantMode = 'breakdown' | 'tips';

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
    type: string; // MIME type for local, or a marker for links
    size: number; // in bytes
    sourceType: 'local' | 'link';
    dataUrl?: string; // base64 for local files
    url?: string; // URL for link files
}

export interface TimerSettings {
    pomodoro: number;
    shortBreak: number;
    longBreak: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  estimatedTime: number; // in minutes
  subtasks?: Subtask[];
  flashcards?: Flashcard[];
  day?: number; // For AI-generated sprint tasks
  dueDate?: string; // YYYY-MM-DD format
}

export interface Project {
  id: string;
  name: string;
  tasks: Task[];
  brainDumpNotes: string;
  timerSettings: TimerSettings;
  pomodoros: number;
  files: ProjectFile[];
}
