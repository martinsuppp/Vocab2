import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getWords } from '../api';
import { ArrowLeft, ArrowRight, RotateCw, Home as HomeIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SoundManager from '../utils/SoundManager'; // Import SoundManager

const MemoryMode = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const filename = searchParams.get('filename');

    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadWords = async () => {
            if (!filename) return;
            try {
                const data = await getWords(filename);
                setWords(data);
            } catch (error) {
                console.error("Failed to load words", error);
            } finally {
                setLoading(false);
            }
        };
        loadWords();
    }, [filename]);

    const handleNext = (e) => {
        e.stopPropagation();
        SoundManager.playClick(); // Play click sound
        if (currentIndex < words.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
        }
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        SoundManager.playClick(); // Play click sound
        if (currentIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
        }
    };

    const handleFlip = () => {
        SoundManager.playFlip(); // Play flip sound
        setIsFlipped(!isFlipped);
    };

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') {
                handleNext(e);
            } else if (e.key === 'ArrowLeft') {
                handlePrev(e);
            } else if (e.key === 'ArrowUp') {
                handleFlip();
            } else if (e.key === ' ') { // Optional: Space to flip too
                handleFlip();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, isFlipped, words.length]); // Dependencies for state access

    if (loading) return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;
    if (words.length === 0) return <div className="flex h-screen items-center justify-center text-white">No words found or file error.</div>;

    const currentWord = words[currentIndex];

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-900">
            <div className="w-full max-w-2xl mb-6 flex justify-between items-center text-slate-400">
                <button onClick={() => navigate('/')} className="hover:text-white transition-colors">
                    <HomeIcon className="w-6 h-6" />
                </button>
                <div className="text-sm font-medium">
                    {currentIndex + 1} / {words.length}
                </div>
            </div>

            <div
                className="relative w-full max-w-md aspect-[4/3] cursor-pointer perspective-1000 group"
                onClick={handleFlip}
            >
                <motion.div
                    initial={false}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                    className="w-full h-full relative preserve-3d"
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    {/* Front (English) */}
                    <div className="absolute inset-0 backface-hidden bg-slate-800 rounded-3xl shadow-2xl flex flex-col items-center justify-center border-2 border-slate-700 group-hover:border-blue-500/50 transition-colors">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest absolute top-8">Term</span>
                        <h2 className="text-5xl font-bold text-white text-center px-4 break-words">
                            {currentWord.word}
                        </h2>
                        <p className="absolute bottom-8 text-slate-500 text-sm flex items-center gap-2">
                            <RotateCw className="w-4 h-4" /> Tap to flip
                        </p>
                    </div>

                    {/* Back (Translation) */}
                    <div
                        className="absolute inset-0 backface-hidden bg-slate-800 rounded-3xl shadow-2xl flex flex-col items-center justify-center border-2 border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900"
                        style={{ transform: 'rotateY(180deg)' }}
                    >
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest absolute top-8">Definition</span>
                        <h2 className="text-4xl font-bold text-blue-100 text-center px-4 break-words leading-relaxed">
                            {currentWord.translation}
                        </h2>
                    </div>
                </motion.div>
            </div>

            <div className="flex items-center gap-8 mt-10">
                <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="p-4 rounded-full bg-slate-800 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                <button
                    onClick={handleNext}
                    disabled={currentIndex === words.length - 1}
                    className="p-4 rounded-full bg-blue-600 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 transform active:scale-95"
                >
                    <ArrowRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default MemoryMode;
