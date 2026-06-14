'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Eye, MousePointerClick, TrendingUp,
  ArrowUpRight, IndianRupee, Megaphone, CheckCircle2,
  Calendar, Layers, Zap, Radio, CircleAlert, DollarSign,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  Legend, Cell,
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/shared/glass-card';
import PageHeader from '@/components/shared/page-header';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import { toast } from 'sonner';

interface AnalyticsData {
  openRates: { date: string; rate: number }[];
  clickRates: { date: string; rate: number }[];
  conversionRates: { date: string; rate: number }[];
  campaignPerformance: {
    _id: string;
    name: string;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    revenue: number;
  }[];
  funnel: {
    sent: number;
    delivered: number;
    read: number;
    opened: number;
    clicked: number;
    converted: number;
    revenue: number;
  };
  channels: {
    channel: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    revenue: number;
  }[];
}

const chartTooltipStyle = {
  background: 'rgba(5,5,8,0.95)',
  border: '1px solid rgba(124,58,237,0.2)',
  borderRadius: '12px',
  color: '#f8fafc',
  backdropFilter: 'blur(20px)',
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics?period=${period}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      toast.error('Failed to load analytics records');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton count={4} />;
  if (!data) return null;

  // Combine rates into single chart data
  const combinedRates = data.openRates.map((o, i) => ({
    date: o.date,
    openRate: o.rate,
    clickRate: data.clickRates[i]?.rate || 0,
    conversionRate: data.conversionRates[i]?.rate || 0,
  }));

  const avgOpen = data.openRates.length > 0
    ? Math.round(data.openRates.reduce((s, d) => s + d.rate, 0) / data.openRates.length)
    : 0;
  const avgClick = data.clickRates.length > 0
    ? Math.round(data.clickRates.reduce((s, d) => s + d.rate, 0) / data.clickRates.length)
    : 0;
  const avgConversion = data.conversionRates.length > 0
    ? Math.round(data.conversionRates.reduce((s, d) => s + d.rate, 0) / data.conversionRates.length)
    : 0;

  // Funnel calculations
  const f = data.funnel;
  const funnelData = [
    { name: 'Sent', count: f.sent, pct: 100, color: '#7c3aed' },
    { name: 'Delivered', count: f.delivered, pct: f.sent > 0 ? Math.round((f.delivered / f.sent) * 100) : 0, color: '#06b6d4' },
    { name: 'Read', count: f.read, pct: f.delivered > 0 ? Math.round((f.read / f.delivered) * 100) : 0, color: '#ec4899' },
    { name: 'Opened', count: f.opened, pct: f.read > 0 ? Math.round((f.opened / f.read) * 100) : 0, color: '#eab308' },
    { name: 'Clicked', count: f.clicked, pct: f.opened > 0 ? Math.round((f.clicked / f.opened) * 100) : 0, color: '#f97316' },
    { name: 'Converted', count: f.converted, pct: f.clicked > 0 ? Math.round((f.converted / f.clicked) * 100) : 0, color: '#22c55e' },
  ];

  const channelColors = {
    email: '#7c3aed',
    sms: '#06b6d4',
    push: '#eab308',
    whatsapp: '#22c55e'
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Intelligence Analytics" description="Deep campaign funnel monitoring and channel ROI breakdown">
        <Select value={period} onValueChange={(v) => v && setPeriod(v)}>
          <SelectTrigger className="w-36 bg-[#0f0f16] border-white/5 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0a0a0f] border-white/5">
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Avg Open Rate', value: `${avgOpen}%`, icon: Eye, color: 'text-xeno-purple', bg: 'bg-xeno-purple/10' },
          { label: 'Avg Click Rate', value: `${avgClick}%`, icon: MousePointerClick, color: 'text-xeno-cyan', bg: 'bg-xeno-cyan/10' },
          { label: 'Conversion ROI', value: `${avgConversion}%`, icon: TrendingUp, color: 'text-xeno-green', bg: 'bg-xeno-green/10' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-5 border-white/5 bg-[#0a0a0f]/60"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-xl ${stat.bg} border border-white/5`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-black">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Funnel + Channels grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Funnel */}
        <GlassCard className="lg:col-span-1 bg-[#0a0a0f]/60 border-white/5" delay={0.1}>
          <div className="mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-xeno-purple" /> Dynamic Conversion Funnel
            </h3>
            <p className="text-[10px] text-muted-foreground">Cumulative performance aggregates</p>
          </div>

          <div className="space-y-3 pt-2">
            {funnelData.map((step) => (
              <div key={step.name} className="relative">
                <div className="flex justify-between items-center text-xs mb-1 relative z-10 px-2.5 py-1">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: step.color }} />
                    {step.name}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {step.count.toLocaleString()} ({step.pct}%)
                  </span>
                </div>
                <div className="h-6 rounded-lg bg-white/[0.01] border border-white/5 overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${step.pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full opacity-15"
                    style={{ backgroundColor: step.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Channel comparison */}
        <GlassCard className="lg:col-span-2 bg-[#0a0a0f]/60 border-white/5" delay={0.2}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Radio className="w-4 h-4 text-xeno-cyan" /> Channel Effectiveness comparison
              </h3>
              <p className="text-[10px] text-muted-foreground">Simulated outcomes split per delivery channel</p>
            </div>
            <Badge variant="outline" className="border-xeno-cyan/20 bg-xeno-cyan/5 text-xeno-cyan text-xs font-mono">
              ₹ Revenue
            </Badge>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.channels}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.06)" />
              <XAxis dataKey="channel" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => v.toUpperCase()} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: any) => [`₹${v.toLocaleString('en-IN')}`, 'Influenced Revenue']} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {data.channels.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={channelColors[entry.channel as keyof typeof channelColors] || '#7c3aed'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Engagement line chart */}
      <GlassCard delay={0.3} className="bg-[#0a0a0f]/60 border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-xeno-purple" /> Engagement Trends
            </h3>
            <p className="text-[10px] text-muted-foreground">Daily rate changes over period</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-2.5 h-2.5 rounded-full bg-xeno-purple" /> Open Rate
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-2.5 h-2.5 rounded-full bg-xeno-cyan" /> Click Rate
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-2.5 h-2.5 rounded-full bg-xeno-green" /> Conversion
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={combinedRates}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.06)" />
            <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: any) => `${v}%`} />
            <Line type="monotone" dataKey="openRate" stroke="#7c3aed" strokeWidth={2.5} dot={false}
              activeDot={{ r: 5, fill: '#7c3aed', stroke: '#fff', strokeWidth: 1.5 }} />
            <Line type="monotone" dataKey="clickRate" stroke="#06b6d4" strokeWidth={2.5} dot={false}
              activeDot={{ r: 5, fill: '#06b6d4', stroke: '#fff', strokeWidth: 1.5 }} />
            <Line type="monotone" dataKey="conversionRate" stroke="#22c55e" strokeWidth={2.5} dot={false}
              activeDot={{ r: 5, fill: '#22c55e', stroke: '#fff', strokeWidth: 1.5 }} />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Campaign Performance */}
      <GlassCard delay={0.4} className="bg-[#0a0a0f]/60 border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-xeno-purple" /> Campaign Attributed Revenue Leaders
            </h3>
            <p className="text-[10px] text-muted-foreground">Individual campaigns and engagement conversions</p>
          </div>
          <Badge variant="outline" className="border-xeno-purple/20 bg-xeno-purple/5 text-xeno-purple text-xs">
            Top Performers
          </Badge>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5 text-left">
                <th className="font-semibold text-muted-foreground pb-3">Campaign Target</th>
                <th className="font-semibold text-muted-foreground pb-3 text-right">Open Rate</th>
                <th className="font-semibold text-muted-foreground pb-3 text-right">Click Rate</th>
                <th className="font-semibold text-muted-foreground pb-3 text-right">Conversion</th>
                <th className="font-semibold text-muted-foreground pb-3 text-right">Revenue Influenced</th>
              </tr>
            </thead>
            <tbody>
              {data.campaignPerformance.map((cp, i) => (
                <tr key={cp._id} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                  <td className="py-3 font-medium flex items-center gap-2">
                    <Megaphone className="w-3.5 h-3.5 text-xeno-purple" />
                    {cp.name}
                  </td>
                  <td className="py-3 text-right">
                    <Badge className="bg-xeno-purple/10 text-xeno-purple border-0 font-mono text-[10px]">{cp.openRate}%</Badge>
                  </td>
                  <td className="py-3 text-right">
                    <Badge className="bg-xeno-cyan/10 text-xeno-cyan border-0 font-mono text-[10px]">{cp.clickRate}%</Badge>
                  </td>
                  <td className="py-3 text-right">
                    <Badge className="bg-xeno-green/10 text-xeno-green border-0 font-mono text-[10px]">{cp.conversionRate}%</Badge>
                  </td>
                  <td className="py-3 text-right font-semibold text-foreground">
                    ₹{cp.revenue.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
