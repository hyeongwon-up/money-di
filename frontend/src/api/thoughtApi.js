import axios from './index';

export const thoughtApi = {
  getThoughts: () => axios.get(`/api/thoughts?t=${new Date().getTime()}`),
  createThought: (thought) => axios.post('/api/thoughts', thought),
  updateThought: (id, thought) => axios.put(`/api/thoughts/${id}`, thought),
  deleteThought: (id) => axios.delete(`/api/thoughts/${id}`)
};
