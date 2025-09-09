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
  onOpenProjectFilesModal: () => void;
  onOpenSettings: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
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
              onClick={props.onOpenProjectFilesModal}
              className="hidden md:flex items-center space-x-2 px-3 py-1.5 text-sm font-semibold text-jam-dark dark:text-slate-200 bg-white dark:bg-slate-800 rounded-lg border border-jam-border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Manage Project Files"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M3.75 2a.75.75 0 0 0-.75.75v14.5a.75.75 0 0 0 .75.75h12.5a.75.75 0 0 0 .75-.75V8.25a.75.75 0 0 0-.75-.75h-5a.75.75 0 0 1-.75-.75V2a.75.75 0 0 0-.75-.75H3.75Z" /></svg>
                <span>Project Files</span>
            </button>
             <button
              onClick={props.onOpenImportModal}
              className="hidden md:flex items-center space-x-2 px-3 py-1.5 text-sm font-semibold text-jam-dark dark:text-slate-200 bg-white dark:bg-slate-800 rounded-lg border border-jam-border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Import from Google Sheets"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M3.25 4A2.25 2.25 0 0 0 1 6.25v7.5A2.25 2.25 0 0 0 3.25 16h7.5A2.25 2.25 0 0 0 13 13.75v-7.5A2.25 2.25 0 0 0 10.75 4h-7.5ZM2.5 6.25c0-.414.336-.75.75-.75h7.5c.414 0 .75.336.75.75v7.5c0 .414-.336.75-.75.75h-7.5a.75.75 0 0 1-.75-.75v-7.5Zm12-1.5A2.25 2.25 0 0 0 12.25 7v7.5a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 0 0-1.5h-2.25Z" /></svg>
                <span>Import</span>
            </button>
            <button 
              onClick={props.onAddTask}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-jam-dark rounded-lg hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-700 transition-colors shadow"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
              <span>Add Task</span>
            </button>
            <button onClick={props.onToggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors" title={`Switch to ${props.theme === 'dark' ? 'light' : 'dark'} mode`}>
              {props.theme === 'dark' ? (
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-1.5 0V2.75A.75.75 0 0 1 10 2ZM5.207 5.207a.75.75 0 0 1 1.06 0l.707.707a.75.75 0 0 1-1.06 1.06l-.707-.707a.75.75 0 0 1 0-1.06ZM2 10a.75.75 0 0 1 .75-.75h1.25a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10ZM5.914 14.086a.75.75 0 0 1 0-1.06l.707-.707a.75.75 0 1 1 1.06 1.06l-.707.707a.75.75 0 0 1-1.06 0ZM14.086 5.914a.75.75 0 0 1 1.06 0l.707.707a.75.75 0 0 1-1.06 1.06l-.707-.707a.75.75 0 0 1 0-1.06ZM18 10a.75.75 0 0 1 .75-.75h1.25a.75.75 0 0 1 0 1.5H18.75A.75.75 0 0 1 18 10ZM13.379 13.379a.75.75 0 0 1 1.06 0l.707.707a.75.75 0 0 1-1.06 1.06l-.707-.707a.75.75 0 0 1 0-1.06ZM10 6.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" clipRule="evenodd" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.455 2.164A.75.75 0 0 1 8 2.752V6.5a.75.75 0 0 1-1.5 0V4.625a8.001 8.001 0 0 0-7.484 9.143.75.75 0 0 1-1.058.423A9.501 9.501 0 0 1 10.545 2.545a.75.75 0 0 1 .41 1.619Z" clipRule="evenodd" /></svg>
              )}
            </button>
            <button onClick={props.onOpenSettings} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors" title="Settings">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M11.078 2.25c-.217 0-.424.04-.622.116l-6.25 2.5A.75.75 0 0 0 3.75 5.5v6.528a.75.75 0 0 0 .406.684l6.25 2.5a.75.75 0 0 0 .688 0l6.25-2.5a.75.75 0 0 0 .406-.684V5.5a.75.75 0 0 0-.406-.684l-6.25-2.5a.75.75 0 0 0-.622-.116ZM12.25 5.168l-4.5 1.8a.75.75 0 0 0 0 1.364l4.5 1.8a.75.75 0 0 0 1-1.364l-4.5-1.8a.75.75 0 0 0-1 1.364l4.5 1.8a.75.75 0 0 0 1-1.364l-4.5-1.8a.75.75 0 0 0-1 1.364l4.5 1.8a.75.75 0 0 0 1-1.364V5.168a.75.75 0 0 0-1.5 0v.001Z" clipRule="evenodd" />
                </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;