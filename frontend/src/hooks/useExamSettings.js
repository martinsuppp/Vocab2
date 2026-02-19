import { useState, useEffect } from 'react';

const useExamSettings = () => {
    // Number of Questions
    const [numQuestions, setNumQuestions] = useState(() => {
        const saved = localStorage.getItem('numQuestions');
        return saved ? Number(saved) : 20;
    });

    // Time Per Question (seconds)
    const [timePerQuestion, setTimePerQuestion] = useState(() => {
        const saved = localStorage.getItem('timePerQuestion');
        return saved ? Number(saved) : 5;
    });

    // Instant Feedback
    const [instantFeedback, setInstantFeedback] = useState(() => {
        const saved = localStorage.getItem('instantFeedback');
        return saved !== null ? saved === 'true' : true;
    });

    // New Word Ratio
    const [newRatio, setNewRatio] = useState(() => {
        const saved = localStorage.getItem('newRatio');
        return saved ? Number(saved) : 20;
    });

    // Mistake Weight
    const [mistakeWeight, setMistakeWeight] = useState(() => {
        const saved = localStorage.getItem('mistakeWeight');
        return saved ? Number(saved) : 5;
    });

    // Persist settings whenever they change
    useEffect(() => {
        localStorage.setItem('numQuestions', numQuestions);
        localStorage.setItem('timePerQuestion', timePerQuestion);
        localStorage.setItem('instantFeedback', instantFeedback);
        localStorage.setItem('newRatio', newRatio);
        localStorage.setItem('mistakeWeight', mistakeWeight);
    }, [numQuestions, timePerQuestion, instantFeedback, newRatio, mistakeWeight]);

    return {
        numQuestions, setNumQuestions,
        timePerQuestion, setTimePerQuestion,
        instantFeedback, setInstantFeedback,
        newRatio, setNewRatio,
        mistakeWeight, setMistakeWeight
    };
};

export default useExamSettings;
