import React, { useRef } from 'react';
import { ProjectFile } from '../types';
import { getFileIcon } from '../utils/fileUtils';
import Modal from './Modal';

interface ProjectFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  onAddFiles: (files: FileList) => void;
  onDeleteFile: (fileId: string) => void;
}

const ProjectFilesModal: React.FC<ProjectFilesModalProps> = ({ isOpen, onClose, files, onAddFiles, onDeleteFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project Files">
      <div className="space-y-4">
        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193v-.443A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>
                </button>
                </div>
            ))
            ) : (
            <div className="text-center py-10 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                <p className="text-sm text-slate-500 dark:text-slate-400">No files uploaded for this project.</p>
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
        <div className="flex justify-end pt-4 mt-2 border-t border-jam-border dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
                Done
            </button>
        </div>
      </div>
    </Modal>
  );
};

export default ProjectFilesModal;
