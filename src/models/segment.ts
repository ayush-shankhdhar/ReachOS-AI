import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISegmentRule {
  field: 'totalSpent' | 'totalOrders' | 'lastOrderDate' | 'location.city' | 'preferredChannel' | 'status' | 'createdAt';
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'ne';
  value: any;
}

export interface ISegmentDocument extends Document {
  name: string;
  description: string;
  rules: ISegmentRule[];
  query: Record<string, any>;
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

const SegmentRuleSchema = new Schema<ISegmentRule>(
  {
    field: { type: String, required: true },
    operator: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const SegmentSchema = new Schema<ISegmentDocument>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: '' },
    rules: [SegmentRuleSchema],
    query: { type: Schema.Types.Mixed, default: {} },
    count: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

SegmentSchema.index({ name: 1 }, { unique: true });

const Segment: Model<ISegmentDocument> =
  mongoose.models.Segment || mongoose.model<ISegmentDocument>('Segment', SegmentSchema);

export default Segment;
