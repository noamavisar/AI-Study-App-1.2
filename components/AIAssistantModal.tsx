import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Task, AIAssistantMode } from '../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: AIAssistantMode;
  task: Task | null;
  isLoading: boolean;
  content: string | string[] | null;
  onSubmit: (topic: string) => void;
  onAddSubtasks: (subtasks: string[]) => void;
}

const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose, mode, task, isLoading, content, onSubmit, onAddSubtasks }) => {
  const [topic, setTopic] = useState('');

  useEffect(() => {
    if (task) {
      setTopic(task.title);
    } else {
      setTopic('');
    }
  }, [task, isOpen]);

  const title = mode === 'breakdown' ? 'AI Task Breakdown' : 'AI Learning Tips';
  const buttonText = mode === 'breakdown' ? 'Generate Sub-tasks' : 'Get Tips';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onSubmit(topic);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="ai-topic" className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              {mode === 'breakdown' 
                ? (task ? `Breakdown "${task.title}" into sub-tasks:` : 'Topic to breakdown into tasks:')
                : 'Topic for tips'}
            </label>
            <input
              type="text"
              id="ai-topic"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="mt-1 block w-full bg-white dark:bg-slate-900 border border-jam-border dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-jam-blue dark:focus:ring-pink-500 focus:border-jam-blue dark:focus:border-pink-500 sm:text-sm"
              placeholder={task ? '' : 'e.g., Photosynthesis'}
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-jam-dark rounded-lg hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed">
              {isLoading ? 'Generating...' : buttonText}
            </button>
          </div>
        </form>

        {isLoading && (
          <div className="flex justify-center items-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jam-dark dark:border-pink-500"></div>
          </div>
        )}
        
        {content && (
            <div className="mt-4 p-4 bg-white/50 dark:bg-slate-900/50 border border-jam-border dark:border-slate-700 rounded-lg max-h-64 overflow-y-auto">
            {typeof content === 'string' ? (
                <div className="prose prose-sm prose-slate dark:prose-invert" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
            ) : (
                <ul className="list-disc list-inside space-y-2 text-jam-dark dark:text-slate-300">
                {content.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            )}
            </div>
        )}

        {mode === 'breakdown' && Array.isArray(content) && content.length > 0 && (
          <div className="flex justify-end pt-4">
            <button onClick={() => onAddSubtasks(content as string[])} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">
              {task ? 'Add as Sub-tasks to Card' : 'Add as New Tasks to Board'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AIAssistantModal;