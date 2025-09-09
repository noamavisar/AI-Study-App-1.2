import React, { useState, useRef, useEffect } from 'react';
import { Task, AIAssistantMode, Flashcard, Priority } from '../types';
import { PRIORITY_COLORS, PRIORITIES } from '../constants';

interface TaskCardProps {
  task: Task;
  onDeleteTask: (taskId: string) => void;
  onAddSubtask: (taskId: string, subtaskText: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onUpdateTaskTime: (taskId: string, newTime: number) => void;
  onUpdateTaskPriority: (taskId: string, newPriority: Priority) => void;
  onUpdateTaskDueDate: (taskId: string, newDueDate: string) => void;
  onOpenAIAssistant: (mode: AIAssistantMode, task: Task) => void;
  onOpenFlashcardTask: (flashcards: Flashcard[]) => void;
  sharedDateColor?: string;
}

const getDateStatus = (dueDateString?: string) => {
    if (!dueDateString) {
        return { status: null, display: null };
    }
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Input type="date" provides 'YYYY-MM-DD'. To avoid timezone issues,
        // parse it as UTC by creating the date from parts.
        const parts = dueDateString.split('-').map(p => parseInt(p, 10));
        const dueDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));

        const formattedDate = dueDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC',
        });

        if (dueDate < today) {
            return { status: 'overdue', display: formattedDate };
        }
        if (dueDate.getTime() === today.getTime()) {
            return { status: 'today', display: formattedDate };
        }
        return { status: 'upcoming', display: formattedDate };
    } catch (e) {
        console.error("Error parsing date:", e);
        return { status: null, display: null };
    }
};


const TaskCard: React.FC<TaskCardProps> = ({ task, onDeleteTask, onAddSubtask, onToggleSubtask, onUpdateTaskTime, onUpdateTaskPriority, onUpdateTaskDueDate, onOpenAIAssistant, onOpenFlashcardTask, sharedDateColor }) => {
  const [newSubtask, setNewSubtask] = useState('');
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editedTime, setEditedTime] = useState(task.estimatedTime);
  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);
  
  const timeEditorRef = useRef<HTMLDivElement>(null);
  const priorityEditorRef = useRef<HTMLDivElement>(null);

  const priorityConfig = PRIORITY_COLORS[task.priority];
  const { status: dateStatus, display: displayDate } = getDateStatus(task.dueDate);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (timeEditorRef.current && !timeEditorRef.current.contains(event.target as Node)) {
        setIsEditingTime(false);
      }
      if (priorityEditorRef.current && !priorityEditorRef.current.contains(event.target as Node)) {
        setIsEditingPriority(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [timeEditorRef, priorityEditorRef]);

  const handleAddTimeSubmit = () => {
    if (editedTime > 0) {
      onUpdateTaskTime(task.id, editedTime);
    } else {
        setEditedTime(task.estimatedTime);
    }
    setIsEditingTime(false);
  };
  
  const handleTimeEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTimeSubmit();
    } else if (e.key === 'Escape') {
      setEditedTime(task.estimatedTime);
      setIsEditingTime(false);
    }
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtask.trim()) {
      onAddSubtask(task.id, newSubtask.trim());
      setNewSubtask('');
    }
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("taskId", task.id);
    e.dataTransfer.setData("sourceStatus", task.status);
    e.currentTarget.style.opacity = '0.5';
  };
  
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
  };

  const handlePriorityChange = (newPriority: Priority) => {
    onUpdateTaskPriority(task.id, newPriority);
    setIsEditingPriority(false);
  };

  const completedSubtasks = (task.subtasks || []).filter(s => s.completed).length;
  const totalSubtasks = (task.subtasks || []).length;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
  
  const cardClasses = [
    'p-4 rounded-lg shadow-md border-l-4 transition-shadow hover:shadow-lg cursor-grab active:cursor-grabbing',
    priorityConfig.bg,
    'border-jam-dark/20 dark:border-white/20',
    dateStatus === 'overdue' ? 'border-t-4 border-t-red-500' : '',
    dateStatus === 'today' ? 'border-t-4 border-t-green-500' : '',
    dateStatus === 'upcoming' && sharedDateColor ? `border-t-4 ${sharedDateColor}` : '',
  ].filter(Boolean).join(' ');

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cardClasses}
    >
      <div className="flex justify-between items-start">
        <div>
          {task.day && <p className="text-xs font-bold uppercase tracking-wider text-jam-blue dark:text-pink-400 mb-1">Day {task.day}</p>}
          <h3 className={`font-bold text-md mb-2 ${priorityConfig.text}`}>{task.title}</h3>
        </div>
        <button onClick={() => onDeleteTask(task.id)} className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
        </button>
      </div>
      
      <p className={`text-sm mb-3 ${priorityConfig.text}/80`}>{task.description}</p>
      
      <div className="mb-3">
        {isEditingDate ? (
            <input
                type="date"
                value={task.dueDate || ''}
                onChange={(e) => {
                    onUpdateTaskDueDate(task.id, e.target.value);
                    setIsEditingDate(false);
                }}
                onBlur={() => setIsEditingDate(false)}
                className="bg-white/50 dark:bg-slate-900/50 border border-jam-border dark:border-slate-600 rounded-md py-0.5 px-1.5 text-xs text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-jam-blue dark:focus:ring-pink-500"
                autoFocus
            />
        ) : (
            displayDate && (
                <button
                    onClick={() => setIsEditingDate(true)}
                    className={`flex items-center text-xs font-semibold p-1 -ml-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 ${
                        dateStatus === 'overdue' ? 'text-red-600 dark:text-red-400' :
                        dateStatus === 'today' ? 'text-green-600 dark:text-green-500' :
                        'text-slate-500 dark:text-slate-400'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mr-1.5 flex-shrink-0">
                        <path d="M8 1.75a.75.75 0 0 1 .75.75V4h-1.5V2.5A.75.75 0 0 1 8 1.75Z" />
                        <path fillRule="evenodd" d="M3.75 4a.75.75 0 0 0-.75.75V12.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75V4.75a.75.75 0 0 0-.75-.75h-1V2.5a2.25 2.25 0 0 0-4.5 0V4h-1Zm-1.5 1.5v7.25c0 1.243 1.007 2.25 2.25 2.25h8.5c1.243 0 2.25-1.007 2.25-2.25V5.5A2.25 2.25 0 0 0 12.25 3.25h-.5V2.5a3.75 3.75 0 0 0-7.5 0v.75h-.5A2.25 2.25 0 0 0 2.25 5.5Z" clipRule="evenodd" />
                    </svg>
                    <span>Due: {displayDate}</span>
                    {dateStatus === 'overdue' && <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-700 dark:text-red-300">Overdue</span>}
                    {dateStatus === 'today' && <span className="ml-2 px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-700 dark:text-green-300">Today</span>}
                </button>
            )
        )}
      </div>

      <div className="flex items-center space-x-2 text-xs mb-4">
        <div className="relative" ref={priorityEditorRef}>
            <button
                onClick={() => setIsEditingPriority(prev => !prev)}
                className={`px-2 py-1 rounded-full font-semibold ${priorityConfig.tagBg} ${priorityConfig.tagText} hover:ring-2 hover:ring-slate-400 dark:hover:ring-slate-500 transition-shadow`}
                aria-label={`Change priority, current is ${task.priority}`}
            >
              {task.priority}
            </button>
            {isEditingPriority && (
                <div className="absolute z-10 mt-2 -ml-2 w-56 origin-top-left rounded-md bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                        {PRIORITIES.map(p => (
                            <button
                                key={p}
                                onClick={() => handlePriorityChange(p)}
                                className={`w-full text-left px-4 py-2 text-sm ${
                                  task.priority === p 
                                  ? 'bg-slate-100 dark:bg-slate-700 text-jam-dark dark:text-slate-100' 
                                  : 'text-slate-700 dark:text-slate-300'
                                } hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-3`}
                            >
                                <span className={`w-3 h-3 rounded-full ${PRIORITY_COLORS[p].bg.split(' ')[0]}`}></span>
                                <span>{p}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
        {isEditingTime ? (
            <div ref={timeEditorRef} className="flex items-center space-x-1">
                <input
                    type="number"
                    value={editedTime}
                    onChange={(e) => setEditedTime(parseInt(e.target.value, 10) || 0)}
                    onKeyDown={handleTimeEditKeyDown}
                    className="w-16 bg-white/50 dark:bg-slate-900/50 border border-jam-border dark:border-slate-600 rounded-md py-0.5 px-1.5 text-xs text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-jam-blue dark:focus:ring-pink-500"
                    autoFocus
                />
                <button onClick={handleAddTimeSubmit} className="p-1 rounded-full bg-green-500/20 text-green-700 dark:text-green-300 hover:bg-green-500/40" aria-label="Save time">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.354 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" /></svg>
                </button>
                <button onClick={() => setIsEditingTime(false)} className="p-1 rounded-full bg-red-500/20 text-red-700 dark:text-red-300 hover:bg-red-500/40" aria-label="Cancel edit time">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" /></svg>
                </button>
            </div>
        ) : (
            <button 
                onClick={() => { setEditedTime(task.estimatedTime); setIsEditingTime(true); }}
                className={`px-2 py-1 rounded-full font-semibold ${priorityConfig.tagBg} ${priorityConfig.tagText} flex items-center hover:ring-2 hover:ring-slate-400 dark:hover:ring-slate-500 transition-shadow`}
                aria-label={`Edit estimated time, current is ${task.estimatedTime} minutes`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 mr-1"><path fillRule="evenodd" d="M8 1.75a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0V2.5A.75.75 0 0 1 8 1.75Z" clipRule="evenodd" /><path d="M5.75 8a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 5.75 8Zm-2.22.72a.75.75 0 1 0 1.06 1.06l1.72-1.72a.75.75 0 1 0-1.06-1.06l-1.72 1.72Zm10.44 0a.75.75 0 1 0-1.06 1.06l1.72 1.72a.75.75 0 1 0 1.06-1.06l-1.72-1.72ZM8 14.25a6.25 6.25 0 1 0 0-12.5 6.25 6.25 0 0 0 0 12.5Zm0-1.5a4.75 4.75 0 1 0 0-9.5 4.75 4.75 0 0 0 0 9.5Z" /></svg>
                {task.estimatedTime} min
            </button>
        )}
      </div>

      {totalSubtasks > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sub-tasks</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{completedSubtasks}/{totalSubtasks}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
            <div className="bg-jam-green h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {(task.subtasks && task.subtasks.length > 0) && (
        <div className="space-y-2 mb-3 max-h-32 overflow-y-auto pr-2">
          {task.subtasks.map(subtask => (
            <div key={subtask.id} className="flex items-center text-sm">
              <input
                type="checkbox"
                id={`subtask-${subtask.id}`}
                checked={subtask.completed}
                onChange={() => onToggleSubtask(task.id, subtask.id)}
                className="w-4 h-4 text-jam-blue bg-slate-100 border-slate-300 rounded focus:ring-jam-blue dark:focus:ring-pink-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
              />
              <label htmlFor={`subtask-${subtask.id}`} className={`ml-2 ${subtask.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                {subtask.text}
              </label>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAddSubtask} className="flex space-x-2 mb-4">
        <input
          type="text"
          value={newSubtask}
          onChange={(e) => setNewSubtask(e.target.value)}
          placeholder="Add a new sub-task..."
          className="flex-grow bg-white/50 dark:bg-slate-900/50 border border-jam-border dark:border-slate-600 rounded-md shadow-sm py-1 px-2 text-sm text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-jam-blue dark:focus:ring-pink-500"
        />
        <button type="submit" className="px-2 py-1 text-xs font-semibold text-white bg-jam-dark rounded-md hover:bg-black dark:bg-slate-600 dark:hover:bg-slate-500">+</button>
      </form>

      <div className="border-t border-jam-border dark:border-slate-700 pt-3 flex items-center justify-between space-x-2">
        <div className="flex items-center space-x-1">
          <button onClick={() => onOpenAIAssistant('breakdown', task)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors" title="Breakdown task with AI">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M14.22 2.22a.75.75 0 0 0-1.06 0l-8.5 8.5a.75.75 0 0 0 0 1.06l1.5 1.5a.75.75 0 0 0 1.06 0l8.5-8.5a.75.75 0 0 0 0-1.06l-1.5-1.5Zm-1.04 9.46-6.94-6.94l.47-.47 6.94 6.94-.47.47Z" /><path d="M3.5 12.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM5.5 10.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM7.5 8.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM9.5 6.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" /></svg>
          </button>
          <button onClick={() => onOpenAIAssistant('tips', task)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors" title="Get learning tips from AI">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-1.5 0V2.75A.75.75 0 0 1 10 2ZM5.207 5.207a.75.75 0 0 1 1.06 0l.707.707a.75.75 0 0 1-1.06 1.06l-.707-.707a.75.75 0 0 1 0-1.06ZM2 10a.75.75 0 0 1 .75-.75h1.25a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10ZM5.914 14.086a.75.75 0 0 1 0-1.06l.707-.707a.75.75 0 1 1 1.06 1.06l-.707.707a.75.75 0 0 1-1.06 0ZM14.086 5.914a.75.75 0 0 1 1.06 0l.707.707a.75.75 0 0 1-1.06 1.06l-.707-.707a.75.75 0 0 1 0-1.06ZM18 10a.75.75 0 0 1 .75-.75h1.25a.75.75 0 0 1 0 1.5H18.75A.75.75 0 0 1 18 10ZM13.379 13.379a.75.75 0 0 1 1.06 0l.707.707a.75.75 0 0 1-1.06 1.06l-.707-.707a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /><path d="m10 6.25c-1.933 0-3.5 1.567-3.5 3.5s1.567 3.5 3.5 3.5 3.5-1.567 3.5-3.5-1.567-3.5-3.5-3.5Z" /></svg>
          </button>
        </div>
        
        <div className="flex-grow"></div>

        {task.flashcards && task.flashcards.length > 0 && (
          <button onClick={() => onOpenFlashcardTask(task.flashcards!)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors" title="Study Flashcards">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3.75 2A1.75 1.75 0 0 0 2 3.75v12.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0 0 18 16.25V3.75A1.75 1.75 0 0 0 16.25 2H3.75ZM10 6a.75.75 0 0 1 .75.75v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1 0-1.5h2.5v-2.5A.75.75 0 0 1 10 6Z" /></svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;