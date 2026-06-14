'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, Send, CheckCircle, Eye, MousePointerClick,
  XCircle, Play, Pause, RefreshCw, Mail, MessageSquare,
  Bell, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import GlassCard from '@/components/shared/glass-card';
import PageHeader from '@/components/shared/page-header';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import { toast } from 'sonner';

interface ChannelStat {
  channel: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
}

interface SimEvent {
  id: string;
  type: string;
  channel: string;
  customerName: string;
  campaignName: string;
  timestamp: string;
}

export default function ChannelsPage() {
  const [stats, setStats] = useState<ChannelStat[]>([]);
  const [events, setEvents] = useState<SimEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [autoSimulate, setAutoSimulate] = useState(false);

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch('/api/channels');
      const json = await res.json();
      if (json.success) {
        setStats(json.data.stats);
        setEvents(json.data.events);
      }
    } catch {
      toast.error('Failed to load channel data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoSimulate) {
      interval = setInterval(async () => {
        await runSimulation(true);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [autoSimulate]);

  const runSimulation = async (silent = false) => {
    if (simulating) return;
    setSimulating(true);
    try {
      // Processes real async webhooks from the Mock Vendor queue
      const res = await fetch('/api/vendor/channel/process', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        if (!silent && json.processed > 0) toast.success(`Processed ${json.processed} webhooks`);
        fetchChannels();
      }
    } catch {
      if (!silent) toast.error('Worker failed');
    } finally {
      setSimulating(false);
    }
  };

  const channelIcons: Record<string, React.ElementType> = {
    email: Mail, sms: MessageSquare, push: Bell, whatsapp: Send,
  };

  const channelColors: Record<string, string> = {
    email: '#8b5cf6', sms: '#06b6d4', push: '#f59e0b', whatsapp: '#10b981',
  };

  const eventIcons: Record<string, React.ElementType> = {
    sent: Send, delivered: CheckCircle, opened: Eye, clicked: MousePointerClick, failed: XCircle,
  };

  const eventColors: Record<string, string> = {
    sent: 'text-xeno-cyan bg-xeno-cyan/10', delivered: 'text-xeno-green bg-xeno-green/10',
    opened: 'text-xeno-purple bg-xeno-purple/10', clicked: 'text-xeno-amber bg-xeno-amber/10',
    failed: 'text-xeno-red bg-xeno-red/10',
  };

  if (loading) return <LoadingSkeleton count={4} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Channel Simulation" description="Monitor and simulate message delivery across channels">
        <Button
          onClick={() => setAutoSimulate(!autoSimulate)}
          variant={autoSimulate ? 'default' : 'outline'}
          size="sm"
          className={autoSimulate ? 'gradient-purple text-white border-0' : 'border-white/10'}
        >
          {autoSimulate ? <><Pause className="w-4 h-4 mr-2" /> Stop Auto</> : <><Play className="w-4 h-4 mr-2" /> Auto Simulate</>}
        </Button>
        <Button
          onClick={() => runSimulation()}
          disabled={simulating}
          variant="outline"
          size="sm"
          className="border-white/10"
        >
          {simulating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Process Webhooks
        </Button>
      </PageHeader>

      {/* Channel Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((ch, i) => {
          const Icon = channelIcons[ch.channel] || Mail;
          const color = channelColors[ch.channel] || '#8b5cf6';
          const total = ch.sent || 1;
          const deliveryRate = Math.round((ch.delivered / total) * 100);
          const openRate = ch.delivered > 0 ? Math.round((ch.opened / ch.delivered) * 100) : 0;

          return (
            <motion.div
              key={ch.channel}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <h3 className="font-semibold capitalize">{ch.channel}</h3>
                  <p className="text-xs text-muted-foreground">{ch.sent} sent</p>
                </div>
              </div>

              <div className="space-y-3">
                <MetricBar label="Delivered" value={ch.delivered} total={total} color="#22c55e" />
                <MetricBar label="Read" value={(ch as any).read || 0} total={ch.delivered || 1} color="#ec4899" />
                <MetricBar label="Opened" value={ch.opened} total={ch.opened || 1} color="#7c3aed" />
                <MetricBar label="Clicked" value={ch.clicked} total={ch.opened || 1} color="#eab308" />
                <MetricBar label="Failed" value={ch.failed} total={total} color="#ef4444" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Live Event Log */}
      <GlassCard delay={0.3}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Live Event Log</h3>
            {autoSimulate && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-xeno-green animate-pulse" />
                <span className="text-xs text-xeno-green">Live</span>
              </div>
            )}
          </div>
          <Badge variant="secondary" className="bg-white/5 border-0 text-xs">
            {events.length} events
          </Badge>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
          <AnimatePresence initial={false}>
            {events.map((event, i) => {
              const Icon = eventIcons[event.type] || Send;
              const colorClass = eventColors[event.type] || 'text-muted-foreground bg-white/5';

              return (
                <motion.div
                  key={event.id + i}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${colorClass}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      <span className="font-medium">{event.customerName}</span>
                      <span className="text-muted-foreground"> — {event.type} via </span>
                      <span className="capitalize">{event.channel}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">{event.campaignName}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(event.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </GlassCard>
    </div>
  );
}

function MetricBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value} ({pct}%)</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}
