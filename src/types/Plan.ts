export type PlanType = 'monthly' | 'quarterly' | 'annual';

export interface Plan {
  id: string;
  name: string;
  type: PlanType;
  durationDays: number;
  price: number;
  features: string[];
}