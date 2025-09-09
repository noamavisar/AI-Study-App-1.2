import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus, Priority, Subtask, Project, AIAssistantMode, Flashcard, TimerSettings, LearningResource } from './types';
import { breakdownTaskIntoSubtasks, getLearningTipsForTopic, generateStudySprint, generateFlashcards, getFirstStepForTask } from './services/geminiService';

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
});

const App: React.FC = () => {
    // STATE MANAGEMENT
    const [projects, setProjects] = useState<Project[]>(() => {
        try {
            const savedProjects = localStorage.getItem('studyjam-projects');
            return savedProjects ? JSON.parse(savedProjects) : [createDefaultProject()];
        } catch (error) {
            return [createDefaultProject()];
        }
    });

    const [activeProjectId, setActiveProjectId] = useState<string>(() => {
        const savedId = localStorage.getItem('studyjam-active-project-id');
        return savedId || DEFAULT_PROJECT_ID;
    });

    const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
    
    // Ensure there's always at least one project
    useEffect(() => {
        if (projects.length === 0) {
            const defaultProject = createDefaultProject();
            setProjects([defaultProject]);
            setActiveProjectId(defaultProject.id);
        } else if (!projects.find(p => p.id === activeProjectId)) {
            // If active project was deleted, switch to the first one
            setActiveProjectId(projects[0].id);
        }
    }, [projects, activeProjectId]);


    // Data persistence
    useEffect(() => {
        localStorage.setItem('studyjam-projects', JSON.stringify(projects));
        localStorage.setItem('studyjam-active-project-id', activeProjectId);
    }, [projects, activeProjectId]);

    const updateProject = (projectId: string, updates: Partial<Omit<Project, 'id'>>) => {
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
    };
    
    const { tasks, timerSettings, pomodoros, brainDump } = activeProject;
    
    // MODAL STATE
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [isAIAssistantModalOpen, setIsAIAssistantModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isSprintGeneratorOpen, setIsSprintGeneratorOpen] = useState(false);
    const [isFlashcardGeneratorOpen, setIsFlashcardGeneratorOpen] = useState(false);
    const [isFlashcardViewerOpen, setIsFlashcardViewerOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);

    // AI MODAL STATE
    const [aiAssistantMode, setAIAssistantMode] = useState<AIAssistantMode>('breakdown');
    const [aiTargetTask, setAITargetTask] = useState<Task | null>(null);
    const [isAILoading, setIsAILoading] = useState(false);
    const [aiContent, setAIContent] = useState<string | string[] | null>(null);

    // FLASHCARD STATE
    const [flashcardsToStudy, setFlashcardsToStudy] = useState<Flashcard[]>([]);
    const [generatedFlashcardPrompt, setGeneratedFlashcardPrompt] = useState<string>('');
    const [isViewingNewFlashcards, setIsViewingNewFlashcards] = useState(false);

    // CRUD HANDLERS
    const handleAddTask = (newTask: Omit<Task, 'id' | 'status'>) => {
        const task: Task = { ...newTask, id: uuidv4(), status: TaskStatus.ToDo };
        updateProject(activeProjectId, { tasks: [...tasks, task] });
        setIsAddTaskModalOpen(false);
    };
    
    const handleDeleteTask = (taskId: string) => {
        updateProject(activeProjectId, { tasks: tasks.filter(t => t.id !== taskId) });
    };

    const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
        updateProject(activeProjectId, { tasks: tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t) });
    };

    const handleAddSubtask = (taskId: string, subtaskText: string) => {
        const newSubtask: Subtask = { id: uuidv4(), text: subtaskText, completed: false };
        updateProject(activeProjectId, {
            tasks: tasks.map(t =>
                t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), newSubtask] } : t
            )
        });
    };

    const handleToggleSubtask = (taskId: string, subtaskId: string) => {
        updateProject(activeProjectId, {
            tasks: tasks.map(t =>
                t.id === taskId ? {
                    ...t,
                    subtasks: (t.subtasks || []).map(st =>
                        st.id === subtaskId ? { ...st, completed: !st.completed } : st
                    )
                } : t
            )
        });
    };
    
    const handleUpdateTaskTime = (taskId: string, newTime: number) => {
        updateProject(activeProjectId, { tasks: tasks.map(t => t.id === taskId ? { ...t, estimatedTime: newTime } : t) });
    };

    const handleUpdateTaskPriority = (taskId: string, newPriority: Priority) => {
        updateProject(activeProjectId, { tasks: tasks.map(t => t.id === taskId ? { ...t, priority: newPriority } : t) });
    };
    
    const handleUpdateTaskDueDate = (taskId: string, newDueDate: string) => {
        updateProject(activeProjectId, { tasks: tasks.map(t => t.id === taskId ? { ...t, dueDate: newDueDate } : t) });
    };
    
    // AI HANDLERS
    const handleOpenAIAssistant = (mode: AIAssistantMode, task: Task) => {
        setAIAssistantMode(mode);
        setAITargetTask(task);
        setAIContent(null);
        setIsAIAssistantModalOpen(true);
        if (mode === 'first-step') {
            handleAIAssistantSubmit(task.title);
        }
    };
    
    const handleAIAssistantSubmit = async (topic: string) => {
        setIsAILoading(true);
        setAIContent(null);
        try {
            if (aiAssistantMode === 'breakdown') {
                const subtasks = await breakdownTaskIntoSubtasks(topic);
                setAIContent(subtasks);
            } else if (aiAssistantMode === 'tips') {
                const tips = await getLearningTipsForTopic(topic);
                setAIContent(tips);
            } else if (aiAssistantMode === 'first-step') {
                const step = await getFirstStepForTask(topic);
                setAIContent(step);
            }
        } catch (error) {
            console.error(error);
            setAIContent("Sorry, I couldn't generate a response. Please try again.");
        } finally {
            setIsAILoading(false);
        }
    };

    const handleAddSubtasksFromAI = (subtasks: string[]) => {
        if (!aiTargetTask) return;
        const newSubtasks: Subtask[] = subtasks.map(st => ({ id: uuidv4(), text: st, completed: false }));
        updateProject(activeProjectId, {
            tasks: tasks.map(t =>
                t.id === aiTargetTask.id ? { ...t, subtasks: [...(t.subtasks || []), ...newSubtasks] } : t
            )
        });
        setIsAIAssistantModalOpen(false);
    };
    
    const handleGenerateSprint = async (resources: Omit<LearningResource, 'id'>[], days: number) => {
        setIsAILoading(true);
        try {
            const newTasks = await generateStudySprint(resources, days);
            const sprintTasks: Task[] = newTasks.map(t => ({...t, id: uuidv4(), status: TaskStatus.ToDo }));
            updateProject(activeProjectId, { tasks: [...tasks, ...sprintTasks]});
            setIsSprintGeneratorOpen(false);
        } catch (error) {
            console.error("Sprint generation failed:", error);
            // In a real app, show this error in the modal.
        } finally {
            setIsAILoading(false);
        }
    };
    
    const handleGenerateFlashcards = async (files: File[], prompt: string) => {
        setIsAILoading(true);
        try {
            const flashcards = await generateFlashcards(files, prompt);
            setFlashcardsToStudy(flashcards);
            setGeneratedFlashcardPrompt(prompt);
            setIsViewingNewFlashcards(true);
            setIsFlashcardGeneratorOpen(false);
            setIsFlashcardViewerOpen(true);
        } catch (error) {
            console.error("Flashcard generation failed:", error);
        } finally {
            setIsAILoading(false);
        }
    };

    const handleSaveFlashcardsAsTask = () => {
        const flashcardTask: Task = {
            id: uuidv4(),
            title: `Flashcards: ${generatedFlashcardPrompt || 'Generated from files'}`,
            description: `A set of ${flashcardsToStudy.length} flashcards generated by AI.`,
            status: TaskStatus.ToDo,
            priority: Priority.ImportantNotUrgent,
            estimatedTime: 30,
            flashcards: flashcardsToStudy,
        };
        updateProject(activeProjectId, { tasks: [...tasks, flashcardTask]});
        setIsFlashcardViewerOpen(false);
        setIsViewingNewFlashcards(false);
    };

    const handleOpenFlashcardTask = (flashcards: Flashcard[]) => {
        setFlashcardsToStudy(flashcards);
        setIsViewingNewFlashcards(false);
        setIsFlashcardViewerOpen(true);
    };
    
    // SETTINGS & DATA
    const handleClearAllData = () => {
        if (window.confirm("Are you sure you want to delete ALL projects and data? This cannot be undone.")) {
            localStorage.removeItem('studyjam-projects');
            localStorage.removeItem('studyjam-active-project-id');
            const defaultProject = createDefaultProject();
            setProjects([defaultProject]);
            setActiveProjectId(defaultProject.id);
            setIsSettingsModalOpen(false);
        }
    };
    
    // TIMER & PROJECT DATA
    const handleTimerSettingsChange = (newSettings: TimerSettings) => {
        updateProject(activeProjectId, { timerSettings: newSettings });
    };

    const handlePomodorosChange = (newCount: number) => {
        updateProject(activeProjectId, { pomodoros: newCount });
    };
    
    const handleBrainDumpChange = useCallback((notes: string) => {
        updateProject(activeProjectId, { brainDump: notes });
    }, [activeProjectId, projects]); // Updated dependency to reflect correct closure
    
    // GOOGLE SHEETS IMPORT
    const handleImportFromSheet = (importedTasks: Omit<Task, 'id'>[]) => {
        const newTasks: Task[] = importedTasks.map(t => ({ ...t, id: uuidv4() }));
        updateProject(activeProjectId, { tasks: [...tasks, ...newTasks] });
        setIsImportModalOpen(false);
    };
    
    // PROJECT MANAGEMENT
    const handleAddProject = (name: string) => {
        const newProject: Project = {
            id: uuidv4(),
            name,
            tasks: [],
            timerSettings: DEFAULT_TIMER_SETTINGS,
            pomodoros: 0,
            brainDump: '',
        };
        setProjects(prev => [...prev, newProject]);
        setActiveProjectId(newProject.id);
        setIsProjectManagerOpen(false);
    };

    const handleRenameProject = (projectId: string, newName: string) => {
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, name: newName } : p));
    };

    const handleDeleteProject = (projectId: string) => {
        if (projects.length <= 1) {
            alert("You cannot delete the only project.");
            return;
        }
        const projectToDelete = projects.find(p => p.id === projectId);
        if (window.confirm(`Are you sure you want to delete the "${projectToDelete?.name}" project?`)) {
            const newProjects = projects.filter(p => p.id !== projectId);
            if (activeProjectId === projectId) {
                setActiveProjectId(newProjects[0]?.id || '');
            }
            setProjects(newProjects);
        }
    };


    return (
        <div className="bg-jam-light-gray dark:bg-slate-900 min-h-screen font-sans text-jam-dark dark:text-slate-300">
            <Header
                activeProject={activeProject}
                projects={projects}
                onSwitchProject={setActiveProjectId}
                onOpenProjectManager={() => setIsProjectManagerOpen(true)}
                onAddTask={() => setIsAddTaskModalOpen(true)}
                onOpenSprintGenerator={() => setIsSprintGeneratorOpen(true)}
                onOpenFlashcardGenerator={() => setIsFlashcardGeneratorOpen(true)}
                onOpenImportModal={() => setIsImportModalOpen(true)}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
            />
            
            <LearningTipBar />

            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    <div className="lg:col-span-2">
                        {tasks && <KanbanBoard
                            tasks={tasks}
                            onUpdateTaskStatus={handleUpdateTaskStatus}
                            onDeleteTask={handleDeleteTask}
                            onAddSubtask={handleAddSubtask}
                            onToggleSubtask={handleToggleSubtask}
                            onUpdateTaskTime={handleUpdateTaskTime}
                            onUpdateTaskPriority={handleUpdateTaskPriority}
                            onUpdateTaskDueDate={handleUpdateTaskDueDate}
                            onOpenAIAssistant={handleOpenAIAssistant}
                            onOpenFlashcardTask={handleOpenFlashcardTask}
                        />}
                    </div>
                    <aside className="space-y-6">
                        {timerSettings && <Timer
                            settings={timerSettings}
                            pomodoros={pomodoros}
                            onSettingsChange={handleTimerSettingsChange}
                            onPomodorosChange={handlePomodorosChange}
                        />}
                        {brainDump !== undefined && <BrainDump
                            notes={brainDump}
                            onNotesChange={handleBrainDumpChange}
                        />}
                    </aside>
                </div>
            </main>

            {/* Modals */}
            {isAddTaskModalOpen && <AddTaskModal onClose={() => setIsAddTaskModalOpen(false)} onAddTask={handleAddTask} />}
            {isAIAssistantModalOpen && <AIAssistantModal 
                isOpen={isAIAssistantModalOpen}
                onClose={() => setIsAIAssistantModalOpen(false)}
                mode={aiAssistantMode}
                task={aiTargetTask}
                isLoading={isAILoading}
                content={aiContent}
                onSubmit={handleAIAssistantSubmit}
                onAddSubtasks={handleAddSubtasksFromAI}
            />}
            {isSettingsModalOpen && <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} onClearAllData={handleClearAllData} />}
            {isSprintGeneratorOpen && <LearningResourcesModal isOpen={isSprintGeneratorOpen} onClose={() => setIsSprintGeneratorOpen(false)} onGenerate={handleGenerateSprint} isLoading={isAILoading}/>}
            {isFlashcardGeneratorOpen && <FileManagerModal isOpen={isFlashcardGeneratorOpen} onClose={() => setIsFlashcardGeneratorOpen(false)} onGenerate={handleGenerateFlashcards} isLoading={isAILoading}/>}
            {isFlashcardViewerOpen && <FlashcardsModal 
                isOpen={isFlashcardViewerOpen} 
                onClose={() => {
                    setIsFlashcardViewerOpen(false)
                    setIsViewingNewFlashcards(false)
                }} 
                flashcards={flashcardsToStudy} 
                onSave={isViewingNewFlashcards ? handleSaveFlashcardsAsTask : undefined}
            />}
            {isImportModalOpen && <ImportFromSheetModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleImportFromSheet} />}
            {isProjectManagerOpen && <ProjectManager 
                isOpen={isProjectManagerOpen}
                onClose={() => setIsProjectManagerOpen(false)}
                projects={projects}
                onAddProject={handleAddProject}
                onRenameProject={handleRenameProject}
                onDeleteProject={handleDeleteProject}
            />}
        </div>
    );
};

export default App;