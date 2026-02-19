import React, { useState, useEffect } from 'react';
import { Home as HomeIcon, ArrowUpDown, ArrowUp, ArrowDown, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStats, resetStats } from '../api.js';
import LearningLayout from '../components/LearningLayout';

const Stats = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'correct_count', direction: 'desc' });

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await getStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to load stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const handleResetClick = () => {
        setShowResetConfirm(true);
    };

    const confirmReset = async () => {
        try {
            await resetStats();
            await fetchStats();
            setShowResetConfirm(false);
        } catch (error) {
            console.error("Failed to reset stats", error);
            alert("Failed to reset stats. Please try again.");
        }
    };

    const cancelReset = () => {
        setShowResetConfirm(false);
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedStats = React.useMemo(() => {
        let sortableItems = [...stats];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [stats, sortConfig]);

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ArrowUpDown className="w-4 h-4 opacity-30" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 text-[#2F5D62]" /> : <ArrowDown className="w-4 h-4 text-[#2F5D62]" />;
    };

    if (loading) return (
        <LearningLayout>
            <div className="flex h-full items-center justify-center text-[#5C4B41]">Loading Stats...</div>
        </LearningLayout>
    );

    return (
        <LearningLayout>
            <div className="min-h-full p-6 flex flex-col items-center relative">
                {/* Confirmation Modal */}
                {showResetConfirm && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white border border-[#E0D6C8] p-6 rounded-xl shadow-xl max-w-sm w-full mx-4">
                            <h3 className="text-xl font-bold text-[#3D312A] mb-2 font-serif">Reset All Stats?</h3>
                            <p className="text-[#8C7B70] mb-6">
                                This will permanently delete all your progress and learning history. This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={cancelReset}
                                    className="px-4 py-2 rounded-lg text-[#8C7B70] hover:bg-[#F0EBE0] transition-colors font-medium hover:text-[#5C4B41]"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmReset}
                                    className="px-4 py-2 rounded-lg bg-[#D35D47] text-white hover:bg-[#C04C39] transition-colors font-medium flex items-center gap-2 shadow-sm"
                                >
                                    <Trash2 className="w-4 h-4" /> Confirm Reset
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="w-full max-w-4xl mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-[#3D312A] font-serif mb-1">
                            Performance Stats
                        </h1>
                        <p className="text-[#8C7B70] text-sm">Track your vocabulary mastery</p>
                    </div>

                    <button onClick={handleResetClick} className="bg-white text-[#D35D47] hover:bg-[#FFF5F5] px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-bold border border-[#D35D47] shadow-sm">
                        <Trash2 className="w-5 h-5" /> Reset Stats
                    </button>
                </div>

                <div className="w-full max-w-4xl bg-white rounded-xl shadow-sm border border-[#E0D6C8] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F5F1E8] border-b border-[#E0D6C8] text-xs uppercase tracking-wider text-[#8C7B70]">
                                    <th rowSpan="2" className="p-4 text-left font-bold cursor-pointer hover:bg-[#EBE5D9] transition-colors" onClick={() => handleSort('word')}>
                                        <div className="flex items-center gap-2 text-[#5C4B41]">Word {getSortIcon('word')}</div>
                                    </th>
                                    <th colSpan="3" className="p-2 text-center border-l border-[#E0D6C8] bg-[#F0EBE0]">Lifetime</th>
                                    <th colSpan="3" className="p-2 text-center border-l border-[#E0D6C8] bg-[#2F5D62]/5 text-[#2F5D62]">Last 20</th>
                                </tr>
                                <tr className="bg-[#F5F1E8] border-b border-[#E0D6C8] text-xs text-[#8C7B70]">
                                    {/* Lifetime */}
                                    <th className="p-2 text-center border-l border-[#E0D6C8] cursor-pointer hover:bg-[#EBE5D9] transition-colors" onClick={() => handleSort('correct_count')}>
                                        Correct {getSortIcon('correct_count')}
                                    </th>
                                    <th className="p-2 text-center cursor-pointer hover:bg-[#EBE5D9] transition-colors" onClick={() => handleSort('mistake_count')}>
                                        Mistakes {getSortIcon('mistake_count')}
                                    </th>
                                    <th className="p-2 text-center cursor-pointer hover:bg-[#EBE5D9] transition-colors" onClick={() => handleSort('ratio')}>
                                        Ratio {getSortIcon('ratio')}
                                    </th>

                                    {/* Recent */}
                                    <th className="p-2 text-center border-l border-[#E0D6C8] cursor-pointer hover:bg-[#EBE5D9] transition-colors" onClick={() => handleSort('recent_correct')}>
                                        Correct {getSortIcon('recent_correct')}
                                    </th>
                                    <th className="p-2 text-center cursor-pointer hover:bg-[#EBE5D9] transition-colors" onClick={() => handleSort('recent_mistake')}>
                                        Mistakes {getSortIcon('recent_mistake')}
                                    </th>
                                    <th className="p-2 text-center cursor-pointer hover:bg-[#EBE5D9] transition-colors" onClick={() => handleSort('recent_ratio')}>
                                        Ratio {getSortIcon('recent_ratio')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedStats.length > 0 ? (
                                    sortedStats.map((item, idx) => (
                                        <tr key={idx} className="border-b border-[#E0D6C8]/50 hover:bg-[#F9F7F2] transition-colors">
                                            <td className="p-4 font-medium text-lg border-r border-[#E0D6C8]/50 text-[#3D312A]">{item.word}</td>

                                            {/* Lifetime Data */}
                                            <td className="p-2 text-center text-[#2F5D62] font-mono font-medium">{item.correct_count}</td>
                                            <td className="p-2 text-center text-[#D35D47] font-mono font-medium">{item.mistake_count}</td>
                                            <td className="p-2 text-center text-[#8C7B70] font-mono border-r border-[#E0D6C8]/50">
                                                {item.ratio}%
                                                <div className="w-16 h-1 bg-[#E0D6C8] rounded-full mx-auto mt-1 overflow-hidden">
                                                    <div
                                                        className={`h-full ${item.ratio >= 80 ? 'bg-[#2F5D62]' : item.ratio >= 50 ? 'bg-[#D4A373]' : 'bg-[#D35D47]'}`}
                                                        style={{ width: `${item.ratio}%` }}
                                                    ></div>
                                                </div>
                                            </td>

                                            {/* Recent Data */}
                                            <td className="p-2 text-center text-[#2F5D62] font-bold font-mono">{item.recent_correct}</td>
                                            <td className="p-2 text-center text-[#D35D47] font-bold font-mono">{item.recent_mistake}</td>
                                            <td className="p-2 text-center text-[#8C7B70] font-bold font-mono">
                                                {item.recent_ratio}%
                                                <div className="w-16 h-1.5 bg-[#E0D6C8] rounded-full mx-auto mt-1 overflow-hidden">
                                                    <div
                                                        className={`h-full ${item.recent_ratio >= 80 ? 'bg-[#2F5D62]' : item.recent_ratio >= 50 ? 'bg-[#D4A373]' : 'bg-[#D35D47]'}`}
                                                        style={{ width: `${item.recent_ratio}%` }}
                                                    ></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="p-16 text-center text-[#8C7B70] italic">
                                            No stats available yet. Start practicing!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </LearningLayout>
    );
};

export default Stats;
