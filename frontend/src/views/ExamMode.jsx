import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { generateExam, submitExam } from '../api.js';
import { Check, X, Timer, RotateCcw, Award, LayoutGrid } from 'lucide-react';
import SoundManager from '../utils/SoundManager';
import confetti from 'canvas-confetti';
import LearningLayout from '../components/LearningLayout';
import useExamSettings from '../hooks/useExamSettings';

const ExamMode = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Config Loader
    // [NEW] Read settings from global hook instead of session snapshot
    // This allows "Advanced Settings" in Learning Hub to apply immediately
    const settings = useExamSettings();
    const {
        numQuestions,
        instantFeedback: instantFeedbackEnabled, // Alias for compatibility
        newRatio,
        mistakeWeight,
        timePerQuestion,
        heartbeatEnabled // [NEW]
    } = settings;

    // [DEBUG] Check if setting is received
    useEffect(() => {
        console.log("ExamMode Mounted. Heartbeat Enabled:", heartbeatEnabled);
    }, [heartbeatEnabled]);

    // We still need filename from session
    const getFilename = () => {
        const sessionStr = localStorage.getItem('currentSession');
        if (sessionStr) {
            const session = JSON.parse(sessionStr);
            return session.files ? session.files[0] : null; // Assuming single file for now or first
        }
        return null; // Should handle multi-file
    };

    const filename = getFilename();

    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updatedStats, setUpdatedStats] = useState({}); // New stats from backend

    // Instant Feedback State
    const [feedback, setFeedback] = useState(null); // { isCorrect, correctTranslation, selectedWord }
    const [isPaused, setIsPaused] = useState(false);

    // UX States
    const [isProcessing, setIsProcessing] = useState(false);
    const [canDismiss, setCanDismiss] = useState(false);

    const timerRef = useRef(null);

    useEffect(() => {
        const loadExam = async () => {
            if (!filename) {
                setLoading(false);
                return;
            }
            try {
                const data = await generateExam(filename, { numQuestions, newRatio, mistakeWeight });
                setQuestions(data);
                // Initial Question Timer
                setTimeLeft(timePerQuestion || 5);
            } catch (error) {
                console.error("Failed to generate exam", error);
            } finally {
                setLoading(false);
            }
        };
        SoundManager.playBGM();
        loadExam();

        return () => {
            SoundManager.stopBGM();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [filename, numQuestions, newRatio, mistakeWeight]);

    useEffect(() => {
        if (!loading && questions.length > 0 && !isFinished && !isPaused && !isProcessing) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    // Logic: If total time <= 5s, warn last 2s. Else warnings last 5s.
                    const totalTime = timePerQuestion || 5;
                    const warningThreshold = totalTime <= 5 ? 2 : 5;

                    if (prev <= warningThreshold && prev > 0) {
                        if (heartbeatEnabled) SoundManager.playHeartbeat();
                    }
                    if (prev <= 0) {
                        // Time's up for THIS question
                        handleTimeOut();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [loading, questions, isFinished, isPaused, isProcessing, heartbeatEnabled]);

    const handleTimeOut = () => {
        // Treat as wrong answer
        handleAnswerProcess(null); // passing null implies time out / no selection
    };

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isFinished || loading || isPaused || isProcessing) {
                if (isPaused && (e.key === ' ' || e.key === 'Enter')) {
                    handleManualNext();
                }
                return;
            }

            const currentQ = questions[currentIndex];
            if (!currentQ) return;

            const options = currentQ.options;
            if (['1', '2', '3', '4'].includes(e.key)) {
                const index = parseInt(e.key) - 1;
                if (options[index]) {
                    handleAnswer(options[index]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFinished, loading, currentIndex, questions, isPaused, isProcessing]);

    const handleAnswer = (selectedOption) => {
        handleAnswerProcess(selectedOption);
    };

    const handleAnswerProcess = (selectedOption) => {
        if (isProcessing) return;
        setIsProcessing(true);

        const currentQ = questions[currentIndex];
        const isCorrect = selectedOption && selectedOption.word === currentQ.word;

        if (selectedOption) {
            if (isCorrect) SoundManager.playCorrect();
            else SoundManager.playWrong();
        }

        const newAnswers = {
            ...userAnswers,
            [currentIndex]: {
                question: currentQ,
                selected: selectedOption,
                isCorrect: isCorrect,
                timestamp: Date.now()
            }
        };
        setUserAnswers(newAnswers);

        if (instantFeedbackEnabled) {
            setIsPaused(true);
            setFeedback({
                isCorrect,
                correctTranslation: currentQ.correct_translation,
                selectedWord: selectedOption ? selectedOption.translation : "Time's up!"
            });

            if (isCorrect) {
                // Auto-advance for correct answers
                setTimeout(() => {
                    nextQuestion(newAnswers);
                }, 700); // 0.7s delay for visual feedback
            } else {
                // Require manual dismissal for wrong answers
                setCanDismiss(false);
                setTimeout(() => setCanDismiss(true), 500); // Prevent accidental rapid double-click dismissal
                setIsProcessing(false); // Allow interaction again (to dismiss)
            }
        } else {
            nextQuestion(newAnswers);
        }
    };

    const handleManualNext = () => {
        if (!isPaused || !canDismiss) return;
        // If it was wrong, we need to pass the answers 
        // We can just rely on userAnswers state, but safest to pass the current set if needed
        // but handleAnswerProcess updated state... however state update might be async.
        // Actually, userAnswers is updated via setUserAnswers, but nextQuestion uses current state unless passed.
        // We can just call nextQuestion without args and let it use default if we trust state, 
        // OR better: handleAnswerProcess already updated userAnswers.
        // Wait, nextQuestion takes currentAnswers. If we call it from here, we should pass userAnswers.
        // But userAnswers might be stale in closure? 
        // The most reliable way is: pass nothing, and let nextQuestion use userAnswers (if implemented that way).
        // Let's look at nextQuestion implementation: it takes currentAnswers.
        // If we don't pass it, we might lose the last answer.
        // SOLUTION: Re-construct or just ref the latest. 
        // Actually, we can just rely on the fact that for manual dismissal (wrong answer), 
        // the answer was already set in state long enough ago? 
        // Let's check: handleAnswerProcess sets state. User waits 0.5s. Clicks. State should be updated.
        nextQuestion(userAnswers);
    };

    const nextQuestion = (currentAnswers = userAnswers) => {
        setFeedback(null);
        setIsPaused(false);
        setIsProcessing(false); // Reset processing lock
        setCanDismiss(false);

        // Reset Timer for next question
        setTimeLeft(timePerQuestion || 5);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            finishExam(currentAnswers);
        }
    };

    const finishExam = async (finalAnswers = userAnswers) => {
        setIsFinished(true);
        if (timerRef.current) clearInterval(timerRef.current);
        SoundManager.stopBGM();
        SoundManager.playFinish();

        // Calculate score based on questions length to ensure unanswered questions count as wrong
        let correctCount = 0;
        const results = questions.map((q, idx) => {
            const ans = finalAnswers[idx]; // Lookup by INDEX
            const isCorrect = ans ? ans.isCorrect : false; // Treat missing answers as mistakes
            if (isCorrect) correctCount++;
            return {
                word: q.word,
                is_correct: isCorrect
            };
        });

        // Celebration if perfect score
        if (correctCount === questions.length && questions.length > 0) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
        }

        // Submit results
        try {
            const response = await submitExam(results);
            if (response.updated_stats) {
                setUpdatedStats(response.updated_stats);
            }
        } catch (error) {
            console.error("Failed to submit results", error);
        }
    };

    if (loading) {
        return (
            <LearningLayout>
                <div className="h-full flex items-center justify-center text-[#5C4B41]">
                    Generating Exam...
                </div>
            </LearningLayout>
        );
    }

    if (questions.length === 0) {
        return (
            <LearningLayout>
                <div className="h-full flex items-center justify-center text-[#5C4B41]">
                    No exam generated. Check selection.
                </div>
            </LearningLayout>
        );
    }

    if (isFinished) {
        const correctCount = Object.values(userAnswers).filter(a => a.isCorrect).length;
        const score = Math.round((correctCount / questions.length) * 100);

        return (
            <LearningLayout>
                <div className="min-h-full py-8 flex flex-col items-center">
                    <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm p-8 border border-[#E0D6C8] animate-in fade-in zoom-in duration-300">
                        <div className="text-center mb-8">
                            <Award className="w-16 h-16 mx-auto text-[#D6C2B0] mb-4" />
                            <h2 className="text-4xl font-bold mb-2 text-[#3D312A] font-serif">Exam Complete!</h2>
                            <div className="text-6xl font-bold text-[#2F5D62]">
                                {score}%
                            </div>
                            <p className="text-[#8C7B70] mt-2">
                                {correctCount} / {questions.length} Correct
                            </p>
                        </div>

                        <div className="space-y-8">
                            {/* Summary Table */}
                            <div>
                                <h3 className="text-xl font-bold mb-4 text-[#5C4B41] font-serif">Detailed Word Analysis</h3>
                                <div className="overflow-x-auto rounded-xl border border-[#E0D6C8]">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-[#F5F1E8] text-[#8C7B70] uppercase tracking-wider font-semibold">
                                            <tr>
                                                <th className="p-4">Word</th>
                                                <th className="p-4 text-center">Result</th>
                                                <th className="p-4 text-center">Lifetime Stats</th>
                                                <th className="p-4 text-center">Recent 20 Ratio</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E0D6C8] bg-white">
                                            {questions.map((q, idx) => {
                                                const ans = userAnswers[idx]; // Lookup by INDEX
                                                const isCorrect = ans?.isCorrect;
                                                const stats = updatedStats[q.word] || {};

                                                // Ratio Calculation
                                                // Lifetime
                                                const lTotal = (stats.correct_count || 0) + (stats.mistake_count || 0);
                                                const lRatio = lTotal > 0 ? Math.round((stats.correct_count / lTotal) * 100) : 0;

                                                // Recent is already ratio in backend response? Yes 'recent_ratio'
                                                const rRatio = stats.recent_ratio || 0;

                                                return (
                                                    <tr key={idx} className="hover:bg-[#F9F7F5] transition-colors">
                                                        <td className="p-4 font-medium">
                                                            <div className="text-base text-[#2C241F] font-serif">{q.word}</div>
                                                            <div className="text-xs text-[#8C7B70]">{q.correct_translation}</div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            {isCorrect ? (
                                                                <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">
                                                                    Correct
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">
                                                                    Wrong
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <span className={`text-xs font-mono font-bold ${lRatio >= 80 ? 'text-green-600' : lRatio >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                                    {lRatio}%
                                                                </span>
                                                                <span className="text-[10px] text-[#8C7B70]">
                                                                    {stats.correct_count || 0}W / {stats.mistake_count || 0}L
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <span className={`text-xs font-mono font-bold ${rRatio >= 80 ? 'text-green-600' : rRatio >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                                    {rRatio}%
                                                                </span>
                                                                <span className="text-[10px] text-[#8C7B70]">
                                                                    Recent
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex gap-4 justify-center pt-4">
                                <button
                                    onClick={() => navigate('/list')}
                                    className="flex items-center gap-2 px-6 py-3 bg-[#EBE5D9] hover:bg-[#DED6C5] text-[#5C4B41] rounded-xl font-bold transition-colors shadow-sm"
                                >
                                    <LayoutGrid className="w-5 h-5" /> Back to Hub
                                </button>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="flex items-center gap-2 px-6 py-3 bg-[#2F5D62] hover:bg-[#244A4E] text-white rounded-xl font-bold shadow-lg shadow-[#2F5D62]/20 transition-all hover:scale-105"
                                >
                                    <RotateCcw className="w-5 h-5" /> Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </LearningLayout>
        );
    }

    // ... (rest of wrapper UI for exam taking)
    return (
        <LearningLayout>
            <div className="flex flex-col items-center justify-center min-h-full py-6 relative">

                {/* Instant Feedback Overlay */}
                {feedback && (
                    <div
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={handleManualNext}
                    >
                        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-[#E0D6C8] transform scale-100 animate-in zoom-in-95 duration-200">
                            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${feedback.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {feedback.isCorrect ? <Check className="w-10 h-10" /> : <X className="w-10 h-10" />}
                            </div>

                            <h3 className={`text-2xl font-bold mb-2 ${feedback.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
                            </h3>

                            {!feedback.isCorrect && (
                                <div className="mb-6 space-y-4">
                                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                        <p className="text-[#8C7B70] text-sm uppercase tracking-widest mb-2 font-bold">Question</p>
                                        <p className="text-5xl font-bold text-[#3D312A] font-serif">{questions[currentIndex].word}</p>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                        <p className="text-[#8C7B70] text-sm uppercase tracking-widest mb-2 font-bold">Answer</p>
                                        <p className="text-5xl font-bold text-[#2F5D62] font-serif">{feedback.correctTranslation}</p>
                                    </div>
                                    <p className="text-[#8C7B70] text-xs mt-2">You selected: {feedback.selectedWord}</p>
                                </div>
                            )}

                            <p className="text-[#8C7B70] text-sm animate-pulse">Click anywhere or press Space to continue</p>
                        </div>
                    </div>
                )}

                {/* Header with Timer */}
                <div className="w-full max-w-2xl flex justify-end items-center mb-8 px-4">
                    <div className={`flex items-center gap-2 font-mono text-xl ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-[#2F5D62]'}`}>
                        <Timer className="w-5 h-5" />
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>
                </div>

                {/* Question Card */}
                <div className="w-full max-w-2xl px-4">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E0D6C8]">
                        <div className="p-8 text-center border-b border-[#F0EBE0] bg-[#FAF9F6]">
                            <span className="inline-block px-3 py-1 rounded-full bg-[#EBE5D9] text-[#5C4B41] text-xs font-bold tracking-wider mb-4">
                                QUESTION {currentIndex + 1} / {questions.length}
                            </span>
                            <h2 className="text-4xl font-bold text-[#3D312A] mb-2 font-serif">{questions[currentIndex]?.word}</h2>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
                            {questions[currentIndex]?.options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => !isProcessing && !isPaused && handleAnswer(opt)}
                                    disabled={isProcessing || isPaused}
                                    className={`group relative p-6 text-left rounded-xl border transition-all duration-200 
                                        ${isProcessing || isPaused
                                            ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-70'
                                            : 'bg-[#F9F7F5] hover:bg-[#2F5D62] border-[#E0D6C8] hover:border-[#2F5D62] hover:shadow-lg active:scale-[0.98]'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-[#EBE5D9] group-hover:bg-white/20 text-[#5C4B41] group-hover:text-white font-bold transition-colors">
                                            {idx + 1}
                                        </span>
                                        <span className="text-lg text-[#3D312A] group-hover:text-white font-medium">
                                            {opt.translation}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </LearningLayout>
    );
};

export default ExamMode;
