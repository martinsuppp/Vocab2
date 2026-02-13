import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFiles } from '../api.js';
import { BookOpen, PenTool, Settings, BarChart } from 'lucide-react';
import SoundManager from '../utils/SoundManager';

const Home = () => {
    const navigate = useNavigate();
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const fileList = await getFiles();
                setFiles(fileList);
                if (fileList.length > 0) {
                    setSelectedFile(fileList[0]);
                }
            } catch (error) {
                console.error("Failed to fetch files:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFiles();
    }, []);

    const [numQuestions, setNumQuestions] = useState(20); // Changed default from 10 to 20
    const [showSettings, setShowSettings] = useState(false);
    const [instantFeedback, setInstantFeedback] = useState(false);
    const [newRatio, setNewRatio] = useState(20); // 20%
    const [mistakeWeight, setMistakeWeight] = useState(5); // 5x

    // Sound State
    const [isMuted, setIsMuted] = useState(SoundManager.muted);

    const toggleSound = () => {
        const muted = SoundManager.toggleMuted();
        setIsMuted(muted);
    };

    const handleStart = (mode) => {
        if (!selectedFile) return;
        let url = `/${mode}?filename=${encodeURIComponent(selectedFile)}`;
        if (mode === 'exam') {
            url += `&numQuestions=${numQuestions}`;
            url += `&instantFeedback=${instantFeedback}`;
            url += `&newRatio=${newRatio}`;
            url += `&mistakeWeight=${mistakeWeight}`;
        }
        navigate(url);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-900 text-slate-100">
            <div className="absolute top-6 right-6">
                <button
                    onClick={() => navigate('/stats')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 text-sm font-medium text-slate-300 hover:text-white"
                >
                    <BarChart className="w-4 h-4 text-purple-400" /> Stats
                </button>
            </div>
            <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-700 relative">

                {/* Sound Toggle */}
                <button
                    onClick={toggleSound}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-700 text-slate-400 transition-colors"
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? "🔇" : "🔊"}
                </button>

                <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Vocab Master
                </h1>

                {/* File Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-400 mb-2">Select Word List</label>
                    {loading ? (
                        <div className="animate-pulse h-10 bg-slate-700 rounded"></div>
                    ) : (
                        <div className="relative">
                            <select
                                value={selectedFile}
                                onChange={(e) => setSelectedFile(e.target.value)}
                                className="w-full bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-700 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="">-- Choose a file --</option>
                                {files.map(file => (
                                    <option key={file} value={file}>{file}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500">
                                ▼
                            </div>
                        </div>
                    )}
                </div>

                {/* Exam Settings */}
                <div className="mb-6 space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-400">Number of Questions</span>
                            <span className="text-blue-400 font-mono">{numQuestions}</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="50"
                            step="5"
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(Number(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                        />
                    </div>

                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                    >
                        {showSettings ? '▼ Hide Advanced Settings' : '▶ Show Advanced Settings'}
                    </button>
                </div>

                {showSettings && (
                    <div className="mb-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                        {/* Quick Presets */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <button
                                onClick={() => { setNewRatio(100); setMistakeWeight(1); }}
                                className="px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-xs text-white border border-slate-600 transition-colors"
                            >
                                ✨ New Only (100%)
                            </button>
                            <button
                                onClick={() => { setNewRatio(0); setMistakeWeight(7.5); }}
                                className="px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-xs text-white border border-slate-600 transition-colors"
                            >
                                📚 Old Only (Mistakes 75%)
                            </button>
                            <button
                                onClick={() => { setNewRatio(0); setMistakeWeight(10); }}
                                className="px-2 py-1.5 rounded bg-red-900/50 hover:bg-red-900/70 text-xs text-red-200 border border-red-800 transition-colors"
                            >
                                🔥 Mistake Drill (100%)
                            </button>
                            <button
                                onClick={() => { setNewRatio(50); setMistakeWeight(5); }}
                                className="px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-xs text-white border border-slate-600 transition-colors"
                            >
                                ⚖️ Mixed (50/50)
                            </button>
                        </div>

                        {/* Instant Feedback Toggle */}
                        <div className="flex items-center justify-between">
                            <label className="text-slate-300 text-sm">Instant Feedback</label>
                            <button
                                onClick={() => setInstantFeedback(!instantFeedback)}
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${instantFeedback ? 'bg-blue-500' : 'bg-slate-600'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${instantFeedback ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* New Word Ratio */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">New Word Ratio</span>
                                <span className="text-blue-400">{newRatio}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={newRatio}
                                onChange={(e) => setNewRatio(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        {/* Mistake Weight */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Mistake Weight</span>
                                <span className="text-red-400">{mistakeWeight}x</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                step="0.5"
                                value={mistakeWeight}
                                onChange={(e) => setMistakeWeight(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                    <button
                        onClick={() => handleStart('memory')}
                        className="group flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all transform hover:-translate-y-1"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <BookOpen className="w-6 h-6 text-blue-200" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-lg">Memory Mode</h3>
                                <p className="text-sm text-blue-200 opacity-80">Flashcards with spaced repetition</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => handleStart('exam')}
                        className="group flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all transform hover:-translate-y-1"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <PenTool className="w-6 h-6 text-purple-200" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-lg">Exam Mode</h3>
                                <p className="text-sm text-purple-200 opacity-80">Quiz with mistake tracking</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <p className="mt-8 text-slate-500 text-sm">
                v1.0 • Built with React & Flask
            </p>
        </div>
    );
};

export default Home;
