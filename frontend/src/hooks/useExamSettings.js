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

    // TTS Enabled
    const [ttsEnabled, setTtsEnabled] = useState(() => {
        const saved = localStorage.getItem('ttsEnabled');
        return saved !== null ? saved === 'true' : true;
    });

    // Persist settings whenever they change
    useEffect(() => {
        localStorage.setItem('numQuestions', numQuestions);
        localStorage.setItem('timePerQuestion', timePerQuestion);
        localStorage.setItem('instantFeedback', instantFeedback);
        localStorage.setItem('newRatio', newRatio);
        localStorage.setItem('mistakeWeight', mistakeWeight);
        localStorage.setItem('examSettings', JSON.stringify(settings));
    }, [settings]);

    // Helper function to create individual setters
    const createSetter = (key) => (value) => {
        setSettings(prevSettings => ({
            ...prevSettings,
            [key]: value
        }));
    };

    return {
        numQuestions: settings.numQuestions,
        setNumQuestions: createSetter('numQuestions'),
        timePerQuestion: settings.timePerQuestion,
        setTimePerQuestion: createSetter('timePerQuestion'),
        instantFeedback: settings.instantFeedback,
        setInstantFeedback: createSetter('instantFeedback'),
        newRatio: settings.newRatio,
        setNewRatio: createSetter('newRatio'),
        mistakeWeight: settings.mistakeWeight,
        setMistakeWeight: createSetter('mistakeWeight'),
        heartbeatEnabled: settings.heartbeatEnabled,
        setHeartbeatEnabled: createSetter('heartbeatEnabled'),
        ttsEnabled: settings.ttsEnabled,
        setTtsEnabled: createSetter('ttsEnabled'),
        isChemistryMode: settings.isChemistryMode,
        setIsChemistryMode: createSetter('isChemistryMode'),
    };
};

export default useExamSettings;
