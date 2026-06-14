'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Megaphone, Plus, Eye, MousePointerClick, Users,
  Mail, MessageSquare, Bell, Send, Calendar,
  IndianRupee, ArrowUpRight, Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import GlassCard from '@/components/shared/glass-card';
import PageHeader from '@/components/shared/page-header';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import { ICampaign } from '@/types/campaign';
import { toast } from 'sonner';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<ICampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter]);

  const fetchCampaigns = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/campaigns?${params}`);
      const json = await res.json();
      if (json.success) setCampaigns(json.data);
    } catch {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const launchCampaign = async (id: string) => {
    try {
      toast.loading('Launching campaign...');
      const res = await fetch(`/api/campaigns/${id}/launch`, { method: 'POST' });
      const json = await res.json();
      toast.dismiss();
      if (json.success) {
        toast.success(json.message);
        fetchCampaigns();
      } else {
        toast.error(json.message);
      }
    } catch {
      toast.dismiss();
      toast.error('Launch failed');
    }
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    scheduled: 'bg-xeno-amber/10 text-xeno-amber border-xeno-amber/20',
    active: 'bg-xeno-green/10 text-xeno-green border-xeno-green/20',
    paused: 'bg-xeno-amber/10 text-xeno-amber border-xeno-amber/20',
    completed: 'bg-xeno-purple/10 text-xeno-purple border-xeno-purple/20',
    cancelled: 'bg-xeno-red/10 text-xeno-red border-xeno-red/20',
  };

  const channelIcons: Record<string, React.ElementType> = {
    email: Mail, sms: MessageSquare, push: Bell, whatsapp: Send,
  };

  if (loading) return <LoadingSkeleton count={4} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Campaigns" description={`${campaigns.length} total campaigns`}>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#111118] border-white/10">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
        <Link href="/campaigns/create">
          <Button className="gradient-purple text-white border-0">
            <Plus className="w-4 h-4 mr-2" /> Create Campaign
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {campaigns.map((campaign, i) => {
          const ChannelIcon = channelIcons[campaign.channel] || Mail;
          const openRate = campaign.metrics.delivered > 0
            ? Math.round((campaign.metrics.opened / campaign.metrics.delivered) * 100)
            : 0;
          const clickRate = campaign.metrics.opened > 0
            ? Math.round((campaign.metrics.clicked / campaign.metrics.opened) * 100)
            : 0;

          return (
            <motion.div
              key={campaign._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="glass-card-hover p-5 h-full flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-xeno-purple/10 border border-xeno-purple/20">
                      <ChannelIcon className="w-4 h-4 text-xeno-purple" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{campaign.name}</h3>
                      <p className="text-xs text-muted-foreground">{campaign.channel} • {(campaign as any).targetSegmentName || campaign.targetSegment}</p>
                    </div>
                  </div>
                  <Badge className={`${statusColors[campaign.status]} border text-[10px]`}>
                    {campaign.status}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{campaign.description}</p>

                {campaign.metrics.sent > 0 ? (
                  <div className="space-y-3 flex-1">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                        <p className="text-xs font-semibold">{campaign.metrics.sent.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">Sent</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                        <p className="text-xs font-semibold">{openRate}%</p>
                        <p className="text-[10px] text-muted-foreground">Open Rate</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                        <p className="text-xs font-semibold">{clickRate}%</p>
                        <p className="text-[10px] text-muted-foreground">Click Rate</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Delivery</span>
                        <span>{Math.round((campaign.metrics.delivered / campaign.metrics.sent) * 100)}%</span>
                      </div>
                      <Progress
                        value={campaign.metrics.sent > 0 ? (campaign.metrics.delivered / campaign.metrics.sent) * 100 : 0}
                        className="h-1.5"
                      />
                    </div>
                    {campaign.metrics.revenue > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <IndianRupee className="w-3 h-3 text-xeno-green" />
                        <span className="text-xeno-green font-semibold">₹{campaign.metrics.revenue.toLocaleString('en-IN')}</span>
                        <span className="text-muted-foreground">revenue</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                    No data yet
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
                  <Link href={`/campaigns/${campaign._id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full border-white/10 hover:bg-white/5 text-xs">
                      <Eye className="w-3 h-3 mr-1" /> View
                    </Button>
                  </Link>
                  {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                    <Button
                      size="sm"
                      onClick={() => launchCampaign(campaign._id)}
                      className="flex-1 gradient-purple text-white border-0 text-xs"
                    >
                      <Rocket className="w-3 h-3 mr-1" /> Launch
                    </Button>
                  )}
                </div>

                {campaign.aiGenerated && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-xeno-cyan">
                    <Megaphone className="w-3 h-3" /> AI Generated
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
