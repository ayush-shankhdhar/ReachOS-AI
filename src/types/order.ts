export interface OrderItem {
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IOrder {
  _id: string;
  customerId: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentMethod: 'credit_card' | 'debit_card' | 'upi' | 'net_banking' | 'wallet';
  channel: 'website' | 'mobile_app' | 'in_store' | 'phone';
  orderDate: Date | string;
  deliveryDate: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type OrderStatus = IOrder['status'];
export type PaymentMethod = IOrder['paymentMethod'];

export interface OrderFilters {
  customerId?: string;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface RevenueMetrics {
  totalRevenue: number;
  avgOrderValue: number;
  totalOrders: number;
  growth: number;
  monthlyRevenue: { month: string; revenue: number }[];
}
