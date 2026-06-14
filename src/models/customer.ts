import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomerDocument extends Document {
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
  lastOrderDate: Date;
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
    firstContactDate: Date;
    lastContactDate: Date;
    notes: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomerDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    avatar: { type: String, default: '' },
    segment: {
      type: String,
      enum: ['high_value', 'inactive', 'frequent_buyer', 'churn_risk', 'new'],
      default: 'new',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'churned'],
      default: 'active',
      index: true,
    },
    tags: [{ type: String, trim: true }],
    totalSpent: { type: Number, default: 0, index: true },
    totalOrders: { type: Number, default: 0 },
    lastOrderDate: { type: Date, index: true },
    lifetimeValue: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 0, min: 0, max: 100, index: true },
    preferredChannel: {
      type: String,
      enum: ['email', 'sms', 'push', 'whatsapp'],
      default: 'email',
    },
    location: {
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    metadata: {
      source: {
        type: String,
        enum: ['website', 'referral', 'social', 'ads'],
        default: 'website',
      },
      firstContactDate: { type: Date, default: Date.now },
      lastContactDate: { type: Date, default: Date.now },
      notes: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

CustomerSchema.index({ email: 1 }, { unique: true });
CustomerSchema.index({ name: 'text', email: 'text', company: 'text' });

const Customer: Model<ICustomerDocument> =
  mongoose.models.Customer || mongoose.model<ICustomerDocument>('Customer', CustomerSchema);

export default Customer;
