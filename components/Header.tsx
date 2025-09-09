import React from 'react';
import { Theme } from '../types';

interface HeaderProps {
    onAddTask: () => void;
    onBreakdownTopic: () => void;
    onPlanSprint: () => void;
    onImportFromSheet: () => void;
    onGenerateFlashcards: () => void;
    onOpenSettings: () => void;
    focusScore: number;
    theme: Theme;
    toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddTask, onBreakdownTopic, onPlanSprint, onImportFromSheet, onGenerateFlashcards, onOpenSettings, focusScore, theme, toggleTheme }) => {
  return (
    <header className="bg-jam-light-gray/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-jam-border dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <svg className="h-8 w-8 text-jam-dark dark:text-slate-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            <h1 className="text-xl font-bold text-jam-dark dark:text-slate-200">Study Sprint AI</h1>
             <div className="hidden sm:flex items-center space-x-2 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-jam-border dark:border-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-yellow-400">
                    <path fillRule="evenodd" d="M10.868 2.884c.321-.772 1.305-.772 1.626 0l1.832 4.433c.067.162.2.28.368.303l4.637.674c.81.118 1.135 1.106.55 1.672l-3.356 3.272a.375.375 0 0 0-.107.398l.792 4.617c.138.803-.707 1.42-1.428 1.026L10.28 17.24a.375.375 0 0 0-.348 0l-4.148 2.18c-.721.394-1.566-.223-1.428-1.026l.792-4.617a.375.375 0 0 0-.107-.398L1.684 9.965c-.585-.566-.26-1.554.55-1.672l4.637-.674a.375.375 0 0 0 .368-.303l1.832-4.433Z" clipRule="evenodd" />
                </svg>
                <span className="font-bold text-jam-dark dark:text-slate-200 text-sm">{focusScore}</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm">Points</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
             <button
              onClick={onPlanSprint}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-jam-dark bg-white hover:bg-slate-100 border border-jam-border rounded-lg shadow-sm transition-colors duration-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-jam-blue">
                <path fillRule="evenodd" d="M15.988 3.012A2.25 2.25 0 0 1 18 5.25v9.5A2.25 2.25 0 0 1 15.75 17h-3.375a.75.75 0 0 1 0-1.5h3.375a.75.75 0 0 0 .75-.75v-9.5a.75.75 0 0 0-.75-.75H4.25a.75.75 0 0 0-.75.75v9.5c0 .414.336.75.75.75h3.375a.75.75 0 0 1 0 1.5H4.25A2.25 2.25 0 0 1 2 14.75v-9.5A2.25 2.25 0 0 1 4.012 3.012L4.25 3h11.5l.238.012ZM10 10.189a.75.75 0 0 0 1.125-.632l2-6a.75.75 0 1 0-1.39-.464L11 8.29l-1.11-2.22a.75.75 0 0 0-1.342.67L10 10.19Z" clipRule="evenodd" />
                <path d="M10.75 12.75a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z" />
              </svg>
              <span className="hidden sm:inline">Plan Sprint</span>
            </button>
             <button
              onClick={onImportFromSheet}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-jam-dark bg-white hover:bg-slate-100 border border-jam-border rounded-lg shadow-sm transition-colors duration-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-jam-orange"><path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h13A1.5 1.5 0 0 1 18 3.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 16.5v-13Zm1 0a.5.5 0 0 1 .5-.5h4.5a.5.5 0 0 1 .5.5v4.5a.5.5 0 0 1-.5.5H3.5a.5.5 0 0 1-.5-.5v-4.5Zm6.5.5a.5.5 0 0 0-.5.5v4.5a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5V4a.5.5 0 0 0-.5-.5h-4.5ZM3 10a.5.5 0 0 1 .5-.5h4.5a.5.5 0 0 1 .5.5v4.5a.5.5 0 0 1-.5.5H3.5a.5.5 0 0 1-.5-.5v-4.5Zm6.5.5a.5.5 0 0 0-.5.5v4.5a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4.5a.5.5 0 0 0-.5-.5h-4.5Z" clipRule="evenodd" /></svg>
              <span className="hidden sm:inline">Import</span>
            </button>
            <button
              onClick={onGenerateFlashcards}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-jam-dark bg-white hover:bg-slate-100 border border-jam-border rounded-lg shadow-sm transition-colors duration-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
            >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-jam-green">
                <path d="M3.75 2A1.75 1.75 0 0 0 2 3.75v12.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0 0 18 16.25V3.75A1.75 1.75 0 0 0 16.25 2H3.75ZM10 6a.75.75 0 0 1 .75.75v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1 0-1.5h2.5v-2.5A.75.75 0 0 1 10 6Z" />
              </svg>
              <span className="hidden sm:inline">AI Flashcards</span>
            </button>
            <button
              onClick={onAddTask}
              className="px-4 py-2 text-sm font-semibold text-white bg-jam-dark hover:bg-black rounded-lg shadow-sm transition-colors duration-200 dark:bg-pink-600 dark:hover:bg-pink-700"
            >
              Add Task
            </button>
            <div className="border-l border-jam-border dark:border-slate-700 h-6 mx-1 sm:mx-2"></div>
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-jam-dark dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.455 2.164A.75.75 0 0 1 8 2.5v1.25a.75.75 0 0 1-1.5 0V2.5a.75.75 0 0 1 .955-.336ZM12.545 2.164a.75.75 0 0 1 .545.336V3.75a.75.75 0 0 1-1.5 0V2.5a.75.75 0 0 1 .955-.336ZM2.5 8a.75.75 0 0 1 .75-.75h1.25a.75.75 0 0 1 0 1.5H3.25A.75.75 0 0 1 2.5 8Zm14.25 0a.75.75 0 0 1 .75-.75h1.25a.75.75 0 0 1 0 1.5H17.5a.75.75 0 0 1-.75-.75ZM7.455 17.836a.75.75 0 0 1-.545-.336V16.25a.75.75 0 0 1 1.5 0v1.25a.75.75 0 0 1-.955.336ZM12.545 17.836a.75.75 0 0 1-.545-.336V16.25a.75.75 0 0 1 1.5 0v1.25a.75.75 0 0 1-.955.336ZM10 4a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 4Zm0 10a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM4.164 7.455a.75.75 0 0 1 .336-.545H5.75a.75.75 0 0 1 0-1.5H4.5a.75.75 0 0 1-.336.955l.001-.001ZM15.836 7.455a.75.75 0 0 1 .336-.545H17.5a.75.75 0 0 1 0-1.5h-1.25a.75.75 0 0 1-.336.955l.001-.001ZM4.164 12.545a.75.75 0 0 1 .336.545V14.25a.75.75 0 0 1-1.5 0v-1.25a.75.75 0 0 1 .955.336l-.001.001ZM15.836 12.545a.75.75 0 0 1 .336.545V14.25a.75.75 0 0 1-1.5 0v-1.25a.75.75 0 0 1 .955.336l-.001.001ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" clipRule="evenodd" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M7.455 1.687a.75.75 0 0 1 1.025.275l.298.595a.75.75 0 0 0 1.25 0l.297-.595a.75.75 0 0 1 1.026-.275 7.005 7.005 0 0 1 5.33 4.887.75.75 0 0 1-.958.749 5.505 5.505 0 0 0-4.66-3.83.75.75 0 0 1-.683-.872l.235-1.173a.75.75 0 0 0-1.42-.284L8.75 3.39a.75.75 0 0 1-.683.872A5.505 5.505 0 0 0 3.408 8.01a.75.75 0 0 1-.958-.75 7.005 7.005 0 0 1 5.004-5.573Z" /><path d="M10 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM8.5 9.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z" /></svg>
              )}
            </button>
             <button
              onClick={onOpenSettings}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-jam-dark dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Settings"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M11.49 3.17a.75.75 0 0 1 1.02.67l.02 1.636a.75.75 0 0 1-1.019.705l-1.554-.836a.75.75 0 0 0-.84 0l-1.555.836a.75.75 0 0 1-1.02-.705l.02-1.636a.75.75 0 0 1 1.02-.67l1.554.836a.75.75 0 0 0 .842 0l1.555-.836ZM8.25 10a1.75 1.75 0 1 1 3.5 0 1.75 1.75 0 0 1-3.5 0ZM10 11.75a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5ZM12.51 13.6a.75.75 0 0 1 1.02.67l.02 1.636a.75.75 0 0 1-1.019.705l-1.554-.836a.75.75 0 0 0-.84 0l-1.555.836a.75.75 0 0 1-1.02-.705l.02-1.636a.75.75 0 0 1 1.02-.67l1.554.836a.75.75 0 0 0 .842 0l1.555-.836Z" clipRule="evenodd" />
                  <path d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-1.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z" />
                </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;