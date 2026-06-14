import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWebhookEventDocument extends Document {
  eventId: string;
  communicationId: string;
  status: string;
  processedAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEventDocument>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    communicationId: { type: String, required: true, index: true },
    status: { type: String, required: true },
    processedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const WebhookEvent: Model<IWebhookEventDocument> =
  mongoose.models.WebhookEvent ||
  mongoose.model<IWebhookEventDocument>('WebhookEvent', WebhookEventSchema);

export default WebhookEvent;
