import React, { useRef, useState } from 'react';
import { ProjectFile } from '../types';
import { getFileIcon } from '../utils/fileUtils';

interface ProjectFilesProps {
  files: ProjectFile[];
  onAddFiles: (files: FileList) => void;
  onDeleteFile: (fileId: string) => void;
}

const ProjectFiles: React.FC<ProjectFilesProps> = ({ files, onAddFiles, onDeleteFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onAddFiles(event.target.files);
    }
    // Reset the input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  return (
    <div className="rounded-lg shadow-lg border border-jam-border dark:border-slate-700 bg-white dark:bg-slate-800 transition-all duration-300">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 font-semibold text-jam-dark dark:text-slate-200"
        aria-expanded={isExpanded}
        aria-controls="project-files-content"
      >
        <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 text-jam-blue dark:text-pink-500">
              <path d="M3.75 2a.75.75 0 0 0-.75.75v14.5a.75.75 0 0 0 .75.75h12.5a.75.75 0 0 0 .75-.75V8.25a.75.75 0 0 0-.75-.75h-5a.75.75 0 0 1-.75-.75V2a.75.75 0 0 0-.75-.75H3.75Z" />
              <path d="M14.25 2a.75.75 0 0 0-.75.75v5.25c0 .414.336.75.75.75h5.25a.75.75 0 0 0 .75-.75V2a.75.75 0 0 0-.75-.75h-5.25Z" />
            </svg>
            <span>Project Files</span>
        </div>
        <div className="flex items-center">
            <span className="text-xs font-normal bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-2 py-0.5 mr-2">{files.length}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`}>
              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
        </div>
      </button>
      
      <div 
        id="project-files-content"
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px]' : 'max-h-0'}`}
      >
        <div className="px-6 pb-6">
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto pr-2 border-t border-jam-border dark:border-slate-700 pt-4">
                {files.length > 0 ? (
                files.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-900/50 rounded-md">
                    <div className="flex items-center space-x-3 truncate">
                        <span className="text-xl">{getFileIcon(file.type)}</span>
                        <p className="text-sm font-medium text-jam-dark dark:text-slate-200 truncate" title={file.name}>
                        {file.name}
                        </p>
                    </div>
                    <button
                        onClick={() => onDeleteFile(file.id)}
                        className="text-slate-400 hover:text-red-500 flex-shrink-0 ml-2"
                        title="Delete file"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M5 3.25A2.25 2.25 0 0 1 7.25 1h1.5A2.25 2.25 0 0 1 11 3.25v.5h-6v-.5Zm-1.5.5v.5A2.25 2.25 0 0 0 5.75 6h4.5A2.25 2.25 0 0 0 12.5 4.25v-.5h-9Z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M4.5 6.5A.75.75 0 0 0 3.75 7.25v6.5c0 .414.336.75.75.75h7.5a.75.75 0 0 0 .75-.75v-6.5a.75.75 0 0 0-.75-.75h-7.5Z" clipRule="evenodd" />
                        </svg>
                    </button>
                    </div>
                ))
                ) : (
                <div className="text-center py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No files uploaded.</p>
                </div>
                )}
            </div>

            <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
            <button
                onClick={handleUploadClick}
                className="w-full px-4 py-2 text-sm font-semibold text-white bg-jam-dark rounded-lg hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-700 transition-colors"
            >
                Upload Files
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectFiles;