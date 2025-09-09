import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus, Priority, Subtask, Project, AIAssistantMode, Flashcard, TimerSettings, LearningResource, ProjectFile } from './types';
import { breakdownTaskIntoSubtasks, getLearningTipsForTopic, generateStudySprint, generateFlashcards, getFirstStepForTask } from './services/geminiService';
import { fileToDataUrl } from './utils/fileUtils';

import Header from './components/Header';
import KanbanBoard from './components/KanbanBoard';
import Timer from './components/Timer';
import BrainDump from './components/BrainDump';
import AddTaskModal from './components/AddTaskModal';
import AIAssistantModal from './components/AIAssistantModal';
import SettingsModal from './components/SettingsModal';
import LearningTipBar from './components/LearningTipBar';
import LearningResourcesModal from './components/LearningResourcesModal';
import FlashcardsModal from './components/FlashcardsModal';
import FileManagerModal from './components/FileManagerModal'; // This is the flashcard generator
import ImportFromSheetModal from './components/ImportFromSheetModal';
import ProjectManager from './components/ProjectManager';
import ProjectFilesModal from './components/ProjectFilesModal';


// Default values
const DEFAULT_PROJECT_ID = 'default-project';
const DEFAULT_TIMER_SETTINGS: TimerSettings = { pomodoro: 25, shortBreak: 5, longBreak: 15 };
const createDefaultProject = (): Project => ({
    id: DEFAULT_PROJECT_ID,
    name: 'My Study Plan',
    tasks: [],
    timerSettings: DEFAULT_TIMER_SETTINGS,
    pomodoros: 0,
    brainDump: '',
    files: [],
});

const App: React.FC = () => {
    // STATE MANAGEMENT
    const [projects, setProjects] = useState<Project[]>(() => {
        try {
            const savedProjects = localStorage.getItem('studyjam-projects');
            if (savedProjects) {
                const parsedProjects = JSON.parse(savedProjects) as Partial<Project>[];
                // Hydrate the loaded data to ensure all properties, especially new ones like 'files', exist.
                return parsedProjects.map(p => ({
                    id: p.id || uuidv4(),
                    name: p.name || 'My Study Plan',
                    tasks: p.tasks || [],
                    timerSettings: p.timerSettings || DEFAULT_TIMER_SETTINGS,
                    pomodoros: p.pomodoros || 0,
                    brainDump: p.brainDump || '',
                    files: p.files || [], // Ensure the files array always exists
                })) as Project[];
            }
            return [createDefaultProject()];
        } catch (error) {
            console.error("Failed to parse projects from localStorage", error);
            return [createDefaultProject()];
        }
    });

    const [activeProjectId, setActiveProjectId] = useState<string>(() => {
        const savedId = localStorage.getItem('studyjam-active-project-id');
        return savedId || DEFAULT_PROJECT_ID;
    });
    
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const savedTheme = localStorage.getItem('studyjam-theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
            return savedTheme;
        }
        return 'dark'; // Default to dark mode
    });

    const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
    
    // Ensure there's always at least one project and the active project is valid
    useEffect(() => {
        if (projects.length === 0) {
            const defaultProject = createDefaultProject();
            setProjects([defaultProject]);
            setActiveProjectId(defaultProject.id);
        } else if (!projects.find(p => p.id === activeProjectId)) {
            // If active project was deleted or is invalid, switch to the first one.
            setActiveProjectId(projects[0].id);
        }
    }, [projects, activeProjectId]);


    // Data Persistence
    useEffect(() => {
        try {
            localStorage.setItem('studyjam-projects', JSON.stringify(projects));
        } catch (error) {
            console.error("Failed to save projects to localStorage", error);
        }
    }, [projects]);

    useEffect(() => {
        localStorage.setItem('studyjam-active-project-id', activeProjectId);
    }, [activeProjectId]);
    
    // Theme effect
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('studyjam-theme', theme);
    }, [theme]);


    // Modal States
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [isAIAssistantModalOpen, setIsAIAssistantModalOpen] = useState(false);
    const [aiAssistantMode, setAIAssistantMode] = useState<AIAssistantMode>('breakdown');
    const [aiAssistantTask, setAIAssistantTask] = useState<Task | null>(null);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isSprintGeneratorOpen, setIsSprintGeneratorOpen] = useState(false);
    const [isFlashcardGeneratorOpen, setIsFlashcardGeneratorOpen] = useState(false);
    const [isFlashcardsModalOpen, setIsFlashcardsModalOpen] = useState(false);
    const [flashcardsToShow, setFlashcardsToShow] = useState<Flashcard[]>([]);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
    const [isProjectFilesModalOpen, setIsProjectFilesModalOpen] = useState(false);
    
    // AI State
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiContent, setAIContent] = useState<string | string[] | null>(null);
    const [generatedFlashcards, setGeneratedFlashcards] = useState<Flashcard[]>([]);

    // Theme handler
    const handleToggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    };

    // Handlers (Project)
    const handleAddProject = (name: string) => {
        const newProject: Project = { ...createDefaultProject(), id: uuidv4(), name, };
        const newProjects = [...projects, newProject];
        setProjects(newProjects);
        setActiveProjectId(newProject.id); // Switch to the new project
    };

    const handleRenameProject = (projectId: string, newName: string) => {
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, name: newName } : p));
    };

    const handleDeleteProject = (projectId: string) => {
        // Find the project from the current state to get its name for the confirmation.
        const projectToDelete = projects.find(p => p.id === projectId);
        if (!projectToDelete) {
            console.error("Attempted to delete a project that does not exist.");
            return;
        }

        // Prevent deleting the last project.
        if (projects.length <= 1) {
            // This is just a safeguard; the button in the UI should be disabled.
            return;
        }

        // 1. Get user confirmation OUTSIDE of the state updater.
        const confirmed = window.confirm(`Are you sure you want to delete the "${projectToDelete.name}" project?`);

        // 2. If confirmed, update the state.
        if (confirmed) {
            setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
            // The useEffect hook that watches `projects` will automatically handle
            // switching the active project if the deleted one was active.
        }
    };
    
    const handleSwitchProject = (projectId: string) => {
        setActiveProjectId(projectId);
    };

    // Handlers (Task)
    const handleAddTask = (taskData: Omit<Task, 'id' | 'status'>) => {
        const newTask: Task = { ...taskData, id: uuidv4(), status: TaskStatus.ToDo };
        setProjects(prevProjects => prevProjects.map(p =>
            p.id === activeProjectId ? { ...p, tasks: [...p.tasks, newTask] } : p
        ));
        setIsAddTaskModalOpen(false);
    };

    const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
        setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t) } : p));
    };
    
    const handleDeleteTask = (taskId: string) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p));
        }
    };

    const handleUpdateTaskTime = (taskId: string, newTime: number) => {
        setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, estimatedTime: newTime } : t) } : p));
    };

    const handleUpdateTaskPriority = (taskId: string, newPriority: Priority) => {
        setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, priority: newPriority } : t) } : p));
    };

    const handleUpdateTaskDueDate = (taskId: string, newDueDate: string) => {
        setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, dueDate: newDueDate } : t) } : p));
    };

    // Handlers (Subtask)
    const handleAddSubtask = (taskId: string, subtaskText: string) => {
        const newSubtask: Subtask = { id: uuidv4(), text: subtaskText, completed: false };
        setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), newSubtask] } : t) } : p));
    };

    const handleToggleSubtask = (taskId: string, subtaskId: string) => {
        setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, subtasks: (t.subtasks || []).map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st) } : t) } : p));
    };

    // Handlers (AI Features)
    const handleOpenAIAssistant = (mode: AIAssistantMode, task: Task) => {
        setAIContent(null);
        setAIAssistantMode(mode);
        setAIAssistantTask(task);
        setIsAIAssistantModalOpen(true);
    };

    const handleAIAssistantSubmit = async (topic: string) => {
        setIsLoadingAI(true);
        setAIContent(null);
        try {
            let result;
            if (aiAssistantMode === 'breakdown') {
                result = await breakdownTaskIntoSubtasks(topic);
            } else if (aiAssistantMode === 'tips') {
                result = await getLearningTipsForTopic(topic);
            } else { // 'first-step'
                result = await getFirstStepForTask(topic);
            }
            setAIContent(result);
        } catch (error) {
            console.error(error);
            setAIContent("Sorry, I couldn't generate a response. Please try again.");
        } finally {
            setIsLoadingAI(false);
        }
    };

    const handleAddSubtasksFromAI = (subtasks: string[]) => {
        if (!aiAssistantTask) return;
        const newSubtasks: Subtask[] = subtasks.map(text => ({ id: uuidv4(), text, completed: false }));
        setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, tasks: p.tasks.map(t => t.id === aiAssistantTask.id ? { ...t, subtasks: [...(t.subtasks || []), ...newSubtasks] } : t) } : p));
        setIsAIAssistantModalOpen(false);
    };

    const handleGenerateSprint = async (resources: Omit<LearningResource, 'id'>[], days: number) => {
        setIsLoadingAI(true);
        try {
            const sprintTasks = await generateStudySprint(resources, days);
            const newTasks: Task[] = sprintTasks.map(taskData => ({
                ...taskData,
                id: uuidv4(),
                status: TaskStatus.ToDo,
            }));
            setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, tasks: [...p.tasks, ...newTasks] } : p));
            setIsSprintGeneratorOpen(false);
        } catch (error) {
            console.error("Failed to generate and add sprint tasks:", error);
            alert("An error occurred while generating the study sprint. Please check the console for details.");
        } finally {
            setIsLoadingAI(false);
        }
    };
    
    const handleGenerateFlashcards = async (files: File[], prompt: string) => {
        setIsLoadingAI(true);
        try {
            const cards = await generateFlashcards(files, prompt);
            setGeneratedFlashcards(cards); // Store generated cards
            setFlashcardsToShow(cards); // Immediately show them
            setIsFlashcardGeneratorOpen(false); // Close generator
            setIsFlashcardsModalOpen(true); // Open viewer
        } catch (error) {
            console.error("Failed to generate flashcards:", error);
            alert("An error occurred while generating flashcards. Please check the console for details.");
        } finally {
            setIsLoadingAI(false);
        }
    };

    // Handlers (Flashcard Tasks)
    const handleOpenFlashcardTask = (flashcards: Flashcard[]) => {
        setGeneratedFlashcards([]); // Clear any newly generated cards
        setFlashcardsToShow(flashcards);
        setIsFlashcardsModalOpen(true);
    };
    
    const handleSaveFlashcardsAsTask = () => {
        if (generatedFlashcards.length === 0) return;
        const newTaskData: Omit<Task, 'id' | 'status'> = {
            title: "Study Flashcards",
            description: `Review ${generatedFlashcards.length} AI-generated cards.`,
            priority: Priority.ImportantNotUrgent,
            estimatedTime: 30,
            flashcards: generatedFlashcards,
        };
        handleAddTask(newTaskData);
        setIsFlashcardsModalOpen(false);
        setGeneratedFlashcards([]); // Clear after saving
    };

    // Handlers (Settings & Data)
    const handleClearAllData = () => {
        if (window.confirm("Are you sure you want to delete ALL your projects and data? This action cannot be undone.")) {
            localStorage.removeItem('studyjam-projects');
            localStorage.removeItem('studyjam-active-project-id');
            const defaultProject = createDefaultProject();
            setProjects([defaultProject]);
            setActiveProjectId(defaultProject.id);
            setIsSettingsModalOpen(false);
        }
    };
    
    const handleImportTasks = (tasks: Omit<Task, 'id'>[]) => {
        const newTasks: Task[] = tasks.map(taskData => ({
            ...taskData,
            id: uuidv4(),
        }));
        setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, tasks: [...p.tasks, ...newTasks] } : p));
        setIsImportModalOpen(false);
    };

    // Handlers (Sidebar Components)
    const handleTimerSettingsChange = (newSettings: TimerSettings) => {
        setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, timerSettings: newSettings } : p));
    };

    const handlePomodorosChange = (newCount: number) => {
        setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, pomodoros: newCount } : p));
    };

    const handleBrainDumpChange = (notes: string) => {
        setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, brainDump: notes } : p));
    };

    // Handlers (Project Files)
    const handleAddFiles = async (files: FileList) => {
        const targetProjectId = activeProjectId; // Capture the ID at the start
        const filesToProcess = Array.from(files);

        // This function needs to be robust against stale state.
        // Process all files and confirmations first, then update state once.
        let changes: { fileToAdd?: ProjectFile, fileToRemove?: string }[] = [];

        for (const file of filesToProcess) {
            let proceed = true;
            // Check against the *current* state for duplicates.
            const currentProject = projects.find(p => p.id === targetProjectId);
            const currentFiles = currentProject?.files || [];
            if (currentFiles.some(f => f.name === file.name)) {
                proceed = window.confirm(`A file named "${file.name}" already exists. Do you want to replace it?`);
            }
            if (proceed) {
                try {
                    const content = await fileToDataUrl(file);
                    const newFile: ProjectFile = { id: uuidv4(), name: file.name, type: file.type, content };
                    // If we're replacing, mark the old one for removal.
                    changes.push({ fileToRemove: file.name, fileToAdd: newFile });
                } catch (error) {
                    console.error(`Failed to process file ${file.name}:`, error);
                }
            }
        }
        
        if (changes.length > 0) {
            setProjects(prevProjects => {
                return prevProjects.map(p => {
                    if (p.id === targetProjectId) {
                        let updatedFiles = [...(p.files || [])];
                        for (const change of changes) {
                            if (change.fileToRemove) {
                                updatedFiles = updatedFiles.filter(f => f.name !== change.fileToRemove);
                            }
                            if (change.fileToAdd) {
                                updatedFiles.push(change.fileToAdd);
                            }
                        }
                        return { ...p, files: updatedFiles };
                    }
                    return p;
                });
            });
        }
    };
    
    const handleDeleteFile = (fileId: string) => {
        setProjects(prev => prev.map(p =>
            p.id === activeProjectId ? { ...p, files: (p.files || []).filter(f => f.id !== fileId) } : p
        ));
    };


    return (
        <div className="min-h-screen">
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
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                theme={theme}
                onToggleTheme={handleToggleTheme}
            />
            <LearningTipBar />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3">
                         <KanbanBoard
                            tasks={activeProject?.tasks || []}
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
                    <aside className="space-y-8">
                        <Timer
                            settings={activeProject?.timerSettings || DEFAULT_TIMER_SETTINGS}
                            pomodoros={activeProject?.pomodoros || 0}
                            onSettingsChange={handleTimerSettingsChange}
                            onPomodorosChange={handlePomodorosChange}
                        />
                        <BrainDump
                            notes={activeProject?.brainDump || ''}
                            onNotesChange={handleBrainDumpChange}
                        />
                    </aside>
                </div>
            </main>

            {/* Modals */}
            {isAddTaskModalOpen && <AddTaskModal onClose={() => setIsAddTaskModalOpen(false)} onAddTask={handleAddTask} />}
            {isAIAssistantModalOpen && <AIAssistantModal isOpen={isAIAssistantModalOpen} onClose={() => setIsAIAssistantModalOpen(false)} mode={aiAssistantMode} task={aiAssistantTask} isLoading={isLoadingAI} content={aiContent} onSubmit={handleAIAssistantSubmit} onAddSubtasks={handleAddSubtasksFromAI} />}
            {isSettingsModalOpen && <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} onClearAllData={handleClearAllData} />}
            {isSprintGeneratorOpen && <LearningResourcesModal isOpen={isSprintGeneratorOpen} onClose={() => setIsSprintGeneratorOpen(false)} onGenerate={handleGenerateSprint} isLoading={isLoadingAI} projectFiles={activeProject?.files || []} />}
            {isFlashcardGeneratorOpen && <FileManagerModal isOpen={isFlashcardGeneratorOpen} onClose={() => setIsFlashcardGeneratorOpen(false)} onGenerate={handleGenerateFlashcards} isLoading={isLoadingAI} projectFiles={activeProject?.files || []} />}
            {isFlashcardsModalOpen && <FlashcardsModal isOpen={isFlashcardsModalOpen} onClose={() => setIsFlashcardsModalOpen(false)} flashcards={flashcardsToShow} onSave={generatedFlashcards.length > 0 ? handleSaveFlashcardsAsTask : undefined} />}
            {isImportModalOpen && <ImportFromSheetModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleImportTasks} />}
            {isProjectManagerOpen && <ProjectManager isOpen={isProjectManagerOpen} onClose={() => setIsProjectManagerOpen(false)} projects={projects} onAddProject={handleAddProject} onRenameProject={handleRenameProject} onDeleteProject={handleDeleteProject} />}
            {isProjectFilesModalOpen && <ProjectFilesModal isOpen={isProjectFilesModalOpen} onClose={() => setIsProjectFilesModalOpen(false)} files={activeProject?.files || []} onAddFiles={handleAddFiles} onDeleteFile={handleDeleteFile} />}
        </div>
    );
};

export default App;