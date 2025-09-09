import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Flashcard } from '../types';

interface FlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcards: Flashcard[];
  onSave?: () => void;
}

const FlashcardsModal: React.FC<FlashcardsModalProps> = ({ isOpen, onClose, flashcards, onSave }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [isOpen, flashcards]);

  if (!isOpen || flashcards.length === 0) {
    return null;
  }
  
  const handleTransition = (callback: () => void) => {
    setIsAnimating(true);
    setTimeout(() => {
        callback();
        setIsAnimating(false);
    }, 150); // matches transition duration
  };

  const handleNext = () => {
    handleTransition(() => {
        setIsFlipped(false);
        setCurrentIndex(prev => (prev + 1) % flashcards.length);
    });
  };

  const handlePrev = () => {
    handleTransition(() => {
        setIsFlipped(false);
        setCurrentIndex(prev => (prev - 1 + flashcards.length) % flashcards.length);
    });
  };

  const handleFlip = () => {
      handleTransition(() => {
          setIsFlipped(prev => !prev);
      });
  }

  const currentCard = flashcards[currentIndex];
  const cardContent = isFlipped ? currentCard.answer : currentCard.question;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Flashcards (${currentIndex + 1}/${flashcards.length})`}>
      <div className="space-y-4">
        <div
            className="h-64 w-full cursor-pointer flex items-center justify-center p-4 rounded-lg shadow-lg border border-jam-border dark:border-slate-600 bg-white dark:bg-slate-700"
            onClick={handleFlip}
        >
          <p className={`text-center text-lg transition-opacity duration-150 ${isAnimating ? 'opacity-0' : 'opacity-100'} ${isFlipped ? 'font-normal' : 'font-semibold'} text-jam-dark dark:text-slate-200`}>
              {cardContent}
          </p>
        </div>
        
        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            Click card to flip
        </div>

        <div className="flex justify-between items-center pt-2">
          <button onClick={handlePrev} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
            Previous
          </button>
          <div className="flex-grow text-center">
            {onSave && (
                <button onClick={onSave} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                    Save as Task
                </button>
            )}
          </div>
          <button onClick={handleNext} className="px-4 py-2 text-sm font-medium text-white bg-jam-dark rounded-lg hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-700">
            Next
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default FlashcardsModal;