import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getWords } from '../api.js';
import MistakeTracker from '../services/MistakeTracker';
import { ArrowLeft, ArrowRight, RotateCw, Eye, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import SoundManager from '../utils/SoundManager';
import LearningLayout from '../components/LearningLayout';
import useExamSettings from '../hooks/useExamSettings';
import StarManager from '../services/StarManager';

const MemoryMode = () => {
    const [searchParams] = useSearchParams();
    const [starFilterActive, setStarFilterActive] = useState(() => {
        const sessionRaw = localStorage.getItem('currentSession');
        if (sessionRaw) {
            try {
                const session = JSON.parse(sessionRaw);
                return !!session.starFilterActive;
            } catch (e) {
                return false;
            }
        }
        return false;
    });
    const [updateTrigger, setUpdateTrigger] = useState(0);

    // Determine source files
    const getTargetFiles = () => {
        const urlParam = searchParams.get('filename');
        if (urlParam) return urlParam;

        const sessionRaw = localStorage.getItem('currentSession');
        if (sessionRaw) {
            try {
                const session = JSON.parse(sessionRaw);
                const targetFiles = session.activeFiles || session.files;
                if (targetFiles && targetFiles.length > 0) {
                    return targetFiles.join(',');
                }
            } catch (e) {
                return null;
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

    // Settings for TTS
    const settings = useExamSettings();
    const { ttsEnabled } = settings;

    // TTS Logic: Speak when English side is shown
    useEffect(() => {
        if (!ttsEnabled || filteredWords.length === 0) return;

        // If not flipped (showing English Front), speak current word
        if (!isFlipped) {
            const word = filteredWords[currentIndex]?.word;
            if (word) {
                // Small delay to allow flip animation or page load to settle
                setTimeout(() => {
                    SoundManager.speak(word);
                }, 300);
            }
        }
    }, [currentIndex, isFlipped, filteredWords, ttsEnabled]);

    useEffect(() => {
        const loadWords = async () => {
            if (!filename) {
                setLoading(false);
                return;
            }
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

    useEffect(() => {
        if (words.length === 0) return;

        let result = [...words];

        // 1. Star Filter
        if (starFilterActive) {
            result = result.filter(w => StarManager.isStarred(w.word));
        }
        // 3. Chemistry Filter
        if (settings.isChemistryMode) {
            result = result.filter(w => w.phonetic && /^[+-]\d+$/.test(w.phonetic.trim()));
        }

        setFilteredWords(result);
        setCurrentIndex(0);
        setIsFlipped(false);
    }, [starFilterActive, settings.isChemistryMode, words]);

    const handleToggleStar = (e, word) => {
        e.stopPropagation();
        StarManager.toggleStar(word);
        setUpdateTrigger(prev => prev + 1);
    };

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
                </div>
            </LearningLayout>
        );
    }

    const currentWord = filteredWords[currentIndex];

    return (
        <LearningLayout settings={settings}>
            <div className="flex flex-col items-center justify-center min-h-full py-8 text-[#3D312A]">
                <div className="w-full max-w-md mb-6 flex flex-wrap justify-between items-center text-[#8C7B70] gap-2">
                    <div className="text-sm font-medium bg-white px-4 py-1 rounded-full border border-[#E0D6C8] shadow-sm">
                        {currentIndex + 1} / {filteredWords.length}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Star Filter Toggle */}
                        <button
                            onClick={() => {
                                const newValue = !starFilterActive;
                                setStarFilterActive(newValue);
                                // Save to session
                                const sessionRaw = localStorage.getItem('currentSession');
                                if (sessionRaw) {
                                    try {
                                        const session = JSON.parse(sessionRaw);
                                        session.starFilterActive = newValue;
                                        localStorage.setItem('currentSession', JSON.stringify(session));
                                    } catch (e) {
                                        console.error("Error saving star filter to session", e);
                                    }
                                }
                            }}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${starFilterActive
                                ? 'bg-[#F2A359] text-white border-[#F2A359]'
                                : 'bg-white text-[#8C7B70] border-[#E0D6C8] hover:bg-[#F0EBE0]'
                                }`}
                        >
                            <Star className={`w-3 h-3 ${starFilterActive ? 'fill-white' : ''}`} />
                            {starFilterActive ? 'Starred Only' : 'All Words'}
                        </button>

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
                            <span className="text-xs font-bold text-[#8C7B70] uppercase tracking-widest absolute top-8">
                                Term
                            </span>

                            {/* Star Toggle Button */}
                            <button
                                onClick={(e) => handleToggleStar(e, currentWord.word)}
                                className="absolute top-6 right-6 p-2 text-[#D6C2B0] hover:text-[#F2A359] transition-colors z-10"
                                title="Toggle Star"
                            >
                                <Star className={`w-6 h-6 ${StarManager.isStarred(currentWord.word) ? 'fill-[#F2A359] text-[#F2A359]' : ''}`} />
                            </button>

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
                            <span className="text-xs font-bold text-[#D6C2B0] uppercase tracking-widest absolute top-8">
                                Definition
                            </span>

                            {/* Star Toggle Button */}
                            <button
                                onClick={(e) => handleToggleStar(e, currentWord.word)}
                                className="absolute top-6 right-6 p-2 text-[#D6C2B0] hover:text-[#F2A359] transition-colors z-10"
                                title="Toggle Star"
                            >
                                <Star className={`w-6 h-6 ${StarManager.isStarred(currentWord.word) ? 'fill-[#F2A359] text-[#F2A359]' : ''}`} />
                            </button>

                            <h2 className="text-4xl font-bold text-[#F5F1E8] text-center px-4 break-words leading-relaxed font-serif">
                                {currentWord.zh || currentWord.translation}
                                {currentWord.phonetic && <sup className="text-[0.85em] ml-0.5 font-black text-[#F2A359] font-sans">{currentWord.phonetic}</sup>}
                            </h2>

                            {currentWord.example && (
                                <p className="mt-8 px-8 text-center text-[#D6C2B0] text-sm md:text-base italic leading-relaxed font-serif max-w-sm">
                                    "{currentWord.example}"
                                </p>
                            )}
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
