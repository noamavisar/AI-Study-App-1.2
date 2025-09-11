import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import KanbanBoard from './components/KanbanBoard';
import Timer, { TimerSettings } from './components/Timer';
import BrainDump from './components/BrainDump';
import AddTaskModal from './components/AddTaskModal';
import AIAssistantModal from './components/AIAssistantModal';
import LearningResourcesModal from './components/LearningResourcesModal';
import FlashcardsModal from './components/FlashcardsModal';
import FileManagerModal from './components/FileManagerModal';
import SettingsModal from './components/SettingsModal';
import ImportFromSheetModal from './components/ImportFromSheetModal';
import ProjectManager from './components/ProjectManager';
import ProjectFilesModal from './components/ProjectFilesModal';
import LearningTipBar from './components/LearningTipBar';
import UndoToast from './components/UndoToast';
import ConfirmationModal from './components/ConfirmationModal';
import FlashcardLibrary from './components/FlashcardLibrary';
import { Task, TaskStatus, Priority, Project, Subtask, AIAssistantMode, Flashcard, ResourceType, ProjectFile, LastDeletedTaskInfo, FlashcardDeck, FlashcardReviewStatus } from './types';
import { generateStudySprint, generateFlashcards, generateTaskBreakdown, generateLearningTips, verifyAndCorrectFlashcards } from './services/geminiService';
import { fileToDataUrl, dataUrlToFile, parseGoogleUrl } from './utils/fileUtils';
import { setFile, getFile, deleteFile, clearFiles } from './utils/idb';

// A custom hook for persisting state to localStorage
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      const parsedItem = item ? JSON.parse(item) : initialValue;
      // Data hydration for older versions
      if (key === 'projects' && Array.isArray(parsedItem)) {
          return parsedItem.map((proj: any) => {
              const needsOrderMigration = proj.tasks && proj.tasks.length > 0 && proj.tasks.some((t: any) => t.order === undefined);
              let newTasks = proj.tasks || [];

              if (needsOrderMigration) {
                  newTasks = [...newTasks].sort((a, b) => {
                      const hasDayA = a.day != null;
                      const hasDayB = b.day != null;
                      if (hasDayA && !hasDayB) return -1;
                      if (!hasDayA && hasDayB) return 1;
                      if (hasDayA && hasDayB) return a.day! - b.day!;
                      
                      const dateA = a.dueDate ? new Date(a.dueDate) : null;
                      const dateB = b.dueDate ? new Date(b.dueDate) : null;

                      if (dateA && !dateB) return -1;
                      if (!dateA && dateB) return 1;
                      if (dateA && dateB) return dateA.getTime() - dateB.getTime();
                      
                      return 0;
                  }).map((task: Task, index: number) => ({...task, order: index}));
              }
              
              const flashcardDecks = (proj.flashcardDecks || []).map((deck: any) => ({
                ...deck,
                name: deck.name || deck.topic, // Migrate from topic to name
                flashcards: (deck.flashcards || []).map((card: any) => ({
                  ...card,
                  reviewStatus: card.reviewStatus || FlashcardReviewStatus.New, // Hydrate older cards with default status
                })),
              }));

              // Timer settings migration
              let timerSettings = proj.timerSettings || DEFAULT_TIMER_SETTINGS;
              if (timerSettings.longBreak !== undefined) {
                  timerSettings.exam = 180;
                  delete timerSettings.longBreak;
              }
              if (timerSettings.exam === undefined) {
                  timerSettings.exam = 180;
              }
              if (timerSettings.promptForRitual === undefined) {
                timerSettings.promptForRitual = true;
              }


              return {
                  ...createDefaultProject(), // ensure all keys exist
                  ...proj,
                  timerSettings,
                  flashcardDecks,
                  tasks: newTasks,
                  files: proj.files?.map((f: any) => {
                      const { dataUrl, ...rest } = f; // Remove obsolete dataUrl
                      return rest;
                  }) || [],
              }
          }) as T;
      }
      return parsedItem;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
       if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
            alert('Storage quota exceeded. The application may not save your data correctly. Please free up some space.');
       }
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  pomodoro: 25,
  shortBreak: 5,
  exam: 180,
  promptForRitual: true,
};

const createDefaultProject = (): Project => ({
  id: uuidv4(),
  name: 'My Study Plan',
  tasks: [],
  brainDumpNotes: '',
  timerSettings: DEFAULT_TIMER_SETTINGS,
  pomodoros: 0,
  files: [],
  flashcardDecks: [],
});


const App: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');
  const [projects, setProjects] = useLocalStorage<Project[]>('projects', [createDefaultProject()]);
  const [activeProjectId, setActiveProjectId] = useLocalStorage<string | null>('activeProjectId', projects[0]?.id || null);

  // Modal states
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAIAssistantModalOpen, setIsAIAssistantModalOpen] = useState(false);
  const [isSprintGeneratorOpen, setIsSprintGeneratorOpen] = useState(false);
  const [isFlashcardGeneratorOpen, setIsFlashcardGeneratorOpen] = useState(false);
  const [isFlashcardsModalOpen, setIsFlashcardsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isProjectFilesModalOpen, setIsProjectFilesModalOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);

  // AI Assistant State
  const [aiAssistantMode, setAIAssistantMode] = useState<AIAssistantMode>('breakdown');
  const [aiAssistantTask, setAIAssistantTask] = useState<Task | null>(null);
  const [aiIsLoading, setAiIsLoading] = useState(false);
  const [aiContent, setAiContent] = useState<string | string[] | null>(null);

  // Flashcards state
  const [currentFlashcards, setCurrentFlashcards] = useState<Flashcard[]>([]);
  const [studyingDeckId, setStudyingDeckId] = useState<string | null>(null);
  const [isLatexRendering, setIsLatexRendering] = useState(false);

  // Undo Delete State
  const [lastDeletedTask, setLastDeletedTask] = useState<LastDeletedTaskInfo | null>(null);
  const undoTimeoutRef = useRef<number | null>(null);


  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  const updateActiveProject = useCallback((updater: (project: Project) => Project) => {
    setProjects(prevProjects =>
      prevProjects.map(p => (p.id === activeProjectId ? updater(p) : p))
    );
  }, [activeProjectId, setProjects]);

  // Project Management
  const handleAddProject = (name: string) => {
    const newProject = { ...createDefaultProject(), id: uuidv4(), name };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setIsProjectManagerOpen(false);
  };

  const handleRenameProject = (projectId: string, newName: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, name: newName } : p));
  };
  
  const handleDeleteProject = (projectId: string) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    if (!projectToDelete) return;

    setConfirmation({
      title: 'Delete Project?',
      message: `Are you sure you want to delete the project "${projectToDelete.name}"? This action is permanent.`,
      onConfirm: async () => {
        const fileIdsToDelete = projectToDelete.files.filter(f => f.sourceType === 'local').map(f => f.id);
        await clearFiles(fileIdsToDelete);
        
        const remainingProjects = projects.filter(p => p.id !== projectId);
        setProjects(remainingProjects);
        if (activeProjectId === projectId) {
            setActiveProjectId(remainingProjects[0]?.id || null);
        }
      }
    });
  };

  const handleImportProject = async (projectData: Omit<Project, 'id'>) => {
    const newProject = { ...createDefaultProject(), ...projectData, id: uuidv4() };
    
    const filesToStore: { id: string, dataUrl: string, name: string, type: string }[] = [];
    newProject.files = newProject.files.map(file => {
      const { dataUrl, ...rest } = file as any; // Cast to access potential dataUrl
      if (file.sourceType === 'local' && dataUrl) {
        filesToStore.push({ id: file.id, dataUrl, name: file.name, type: file.type });
        return rest; // Return file object without dataUrl for localStorage
      }
      return rest;
    });

    for (const fileInfo of filesToStore) {
        const file = await dataUrlToFile(fileInfo.dataUrl, fileInfo.name, fileInfo.type);
        await setFile(fileInfo.id, file);
    }

    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
  };


  const handleSwitchProject = (projectId: string) => {
    setActiveProjectId(projectId);
  };

  // Task Management
  const handleAddTask = (task: Omit<Task, 'id' | 'status'>) => {
    if (!activeProject) return;
    const maxOrder = Math.max(...activeProject.tasks.map(t => t.order || 0), 0);
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      status: TaskStatus.ToDo,
      order: maxOrder + 1,
    };
    updateActiveProject(proj => ({ ...proj, tasks: [...proj.tasks, newTask] }));
    setIsAddTaskModalOpen(false);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    updateActiveProject(proj => ({
      ...proj,
      tasks: proj.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
    }));
  };
  
  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = activeProject?.tasks.find(t => t.id === taskId);
    if (taskToDelete && activeProjectId) {
        setLastDeletedTask({ task: taskToDelete, projectId: activeProjectId });
        updateActiveProject(proj => ({
            ...proj,
            tasks: proj.tasks.filter(t => t.id !== taskId)
        }));
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
        }
        undoTimeoutRef.current = window.setTimeout(() => setLastDeletedTask(null), 5000);
    }
  };
  
  const handleUndoDelete = () => {
    if (lastDeletedTask) {
        setProjects(prevProjects =>
            prevProjects.map(p =>
                p.id === lastDeletedTask.projectId
                    ? { ...p, tasks: [...p.tasks, lastDeletedTask.task] }
                    : p
            )
        );
        setLastDeletedTask(null);
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }
  };


  const handleTaskDrop = (draggedTaskId: string, targetTaskId: string | null, newStatus: TaskStatus) => {
      if (!activeProject) return;

      const tasks = [...activeProject.tasks];
      const draggedTaskIndex = tasks.findIndex(t => t.id === draggedTaskId);
      if (draggedTaskIndex === -1) return;

      const draggedTask = { ...tasks[draggedTaskIndex], status: newStatus };
      tasks.splice(draggedTaskIndex, 1);

      let targetIndex = -1;
      if (targetTaskId) {
          targetIndex = tasks.findIndex(t => t.id === targetTaskId);
      } else {
          // If dropped on an empty column, find the index of the first task in the next status column
          const allTasksInNewStatus = tasks.filter(t => t.status === newStatus);
          if (allTasksInNewStatus.length > 0) {
              targetIndex = tasks.findIndex(t => t.id === allTasksInNewStatus[0].id);
          } else {
              // Dropping at the end of all tasks in that column
              targetIndex = tasks.length;
          }
      }

      if (targetIndex !== -1) {
          tasks.splice(targetIndex, 0, draggedTask);
      } else {
          tasks.push(draggedTask); // Fallback: add to end
      }
      
      // Re-order
      const reorderedTasks = tasks.map((task, index) => ({ ...task, order: index }));

      updateActiveProject(proj => ({ ...proj, tasks: reorderedTasks }));
  };

  const handleAddSubtask = (taskId: string, subtaskText: string) => {
    const newSubtask: Subtask = { id: uuidv4(), text: subtaskText, completed: false };
    updateActiveProject(proj => ({
      ...proj,
      tasks: proj.tasks.map(t =>
        t.id === taskId
          ? { ...t, subtasks: [...(t.subtasks || []), newSubtask] }
          : t
      )
    }));
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    updateActiveProject(proj => ({
      ...proj,
      tasks: proj.tasks.map(t =>
        t.id === taskId
          ? { ...t, subtasks: (t.subtasks || []).map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st) }
          : t
      )
    }));
  };

  const handleTimerSettingsChange = (newSettings: TimerSettings) => {
    updateActiveProject(proj => ({ ...proj, timerSettings: newSettings }));
  };

  const handlePomodorosChange = (newCount: number) => {
    updateActiveProject(proj => ({ ...proj, pomodoros: newCount }));
  };

  const handleBrainDumpChange = (notes: string) => {
    updateActiveProject(proj => ({ ...proj, brainDumpNotes: notes }));
  };

  // AI Assistant
  const handleOpenAIAssistant = (mode: AIAssistantMode, task: Task | null = null) => {
    setAIAssistantMode(mode);
    setAIAssistantTask(task);
    setAiContent(null);
    setIsAIAssistantModalOpen(true);
  };
  
  const handleAIAssistantSubmit = async (topic: string) => {
    setAiIsLoading(true);
    setAiContent(null);
    try {
      if (aiAssistantMode === 'breakdown') {
        const description = aiAssistantTask ? aiAssistantTask.description : undefined;
        const subtasks = await generateTaskBreakdown(topic, description);
        setAiContent(subtasks);
      } else {
        const tips = await generateLearningTips(topic);
        setAiContent(tips);
      }
    } catch (error: any) {
      alert(`AI Error: ${error.message}`);
    } finally {
      setAiIsLoading(false);
    }
  };

  const handleAddSubtasksFromAI = (subtasks: string[]) => {
    if (aiAssistantTask) { // Add to existing task
      const newSubtasks = subtasks.map(text => ({ id: uuidv4(), text, completed: false }));
      updateActiveProject(proj => ({
        ...proj,
        tasks: proj.tasks.map(t => t.id === aiAssistantTask.id ? { ...t, subtasks: [...(t.subtasks || []), ...newSubtasks] } : t)
      }));
    } else { // Add as new tasks
      const newTasks = subtasks.map((title, index) => ({
        id: uuidv4(),
        title,
        description: '',
        status: TaskStatus.ToDo,
        priority: Priority.ImportantNotUrgent,
        estimatedTime: 15,
        order: (activeProject?.tasks.length || 0) + index + 1
      }));
      updateActiveProject(proj => ({ ...proj, tasks: [...proj.tasks, ...newTasks] }));
    }
    setIsAIAssistantModalOpen(false);
  };

  // Sprint Generator
  const handleGenerateSprint = async (topic: string, duration: number, resources: ResourceType[], files: File[], linkFiles: ProjectFile[]) => {
      setAiIsLoading(true);
      try {
          const sprintTasks = await generateStudySprint(topic, duration, resources, files, linkFiles);
          if (sprintTasks.length > 0) {
              const maxOrder = Math.max(...(activeProject?.tasks.map(t => t.order || 0) || [0]));
              const newTasks: Task[] = sprintTasks.map((task, index) => ({
                  ...task,
                  id: uuidv4(),
                  status: TaskStatus.ToDo,
                  priority: Priority.ImportantNotUrgent,
                  order: maxOrder + index + 1,
              } as Task));
              updateActiveProject(proj => ({...proj, tasks: [...proj.tasks, ...newTasks]}));
              setIsSprintGeneratorOpen(false);
          } else {
            alert("The AI didn't generate any tasks. Please try a different topic or check your files.");
          }
      } catch (error: any) {
          alert(`AI Error: ${error.message}`);
      } finally {
          setAiIsLoading(false);
      }
  };

  // Flashcards
  const handleGenerateFlashcards = async (topic: string, files: File[], linkFiles: ProjectFile[]) => {
      setAiIsLoading(true);
      try {
          const generatedCards = await generateFlashcards(topic, files, linkFiles);
          const verifiedCards = await verifyAndCorrectFlashcards(generatedCards);
          
          if (verifiedCards.length > 0) {
              const newDeck: FlashcardDeck = {
                id: uuidv4(),
                name: topic,
                flashcards: verifiedCards.map(c => ({...c, reviewStatus: FlashcardReviewStatus.New })),
                createdAt: new Date().toISOString(),
              };
              updateActiveProject(proj => ({
                ...proj,
                flashcardDecks: [...proj.flashcardDecks, newDeck]
              }));
              setIsFlashcardGeneratorOpen(false);
              // Open the study modal for the newly created deck
              setCurrentFlashcards(newDeck.flashcards);
              setStudyingDeckId(newDeck.id);
              setIsFlashcardsModalOpen(true);
          } else {
              alert("The AI didn't generate any flashcards. Please try again.");
          }
      } catch (error: any) {
          alert(`AI Error: ${error.message}`);
      } finally {
          setAiIsLoading(false);
      }
  };

  const handleOpenFlashcardsModal = (deck: FlashcardDeck) => {
    setCurrentFlashcards(deck.flashcards);
    setStudyingDeckId(deck.id);
    setIsFlashcardsModalOpen(true);
  };

  const handleUpdateFlashcardStatus = (deckId: string, cardIndex: number, status: FlashcardReviewStatus) => {
      updateActiveProject(proj => ({
          ...proj,
          flashcardDecks: proj.flashcardDecks.map(deck => {
              if (deck.id === deckId) {
                  const newFlashcards = [...deck.flashcards];
                  newFlashcards[cardIndex] = { ...newFlashcards[cardIndex], reviewStatus: status };
                  return { ...deck, flashcards: newFlashcards };
              }
              return deck;
          })
      }));
  };

  const handleForceRenderFlashcards = async () => {
    setIsLatexRendering(true);
    try {
        const correctedCards = await verifyAndCorrectFlashcards(currentFlashcards);
        setCurrentFlashcards(correctedCards);
        if (studyingDeckId) {
             updateActiveProject(proj => ({
                ...proj,
                flashcardDecks: proj.flashcardDecks.map(d => d.id === studyingDeckId ? {...d, flashcards: correctedCards} : d)
             }));
        }
    } catch (error: any) {
        alert(`Failed to correct formulas: ${error.message}`);
    } finally {
        setIsLatexRendering(false);
    }
  };

  const handleDeleteDeck = (deckId: string) => {
    const deckToDelete = activeProject?.flashcardDecks.find(d => d.id === deckId);
    if (!deckToDelete) return;
    
    setConfirmation({
        title: "Delete Deck?",
        message: `Are you sure you want to delete the flashcard deck "${deckToDelete.name}"?`,
        onConfirm: () => {
             updateActiveProject(proj => ({
                ...proj,
                flashcardDecks: proj.flashcardDecks.filter(d => d.id !== deckId)
            }));
        }
    });
  };

  const handleUpdateDeckName = (deckId: string, newName: string) => {
    updateActiveProject(proj => ({
        ...proj,
        flashcardDecks: proj.flashcardDecks.map(d => d.id === deckId ? {...d, name: newName} : d)
    }));
  };

  // Files
  const handleAddFiles = async (files: FileList) => {
    const newProjectFiles: ProjectFile[] = [];
    for (const file of Array.from(files)) {
      const newFile: ProjectFile = {
        id: uuidv4(),
        name: file.name,
        type: file.type,
        size: file.size,
        sourceType: 'local',
      };
      await setFile(newFile.id, file);
      newProjectFiles.push(newFile);
    }
    updateActiveProject(proj => ({ ...proj, files: [...proj.files, ...newProjectFiles] }));
  };

  const handleAddLinkFile = (url: string, name: string) => {
    const { type } = parseGoogleUrl(url);
    const newFile: ProjectFile = {
        id: uuidv4(),
        name: name,
        type: type, // Custom type for links
        size: 0,
        sourceType: 'link',
        url: url
    };
    updateActiveProject(proj => ({...proj, files: [...proj.files, newFile]}));
  };

  const handleDeleteFile = async (fileId: string) => {
    const fileToDelete = activeProject?.files.find(f => f.id === fileId);
    if (!fileToDelete) return;
    
    if (fileToDelete.sourceType === 'local') {
        await deleteFile(fileId);
    }
    updateActiveProject(proj => ({ ...proj, files: proj.files.filter(f => f.id !== fileId)}));
  };
  
  // Settings
  const handleClearAllData = () => {
    setConfirmation({
        title: 'Delete All Data?',
        message: 'This will permanently delete all projects, tasks, and files. This action cannot be undone.',
        onConfirm: () => {
            window.localStorage.clear();
            clearFiles([]).catch(console.error); // This will clear all files in IDB
            window.location.reload();
        }
    });
  };

  if (!activeProject) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="text-center">
            <h1 className="text-2xl font-bold text-jam-dark dark:text-slate-100 mb-4">No Active Project</h1>
            <p className="text-slate-600 dark:text-slate-300 mb-6">Create a new project to get started.</p>
            <button
                onClick={() => {
                    const newProject = createDefaultProject();
                    setProjects([newProject]);
                    setActiveProjectId(newProject.id);
                }}
                className="px-6 py-3 text-lg font-semibold text-white bg-jam-dark rounded-lg hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-700 transition-colors shadow-lg"
            >
                Create First Project
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jam-yellow-light dark:bg-slate-900">
      <Header
        activeProject={activeProject}
        projects={projects}
        onSwitchProject={handleSwitchProject}
        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        onAddTask={() => setIsAddTaskModalOpen(true)}
        onOpenSprintGenerator={() => setIsSprintGeneratorOpen(true)}
        onOpenFlashcardGenerator={() => setIsFlashcardGeneratorOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenProjectFilesModal={() => setIsProjectFilesModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
      />
      <LearningTipBar />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <KanbanBoard
              tasks={activeProject.tasks}
              onTaskDrop={handleTaskDrop}
              onDeleteTask={handleDeleteTask}
              onAddSubtask={handleAddSubtask}
              onToggleSubtask={handleToggleSubtask}
              onUpdateTask={handleUpdateTask}
              onUpdateTaskTime={(id, time) => handleUpdateTask(id, { estimatedTime: time })}
              onUpdateTaskPriority={(id, prio) => handleUpdateTask(id, { priority: prio })}
              onUpdateTaskDueDate={(id, date) => handleUpdateTask(id, { dueDate: date })}
              onOpenAIAssistant={handleOpenAIAssistant}
              onOpenFlashcardTask={handleOpenFlashcardsModal}
            />
          </div>
          <div className="space-y-6">
            <Timer 
                settings={activeProject.timerSettings}
                pomodoros={activeProject.pomodoros}
                onSettingsChange={handleTimerSettingsChange}
                onPomodorosChange={handlePomodorosChange}
            />
            <FlashcardLibrary
                decks={activeProject.flashcardDecks}
                onStudyDeck={handleOpenFlashcardsModal}
                onDeleteDeck={handleDeleteDeck}
                onUpdateDeckName={handleUpdateDeckName}
            />
            <BrainDump 
                notes={activeProject.brainDumpNotes}
                onNotesChange={handleBrainDumpChange}
            />
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
          onSubmit={handleAIAssistantSubmit}
          onAddSubtasks={handleAddSubtasksFromAI}
        />
      )}
      {isSprintGeneratorOpen && (
        <LearningResourcesModal 
            isOpen={isSprintGeneratorOpen}
            onClose={() => setIsSprintGeneratorOpen(false)}
            onGenerate={handleGenerateSprint}
            isLoading={aiIsLoading}
            projectFiles={activeProject.files}
        />
      )}
      {isFlashcardGeneratorOpen && (
        <FileManagerModal
            isOpen={isFlashcardGeneratorOpen}
            onClose={() => setIsFlashcardGeneratorOpen(false)}
            onGenerate={handleGenerateFlashcards}
            isLoading={aiIsLoading}
            projectFiles={activeProject.files}
        />
      )}
      {isFlashcardsModalOpen && (
        <FlashcardsModal
          isOpen={isFlashcardsModalOpen}
          onClose={() => setIsFlashcardsModalOpen(false)}
          flashcards={currentFlashcards}
          onForceRender={handleForceRenderFlashcards}
          isRendering={isLatexRendering}
          studyingDeckId={studyingDeckId}
          onUpdateFlashcardStatus={handleUpdateFlashcardStatus}
          maxWidth="max-w-2xl"
        />
      )}
      {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onClearAllData={handleClearAllData} />}
      {isImportModalOpen && <ImportFromSheetModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={(tasks) => {
          tasks.forEach(t => handleAddTask(t));
          setIsImportModalOpen(false);
      }} />}
      {isProjectManagerOpen && (
        <ProjectManager
          isOpen={isProjectManagerOpen}
          onClose={() => setIsProjectManagerOpen(false)}
          projects={projects}
          onAddProject={handleAddProject}
          onRenameProject={handleRenameProject}
          onDeleteProject={handleDeleteProject}
          onImportProject={handleImportProject}
        />
      )}
      {isProjectFilesModalOpen && (
        <ProjectFilesModal
            isOpen={isProjectFilesModalOpen}
            onClose={() => setIsProjectFilesModalOpen(false)}
            files={activeProject.files}
            onAddFiles={handleAddFiles}
            onAddLinkFile={handleAddLinkFile}
            onDeleteFile={handleDeleteFile}
        />
      )}
      {confirmation && (
        <ConfirmationModal
            isOpen={true}
            onClose={() => setConfirmation(null)}
            onConfirm={confirmation.onConfirm}
            title={confirmation.title}
            message={confirmation.message}
        />
      )}
      <UndoToast
        lastDeletedTaskInfo={lastDeletedTask}
        onUndo={handleUndoDelete}
        onDismiss={() => setLastDeletedTask(null)}
      />
    </div>
  );
};

export default App;
