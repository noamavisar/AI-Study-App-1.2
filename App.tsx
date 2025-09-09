import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus, Priority, Subtask, Project, AIAssistantMode, Flashcard, ResourceType, ProjectFile, TimerSettings } from './types';
import Header from './components/Header';
import KanbanBoard from './components/KanbanBoard';
import AddTaskModal from './components/AddTaskModal';
import AIAssistantModal from './components/AIAssistantModal';
import Timer from './components/Timer';
import LearningTipBar from './components/LearningTipBar';
import SettingsModal from './components/SettingsModal';
import BrainDump from './components/BrainDump';
import { generateTaskBreakdown, generateLearningTips, generateStudySprint, generateFlashcards } from './services/geminiService';
import LearningResourcesModal from './components/LearningResourcesModal';
import FileManagerModal from './components/FileManagerModal';
import FlashcardsModal from './components/FlashcardsModal';
import ImportFromSheetModal from './components/ImportFromSheetModal';
import ManageProjectsModal from './components/ManageProjectsModal';
import AddProjectModal from './components/AddProjectModal';
import ProjectFilesModal from './components/ProjectFilesModal';
import { fileToDataUrl, parseGoogleUrl } from './utils/fileUtils';

type ModalState =
  | null
  | { type: 'addTask' }
  | { type: 'aiAssistant'; mode: AIAssistantMode; task: Task | null }
  | { type: 'sprintGenerator' }
  | { type: 'flashcardGenerator' }
  | { type: 'viewFlashcards'; cards: Flashcard[] }
  | { type: 'saveFlashcards'; cards: Flashcard[]; topic: string }
  | { type: 'importSheet' }
  | { type: 'projectFiles' }
  | { type: 'manageProjects' }
  | { type: 'addProject' }
  | { type: 'settings' };

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [modal, setModal] = useState<ModalState>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiContent, setAIContent] = useState<string | string[] | null>(null);

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  // --- Effects for Persistence ---
  useEffect(() => {
    const savedTheme = localStorage.getItem('studyjam-theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('studyjam-theme', theme);
  }, [theme]);

  const createNewProject = (name: string): Project => ({
    id: uuidv4(),
    name,
    tasks: [],
    brainDumpNotes: '',
    timerSettings: { pomodoro: 25, shortBreak: 5, longBreak: 15 },
    pomodoros: 0,
    files: [],
  });

  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem('studyjam-projects');
      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects);
        if (parsedProjects && parsedProjects.length > 0) {
            setProjects(parsedProjects);
            const savedActiveProjectId = localStorage.getItem('studyjam-activeProjectId');
            if (savedActiveProjectId && parsedProjects.some((p: Project) => p.id === savedActiveProjectId)) {
              setActiveProjectId(savedActiveProjectId);
            } else {
              setActiveProjectId(parsedProjects[0].id);
            }
        } else {
            const defaultProject = createNewProject("My First Project");
            setProjects([defaultProject]);
            setActiveProjectId(defaultProject.id);
        }
      } else {
        const defaultProject = createNewProject("My First Project");
        setProjects([defaultProject]);
        setActiveProjectId(defaultProject.id);
      }
    } catch (error) {
      console.error("Failed to load projects from localStorage", error);
      const defaultProject = createNewProject("My First Project");
      setProjects([defaultProject]);
      setActiveProjectId(defaultProject.id);
    }
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('studyjam-projects', JSON.stringify(projects));
    }
    if (activeProjectId) {
      localStorage.setItem('studyjam-activeProjectId', activeProjectId);
    }
  }, [projects, activeProjectId]);

  // --- Project Management ---
  const handleAddProject = (name: string) => {
    const newProject = createNewProject(name);
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    setActiveProjectId(newProject.id);
    setModal(null);
  };

  const handleRenameProject = (projectId: string, newName: string) => {
    setProjects(projects.map(p => p.id === projectId ? { ...p, name: newName } : p));
  };
  
  const handleDeleteProject = (projectId: string) => {
    if (projects.length <= 1) {
        alert("You cannot delete the only project.");
        return;
    }
    if (window.confirm("Are you sure you want to delete this project and all its tasks? This action cannot be undone.")) {
        const remainingProjects = projects.filter(p => p.id !== projectId);
        setProjects(remainingProjects);
        if (activeProjectId === projectId) {
            setActiveProjectId(remainingProjects[0]?.id || null);
        }
    }
  };

  const handleSwitchProject = (projectId: string) => {
    setActiveProjectId(projectId);
  };
  
  // --- Task Management ---
  const updateActiveProject = (updater: (project: Project) => Project) => {
    if (!activeProject) return;
    setProjects(projects.map(p => p.id === activeProjectId ? updater(p) : p));
  };
  
  const handleAddTask = (taskData: Omit<Task, 'id' | 'status'>) => {
    const newTask: Task = { id: uuidv4(), status: TaskStatus.ToDo, ...taskData };
    updateActiveProject(proj => ({ ...proj, tasks: [...proj.tasks, newTask] }));
    setModal(null);
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    updateActiveProject(proj => ({ ...proj, tasks: proj.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t) }));
  };
  
  const handleDeleteTask = (taskId: string) => {
    updateActiveProject(proj => ({ ...proj, tasks: proj.tasks.filter(t => t.id !== taskId) }));
  };

  const handleAddSubtask = (taskId: string, subtaskText: string) => {
    const newSubtask: Subtask = { id: uuidv4(), text: subtaskText, completed: false };
    updateActiveProject(proj => ({ ...proj, tasks: proj.tasks.map(t => t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), newSubtask] } : t)}));
  };

  const onToggleSubtask = (taskId: string, subtaskId: string) => {
    updateActiveProject(proj => ({ ...proj, tasks: proj.tasks.map(t => t.id === taskId ? { ...t, subtasks: (t.subtasks || []).map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st) } : t)}));
  };

  const handleUpdateTaskTime = (taskId: string, newTime: number) => {
    updateActiveProject(proj => ({ ...proj, tasks: proj.tasks.map(t => t.id === taskId ? { ...t, estimatedTime: newTime } : t)}));
  };

  const handleUpdateTaskPriority = (taskId: string, newPriority: Priority) => {
     updateActiveProject(proj => ({ ...proj, tasks: proj.tasks.map(t => t.id === taskId ? { ...t, priority: newPriority } : t)}));
  };

  const handleUpdateTaskDueDate = (taskId: string, newDueDate: string) => {
    updateActiveProject(proj => ({ ...proj, tasks: proj.tasks.map(t => t.id === taskId ? { ...t, dueDate: newDueDate } : t)}));
  };

  // --- AI Features ---
  const handleOpenAIAssistant = (mode: AIAssistantMode, task: Task) => {
    setAIContent(null);
    setModal({ type: 'aiAssistant', mode, task });
  };
  
  const handleGenerateAIAssistantContent = async (topic: string) => {
    if (modal?.type !== 'aiAssistant') return;
    setIsAILoading(true);
    setAIContent(null);
    try {
      const { mode, task } = modal;
      let result = mode === 'breakdown'
        ? await generateTaskBreakdown(task?.title || topic, task?.description || '')
        : await generateLearningTips(topic);
      setAIContent(result);
    } catch (error) {
      console.error('AI generation failed:', error);
      alert('Failed to get a response from the AI assistant.');
    } finally {
      setIsAILoading(false);
    }
  };

  const handleAddSubtasksFromAI = (subtasks: string[]) => {
    if (modal?.type !== 'aiAssistant' || !modal.task) return;
    const { task } = modal;
    const newSubtasks: Subtask[] = subtasks.map(text => ({ id: uuidv4(), text, completed: false }));
    updateActiveProject(proj => ({ ...proj, tasks: proj.tasks.map(t => t.id === task.id ? { ...t, subtasks: [...(t.subtasks || []), ...newSubtasks] } : t)}));
    setModal(null);
  };

  const handleGenerateSprint = async (topic: string, duration: number, resources: ResourceType[], files: File[], linkFiles: ProjectFile[]) => {
    setIsAILoading(true);
    try {
      const sprintTasks = await generateStudySprint(topic, duration, resources, files, linkFiles);
      const newTasks: Task[] = sprintTasks.map(st => ({ ...st, id: uuidv4(), status: TaskStatus.ToDo, priority: Priority.ImportantNotUrgent, estimatedTime: 120 }));
      updateActiveProject(proj => ({ ...proj, tasks: [...proj.tasks, ...newTasks] }));
      setModal(null);
    } catch (error) {
      console.error('Failed to generate study sprint:', error);
      alert('Failed to generate the study sprint. Please check your inputs and try again.');
    } finally {
      setIsAILoading(false);
    }
  };
  
  const handleGenerateFlashcards = async (topic: string, files: File[], linkFiles: ProjectFile[]) => {
    setIsAILoading(true);
    try {
        const flashcards = await generateFlashcards(topic, files, linkFiles);
        setModal({ type: 'saveFlashcards', cards: flashcards, topic });
    } catch (error) {
        console.error('Failed to generate flashcards:', error);
        alert('Failed to generate flashcards. Please check your inputs and try again.');
    } finally {
        setIsAILoading(false);
    }
  };
  
  const handleSaveFlashcardsAsTask = (cards: Flashcard[], topic: string) => {
    const newTask: Task = { id: uuidv4(), title: `Flashcards: ${topic}`, description: `A set of ${cards.length} flashcards for studying.`, status: TaskStatus.ToDo, priority: Priority.ImportantNotUrgent, estimatedTime: 60, flashcards: cards };
    updateActiveProject(proj => ({ ...proj, tasks: [...proj.tasks, newTask] }));
    setModal(null);
  };
  
  // --- Other Handlers ---
  const handleImportTasks = (tasks: Omit<Task, 'id'>[]) => {
    const newTasks: Task[] = tasks.map(t => ({...t, id: uuidv4()}));
    updateActiveProject(proj => ({ ...proj, tasks: [...proj.tasks, ...newTasks] }));
    setModal(null);
  };

  const handleNotesChange = (notes: string) => updateActiveProject(proj => ({...proj, brainDumpNotes: notes}));
  const handleTimerSettingsChange = (newSettings: TimerSettings) => updateActiveProject(proj => ({...proj, timerSettings: newSettings}));
  const handlePomodorosChange = (newCount: number) => updateActiveProject(proj => ({...proj, pomodoros: newCount}));

  const handleClearAllData = () => {
    if (window.confirm("Are you sure you want to delete ALL data? This will remove all projects and tasks and cannot be undone.")) {
      localStorage.removeItem('studyjam-projects');
      localStorage.removeItem('studyjam-activeProjectId');
      const defaultProject = createNewProject("My First Project");
      setProjects([defaultProject]);
      setActiveProjectId(defaultProject.id);
      setModal(null);
    }
  };

  const handleAddProjectFiles = async (files: FileList) => {
    const newProjectFiles: ProjectFile[] = await Promise.all(Array.from(files).map(async (file) => ({ id: uuidv4(), name: file.name, type: file.type, size: file.size, sourceType: 'local', dataUrl: await fileToDataUrl(file) })));
    updateActiveProject(proj => ({...proj, files: [...proj.files, ...newProjectFiles]}));
  };

  const handleAddProjectLinkFile = (url: string, name: string) => {
    const newFile: ProjectFile = { id: uuidv4(), name, type: parseGoogleUrl(url).type, size: 0, sourceType: 'link', url };
    updateActiveProject(proj => ({...proj, files: [...proj.files, newFile]}));
  };

  const handleDeleteProjectFile = (fileId: string) => updateActiveProject(proj => ({...proj, files: proj.files.filter(f => f.id !== fileId)}));

  return (
    <div className={`min-h-screen font-sans ${theme}`}>
      <div className="bg-jam-light-gray dark:bg-slate-900 text-jam-dark dark:text-slate-200 transition-colors duration-300">
        <Header
          activeProject={activeProject} projects={projects} onSwitchProject={handleSwitchProject}
          onOpenProjectManager={() => setModal({ type: 'manageProjects' })}
          onAddTask={() => setModal({ type: 'addTask' })}
          onOpenSprintGenerator={() => setModal({ type: 'sprintGenerator' })}
          onOpenFlashcardGenerator={() => setModal({ type: 'flashcardGenerator' })}
          onOpenImportModal={() => setModal({ type: 'importSheet' })}
          onOpenProjectFilesModal={() => setModal({ type: 'projectFiles' })}
          onOpenSettings={() => setModal({ type: 'settings' })}
          theme={theme} onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
        />
        <LearningTipBar />
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
          {activeProject ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="lg:col-span-2 xl:col-span-3">
                <KanbanBoard
                  tasks={activeProject.tasks} onUpdateTaskStatus={handleUpdateTaskStatus} onDeleteTask={handleDeleteTask}
                  onAddSubtask={handleAddSubtask} onToggleSubtask={onToggleSubtask} onUpdateTaskTime={handleUpdateTaskTime}
                  onUpdateTaskPriority={handleUpdateTaskPriority} onUpdateTaskDueDate={handleUpdateTaskDueDate}
                  onOpenAIAssistant={handleOpenAIAssistant} onOpenFlashcardTask={(cards) => setModal({ type: 'viewFlashcards', cards })}
                />
              </div>
              <div className="space-y-6">
                <Timer settings={activeProject.timerSettings} pomodoros={activeProject.pomodoros} onSettingsChange={handleTimerSettingsChange} onPomodorosChange={handlePomodorosChange} />
                <BrainDump notes={activeProject.brainDumpNotes} onNotesChange={handleNotesChange} />
              </div>
            </div>
          ) : (
            <div className="text-center py-24">
                <h2 className="text-2xl font-bold text-jam-dark dark:text-slate-100 mb-4">Welcome to StudyJam</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-8">Create a project to start organizing your study tasks.</p>
                <button onClick={() => setModal({ type: 'addProject' })} className="px-6 py-3 text-lg font-semibold text-white bg-jam-dark rounded-lg hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-700 transition-colors shadow-lg">
                    Create Your First Project
                </button>
            </div>
          )}
        </main>
        
        {/* Modals */}
        {modal?.type === 'addTask' && activeProject && <AddTaskModal onClose={() => setModal(null)} onAddTask={handleAddTask} />}
        {modal?.type === 'addProject' && <AddProjectModal isOpen={true} onClose={() => setModal(null)} onAddProject={handleAddProject} />}
        {modal?.type === 'manageProjects' && <ManageProjectsModal isOpen={true} onClose={() => setModal(null)} projects={projects} onRenameProject={handleRenameProject} onDeleteProject={handleDeleteProject} />}
        {modal?.type === 'aiAssistant' && <AIAssistantModal isOpen={true} onClose={() => setModal(null)} mode={modal.mode} task={modal.task} isLoading={isAILoading} content={aiContent} onSubmit={handleGenerateAIAssistantContent} onAddSubtasks={handleAddSubtasksFromAI} />}
        {modal?.type === 'sprintGenerator' && activeProject && <LearningResourcesModal isOpen={true} onClose={() => setModal(null)} onGenerate={handleGenerateSprint} isLoading={isAILoading} projectFiles={activeProject.files} />}
        {modal?.type === 'flashcardGenerator' && activeProject && <FileManagerModal isOpen={true} onClose={() => setModal(null)} onGenerate={handleGenerateFlashcards} isLoading={isAILoading} projectFiles={activeProject.files} />}
        {(modal?.type === 'viewFlashcards' || modal?.type === 'saveFlashcards') && <FlashcardsModal isOpen={true} onClose={() => setModal(null)} flashcards={modal.cards} onSave={modal.type === 'saveFlashcards' ? () => handleSaveFlashcardsAsTask(modal.cards, modal.topic) : undefined} />}
        {modal?.type === 'importSheet' && <ImportFromSheetModal isOpen={true} onClose={() => setModal(null)} onImport={handleImportTasks} />}
        {modal?.type === 'projectFiles' && activeProject && <ProjectFilesModal isOpen={true} onClose={() => setModal(null)} files={activeProject.files} onAddFiles={handleAddProjectFiles} onAddLinkFile={handleAddProjectLinkFile} onDeleteFile={handleDeleteProjectFile} />}
        {modal?.type === 'settings' && <SettingsModal isOpen={true} onClose={() => setModal(null)} onClearAllData={handleClearAllData} />}
      </div>
    </div>
  );
}

export default App;
