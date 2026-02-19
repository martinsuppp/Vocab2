import DataLoader from './services/DataLoader';
import MistakeTracker from './services/MistakeTracker';

// Re-export services for direct access if needed
export { DataLoader, MistakeTracker };

/**
 * Fetch list of available vocabulary files
 * Replaces GET /api/files
 */
export const getFiles = async () => {
    return DataLoader.listFiles();
};

/**
 * Fetch words from specific file(s)
 * Replaces GET /api/words?filename=...
 * @param {string} filename - Comma-separated list of filenames
 */
export const getWords = async (filename) => {
    const filenames = filename.split(',').map(f => f.trim());
    let allWords = [];

    for (const fname of filenames) {
        if (!fname) continue;
        const words = await DataLoader.loadWords(fname);
        allWords = allWords.concat(words);
    }
    return allWords;
};

/**
 * Generate an exam based on settings
 * Replaces POST /api/exam
 */
export const generateExam = async (filename, settings) => {
    // 1. Get words
    const allWords = await getWords(filename);

    // 2. Generate exam locally
    return MistakeTracker.generateExam(allWords, settings);
};

/**
 * Submit exam results
 * Replaces POST /api/submit
 */
export const submitResults = async (results) => {
    // results: Array of { word: string, is_correct: boolean }

    // 1. Record each result
    results.forEach(result => {
        MistakeTracker.recordResult(result.word, result.is_correct);
    });

    // 2. return updated stats for these words
    const wordList = results.map(r => r.word);
    const updatedStats = MistakeTracker.getStats(wordList);

    return {
        message: 'Results recorded successfully',
        updated_stats: updatedStats
    };
};

export const submitExam = submitResults;

/**
 * Get all stats
 * Replaces GET /api/stats
 */
export const getStats = async () => {
    return MistakeTracker.getAllStats();
};

/**
 * Reset stats
 * Replaces DELETE /api/stats
 */
export const resetStats = async () => {
    MistakeTracker.resetStats();
    return { message: 'Stats reset successfully' };
};

const api = {
    getFiles,
    getWords,
    generateExam,
    submitResults,
    submitExam,
    getStats,
    resetStats
};

export default api;
