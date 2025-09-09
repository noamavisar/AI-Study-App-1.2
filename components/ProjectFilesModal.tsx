import React, { useState, useRef } from 'react';
import Modal from './Modal';
import { ProjectFile } from '../types';
import { getFileIcon, formatFileSize, parseGoogleUrl } from '../utils/fileUtils';

interface ProjectFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  onAddFiles: (files: FileList) => void;
  onAddLinkFile: (url: string, name: string) => void;
  onDeleteFile: (fileId: string) => void;
}

const ProjectFilesModal: React.FC<ProjectFilesModalProps> = ({ isOpen, onClose, files, onAddFiles, onAddLinkFile, onDeleteFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onAddFiles(event.target.files);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleAddLink = () => {
    if (linkUrl.trim()) {
        const name = linkName.trim() || parseGoogleUrl(linkUrl).name;
        onAddLinkFile(linkUrl.trim(), name);
        setLinkUrl('');
        setLinkName('');
        setIsAddingLink(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project Files">
      <div className="space-y-4">
        {/* Actions */}
        <div className="flex space-x-2">
          <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <button onClick={handleUploadClick} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-jam-dark rounded-lg hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-700 transition-colors">
            Upload Local Files
          </button>
          <button onClick={() => setIsAddingLink(true)} className="flex-1 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
            Add Link
          </button>
        </div>
        
        {isAddingLink && (
            <div className="p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg space-y-2 border border-jam-border dark:border-slate-700">
                <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="Paste URL (e.g., Google Doc)"
                    className="block w-full bg-white dark:bg-slate-900 border border-jam-border dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-jam-blue dark:focus:ring-pink-500 sm:text-sm"
                />
                <input
                    type="text"
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                    placeholder="Document Name (optional)"
                    className="block w-full bg-white dark:bg-slate-900 border border-jam-border dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-jam-blue dark:focus:ring-pink-500 sm:text-sm"
                />
                <div className="flex justify-end space-x-2">
                    <button onClick={() => setIsAddingLink(false)} className="px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">Cancel</button>
                    <button onClick={handleAddLink} className="px-3 py-1 text-xs font-medium text-white bg-jam-dark dark:bg-pink-600 rounded-md hover:bg-black dark:hover:bg-pink-700">Save Link</button>
                </div>
            </div>
        )}

        {/* File List */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-2 border-t border-jam-border dark:border-slate-700 pt-4">
          {files.length > 0 ? (
            files.map(file => (
              <div key={file.id} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-900/50 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700/50">
                <a 
                    href={file.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`flex items-center space-x-3 truncate ${file.sourceType === 'link' ? 'cursor-pointer' : 'cursor-default'}`}
                    onClick={(e) => file.sourceType !== 'link' && e.preventDefault()}
                >
                  <span className="text-xl">{getFileIcon(file.type, file.url)}</span>
                  <div className="truncate">
                    <p className="text-sm font-medium text-jam-dark dark:text-slate-200 truncate" title={file.name}>{file.name}</p>
                    {file.sourceType === 'local' && <p className="text-xs text-slate-500 dark:text-slate-400">{formatFileSize(file.size)}</p>}
                  </div>
                </a>
                <button onClick={() => onDeleteFile(file.id)} className="text-slate-400 hover:text-red-500 flex-shrink-0 ml-2" title="Delete file">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M5 3.25A2.25 2.25 0 0 1 7.25 1h1.5A2.25 2.25 0 0 1 11 3.25v.5h-6v-.5Zm-1.5.5v.5A2.25 2.25 0 0 0 5.75 6h4.5A2.25 2.25 0 0 0 12.5 4.25v-.5h-9Z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M4.5 6.5A.75.75 0 0 0 3.75 7.25v6.5c0 .414.336.75.75.75h7.5a.75.75 0 0 0 .75-.75v-6.5a.75.75 0 0 0-.75-.75h-7.5Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
              <p className="text-sm text-slate-500 dark:text-slate-400">No files or links in this project.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ProjectFilesModal;
