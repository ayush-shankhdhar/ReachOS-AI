export interface ICustomer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  avatar: string;
  segment: 'high_value' | 'inactive' | 'frequent_buyer' | 'churn_risk' | 'new';
  status: 'active' | 'inactive' | 'churned';
  tags: string[];
  totalSpent: number;
  totalOrders: number;
  lastOrderDate: Date | string;
  lifetimeValue: number;
  engagementScore: number;
  preferredChannel: 'email' | 'sms' | 'push' | 'whatsapp';
  location: {
    city: string;
    state: string;
    country: string;
  };
  metadata: {
    source: 'website' | 'referral' | 'social' | 'ads';
    firstContactDate: Date | string;
    lastContactDate: Date | string;
    notes: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type CustomerSegment = ICustomer['segment'];
export type CustomerStatus = ICustomer['status'];

export interface CustomerFilters {
  search?: string;
  segment?: CustomerSegment;
  status?: CustomerStatus;
  minSpent?: number;
  maxSpent?: number;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface CustomerStats {
  total: number;
  active: number;
  inactive: number;
  churned: number;
  avgLifetimeValue: number;
  avgEngagement: number;
}
