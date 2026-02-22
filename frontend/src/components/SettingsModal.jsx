import React from 'react';
import { Settings } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, settings }) => {
    if (!isOpen) return null;

    const {
        numQuestions, setNumQuestions,
        timePerQuestion, setTimePerQuestion,
        instantFeedback, setInstantFeedback,
        newRatio, setNewRatio,
        mistakeWeight, setMistakeWeight,
        ttsEnabled, setTtsEnabled,
        examFormat, setExamFormat,
        isChemistryMode, setIsChemistryMode
    } = settings;

    // Helper logic to simplify toggles inline
    const updateSetting = (key, value) => {
        if (key === 'ttsEnabled') setTtsEnabled(value);
    };

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
                    {/* Section 1: Special Modes */}
                    <div className="space-y-3">
                        {/* Master Chemistry Mode Toggle */}
                        <div className="flex items-center justify-between p-4 bg-[#F2EBDE] rounded-xl border border-[#D6C2B0] shadow-sm">
                            <div>
                                <h3 className="font-bold text-[#3D312A] mb-1">🧪 Chemistry Mode</h3>
                                <p className="text-xs text-[#8C7B70]">Filter elements to only show numeric ions</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isChemistryMode}
                                    onChange={(e) => {
                                        setIsChemistryMode(e.target.checked);
                                        if (e.target.checked) updateSetting('ttsEnabled', false); // Force TTS off
                                        if (!e.target.checked) setExamFormat('standard'); // Revert to standard if disabled
                                    }}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2F5D62]"></div>
                            </label>
                        </div>

                        {/* Exam Format Mode */}
                        <div className={`flex flex-col gap-1 p-4 rounded-xl border transition-colors ${!isChemistryMode ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-[#F9F7F5] border-[#E0D6C8]'}`}>
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-[#3D312A]">📝 Exam Format</h3>
                                {!isChemistryMode && <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded">Locked</span>}
                            </div>
                            <select
                                value={isChemistryMode ? (settings.examFormat || 'standard') : 'standard'}
                                onChange={(e) => isChemistryMode && settings.setExamFormat(e.target.value)}
                                disabled={!isChemistryMode}
                                className="w-full p-2 rounded-lg bg-white border border-[#E0D6C8] text-[#5C4B41] focus:outline-none focus:border-[#2F5D62] disabled:cursor-not-allowed disabled:bg-gray-100"
                            >
                                <option value="standard">Standard (Word → Translation)</option>
                                <option value="atomic">Atomic (Word+Translation → Phonetic)</option>
                                <option value="mixed">Mixed (Randomly toggled)</option>
                            </select>
                        </div>
                    </div>

                    <hr className="border-[#F0EBE0]" />

                    {/* Section 2: Question Ratios & Presets */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-[#3D312A]">🎯 Question Distribution</h3>

                        {/* Quick Presets */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => { setNewRatio(100); setMistakeWeight(1); }}
                                className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors shadow-sm text-center ${newRatio === 100 && mistakeWeight === 1 ? 'bg-[#2F5D62] text-white border-[#2F5D62]' : 'bg-white text-[#5C4B41] hover:bg-[#EBE5D9] border-[#D6C2B0]'}`}
                            >
                                ✨ New Only
                            </button>
                            <button
                                onClick={() => { setNewRatio(0); setMistakeWeight(7.5); }}
                                className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors shadow-sm text-center ${newRatio === 0 && mistakeWeight === 7.5 ? 'bg-[#2F5D62] text-white border-[#2F5D62]' : 'bg-white text-[#5C4B41] hover:bg-[#EBE5D9] border-[#D6C2B0]'}`}
                            >
                                📚 Mistakes Focus
                            </button>
                            <button
                                onClick={() => { setNewRatio(0); setMistakeWeight(10); }}
                                className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors shadow-sm text-center ${newRatio === 0 && mistakeWeight === 10 ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'}`}
                            >
                                🔥 Hardcore Drill
                            </button>
                            <button
                                onClick={() => { setNewRatio(50); setMistakeWeight(5); }}
                                className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors shadow-sm text-center ${newRatio === 50 && mistakeWeight === 5 ? 'bg-[#2F5D62] text-white border-[#2F5D62]' : 'bg-white text-[#5C4B41] hover:bg-[#EBE5D9] border-[#D6C2B0]'}`}
                            >
                                ⚖️ Mixed (50/50)
                            </button>
                        </div>

                        {/* New Word Ratio Slider */}
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

                        {/* Mistake Weight Slider */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-[#5C4B41] font-medium">Mistake Repeat Weight</span>
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

                    <hr className="border-[#F0EBE0]" />

                    {/* Section 3: Experience & Audio */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-[#3D312A]">⚙️ Exam Experience</h3>

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

                        <div className="space-y-2">
                            {/* Instant Feedback Toggle */}
                            <div className="flex items-center justify-between p-3 bg-[#F9F7F5] rounded-xl border border-[#E0D6C8]">
                                <label className="text-[#3D312A] text-sm font-medium">Instant Feedback View</label>
                                <button
                                    onClick={() => setInstantFeedback(!instantFeedback)}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${instantFeedback ? 'bg-[#2F5D62]' : 'bg-[#D6C2B0]'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${instantFeedback ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* Heartbeat Sound Toggle */}
                            <div className="flex items-center justify-between p-3 bg-[#F9F7F5] rounded-xl border border-[#E0D6C8]">
                                <label className="text-[#3D312A] text-sm font-medium">Tension Heartbeat 💓</label>
                                <button
                                    onClick={() => settings.setHeartbeatEnabled(!settings.heartbeatEnabled)}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.heartbeatEnabled ? 'bg-[#2F5D62]' : 'bg-[#D6C2B0]'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${settings.heartbeatEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* TTS Toggle */}
                            <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isChemistryMode ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-[#F9F7F5] border-[#E0D6C8]'}`}>
                                <div className="flex flex-col">
                                    <label className="text-[#3D312A] text-sm font-medium">English Voice 🗣️</label>
                                    {isChemistryMode && <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-0.5">Disabled in Chem Mode</span>}
                                </div>
                                <label className={`relative inline-flex items-center ${isChemistryMode ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={!isChemistryMode && ttsEnabled}
                                        disabled={isChemistryMode}
                                        onChange={(e) => !isChemistryMode && updateSetting('ttsEnabled', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2F5D62]"></div>
                                </label>
                            </div>
                        </div>
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
    );
};

export default SettingsModal;
