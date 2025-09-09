import React, { useState, useEffect } from 'react';
import { LastDeletedTaskInfo } from '../types';

interface UndoToastProps {
  lastDeletedTaskInfo: LastDeletedTaskInfo | null;
  onUndo: () => void;
  onDismiss: () => void;
}

const UndoToast: React.FC<UndoToastProps> = ({ lastDeletedTaskInfo, onUndo, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (lastDeletedTaskInfo) {
      setIsVisible(true);
    } else {
      // Allow fade-out animation before unmounting
      setIsVisible(false);
    }
  }, [lastDeletedTaskInfo]);
  
  if (!lastDeletedTaskInfo) {
      return null;
  }

  return (
    <div 
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex items-center justify-between gap-4 bg-slate-800 text-white rounded-lg shadow-2xl py-3 px-5 border border-slate-700">
        <p className="text-sm font-medium">
          Task "{lastDeletedTaskInfo.task.title}" deleted.
        </p>
        <div className="flex items-center gap-3">
            <button
            onClick={onUndo}
            className="text-sm font-bold text-pink-400 hover:text-pink-300"
            >
            Undo
            </button>
            <button
                onClick={onDismiss}
                className="text-slate-400 hover:text-slate-200"
                aria-label="Dismiss"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                    <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                </svg>
            </button>
        </div>
      </div>
    </div>
  );
};

export default UndoToast;
