const STATS_KEY = 'vocab_master_stats';
const HISTORY_KEY = 'vocab_master_history';

const MistakeTracker = {
    getStats(words) {
        const stats = this._getAllStats();
        const history = this._getHistory();

        // Calculate recent stats for requested words
        const recentStats = {};
        const recentWindow = 20;

        // Group history by word
        const wordHistory = {};
        history.forEach(entry => {
            if (!wordHistory[entry.word]) {
                wordHistory[entry.word] = [];
            }
            wordHistory[entry.word].push(entry);
        });

        // Compute recent performance
        words.forEach(word => {
            const entries = wordHistory[word] || [];
            // Sort by timestamp desc (newest first)
            entries.sort((a, b) => b.timestamp - a.timestamp);

            const recentEntries = entries.slice(0, recentWindow);

            let recentCorrect = 0;
            let recentMistake = 0;

            recentEntries.forEach(e => {
                if (e.isCorrect) recentCorrect++;
                else recentMistake++;
            });

            recentStats[word] = { recentCorrect, recentMistake };
        });

        // Assemble final stats object
        const result = {};
        words.forEach(word => {
            const s = stats[word] || { mistakeCount: 0, correctCount: 0 };
            const r = recentStats[word];

            const total = s.correctCount + s.mistakeCount;
            const ratio = total > 0 ? Math.round((s.correctCount / total) * 1000) / 10 : 0;

            const rTotal = r.recentCorrect + r.recentMistake;
            const rRatio = rTotal > 0 ? Math.round((r.recentCorrect / rTotal) * 1000) / 10 : 0;

            result[word] = {
                mistake_count: s.mistakeCount,
                correct_count: s.correctCount,
                ratio: ratio,
                recent_correct: r.recentCorrect,
                recent_mistake: r.recentMistake,
                recent_ratio: rRatio
            };
        });

        return result;
    },

    getAllStats() {
        const stats = this._getAllStats();
        const words = Object.keys(stats);
        if (words.length === 0) return [];

        const statsMap = this.getStats(words);
        return Object.keys(statsMap).map(word => ({
            word,
            ...statsMap[word]
        }));
    },

    recordResult(word, isCorrect) {
        const stats = this._getAllStats();

        if (!stats[word]) {
            stats[word] = { correctCount: 0, mistakeCount: 0 };
        }

        if (isCorrect) {
            stats[word].correctCount++;
        } else {
            stats[word].mistakeCount++;
        }
        stats[word].lastReview = Date.now();

        this._saveStats(stats);
        this._addToHistory(word, isCorrect);
    },

    generateExam(allWords, settings) {
        const { numQuestions = 10, newRatio = 20, mistakeWeight = 5.0 } = settings;
        const newRatioDecimal = newRatio / 100.0;

        if (!allWords || allWords.length === 0) return [];

        // Get stats for all words to distinguish new vs old
        const wordList = allWords.map(w => w.word);
        const stats = this.getStats(wordList);

        const newWords = [];
        const oldWords = [];
        const oldWeights = [];

        allWords.forEach(w => {
            const s = stats[w.word];
            const totalAttempts = s ? (s.mistake_count + s.correct_count) : 0;

            if (totalAttempts === 0) {
                newWords.push(w);
            } else {
                oldWords.push(w);
                // Weight calculation: 1 + (Recent Mistakes * Weight)
                // Access recent_mistake directly from stats
                const recentMistakes = s ? s.recent_mistake : 0;
                const weight = 1 + (recentMistakes * mistakeWeight);
                oldWeights.push(weight);
            }
        });

        const selectedWords = [];
        const targetNewCount = Math.floor(numQuestions * newRatioDecimal);

        // Selection Logic
        for (let i = 0; i < numQuestions; i++) {
            let useNew = false;

            // Determine if we should pick a new word
            const currentNewCount = selectedWords.filter(w => newWords.includes(w)).length;

            if (newWords.length > 0 && oldWords.length > 0) {
                if (currentNewCount < targetNewCount) {
                    useNew = true;
                } else {
                    useNew = false;
                }
            } else if (newWords.length > 0) {
                useNew = true;
            } else {
                useNew = false;
            }

            // Pick word
            if (useNew && newWords.length > 0) {
                const randomIndex = Math.floor(Math.random() * newWords.length);
                selectedWords.push(newWords[randomIndex]);
            } else if (oldWords.length > 0) {
                // Weighted selection
                const selected = this._weightedRandom(oldWords, oldWeights);
                selectedWords.push(selected);
            } else if (newWords.length > 0) {
                // Fallback if no old words
                const randomIndex = Math.floor(Math.random() * newWords.length);
                selectedWords.push(newWords[randomIndex]);
            }
        }

        // Generate questions
        return selectedWords.map(target => {
            const formatSetting = settings.examFormat || 'standard';
            let useAtomic = formatSetting === 'atomic';
            if (formatSetting === 'mixed') {
                useAtomic = Math.random() > 0.5;
            }

            if (useAtomic) {
                // Determine base value for distractors
                const baseVal = parseInt(target.phonetic);
                let isNumeric = !isNaN(baseVal);
                let optionsData = [target];

                if (isNumeric) {
                    // Generate numeric distractors
                    const generated = new Set();
                    generated.add(baseVal);

                    while (generated.size < 4) {
                        const offset = Math.floor(Math.random() * 7) - 3; // -3 to +3
                        const distractorVal = baseVal + offset;
                        if (!generated.has(distractorVal)) {
                            generated.add(distractorVal);
                            const formattedVal = distractorVal > 0 ? `+${distractorVal}` : `${distractorVal}`;
                            optionsData.push({
                                word: `dummy_${formattedVal}`,
                                translation: target.zh, // Unused for display in atomic answer, but keep valid obj
                                phonetic: formattedVal
                            });
                        }
                    }
                } else {
                    // Fallback to purely random phonetic values from other words if it's not a number
                    const distractors = allWords.filter(w => w.word !== target.word && w.phonetic);
                    if (distractors.length >= 3) {
                        const shuffled = [...distractors].sort(() => 0.5 - Math.random());
                        optionsData = optionsData.concat(shuffled.slice(0, 3));
                    } else {
                        optionsData = optionsData.concat(distractors);
                    }
                }

                // Shuffle options
                optionsData.sort(() => 0.5 - Math.random());

                return {
                    isAtomic: true,
                    word: `${target.word} (${target.zh})`,
                    correct_translation: target.phonetic, // Only the phonetic part is the answer
                    target_word: target.word, // For tracking stats correctly
                    options: optionsData.map(o => ({
                        word: o.word,
                        isAtomicOption: true,
                        translation: o.phonetic // Display phonetic as the option text
                    }))
                };
            }

            // Standard Generation Fallback
            const distractors = allWords.filter(w => w.word !== target.word);
            let options = [target];

            if (distractors.length >= 3) {
                // Shuffle distractors and pick 3
                const shuffled = [...distractors].sort(() => 0.5 - Math.random());
                options = options.concat(shuffled.slice(0, 3));
            } else {
                options = options.concat(distractors);
            }

            // Shuffle options
            options.sort(() => 0.5 - Math.random());

            return {
                isAtomic: false,
                target_word: target.word,
                word: target.word,
                correct_translation: target.translation,
                options: options.map(o => ({
                    word: o.word,
                    translation: o.translation,
                    zh: o.zh,
                    phonetic: o.phonetic
                }))
            };
        });
    },

    resetStats() {
        localStorage.removeItem(STATS_KEY);
        localStorage.removeItem(HISTORY_KEY);
    },

    // Internal Helpers
    _getAllStats() {
        const stored = localStorage.getItem(STATS_KEY);
        return stored ? JSON.parse(stored) : {};
    },

    _saveStats(stats) {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    },

    _getHistory() {
        const stored = localStorage.getItem(HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    },

    _addToHistory(word, isCorrect) {
        const history = this._getHistory();
        history.push({
            word,
            isCorrect,
            timestamp: Date.now(),
            id: generateId()
        });
        // Optional: trim history if it gets too large? 
        // For now, keep it simple.
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    },

    _weightedRandom(items, weights) {
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        return items[items.length - 1]; // Fallback
    }
};

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

export default MistakeTracker;
