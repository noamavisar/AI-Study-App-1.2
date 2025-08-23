import React, { useState, useCallback } from 'react';
import Modal from './Modal';
import { Flashcard } from '../types';
import { generateFlashcards } from '../services/geminiService';

interface FlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FlashcardsModal: React.FC<FlashcardsModalProps> = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const resetState = () => {
    setPrompt('');
    setFiles([]);
    setIsLoading(false);
    setError(null);
    setFlashcards([]);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  }

  const handleFileChange = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    setFiles(prev => [...prev, ...Array.from(selectedFiles)]);
  };
  
  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const handleGenerate = async () => {
    if (files.length === 0 || !prompt.trim()) {
        setError("Please upload at least one file and provide a prompt.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const generated = await generateFlashcards(files, prompt);
        if (generated.length === 0) {
            setError("The AI couldn't generate any flashcards from the provided materials. Please try a different prompt or file.");
        }
        setFlashcards(generated);
    } catch (e: any) {
        setError(e.message || "An unknown error occurred.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentCardIndex(prev => (prev + 1) % flashcards.length);
    }, 150);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
     setTimeout(() => {
        setCurrentCardIndex(prev => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };


  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="AI Flashcard Generator">
      {flashcards.length === 0 ? (
        // Generation View
        <div className="space-y-4">
          <div
            onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
            className={`relative block w-full border-2 ${isDragging ? 'border-jam-blue dark:border-pink-500' : 'border-jam-border dark:border-slate-600'} border-dashed rounded-lg p-6 text-center hover:border-jam-blue/80 dark:hover:border-pink-500/80 transition-colors`}
          >
             <svg className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="mt-2 block text-sm font-semibold text-slate-600 dark:text-slate-300">Drag & drop files or click to upload</span>
            <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => handleFileChange(e.target.files)} multiple />
          </div>
          
          {files.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                  {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white dark:bg-slate-900/50 border border-jam-border dark:border-slate-700 p-2 rounded-md text-sm">
                          <p className="text-jam-dark dark:text-slate-200 truncate pr-2">{file.name}</p>
                          <button onClick={() => handleRemoveFile(index)} className="text-slate-400 hover:text-red-500">&times;</button>
                      </div>
                  ))}
              </div>
          )}

          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Prompt</label>
            <textarea
                id="prompt"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={3}
                placeholder="e.g., 'Create flashcards for key definitions in chapter 2'"
                className="mt-1 block w-full bg-white dark:bg-slate-900 border border-jam-border dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-jam-dark dark:text-slate-200 focus:outline-none focus:ring-jam-blue dark:focus:ring-pink-500 focus:border-jam-blue dark:focus:border-pink-500 sm:text-sm"
            />
          </div>
          
          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end pt-2">
            <button 
                onClick={handleGenerate} 
                disabled={isLoading || files.length === 0 || !prompt.trim()}
                className="w-full flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-jam-dark rounded-lg hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
                {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Generate Flashcards'}
            </button>
          </div>
        </div>
      ) : (
        // Viewer View
        <div className="flex flex-col items-center space-y-4">
            <div className="w-full [perspective:1000px]">
                <div
                    className={`relative w-full h-64 transition-transform duration-500 [transform-style:preserve-d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    {/* Front of Card */}
                    <div className="absolute w-full h-full p-6 bg-jam-yellow dark:bg-yellow-900/50 rounded-lg shadow-lg flex items-center justify-center text-center [backface-visibility:hidden]">
                        <p className="text-lg text-jam-dark dark:text-yellow-200">{flashcards[currentCardIndex].question}</p>
                    </div>
                    {/* Back of Card */}
                    <div className="absolute w-full h-full p-6 bg-jam-green dark:bg-green-900/50 rounded-lg shadow-lg flex items-center justify-center text-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
                        <p className="text-md text-jam-dark dark:text-green-200">{flashcards[currentCardIndex].answer}</p>
                    </div>
                </div>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">{currentCardIndex + 1} / {flashcards.length}</p>

            <div className="flex items-center justify-between w-full">
                <button onClick={handlePrevCard} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 text-jam-dark dark:text-slate-200">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1 0 1.06L9.06 10l3.73 3.71a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" /></svg>
                </button>
                <button onClick={() => setIsFlipped(!isFlipped)} className="px-4 py-2 text-sm font-medium text-white bg-jam-dark rounded-lg hover:bg-black dark:bg-pink-600 dark:hover:bg-pink-700">
                    Flip Card
                </button>
                <button onClick={handleNextCard} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 text-jam-dark dark:text-slate-200">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 0-1.06L10.94 10 7.21 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0Z" clipRule="evenodd" /></svg>
                </button>
            </div>
             <button onClick={resetState} className="text-sm text-slate-500 dark:text-slate-400 hover:text-jam-dark dark:hover:text-slate-200 mt-2">
                &larr; Generate new cards
            </button>
        </div>
      )}
    </Modal>
  );
};

export default FlashcardsModal;