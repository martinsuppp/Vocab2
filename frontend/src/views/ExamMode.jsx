import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { generateExam, submitResults } from '../api';
import { Timer, CheckCircle, XCircle, Home as HomeIcon, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const ExamMode = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const filename = searchParams.get('filename');
    const numQuestions = parseInt(searchParams.get('numQuestions')) || 10;

    const [questions, setQuestions] = useState([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]); // [{word, is_correct, selected}]
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
    }, [filename]);

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
        const isCorrect = selectedOption && selectedOption.word === currentQ.word; // Option should match target word? Wait, target is word, option is translation usually? 
        // Backend: 'options': [{'word': ..., 'translation': ...}]
        // Question: 'word': target['word']
        // The user sees English word, chooses Chinese translation.
        // So we compare `selectedOption.word` (from option object) with `currentQ.word`.

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
            }, 500); // Slight delay for visual feedback? Or instant? 
            // Better instant for immediate flow, or delay to show correct/wrong color.
            // Let's do instant transition for now, or add a 'feedback' state.
        } else {
            finishExam(newAnswers);
        }
    };

    const finishExam = async (finalAnswers) => {
        setExamFinished(true);
        // Calculate score
        const correctCount = finalAnswers.filter(a => a.is_correct).length;
        setScore(Math.round((correctCount / finalAnswers.length) * 100));

        // Submit to backend
        try {
            await submitResults(finalAnswers.map(a => ({
                word: a.word,
                is_correct: a.is_correct
            })));
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
                <div className="w-full max-w-2xl bg-slate-800 rounded-2xl p-8 shadow-2xl mt-10">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">Exam Results</h2>
                        <div className={`text-6xl font-bold ${score >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                            {score}%
                        </div>
                        <p className="text-slate-400 mt-2">
                            You got {userAnswers.filter(a => a.is_correct).length} out of {userAnswers.length} correct.
                        </p>
                    </div>

                    <div className="space-y-4 mb-8">
                        {userAnswers.map((ans, idx) => (
                            <div key={idx} className={`flex items-center justify-between p-4 rounded-lg bg-slate-700/50 border ${ans.is_correct ? 'border-green-500/30' : 'border-red-500/30'}`}>
                                <div>
                                    <div className="font-bold text-white text-lg">{ans.word}</div>
                                    {!ans.is_correct && (
                                        <div className="text-sm text-green-400">Correct: {ans.correct_translation}</div>
                                    )}
                                </div>
                                {ans.is_correct ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
                            </div>
                        ))}
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
                        className="p-6 rounded-xl bg-slate-800 border-2 border-slate-700 hover:border-blue-500 hover:bg-slate-750 transition-all text-left group active:scale-95"
                    >
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
