
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

export interface LearningResource {
  id: string;
  file: File;
  type: ResourceType;
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  estimatedTime: number; // in minutes
  day?: number; // Optional day for study plan
  subtasks?: Subtask[];
}

export interface Flashcard {
  question: string;
  answer: string;
}

export type AIAssistantMode = 'breakdown' | 'tips';

export type Theme = 'light' | 'dark';