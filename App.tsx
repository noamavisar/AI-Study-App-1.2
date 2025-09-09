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
import { Task, TaskStatus, Priority, Project, Subtask, AIAssistantMode, Flashcard, ResourceType, ProjectFile, LastDeletedTaskInfo } from './types';
import { generateStudySprint, generateFlashcards, generateTaskBreakdown, generateLearningTips } from './services/geminiService';
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
          return parsedItem.map((proj: any) => ({
              ...createDefaultProject(), // ensure all keys exist
              ...proj,
              files: proj.files?.map((f: any) => {
                  const { dataUrl, ...rest } = f; // Remove obsolete dataUrl
                  return rest;
              }) || [],
          })) as T;
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
  longBreak: 15,
};

const createDefaultProject = (): Project => ({
  id: uuidv4(),
  name: 'My Study Plan',
  tasks: [],
  brainDumpNotes: '',
  timerSettings: DEFAULT_TIMER_SETTINGS,
  pomodoros: 0,
  files: [],
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
  const [generatedFlashcards, setGeneratedFlashcards] = useState<Flashcard[]>([]);
  const [flashcardTopic, setFlashcardTopic] = useState('');

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

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  useEffect(() => {
    // If the active project doesn't exist (e.g., it was deleted), switch to the first one.
    if (!projects.find(p => p.id === activeProjectId) && projects.length > 0) {
      setActiveProjectId(projects[0].id);
    } 
    // If there are no projects at all, create a default one.
    else if (projects.length === 0) {
      const newProject = createDefaultProject();
      setProjects([newProject]);
      setActiveProjectId(newProject.id);
    }
  }, [projects, activeProjectId, setActiveProjectId, setProjects]);


  const updateProject = useCallback((projectId: string, updates: Partial<Omit<Project, 'id'>>) => {
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId ? { ...p, ...updates } : p
      )
    );
  }, [setProjects]);

  // Project handlers
  const handleAddProject = (name: string) => {
    const newProject: Project = {
      id: uuidv4(),
      name,
      tasks: [],
      brainDumpNotes: '',
      timerSettings: DEFAULT_TIMER_SETTINGS,
      pomodoros: 0,
      files: [],
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
  };

  const handleSwitchProject = (projectId: string) => setActiveProjectId(projectId);

  const handleRenameProject = (projectId: string, newName: string) => {
    updateProject(projectId, { name: newName });
  };
  
  const handleDeleteProject = (projectId: string) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    if (!projectToDelete) return;

    if (projects.length <= 1) {
      alert("You cannot delete the only project.");
      return;
    }

    const confirmDelete = async () => {
      const fileIdsToDelete = projectToDelete.files.filter(f => f.sourceType === 'local').map(f => f.id);
      if (fileIdsToDelete.length > 0) {
        await clearFiles(fileIdsToDelete);
      }
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
    };

    setConfirmation({
      title: "Delete Project",
      message: `Are you sure you want to delete the "${projectToDelete.name}" project? This cannot be undone.`,
      onConfirm: confirmDelete,
    });
  };


  const handleImportProject = async (projectData: any) => {
      const { files, ...restOfProject } = projectData;

      const newProject: Project = {
          ...createDefaultProject(),
          ...restOfProject,
          id: uuidv4(),
          files: [],
      };

      // Import files to IndexedDB
      if (Array.isArray(files)) {
          for (const fileInfo of files) {
              if (fileInfo.sourceType === 'local' && fileInfo.dataUrl) {
                  const file = await dataUrlToFile(fileInfo.dataUrl, fileInfo.name, fileInfo.type);
                  const newFile: ProjectFile = {
                      id: uuidv4(),
                      name: fileInfo.name,
                      type: fileInfo.type,
                      size: file.size,
                      sourceType: 'local'
                  };
                  await setFile(newFile.id, file);
                  newProject.files.push(newFile);
              } else if (fileInfo.sourceType === 'link') {
                  newProject.files.push({ ...fileInfo, id: uuidv4() });
              }
          }
      }
      
      setProjects(prev => [...prev, newProject]);
      setActiveProjectId(newProject.id);
  };

  // Task handlers
  const handleAddTask = (taskData: Omit<Task, 'id' | 'status'>) => {
    if (!activeProject) return;
    const newTask: Task = {
      ...taskData,
      id: uuidv4(),
      status: TaskStatus.ToDo,
    };
    updateProject(activeProject.id, { tasks: [...activeProject.tasks, newTask] });
    setIsAddTaskModalOpen(false);
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    if (!activeProject) return;
    const newTasks = activeProject.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    updateProject(activeProject.id, { tasks: newTasks });
  };
  
  const handleDeleteTask = (taskId: string) => {
    if (!activeProjectId) return;

    let taskToDelete: Task | undefined;
    
    setProjects(prevProjects => {
      return prevProjects.map(p => {
        if (p.id === activeProjectId) {
          taskToDelete = p.tasks.find(t => t.id === taskId);
          return { ...p, tasks: p.tasks.filter(t => t.id !== taskId) };
        }
        return p;
      });
    });

    if (taskToDelete) {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
      setLastDeletedTask({ task: taskToDelete, projectId: activeProjectId });
      undoTimeoutRef.current = window.setTimeout(() => {
        setLastDeletedTask(null);
      }, 5000); // 5 seconds to undo
    }
  };

  const handleUndoDeleteTask = () => {
    if (!lastDeletedTask) return;

    setProjects(prevProjects => 
      prevProjects.map(p => {
        if (p.id === lastDeletedTask.projectId) {
          return { ...p, tasks: [...p.tasks, lastDeletedTask.task] };
        }
        return p;
      })
    );
    
    if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
    }
    setLastDeletedTask(null);
  };

  const handleAddSubtask = (taskId: string, subtaskText: string) => {
    if (!activeProject) return;
    const newSubtask: Subtask = { id: uuidv4(), text: subtaskText, completed: false };
    const newTasks = activeProject.tasks.map(t =>
      t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), newSubtask] } : t
    );
    updateProject(activeProject.id, { tasks: newTasks });
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    if (!activeProject) return;
    const newTasks = activeProject.tasks.map(t => {
      if (t.id === taskId) {
        const newSubtasks = (t.subtasks || []).map(st =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return { ...t, subtasks: newSubtasks };
      }
      return t;
    });
    updateProject(activeProject.id, { tasks: newTasks });
  };
  
  const handleUpdateTaskTime = (taskId: string, newTime: number) => {
    if (!activeProject) return;
    const newTasks = activeProject.tasks.map(t => t.id === taskId ? { ...t, estimatedTime: newTime } : t);
    updateProject(activeProject.id, { tasks: newTasks });
  };
  
  const handleUpdateTaskPriority = (taskId: string, newPriority: Priority) => {
    if (!activeProject) return;
    const newTasks = activeProject.tasks.map(t => t.id === taskId ? { ...t, priority: newPriority } : t);
    updateProject(activeProject.id, { tasks: newTasks });
  };

  const handleUpdateTaskDueDate = (taskId: string, newDueDate: string) => {
    if (!activeProject) return;
    const newTasks = activeProject.tasks.map(t => t.id === taskId ? { ...t, dueDate: newDueDate } : t);
    updateProject(activeProject.id, { tasks: newTasks });
  };

  // AI Handlers
  const handleOpenAIAssistant = (mode: AIAssistantMode, task: Task) => {
    setAIAssistantMode(mode);
    setAIAssistantTask(task);
    setAiContent(null);
    setIsAIAssistantModalOpen(true);
  };
  
  const handleAIAssistantSubmit = async (topic: string) => {
    setAiIsLoading(true);
    setAiContent(null);
    try {
      if (aiAssistantMode === 'breakdown' && aiAssistantTask) {
        const subtasks = await generateTaskBreakdown(aiAssistantTask.title, aiAssistantTask.description);
        setAiContent(subtasks);
      } else if (aiAssistantMode === 'tips') {
        const tips = await generateLearningTips(topic);
        setAiContent(tips);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to get AI response. Please check your API key and network connection.');
    } finally {
      setAiIsLoading(false);
    }
  };

  const handleAddSubtasksFromAI = (subtasks: string[]) => {
    if (!activeProject || !aiAssistantTask) return;
    const newSubtasks: Subtask[] = subtasks.map(text => ({ id: uuidv4(), text, completed: false }));
    const newTasks = activeProject.tasks.map(t =>
      t.id === aiAssistantTask.id ? { ...t, subtasks: [...(t.subtasks || []), ...newSubtasks] } : t
    );
    updateProject(activeProject.id, { tasks: newTasks });
    setIsAIAssistantModalOpen(false);
  };

  const handleGenerateSprint = async (topic: string, duration: number, resources: ResourceType[], files: File[], linkFiles: ProjectFile[]) => {
    if (!activeProject) return;
    setAiIsLoading(true);
    try {
        const sprintTasks = await generateStudySprint(topic, duration, resources, files, linkFiles);
        const newTasks: Task[] = sprintTasks.map(sprintTask => ({
            ...sprintTask,
            id: uuidv4(),
            status: TaskStatus.ToDo,
            priority: Priority.ImportantNotUrgent,
            estimatedTime: 120, // Default time
        }));
        updateProject(activeProject.id, { tasks: [...activeProject.tasks, ...newTasks] });
        setIsSprintGeneratorOpen(false);
    } catch (error) {
        console.error(error);
        alert('Failed to generate study sprint. Please try again.');
    } finally {
        setAiIsLoading(false);
    }
  };
  
  const handleGenerateFlashcards = async (topic: string, files: File[], linkFiles: ProjectFile[]) => {
    if (!activeProject) return;
    setAiIsLoading(true);
    try {
        const flashcards = await generateFlashcards(topic, files, linkFiles);
        setFlashcardTopic(topic);
        setGeneratedFlashcards(flashcards);
        setCurrentFlashcards(flashcards);
        setIsFlashcardGeneratorOpen(false);
        setIsFlashcardsModalOpen(true);
    } catch (error) {
        console.error(error);
        alert('Failed to generate flashcards. Please try again.');
    } finally {
        setAiIsLoading(false);
    }
  };
  
  const handleSaveFlashcardsAsTask = () => {
    if (!activeProject || generatedFlashcards.length === 0) return;
    const newTask: Omit<Task, 'id' | 'status'> = {
        title: `Study: Flashcards for ${flashcardTopic}`,
        description: 'Review the generated flashcards to master the key concepts.',
        priority: Priority.ImportantNotUrgent,
        estimatedTime: 30,
        flashcards: generatedFlashcards,
    };
    handleAddTask(newTask);
    setIsFlashcardsModalOpen(false);
    setGeneratedFlashcards([]);
    setFlashcardTopic('');
  };

  const handleOpenFlashcardTask = (flashcards: Flashcard[]) => {
    setCurrentFlashcards(flashcards);
    setIsFlashcardsModalOpen(true);
  };

  // Other handlers
  const handleImportTasks = (importedTasks: Omit<Task, 'id'>[]) => {
    if (!activeProject) return;
    const newTasks: Task[] = importedTasks.map(task => ({
        ...task,
        id: uuidv4(),
    }));
    updateProject(activeProject.id, { tasks: [...activeProject.tasks, ...newTasks] });
    setIsImportModalOpen(false);
  };

  const handleClearAllData = async () => {
    setConfirmation({
        title: "Clear All Data",
        message: "Are you sure you want to delete ALL data for ALL projects? This action is permanent and cannot be undone.",
        onConfirm: async () => {
          const allFileIds = projects.flatMap(p => p.files.filter(f => f.sourceType === 'local').map(f => f.id));
          if (allFileIds.length > 0) {
            await clearFiles(allFileIds);
          }
          const newProject = createDefaultProject();
          setProjects([newProject]);
          setActiveProjectId(newProject.id);
          setIsSettingsOpen(false);
        }
    });
  };
  
  // File handlers
  const handleAddFiles = async (files: FileList) => {
    const targetProjectId = activeProjectId;
    if (!targetProjectId) return;

    const filesToProcess = Array.from(files);
    
    setProjects(prevProjects => {
      const project = prevProjects.find(p => p.id === targetProjectId);
      if (!project) return prevProjects;
    
      const existingFileNames = new Set(project.files.map(f => f.name));
      const newFilesToAdd: ProjectFile[] = [];
      const filesToUpdate: { file: File, existing: ProjectFile }[] = [];

      filesToProcess.forEach(file => {
        if (existingFileNames.has(file.name)) {
          if (window.confirm(`A file named "${file.name}" already exists. Do you want to replace it?`)) {
            const existingFile = project.files.find(f => f.name === file.name)!;
            filesToUpdate.push({ file, existing: existingFile });
          }
        } else {
          newFilesToAdd.push({
            id: uuidv4(), name: file.name, type: file.type, size: file.size, sourceType: 'local'
          });
        }
      });
      
      (async () => {
        for(const newFile of newFilesToAdd) {
            const fileObj = filesToProcess.find(f => f.name === newFile.name);
            if (fileObj) await setFile(newFile.id, fileObj);
        }
        for(const { file, existing } of filesToUpdate) {
            await setFile(existing.id, file);
        }
      })();
      
      const filesWithoutUpdates = project.files.filter(f => !filesToUpdate.some(u => u.existing.id === f.id));

      return prevProjects.map(p => 
        p.id === targetProjectId ? { ...p, files: [...filesWithoutUpdates, ...newFilesToAdd] } : p
      );
    });
  };
  
  const handleAddLinkFile = (url: string, name: string) => {
    if (!activeProject) return;
    const newLinkFile: ProjectFile = {
      id: uuidv4(),
      name,
      type: parseGoogleUrl(url).type,
      size: 0,
      sourceType: 'link',
      url,
    };
    updateProject(activeProject.id, { files: [...activeProject.files, newLinkFile] });
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!activeProject) return;
    const fileToDelete = activeProject.files.find(f => f.id === fileId);
    if (fileToDelete?.sourceType === 'local') {
      await deleteFile(fileId);
    }
    const newFiles = activeProject.files.filter(f => f.id !== fileId);
    updateProject(activeProject.id, { files: newFiles });
  };

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-jam-dark dark:border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans transition-colors`}>
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
        onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
      />
      <LearningTipBar />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <KanbanBoard
                    tasks={activeProject.tasks}
                    onUpdateTaskStatus={handleUpdateTaskStatus}
                    onDeleteTask={handleDeleteTask}
                    onAddSubtask={handleAddSubtask}
                    onToggleSubtask={handleToggleSubtask}
                    onUpdateTaskTime={handleUpdateTaskTime}
                    onUpdateTaskPriority={handleUpdateTaskPriority}
                    onUpdateTaskDueDate={handleUpdateTaskDueDate}
                    onOpenAIAssistant={handleOpenAIAssistant}
                    onOpenFlashcardTask={handleOpenFlashcardTask}
                />
            </div>
            <div className="space-y-6">
                <Timer 
                    settings={activeProject.timerSettings}
                    pomodoros={activeProject.pomodoros}
                    onSettingsChange={(newSettings) => updateProject(activeProject.id, { timerSettings: newSettings })}
                    onPomodorosChange={(newCount) => updateProject(activeProject.id, { pomodoros: newCount })}
                />
                <BrainDump 
                    notes={activeProject.brainDumpNotes}
                    onNotesChange={(notes) => updateProject(activeProject.id, { brainDumpNotes: notes })}
                />
            </div>
        </div>
      </main>
      
      <UndoToast
        lastDeletedTaskInfo={lastDeletedTask}
        onUndo={handleUndoDeleteTask}
        onDismiss={() => setLastDeletedTask(null)}
      />

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
            onSave={generatedFlashcards.length > 0 ? handleSaveFlashcardsAsTask : undefined}
        />
      )}

      {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onClearAllData={handleClearAllData} />}
      
      {isImportModalOpen && <ImportFromSheetModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleImportTasks} />}
      
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
    </div>
  );
};

export default App;
