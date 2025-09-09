import React, { useState } from 'react';
import Modal from './Modal';
import { Project } from '../types';

interface ManageProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onRenameProject: (projectId: string, newName: string) => void;
  onDeleteProject: (projectId: string) => void;
}

const ManageProjectsModal: React.FC<ManageProjectsModalProps> = ({ isOpen, onClose, projects, onRenameProject, onDeleteProject }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleStartEdit = (project: Project) => {
    setEditingId(project.id);
    setEditingName(project.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      onRenameProject(editingId, editingName.trim());
    }
    handleCancelEdit();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          handleSaveEdit();
      } else if (e.key === 'Escape') {
          handleCancelEdit();
      }
  }

  const handleDelete = (projectId: string) => {
    // Confirmation is now handled in the App component's logic
    onDeleteProject(projectId);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Projects">
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {projects.map(project => (
          <div key={project.id} className="flex items-center justify-between bg-white dark:bg-slate-900/50 p-2 rounded-md border border-jam-border dark:border-slate-700">
            {editingId === project.id ? (
              <input
                type="text"
                value={editingName}
                onChange={e => setEditingName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow bg-white dark:bg-slate-700 border border-jam-border dark:border-slate-600 rounded-md shadow-sm py-1 px-2 text-sm text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-jam-blue dark:focus:ring-pink-500"
                autoFocus
                onBlur={handleSaveEdit}
              />
            ) : (
              <p className="text-sm font-medium text-jam-dark dark:text-slate-200 truncate">{project.name}</p>
            )}

            <div className="flex items-center space-x-2 ml-2">
              {editingId === project.id ? (
                 <button onClick={handleSaveEdit} className="text-slate-400 hover:text-green-500" title="Save">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.052-.143Z" clipRule="evenodd" /></svg>
                 </button>
              ) : (
                <button onClick={() => handleStartEdit(project)} className="text-slate-400 hover:text-jam-blue dark:hover:text-pink-500" title="Rename">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25-1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" /></svg>
                </button>
              )}
              <button
                onClick={() => handleDelete(project.id)}
                disabled={projects.length <= 1}
                className="text-slate-400 hover:text-red-500 disabled:text-slate-600 disabled:cursor-not-allowed"
                title={projects.length <= 1 ? "Cannot delete the only project" : "Delete"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193v-.443A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-4 mt-2 border-t border-jam-border dark:border-slate-700">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
              Done
          </button>
      </div>
    </Modal>
  );
};

export default ManageProjectsModal;