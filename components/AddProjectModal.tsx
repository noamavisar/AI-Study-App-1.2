import React, { useState } from 'react';
import Modal from './Modal';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProject: (name: string) => void;
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose, onAddProject }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddProject(name.trim());
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="project-name" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Project Name</label>
          <input
            type="text"
            id="project-name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="mt-1 block w-full bg-white dark:bg-slate-900 border border-jam-border dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-jam-blue dark:focus:ring-pink-500 focus:border-jam-blue dark:focus:border-pink-500 sm:text-sm"
            placeholder="e.g., Final Exams Sprint"
            required
            autoFocus
          />
        </div>
        <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
                Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-jam-dark rounded-lg hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-700">
                Create Project
            </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddProjectModal;
