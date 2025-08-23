import React, { useState, useEffect } from 'react';

const BrainDump: React.FC = () => {
    const [notes, setNotes] = useState('');

    useEffect(() => {
        try {
            const savedNotes = localStorage.getItem('studySprintBrainDump');
            if (savedNotes) {
                setNotes(savedNotes);
            }
        } catch (e) {
            console.error('Failed to load brain dump notes.', e);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
        try {
            localStorage.setItem('studySprintBrainDump', e.target.value);
        } catch (e) {
            console.error('Failed to save brain dump notes.', e);
        }
    };

    return (
        <div className="bg-jam-yellow-light dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-jam-border dark:border-slate-700">
            <h3 className="font-semibold text-jam-dark dark:text-slate-200 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 text-jam-orange dark:text-orange-400">
                     <path d="M10 3.75a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5a.75.75 0 0 1 .75-.75Z" />
                    <path fillRule="evenodd" d="M5.5 2A2.5 2.5 0 0 0 3 4.5v11A2.5 2.5 0 0 0 5.5 18h9a2.5 2.5 0 0 0 2.5-2.5v-11A2.5 2.5 0 0 0 14.5 2h-9ZM4.5 4.5A1 1 0 0 1 5.5 3.5h9a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-11Z" clipRule="evenodd" />
                </svg>
                Brain Dump
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                A place to capture distracting thoughts so you can stay focused.
            </p>
            <textarea
                value={notes}
                onChange={handleChange}
                placeholder="Got a random idea? Need to remember to call someone? Write it here and get back to your task."
                className="w-full h-32 bg-jam-yellow-light/50 dark:bg-slate-900/50 border-t-2 border-jam-pink dark:border-pink-600 p-2 text-sm text-jam-dark dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-0 focus:outline-none focus:border-jam-orange dark:focus:border-pink-500 resize-none"
                aria-label="Brain Dump Notes"
            />
        </div>
    );
};

export default BrainDump;