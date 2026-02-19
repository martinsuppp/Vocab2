import { ArrowLeft, BookOpen, Layers, PenTool, LayoutGrid, Home, BarChart, Settings } from 'lucide-react';
import useExamSettings from '../hooks/useExamSettings';
import SoundManager from '../utils/SoundManager';
import SettingsModal from './SettingsModal';
import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const LearningLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Sound State
    const [isMuted, setIsMuted] = useState(SoundManager.muted);

    // Settings Logic
    const settings = useExamSettings();
    const [showSettings, setShowSettings] = useState(false);

    // Determine current active tab based on path
    const path = location.pathname;
    const isList = path === '/list';
    const isMemory = path === '/memory';
    const isExam = path === '/exam';

    return (
        <div className="min-h-screen bg-[#F5F1E8] flex flex-col font-serif">
            {/* Shared Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-[#E0D6C8] text-[#3D312A] sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

                    {/* Left: Back to Hub + Home Link */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-[#8C7B70] hover:text-[#2F5D62] transition-colors"
                            title="Go to Setup"
                        >
                            <span className="text-lg font-bold font-serif tracking-tight text-[#2F5D62]">VocabMaster</span>
                        </button>
                    </div>

                    {/* Center: Navigation Tabs */}
                    <nav className="flex items-center bg-[#F5F1E8] p-1 rounded-xl border border-[#E0D6C8]">
                        <button
                            onClick={() => navigate('/list')}
                            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg transition-all text-sm font-medium ${isList
                                ? 'bg-white text-[#2F5D62] shadow-sm'
                                : 'text-[#8C7B70] hover:text-[#5C4B41]'
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span className="hidden sm:inline">List</span>
                        </button>

                        <button
                            onClick={() => navigate('/memory')}
                            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg transition-all text-sm font-medium ${isMemory
                                ? 'bg-white text-[#2F5D62] shadow-sm'
                                : 'text-[#8C7B70] hover:text-[#5C4B41]'
                                }`}
                        >
                            <Layers className="w-4 h-4" />
                            <span className="hidden sm:inline">Cards</span>
                        </button>

                        <button
                            onClick={() => navigate('/exam')}
                            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg transition-all text-sm font-medium ${isExam
                                ? 'bg-white text-[#2F5D62] shadow-sm'
                                : 'text-[#8C7B70] hover:text-[#5C4B41]'
                                }`}
                        >
                            <PenTool className="w-4 h-4" />
                            <span className="hidden sm:inline">Exam</span>
                        </button>
                    </nav>

                    {/* Right: Home & Stats */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 text-[#8C7B70] hover:text-[#2F5D62] hover:bg-[#F5F1E8] rounded-full transition-colors"
                            title="Home (Setup)"
                        >
                            <Home className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2 text-[#8C7B70] hover:text-[#2F5D62] hover:bg-[#F5F1E8] rounded-full transition-colors"
                            title="Settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => {
                                const newMuted = SoundManager.toggleMuted();
                                setIsMuted(newMuted);
                            }}
                            className="p-2 text-[#8C7B70] hover:text-[#2F5D62] hover:bg-[#F5F1E8] rounded-full transition-colors"
                            title={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? "🔇" : "🔊"}
                        </button>
                        <button
                            onClick={() => navigate('/stats')}
                            className="p-2 text-[#8C7B70] hover:text-[#2F5D62] hover:bg-[#F5F1E8] rounded-full transition-colors"
                            title="Statistics"
                        >
                            <BarChart className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto">
                {children || <Outlet />}
            </main>

            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                settings={settings}
            />
        </div>
    );
};

export default LearningLayout;
