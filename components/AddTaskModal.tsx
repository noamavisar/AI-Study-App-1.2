import React, { useState } from 'react';
import Modal from './Modal';
import { Task, Priority } from '../types';
import { PRIORITIES, PRIORITY_DESCRIPTIONS } from '../constants';

interface AddTaskModalProps {
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id' | 'status'>) => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose, onAddTask }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.ImportantNotUrgent);
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask({ title, description, priority, estimatedTime, dueDate: dueDate || undefined });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Add New Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="mt-1 block w-full bg-white dark:bg-slate-900 border border-jam-border dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-jam-blue dark:focus:ring-pink-500 focus:border-jam-blue dark:focus:border-pink-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full bg-white dark:bg-slate-900 border border-jam-border dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-jam-blue dark:focus:ring-pink-500 focus:border-jam-blue dark:focus:border-pink-500 sm:text-sm"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Priority</label>
              <select
                id="priority"
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="mt-1 block w-full bg-white dark:bg-slate-900 border border-jam-border dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-jam-blue dark:focus:ring-pink-500 focus:border-jam-blue dark:focus:border-pink-500 sm:text-sm"
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 h-8">{PRIORITY_DESCRIPTIONS[priority]}</p>
            </div>
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Due Date</label>
              <input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="mt-1 block w-full bg-white dark:bg-slate-900 border border-jam-border dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-jam-blue dark:focus:ring-pink-500 focus:border-jam-blue dark:focus:border-pink-500 sm:text-sm"
              />
            </div>
        </div>
        <div>
          <label htmlFor="estimatedTime" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Estimated Time (minutes)</label>
          <input
            type="number"
            id="estimatedTime"
            value={estimatedTime}
            onChange={e => setEstimatedTime(parseInt(e.target.value, 10) || 0)}
            className="mt-1 block w-full bg-white dark:bg-slate-900 border border-jam-border dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-jam-blue dark:focus:ring-pink-500 focus:border-jam-blue dark:focus:border-pink-500 sm:text-sm"
            required
          />
        </div>
        <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
                Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-jam-dark rounded-lg hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-700">
                Add Task
            </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTaskModal;