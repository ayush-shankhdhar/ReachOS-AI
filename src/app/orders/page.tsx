'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart, IndianRupee, Package, TrendingUp,
  CreditCard, Truck, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatCard from '@/components/shared/stat-card';
import GlassCard from '@/components/shared/glass-card';
import PageHeader from '@/components/shared/page-header';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import { toast } from 'sonner';

interface OrderData {
  _id: string;
  orderNumber: string;
  customerId: { name: string; email: string; avatar: string } | null;
  items: { name: string; category: string; quantity: number; totalPrice: number }[];
  total: number;
  status: string;
  paymentMethod: string;
  channel: string;
  orderDate: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [metrics, setMetrics] = useState({ totalRevenue: 0, avgOrderValue: 0, totalOrders: 0 });
  const [trends, setTrends] = useState<{ month: string; revenue: number; orders: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '30');

      const res = await fetch(`/api/orders?${params}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
        setMetrics(json.metrics);
        setTrends(json.trends);
      }
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const statusIcons: Record<string, React.ElementType> = {
    pending: Clock, confirmed: CheckCircle, shipped: Truck,
    delivered: CheckCircle, cancelled: XCircle, refunded: XCircle,
  };

  const statusColors: Record<string, string> = {
    pending: 'text-xeno-amber bg-xeno-amber/10',
    confirmed: 'text-xeno-cyan bg-xeno-cyan/10',
    shipped: 'text-xeno-purple bg-xeno-purple/10',
    delivered: 'text-xeno-green bg-xeno-green/10',
    cancelled: 'text-xeno-red bg-xeno-red/10',
    refunded: 'text-gray-400 bg-gray-500/10',
  };

  const COLORS = ['#7c3aed', '#06b6d4', '#22c55e', '#eab308', '#ec4899', '#ef4444'];

  // Channel distribution for pie chart
  const channelData = orders.reduce((acc, o) => {
    const existing = acc.find((c) => c.name === o.channel);
    if (existing) existing.value++;
    else acc.push({ name: o.channel, value: 1 });
    return acc;
  }, [] as { name: string; value: number }[]);

  if (loading) return <LoadingSkeleton count={4} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Order history and revenue analytics">
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#111118] border-white/10">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Revenue" value={metrics.totalRevenue} prefix="₹" icon={IndianRupee} color="green" delay={0} />
        <StatCard title="Total Orders" value={metrics.totalOrders} icon={Package} color="purple" delay={0.1} />
        <StatCard title="Avg Order Value" value={Math.round(metrics.avgOrderValue)} prefix="₹" icon={TrendingUp} color="cyan" delay={0.2} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2" delay={0.2}>
          <h3 className="text-lg font-semibold mb-1">Revenue Trend</h3>
          <p className="text-sm text-muted-foreground mb-6">Monthly revenue and order volume</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.06)" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(17,17,24,0.95)', border: '1px solid rgba(124,58,237,0.2)',
                  borderRadius: '12px', color: '#f8fafc',
                }}
                formatter={(value: any, name: any) => [
                  name === 'revenue' ? `₹${value.toLocaleString('en-IN')}` : value,
                  name === 'revenue' ? 'Revenue' : 'Orders'
                ]}
              />
              <Bar dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard delay={0.3}>
          <h3 className="text-lg font-semibold mb-1">Channels</h3>
          <p className="text-sm text-muted-foreground mb-6">Order distribution</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={channelData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={80} innerRadius={50} paddingAngle={4}>
                {channelData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(17,17,24,0.95)', border: '1px solid rgba(139,92,246,0.2)',
                  borderRadius: '12px', color: '#f8fafc',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {channelData.map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {c.name.replace('_', ' ')}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Order Table */}
      <GlassCard delay={0.4}>
        <h3 className="text-lg font-semibold mb-6">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Order</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4 hidden md:table-cell">Customer</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4 hidden lg:table-cell">Items</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-3 pr-4">Amount</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3 hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => {
                const StatusIcon = statusIcons[order.status] || Clock;
                return (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <span className="text-sm font-mono text-xeno-purple">{order.orderNumber}</span>
                    </td>
                    <td className="py-3 pr-4 hidden md:table-cell">
                      <span className="text-sm">{order.customerId?.name || 'N/A'}</span>
                    </td>
                    <td className="py-3 pr-4 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">{order.items.length} items</span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className="text-sm font-semibold">₹{order.total.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge className={`${statusColors[order.status]} border-0 text-xs gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3 hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.orderDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
