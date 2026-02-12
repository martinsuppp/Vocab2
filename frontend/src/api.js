import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

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

export const generateExam = async (filename, numQuestions) => {
    const response = await api.post('/exam', { filename, num_questions: numQuestions });
    return response.data;
};

export const submitResults = async (results) => {
    const response = await api.post('/submit', { results });
    return response.data;
};

export default api;
