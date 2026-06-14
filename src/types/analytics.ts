export interface AnalyticsData {
  openRates: { date: string; rate: number }[];
  clickRates: { date: string; rate: number }[];
  conversionRates: { date: string; rate: number }[];
  campaignPerformance: {
    campaignId: string;
    name: string;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    revenue: number;
  }[];
}

export interface DashboardData {
  revenue: {
    total: number;
    growth: number;
    monthly: { month: string; revenue: number }[];
  };
  customers: {
    total: number;
    active: number;
    newThisMonth: number;
    growth: number;
  };
  campaigns: {
    total: number;
    active: number;
    avgOpenRate: number;
    avgClickRate: number;
  };
  aiInsights: string[];
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'campaign_launched' | 'customer_added' | 'order_placed' | 'campaign_completed';
  description: string;
  timestamp: Date | string;
}

export interface SegmentData {
  name: string;
  key: string;
  description: string;
  count: number;
  avgSpent: number;
  avgEngagement: number;
  trend: number;
  icon: string;
  color: string;
}

export interface ChannelStats {
  channel: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
}

export interface SimulationEvent {
  id: string;
  type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  channel: string;
  customerId: string;
  customerName: string;
  timestamp: Date | string;
  campaignName: string;
}
