export type PlanType = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

export interface Plan {
  id: number;
  name: string;
  type: PlanType;
  durationDays: number;
  price: number;
  features: string[];
}