import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { generateExam, submitExam } from '../api.js';
import { Check, X, Timer, RotateCcw, Home as HomeIcon, Award } from 'lucide-react';
import SoundManager from '../utils/SoundManager';
import confetti from 'canvas-confetti';

const ExamMode = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const filename = searchParams.get('filename');

    // Settings from URL
    const numQuestions = parseInt(searchParams.get('numQuestions')) || 20;
    const instantFeedbackEnabled = searchParams.get('instantFeedback') === 'true';
    const newRatio = parseInt(searchParams.get('newRatio')) || 20;
    const mistakeWeight = parseInt(searchParams.get('mistakeWeight')) || 5;

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

    const timerRef = useRef(null);
    const startTimeRef = useRef(Date.now());

    useEffect(() => {
        const loadExam = async () => {
            if (!filename) return;
            try {
                const data = await generateExam(filename, { numQuestions, newRatio, mistakeWeight });
                setQuestions(data);
                // 10 seconds per question
                setTimeLeft(data.length * 10);
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
        if (!loading && questions.length > 0 && !isFinished && !isPaused) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 6 && prev > 1) {
                        SoundManager.playTick();
                    }
                    if (prev <= 1) {
                        finishExam();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [loading, questions, isFinished, isPaused]);

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isFinished || loading || isPaused) {
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
    }, [isFinished, loading, currentIndex, questions, isPaused]);

    const handleAnswer = (selectedOption) => {
        // ... (existing logic)
        handleAnswerProcess(selectedOption);
    };

    const handleAnswerProcess = (selectedOption) => {
        const currentQ = questions[currentIndex];
        const isCorrect = selectedOption && selectedOption.word === currentQ.word;

        if (selectedOption) {
            if (isCorrect) SoundManager.playCorrect();
            else SoundManager.playWrong();
        }

        const newAnswers = {
            ...userAnswers,
            [currentQ.word]: {
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
        } else {
            nextQuestion(newAnswers);
        }
    };

    const handleManualNext = () => {
        if (!isPaused) return;
        nextQuestion(userAnswers);
    };

    const nextQuestion = (currentAnswers) => {
        setFeedback(null);
        setIsPaused(false);

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

        // Calculate score
        let correctCount = 0;
        const results = Object.values(finalAnswers).map(ans => {
            if (ans.isCorrect) correctCount++;
            return {
                word: ans.question.word,
                is_correct: ans.isCorrect
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

    if (loading) return <div className="flex h-screen items-center justify-center text-white">Generating Exam...</div>;

    if (isFinished) {
        const correctCount = Object.values(userAnswers).filter(a => a.isCorrect).length;
        const score = Math.round((correctCount / questions.length) * 100);

        return (
            <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center">
                <div className="w-full max-w-4xl bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700 animate-in fade-in zoom-in duration-300">
                    <div className="text-center mb-8">
                        <Award className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
                        <h2 className="text-4xl font-bold mb-2">Exam Complete!</h2>
                        <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
                            {score}%
                        </div>
                        <p className="text-slate-400 mt-2">
                            {correctCount} / {questions.length} Correct
                        </p>
                    </div>

                    <div className="space-y-8">
                        {/* Summary Table */}
                        <div>
                            <h3 className="text-xl font-bold mb-4 text-slate-300">Detailed Word Analysis</h3>
                            <div className="overflow-x-auto rounded-xl border border-slate-700">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold">
                                        <tr>
                                            <th className="p-4">Word</th>
                                            <th className="p-4 text-center">Result</th>
                                            <th className="p-4 text-center">Lifetime Stats</th>
                                            <th className="p-4 text-center">Recent 20 Ratio</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700 bg-slate-800/50">
                                        {questions.map((q, idx) => {
                                            const ans = userAnswers[q.word];
                                            const isCorrect = ans?.isCorrect;
                                            const stats = updatedStats[q.word] || {};

                                            // Ratio Calculation
                                            // Lifetime
                                            const lTotal = (stats.correct_count || 0) + (stats.mistake_count || 0);
                                            const lRatio = lTotal > 0 ? Math.round((stats.correct_count / lTotal) * 100) : 0;

                                            // Recent is already ratio in backend response? Yes 'recent_ratio'
                                            const rRatio = stats.recent_ratio || 0;

                                            return (
                                                <tr key={idx} className="hover:bg-slate-700/50 transition-colors">
                                                    <td className="p-4 font-medium">
                                                        <div className="text-base text-white">{q.word}</div>
                                                        <div className="text-xs text-slate-500">{q.correct_translation}</div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {isCorrect ? (
                                                            <span className="inline-flex items-center px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-bold">
                                                                Correct
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-bold">
                                                                Wrong
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className={`text-xs font-mono font-bold ${lRatio >= 80 ? 'text-green-400' : lRatio >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                                {lRatio}%
                                                            </span>
                                                            <span className="text-[10px] text-slate-500">
                                                                {stats.correct_count || 0}W / {stats.mistake_count || 0}L
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className={`text-xs font-mono font-bold ${rRatio >= 80 ? 'text-green-400' : rRatio >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                                {rRatio}%
                                                            </span>
                                                            <span className="text-[10px] text-slate-500">
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
                                onClick={() => navigate('/')}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-colors"
                            >
                                <HomeIcon className="w-5 h-5" /> Home
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
                            >
                                <RotateCcw className="w-5 h-5" /> Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ... (rest of wrapper UI for exam taking)
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-900 relative">

            {/* Instant Feedback Overlay */}
            {feedback && (
                <div
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={handleManualNext}
                >
                    <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-slate-700 transform scale-100 animate-in zoom-in-95 duration-200">
                        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${feedback.isCorrect ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                            {feedback.isCorrect ? <Check className="w-10 h-10" /> : <X className="w-10 h-10" />}
                        </div>

                        <h3 className={`text-2xl font-bold mb-2 ${feedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
                        </h3>

                        {!feedback.isCorrect && (
                            <div className="mb-6">
                                <p className="text-slate-400 text-sm mb-1">Correct Answer:</p>
                                <p className="text-xl text-white font-bold">{feedback.correctTranslation}</p>
                                <p className="text-slate-500 text-xs mt-2">You selected: {feedback.selectedWord}</p>
                            </div>
                        )}

                        <p className="text-slate-500 text-sm animate-pulse">Click anywhere or press Space to continue</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="w-full max-w-2xl flex justify-between items-center mb-8 text-slate-400">
                <button onClick={() => navigate('/')} className="hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
                <div className={`flex items-center gap-2 font-mono text-xl ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
                    <Timer className="w-5 h-5" />
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
            </div>

            {/* Question Card */}
            <div className="w-full max-w-2xl">
                <div className="bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
                    <div className="p-8 text-center border-b border-slate-700 bg-slate-800/50">
                        <span className="inline-block px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-xs font-bold tracking-wider mb-4">
                            QUESTION {currentIndex + 1} / {questions.length}
                        </span>
                        <h2 className="text-4xl font-bold text-white mb-2">{questions[currentIndex]?.word}</h2>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/50">
                        {questions[currentIndex]?.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(opt)}
                                className="group relative p-6 text-left rounded-xl bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700 group-hover:bg-blue-500/50 text-slate-400 group-hover:text-white font-bold transition-colors">
                                        {idx + 1}
                                    </span>
                                    <span className="text-lg text-slate-200 group-hover:text-white font-medium">
                                        {opt.translation}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamMode;
