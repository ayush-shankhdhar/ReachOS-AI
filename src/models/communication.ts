import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommunicationDocument extends Document {
  campaignId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  channel: 'email' | 'sms' | 'push' | 'whatsapp';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'opened' | 'clicked' | 'failed' | 'bounced';
  message: {
    subject: string;
    body: string;
  };
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  openedAt: Date | null;
  clickedAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  metadata: {
    deviceType: string;
    browser: string;
    location: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CommunicationSchema = new Schema<ICommunicationDocument>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['email', 'sms', 'push', 'whatsapp'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'read', 'opened', 'clicked', 'failed', 'bounced'],
      default: 'pending',
      index: true,
    },
    message: {
      subject: { type: String, default: '' },
      body: { type: String, default: '' },
    },
    sentAt: { type: Date, default: null, index: true },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
    openedAt: { type: Date, default: null },
    clickedAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    failureReason: { type: String, default: null },
    metadata: {
      deviceType: { type: String, default: 'desktop' },
      browser: { type: String, default: 'chrome' },
      location: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

CommunicationSchema.index({ campaignId: 1, status: 1 });

const Communication: Model<ICommunicationDocument> =
  mongoose.models.Communication ||
  mongoose.model<ICommunicationDocument>('Communication', CommunicationSchema);

export default Communication;
