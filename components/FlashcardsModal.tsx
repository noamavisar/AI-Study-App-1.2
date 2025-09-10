import React, { useState, useEffect, useRef, useMemo } from 'react';
import Modal from './Modal';
import { Flashcard, FlashcardReviewStatus } from '../types';

declare global {
  interface Window {
    MathJax: any;
  }
}

interface FlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcards: Flashcard[];
  onForceRender: () => void;
  isRendering: boolean;
  studyingDeckId: string | null;
  onUpdateFlashcardStatus: (deckId: string, cardIndex: number, status: FlashcardReviewStatus) => void;
  maxWidth?: string;
}

// Helper to wait for MathJax to be loaded and ready.
function ensureMathJaxIsReady(timeout = 7000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (window.MathJax && window.MathJax.startup?.promise) {
        window.MathJax.startup.promise.then(() => {
          clearInterval(interval);
          resolve();
        });
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error("MathJax failed to load in time for rendering."));
      }
    }, 100);
  });
}

const FlashcardsModal: React.FC<FlashcardsModalProps> = ({ isOpen, onClose, flashcards, onForceRender, isRendering, studyingDeckId, onUpdateFlashcardStatus, maxWidth }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<FlashcardReviewStatus | 'All'>('All');
  const frontContentRef = useRef<HTMLDivElement>(null);
  const backContentRef = useRef<HTMLDivElement>(null);

  const filteredFlashcards = useMemo(() => {
    const cardsWithOriginalIndex = flashcards.map((card, index) => ({
        ...card,
        originalIndex: index,
        reviewStatus: card.reviewStatus || FlashcardReviewStatus.New,
    }));

    if (reviewFilter === 'All') {
        return cardsWithOriginalIndex;
    }
    return cardsWithOriginalIndex.filter(card => card.reviewStatus === reviewFilter);
  }, [flashcards, reviewFilter]);

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [reviewFilter]);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setReviewFilter('All');
    }
  }, [isOpen, flashcards]);
  
  useEffect(() => {
    const renderMath = async () => {
        try {
            await ensureMathJaxIsReady();
            const currentCard = filteredFlashcards[currentIndex];

            if (!currentCard || !frontContentRef.current || !backContentRef.current) {
                if (frontContentRef.current) frontContentRef.current.innerHTML = '';
                if (backContentRef.current) backContentRef.current.innerHTML = '';
                return;
            }

            const sanitize = (text: string) => {
                let sanitizedText = text.replace(/\\\[/g, '\\(').replace(/\\\]/g, '\\)').replace(/\$\$/g, '$');
                sanitizedText = sanitizedText
                  .replace(/<\/?p>|<br\s*\/?>|\n/g, ' ')
                  .replace(/\s\s+/g, ' ')
                  .trim();
                return sanitizedText;
            };

            frontContentRef.current.innerHTML = sanitize(currentCard.question);
            backContentRef.current.innerHTML = sanitize(currentCard.answer);
            window.MathJax.typesetPromise([frontContentRef.current, backContentRef.current]);

        } catch (error) {
            console.error("MathJax rendering failed:", error);
        }
    };

    if (isOpen) {
        renderMath();
    }
  }, [currentIndex, filteredFlashcards, isOpen]);

  if (!isOpen || flashcards.length === 0) {
    return null;
  }
  
  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
       setCurrentIndex(prev => (prev + 1) % filteredFlashcards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex(prev => (prev - 1 + filteredFlashcards.length) % filteredFlashcards.length);
    }, 150);
  };
  
  const handleMarkAs = (status: FlashcardReviewStatus) => {
    const currentCard = filteredFlashcards[currentIndex];
    if (studyingDeckId && currentCard) {
        onUpdateFlashcardStatus(studyingDeckId, currentCard.originalIndex, status);
    }
  };

  const currentCard = filteredFlashcards[currentIndex];

  const reviewStatusConfig: { [key in FlashcardReviewStatus]: { color: string, label: string } } = {
    [FlashcardReviewStatus.New]: { color: 'bg-slate-400 dark:bg-slate-500', label: 'New' },
    [FlashcardReviewStatus.NeedsReview]: { color: 'bg-yellow-400 dark:bg-yellow-500', label: 'Needs Review' },
    [FlashcardReviewStatus.Learned]: { color: 'bg-green-400 dark:bg-green-500', label: 'Learned' },
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Study Flashcards" maxWidth={maxWidth}>
      <div className="flex flex-col items-center space-y-4">
        {/* Top bar with filter and tools */}
        <div className="w-full flex justify-between items-center gap-4">
          <select
            value={reviewFilter}
            onChange={(e) => setReviewFilter(e.target.value as FlashcardReviewStatus | 'All')}
            className="w-full bg-slate-100 dark:bg-slate-900 border border-jam-border dark:border-slate-700 rounded-md shadow-sm py-2 px-3 text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-jam-blue dark:focus:ring-pink-500 sm:text-sm"
          >
            <option value="All">All Cards</option>
            <option value={FlashcardReviewStatus.New}>New</option>
            <option value={FlashcardReviewStatus.NeedsReview}>Needs Review</option>
            <option value={FlashcardReviewStatus.Learned}>Learned</option>
          </select>
          <button
              onClick={onForceRender}
              disabled={isRendering}
              className="group relative flex items-center p-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-jam-border dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-wait transition-colors"
              title="Fix broken formulas"
          >
              {isRendering ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-500"></div>
              ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M11.25 5.337c0-.923.634-1.696 1.5-1.928a.75.75 0 0 0 .5-1.341 9.5 9.5 0 0 0-3.41-1.026 1 1 0 0 0-.82.26L.29 10.29a1 1 0 0 0 0 1.414l5.656 5.657a1 1 0 0 0 1.414 0l8.98-8.98a1 1 0 0 0 .26-.82 9.504 9.504 0 0 0-1.026-3.41.75.75 0 0 0-1.342.5c.231.866.231 1.731 0 2.598a.75.75 0 0 1-1.5 0c0-.867 0-1.732 0-2.598Z" /><path d="M11.25 5.337c0-.923.634-1.696 1.5-1.928a.75.75 0 0 0 .5-1.341 9.5 9.5 0 0 0-3.41-1.026 1 1 0 0 0-.82.26L.29 10.29a1 1 0 0 0 0 1.414l5.656 5.657a1 1 0 0 0 1.414 0l8.98-8.98a1 1 0 0 0 .26-.82 9.504 9.504 0 0 0-1.026-3.41.75.75 0 0 0-1.342.5c.231.866.231 1.731 0 2.598a.75.75 0 0 1-1.5 0c0-.867 0-1.732 0-2.598ZM15 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" /><path d="M16 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm1 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /></svg>
              )}
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">{isRendering ? 'Fixing...' : 'Fix Formulas'}</span>
          </button>
        </div>

        {filteredFlashcards.length > 0 ? (
            <>
                <div className="w-full h-80 [perspective:1200px]" onClick={() => setIsFlipped(f => !f)}>
                <div
                    className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
                    isFlipped ? '[transform:rotateY(180deg)]' : ''
                    }`}
                >
                    {/* Front Face */}
                    <div className="absolute w-full h-full [backface-visibility:hidden] flex items-center justify-center bg-gradient-to-br from-slate-50 to-white dark:from-slate-700 dark:to-slate-800 border border-jam-border dark:border-slate-600/50 rounded-xl shadow-2xl">
                        <div className="relative w-full h-full p-6 flex items-start justify-center overflow-y-auto">
                             <div className={`absolute top-2 right-2 px-2 py-0.5 text-xs text-white rounded-full ${reviewStatusConfig[currentCard.reviewStatus!].color}`}>
                                {reviewStatusConfig[currentCard.reviewStatus!].label}
                            </div>
                            <div ref={frontContentRef} dir="auto" className="prose prose-xl dark:prose-invert max-w-none break-words w-full"></div>
                        </div>
                    </div>
                    {/* Back Face */}
                    <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-jam-border dark:border-slate-600/50 rounded-xl shadow-2xl">
                        <div className="relative w-full h-full p-6 flex items-start justify-center overflow-y-auto">
                            <div className={`absolute top-2 right-2 px-2 py-0.5 text-xs text-white rounded-full ${reviewStatusConfig[currentCard.reviewStatus!].color}`}>
                                {reviewStatusConfig[currentCard.reviewStatus!].label}
                            </div>
                            <div ref={backContentRef} dir="auto" className="prose prose-xl dark:prose-invert max-w-none break-words w-full"></div>
                        </div>
                    </div>
                </div>
                </div>
                
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Card {currentIndex + 1} of {filteredFlashcards.length}
                </p>

                <div className="w-full h-24 flex items-center justify-center">
                  {isFlipped ? (
                    <div className="w-full p-3 bg-slate-100 dark:bg-slate-900 rounded-lg animate-fade-in">
                      <p className="text-center text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">How well did you know this?</p>
                      <div className="flex items-center justify-center w-full space-x-3">
                          <button
                              onClick={(e) => { e.stopPropagation(); handleMarkAs(FlashcardReviewStatus.NeedsReview); handleNext(); }}
                              className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200 dark:hover:bg-yellow-900"
                          >
                              Again
                          </button>
                          <button
                              onClick={(e) => { e.stopPropagation(); handleMarkAs(FlashcardReviewStatus.Learned); handleNext(); }}
                              className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-200 dark:hover:bg-green-900"
                          >
                              Good
                          </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full space-x-4 pt-2 animate-fade-in">
                        <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="p-3 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600/50 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1 0 1.06L9.06 10l3.73 3.71a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" /></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setIsFlipped(f => !f); }} className="flex items-center space-x-2 px-6 py-3 text-md font-semibold text-white bg-jam-blue rounded-full hover:bg-blue-500 dark:bg-pink-600 dark:hover:bg-pink-700 shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M15.312 5.312a.75.75 0 0 1 0 1.062L9.413 12.23l.128.143a.75.75 0 0 1-1.122 1.002l-2.5-2.25a.75.75 0 0 1 0-1.06l2.5-2.25a.75.75 0 1 1 1.06 1.06l-1.728 1.54 5.48-5.908a.75.75 0 0 1 1.062 0ZM5.69 5.312a.75.75 0 0 1 1.062 0l5.908 5.48-1.54-1.728a.75.75 0 1 1 1.06-1.06l2.25 2.5a.75.75 0 0 1-1.06 1.06l-2.25-2.5a.75.75 0 0 1 1.002-1.122l.143.128L5.69 6.375a.75.75 0 0 1 0-1.062Z" clipRule="evenodd" /></svg>
                            <span>Answer</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="p-3 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600/50 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 0-1.06L10.94 10 7.21 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0Z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                  )}
                </div>
            </>
        ) : (
             <div className="w-full h-80 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">No cards in this category.</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try selecting a different filter.</p>
            </div>
        )}
      </div>
    </Modal>
  );
};

export default FlashcardsModal;