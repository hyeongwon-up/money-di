export function daysUntil(dueDate, today = new Date()) {
  const [year, month, day] = dueDate.split('-').map(Number);
  // Compare calendar days; time-of-day and daylight saving must not alter D-day.
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
}

export function filterPlans(plans, filter, query, today = new Date()) {
  const search = query.trim().toLowerCase();
  return plans.filter(plan => {
    const matchesState = filter === 'all' ||
      (filter === 'paid' && plan.paid) ||
      (filter === 'unpaid' && !plan.paid) ||
      (filter === 'overdue' && !plan.paid && daysUntil(plan.dueDate, today) < 0);
    return matchesState && `${plan.title} ${plan.description || ''}`.toLowerCase().includes(search);
  });
}

// Avoid sending conflicting paid/isPaid values from legacy forms.
export const toSpendingPayload = ({ title, amount, dueDate, description, paid, isPaid }) => ({
  title: title.trim(), amount: Number(amount), dueDate, description,
  paid: isPaid ?? paid ?? false
});
