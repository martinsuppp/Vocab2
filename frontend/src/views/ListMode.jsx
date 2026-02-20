import React, { useState, useEffect } from 'react';
import DataLoader from '../services/DataLoader';
import LearningLayout from '../components/LearningLayout';
import { Search, Volume2, Star } from 'lucide-react';
import SoundManager from '../utils/SoundManager';
import useExamSettings from '../hooks/useExamSettings';
import StarManager from '../services/StarManager';

const ListMode = () => {
    // Shared Settings State
    const settings = useExamSettings();
    const { ttsEnabled } = settings;

    const [loading, setLoading] = useState(true);

    // Data State
    const [allData, setAllData] = useState({}); // { sheetName: [words...] }
    const [sheetNames, setSheetNames] = useState([]); // Available sheets in THIS session

    // Filter State
    const [selectedSheets, setSelectedSheets] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [starFilterActive, setStarFilterActive] = useState(false);

    // UI trigger for re-render when stars change
    const [updateTrigger, setUpdateTrigger] = useState(0);

    // Load Data based on Session Scope
    useEffect(() => {
        const fetchData = async () => {
            try {
                // detailed session config
                const sessionRaw = localStorage.getItem('currentSession');
                const session = sessionRaw ? JSON.parse(sessionRaw) : { files: [] };

                // If no session files, fallback to all or warn (but Home should prevent this)
                let scopeFiles = session.files;

                if (!scopeFiles || scopeFiles.length === 0) {
                    // Fallback to all files if visited directly without setup
                    scopeFiles = await DataLoader.listFiles();
                }

                setSheetNames(scopeFiles);

                // Initialize Star Filter from session
                if (session.starFilterActive !== undefined) {
                    setStarFilterActive(session.starFilterActive);
                }

                // Load content for session files
                const dataMap = {};
                for (const sheet of scopeFiles) {
                    const words = await DataLoader.loadWords(sheet);
                    dataMap[sheet] = words;
                }
                setAllData(dataMap);

                // Initialize selection to ALL of the session files (or saved)
                if (session.activeFiles) {
                    setSelectedSheets(session.activeFiles);
                } else {
                    setSelectedSheets(scopeFiles);
                }

            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Sync active scope to session for other modes (Memory, Exam)
    useEffect(() => {
        if (loading) return; // Don't sync during initial load
        const sessionRaw = localStorage.getItem('currentSession');
        if (sessionRaw) {
            try {
                const session = JSON.parse(sessionRaw);
                session.activeFiles = selectedSheets;
                session.starFilterActive = starFilterActive;
                localStorage.setItem('currentSession', JSON.stringify(session));
            } catch (error) {
                console.error("Error updating activeFiles in session", error);
            }
        }
    }, [selectedSheets, starFilterActive, loading]);

    // Derived State: Filtered Words
    const getFilteredWords = () => {
        let words = [];

        // 1. Gather words from selected sheets
        selectedSheets.forEach(sheet => {
            if (allData[sheet]) {
                const sheetWords = allData[sheet].map(w => ({ ...w, source: sheet }));
                words = words.concat(sheetWords);
            }
        });

        // 2. Filter by search query
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            words = words.filter(w =>
                w.word.toLowerCase().includes(lowerQuery) ||
                (w.translation && w.translation.toLowerCase().includes(lowerQuery))
            );
        }

        // 3. Filter by Starred
        if (starFilterActive) {
            words = words.filter(w => StarManager.isStarred(w.word));
        }

        return words;
    };

    const handleToggleStar = (e, wordObj) => {
        e.stopPropagation(); // prevent other clicks
        StarManager.toggleStar(wordObj.word);
        setUpdateTrigger(prev => prev + 1); // force re-render
    };

    const toggleSheet = (sheet) => {
        if (selectedSheets.includes(sheet)) {
            setSelectedSheets(selectedSheets.filter(s => s !== sheet));
        } else {
            setSelectedSheets([...selectedSheets, sheet]);
        }
    };

    const toggleAll = () => {
        if (selectedSheets.length === sheetNames.length) {
            setSelectedSheets([]);
        } else {
            setSelectedSheets(sheetNames);
        }
    };

    const filteredWords = getFilteredWords();

    if (loading) {
        return (
            <LearningLayout settings={settings}>
                <div className="h-full flex items-center justify-center text-[#5C4B41]">
                    Loading...
                </div>
            </LearningLayout>
        );
    }

    return (
        <LearningLayout settings={settings}>
            <div className="max-w-6xl mx-auto p-6">
                {/* Internal Header with Search */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-[#3D312A] font-serif">Vocabulary List</h1>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7B70]" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-white border border-[#E0D6C8] focus:outline-none focus:border-[#BFAF9E] text-sm placeholder-[#B0A499]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Filter Section */}
                <div className="mb-8 overflow-x-auto pb-2">
                    <div className="flex flex-nowrap gap-2 items-center">
                        <button
                            onClick={toggleAll}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedSheets.length === sheetNames.length
                                ? 'bg-[#2F5D62] text-white shadow-md'
                                : 'bg-white border border-[#E0D6C8] text-[#5C4B41] hover:bg-[#F0EBE0]'
                                }`}
                        >
                            All ({filteredWords.length})
                        </button>

                        <button
                            onClick={() => setStarFilterActive(!starFilterActive)}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${starFilterActive
                                ? 'bg-[#F2A359] text-white shadow-md border border-[#F2A359]'
                                : 'bg-white border border-[#E0D6C8] text-[#8C7B70] hover:bg-[#F0EBE0]'
                                }`}
                        >
                            <Star className={`w-4 h-4 ${starFilterActive ? 'fill-white' : ''}`} />
                            Starred
                        </button>

                        {sheetNames.map(sheet => {
                            const count = allData[sheet]?.length || 0;
                            const isSelected = selectedSheets.includes(sheet);
                            return (
                                <button
                                    key={sheet}
                                    onClick={() => toggleSheet(sheet)}
                                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isSelected
                                        ? 'bg-white border-2 border-[#5C4B41] text-[#3D312A] shadow-sm'
                                        : 'bg-white border border-[#E0D6C8] text-[#8C7B70] hover:bg-[#F0EBE0]'
                                        }`}
                                >
                                    {sheet} <span className="text-xs opacity-60">({count})</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredWords.map((item, idx) => (
                        <div
                            key={`${item.source}-${idx}`}
                            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-[#E0D6C8] group relative flex flex-col justify-between min-h-[140px]"
                        >
                            <div>
                                <h3
                                    className="text-xl font-bold text-[#2C241F] font-serif mb-1 break-words cursor-pointer hover:text-[#2F5D62] transition-colors flex items-center gap-2"
                                    onClick={() => ttsEnabled && SoundManager.speak(item.word)}
                                    title={ttsEnabled ? "Click to listen" : "Enable TTS in settings to listen"}
                                >
                                    {item.word}
                                    {ttsEnabled && <Volume2 className="w-4 h-4 text-[#8C7B70] opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </h3>
                                {/* Star Right Corner */}
                                <button
                                    className="absolute top-4 right-4 p-2 text-[#D6C2B0] hover:text-[#F2A359] transition-colors focus:outline-none"
                                    onClick={(e) => handleToggleStar(e, item)}
                                >
                                    <Star className={`w-5 h-5 ${StarManager.isStarred(item.word) ? 'fill-[#F2A359] text-[#F2A359]' : ''}`} />
                                </button>
                                {item.phonetic && (
                                    <span className="text-sm text-[#8C7B70] font-sans block mb-2">/{item.phonetic}/</span>
                                )}
                            </div>
                            <div>
                                <div className="h-px bg-[#F0EBE0] w-full my-2"></div>
                                <p className="text-[#5C4B41] text-sm font-medium">{item.translation}</p>
                            </div>
                        </div>
                    ))}

                    {filteredWords.length === 0 && (
                        <div className="col-span-full text-center py-20 text-[#8C7B70]">
                            No words match your filter.
                        </div>
                    )}
                </div>
            </div>
        </LearningLayout>
    );
};

export default ListMode;
