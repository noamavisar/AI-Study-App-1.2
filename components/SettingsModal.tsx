import React from 'react';
import Modal from './Modal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAllData: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onClearAllData }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings & Data">
      <div className="space-y-4">
        <div>
          <h3 className="text-md font-semibold text-jam-dark dark:text-slate-200">Local Memory</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Your study plan, tasks, timer settings, pomodoro count, focus score, and brain dump notes are saved automatically to your browser's local storage.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
             This data is private to you and is not sent to any server. It stays on the browser where you created it.
          </p>
        </div>

        <div className="border-t border-jam-border dark:border-slate-700 pt-4">
           <h3 className="text-md font-semibold text-jam-dark dark:text-slate-200">Manage Data</h3>
           <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 mb-3">
            If you want to start fresh, you can clear all locally stored data. This action cannot be undone.
           </p>
           <button
            onClick={onClearAllData}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
           >
            Clear All Study Data
           </button>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;