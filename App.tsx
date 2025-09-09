import React, { useState, useEffect, useCallback } from 'react';

import Header from './components/Header';
import KanbanBoard from './components/KanbanBoard';
import Timer from './components/Timer';
import BrainDump from './components/BrainDump';
import LearningTipBar from './components/LearningTipBar';
import AddTaskModal from './components/AddTaskModal';
import AIAssistantModal from './components/AIAssistantModal';
import LearningResourcesModal from './components/LearningResourcesModal';
import FlashcardsModal from './components/FlashcardsModal';
import SettingsModal from './components/SettingsModal';
import ImportFromSheetModal from './components/ImportFromSheetModal';

import { Task, TaskStatus, Subtask, AIAssistantMode, Theme, Priority, LearningResource, Flashcard } from './types';
import { breakdownTaskIntoSubtasks, getLearningTipsForTopic, generateStudySprint } from './services/geminiService';

// Simple unique ID generator to avoid external dependencies
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
  });
}

function App() {
  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [theme, setTheme] = useState<Theme>('light');
  const [focusScore, setFocusScore] = useState<number>(0);
  
  // Modal states
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAIAssistantModalOpen, setIsAIAssistantModalOpen] = useState(false);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [isFlashcardsModalOpen, setIsFlashcardsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isImportSheetModalOpen, setIsImportSheetModalOpen] = useState(false);

  // AI Assistant state
  const [aiAssistantMode, setAiAssistantMode] = useState<AIAssistantMode>('breakdown');
  const [aiAssistantTask, setAiAssistantTask] = useState<Task | null>(null);
  const [aiIsLoading, setAiIsLoading] = useState(false);
  const [aiContent, setAiContent] = useState<string | string[] | null>(null);

  // Sprint Planner state
  const [sprintIsLoading, setSprintIsLoading] = useState(false);

  // Flashcards state
  const [preloadedFlashcards, setPreloadedFlashcards] = useState<Flashcard[] | null>(null);

  // Load state from local storage on initial render
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem('studySprintTasks');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
      const savedTheme = localStorage.getItem('studySprintTheme') as Theme | null;
      if (savedTheme) {
        setTheme(savedTheme);
      }
      const savedFocusScore = localStorage.getItem('studySprintFocusScore');
      if (savedFocusScore) {
        setFocusScore(JSON.parse(savedFocusScore));
      }
    } catch (error) {
      console.error("Failed to load data from local storage", error);
      // If data is corrupted, clear it
      localStorage.removeItem('studySprintTasks');
    }
  }, []);

  // Save state to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('studySprintTasks', JSON.stringify(tasks));
    } catch (error) {
      console.error("Failed to save tasks to local storage", error);
    }
  }, [tasks]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('studySprintTheme', theme);
    } catch (error) {
      console.error("Failed to save theme to local storage", error);
    }
  }, [theme]);
  
   useEffect(() => {
    try {
      localStorage.setItem('studySprintFocusScore', JSON.stringify(focusScore));
    } catch (error) {
      console.error("Failed to save focus score to local storage", error);
    }
  }, [focusScore]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleAddTask = useCallback((task: Omit<Task, 'id' | 'status'>) => {
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      status: TaskStatus.ToDo,
      subtasks: [],
    };
    setTasks(prev => [newTask, ...prev]);
    setIsAddTaskModalOpen(false);
  }, []);

  const handleUpdateTaskStatus = useCallback((taskId: string, newStatus: TaskStatus) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          if (task.status !== TaskStatus.Done && newStatus === TaskStatus.Done) {
            setFocusScore(score => score + 10);
          } else if (task.status === TaskStatus.Done && newStatus !== TaskStatus.Done) {
            setFocusScore(score => Math.max(0, score - 10));
          }
          return { ...task, status: newStatus };
        }
        return task;
      })
    );
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
    }
  }, []);

  const handleAddSubtask = useCallback((taskId: string, subtaskText: string) => {
    const newSubtask: Subtask = { id: uuidv4(), text: subtaskText, completed: false };
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, subtasks: [...(task.subtasks || []), newSubtask] } : task
      )
    );
  }, []);

  const handleToggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          let subtaskCompleted = false;
          const newSubtasks = (task.subtasks || []).map(sub => {
            if (sub.id === subtaskId) {
              subtaskCompleted = !sub.completed;
              return { ...sub, completed: subtaskCompleted };
            }
            return sub;
          });
          // Update focus score when subtask is completed
          if(subtaskCompleted) {
            setFocusScore(score => score + 2);
          } else {
            setFocusScore(score => Math.max(0, score - 2));
          }
          return { ...task, subtasks: newSubtasks };
        }
        return task;
      })
    );
  }, []);
  
  const handleUpdateTaskTime = useCallback((taskId: string, newTime: number) => {
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, estimatedTime: newTime } : task));
  }, []);

  const handleUpdateTaskPriority = useCallback((taskId: string, newPriority: Priority) => {
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, priority: newPriority } : task));
  }, []);

  const handleOpenAIAssistant = useCallback((mode: AIAssistantMode, task: Task | null) => {
    setAiAssistantMode(mode);
    setAiAssistantTask(task);
    setAiContent(null);
    setIsAIAssistantModalOpen(true);
  }, []);

  const handleAISubmit = async (topic: string) => {
    setAiIsLoading(true);
    setAiContent(null);
    try {
      if (aiAssistantMode === 'breakdown') {
        const subtasks = await breakdownTaskIntoSubtasks(topic);
        setAiContent(subtasks);
      } else {
        const tips = await getLearningTipsForTopic(topic);
        setAiContent(tips);
      }
    } catch (error: any) {
      console.error(error);
      setAiContent(error.message || 'Sorry, there was an error generating content from the AI.');
    } finally {
      setAiIsLoading(false);
    }
  };
  
  const handleAddSubtasksFromAI = (subtasks: string[]) => {
      if (aiAssistantTask) {
        // Add to existing task
        const newSubtasks: Subtask[] = subtasks.map(text => ({ id: uuidv4(), text, completed: false }));
         setTasks(prev =>
          prev.map(task =>
            task.id === aiAssistantTask.id ? { ...task, subtasks: [...(task.subtasks || []), ...newSubtasks] } : task
          )
        );
      } else {
        // Add as new tasks
        const newTasks: Task[] = subtasks.map(title => ({
          id: uuidv4(),
          title,
          description: '',
          status: TaskStatus.ToDo,
          priority: Priority.ImportantNotUrgent,
          estimatedTime: 30,
          subtasks: [],
        }));
        setTasks(prev => [...newTasks, ...prev]);
      }
      setIsAIAssistantModalOpen(false);
  };
  
  const handleGenerateSprint = async (resources: Omit<LearningResource, 'id'>[], days: number) => {
    setSprintIsLoading(true);
    try {
        const sprintTasks = await generateStudySprint(resources, days);
        const newTasks: Task[] = sprintTasks.map(task => ({
            ...task,
            id: uuidv4(),
            status: TaskStatus.ToDo,
        }));
        setTasks(prev => [...newTasks, ...prev]);
        setIsSprintModalOpen(false);
    } catch(error: any) {
        console.error(error);
        alert(`Failed to generate sprint plan: ${error.message}`);
    } finally {
        setSprintIsLoading(false);
    }
  };

  const handleImportTasks = (importedTasks: Omit<Task, 'id'>[]) => {
    const newTasks: Task[] = importedTasks.map(task => ({
      ...task,
      id: uuidv4(),
    }));
    setTasks(prev => [...newTasks, ...prev]);
    setIsImportSheetModalOpen(false);
  };
  
  const handleSaveFlashcardsAsTask = (prompt: string, flashcards: Flashcard[]) => {
    const newTask: Task = {
      id: uuidv4(),
      title: `Study Flashcards: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`,
      description: `Review ${flashcards.length} flashcards generated by AI.`,
      status: TaskStatus.ToDo,
      priority: Priority.ImportantNotUrgent,
      estimatedTime: 30,
      flashcards: flashcards,
    };
    setTasks(prev => [newTask, ...prev]);
    setIsFlashcardsModalOpen(false);
  };
  
  const handleOpenFlashcardTask = (flashcards: Flashcard[]) => {
    setPreloadedFlashcards(flashcards);
    setIsFlashcardsModalOpen(true);
  };

  const handleClearAllData = () => {
    if(window.confirm('Are you sure you want to clear ALL data? This includes tasks, scores, and settings. This action cannot be undone.')) {
        localStorage.removeItem('studySprintTasks');
        localStorage.removeItem('studySprintTheme');
        localStorage.removeItem('studySprintPomodoros');
        localStorage.removeItem('studySprintFocusScore');
        localStorage.removeItem('studySprintBrainDump');
        localStorage.removeItem('studySprintTimerSettings');
        setTasks([]);
        setTheme('light');
        setFocusScore(0);
        setIsSettingsModalOpen(false);
        // Force reload to clear any other in-memory state (like Timer component's state)
        window.location.reload();
    }
  };

  return (
    <div className={`${theme === 'light' ? 'light-theme' : 'dark-theme'} min-h-screen transition-colors duration-300`}>
      <Header
        onAddTask={() => setIsAddTaskModalOpen(true)}
        onBreakdownTopic={() => handleOpenAIAssistant('breakdown', null)}
        onPlanSprint={() => setIsSprintModalOpen(true)}
        onImportFromSheet={() => setIsImportSheetModalOpen(true)}
        onGenerateFlashcards={() => { setPreloadedFlashcards(null); setIsFlashcardsModalOpen(true); }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        focusScore={focusScore}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <LearningTipBar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-2 xl:col-span-3">
            <KanbanBoard
              tasks={tasks}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onDeleteTask={handleDeleteTask}
              onAddSubtask={handleAddSubtask}
              onToggleSubtask={handleToggleSubtask}
              onUpdateTaskTime={handleUpdateTaskTime}
              onUpdateTaskPriority={handleUpdateTaskPriority}
              onOpenAIAssistant={handleOpenAIAssistant}
              onOpenFlashcardTask={handleOpenFlashcardTask}
            />
          </div>
          <div className="space-y-6 lg:col-span-1 xl:col-span-1">
            <Timer />
            <BrainDump />
          </div>
        </div>
      </main>
      
      {/* Modals */}
      {isAddTaskModalOpen && <AddTaskModal onClose={() => setIsAddTaskModalOpen(false)} onAddTask={handleAddTask} />}
      
      {isAIAssistantModalOpen && (
        <AIAssistantModal
          isOpen={isAIAssistantModalOpen}
          onClose={() => setIsAIAssistantModalOpen(false)}
          mode={aiAssistantMode}
          task={aiAssistantTask}
          isLoading={aiIsLoading}
          content={aiContent}
          onSubmit={handleAISubmit}
          onAddSubtasks={handleAddSubtasksFromAI}
        />
      )}
      
      {isSprintModalOpen && (
        <LearningResourcesModal
            isOpen={isSprintModalOpen}
            onClose={() => setIsSprintModalOpen(false)}
            onGenerateSprint={handleGenerateSprint}
            isLoading={sprintIsLoading}
        />
      )}

      {isFlashcardsModalOpen && (
        <FlashcardsModal 
            isOpen={isFlashcardsModalOpen} 
            onClose={() => setIsFlashcardsModalOpen(false)}
            onSaveAsTask={handleSaveFlashcardsAsTask}
            preloadedFlashcards={preloadedFlashcards}
        />
      )}
      
      {isSettingsModalOpen && (
          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            onClearAllData={handleClearAllData}
          />
      )}

      {isImportSheetModalOpen && (
          <ImportFromSheetModal
            isOpen={isImportSheetModalOpen}
            onClose={() => setIsImportSheetModalOpen(false)}
            onImport={handleImportTasks}
          />
      )}

    </div>
  );
}

export default App;