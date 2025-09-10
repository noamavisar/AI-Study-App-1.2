import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { Flashcard } from '../types';

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


const FlashcardsModal: React.FC<FlashcardsModalProps> = ({ isOpen, onClose, flashcards, onForceRender, isRendering }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const frontContentRef = useRef<HTMLDivElement>(null);
  const backContentRef = useRef<HTMLDivElement>(null);

  // When the modal opens or flashcards change, reset to the first card
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [isOpen, flashcards]);
  
  // When the card content changes, re-render the math for both faces
  useEffect(() => {
    const renderMath = async () => {
        try {
            await ensureMathJaxIsReady();
            if (frontContentRef.current && backContentRef.current && flashcards.length > 0) {
                const sanitize = (text: string) => {
                    // Remove paragraph/break tags and excessive whitespace to ensure natural text flow,
                    // letting MathJax handle layout for math expressions.
                    return text
                      .replace(/<\/?p>|<br\s*\/?>|\n/g, ' ')
                      .replace(/\s\s+/g, ' ')
                      .trim();
                };

                const question = sanitize(flashcards[currentIndex].question);
                const answer = sanitize(flashcards[currentIndex].answer);

                // Set the raw HTML content for both sides
                frontContentRef.current.innerHTML = question;
                backContentRef.current.innerHTML = answer;
                // Ask MathJax to typeset both elements
                window.MathJax.typesetPromise([frontContentRef.current, backContentRef.current]);
            }
        } catch (error) {
            console.error("MathJax rendering failed:", error);
        }
    };

    if (isOpen && flashcards.length > 0) {
        renderMath();
    }
  }, [currentIndex, flashcards, isOpen]);


  if (!isOpen || flashcards.length === 0) {
    return null;
  }
  
  const handleNext = () => {
    setIsFlipped(false);
    // Allow flip animation to start before changing content
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Study Flashcards">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-full h-64 [perspective:1000px]" onClick={() => setIsFlipped(f => !f)}>
          <div
            className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
              isFlipped ? '[transform:rotateY(180deg)]' : ''
            }`}
          >
            {/* Front Face */}
            <div className="absolute w-full h-full p-6 flex items-start justify-center [backface-visibility:hidden] overflow-y-auto bg-white dark:bg-slate-700 border border-jam-border dark:border-slate-600 rounded-lg">
              <div ref={frontContentRef} dir="auto" className="prose prose-lg dark:prose-invert max-w-none break-words w-full"></div>
            </div>
            {/* Back Face */}
            <div className="absolute w-full h-full p-6 flex items-start justify-center [backface-visibility:hidden] overflow-y-auto bg-slate-100 dark:bg-slate-900 [transform:rotateY(180deg)] border border-jam-border dark:border-slate-600 rounded-lg">
              <div ref={backContentRef} dir="auto" className="prose prose-lg dark:prose-invert max-w-none break-words w-full"></div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center w-full space-x-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Card {currentIndex + 1} of {flashcards.length}
            </p>
            <button
                onClick={onForceRender}
                disabled={isRendering}
                className="flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-wait transition-colors"
                title="If formulas are broken, click here to fix them."
            >
                {isRendering ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-500 mr-1.5"></div>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
                        <path d="M11.25 5.337c0-.923.634-1.696 1.5-1.928a.75.75 0 0 0 .5-1.341 9.5 9.5 0 0 0-3.41-1.026 1 1 0 0 0-.82.26L.29 10.29a1 1 0 0 0 0 1.414l5.656 5.657a1 1 0 0 0 1.414 0l8.98-8.98a1 1 0 0 0 .26-.82 9.504 9.504 0 0 0-1.026-3.41.75.75 0 0 0-1.342.5c.231.866.231 1.731 0 2.598a.75.75 0 0 1-1.5 0c0-.867 0-1.732 0-2.598Z" />
                        <path d="M11.25 5.337c0-.923.634-1.696 1.5-1.928a.75.75 0 0 0 .5-1.341 9.5 9.5 0 0 0-3.41-1.026 1 1 0 0 0-.82.26L.29 10.29a1 1 0 0 0 0 1.414l5.656 5.657a1 1 0 0 0 1.414 0l8.98-8.98a1 1 0 0 0 .26-.82 9.504 9.504 0 0 0-1.026-3.41.75.75 0 0 0-1.342.5c.231.866.231 1.731 0 2.598a.75.75 0 0 1-1.5 0c0-.867 0-1.732 0-2.598ZM15 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
                        <path d="M16 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm1 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                    </svg>
                )}
                <span>{isRendering ? 'Fixing...' : 'Fix Formulas'}</span>
            </button>
        </div>

        <div className="flex items-center justify-between w-full pt-2">
          <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
            Prev
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsFlipped(f => !f); }} className="px-6 py-2 text-sm font-medium text-white bg-jam-blue rounded-lg hover:bg-blue-500 dark:bg-pink-600 dark:hover:bg-pink-700">
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