import React, { useState, useRef } from 'react';
import Modal from './Modal';
import { ProjectFile } from '../types';
import { getFileIcon } from '../utils/fileUtils';
import { getFile } from '../utils/idb';

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
  
  const totalSelectedFiles = tempFiles.length + selectedProjectFileIds.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate AI Flashcards">
      <div className="space-y-4">
        <div>
          <label htmlFor="flashcard-topic" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Flashcard Topic</label>
          <input 
            type="text" 
            id="flashcard-topic" 
            value={topic} 
            onChange={e => setTopic(e.target.value)} 
            placeholder="e.g., Key Concepts in Photosynthesis" 
            className="mt-1 block w-full bg-white dark:bg-slate-900 border border-jam-border dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-jam-blue dark:focus:ring-pink-500 sm:text-sm" 
          />
        </div>
        
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