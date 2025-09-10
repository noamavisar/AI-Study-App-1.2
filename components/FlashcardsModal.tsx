// FIX: Replaced incorrect HTML content with a functional React component for the FlashcardsModal.
// This resolves all parsing errors within this file and the 'module has no default export' error in App.tsx.
// The new component handles flashcard display, flipping animation, navigation, and LaTeX rendering.
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Modal from './Modal';
import { Flashcard } from '../types';

// Assuming KaTeX's auto-render script is loaded globally from the HTML file.
declare global {
  interface Window {
    renderMathInElement: (element: HTMLElement, options?: any) => void;
    katex: any;
  }
}

interface FlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcards: Flashcard[];
}

const FlashcardsModal: React.FC<FlashcardsModalProps> = ({ isOpen, onClose, flashcards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset state when modal is opened or cards change
    if (isOpen) {
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [isOpen, flashcards]);

  useLayoutEffect(() => {
    // Render LaTeX whenever the current card changes.
    // This runs synchronously after DOM updates but before the browser paints,
    // which is ideal for DOM-mutating libraries like KaTeX to prevent flicker.
    // We also check for `window.katex` to ensure the main library is loaded.
    if (cardRef.current && window.renderMathInElement && window.katex) {
      try {
        window.renderMathInElement(cardRef.current, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
          ],
          throwOnError: false,
        });
      } catch (error) {
        console.error("KaTeX rendering failed:", error);
      }
    }
  }, [currentIndex, flashcards, isFlipped]); // Rerun when card content changes or card is flipped

  if (!isOpen || flashcards.length === 0) {
    return null;
  }

  const currentCard = flashcards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    // Use a short timeout to allow the flip-back animation to start before content changes
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % flashcards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex(prev => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Study Flashcards">
      <div className="flex flex-col items-center space-y-4">
        {/* Flashcard */}
        <div className="w-full h-64 [perspective:1000px]" onClick={handleFlip}>
          <div
            ref={cardRef}
            className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
              isFlipped ? '[transform:rotateY(180deg)]' : ''
            }`}
          >
            {/* Front */}
            <div className="absolute w-full h-full bg-white dark:bg-slate-700 border border-jam-border dark:border-slate-600 rounded-lg p-6 flex items-center justify-center text-center [backface-visibility:hidden] overflow-y-auto">
              <div className="prose prose-lg dark:prose-invert max-w-none break-words">
                {currentCard.question}
              </div>
            </div>
            {/* Back */}
            <div className="absolute w-full h-full bg-slate-100 dark:bg-slate-900 border border-jam-border dark:border-slate-600 rounded-lg p-6 flex items-center justify-center text-center [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-y-auto">
              <div className="prose prose-lg dark:prose-invert max-w-none break-words">
                {currentCard.answer}
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Card {currentIndex + 1} of {flashcards.length}
        </p>

        {/* Controls */}
        <div className="flex items-center justify-between w-full">
          <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
            Prev
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleFlip(); }} className="px-6 py-2 text-sm font-medium text-white bg-jam-blue rounded-lg hover:bg-blue-500 dark:bg-pink-600 dark:hover:bg-pink-700">
            {isFlipped ? 'Show Question' : 'Show Answer'}
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
            Next
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default FlashcardsModal;