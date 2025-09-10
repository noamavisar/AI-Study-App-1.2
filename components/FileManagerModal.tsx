import React, { useState, useRef } from 'react';
import Modal from './Modal';
import { ProjectFile } from '../types';
import { getFileIcon } from '../utils/fileUtils';
import { getFile } from '../utils/idb';
import { generatePromptSuggestions } from '../services/geminiService';

interface FileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (topic: string, files: File[], linkFiles: ProjectFile[]) => void;
  isLoading: boolean;
  projectFiles: ProjectFile[];
}

type Tab = 'upload' | 'select';

const FileManagerModal: React.FC<FileManagerModalProps> = ({ isOpen, onClose, onGenerate, isLoading, projectFiles }) => {
  const [topic, setTopic] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  
  const [tempFiles, setTempFiles] = useState<File[]>([]);
  const [selectedProjectFileIds, setSelectedProjectFileIds] = useState<string[]>([]);
  
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [copiedSuggestion, setCopiedSuggestion] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setTempFiles(prev => [...prev, ...Array.from(event.target.files!)]);
    }
     if (event.target) event.target.value = '';
  };
  
  const handleProjectFileToggle = (fileId: string) => {
    setSelectedProjectFileIds(prev => 
        prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  const handleSubmit = async () => {
    if (!topic.trim()) return;
    
    const selectedProjectFiles = projectFiles.filter(pf => selectedProjectFileIds.includes(pf.id));
    const localProjectFiles = selectedProjectFiles.filter(pf => pf.sourceType === 'local');
    const linkProjectFiles = selectedProjectFiles.filter(pf => pf.sourceType === 'link');
    
    const filesFromProject = await Promise.all(
      localProjectFiles.map(async (pf) => {
        const blob = await getFile(pf.id);
        if (!blob) return null;
        return new File([blob], pf.name, { type: pf.type });
      })
    );
    
    const allFiles = [...tempFiles, ...filesFromProject.filter((f): f is File => f !== null)];
    onGenerate(topic, allFiles, linkProjectFiles);
  };

  const handleSuggestPrompts = async () => {
    setIsSuggesting(true);
    setSuggestionError(null);
    setPromptSuggestions([]); // Clear old suggestions

    try {
        const selectedProjectFiles = projectFiles.filter(pf => selectedProjectFileIds.includes(pf.id));
        const localProjectFiles = selectedProjectFiles.filter(pf => pf.sourceType === 'local');
        const linkProjectFiles = selectedProjectFiles.filter(pf => pf.sourceType === 'link');
        
        const filesFromProject = await Promise.all(
          localProjectFiles.map(async (pf) => {
            const blob = await getFile(pf.id);
            if (!blob) return null;
            return new File([blob], pf.name, { type: pf.type });
          })
        );
        
        const allFiles = [...tempFiles, ...filesFromProject.filter((f): f is File => f !== null)];
        
        const suggestions = await generatePromptSuggestions(allFiles, linkProjectFiles);
        setPromptSuggestions(suggestions);

    } catch(e: any) {
        setSuggestionError(e.message || "An unknown error occurred while suggesting prompts.");
    } finally {
        setIsSuggesting(false);
    }
  };

  const handleCopySuggestion = (suggestion: string) => {
    navigator.clipboard.writeText(suggestion);
    setTopic(suggestion); // Also set the topic input
    setCopiedSuggestion(suggestion);
    setTimeout(() => setCopiedSuggestion(null), 2000); // Reset after 2 seconds
  };
  
  const handleClose = () => {
    setTopic('');
    setTempFiles([]);
    setSelectedProjectFileIds([]);
    setPromptSuggestions([]);
    setIsSuggesting(false);
    setSuggestionError(null);
    onClose();
  };
  
  const totalSelectedFiles = tempFiles.length + selectedProjectFileIds.length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generate AI Flashcards">
      <div className="space-y-4">
        <div>
          <label htmlFor="flashcard-topic" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Flashcard Topic</label>
           <div className="flex items-center space-x-2 mt-1">
            <input 
                type="text" 
                id="flashcard-topic" 
                value={topic} 
                onChange={e => setTopic(e.target.value)} 
                placeholder="e.g., Key Concepts in Photosynthesis" 
                className="block w-full bg-white dark:bg-slate-900 border border-jam-border dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-jam-blue dark:focus:ring-pink-500 sm:text-sm" 
            />
            <button
                type="button"
                onClick={handleSuggestPrompts}
                disabled={isSuggesting || totalSelectedFiles === 0}
                className="flex-shrink-0 p-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title={totalSelectedFiles === 0 ? "Select a file to get suggestions" : "Suggest prompts based on selected files"}
            >
                {isSuggesting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-500"></div>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-1.5 0V2.75A.75.75 0 0 1 10 2ZM5.207 5.207a.75.75 0 0 1 1.06 0l.707.707a.75.75 0 0 1-1.06 1.06l-.707-.707a.75.75 0 0 1 0-1.06ZM2 10a.75.75 0 0 1 .75-.75h1.25a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10ZM5.914 14.086a.75.75 0 0 1 0-1.06l.707-.707a.75.75 0 1 1 1.06 1.06l-.707.707a.75.75 0 0 1-1.06 0ZM14.086 5.914a.75.75 0 0 1 1.06 0l.707.707a.75.75 0 0 1-1.06 1.06l-.707-.707a.75.75 0 0 1 0-1.06ZM18 10a.75.75 0 0 1 .75-.75h1.25a.75.75 0 0 1 0 1.5H18.75A.75.75 0 0 1 18 10ZM13.379 13.379a.75.75 0 0 1 1.06 0l.707.707a.75.75 0 0 1-1.06 1.06l-.707-.707a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /><path d="m10 6.25c-1.933 0-3.5 1.567-3.5 3.5s1.567 3.5 3.5 3.5 3.5-1.567 3.5-3.5-1.567-3.5-3.5-3.5Z" /></svg>
                )}
            </button>
          </div>
        </div>

        {isSuggesting && <p className="text-sm text-slate-500 dark:text-slate-400 text-center">Thinking of some good prompts...</p>}
        {suggestionError && <p className="text-sm text-red-500 bg-red-500/10 p-2 rounded-md">{suggestionError}</p>}
        {promptSuggestions.length > 0 && (
            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-jam-border dark:border-slate-700">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Suggestions:</h4>
                {promptSuggestions.map((suggestion, index) => (
                    <div key={index} className="group flex items-center justify-between text-sm p-2 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50">
                        <span className="text-jam-dark dark:text-slate-300 mr-2">{suggestion}</span>
                        <button
                            onClick={() => handleCopySuggestion(suggestion)}
                            className="text-slate-400 hover:text-jam-blue dark:hover:text-pink-500"
                            title="Copy and use this prompt"
                        >
                            {copiedSuggestion === suggestion ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-500"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.052-.143Z" clipRule="evenodd" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V16.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 6 16.5v-13Zm0-1.5A3 3 0 0 0 4.5 5v11.5A3 3 0 0 0 7.5 18h8a3 3 0 0 0 3-3V6.622a3 3 0 0 0-.879-2.121L14.499 1.38a3 3 0 0 0-2.121-.879H8.5Z" /><path d="M7 8.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 7 8.25Zm0 3a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 7 11.25Z" /></svg>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        )}
        
        <div>
          <p className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Provide Study Materials (Optional)
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            The AI will generate flashcards based on the topic. For more specific flashcards, upload or select relevant notes, PDFs, or links.
          </p>
        </div>

        {/* File Selection */}
        <div className="border border-jam-border dark:border-slate-700 rounded-lg">
            <div className="flex border-b border-jam-border dark:border-slate-700">
                <button onClick={() => setActiveTab('upload')} className={`flex-1 p-2 text-sm font-medium ${activeTab === 'upload' ? 'bg-white dark:bg-slate-700/50 text-jam-dark dark:text-slate-200' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Upload New Files</button>
                <button onClick={() => setActiveTab('select')} className={`flex-1 p-2 text-sm font-medium ${activeTab === 'select' ? 'bg-white dark:bg-slate-700/50 text-jam-dark dark:text-slate-200' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Select from Project Files</button>
            </div>
            <div className="p-3 bg-white/50 dark:bg-slate-900/30 max-h-48 overflow-y-auto">
                {activeTab === 'upload' ? (
                    <div>
                        <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="w-full text-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:border-jam-blue dark:hover:border-pink-500">
                           <p className="text-sm text-slate-500 dark:text-slate-400">Click or drag to upload temporary files</p>
                        </button>
                        <div className="mt-2 space-y-1">
                            {tempFiles.map((file, i) => <div key={i} className="text-xs p-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">{file.name}</div>)}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {projectFiles.length > 0 ? projectFiles.map(file => (
                            <label key={file.id} className="flex items-center p-2 bg-slate-100 dark:bg-slate-900/50 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700/50 cursor-pointer">
                                <input type="checkbox" checked={selectedProjectFileIds.includes(file.id)} onChange={() => handleProjectFileToggle(file.id)} className="w-4 h-4 text-jam-blue bg-slate-100 border-slate-300 rounded focus:ring-jam-blue dark:focus:ring-pink-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"/>
                                <span className="ml-3 text-xl">{getFileIcon(file.type, file.url)}</span>
                                <span className="ml-2 text-sm font-medium text-jam-dark dark:text-slate-200 truncate">{file.name}</span>
                            </label>
                        )) : <p className="text-sm text-center text-slate-500 dark:text-slate-400 py-4">No files in this project.</p>}
                    </div>
                )}
            </div>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={handleSubmit} disabled={isLoading || !topic.trim()} className="w-full flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-jam-dark rounded-lg hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-700 disabled:bg-slate-400 dark:disabled:bg-slate-600">
            {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : `Generate Flashcards (${totalSelectedFiles} files)`}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default FileManagerModal;