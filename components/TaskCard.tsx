import React, { useState, useRef, useEffect } from 'react';
import { Task, AIAssistantMode, Flashcard, Priority, FlashcardDeck, Subtask } from '../types';
import { PRIORITY_COLORS, PRIORITIES } from '../constants';

interface TaskCardProps {
  task: Task;
  onDeleteTask: (taskId: string) => void;
  onAddSubtask: (taskId: string, subtaskText: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onUpdateTaskTime: (taskId: string, newTime: number) => void;
  onUpdateTaskPriority: (taskId: string, newPriority: Priority) => void;
  onUpdateTaskDueDate: (taskId: string, newDueDate: string) => void;
  onOpenAIAssistant: (mode: AIAssistantMode, task: Task) => void;
  // FIX: Changed prop type from Flashcard[] to FlashcardDeck to match the handler in App.tsx.
  onOpenFlashcardTask: (deck: FlashcardDeck) => void;
  sharedDateColor?: string;
}

const getDateStatus = (dueDateString?: string) => {
    if (!dueDateString) {
        return { status: null, display: null };
    }
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const parts = dueDateString.split('-').map(p => parseInt(p, 10));
        const dueDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));

        const formattedDate = dueDate.toLocaleDateString(undefined, {
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


const TaskCard: React.FC<TaskCardProps> = ({ task, onDeleteTask, onAddSubtask, onToggleSubtask, onUpdateTask, onUpdateTaskTime, onUpdateTaskPriority, onUpdateTaskDueDate, onOpenAIAssistant, onOpenFlashcardTask, sharedDateColor }) => {
  const [newSubtask, setNewSubtask] = useState('');
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editedTime, setEditedTime] = useState(task.estimatedTime);
  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(task.description);
  
  const timeEditorRef = useRef<HTMLDivElement>(null);
  const priorityEditorRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const priorityConfig = PRIORITY_COLORS[task.priority];
  const { status: dateStatus, display: displayDate } = getDateStatus(task.dueDate);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (timeEditorRef.current && !timeEditorRef.current.contains(event.target as Node)) {
        if (isEditingTime) handleTimeSave();
      }
      if (priorityEditorRef.current && !priorityEditorRef.current.contains(event.target as Node)) {
        setIsEditingPriority(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditingTime]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("taskId", task.id);
    e.currentTarget.style.opacity = '0.5';
  };
  
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
      e.currentTarget.style.opacity = '1';
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtask.trim()) {
      onAddSubtask(task.id, newSubtask.trim());
      setNewSubtask('');
    }
  };

  const handleTitleBlur = () => {
    if (editedTitle.trim() && editedTitle.trim() !== task.title) {
      onUpdateTask(task.id, { title: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionBlur = () => {
    if (editedDescription !== task.description) {
      onUpdateTask(task.id, { description: editedDescription });
    }
    setIsEditingDescription(false);
  };

  const handleTimeSave = () => {
    if (editedTime !== task.estimatedTime) {
      onUpdateTaskTime(task.id, editedTime);
    }
    setIsEditingTime(false);
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateTaskDueDate(task.id, e.target.value);
    setIsEditingDate(false);
  };

  const handlePriorityChange = (newPriority: Priority) => {
      onUpdateTaskPriority(task.id, newPriority);
      setIsEditingPriority(false);
  }

  const handleOpenFlashcardTaskInternal = () => {
    if (task.flashcards && task.flashcards.length > 0) {
      const tempDeck: FlashcardDeck = {
        id: `task-${task.id}-${Date.now()}`,
        name: `Flashcards for "${task.title}"`,
        flashcards: task.flashcards,
        createdAt: new Date().toISOString(),
      };
      onOpenFlashcardTask(tempDeck);
    }
  };
  
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter(st => st.completed).length;
  const progress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

  let dateClasses = 'cursor-pointer';
  if (sharedDateColor) {
    dateClasses += ` border-t-2 ${sharedDateColor}`;
  } else if (dateStatus === 'overdue') {
    dateClasses += ' text-red-600 dark:text-red-400 font-semibold';
  } else if (dateStatus === 'today') {
    dateClasses += ' text-green-600 dark:text-green-400 font-semibold';
  }

  return (
    <div
      ref={cardRef}
      data-task-id={task.id}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`p-3 rounded-lg shadow-md border-l-4 ${priorityConfig.bg} ${priorityConfig.border} group transition-shadow hover:shadow-xl space-y-3`}
    >
      {/* Header: Title and Delete */}
      <div className="flex justify-between items-start">
        {isEditingTitle ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') handleTitleBlur(); if (e.key === 'Escape') setIsEditingTitle(false); }}
            className={`-m-1 p-1 w-full bg-white/50 dark:bg-slate-900/50 rounded-md text-md font-bold ${priorityConfig.text} focus:outline-none focus:ring-2 focus:ring-jam-blue dark:focus:ring-pink-500`}
            autoFocus
          />
        ) : (
          <h3 onClick={() => setIsEditingTitle(true)} className={`text-md font-bold cursor-pointer ${priorityConfig.text}`}>
            {task.title}
          </h3>
        )}
        <button onClick={() => onDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity ml-2 flex-shrink-0" title="Delete Task">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
        </button>
      </div>

      {/* Description */}
      {isEditingDescription ? (
         <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            className={`-m-1 p-1 mt-1 text-sm w-full bg-white/50 dark:bg-slate-900/50 rounded-md resize-y ${priorityConfig.text} focus:outline-none focus:ring-2 focus:ring-jam-blue dark:focus:ring-pink-500`}
            rows={3}
            autoFocus
          />
      ) : (
        (task.description) && (
            <p onClick={() => setIsEditingDescription(true)} className={`text-sm whitespace-pre-wrap cursor-pointer ${priorityConfig.text}`}>
                {task.description}
            </p>
        )
      )}

      {/* Tags: Priority, Due Date, Time */}
      <div className="flex flex-wrap gap-2 items-center text-xs">
        {/* Priority Tag */}
        <div ref={priorityEditorRef} className="relative">
          <button onClick={() => setIsEditingPriority(!isEditingPriority)} className={`flex items-center space-x-1 px-2 py-1 rounded-full ${priorityConfig.tagBg} ${priorityConfig.tagText} font-semibold`}>
            <span>{task.priority}</span>
          </button>
          {isEditingPriority && (
            <div className="absolute z-10 mt-1 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-jam-border dark:border-slate-700">
              {PRIORITIES.map(p => (
                <button key={p} onClick={() => handlePriorityChange(p)} className="block w-full text-left px-3 py-2 text-sm text-jam-dark dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Due Date Tag */}
        {displayDate && (
            <div className="relative">
                {isEditingDate ? (
                    <input
                        type="date"
                        defaultValue={task.dueDate}
                        onBlur={() => setIsEditingDate(false)}
                        onChange={handleDateChange}
                        className={`px-2 py-1 rounded-full ${priorityConfig.tagBg} ${priorityConfig.tagText} font-semibold bg-transparent focus:outline-none focus:ring-1 focus:ring-jam-blue dark:focus:ring-pink-500`}
                        autoFocus
                    />
                ) : (
                    <button onClick={() => setIsEditingDate(true)} className={`flex items-center space-x-1 px-2 py-1 rounded-full ${priorityConfig.tagBg} ${dateClasses}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M8.25 2a.75.75 0 0 1 .75.75V4h.25a2 2 0 0 1 2 2v5.5a2 2 0 0 1-2 2H4.75a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h.25V2.75a.75.75 0 0 1 1.5 0V4h3V2.75a.75.75 0 0 1 .75-.75ZM4.75 5.5A.5.5 0 0 0 4.25 6v5.5a.5.5 0 0 0 .5.5h6.5a.5.5 0 0 0 .5-.5V6a.5.5 0 0 0-.5-.5h-6.5Z" /></svg>
                        <span>{displayDate}</span>
                    </button>
                )}
            </div>
        )}
        {/* Time Tag */}
        <div ref={timeEditorRef} className="relative">
          {isEditingTime ? (
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={editedTime}
                onChange={(e) => setEditedTime(parseInt(e.target.value, 10) || 0)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTimeSave(); if (e.key === 'Escape') setIsEditingTime(false); }}
                className={`w-16 px-2 py-1 rounded-full ${priorityConfig.tagBg} ${priorityConfig.tagText} font-semibold bg-transparent focus:outline-none focus:ring-1 focus:ring-jam-blue dark:focus:ring-pink-500`}
                autoFocus
              />
              <button onClick={handleTimeSave} className={`text-green-500 ${priorityConfig.tagText}`}>✓</button>
            </div>
          ) : (
            <button onClick={() => setIsEditingTime(true)} className={`flex items-center space-x-1 px-2 py-1 rounded-full ${priorityConfig.tagBg} ${priorityConfig.tagText}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm.75-10.25a.75.75 0 0 0-1.5 0v3.5c0 .24.141.458.358.583l2.5 1.5a.75.75 0 0 0 .866-1.25L8.75 8.31V4.75Z" clipRule="evenodd" /></svg>
              <span>{task.estimatedTime} min</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtasks */}
      {subtasks.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="w-full bg-slate-200/50 dark:bg-slate-900/50 rounded-full h-1.5">
            <div className="bg-jam-blue dark:bg-pink-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          {subtasks.map((subtask: Subtask) => (
            <div key={subtask.id} className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={subtask.completed}
                onChange={() => onToggleSubtask(task.id, subtask.id)}
                className="w-4 h-4 text-jam-blue bg-slate-100 border-slate-300 rounded focus:ring-jam-blue dark:focus:ring-pink-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
              />
              <label className={`ml-2 ${subtask.completed ? 'line-through text-slate-400' : `${priorityConfig.text}`}`}>{subtask.text}</label>
            </div>
          ))}
        </div>
      )}

      {/* Add Subtask Form */}
      <form onSubmit={handleAddSubtask} className="flex items-center space-x-2 pt-1">
        <input
          type="text"
          value={newSubtask}
          onChange={(e) => setNewSubtask(e.target.value)}
          placeholder="Add a sub-task..."
          className={`flex-grow bg-transparent text-sm placeholder-slate-400 ${priorityConfig.text} border-b border-slate-300/50 dark:border-slate-600/50 focus:outline-none focus:border-jam-blue dark:focus:border-pink-500`}
        />
        <button type="submit" className="text-slate-400 hover:text-jam-dark dark:hover:text-pink-500" title="Add Subtask">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" /></svg>
        </button>
      </form>
      
      {/* AI & Flashcard Actions */}
      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 -mx-3 px-3 -mb-3 pb-3">
        {(task.flashcards && task.flashcards.length > 0) && (
            <button onClick={handleOpenFlashcardTaskInternal} className="flex items-center space-x-1 text-xs px-2 py-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50" title="Study Flashcards for this task">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M2.5 3.5A1.5 1.5 0 0 0 1 5v6A1.5 1.5 0 0 0 2.5 12.5h11A1.5 1.5 0 0 0 15 11V5a1.5 1.5 0 0 0-1.5-1.5h-11Zm-1.5 8v1A1.5 1.5 0 0 0 2.5 14h11a1.5 1.5 0 0 0 1.5-1.5v-1a.5.5 0 0 0-1 0v.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-.5a.5.5 0 0 0-1 0Z" /></svg>
            </button>
        )}
        <button onClick={() => onOpenAIAssistant('breakdown', task)} className="flex items-center space-x-1 text-xs px-2 py-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50" title="Break down with AI">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 5 2ZM5.75 6a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0V6Zm-1.5 3.75a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75Zm2.25.75a.75.75 0 0 0 0-1.5h8.5a.75.75 0 0 0 0 1.5h-8.5Zm0-3a.75.75 0 0 0 0-1.5h8.5a.75.75 0 0 0 0 1.5h-8.5Zm0-3a.75.75 0 0 0 0-1.5h8.5a.75.75 0 0 0 0 1.5h-8.5Z" clipRule="evenodd" /></svg>
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
