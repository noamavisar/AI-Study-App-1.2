import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types';

interface ProjectChooserProps {
  activeProject: Project | null;
  projects: Project[];
  onSwitchProject: (projectId: string) => void;
  onOpenProjectManager: () => void;
}

const ProjectChooser: React.FC<ProjectChooserProps> = ({ activeProject, projects, onSwitchProject, onOpenProjectManager }) => {
  const [isOpen, setIsOpen] = useState(false);
  const chooserRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chooserRef.current && !chooserRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (projectId: string) => {
    onSwitchProject(projectId);
    setIsOpen(false);
  };

  if (!activeProject) {
    return null;
  }

  return (
    <div className="relative" ref={chooserRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-jam-border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <span className="font-semibold text-jam-dark dark:text-slate-200">{activeProject.name}</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}>
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-2 w-64 origin-top-left rounded-md bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase">Projects</div>
            <div className="max-h-60 overflow-y-auto">
                {projects.map(project => (
                <button
                    key={project.id}
                    onClick={() => handleSelect(project.id)}
                    className={`w-full text-left flex items-center justify-between px-4 py-2 text-sm ${
                    project.id === activeProject.id
                        ? 'bg-slate-100 dark:bg-slate-700/50 text-jam-dark dark:text-slate-100'
                        : 'text-slate-700 dark:text-slate-300'
                    } hover:bg-slate-100 dark:hover:bg-slate-700/50`}
                >
                    <span>{project.name}</span>
                    {project.id === activeProject.id && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-pink-500">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.052-.143Z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>
                ))}
            </div>
            <div className="border-t border-jam-border dark:border-slate-700 mt-1 pt-1">
              <button
                onClick={() => { onOpenProjectManager(); setIsOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
              >
                Manage Projects...
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectChooser;
