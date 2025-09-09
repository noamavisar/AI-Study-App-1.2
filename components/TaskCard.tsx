
import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskStatus, AIAssistantMode, Priority } from '../types';
import { TASK_STATUSES, PRIORITY_COLORS, PRIORITIES } from '../constants';
import { getFirstStepForTask } from '../services/geminiService';

interface TaskCardProps {
  task: Task;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onUpdateTaskPriority: (taskId: string, newPriority: Priority) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenAIAssistant: (mode: AIAssistantMode, task: Task) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, subtaskText: string) => void;
  onOpenFlashcardTask: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdateTaskStatus, onUpdateTaskPriority, onDeleteTask, onOpenAIAssistant, onToggleSubtask, onAddSubtask, onOpenFlashcardTask }) => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isPriorityMenuOpen, setPriorityMenuOpen] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const colors = PRIORITY_COLORS[task.priority];
  
  const menuRef = useRef<HTMLDivElement>(null);
  const priorityMenuRef = useRef<HTMLDivElement>(null);

  const handleOptionsMenuToggle = () => {
    setMenuOpen(!isMenuOpen);
    setPriorityMenuOpen(false);
  };

  const handlePriorityMenuToggle = () => {
    setPriorityMenuOpen(!isPriorityMenuOpen);
    setMenuOpen(false);
  };
  
  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(newSubtask.trim()){
      onAddSubtask(task.id, newSubtask);
      setNewSubtask('');
    }
  };

  const handleGetFirstStep = async () => {
      setMenuOpen(false);
      setIsAiLoading(true);
      setAiSuggestion(null);
      try {
          const suggestion = await getFirstStepForTask(task.title);
          setAiSuggestion(suggestion);
      } catch (e) {
          setAiSuggestion("Could not get a suggestion. Please try again.");
      } finally {
          setIsAiLoading(false);
      }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (priorityMenuRef.current && !priorityMenuRef.current.contains(event.target as Node)) {
        setPriorityMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
  const isFlashcardTask = task.flashcards && task.flashcards.length > 0;

  return (
    <div className={`p-4 shadow-lg rounded-md hover:scale-105 transition-transform duration-300 ${colors.bg}`}>
      <div className="flex justify-between items-start">
        <h3 className={`font-bold pr-2 ${colors.text}`}>{task.title}</h3>
        <div className="relative" ref={menuRef}>
          <button onClick={handleOptionsMenuToggle} className="text-black/50 hover:text-black/90 dark:text-slate-400 dark:hover:text-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-xl z-10 border border-jam-border dark:border-slate-700">
              <div className="py-1">
                <p className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400">Change Status</p>
                {TASK_STATUSES.filter(s => s !== task.status).map(status => (
                  <button key={status} onClick={() => { onUpdateTaskStatus(task.id, status); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-jam-dark hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700">
                    {status}
                  </button>
                ))}
                <div className="border-t border-jam-border dark:border-slate-700 my-1"></div>
                {!isFlashcardTask && (
                  <>
                    <button onClick={handleGetFirstStep} disabled={isAiLoading} className="block w-full text-left px-4 py-2 text-sm text-jam-dark hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-50">{isAiLoading ? 'Suggesting...' : 'Suggest First Step'}</button>
                    <button onClick={() => { onOpenAIAssistant('breakdown', task); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-jam-dark hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700">Breakdown Task</button>
                  </>
                )}
                <button onClick={() => { onOpenAIAssistant('tips', task); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-jam-dark hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700">Get Learning Tips</button>
                <div className="border-t border-jam-border dark:border-slate-700 my-1"></div>
                <button onClick={() => { onDeleteTask(task.id); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10">Delete Task</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isFlashcardTask ? (
         <div className="mt-2">
            <p className={`text-sm mb-3 text-black/70 dark:text-slate-300`}>{task.description}</p>
            <button
              onClick={() => onOpenFlashcardTask(task)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 font-semibold text-jam-dark bg-jam-yellow hover:bg-yellow-400 border border-yellow-400 rounded-lg shadow-sm transition-colors duration-200 dark:bg-yellow-800 dark:text-yellow-200 dark:border-yellow-700 dark:hover:bg-yellow-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M3.75 2A1.75 1.75 0 0 0 2 3.75v12.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0 0 18 16.25V3.75A1.75 1.75 0 0 0 16.25 2H3.75ZM10 6a.75.75 0 0 1 .75.75v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1 0-1.5h2.5v-2.5A.75.75 0 0 1 10 6Z" />
              </svg>
              <span>Study Flashcards</span>
            </button>
          </div>
      ) : (
        <>
          <p className={`text-sm mt-2 text-black/70 dark:text-slate-300`}>{task.description}</p>
      
          {isAiLoading && <div className={`text-center py-2 text-xs ${colors.text}`}>Finding an easy way to start...</div>}
          {aiSuggestion && (
              <div className="mt-3 p-2 bg-black/5 dark:bg-slate-700/50 border border-black/10 dark:border-slate-600 rounded-md text-sm animate-fade-in">
                  <p className={colors.text}><strong className="font-semibold">Easy First Step:</strong> {aiSuggestion}</p>
              </div>
          )}

          {totalSubtasks > 0 && (
              <div className="mt-4 space-y-2">
                  <div className="w-full bg-black/10 dark:bg-slate-700 rounded-full h-1.5">
                      <div className="bg-jam-dark dark:bg-pink-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="max-h-28 overflow-y-auto pr-1 space-y-2">
                      {task.subtasks?.map(subtask => (
                          <div key={subtask.id} className="flex items-center text-sm">
                              <input
                                  type="checkbox"
                                  id={`subtask-${subtask.id}`}
                                  checked={subtask.completed}
                                  onChange={() => onToggleSubtask(task.id, subtask.id)}
                                  className="h-4 w-4 rounded bg-black/5 border-black/20 text-jam-dark focus:ring-jam-dark dark:bg-slate-700 dark:border-slate-600 dark:text-pink-500 dark:focus:ring-pink-500"
                              />
                              <label htmlFor={`subtask-${subtask.id}`} className={`ml-2 ${colors.text} ${subtask.completed ? 'line-through text-black/50 dark:text-slate-500' : ''}`}>
                                  {subtask.text}
                              </label>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          <form onSubmit={handleAddSubtaskSubmit} className="mt-3 flex items-center">
              <input
                  type="text"
                  value={newSubtask}
                  onChange={e => setNewSubtask(e.target.value)}
                  placeholder="Add a sub-task..."
                  className="flex-grow bg-black/5 dark:bg-slate-900/50 border border-black/20 dark:border-slate-700 rounded-l-md py-1 px-2 text-sm text-jam-dark dark:text-slate-200 placeholder:text-black/50 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-500 dark:focus:border-pink-500"
              />
              <button type="submit" className="bg-jam-dark hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-700 text-white p-1.5 rounded-r-md disabled:bg-slate-400 dark:disabled:bg-slate-600" disabled={!newSubtask.trim()}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
              </button>
          </form>
        </>
      )}


      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black/60 dark:text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-black/60 dark:text-slate-400">{task.estimatedTime} minutes</span>
        </div>
        <div className="relative" ref={priorityMenuRef}>
            <button
                onClick={handlePriorityMenuToggle}
                className={`px-2 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-jam-dark ${colors.tagBg} ${colors.tagText}`}
            >
                {task.priority}
            </button>
            {isPriorityMenuOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-xl z-10 border border-jam-border dark:border-slate-700">
                <div className="py-1">
                <p className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400">Change Priority</p>
                {PRIORITIES.filter(p => p !== task.priority).map(priority => (
                    <button
                        key={priority}
                        onClick={() => {
                            onUpdateTaskPriority(task.id, priority);
                            setPriorityMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-jam-dark hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                        {priority}
                    </button>
                ))}
                </div>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;