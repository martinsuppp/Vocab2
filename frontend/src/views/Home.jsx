import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFiles } from '../api';
import { BookOpen, PenTool, Settings, BarChart } from 'lucide-react';

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

    const [numQuestions, setNumQuestions] = useState(10);

    const handleStart = (mode) => {
        if (!selectedFile) return;
        let url = `/${mode}?filename=${encodeURIComponent(selectedFile)}`;
        if (mode === 'exam') {
            url += `&numQuestions=${numQuestions}`;
        }
        navigate(url);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 relative">
            <div className="absolute top-6 right-6">
                <button
                    onClick={() => navigate('/stats')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 text-sm font-medium text-slate-300 hover:text-white"
                >
                    <BarChart className="w-4 h-4 text-purple-400" /> Stats
                </button>
            </div>
            <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                VocabMaster
            </h1>

            <div className="w-full max-w-md bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700">
                <div className="mb-6">
                    <label className="block text-slate-400 mb-2 font-medium">Select Vocabulary List</label>
                    {loading ? (
                        <div className="animate-pulse h-10 bg-slate-700 rounded"></div>
                    ) : (
                        <select
                            value={selectedFile}
                            onChange={(e) => setSelectedFile(e.target.value)}
                            className="w-full bg-slate-700 text-white p-3 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {files.map(file => (
                                <option key={file} value={file}>{file}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="mb-6">
                    <label className="block text-slate-400 mb-2 font-medium">Exam Questions</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="5"
                            max="50"
                            step="5"
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(Number(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <span className="text-white font-mono w-8">{numQuestions}</span>
                    </div>
                </div>

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
