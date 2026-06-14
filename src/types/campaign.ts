export interface CampaignMessage {
  subject: string;
  body: string;
  template: string;
}

export interface CampaignSchedule {
  startDate: Date | string;
  endDate: Date | string | null;
  timezone: string;
}

export interface CampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  failed: number;
  revenue: number;
}

export interface ICampaign {
  _id: string;
  name: string;
  description: string;
  type: 'email' | 'sms' | 'push' | 'whatsapp' | 'multi_channel';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  goal: string;
  targetSegment: string;
  audienceSize: number;
  channel: 'email' | 'sms' | 'push' | 'whatsapp';
  message: CampaignMessage;
  schedule: CampaignSchedule;
  metrics: CampaignMetrics;
  budget: number;
  aiGenerated: boolean;
  aiPrompt: string | null;
  tags: string[];
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type CampaignStatus = ICampaign['status'];
export type CampaignType = ICampaign['type'];
export type CampaignChannel = ICampaign['channel'];

export interface CampaignFilters {
  status?: CampaignStatus;
  type?: CampaignType;
  page?: number;
  limit?: number;
}
