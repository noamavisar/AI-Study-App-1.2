import React, { useState, useEffect, useCallback } from 'react';

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';
interface TimerSettings {
    pomodoro: number;
    shortBreak: number;
    longBreak: number;
}

const Timer: React.FC = () => {
  const [settings, setSettings] = useState<TimerSettings>({
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
  });
  const [tempSettings, setTempSettings] = useState<TimerSettings>(settings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [time, setTime] = useState(settings.pomodoro * 60);
  const [isActive, setIsActive] = useState(false);
  const [pomodoros, setPomodoros] = useState(() => {
    try {
      const saved = localStorage.getItem('studySprintPomodoros');
      return saved ? JSON.parse(saved) : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    try {
        const savedSettings = localStorage.getItem('studySprintTimerSettings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setSettings(parsed);
            setTempSettings(parsed);
            if (!isActive) {
               setTime(parsed[mode] * 60);
            }
        }
    } catch (error) {
        console.error("Failed to load timer settings from local storage", error);
    }
  }, [isActive, mode]);

  useEffect(() => {
    try {
        localStorage.setItem('studySprintPomodoros', JSON.stringify(pomodoros));
    } catch (error) {
        console.error("Failed to save pomodoros", error);
    }
  }, [pomodoros]);

  const switchMode = useCallback((newMode: TimerMode) => {
    setIsActive(false);
    setMode(newMode);
    setTime(settings[newMode] * 60);
  }, [settings]);

  useEffect(() => {
    let interval: number | null = null;
    if (isActive && time > 0) {
      interval = window.setInterval(() => {
        setTime(t => t - 1);
      }, 1000);
    } else if (isActive && time === 0) {
      if (mode === 'pomodoro') {
        const newPomodoroCount = pomodoros + 1;
        setPomodoros(newPomodoroCount);
        if (newPomodoroCount % 4 === 0) {
          switchMode('longBreak');
        } else {
          switchMode('shortBreak');
        }
      } else {
        switchMode('pomodoro');
      }
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isActive, time, mode, pomodoros, switchMode]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTime(settings[mode] * 60);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTempSettings(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleSaveSettings = () => {
    setSettings(tempSettings);
    localStorage.setItem('studySprintTimerSettings', JSON.stringify(tempSettings));
    setIsSettingsOpen(false);
    if (!isActive) {
        setTime(tempSettings[mode] * 60);
    }
  };
  
  const progressCircleStyles = {
    pomodoro: 'text-jam-pink',
    shortBreak: 'text-jam-green',
    longBreak: 'text-jam-blue',
  }

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const totalDuration = settings[mode] * 60;
  const progress = totalDuration > 0 ? time / totalDuration : 0;
  const offset = circumference - progress * circumference;

  return (
    <div className="p-6 rounded-lg shadow-lg border border-jam-border dark:border-slate-700 bg-white dark:bg-slate-800 relative">
      <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="absolute top-4 right-4 text-slate-400 hover:text-jam-dark dark:hover:text-slate-200 transition-colors" aria-label="Timer settings">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M11.078 2.25c-.217 0-.424.04-.622.116l-6.25 2.5A.75.75 0 0 0 3.75 5.5v6.528a.75.75 0 0 0 .406.684l6.25 2.5a.75.75 0 0 0 .688 0l6.25-2.5a.75.75 0 0 0 .406-.684V5.5a.75.75 0 0 0-.406-.684l-6.25-2.5a.75.75 0 0 0-.622-.116ZM12.25 5.168l-4.5 1.8a.75.75 0 0 0 0 1.364l4.5 1.8a.75.75 0 0 0 1-1.364l-4.5-1.8a.75.75 0 0 0-1 1.364l4.5 1.8a.75.75 0 0 0 1-1.364l-4.5-1.8a.75.75 0 0 0-1 1.364l4.5 1.8a.75.75 0 0 0 1-1.364V5.168a.75.75 0 0 0-1.5 0v.001Z" clipRule="evenodd" />
        </svg>
      </button>

      <div className="flex justify-center space-x-2 mb-4 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg">
        <button onClick={() => switchMode('pomodoro')} className={`px-3 py-1 text-sm rounded-md w-full ${mode === 'pomodoro' ? 'bg-white dark:bg-slate-700 shadow-sm text-jam-dark dark:text-slate-200 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>Pomodoro</button>
        <button onClick={() => switchMode('shortBreak')} className={`px-3 py-1 text-sm rounded-md w-full ${mode === 'shortBreak' ? 'bg-white dark:bg-slate-700 shadow-sm text-jam-dark dark:text-slate-200 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>Short</button>
        <button onClick={() => switchMode('longBreak')} className={`px-3 py-1 text-sm rounded-md w-full ${mode === 'longBreak' ? 'bg-white dark:bg-slate-700 shadow-sm text-jam-dark dark:text-slate-200 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>Long</button>
      </div>
      <div className="my-6">
        <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
            <svg className="absolute w-full h-full" viewBox="0 0 120 120">
                <circle
                    className="text-slate-200 dark:text-slate-700"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="60"
                    cy="60"
                />
                <circle
                    className={`${progressCircleStyles[mode]} transition-all duration-500`}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="60"
                    cy="60"
                    transform="rotate(-90 60 60)"
                />
            </svg>
            <p className="text-5xl font-mono font-bold text-jam-dark dark:text-slate-200 z-10">{formatTime(time)}</p>
        </div>
      </div>
      <div className="flex justify-center space-x-4">
        <button onClick={toggleTimer} className="px-8 py-3 bg-jam-dark text-white font-semibold rounded-lg hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-700 shadow-md transition-all">
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button onClick={resetTimer} className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-11.667-11.667a8.25 8.25 0 0 1 11.667 0l3.181 3.183m-14.85-3.183L6.163 6" />
            </svg>
        </button>
      </div>
       
      {isSettingsOpen && (
        <div className="mt-6 border-t border-jam-border dark:border-slate-700 pt-4 space-y-3 animate-fade-in">
            <h4 className="text-sm font-semibold text-center text-jam-dark dark:text-slate-200 mb-3">Timer Settings (minutes)</h4>
            <div className="grid grid-cols-3 gap-x-4 text-sm">
                <div>
                    <label htmlFor="pomodoro" className="block text-xs text-slate-500 dark:text-slate-400 text-center mb-1">Pomodoro</label>
                    <input type="number" name="pomodoro" id="pomodoro" value={tempSettings.pomodoro} onChange={handleSettingsChange} className="w-full bg-slate-100 dark:bg-slate-900 border-jam-border dark:border-slate-600 rounded-md text-center py-1 text-jam-dark dark:text-slate-200"/>
                </div>
                <div>
                    <label htmlFor="shortBreak" className="block text-xs text-slate-500 dark:text-slate-400 text-center mb-1">Short</label>
                    <input type="number" name="shortBreak" id="shortBreak" value={tempSettings.shortBreak} onChange={handleSettingsChange} className="w-full bg-slate-100 dark:bg-slate-900 border-jam-border dark:border-slate-600 rounded-md text-center py-1 text-jam-dark dark:text-slate-200"/>
                </div>
                <div>
                    <label htmlFor="longBreak" className="block text-xs text-slate-500 dark:text-slate-400 text-center mb-1">Long</label>
                    <input type="number" name="longBreak" id="longBreak" value={tempSettings.longBreak} onChange={handleSettingsChange} className="w-full bg-slate-100 dark:bg-slate-900 border-jam-border dark:border-slate-600 rounded-md text-center py-1 text-jam-dark dark:text-slate-200"/>
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
                <button onClick={() => setIsSettingsOpen(false)} className="px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
                <button onClick={handleSaveSettings} className="px-3 py-1 text-xs font-medium text-white bg-jam-dark dark:bg-pink-600 rounded-md hover:bg-black dark:hover:bg-pink-700">Save</button>
            </div>
        </div>
      )}
       
       <p className="text-center text-slate-500 dark:text-slate-400 text-sm mt-4 flex items-center justify-center space-x-2">
            <span>Completed: {pomodoros}</span>
            {pomodoros > 0 && (
                <button 
                    onClick={() => { if(window.confirm('Are you sure you want to reset your pomodoro count?')) setPomodoros(0) }} 
                    className="text-slate-400 hover:text-jam-dark dark:hover:text-slate-200 transition-colors" 
                    title="Reset count"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
                    </svg>
                </button>
            )}
        </p>
    </div>
  );
};

export default Timer;