import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICampaignDocument extends Document {
  name: string;
  description: string;
  type: 'email' | 'sms' | 'push' | 'whatsapp' | 'multi_channel';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  goal: string;
  targetSegment: string;
  audienceSize: number;
  channel: 'email' | 'sms' | 'push' | 'whatsapp';
  message: {
    subject: string;
    body: string;
    template: string;
  };
  schedule: {
    startDate: Date;
    endDate: Date | null;
    timezone: string;
  };
  metrics: {
    sent: number;
    delivered: number;
    read: number;
    opened: number;
    clicked: number;
    converted: number;
    failed: number;
    revenue: number;
  };
  budget: number;
  aiGenerated: boolean;
  aiPrompt: string | null;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaignDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: ['email', 'sms', 'push', 'whatsapp', 'multi_channel'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    goal: { type: String, default: '' },
    targetSegment: { type: String, required: true },
    audienceSize: { type: Number, default: 0 },
    channel: {
      type: String,
      enum: ['email', 'sms', 'push', 'whatsapp'],
      required: true,
    },
    message: {
      subject: { type: String, default: '' },
      body: { type: String, default: '' },
      template: { type: String, default: 'default' },
    },
    schedule: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, default: null },
      timezone: { type: String, default: 'Asia/Kolkata' },
    },
    metrics: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      converted: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
    },
    budget: { type: Number, default: 0 },
    aiGenerated: { type: Boolean, default: false, index: true },
    aiPrompt: { type: String, default: null },
    tags: [{ type: String, trim: true }],
    createdBy: { type: String, default: 'system' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

CampaignSchema.index({ createdAt: -1 });

const Campaign: Model<ICampaignDocument> =
  mongoose.models.Campaign || mongoose.model<ICampaignDocument>('Campaign', CampaignSchema);

export default Campaign;
