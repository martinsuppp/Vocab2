import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { generateExam, submitResults } from '../api';
import { Timer, CheckCircle, XCircle, Home as HomeIcon, RefreshCw } from 'lucide-react';

const ExamMode = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const filename = searchParams.get('filename');
    const numQuestions = parseInt(searchParams.get('numQuestions')) || 10;

    const [questions, setQuestions] = useState([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]); // [{word, is_correct, selected}]
    const [updatedStats, setUpdatedStats] = useState({}); // { word: { correct_count, mistake_count } }
    const [timeLeft, setTimeLeft] = useState(15);
    const [loading, setLoading] = useState(true);
    const [examFinished, setExamFinished] = useState(false);
    const [score, setScore] = useState(0);

    // Initial Load
    useEffect(() => {
        const fetchExam = async () => {
            if (!filename) return;
            try {
                const data = await generateExam(filename, numQuestions);
                setQuestions(data);
            } catch (error) {
                console.error("Failed to generate exam", error);
            } finally {
                setLoading(false);
            }
        };
        fetchExam();
    }, [filename, numQuestions]);

    // Timer
    useEffect(() => {
        if (loading || examFinished || questions.length === 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentQIndex, loading, examFinished, questions]);

    const handleTimeout = () => {
        handleAnswer(null); // Null means timeout/no answer
    };

    const handleAnswer = (selectedOption) => {
        const currentQ = questions[currentQIndex];
        // If timed out (null), it's incorrect.
        // If selectedOption exists, check if word matches.
        const isCorrect = selectedOption && selectedOption.word === currentQ.word;

        const answerRecord = {
            word: currentQ.word,
            is_correct: isCorrect,
            selected: selectedOption,
            correct_translation: currentQ.correct_translation
        };

        const newAnswers = [...userAnswers, answerRecord];
        setUserAnswers(newAnswers);

        if (currentQIndex < questions.length - 1) {
            setTimeout(() => {
                setCurrentQIndex(prev => prev + 1);
                setTimeLeft(15); // Reset timer
            }, 200);
        } else {
            finishExam(newAnswers);
        }
    };

    // Keyboard controls
    useEffect(() => {
        if (loading || examFinished || questions.length === 0) return;

        const handleKeyDown = (e) => {
            const currentQ = questions[currentQIndex];
            if (!currentQ) return;

            // Number keys 1-4
            if (['1', '2', '3', '4'].includes(e.key)) {
                const index = parseInt(e.key) - 1;
                if (index < currentQ.options.length) {
                    handleAnswer(currentQ.options[index]);
                }
            }
            // Right Arrow - Skip / Next (Treat as timeout/no answer)
            else if (e.key === 'ArrowRight') {
                handleAnswer(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentQIndex, loading, examFinished, questions]);

    const finishExam = async (finalAnswers) => {
        setExamFinished(true);
        // Calculate score
        const correctCount = finalAnswers.filter(a => a.is_correct).length;
        setScore(Math.round((correctCount / finalAnswers.length) * 100));

        // Submit to backend
        try {
            const response = await submitResults(finalAnswers.map(a => ({
                word: a.word,
                is_correct: a.is_correct
            })));
            if (response.updated_stats) {
                setUpdatedStats(response.updated_stats);
            }
        } catch (error) {
            console.error("Failed to submit results", error);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-white">Generating Exam...</div>;
    if (questions.length === 0) return <div className="flex h-screen items-center justify-center text-white">No questions available.</div>;

    // Review Screen
    if (examFinished) {
        return (
            <div className="flex flex-col items-center min-h-screen p-4 bg-slate-900">
                <div className="w-full max-w-4xl bg-slate-800 rounded-2xl p-8 shadow-2xl mt-10">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white">Exam Completed</h2>
                        <p className="text-slate-400 mt-2">Here is your summary</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full">
                        {/* Session Summary Table */}
                        <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-700">
                            <h3 className="text-xl font-bold text-white mb-4 border-b border-slate-600 pb-2">Session Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Total Questions</span>
                                    <span className="font-mono text-white text-lg">{userAnswers.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-green-400">Correct</span>
                                    <span className="font-mono text-green-300 text-lg">{userAnswers.filter(a => a.is_correct).length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-red-400">Mistakes</span>
                                    <span className="font-mono text-red-300 text-lg">{userAnswers.filter(a => !a.is_correct).length}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-600">
                                    <span className="text-blue-400 font-bold">Accuracy</span>
                                    <span className="font-mono text-blue-300 text-xl font-bold">{score}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Performance Card */}
                        <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-700 flex flex-col justify-center items-center text-center">
                            <h3 className="text-xl font-bold text-white mb-2">Performance</h3>
                            <div className={`text-5xl font-bold mb-2 ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {score >= 80 ? 'Excellent!' : score >= 60 ? 'Good Job' : 'Keep Trying'}
                            </div>
                            <p className="text-slate-400 text-sm">
                                {score >= 80 ? "You're mastering this list!" : "Review the mistakes below to improve."}
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-700/30 rounded-xl border border-slate-700 overflow-hidden mb-8">
                        <div className="p-4 bg-slate-700/50 border-b border-slate-700">
                            <h3 className="text-lg font-bold text-white">Detailed Word Analysis</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-750 text-slate-400 text-sm uppercase tracking-wider">
                                        <th className="p-4 font-semibold">Word</th>
                                        <th className="p-4 font-semibold">This Exam</th>
                                        <th className="p-4 font-semibold">Lifetime Correct</th>
                                        <th className="p-4 font-semibold">Lifetime Wrong</th>
                                        <th className="p-4 font-semibold">Lifetime Ratio</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        // Aggregate session stats
                                        const sessionStats = {};
                                        userAnswers.forEach(ans => {
                                            if (!sessionStats[ans.word]) {
                                                sessionStats[ans.word] = { correct: 0, wrong: 0, translation: ans.correct_translation };
                                            }
                                            if (ans.is_correct) sessionStats[ans.word].correct++;
                                            else sessionStats[ans.word].wrong++;
                                        });

                                        return Object.keys(sessionStats).map((word, idx) => {
                                            const sParams = sessionStats[word];
                                            const sTotal = sParams.correct + sParams.wrong;
                                            const sRatio = sTotal > 0 ? Math.round((sParams.correct / sTotal) * 100) : 0;

                                            // Match with updated stats if available
                                            const stats = updatedStats[word] || { mistake_count: 0, correct_count: 0 };
                                            const total = stats.correct_count + stats.mistake_count;
                                            const ratio = total > 0 ? Math.round((stats.correct_count / total) * 100) : 0;

                                            return (
                                                <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                                                    <td className="p-4 font-medium text-white">
                                                        {word}
                                                        <div className="text-xs text-slate-500">{sParams.translation}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-1 text-sm">
                                                            <span className="text-green-400">Correct: {sParams.correct}</span>
                                                            <span className="text-red-400">Wrong: {sParams.wrong}</span>
                                                            <span className="text-blue-400 font-bold">{sRatio}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-green-300 font-mono">{stats.correct_count}</td>
                                                    <td className="p-4 text-red-300 font-mono">{stats.mistake_count}</td>
                                                    <td className="p-4 text-yellow-300 font-mono">
                                                        {ratio}%
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <button onClick={() => navigate('/')} className="px-6 py-3 rounded-lg bg-slate-700 text-white hover:bg-slate-600 font-bold flex items-center gap-2">
                            <HomeIcon className="w-5 h-5" /> Home
                        </button>
                        <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-500 font-bold flex items-center gap-2">
                            <RefreshCw className="w-5 h-5" /> Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentQIndex];

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-900">
            {/* Header */}
            <div className="w-full max-w-2xl mb-8 flex justify-between items-center text-slate-400">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xl">Q{currentQIndex + 1}</span>
                    <span className="text-sm">/ {questions.length}</span>
                </div>
                <div className={`flex items-center gap-2 font-mono font-bold text-xl ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
                    <Timer className="w-5 h-5" />
                    {timeLeft}s
                </div>
            </div>

            {/* Question Card */}
            <div className="w-full max-w-2xl mb-8">
                <div className="bg-slate-800 rounded-2xl p-10 shadow-2xl border border-slate-700 text-center">
                    <h2 className="text-4xl font-bold text-white mb-2">{currentQ.word}</h2>
                    <p className="text-slate-500 text-sm">Select the correct translation</p>
                </div>
            </div>

            {/* Options */}
            <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQ.options.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleAnswer(opt)}
                        className="relative p-6 rounded-xl bg-slate-800 border-2 border-slate-700 hover:border-blue-500 hover:bg-slate-750 transition-all text-left group active:scale-95"
                    >
                        <div className="absolute top-2 right-2 text-xs font-mono text-slate-500 border border-slate-600 px-1.5 rounded bg-slate-900 group-hover:text-blue-400 group-hover:border-blue-500/50">
                            {idx + 1}
                        </div>
                        <span className="text-xl font-medium text-slate-200 group-hover:text-white transition-colors">
                            {opt.translation}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ExamMode;
