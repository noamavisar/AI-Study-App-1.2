import React, { useState } from 'react';
import Modal from './Modal';
import { Task } from '../types';
import { importFromGoogleSheet } from '../services/googleSheetService';

interface ImportFromSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (tasks: Omit<Task, 'id'>[]) => void;
}

const ImportFromSheetModal: React.FC<ImportFromSheetModalProps> = ({ isOpen, onClose, onImport }) => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetName, setSheetName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!sheetUrl.trim() || !sheetName.trim()) {
      setError('Please provide both a Google Sheet URL and a Sheet Name.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const tasks = await importFromGoogleSheet(sheetUrl, sheetName);
      if (tasks.length === 0) {
          setError("No tasks were found. Check your sheet content and column headers ('Task', 'Done', 'Priority', 'Do date').");
      } else {
          onImport(tasks);
      }
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import from Google Sheets">
      <div className="space-y-4">
        <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
            <p>Quickly add tasks from your existing study plans.</p>
            <ol className="list-decimal list-inside space-y-1 pl-2 text-xs">
                <li>In your Google Sheet, click the <span className="font-semibold">Share</span> button.</li>
                <li>Under "General access", select <span className="font-semibold">"Anyone with the link"</span>.</li>
                <li>Copy the link and paste it below.</li>
                <li>Enter the exact name of the sheet tab to import.</li>
            </ol>
        </div>

        <div>
          <label htmlFor="sheet-url" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Google Sheet URL</label>
          <input
            type="url"
            id="sheet-url"
            value={sheetUrl}
            onChange={e => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="mt-1 block w-full bg-white dark:bg-slate-900 border border-jam-border dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-jam-blue dark:focus:ring-pink-500 focus:border-jam-blue dark:focus:border-pink-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="sheet-name" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Sheet Name</label>
          <input
            type="text"
            id="sheet-name"
            value={sheetName}
            onChange={e => setSheetName(e.target.value)}
            placeholder="e.g., Table2"
            className="mt-1 block w-full bg-white dark:bg-slate-900 border border-jam-border dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-jam-blue dark:focus:ring-pink-500 focus:border-jam-blue dark:focus:border-pink-500 sm:text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-500 bg-red-500/10 p-2 rounded-md">{error}</p>}
        
        <div className="flex justify-end pt-2">
            <button 
                onClick={handleImport} 
                disabled={isLoading}
                className="w-full flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-jam-dark rounded-lg hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Importing...
                    </>
                ) : 'Import Tasks'}
            </button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportFromSheetModal;
