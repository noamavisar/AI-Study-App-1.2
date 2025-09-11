import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface TimerSettings {
  pomodoro: number;
  shortBreak: number;
  exam: number;
  promptForRitual?: boolean;
}

interface TimerProps {
  settings: TimerSettings;
  pomodoros: number;
  onSettingsChange: (newSettings: TimerSettings) => void;
  onPomodorosChange: (newCount: number) => void;
}

type TimerMode = 'pomodoro' | 'shortBreak' | 'exam' | 'stopper';

const RitualConfirmationModal: React.FC<{
  onConfirm: () => void;
  onCancel: () => void;
  onToggleDoNotAsk: (checked: boolean) => void;
}> = ({ onConfirm, onCancel, onToggleDoNotAsk }) => (
    <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl max-w-sm w-full border border-jam-border dark:border-slate-700">
            <h3 className="text-lg font-bold text-jam-dark dark:text-slate-100">Ready for Deep Focus?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                Have you silenced your phone, closed extra tabs, and prepared your workspace?
            </p>
            <div className="mt-4">
                <label className="flex items-center text-sm text-slate-500 dark:text-slate-400 cursor-pointer">
                    <input type="checkbox" onChange={e => onToggleDoNotAsk(e.target.checked)} className="mr-2 rounded text-jam-blue dark:text-pink-500 focus:ring-jam-blue dark:focus:ring-pink-500" />
                    Do not ask again for this project
                </label>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
                <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
                <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-jam-dark rounded-lg hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-700">Start Focus</button>
            </div>
        </div>
    </div>
);

const Timer: React.FC<TimerProps> = ({ settings, pomodoros, onSettingsChange, onPomodorosChange }) => {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  
  // Countdown Timer State
  const [timeLeft, setTimeLeft] = useState(settings.pomodoro * 60);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const countdownIntervalRef = useRef<number | null>(null);

  // Stopwatch State
  const [stopperTime, setStopperTime] = useState(0); // in milliseconds
  const [isStopperActive, setIsStopperActive] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const stopperIntervalRef = useRef<number | null>(null);

  // Settings & Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editableSettings, setEditableSettings] = useState(settings);
  const [isRitualModalOpen, setIsRitualModalOpen] = useState(false);
  const [doNotAskAgain, setDoNotAskAgain] = useState(false);

  const resetTimer = useCallback((newMode?: TimerMode) => {
    const targetMode = newMode || mode;
    if (targetMode === 'stopper') {
        if (stopperIntervalRef.current) clearInterval(stopperIntervalRef.current);
        setIsStopperActive(false);
        setStopperTime(0);
        setLaps([]);
    } else {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setIsCountdownActive(false);
        const newTime = (settings[targetMode as keyof Omit<TimerSettings, 'promptForRitual'>] || settings.pomodoro) * 60;
        setTimeLeft(newTime);
    }
  }, [mode, settings]);
  
  useEffect(() => {
    setEditableSettings(settings);
  }, [settings]);

  useEffect(() => {
    resetTimer(mode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, mode]);

  const handleModeChange = (newMode: TimerMode) => {
    setIsCountdownActive(false);
    setIsStopperActive(false);
    if(countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if(stopperIntervalRef.current) clearInterval(stopperIntervalRef.current);
    setMode(newMode);
  };
  
  // Countdown Timer Effect
  useEffect(() => {
    if (!isCountdownActive || mode === 'stopper') {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        return;
    }

    countdownIntervalRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          new Audio("https://cdn.pixabay.com/audio/2022/10/17/audio_152398544d.mp3").play();

          if (mode === 'pomodoro') {
            const newPomodoros = pomodoros + 1;
            onPomodorosChange(newPomodoros);
            handleModeChange('shortBreak');
          } else {
            handleModeChange('pomodoro');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isCountdownActive, mode, onPomodorosChange, pomodoros, handleModeChange]);

  // Stopwatch Effect
  useEffect(() => {
    if (!isStopperActive || mode !== 'stopper') {
        if (stopperIntervalRef.current) clearInterval(stopperIntervalRef.current);
        return;
    }
    
    const startTime = Date.now() - stopperTime;
    stopperIntervalRef.current = window.setInterval(() => {
        setStopperTime(Date.now() - startTime);
    }, 50); // Update frequently for smooth display

    return () => {
        if (stopperIntervalRef.current) clearInterval(stopperIntervalRef.current);
    };
  }, [isStopperActive, stopperTime, mode]);

  const toggleTimer = () => {
    if (mode === 'stopper') {
        setIsStopperActive(!isStopperActive);
    } else {
        if (!isCountdownActive && mode === 'pomodoro' && settings.promptForRitual) {
            setIsRitualModalOpen(true);
            return;
        }
        setIsCountdownActive(!isCountdownActive);
    }
  };

  const handleLap = () => {
    setLaps(prev => [stopperTime, ...prev]);
  };
  
  const handleSettingsSave = () => {
    onSettingsChange(editableSettings);
    setIsSettingsOpen(false);
  };
  
  const handleConfirmRitual = () => {
    if (doNotAskAgain) {
        onSettingsChange({ ...settings, promptForRitual: false });
    }
    setIsRitualModalOpen(false);
    setIsCountdownActive(true);
  };

  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    if (hours > 0) {
        return `${String(hours)}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const formatStopperTime = (timeInMs: number) => {
    const totalSeconds = Math.floor(timeInMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((timeInMs % 1000) / 10);
    
    if (hours > 0) {
        return `${String(hours)}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
  };

  const modeConfigs = {
    pomodoro: { label: 'Deep Focus', color: 'bg-pink-600', progress: 'stroke-pink-500' },
    shortBreak: { label: 'Break', color: 'bg-blue-500', progress: 'stroke-blue-500' },
    exam: { label: 'Exam', color: 'bg-purple-600', progress: 'stroke-purple-500' },
    stopper: { label: 'Stopper', color: 'bg-pink-600', progress: '' },
  };

  const currentConfig = modeConfigs[mode];
  const progress = mode !== 'stopper' ? (timeLeft / (settings[mode as keyof Omit<TimerSettings, 'promptForRitual'>] * 60)) * 100 : 0;
  const timeDisplay = mode === 'stopper' ? formatStopperTime(stopperTime) : formatTime(timeLeft);
  
  const timeFontClass = () => {
      // If the time string includes hours (i.e., has two colons), use a smaller font.
      const hasHours = timeDisplay.split(':').length > 2;
      if (hasHours) {
          // Smaller font size for HH:MM:SS format to prevent overflow.
          return 'text-2xl sm:text-4xl';
      }
      // Larger font size for standard MM:SS or MM:SS.ms formats.
      return 'text-4xl sm:text-5xl';
  };

  const isCountdownRunning = mode !== 'stopper' && isCountdownActive;
  const isStopperRunning = mode === 'stopper' && isStopperActive;

  return (
    <div className="p-4 rounded-lg shadow-lg border border-jam-border dark:border-slate-700 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm">
      {isRitualModalOpen && (
        <RitualConfirmationModal 
            onConfirm={handleConfirmRitual} 
            onCancel={() => setIsRitualModalOpen(false)} 
            onToggleDoNotAsk={setDoNotAskAgain}
        />
      )}
      {/* Mode Selector */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-1 bg-slate-200 dark:bg-slate-900/50 p-1 rounded-full">
            {(Object.keys(modeConfigs) as TimerMode[]).map(m => (
                <button key={m} onClick={() => handleModeChange(m)} className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${mode === m ? `text-white ${modeConfigs[m].color}` : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>
                    {modeConfigs[m].label}
                </button>
            ))}
        </div>
        <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M11.078 2.25c-.217 0-.424.04-.622.116l-6.25 2.5A.75.75 0 0 0 3.75 5.5v6.528a.75.75 0 0 0 .406.684l6.25 2.5a.75.75 0 0 0 .688 0l6.25-2.5a.75.75 0 0 0 .406-.684V5.5a.75.75 0 0 0-.406-.684l-6.25-2.5a.75.75 0 0 0-.622-.116ZM12.25 5.168l-4.5 1.8a.75.75 0 0 0 0 1.364l4.5 1.8a.75.75 0 0 0 1-1.364l-4.5-1.8a.75.75 0 0 0-1 1.364l4.5 1.8a.75.75 0 0 0 1-1.364l-4.5-1.8a.75.75 0 0 0-1 1.364l4.5 1.8a.75.75 0 0 0 1-1.364V5.168a.75.75 0 0 0-1.5 0v.001Z" clipRule="evenodd" /></svg>
        </button>
      </div>

      {isSettingsOpen ? (
        <div className="space-y-4 p-2 animate-fade-in">
            <h4 className="font-semibold text-jam-dark dark:text-slate-200">Timer Durations (minutes)</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
                <div><label>Deep Focus</label><input type="number" value={editableSettings.pomodoro} onChange={e => setEditableSettings(s => ({...s, pomodoro: +e.target.value}))} className="w-full mt-1 p-1 rounded bg-white/50 dark:bg-slate-900/50 border border-jam-border dark:border-slate-700"/></div>
                <div><label>Break</label><input type="number" value={editableSettings.shortBreak} onChange={e => setEditableSettings(s => ({...s, shortBreak: +e.target.value}))} className="w-full mt-1 p-1 rounded bg-white/50 dark:bg-slate-900/50 border border-jam-border dark:border-slate-700"/></div>
                <div><label>Exam</label><input type="number" value={editableSettings.exam} onChange={e => setEditableSettings(s => ({...s, exam: +e.target.value}))} className="w-full mt-1 p-1 rounded bg-white/50 dark:bg-slate-900/50 border border-jam-border dark:border-slate-700"/></div>
            </div>
            <div>
              <label className="flex items-center text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={editableSettings.promptForRitual} onChange={e => setEditableSettings(s => ({ ...s, promptForRitual: e.target.checked }))} className="mr-2 rounded text-jam-blue dark:text-pink-500 focus:ring-jam-blue dark:focus:ring-pink-500" />
                  Prompt for Deep Focus Ritual
              </label>
            </div>
            <div className="flex justify-end"><button onClick={handleSettingsSave} className="px-3 py-1.5 text-sm font-semibold text-white bg-jam-dark dark:bg-pink-600 rounded-lg">Save Settings</button></div>
        </div>
      ) : (
        <>
            <div className="relative flex items-center justify-center my-6 h-48">
              {mode !== 'stopper' && (
                  <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                      <circle className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="5" cx="50" cy="50" r="45" fill="none" />
                      <circle className={`transform -rotate-90 origin-center transition-all duration-500 ${currentConfig.progress}`} strokeWidth="5" strokeDasharray="282.7" strokeDashoffset={282.7 - (progress / 100) * 282.7} cx="50" cy="50" r="45" fill="none" strokeLinecap="round" />
                  </svg>
              )}
              <span className={`font-bold text-jam-dark dark:text-slate-100 transition-all ${timeFontClass()} ${mode === 'stopper' ? 'font-mono' : ''}`}>
                  {timeDisplay}
              </span>
            </div>

            <div className="flex items-center justify-center space-x-4">
                {mode === 'stopper' ? (
                    <button onClick={() => resetTimer()} className="p-3 text-slate-500 dark:text-slate-400 hover:text-jam-dark dark:hover:text-white transition-colors" title="Reset Stopwatch">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="M5.5 5.5A.5.5 0 0 1 6 5h8a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5v-8Z" /></svg>
                    </button>
                ) : (
                    <button onClick={() => resetTimer()} className="p-3 text-slate-500 dark:text-slate-400 hover:text-jam-dark dark:hover:text-white transition-colors" title="Reset Timer">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M15.312 5.312a.75.75 0 0 1 0 1.062L9.413 12.23l.128.143a.75.75 0 0 1-1.122 1.002l-2.5-2.25a.75.75 0 0 1 0-1.06l2.5-2.25a.75.75 0 1 1 1.06 1.06l-1.728 1.54 5.48-5.908a.75.75 0 0 1 1.062 0ZM5.69 5.312a.75.75 0 0 1 1.062 0l5.908 5.48-1.54-1.728a.75.75 0 1 1 1.06-1.06l2.25 2.5a.75.75 0 0 1-1.06 1.06l-2.25-2.5a.75.75 0 0 1 1.002-1.122l.143.128L5.69 6.375a.75.75 0 0 1 0-1.062Z" clipRule="evenodd" /></svg>
                    </button>
                )}
                
                <button onClick={toggleTimer} className={`px-8 py-3 rounded-full text-white font-bold text-lg shadow-lg transition-transform hover:scale-105 ${currentConfig.color}`}>
                    {(isCountdownRunning || isStopperRunning) ? 'PAUSE' : 'START'}
                </button>
                
                {mode === 'stopper' ? (
                     <button onClick={handleLap} disabled={!isStopperRunning} className="p-3 text-slate-500 dark:text-slate-400 hover:text-jam-dark dark:hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Record Lap">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="m3.162 3.822 1.239 3.716a.75.75 0 0 1-1.402.467L1.76 4.289A.75.75 0 0 1 3.162 3.822ZM17.299 15.75a.75.75 0 0 1-1.06 1.06l-4.04-4.041a3.001 3.001 0 0 1-4.243-4.242L12.75 3.73a.75.75 0 0 1 1.061 1.06l-4.773 4.773a1.5 1.5 0 0 0 2.121 2.121l4.041-4.04a.75.75 0 1 1 1.06 1.06l-4.822 4.821a.75.75 0 0 1-1.06-1.06l4.82-4.822ZM4.238 16.5a.75.75 0 0 0 1.06-1.06L1.57 11.713A.75.75 0 0 0 1.5 13.5v3a.75.75 0 0 0 .75.75h3a.75.75 0 0 0 .53-.22Z" /></svg>
                    </button>
                ) : <div className="w-[48px]"></div> }
            </div>
            {mode === 'stopper' && laps.length > 0 && (
                <div className="mt-6 max-h-28 overflow-y-auto pr-2 border-t border-jam-border dark:border-slate-700 pt-4">
                    <ul className="space-y-1 text-sm text-center">
                        {laps.map((lap, index) => (
                            <li key={index} className="flex justify-between p-1.5 rounded-md bg-slate-100 dark:bg-slate-900/50">
                                <span className="font-semibold text-slate-500 dark:text-slate-400">Lap {laps.length - index}</span>
                                <span className="font-mono text-jam-dark dark:text-slate-200">{formatStopperTime(lap)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default Timer;