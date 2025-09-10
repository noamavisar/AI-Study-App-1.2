import React, { useState } from 'react';
import { FlashcardDeck } from '../types';

interface FlashcardLibraryProps {
    decks: FlashcardDeck[];
    onStudyDeck: (deck: FlashcardDeck) => void;
    onDeleteDeck: (deckId: string) => void;
    onUpdateDeckName: (deckId: string, newName: string) => void;
}

const FlashcardLibrary: React.FC<FlashcardLibraryProps> = ({ decks, onStudyDeck, onDeleteDeck, onUpdateDeckName }) => {
    const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const handleStartEdit = (deck: FlashcardDeck) => {
        setEditingDeckId(deck.id);
        setEditingName(deck.name);
    };

    const handleCancelEdit = () => {
        setEditingDeckId(null);
        setEditingName('');
    };

    const handleSaveEdit = () => {
        if (editingDeckId && editingName.trim()) {
            onUpdateDeckName(editingDeckId, editingName.trim());
        }
        handleCancelEdit();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };

    return (
        <div className="p-4 rounded-lg shadow-lg border border-jam-border dark:border-slate-700 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm">
            <h3 className="font-semibold text-jam-dark dark:text-slate-200 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 text-jam-blue dark:text-pink-400">
                    <path fillRule="evenodd" d="M2.5 3A1.5 1.5 0 0 0 1 4.5v11A1.5 1.5 0 0 0 2.5 17h15A1.5 1.5 0 0 0 19 15.5v-11A1.5 1.5 0 0 0 17.5 3h-15Zm3.5 2a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5h-2ZM6 9.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v.75a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-.75Zm.5 2.25a.5.5 0 0 0-.5.5v.75a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-.75a.5.5 0 0 0-.5-.5h-4Z" clipRule="evenodd" />
                </svg>
                Flashcard Decks
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {decks.length > 0 ? (
                    decks.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(deck => (
                        <div key={deck.id} className="group flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-900/50 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700/50">
                            <div className="flex-1 min-w-0 mr-2">
                                {editingDeckId === deck.id ? (
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={e => setEditingName(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="w-full bg-white dark:bg-slate-700 border border-jam-border dark:border-slate-600 rounded-md shadow-sm py-1 px-1.5 text-sm text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-jam-blue dark:focus:ring-pink-500"
                                        autoFocus
                                    />
                                ) : (
                                    <button onClick={() => onStudyDeck(deck)} className="w-full text-left truncate">
                                        <p className="text-sm font-medium text-jam-dark dark:text-slate-200 truncate" title={deck.name}>{deck.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{deck.flashcards.length} cards</p>
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center flex-shrink-0">
                                {editingDeckId === deck.id ? (
                                    <>
                                        <button onClick={handleSaveEdit} className="p-1 text-slate-400 hover:text-green-500" title="Save">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.052-.143Z" clipRule="evenodd" /></svg>
                                        </button>
                                        <button onClick={handleCancelEdit} className="p-1 text-slate-400 hover:text-red-500" title="Cancel">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleStartEdit(deck)} className="p-1 text-slate-400 hover:text-jam-blue dark:hover:text-pink-500" title="Rename deck">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                                                <path d="M11.355 2.203a.75.75 0 0 1 1.06 0l1.182 1.182a.75.75 0 0 1 0 1.06L6.415 12.627a2.251 2.251 0 0 1-1.009.586l-2.433.608a.75.75 0 0 1-.92-.92l.608-2.433a2.251 2.251 0 0 1 .586-1.009L11.355 2.203ZM12.25 4.5l-6.87 6.87a.75.75 0 0 0-.196.336l-.405 1.623 1.623-.405a.75.75 0 0 0 .336-.196L13.5 5.75 12.25 4.5Z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteDeck(deck.id);
                                            }}
                                            className="p-1 text-slate-400 hover:text-red-500"
                                            title="Delete deck"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                                                <path fillRule="evenodd" d="M5 3.25A2.25 2.25 0 0 1 7.25 1h1.5A2.25 2.25 0 0 1 11 3.25v.5h-6v-.5Zm-1.5.5v.5A2.25 2.25 0 0 0 5.75 6h4.5A2.25 2.25 0 0 0 12.5 4.25v-.5h-9Z" clipRule="evenodd" />
                                                <path fillRule="evenodd" d="M4.5 6.5A.75.75 0 0 0 3.75 7.25v6.5c0 .414.336.75.75.75h7.5a.75.75 0 0 0 .75-.75v-6.5a.75.75 0 0 0-.75-.75h-7.5Z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-6">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Generate flashcards with the "AI Flashcards" button to save them here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlashcardLibrary;