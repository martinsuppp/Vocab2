import axios from 'axios';

const API_BASE_URL = import.meta.env.DEV
    ? `http://${window.location.hostname}:5001/api`
    : '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export const getFiles = async () => {
    const response = await api.get('/files');
    return response.data;
};

export const getWords = async (filename) => {
    const response = await api.get('/words', { params: { filename } });
    return response.data;
};

export const generateExam = async (filename, settings) => {
    // settings: { numQuestions, newRatio, mistakeWeight }
    const response = await api.post('/exam', {
        filename,
        num_questions: settings.numQuestions,
        new_ratio: settings.newRatio,
        mistake_weight: settings.mistakeWeight
    });
    return response.data;
};

export const submitResults = async (results) => {
    const response = await api.post('/submit', { results });
    return response.data;
};

export const submitExam = submitResults;

export const getStats = async () => {
    const response = await api.get('/stats');
    return response.data;
};

export const resetStats = async () => {
    const response = await api.delete('/stats');
    return response.data;
};

export default api;
