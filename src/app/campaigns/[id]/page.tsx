'use client';

import React, { useEffect, useState, use } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, MousePointerClick, Send, Users, IndianRupee, Mail, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import GlassCard from '@/components/shared/glass-card';
import PageHeader from '@/components/shared/page-header';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Link from 'next/link';
import { toast } from 'sonner';

interface CampaignDetail {
  _id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  goal: string;
  targetSegment: string;
  audienceSize: number;
  channel: string;
  message: { subject: string; body: string; template: string };
  schedule: { startDate: string; endDate: string | null };
  metrics: { sent: number; delivered: number; opened: number; clicked: number; converted: number; failed: number; revenue: number };
  budget: number;
  aiGenerated: boolean;
  createdAt: string;
  communicationStats: Record<string, number>;
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      const json = await res.json();
      if (json.success) setCampaign(json.data);
    } catch {
      toast.error('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton count={2} />;
  if (!campaign) return <div className="text-center py-20 text-muted-foreground">Campaign not found</div>;

  const { metrics } = campaign;
  const openRate = metrics.delivered > 0 ? Math.round((metrics.opened / metrics.delivered) * 100) : 0;
  const clickRate = metrics.opened > 0 ? Math.round((metrics.clicked / metrics.opened) * 100) : 0;
  const deliveryRate = metrics.sent > 0 ? Math.round((metrics.delivered / metrics.sent) * 100) : 0;
  const conversionRate = metrics.clicked > 0 ? Math.round((metrics.converted / metrics.clicked) * 100) : 0;

  const pieData = [
    { name: 'Delivered', value: metrics.delivered - metrics.opened, color: '#06b6d4' },
    { name: 'Opened', value: metrics.opened - metrics.clicked, color: '#8b5cf6' },
    { name: 'Clicked', value: metrics.clicked, color: '#10b981' },
    { name: 'Failed', value: metrics.failed, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500/10 text-gray-400',
    active: 'bg-xeno-green/10 text-xeno-green',
    completed: 'bg-xeno-purple/10 text-xeno-purple',
    paused: 'bg-xeno-amber/10 text-xeno-amber',
    cancelled: 'bg-xeno-red/10 text-xeno-red',
  };

  return (
    <div className="space-y-6">
      <PageHeader title={campaign.name} description={campaign.description}>
        <Link href="/campaigns">
          <Button variant="outline" size="sm" className="border-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </Link>
        <Badge className={`${statusColors[campaign.status]} border-0`}>{campaign.status}</Badge>
      </PageHeader>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Sent', value: metrics.sent, icon: Send, color: 'text-xeno-cyan' },
          { label: 'Delivered', value: `${deliveryRate}%`, icon: CheckCircle, color: 'text-xeno-green' },
          { label: 'Opened', value: `${openRate}%`, icon: Eye, color: 'text-xeno-purple' },
          { label: 'Clicked', value: `${clickRate}%`, icon: MousePointerClick, color: 'text-xeno-amber' },
          { label: 'Converted', value: metrics.converted, icon: Users, color: 'text-xeno-pink' },
          { label: 'Revenue', value: `₹${metrics.revenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-xeno-green' },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4 text-center"
          >
            <m.icon className={`w-5 h-5 ${m.color} mx-auto mb-2`} />
            <p className="text-lg font-bold">{m.value}</p>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Chart */}
        <GlassCard delay={0.2}>
          <h3 className="text-lg font-semibold mb-4">Delivery Funnel</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={100} innerRadius={60} paddingAngle={4}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
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
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Campaign Info */}
        <GlassCard delay={0.3}>
          <h3 className="text-lg font-semibold mb-4">Campaign Details</h3>
          <div className="space-y-4">
            <InfoRow label="Goal" value={campaign.goal} />
            <InfoRow label="Channel" value={campaign.channel} />
            <InfoRow label="Target Segment" value={(campaign as any).targetSegmentName || campaign.targetSegment} />
            <InfoRow label="Audience Size" value={campaign.audienceSize.toLocaleString()} />
            <InfoRow label="Budget" value={`₹${campaign.budget.toLocaleString('en-IN')}`} />
            <InfoRow label="Start Date" value={new Date(campaign.schedule.startDate).toLocaleDateString('en-IN')} />
            <InfoRow label="AI Generated" value={campaign.aiGenerated ? 'Yes' : 'No'} />
          </div>
        </GlassCard>
      </div>

      {/* Message Preview */}
      <GlassCard delay={0.4}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-xeno-purple" /> Message Preview
        </h3>
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <p className="text-sm font-semibold mb-2">{campaign.message.subject}</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{campaign.message.body}</p>
        </div>
      </GlassCard>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium capitalize">{value}</span>
    </div>
  );
}
