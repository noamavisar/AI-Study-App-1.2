// This file defines the core data structures used throughout the application.

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

// This is for in-memory representation while user is uploading files for AI processing.
// These are not persisted in local storage.
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
  // Note: We don't persist learning resources with File objects across sessions.
  // This app is designed for session-based AI interactions.
}

export type AIAssistantMode = 'breakdown' | 'tips' | 'first-step';