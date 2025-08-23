import React, { useState } from 'react';
import Modal from './Modal';
import { LearningResource, ResourceType } from '../types';
import { RESOURCE_TYPES } from '../constants';

interface LearningResourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateSprint: (resources: Omit<LearningResource, 'id'>[], days: number) => void;
  isLoading: boolean;
}

const LearningResourcesModal: React.FC<LearningResourcesModalProps> = ({ isOpen, onClose, onGenerateSprint, isLoading }) => {
  const [resources, setResources] = useState<Omit<LearningResource, 'id'>[]>([]);
  const [sprintDays, setSprintDays] = useState<number>(7);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    const newResources = Array.from(files).map(file => ({
      file,
      type: ResourceType.LearningMaterial // Default type
    }));
    setResources(prev => [...prev, ...newResources]);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };


  const handleResourceTypeChange = (index: number, type: ResourceType) => {
    setResources(prev => prev.map((res, i) => i === index ? { ...res, type } : res));
  };

  const handleRemoveResource = (index: number) => {
    setResources(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (resources.length > 0 && sprintDays > 0) {
      onGenerateSprint(resources, sprintDays);
    }
  };
  
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Plan Sprint with AI">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Upload Your Learning Materials</label>
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative block w-full border-2 ${isDragging ? 'border-jam-blue dark:border-pink-500' : 'border-jam-border dark:border-slate-600'} border-dashed rounded-lg p-6 text-center hover:border-jam-blue/80 dark:hover:border-pink-500/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jam-blue dark:focus:ring-pink-500 transition-colors`}
          >
             <svg className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="mt-2 block text-sm font-semibold text-slate-600 dark:text-slate-300">Drag & drop files or click to upload</span>
            <p className="text-xs text-slate-500 dark:text-slate-400">PDF, PPTX, DOCX</p>
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              onChange={e => handleFileChange(e.target.files)}
              multiple
              accept=".pdf,.pptx,.docx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />
          </div>
        </div>

        {resources.length > 0 && (
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {resources.map((resource, index) => (
              <div key={index} className="flex items-center justify-between bg-white dark:bg-slate-900/50 p-2 rounded-md border border-jam-border dark:border-slate-700">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-jam-dark dark:text-slate-200 truncate">{resource.file.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(resource.file.size)}</p>
                </div>
                <div className="flex items-center space-x-2 ml-2">
                  <select
                    value={resource.type}
                    onChange={e => handleResourceTypeChange(index, e.target.value as ResourceType)}
                    className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md shadow-sm py-1 px-2 text-xs text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-jam-blue dark:focus:ring-pink-500 focus:border-jam-blue dark:focus:border-pink-500"
                  >
                    {RESOURCE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <button onClick={() => handleRemoveResource(index)} className="text-slate-400 hover:text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <label htmlFor="sprint-days" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Days Until Exam</label>
          <input
            type="number"
            id="sprint-days"
            value={sprintDays}
            onChange={e => setSprintDays(parseInt(e.target.value, 10) || 1)}
            min="1"
            className="mt-1 block w-full bg-white dark:bg-slate-900 border border-jam-border dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-jam-blue dark:focus:ring-pink-500 focus:border-jam-blue dark:focus:border-pink-500 sm:text-sm"
          />
        </div>

        <div className="flex justify-end pt-2">
            <button 
                onClick={handleSubmit} 
                disabled={isLoading || resources.length === 0}
                className="w-full flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-jam-dark rounded-lg hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating Plan...
                    </>
                ) : 'Generate Study Plan'}
            </button>
        </div>
        {isLoading && <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">This may take a minute, especially with large files...</p>}
      </div>
    </Modal>
  );
};

export default LearningResourcesModal;