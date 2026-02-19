import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getWords } from '../api.js';
import MistakeTracker from '../services/MistakeTracker';
import { ArrowLeft, ArrowRight, RotateCw, Eye, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import SoundManager from '../utils/SoundManager';
import LearningLayout from '../components/LearningLayout';

const MemoryMode = () => {
    const [searchParams] = useSearchParams();

    // Determine source files
    const getTargetFiles = () => {
        const urlParam = searchParams.get('filename');
        if (urlParam) return urlParam;

        const sessionRaw = localStorage.getItem('currentSession');
        if (sessionRaw) {
            const session = JSON.parse(sessionRaw);
            if (session.files && session.files.length > 0) {
                return session.files.join(',');
            }
        }
        return null;
    };

    const filename = getTargetFiles();

    const [words, setWords] = useState([]);
    const [filteredWords, setFilteredWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [autoReveal, setAutoReveal] = useState(false);
    const [weakFilter, setWeakFilter] = useState(0);

    useEffect(() => {
        const loadWords = async () => {
            if (!filename) {
                setLoading(false);
                return;
            }
            try {
                const data = await getWords(filename);
                setWords(data);
                setFilteredWords(data);
            } catch (error) {
                console.error("Failed to load words", error);
            } finally {
                setLoading(false);
            }
        };
        loadWords();
    }, [filename]);

    useEffect(() => {
        if (words.length === 0) return;

        if (weakFilter === 0) {
            setFilteredWords(words);
        } else {
            const wordList = words.map(w => w.word);
            const stats = MistakeTracker.getStats(wordList);

            const filtered = words.filter(w => {
                const s = stats[w.word];
                if (!s) return false;
                const total = s.correct_count + s.mistake_count;
                if (total === 0) return false;

                const errorRate = (s.mistake_count / total) * 100;
                return errorRate >= weakFilter;
            });
            setFilteredWords(filtered);
        }
        setCurrentIndex(0);
        setIsFlipped(false);
    }, [weakFilter, words]);

    const handleNext = (e) => {
        if (e) e.stopPropagation();
        SoundManager.playClick();

        // Step Mode Logic
        if (autoReveal && !isFlipped) {
            setIsFlipped(true); // Step 1: Reveal Answer
            return;
        }

        // Standard/Step 2 Logic: Move to Next Card (Front)
        if (currentIndex < filteredWords.length - 1) {
            setIsFlipped(false); // Reset to Front
            setCurrentIndex(prev => prev + 1); // Move to next
        }
    };

    const handlePrev = (e) => {
        if (e) e.stopPropagation();
        SoundManager.playClick();
        if (currentIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
        }
    };

    const handleFlip = () => {
        SoundManager.playFlip();
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
            } else if (e.key === ' ') {
                handleFlip();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, isFlipped, filteredWords.length]);

    if (loading) {
        return (
            <LearningLayout>
                <div className="h-full flex items-center justify-center text-[#5C4B41]">
                    Loading...
                </div>
            </LearningLayout>
        );
    }

    if (filteredWords.length === 0) {
        return (
            <LearningLayout>
                <div className="h-full flex flex-col items-center justify-center text-[#5C4B41] gap-4">
                    <p>No words found matching criteria.</p>
                    {weakFilter > 0 && (
                        <button
                            onClick={() => setWeakFilter(0)}
                            className="bg-[#2F5D62] text-white px-4 py-2 rounded-lg"
                        >
                            Reset Filter (Show All)
                        </button>
                    )}
                </div>
            </LearningLayout>
        );
    }

    const currentWord = filteredWords[currentIndex];

    return (
        <LearningLayout>
            <div className="flex flex-col items-center justify-center min-h-full py-8 text-[#3D312A]">
                <div className="w-full max-w-md mb-6 flex flex-wrap justify-between items-center text-[#8C7B70] gap-2">
                    <div className="text-sm font-medium bg-white px-4 py-1 rounded-full border border-[#E0D6C8] shadow-sm">
                        {currentIndex + 1} / {filteredWords.length}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Weak Filter Dropdown */}
                        <div className="relative group">
                            <button className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${weakFilter > 0
                                ? 'bg-[#D35D47] text-white border-[#D35D47]'
                                : 'bg-white text-[#8C7B70] border-[#E0D6C8] hover:bg-[#F0EBE0]'
                                }`}>
                                <Filter className="w-3 h-3" />
                                {weakFilter === 0 ? 'All Words' : `> ${weakFilter}% Error`}
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#E0D6C8] overflow-hidden z-10 hidden group-hover:block hover:block">
                                <div className="p-1">
                                    <button onClick={() => setWeakFilter(0)} className="w-full text-left px-4 py-2 text-sm hover:bg-[#F5F1E8] rounded-lg">All Words</button>
                                    <button onClick={() => setWeakFilter(25)} className="w-full text-left px-4 py-2 text-sm hover:bg-[#F5F1E8] rounded-lg text-[#D35D47]">Weak (&gt; 25% Error)</button>
                                    <button onClick={() => setWeakFilter(50)} className="w-full text-left px-4 py-2 text-sm hover:bg-[#F5F1E8] rounded-lg text-[#D35D47]">Very Weak (&gt; 50%)</button>
                                    <button onClick={() => setWeakFilter(75)} className="w-full text-left px-4 py-2 text-sm hover:bg-[#F5F1E8] rounded-lg text-[#D35D47]">Critical (&gt; 75%)</button>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setAutoReveal(!autoReveal)}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${autoReveal
                                ? 'bg-[#2F5D62] text-white border-[#2F5D62]'
                                : 'bg-white text-[#8C7B70] border-[#E0D6C8] hover:bg-[#F0EBE0]'
                                }`}
                            title="Automatically show answer when moving to next card"
                        >
                            <Eye className="w-3 h-3" />
                            {autoReveal ? 'Step Mode ON' : 'Step Mode OFF'}
                        </button>
                    </div>
                </div>

                <div
                    className="relative w-full max-w-md aspect-[4/3] cursor-pointer perspective-1000 group mx-4"
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
                        <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-xl flex flex-col items-center justify-center border border-[#E0D6C8] group-hover:border-[#BFAF9E] transition-colors">
                            <span className="text-xs font-bold text-[#8C7B70] uppercase tracking-widest absolute top-8">Term</span>
                            <h2 className="text-5xl font-bold text-[#3D312A] text-center px-4 break-words font-serif">
                                {currentWord.word}
                            </h2>
                            <p className="absolute bottom-8 text-[#8C7B70] text-sm flex items-center gap-2">
                                <RotateCw className="w-4 h-4" /> Tap to flip
                            </p>
                        </div>

                        {/* Back (Translation) */}
                        <div
                            className="absolute inset-0 backface-hidden bg-[#2F5D62] rounded-3xl shadow-xl flex flex-col items-center justify-center border border-[#244A4E]"
                            style={{ transform: 'rotateY(180deg)' }}
                        >
                            <span className="text-xs font-bold text-[#D6C2B0] uppercase tracking-widest absolute top-8">Definition</span>
                            <h2 className="text-4xl font-bold text-[#F5F1E8] text-center px-4 break-words leading-relaxed font-serif">
                                {currentWord.translation}
                            </h2>
                        </div>
                    </motion.div>
                </div>

                <div className="flex items-center gap-8 mt-10">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="p-4 rounded-full bg-white text-[#3D312A] border border-[#E0D6C8] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F0EBE0] transition-colors focus:outline-none shadow-sm"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={currentIndex === words.length - 1}
                        className="p-4 rounded-full bg-[#2F5D62] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#244A4E] shadow-lg shadow-[#2F5D62]/30 transition-all focus:outline-none transform active:scale-95"
                    >
                        <ArrowRight className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </LearningLayout>
    );
};

export default MemoryMode;
