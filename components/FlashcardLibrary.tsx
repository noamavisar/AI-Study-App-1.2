import React from 'react';
import { FlashcardDeck } from '../types';

interface FlashcardLibraryProps {
    decks: FlashcardDeck[];
    onStudyDeck: (deck: FlashcardDeck) => void;
    onDeleteDeck: (deckId: string) => void;
}

const FlashcardLibrary: React.FC<FlashcardLibraryProps> = ({ decks, onStudyDeck, onDeleteDeck }) => {
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
                            <button onClick={() => onStudyDeck(deck)} className="flex-1 text-left truncate">
                                <p className="text-sm font-medium text-jam-dark dark:text-slate-200 truncate" title={deck.topic}>{deck.topic}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{deck.flashcards.length} cards</p>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Are you sure you want to delete the flashcard deck "${deck.topic}"?`)) {
                                        onDeleteDeck(deck.id)
                                    }
                                }}
                                className="ml-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete deck"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M5 3.25A2.25 2.25 0 0 1 7.25 1h1.5A2.25 2.25 0 0 1 11 3.25v.5h-6v-.5Zm-1.5.5v.5A2.25 2.25 0 0 0 5.75 6h4.5A2.25 2.25 0 0 0 12.5 4.25v-.5h-9Z" clipRule="evenodd" />
                                    <path fillRule="evenodd" d="M4.5 6.5A.75.75 0 0 0 3.75 7.25v6.5c0 .414.336.75.75.75h7.5a.75.75 0 0 0 .75-.75v-6.5a.75.75 0 0 0-.75-.75h-7.5Z" clipRule="evenodd" />
                                </svg>
                            </button>
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