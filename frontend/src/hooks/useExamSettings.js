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

    // Heartbeat Sound Enabled
    const [heartbeatEnabled, setHeartbeatEnabled] = useState(() => {
        const saved = localStorage.getItem('heartbeatEnabled');
        return saved !== null ? saved === 'true' : true;
    });

    const [ttsEnabled, setTtsEnabled] = useState(() => {
        const saved = localStorage.getItem('ttsEnabled');
        return saved !== null ? saved === 'true' : false;
    });

    // Persist settings whenever they change
    useEffect(() => {
        localStorage.setItem('numQuestions', numQuestions);
        localStorage.setItem('timePerQuestion', timePerQuestion);
        localStorage.setItem('instantFeedback', instantFeedback);
        localStorage.setItem('newRatio', newRatio);
        localStorage.setItem('mistakeWeight', mistakeWeight);
        localStorage.setItem('heartbeatEnabled', heartbeatEnabled);
        localStorage.setItem('ttsEnabled', ttsEnabled);
    }, [numQuestions, timePerQuestion, instantFeedback, newRatio, mistakeWeight, heartbeatEnabled, ttsEnabled]);

    return {
        numQuestions, setNumQuestions,
        timePerQuestion, setTimePerQuestion,
        instantFeedback, setInstantFeedback,
        newRatio, setNewRatio,
        mistakeWeight, setMistakeWeight,
        heartbeatEnabled, setHeartbeatEnabled,
        ttsEnabled, setTtsEnabled
    };
};

export default useExamSettings;
