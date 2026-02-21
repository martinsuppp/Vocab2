import MistakeTracker from './src/services/MistakeTracker.js';

const allWords = [
    { word: 'H', zh: '氫', phonetic: '+1', translation: '氫 +1' },
    { word: 'O', zh: '氧', phonetic: '-2', translation: '氧 -2' },
    { word: 'Ca', zh: '鈣', phonetic: '+2', translation: '鈣 +2' }
];

const settings = {
    numQuestions: 2,
    examFormat: 'atomic'
};

try {
    const q = MistakeTracker.generateExam(allWords, settings);
    console.log("SUCCESS");
} catch(e) {
    console.error("ERROR:", e);
}
