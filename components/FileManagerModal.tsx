import React, { useState, useRef } from 'react';
import Modal from './Modal';
import { formatBytes, getFileIcon } from '../utils/fileUtils';

interface FileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (files: File[], prompt: string) => void;
  isLoading: boolean;
}

const FileManagerModal: React.FC<FileManagerModalProps> = ({ isOpen, onClose, onGenerate, isLoading }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 0) {
        setFiles(prev => [...prev, ...selectedFiles]);
    }
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (fileToRemove: File) => {
    setFiles(prev => prev.filter(file => file !== fileToRemove));
  };

  const handleGenerate = () => {
    if (files.length === 0) {
      setError('Please upload at least one file.');
      return;
    }
    if (!prompt.trim()) {
      setError('Please provide a topic or focus for the flashcards.');
      return;
    }
    setError(null);
    onGenerate(files, prompt);
  };
  
  const handleClose = () => {
      setFiles([]);
      setError(null);
      setPrompt('');
      onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generate Flashcards with AI">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Upload study materials and provide a topic to generate flashcards.
        </p>

        <div>
            <label htmlFor="flashcard-prompt" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Focus Topic</label>
            <input
                type="text"
                id="flashcard-prompt"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="e.g., key formulas, important dates"
                className="mt-1 block w-full bg-white dark:bg-slate-900 border border-jam-border dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-jam-blue dark:focus:ring-pink-500 sm:text-sm"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Study Materials</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-jam-border dark:border-slate-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-slate-600 dark:text-slate-400">
                        <label htmlFor="flashcard-file-upload" className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-jam-blue dark:text-pink-500 hover:text-jam-dark dark:hover:text-pink-400">
                            <span>Upload files</span>
                            <input id="flashcard-file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} ref={fileInputRef}/>
                        </label>
                    </div>
                    <p className="text-xs text-slate-500">PDF, PNG, JPG, TXT</p>
                </div>
            </div>
        </div>

        {files.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {files.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-900/50 rounded-md">
                       <div className="flex items-center space-x-3 truncate">
                           <span className="text-xl">{getFileIcon(file.type)}</span>
                           <div className="truncate">
                            <p className="text-sm font-medium text-jam-dark dark:text-slate-200 truncate" title={file.name}>{file.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(file.size)}</p>
                           </div>
                       </div>
                       <button onClick={() => removeFile(file)} className="text-slate-400 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                    </div>
                ))}
            </div>
        )}

        {error && <p className="text-sm text-red-500 bg-red-500/10 p-2 rounded-md">{error}</p>}
        
        <div className="flex justify-end pt-2">
            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-jam-dark rounded-lg hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating Cards...
                    </>
                ) : 'Generate Flashcards'}
            </button>
        </div>
      </div>
    </Modal>
  );
};

export default FileManagerModal;
