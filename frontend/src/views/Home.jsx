import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataLoader from '../services/DataLoader.js';
import { ArrowRight, BookOpen, PenTool, BarChart, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import SoundManager from '../utils/SoundManager';

const Home = () => {
    const navigate = useNavigate();

    // GAS Data Loading State
    const [gasUrl, setGasUrl] = useState(DataLoader.getGasUrl());
    const [dataLoaded, setDataLoaded] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [loadError, setLoadError] = useState(null);

    const [files, setFiles] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState(() => {
        const saved = localStorage.getItem('selectedFiles');
        return saved ? JSON.parse(saved) : [];
    });

    // Initial Load Check
    useEffect(() => {
        const initData = async () => {
            if (DataLoader.isDataLoaded()) {
                setFiles(await DataLoader.listFiles());
                setDataLoaded(true);
            } else if (gasUrl) {
                // Only auto-load if we don't have data in memory but have a URL
                handleLoadData(false);
            }
        };
        initData();
    }, []);

    const handleLoadData = async (manualClick = true) => {
        if (!gasUrl) {
            if (manualClick) alert("Please enter a URL first.");
            return;
        }

        setLoadingData(true);
        setLoadError(null);

        try {
            // Save URL
            DataLoader.setGasUrl(gasUrl);

            // Fetch Files
            const fileList = await DataLoader.listFiles();
            setFiles(fileList);
            setDataLoaded(true);

            // Auto-select logic
            if (fileList.length > 0 && selectedFiles.length === 0) {
                const saved = localStorage.getItem('selectedFiles');
                if (!saved) {
                    setSelectedFiles([fileList[0]]);
                }
            } else if (fileList.length > 0) {
                // Filter out selected files that no longer exist
                const validSelected = selectedFiles.filter(f => fileList.includes(f));
                if (validSelected.length !== selectedFiles.length) {
                    setSelectedFiles(validSelected);
                }
            }

        } catch (error) {
            console.error("Failed to fetch data:", error);
            setLoadError(error.message || "Failed to load data.");
            setDataLoaded(false);
        } finally {
            setLoadingData(false);
        }
    };

    // Persist selected files
    useEffect(() => {
        localStorage.setItem('selectedFiles', JSON.stringify(selectedFiles));
    }, [selectedFiles]);

    // Exam Settings
    const [numQuestions, setNumQuestions] = useState(() => {
        const saved = localStorage.getItem('numQuestions');
        return saved ? Number(saved) : 20;
    });
    const [showSettings, setShowSettings] = useState(false);
    const [instantFeedback, setInstantFeedback] = useState(() => {
        const saved = localStorage.getItem('instantFeedback');
        return saved !== null ? saved === 'true' : true;
    });
    const [newRatio, setNewRatio] = useState(() => {
        const saved = localStorage.getItem('newRatio');
        return saved ? Number(saved) : 20;
    });
    const [mistakeWeight, setMistakeWeight] = useState(() => {
        const saved = localStorage.getItem('mistakeWeight');
        return saved ? Number(saved) : 5;
    });

    // Persist settings
    useEffect(() => {
        localStorage.setItem('numQuestions', numQuestions);
        localStorage.setItem('instantFeedback', instantFeedback);
        localStorage.setItem('newRatio', newRatio);
        localStorage.setItem('mistakeWeight', mistakeWeight);
    }, [numQuestions, instantFeedback, newRatio, mistakeWeight]);

    // Sound State
    const [isMuted, setIsMuted] = useState(SoundManager.muted);

    const toggleSound = () => {
        const muted = SoundManager.toggleMuted();
        setIsMuted(muted);
    };

    const handleStart = () => {
        if (selectedFiles.length === 0) {
            alert("Please select at least one file!");
            return;
        }

        // Save current session configuration
        const sessionConfig = {
            files: selectedFiles,
            settings: {
                numQuestions,
                instantFeedback,
                newRatio,
                mistakeWeight
            }
        };
        localStorage.setItem('currentSession', JSON.stringify(sessionConfig));

        // Navigate to List view (default entry point)
        navigate('/list');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#F5F1E8] text-[#3D312A] font-serif">
            <div className="absolute top-6 right-6 flex gap-4">
                <button
                    onClick={() => navigate('/stats')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-[#EBE5D9] transition-colors border border-[#D6C2B0] text-sm font-medium text-[#5C4B41] shadow-sm"
                >
                    <BarChart className="w-4 h-4 text-[#2F5D62]" /> Stats
                </button>
                <button
                    onClick={toggleSound}
                    className="p-2 rounded-full bg-white hover:bg-[#EBE5D9] text-[#5C4B41] border border-[#D6C2B0] shadow-sm transition-colors"
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? "🔇" : "🔊"}
                </button>
            </div>

            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-[#E0D6C8] relative">

                <h1 className="text-4xl font-bold text-center mb-8 text-[#2F5D62] tracking-tight">
                    Vocab Master
                </h1>

                {/* [NEW] Data Source Configuration */}
                <div className="mb-8 p-4 bg-[#F9F7F5] rounded-xl border border-[#E0D6C8]">
                    <label className="block text-xs font-semibold text-[#8C7B70] uppercase tracking-wider mb-2">
                        Data Source (Google Apps Script)
                    </label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={gasUrl}
                            onChange={(e) => setGasUrl(e.target.value)}
                            placeholder="https://script.google.com/..."
                            className="flex-1 bg-white border border-[#D6C2B0] rounded px-3 py-2 text-sm text-[#3D312A] focus:outline-none focus:border-[#2F5D62] shadow-sm placeholder-[#B0A499]"
                        />
                        <button
                            onClick={() => handleLoadData(true)}
                            disabled={loadingData}
                            className="bg-[#2F5D62] hover:bg-[#244A4E] disabled:bg-[#8C7B70] text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                        >
                            {loadingData ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Load"}
                        </button>
                    </div>

                    {/* Status Messages */}
                    {loadingData && <p className="text-xs text-[#2F5D62] flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Loading data...</p>}

                    {!loadingData && dataLoaded && (
                        <p className="text-xs text-green-700 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Data loaded successfully!
                        </p>
                    )}

                    {!loadingData && loadError && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{loadError}</span>
                        </div>
                    )}
                </div>

                {/* File Selection - Only show if data is loaded */}
                {dataLoaded && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-[#5C4B41] mb-2 font-serif">Select Word Lists</label>

                            <div className="bg-[#F9F7F5] rounded-xl border border-[#E0D6C8] p-3 max-h-40 overflow-y-auto shadow-inner">
                                {files.length === 0 && <p className="text-[#8C7B70] text-sm">No valid sheets found.</p>}
                                {files.map(file => (
                                    <label key={file} className="flex items-center gap-3 p-2 hover:bg-[#EBE5D9] rounded cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            value={file}
                                            checked={selectedFiles.includes(file)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedFiles([...selectedFiles, file]);
                                                } else {
                                                    setSelectedFiles(selectedFiles.filter(f => f !== file));
                                                }
                                            }}
                                            className="w-4 h-4 rounded border-[#8C7B70] text-[#2F5D62] focus:ring-[#2F5D62] focus:ring-offset-[#F9F7F5]"
                                        />
                                        <span className="text-[#3D312A] text-sm font-medium">{file}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="mt-2 text-xs text-[#8C7B70] text-right font-medium">
                                {selectedFiles.length} list{selectedFiles.length !== 1 ? 's' : ''} selected
                            </div>
                        </div>

                        {/* Exam Settings */}
                        <div className="mb-6 space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-[#5C4B41] font-medium">Number of Questions</span>
                                    <span className="text-[#2F5D62] font-bold font-mono">{numQuestions}</span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="50"
                                    step="5"
                                    value={numQuestions}
                                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                                    className="w-full h-2 bg-[#D6C2B0] rounded-lg appearance-none cursor-pointer accent-[#2F5D62]"
                                />
                            </div>

                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="text-xs text-[#8C7B70] hover:text-[#5C4B41] flex items-center gap-1 transition-colors font-medium"
                            >
                                {showSettings ? '▼ Hide Advanced Settings' : '▶ Show Advanced Settings'}
                            </button>
                        </div>

                        {showSettings && (
                            <div className="mb-6 p-4 bg-[#F9F7F5] rounded-xl border border-[#E0D6C8] space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                                {/* Quick Presets */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <button
                                        onClick={() => { setNewRatio(100); setMistakeWeight(1); }}
                                        className="px-2 py-1.5 rounded bg-white hover:bg-[#EBE5D9] text-xs text-[#5C4B41] border border-[#D6C2B0] transition-colors shadow-sm"
                                    >
                                        ✨ New Only (100%)
                                    </button>
                                    <button
                                        onClick={() => { setNewRatio(0); setMistakeWeight(7.5); }}
                                        className="px-2 py-1.5 rounded bg-white hover:bg-[#EBE5D9] text-xs text-[#5C4B41] border border-[#D6C2B0] transition-colors shadow-sm"
                                    >
                                        📚 Old Only (Mistakes 75%)
                                    </button>
                                    <button
                                        onClick={() => { setNewRatio(0); setMistakeWeight(10); }}
                                        className="px-2 py-1.5 rounded bg-red-50 hover:bg-red-100 text-xs text-red-700 border border-red-200 transition-colors shadow-sm"
                                    >
                                        🔥 Mistake Drill (100%)
                                    </button>
                                    <button
                                        onClick={() => { setNewRatio(50); setMistakeWeight(5); }}
                                        className="px-2 py-1.5 rounded bg-white hover:bg-[#EBE5D9] text-xs text-[#5C4B41] border border-[#D6C2B0] transition-colors shadow-sm"
                                    >
                                        ⚖️ Mixed (50/50)
                                    </button>
                                </div>

                                {/* Instant Feedback Toggle */}
                                <div className="flex items-center justify-between">
                                    <label className="text-[#3D312A] text-sm font-medium">Instant Feedback</label>
                                    <button
                                        onClick={() => setInstantFeedback(!instantFeedback)}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${instantFeedback ? 'bg-[#2F5D62]' : 'bg-[#D6C2B0]'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${instantFeedback ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {/* New Word Ratio */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-[#5C4B41]">New Word Ratio</span>
                                        <span className="text-[#2F5D62] font-semibold">{newRatio}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={newRatio}
                                        onChange={(e) => setNewRatio(Number(e.target.value))}
                                        className="w-full h-1.5 bg-[#D6C2B0] rounded-lg appearance-none cursor-pointer accent-[#2F5D62]"
                                    />
                                </div>

                                {/* Mistake Weight */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-[#5C4B41]">Mistake Weight</span>
                                        <span className="text-red-500 font-semibold">{mistakeWeight}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        step="0.5"
                                        value={mistakeWeight}
                                        onChange={(e) => setMistakeWeight(Number(e.target.value))}
                                        className="w-full h-1.5 bg-[#D6C2B0] rounded-lg appearance-none cursor-pointer accent-red-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Start Button */}
                        <div className="mt-8">
                            <button
                                onClick={handleStart}
                                className="w-full group flex items-center justify-between p-4 bg-[#2F5D62] hover:bg-[#244A4E] text-white rounded-xl shadow-lg shadow-[#2F5D62]/20 transition-all transform hover:-translate-y-1"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <BookOpen className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-lg font-serif">Start Learning</h3>
                                        <p className="text-sm text-white/80">Enter Learning Hub</p>
                                    </div>
                                </div>
                                <div className="bg-white/10 p-2 rounded-full">
                                    <ArrowRight className="w-5 h-5 text-white" />
                                </div>
                            </button>
                            <p className="text-center text-xs text-[#8C7B70] mt-3">
                                Configures List, Flashcards, and Exam modes based on selection.
                            </p>
                        </div>
                    </div>
                )}

                <p className="mt-8 text-[#D6C2B0] text-sm text-center font-serif italic">
                    v1.1 • Google Apps Script Integrated
                </p>
            </div>
        </div>
    );
};

export default Home;
