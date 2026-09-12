import axios from './index';

import { toSpendingPayload } from '../utils/spending';

export const spendingApi = {
  getPlans: () => axios.get('/api/spending-plans'),
  createPlan: (plan) => axios.post('/api/spending-plans', toSpendingPayload(plan)),
  updatePlan: (id, plan) => axios.put(`/api/spending-plans/${id}`, toSpendingPayload(plan)),
  deletePlan: (id) => axios.delete(`/api/spending-plans/${id}`)
};
