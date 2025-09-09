import React, { useState, useRef } from 'react';
import Modal from './Modal';
import { LearningResource, ResourceType } from '../types';
import { RESOURCE_TYPES } from '../constants';
import { formatBytes, getFileIcon } from '../utils/fileUtils';

interface LearningResourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (resources: Omit<LearningResource, 'id'>[], days: number) => void;
  isLoading: boolean;
}

const LearningResourcesModal: React.FC<LearningResourcesModalProps> = ({ isOpen, onClose, onGenerate, isLoading }) => {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [days, setDays] = useState(7);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
        const newResources: LearningResource[] = files.map(file => ({
            id: `${file.name}-${file.lastModified}`,
            file,
            type: ResourceType.LearningMaterial, // default type
        }));
        setResources(prev => [...prev, ...newResources]);
    }
    // Reset file input
    if(fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const updateResourceType = (id: string, type: ResourceType) => {
    setResources(prev => prev.map(r => r.id === id ? { ...r, type } : r));
  };

  const removeResource = (id: string) => {
    setResources(prev => prev.filter(r => r.id !== id));
  };

  const handleGenerate = () => {
    if (resources.length === 0) {
      setError('Please upload at least one learning resource.');
      return;
    }
    if (days < 1) {
      setError('Number of days must be at least 1.');
      return;
    }
    setError(null);
    onGenerate(resources, days);
  };
  
  const handleClose = () => {
      setResources([]);
      setError(null);
      setDays(7);
      onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generate Study Sprint with AI">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Upload your course materials (PDFs, notes, images) and let the AI create a personalized study plan for you.
        </p>

        <div>
            <label htmlFor="sprint-days" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Days until exam</label>
            <input
                type="number"
                id="sprint-days"
                value={days}
                onChange={e => setDays(parseInt(e.target.value, 10) || 1)}
                min="1"
                className="mt-1 block w-24 bg-white dark:bg-slate-900 border border-jam-border dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-jam-blue dark:focus:ring-pink-500 sm:text-sm"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Learning Resources</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-jam-border dark:border-slate-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-slate-600 dark:text-slate-400">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-jam-blue dark:text-pink-500 hover:text-jam-dark dark:hover:text-pink-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-jam-blue">
                            <span>Upload files</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} ref={fileInputRef}/>
                        </label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">PDF, PNG, JPG, TXT up to 10MB</p>
                </div>
            </div>
        </div>

        {resources.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {resources.map(resource => (
                    <div key={resource.id} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-900/50 rounded-md">
                       <div className="flex items-center space-x-3 truncate">
                           <span className="text-xl">{getFileIcon(resource.file.type)}</span>
                           <div className="truncate">
                            <p className="text-sm font-medium text-jam-dark dark:text-slate-200 truncate" title={resource.file.name}>{resource.file.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(resource.file.size)}</p>
                           </div>
                       </div>
                       <div className="flex items-center space-x-2">
                           <select value={resource.type} onChange={e => updateResourceType(resource.id, e.target.value as ResourceType)} className="bg-white dark:bg-slate-800 border border-jam-border dark:border-slate-600 rounded-md py-1 px-2 text-xs text-jam-dark dark:text-slate-200 focus:ring-jam-blue dark:focus:ring-pink-500">
                               {RESOURCE_TYPES.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                           </select>
                           <button onClick={() => removeResource(resource.id)} className="text-slate-400 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                       </div>
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
                        Generating Plan...
                    </>
                ) : 'Generate Study Sprint'}
            </button>
        </div>
      </div>
    </Modal>
  );
};

export default LearningResourcesModal;
