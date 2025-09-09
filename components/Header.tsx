import React from 'react';
import { Project } from '../types';
import ProjectChooser from './ProjectChooser';

interface HeaderProps {
  activeProject: Project | null;
  projects: Project[];
  onSwitchProject: (projectId: string) => void;
  onOpenProjectManager: () => void;
  onAddTask: () => void;
  onOpenSprintGenerator: () => void;
  onOpenFlashcardGenerator: () => void;
  onOpenImportModal: () => void;
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  return (
    <header className="bg-jam-light-gray/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-jam-border dark:border-slate-800 sticky top-0 z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-jam-dark dark:text-slate-100">StudyJam</h1>
            {props.activeProject && (
              <ProjectChooser
                activeProject={props.activeProject}
                projects={props.projects}
                onSwitchProject={props.onSwitchProject}
                onOpenProjectManager={props.onOpenProjectManager}
              />
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={props.onOpenSprintGenerator}
              className="hidden md:flex items-center space-x-2 px-3 py-1.5 text-sm font-semibold text-jam-dark dark:text-slate-200 bg-white dark:bg-slate-800 rounded-lg border border-jam-border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Generate Study Sprint with AI"
            >
              <span role="img" aria-label="sprint">🚀</span>
              <span>AI Sprint</span>
            </button>
            <button
              onClick={props.onOpenFlashcardGenerator}
              className="hidden md:flex items-center space-x-2 px-3 py-1.5 text-sm font-semibold text-jam-dark dark:text-slate-200 bg-white dark:bg-slate-800 rounded-lg border border-jam-border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Generate Flashcards with AI"
            >
              <span role="img" aria-label="cards">🃏</span>
              <span>AI Flashcards</span>
            </button>
             <button
              onClick={props.onOpenImportModal}
              className="hidden md:flex items-center space-x-2 px-3 py-1.5 text-sm font-semibold text-jam-dark dark:text-slate-200 bg-white dark:bg-slate-800 rounded-lg border border-jam-border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Import from Google Sheets"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M3.25 4A2.25 2.25 0 0 0 1 6.25v7.5A2.25 2.25 0 0 0 3.25 16h7.5A2.25 2.25 0 0 0 13 13.75v-7.5A2.25 2.25 0 0 0 10.75 4h-7.5ZM2.5 6.25c0-.414.336-.75.75-.75h7.5c.414 0 .75.336.75.75v7.5c0 .414-.336.75-.75.75h-7.5a.75.75 0 0 1-.75-.75v-7.5Zm12-1.5A2.25 2.25 0 0 0 12.25 7v7.5a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 0 0-1.5h-2.25Z" /></svg>
                <span>Import</span>
            </button>
            <button onClick={props.onOpenSettings} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors" title="Settings">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M11.49 3.17a.75.75 0 0 1 1.02.63l.1 1.68a.75.75 0 0 0 1.14.65l1.58-.5a.75.75 0 0 1 .92.41l.8 1.38a.75.75 0 0 1-.36.98l-1.23.83a.75.75 0 0 0 0 1.28l1.23.83a.75.75 0 0 1 .36.98l-.8 1.38a.75.75 0 0 1-.92.41l-1.58-.5a.75.75 0 0 0-1.14.65l-.1 1.68a.75.75 0 0 1-1.02.63l-1.63-.5a.75.75 0 0 1-.58 0l-1.63.5a.75.75 0 0 1-1.02-.63l-.1-1.68a.75.75 0 0 0-1.14-.65l-1.58.5a.75.75 0 0 1-.92-.41l-.8-1.38a.75.75 0 0 1 .36-.98l1.23-.83a.75.75 0 0 0 0-1.28l-1.23-.83a.75.75 0 0 1-.36-.98l.8-1.38a.75.75 0 0 1 .92.41l1.58.5a.75.75 0 0 0 1.14-.65l.1-1.68a.75.75 0 0 1 1.02-.63l1.63.5a.75.75 0 0 1 .58 0l1.63-.5ZM8.5 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" clipRule="evenodd" /></svg>
            </button>
            <button
              onClick={props.onAddTask}
              className="px-4 py-2 text-sm font-semibold text-white bg-jam-dark rounded-lg hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-700"
            >
              Add Task
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
