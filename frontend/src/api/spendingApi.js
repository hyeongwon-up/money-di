import axios from './index';

export const spendingApi = {
  getPlans: () => axios.get('/api/spending-plans'),
  createPlan: (plan) => axios.post('/api/spending-plans', plan),
  updatePlan: (id, plan) => axios.put(`/api/spending-plans/${id}`, plan),
  deletePlan: (id) => axios.delete(`/api/spending-plans/${id}`)
};
