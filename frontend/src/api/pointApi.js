import axios from './index';

export const pointApi = {
    getAllPoints: () => axios.get('/api/points'),
    getPoint: (owner) => axios.get(`/api/points/${owner}`),
    getHistory: (owner) => axios.get(`/api/points/${owner}/history`),
    addPoints: (owner, data) => axios.post(`/api/points/${owner}/add`, data),
    usePoints: (owner, data) => axios.post(`/api/points/${owner}/use`, data),
};
