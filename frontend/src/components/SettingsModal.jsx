import React from 'react';
import { Settings } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, settings }) => {
    if (!isOpen) return null;

    const {
        numQuestions, setNumQuestions,
        timePerQuestion, setTimePerQuestion,
        instantFeedback, setInstantFeedback,
        newRatio, setNewRatio,
        mistakeWeight, setMistakeWeight
    } = settings;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#E0D6C8] animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-4 border-b border-[#F0EBE0] bg-[#FAF9F6] flex justify-between items-center">
                    <h3 className="text-lg font-bold text-[#3D312A] font-serif flex items-center gap-2">
                        <Settings className="w-5 h-5 text-[#2F5D62]" /> Advanced Settings
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-[#EBE5D9] rounded-full transition-colors text-[#8C7B70]"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Quick Presets */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#8C7B70] uppercase tracking-wider">Quick Presets</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => { setNewRatio(100); setMistakeWeight(1); }}
                                className="px-2 py-2 rounded-lg bg-white hover:bg-[#EBE5D9] text-xs text-[#5C4B41] border border-[#D6C2B0] transition-colors shadow-sm text-center"
                            >
                                ✨ New Only (100%)
                            </button>
                            <button
                                onClick={() => { setNewRatio(0); setMistakeWeight(7.5); }}
                                className="px-2 py-2 rounded-lg bg-white hover:bg-[#EBE5D9] text-xs text-[#5C4B41] border border-[#D6C2B0] transition-colors shadow-sm text-center"
                            >
                                📚 Old Only (Mistakes 75%)
                            </button>
                            <button
                                onClick={() => { setNewRatio(0); setMistakeWeight(10); }}
                                className="px-2 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-xs text-red-700 border border-red-200 transition-colors shadow-sm text-center"
                            >
                                🔥 Mistake Drill (100%)
                            </button>
                            <button
                                onClick={() => { setNewRatio(50); setMistakeWeight(5); }}
                                className="px-2 py-2 rounded-lg bg-white hover:bg-[#EBE5D9] text-xs text-[#5C4B41] border border-[#D6C2B0] transition-colors shadow-sm text-center"
                            >
                                ⚖️ Mixed (50/50)
                            </button>
                        </div>
                    </div>

                    {/* Instant Feedback Toggle */}
                    <div className="flex items-center justify-between p-3 bg-[#F9F7F5] rounded-xl border border-[#E0D6C8]">
                        <label className="text-[#3D312A] text-sm font-medium">Instant Feedback</label>
                        <button
                            onClick={() => setInstantFeedback(!instantFeedback)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${instantFeedback ? 'bg-[#2F5D62]' : 'bg-[#D6C2B0]'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${instantFeedback ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {/* Settings Sliders */}
                    <div className="space-y-4">
                        {/* Number of Questions */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-[#5C4B41] font-medium">Number of Questions</span>
                                <span className="text-[#2F5D62] font-semibold">{numQuestions}</span>
                            </div>
                            <input
                                type="range"
                                min="5"
                                max="50"
                                step="5"
                                value={numQuestions}
                                onChange={(e) => setNumQuestions(Number(e.target.value))}
                                className="w-full h-1.5 bg-[#D6C2B0] rounded-lg appearance-none cursor-pointer accent-[#2F5D62]"
                            />
                        </div>

                        {/* Time Per Question */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-[#5C4B41] font-medium">Time Per Question</span>
                                <span className="text-[#2F5D62] font-semibold">{timePerQuestion}s</span>
                            </div>
                            <input
                                type="range"
                                min="3"
                                max="30"
                                step="1"
                                value={timePerQuestion}
                                onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                                className="w-full h-1.5 bg-[#D6C2B0] rounded-lg appearance-none cursor-pointer accent-[#2F5D62]"
                            />
                        </div>

                        {/* New Word Ratio */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-[#5C4B41] font-medium">New Word Ratio</span>
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
                                <span className="text-[#5C4B41] font-medium">Mistake Weight</span>
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
                </div>

                <div className="p-4 border-t border-[#F0EBE0] bg-[#FAF9F6]">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-[#2F5D62] hover:bg-[#244A4E] text-white rounded-xl font-bold shadow-md transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
