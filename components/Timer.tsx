import React, { useState, useEffect, useRef, useCallback } from 'react';

// Define and export the TimerSettings type, as it is imported by App.tsx
export interface TimerSettings {
  pomodoro: number;
  shortBreak: number;
  exam: number;
}

interface TimerProps {
  settings: TimerSettings;
  pomodoros: number;
  onSettingsChange: (newSettings: TimerSettings) => void;
  onPomodorosChange: (newCount: number) => void;
}

type TimerMode = 'pomodoro' | 'shortBreak' | 'exam';

const Timer: React.FC<TimerProps> = ({ settings, pomodoros, onSettingsChange, onPomodorosChange }) => {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(settings.pomodoro * 60);
  const [isActive, setIsActive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editableSettings, setEditableSettings] = useState(settings);

  const intervalRef = useRef<number | null>(null);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setTimeLeft(settings[mode] * 60);
  }, [mode, settings]);
  
  useEffect(() => {
    setEditableSettings(settings);
  }, [settings]);

  useEffect(() => {
    resetTimer();
  }, [mode, settings, resetTimer]);
  
  useEffect(() => {
    const handleTimerEnd = () => {
      if (mode === 'pomodoro') {
        onPomodorosChange(pomodoros + 1);
      }
      // Auto-switch modes
      if (mode === 'pomodoro') {
        setMode('shortBreak');
      } else {
        setMode('pomodoro');
      }
    };
    
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime > 1) {
            return prevTime - 1;
          }
          // Timer finished
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsActive(false);
          handleTimerEnd();
          return 0;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, mode, onPomodorosChange, pomodoros]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };
  
  const switchMode = (newMode: TimerMode) => {
    if (isActive && !window.confirm('A timer is running. Are you sure you want to switch and reset?')) {
        return;
    }
    setMode(newMode);
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableSettings(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleSaveSettings = () => {
    onSettingsChange(editableSettings);
    setIsSettingsOpen(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const modeLabels: Record<TimerMode, string> = {
    pomodoro: 'Focus',
    shortBreak: 'Short Break',
    exam: 'Exam Session',
  };
  
  const totalSeconds = settings[mode] * 60;
  const progress = totalSeconds > 0 ? (totalSeconds - timeLeft) / totalSeconds * 100 : 0;
  const progressCircumference = 2 * Math.PI * 54; // 2 * pi * radius

  return (
    <div className="p-4 rounded-lg shadow-lg border border-jam-border dark:border-slate-700 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-jam-dark dark:text-slate-200">Timer</h3>
        <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="text-slate-400 hover:text-jam-dark dark:hover:text-slate-200" title="Timer Settings">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 3.75a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM10 8.75a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM.75 3.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0ZM15.25 3.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0ZM.75 12a2 2 0 1 1 4 0 2 2 0 0 1-4 0ZM15.25 12a2 2 0 1 1 4 0 2 2 0 0 1-4 0Z" /></svg>
        </button>
      </div>

      {isSettingsOpen ? (
        <div className="space-y-3">
            {(Object.keys(settings) as TimerMode[]).map(key => (
                <div key={key}>
                    <label htmlFor={`timer-${key}`} className="block text-sm font-medium text-slate-600 dark:text-slate-300 capitalize">
                        {modeLabels[key]} (minutes)
                    </label>
                    <input type="number" id={`timer-${key}`} name={key} value={editableSettings[key as TimerMode]} onChange={handleSettingsChange} className="mt-1 block w-full bg-white dark:bg-slate-900 border border-jam-border dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-jam-blue dark:focus:ring-pink-500 sm:text-sm" />
                </div>
            ))}
            <button onClick={handleSaveSettings} className="w-full px-4 py-2 text-sm font-medium text-white bg-jam-dark rounded-lg hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-700">Save Settings</button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4">
            <div className="flex space-x-2 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-full">
                {(Object.keys(settings) as TimerMode[]).map(m => (
                    <button key={m} onClick={() => switchMode(m)} className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-colors ${mode === m ? 'bg-white dark:bg-slate-800/80 text-jam-dark dark:text-slate-100 shadow' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/40'}`}>
                        {modeLabels[m]}
                    </button>
                ))}
            </div>

            <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" strokeWidth="12" className="stroke-slate-200 dark:stroke-slate-700" />
                    <circle cx="60" cy="60" r="54" fill="none" strokeWidth="12" className="stroke-jam-blue dark:stroke-pink-500 transition-all duration-300" strokeDasharray={progressCircumference} strokeDashoffset={progressCircumference * (1 - progress / 100)} strokeLinecap="round" />
                </svg>
                <div className="text-4xl sm:text-5xl font-bold text-jam-dark dark:text-slate-100 tabular-nums">{formatTime(timeLeft)}</div>
            </div>

            <div className="flex items-center space-x-4">
                <button onClick={resetTimer} className="p-3 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors" title="Reset Timer">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M15.312 5.312a.75.75 0 0 1 0 1.062L9.413 12.23l.128.143a.75.75 0 0 1-1.122 1.002l-2.5-2.25a.75.75 0 0 1 0-1.06l2.5-2.25a.75.75 0 1 1 1.06 1.06l-1.728 1.54 5.48-5.908a.75.75 0 0 1 1.062 0ZM5.69 5.312a.75.75 0 0 1 1.062 0l5.908 5.48-1.54-1.728a.75.75 0 1 1 1.06-1.06l2.25 2.5a.75.75 0 0 1-1.06 1.06l-2.25-2.5a.75.75 0 0 1 1.002-1.122l.143.128L5.69 6.375a.75.75 0 0 1 0-1.062Z" clipRule="evenodd" /></svg>
                </button>
                <button onClick={toggleTimer} className="px-8 py-3 text-lg font-bold text-white bg-jam-dark rounded-full hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-700 shadow-lg">
                    {isActive ? 'Pause' : 'Start'}
                </button>
                <div className="text-center">
                    <div className="text-2xl font-bold text-jam-orange dark:text-orange-400">{pomodoros}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Sessions</div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Timer;
