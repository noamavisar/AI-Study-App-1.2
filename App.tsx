
import React, { useState, useCallback, useEffect } from 'react';
import { Task, TaskStatus, AIAssistantMode, Priority, LearningResource, Flashcard, Subtask, Theme } from './types';
import Header from './components/Header';
import KanbanBoard from './components/KanbanBoard';
import AddTaskModal from './components/AddTaskModal';
import AIAssistantModal from './components/AIAssistantModal';
import Timer from './components/Timer';
import BrainDump from './components/BrainDump';
import LearningResourcesModal from './components/LearningResourcesModal';
import FlashcardsModal from './components/FlashcardsModal';
import LearningTipBar from './components/LearningTipBar';
import SettingsModal from './components/SettingsModal';
import ImportFromSheetModal from './components/ImportFromSheetModal';
import { breakdownTaskIntoSubtasks, getLearningTipsForTopic, generateStudySprint } from './services/geminiService';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [isAIAssistantModalOpen, setAIAssistantModalOpen] = useState(false);
  const [isResourcesModalOpen, setResourcesModalOpen] = useState(false);
  const [isFlashcardsModalOpen, setFlashcardsModalOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [aiAssistantMode, setAiAssistantMode] = useState<AIAssistantMode>('breakdown');
  const [selectedTaskForAI, setSelectedTaskForAI] = useState<Task | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiContent, setAiContent] = useState<string | string[] | null>(null);
  const [focusScore, setFocusScore] = useState(0);
  const [theme, setTheme] = useState<Theme>('light');
  const [preloadedFlashcards, setPreloadedFlashcards] = useState<Flashcard[] | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('studySprintTheme') as Theme | null;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('studySprintTheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    // Load tasks from local storage on initial render
    try {
      const storedTasks = localStorage.getItem('studySprintTasks');
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      } else {
         // Add some default tasks for first-time users
        setTasks([
            { id: '1', title: 'Review Chapter 1: Kinematics', description: 'Focus on equations of motion.', status: TaskStatus.ToDo, priority: Priority.UrgentImportant, estimatedTime: 60, subtasks: [{id: 'st1', text: 'Read summary', completed: true}, {id: 'st2', text: 'Review formulas', completed: false}] },
            { id: '2', title: 'Practice Stoichiometry Problems', description: 'Complete 10 problems from the textbook.', status: TaskStatus.ToDo, priority: Priority.ImportantNotUrgent, estimatedTime: 90 },
            { id: '3', title: 'Draft Essay Outline', description: 'Create a structure for the history essay on the French Revolution.', status: TaskStatus.InProgress, priority: Priority.UrgentImportant, estimatedTime: 45 },
            { id: '4', title: 'Memorize Vocabulary List', description: 'Use flashcards for Spanish vocabulary.', status: TaskStatus.Done, priority: Priority.ImportantNotUrgent, estimatedTime: 30 },
        ]);
      }
       const storedScore = localStorage.getItem('studySprintFocusScore');
       if (storedScore) {
           setFocusScore(JSON.parse(storedScore));
       }
    } catch (e) {
      console.error("Failed to load data from local storage", e);
    }
  }, []);

  useEffect(() => {
    // Save tasks and score to local storage whenever they change
    try {
      localStorage.setItem('studySprintTasks', JSON.stringify(tasks));
      localStorage.setItem('studySprintFocusScore', JSON.stringify(focusScore));
    } catch (e) {
      console.error("Failed to save data to local storage", e);
    }
  }, [tasks, focusScore]);


  const handleAddTask = useCallback((task: Omit<Task, 'id' | 'status'>) => {
    setTasks(prev => [...prev, { ...task, id: Date.now().toString(), status: TaskStatus.ToDo }]);
    setAddTaskModalOpen(false);
  }, []);

  const handleUpdateTaskStatus = useCallback((taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => {
        const newTasks = [...prev];
        const taskIndex = newTasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return prev;

        const task = newTasks[taskIndex];
        
        const hasIncompleteSubtasks = task.subtasks?.some(st => !st.completed);
        if (newStatus === TaskStatus.Done && hasIncompleteSubtasks) {
            alert("Please complete all subtasks before marking the main task as done.");
            return prev;
        }

        if (task.status !== TaskStatus.Done && newStatus === TaskStatus.Done) {
            setFocusScore(s => s + (task.estimatedTime / 5) || 10);
        }
        
        newTasks[taskIndex] = { ...task, status: newStatus };
        return newTasks;
    });
  }, []);

  const handleUpdateTaskPriority = useCallback((taskId: string, newPriority: Priority) => {
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, priority: newPriority } : task));
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  const handleToggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(task => {
        if (task.id === taskId) {
            const updatedSubtasks = task.subtasks?.map(st => 
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
            );
            return { ...task, subtasks: updatedSubtasks };
        }
        return task;
    }));
  }, []);

  const handleAddSubtask = useCallback((taskId: string, subtaskText: string) => {
      setTasks(prev => prev.map(task => {
          if (task.id === taskId && subtaskText.trim()) {
              const newSubtask: Subtask = {
                  id: Date.now().toString(),
                  text: subtaskText.trim(),
                  completed: false,
              };
              const subtasks = task.subtasks ? [...task.subtasks, newSubtask] : [newSubtask];
              return { ...task, subtasks };
          }
          return task;
      }));
  }, []);
  
  const openAIAssistant = (mode: AIAssistantMode, task: Task | null) => {
    setAiAssistantMode(mode);
    setSelectedTaskForAI(task);
    setAiContent(null);
    setAIAssistantModalOpen(true);
  };

  const handleAIAssistantSubmit = async (topic: string) => {
    setIsLoadingAI(true);
    setAiContent(null);
    try {
      if (aiAssistantMode === 'breakdown') {
        const subtasks = await breakdownTaskIntoSubtasks(topic);
        setAiContent(subtasks);
      } else {
        const tips = await getLearningTipsForTopic(topic);
        setAiContent(tips);
      }
    } catch (e) {
      console.error("AI Assistant Error:", e);
      setAiContent("Sorry, I couldn't generate a response. Please check your API key and try again.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const addSubtasksToBoard = (subtasks: string[]) => {
    if (!selectedTaskForAI) { // This case handles breakdown from header for general topics
        const newTasks: Task[] = subtasks.map((title, index) => ({
          id: `ai-${Date.now()}-${index}`,
          title,
          description: `Generated from a general topic breakdown`,
          status: TaskStatus.ToDo,
          priority: Priority.ImportantNotUrgent, 
          estimatedTime: 30,
        }));
        setTasks(prev => [...prev, ...newTasks]);
    } else { // This case adds the generated list as subtasks to the selected task
        setTasks(prev => prev.map(task => {
            if (task.id === selectedTaskForAI.id) {
                const newSubtasks: Subtask[] = subtasks.map((text, index) => ({
                    id: `ai-sub-${Date.now()}-${index}`,
                    text,
                    completed: false,
                }));
                const existingSubtasks = task.subtasks || [];
                return { ...task, subtasks: [...existingSubtasks, ...newSubtasks] };
            }
            return task;
        }));
    }
    setAIAssistantModalOpen(false);
  };

  const handleGenerateSprint = async (resources: Omit<LearningResource, 'id'>[], days: number) => {
    setIsLoadingAI(true);
    try {
        const generatedTasks = await generateStudySprint(resources, days);
        const newTasks: Task[] = generatedTasks.map((task, index) => ({
            ...task,
            id: `sprint-${Date.now()}-${index}`,
            status: TaskStatus.ToDo,
            description: task.day ? `Day ${task.day}: ${task.description}` : task.description,
        }));
        setTasks(prev => [...prev, ...newTasks]);
        setResourcesModalOpen(false);
    } catch (e) {
        console.error("Sprint Generation Error:", e);
        alert("Sorry, I couldn't generate a study plan. Please check your files and try again.");
    } finally {
        setIsLoadingAI(false);
    }
  };
  
  const handleSaveFlashcardsAsTask = useCallback((prompt: string, flashcards: Flashcard[]) => {
    const newTitle = `Review: ${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}`;
    const newTask: Task = {
      id: `flashcard-task-${Date.now()}`,
      title: newTitle,
      description: `Review the ${flashcards.length} AI-generated flashcards for this topic.`,
      status: TaskStatus.ToDo,
      priority: Priority.ImportantNotUrgent,
      estimatedTime: Math.max(15, Math.round(flashcards.length * 0.75)),
      flashcards: flashcards,
    };
    setTasks(prev => [newTask, ...prev]);
    setFlashcardsModalOpen(false);
  }, []);

  const handleOpenFlashcardTask = (task: Task) => {
    if (task.flashcards) {
      setPreloadedFlashcards(task.flashcards);
      setFlashcardsModalOpen(true);
    }
  };

  const handleImportFromSheet = useCallback((importedTasks: Omit<Task, 'id'>[]) => {
    const newTasks = importedTasks.map((task, index) => ({
        ...task,
        id: `imported-${Date.now()}-${index}`,
    }));
    setTasks(prev => [...prev, ...newTasks]);
    setImportModalOpen(false);
  }, []);

  const handleClearAllData = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all your study data? This action cannot be undone.')) {
        try {
            localStorage.clear();
            window.location.reload();
        } catch (e) {
            console.error("Failed to clear local storage", e);
            alert("There was an error clearing your data.");
        }
    }
  }, []);


  return (
    <div className="min-h-screen font-sans">
      <Header 
        onAddTask={() => setAddTaskModalOpen(true)} 
        onBreakdownTopic={() => openAIAssistant('breakdown', null)}
        onPlanSprint={() => setResourcesModalOpen(true)}
        onImportFromSheet={() => setImportModalOpen(true)}
        onGenerateFlashcards={() => {
          setPreloadedFlashcards(null);
          setFlashcardsModalOpen(true);
        }}
        onOpenSettings={() => setSettingsModalOpen(true)}
        focusScore={Math.round(focusScore)}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <LearningTipBar />
      
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <KanbanBoard 
              tasks={tasks} 
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onUpdateTaskPriority={handleUpdateTaskPriority}
              onDeleteTask={handleDeleteTask}
              onOpenAIAssistant={openAIAssistant}
              onToggleSubtask={handleToggleSubtask}
              onAddSubtask={handleAddSubtask}
              onOpenFlashcardTask={handleOpenFlashcardTask}
            />
          </div>
          <div className="lg:col-span-1 space-y-8">
             <Timer />
             <BrainDump />
          </div>
        </div>
      </main>

      {isAddTaskModalOpen && (
        <AddTaskModal 
          onClose={() => setAddTaskModalOpen(false)}
          onAddTask={handleAddTask}
        />
      )}

      {isResourcesModalOpen && (
        <LearningResourcesModal
            isOpen={isResourcesModalOpen}
            onClose={() => setResourcesModalOpen(false)}
            onGenerateSprint={handleGenerateSprint}
            isLoading={isLoadingAI}
        />
      )}

      {isFlashcardsModalOpen && (
        <FlashcardsModal
            isOpen={isFlashcardsModalOpen}
            onClose={() => setFlashcardsModalOpen(false)}
            onSaveAsTask={handleSaveFlashcardsAsTask}
            preloadedFlashcards={preloadedFlashcards}
        />
      )}

      {isImportModalOpen && (
          <ImportFromSheetModal
            isOpen={isImportModalOpen}
            onClose={() => setImportModalOpen(false)}
            onImport={handleImportFromSheet}
          />
      )}

      {isAIAssistantModalOpen && (
        <AIAssistantModal
          isOpen={isAIAssistantModalOpen}
          onClose={() => setAIAssistantModalOpen(false)}
          mode={aiAssistantMode}
          task={selectedTaskForAI}
          isLoading={isLoadingAI}
          content={aiContent}
          onSubmit={handleAIAssistantSubmit}
          onAddSubtasks={addSubtasksToBoard}
        />
      )}
      
      {isSettingsModalOpen && (
        <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setSettingsModalOpen(false)}
            onClearAllData={handleClearAllData}
        />
      )}
    </div>
  );
};

export default App;