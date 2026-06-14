import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVendorJobDocument extends Document {
  communicationId: string;
  campaignId: string;
  callbackUrl: string;
  status: 'pending' | 'delivered' | 'read' | 'opened' | 'clicked' | 'failed';
  nextActionAt: Date;
  retries: number;
  createdAt: Date;
  updatedAt: Date;
}

const VendorJobSchema = new Schema<IVendorJobDocument>(
  {
    communicationId: { type: String, required: true, index: true },
    campaignId: { type: String, required: true, index: true },
    callbackUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'delivered', 'read', 'opened', 'clicked', 'failed'],
      default: 'pending',
      index: true,
    },
    nextActionAt: { type: Date, default: Date.now, index: true },
    retries: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const VendorJob: Model<IVendorJobDocument> =
  mongoose.models.VendorJob ||
  mongoose.model<IVendorJobDocument>('VendorJob', VendorJobSchema);

export default VendorJob;
