import { Plan } from '../types/Plan';

export const mockPlans: Plan[] = [
  {
    id: 'plan_monthly_basic',
    name: 'Monthly Basic',
    type: 'monthly',
    durationDays: 30,
    price: 800,
    features: ['Access to gym floor', 'Locker facility', 'Basic equipment'],
  },
  {
    id: 'plan_monthly_pro',
    name: 'Monthly Pro',
    type: 'monthly',
    durationDays: 30,
    price: 1200,
    features: ['All Basic features', 'Personal trainer (2x/week)', 'Diet consultation'],
  },
  {
    id: 'plan_quarterly',
    name: 'Quarterly',
    type: 'quarterly',
    durationDays: 90,
    price: 3000,
    features: ['All Pro features', 'Unlimited trainer sessions', 'Nutrition plan', 'Progress tracking'],
  },
  {
    id: 'plan_annual',
    name: 'Annual',
    type: 'annual',
    durationDays: 365,
    price: 9000,
    features: ['All Quarterly features', 'Free supplements', 'Body composition analysis', 'Priority support'],
  },
];