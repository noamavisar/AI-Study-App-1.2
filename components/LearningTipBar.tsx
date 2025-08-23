import React, { useState, useEffect } from 'react';
import { learningTips } from '../learningTips';

const LearningTipBar: React.FC = () => {
  const [currentTipIndex, setCurrentTipIndex] = useState(() => Math.floor(Math.random() * learningTips.length));

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTipIndex(prevIndex => {
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * learningTips.length);
        } while (newIndex === prevIndex); // Ensure we get a new tip
        return newIndex;
      });
    }, 60000); // Change tip every 60 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  return (
    <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm border-b border-t border-jam-border dark:border-slate-700">
        <div className="container mx-auto flex items-center justify-center text-center p-3">
            <div className="flex items-center space-x-3 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-yellow-400 flex-shrink-0">
                    <path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-1.5 0V2.75A.75.75 0 0 1 10 2ZM5.207 5.207a.75.75 0 0 1 1.06 0l.707.707a.75.75 0 0 1-1.06 1.06l-.707-.707a.75.75 0 0 1 0-1.06ZM2 10a.75.75 0 0 1 .75-.75h1.25a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10ZM5.914 14.086a.75.75 0 0 1 0-1.06l.707-.707a.75.75 0 1 1 1.06 1.06l-.707.707a.75.75 0 0 1-1.06 0ZM14.086 5.914a.75.75 0 0 1 1.06 0l.707.707a.75.75 0 0 1-1.06 1.06l-.707-.707a.75.75 0 0 1 0-1.06ZM18 10a.75.75 0 0 1 .75-.75h1.25a.75.75 0 0 1 0 1.5H18.75A.75.75 0 0 1 18 10ZM13.379 13.379a.75.75 0 0 1 1.06 0l.707.707a.75.75 0 0 1-1.06 1.06l-.707-.707a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    <path d="m10 6.25c-1.933 0-3.5 1.567-3.5 3.5s1.567 3.5 3.5 3.5 3.5-1.567 3.5-3.5-1.567-3.5-3.5-3.5Z" />
                </svg>
                <p className="text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-jam-orange dark:text-orange-400 mr-1">Study Tip:</span>
                    {learningTips[currentTipIndex]}
                </p>
            </div>
        </div>
    </div>
  );
};

export default LearningTipBar;