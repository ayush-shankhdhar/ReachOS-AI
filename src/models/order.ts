import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItemDocument {
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IOrderDocument extends Document {
  customerId: mongoose.Types.ObjectId;
  orderNumber: string;
  items: IOrderItemDocument[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentMethod: 'credit_card' | 'debit_card' | 'upi' | 'net_banking' | 'wallet';
  channel: 'website' | 'mobile_app' | 'in_store' | 'phone';
  orderDate: Date;
  deliveryDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItemDocument>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrderDocument>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0, index: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet'],
      required: true,
    },
    channel: {
      type: String,
      enum: ['website', 'mobile_app', 'in_store', 'phone'],
      required: true,
    },
    orderDate: { type: Date, required: true, index: true },
    deliveryDate: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ orderDate: -1 });

const Order: Model<IOrderDocument> =
  mongoose.models.Order || mongoose.model<IOrderDocument>('Order', OrderSchema);

export default Order;
