import React, { useState, useEffect } from 'react';
import { Home as HomeIcon, ArrowUpDown, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStats, resetStats } from '../api';

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

    const handleReset = async () => {
        if (window.confirm("Are you sure you want to reset all statistics? This cannot be undone.")) {
            try {
                await resetStats();
                await fetchStats(); // Reload stats (should be empty)
            } catch (error) {
                console.error("Failed to reset stats", error);
                alert("Failed to reset stats. Please try again.");
            }
        }
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
        return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 text-blue-400" /> : <ArrowDown className="w-4 h-4 text-blue-400" />;
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-white">Loading Stats...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center">
            <div className="w-full max-w-4xl mb-6 flex justify-between items-center">
                <button onClick={() => navigate('/')} className="hover:text-blue-400 transition-colors flex items-center gap-2 font-bold">
                    <HomeIcon className="w-5 h-5" /> Back to Home
                </button>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                    Performance Stats
                </h1>
                <button onClick={handleReset} className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-bold border border-red-500/50">
                    <Trash2 className="w-5 h-5" /> Reset Stats
                </button>
            </div>

            <div className="w-full max-w-4xl bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-slate-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-750 border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                                <th rowSpan="2" className="p-4 text-left font-semibold cursor-pointer hover:bg-slate-700" onClick={() => handleSort('word')}>
                                    <div className="flex items-center gap-2">Word {getSortIcon('word')}</div>
                                </th>
                                <th colSpan="3" className="p-2 text-center border-l border-slate-700 bg-slate-800/50">Lifetime</th>
                                <th colSpan="3" className="p-2 text-center border-l border-slate-700 bg-blue-900/20 text-blue-300">Last 20</th>
                            </tr>
                            <tr className="bg-slate-750 border-b border-slate-700 text-xs">
                                {/* Lifetime */}
                                <th className="p-2 text-center border-l border-slate-700 cursor-pointer hover:bg-slate-700" onClick={() => handleSort('correct_count')}>
                                    Correct {getSortIcon('correct_count')}
                                </th>
                                <th className="p-2 text-center cursor-pointer hover:bg-slate-700" onClick={() => handleSort('mistake_count')}>
                                    Mistakes {getSortIcon('mistake_count')}
                                </th>
                                <th className="p-2 text-center cursor-pointer hover:bg-slate-700" onClick={() => handleSort('ratio')}>
                                    Ratio {getSortIcon('ratio')}
                                </th>

                                {/* Recent */}
                                <th className="p-2 text-center border-l border-slate-700 cursor-pointer hover:bg-slate-700" onClick={() => handleSort('recent_correct')}>
                                    Correct {getSortIcon('recent_correct')}
                                </th>
                                <th className="p-2 text-center cursor-pointer hover:bg-slate-700" onClick={() => handleSort('recent_mistake')}>
                                    Mistakes {getSortIcon('recent_mistake')}
                                </th>
                                <th className="p-2 text-center cursor-pointer hover:bg-slate-700" onClick={() => handleSort('recent_ratio')}>
                                    Ratio {getSortIcon('recent_ratio')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedStats.length > 0 ? (
                                sortedStats.map((item, idx) => (
                                    <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                                        <td className="p-4 font-medium text-lg border-r border-slate-700/50">{item.word}</td>

                                        {/* Lifetime Data */}
                                        <td className="p-2 text-center text-green-300/70 font-mono">{item.correct_count}</td>
                                        <td className="p-2 text-center text-red-300/70 font-mono">{item.mistake_count}</td>
                                        <td className="p-2 text-center text-yellow-300/70 font-mono border-r border-slate-700/50">
                                            {item.ratio}%
                                            <div className="w-16 h-1 bg-slate-700 rounded-full mx-auto mt-1 overflow-hidden">
                                                <div
                                                    className={`h-full ${item.ratio >= 80 ? 'bg-green-500/50' : item.ratio >= 50 ? 'bg-yellow-500/50' : 'bg-red-500/50'}`}
                                                    style={{ width: `${item.ratio}%` }}
                                                ></div>
                                            </div>
                                        </td>

                                        {/* Recent Data */}
                                        <td className="p-2 text-center text-green-300 font-bold font-mono">{item.recent_correct}</td>
                                        <td className="p-2 text-center text-red-300 font-bold font-mono">{item.recent_mistake}</td>
                                        <td className="p-2 text-center text-yellow-300 font-bold font-mono">
                                            {item.recent_ratio}%
                                            <div className="w-16 h-1.5 bg-slate-700 rounded-full mx-auto mt-1 overflow-hidden">
                                                <div
                                                    className={`h-full ${item.recent_ratio >= 80 ? 'bg-green-500' : item.recent_ratio >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${item.recent_ratio}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500">
                                        No stats available yet. Start practicing!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Stats;
