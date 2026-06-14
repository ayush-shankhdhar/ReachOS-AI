'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Megaphone, ArrowLeft, Save, Sparkles, HelpCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GlassCard from '@/components/shared/glass-card';
import PageHeader from '@/components/shared/page-header';
import { campaignSchema, CampaignFormData } from '@/lib/validations';
import { toast } from 'sonner';
import Link from 'next/link';

interface SegmentOption {
  key: string;
  name: string;
  count: number;
  isPreset: boolean;
}

export default function CreateCampaignPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [segments, setSegments] = useState<SegmentOption[]>([]);
  const [loadingSegments, setLoadingSegments] = useState(true);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      type: 'email',
      channel: 'email',
      schedule: { startDate: new Date().toISOString().split('T')[0], timezone: 'Asia/Kolkata' },
      message: { template: 'default' },
      budget: 0,
      tags: [],
    },
  });

  useEffect(() => {
    fetch('/api/segments')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setSegments(json.data);
        }
      })
      .catch(() => toast.error('Failed to load segments list'))
      .finally(() => setLoadingSegments(false));
  }, []);

  const onSubmit = async (data: CampaignFormData) => {
    setSaving(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          schedule: {
            ...data.schedule,
            startDate: new Date(data.schedule.startDate).toISOString(),
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Campaign created successfully!');
        router.push('/campaigns');
      } else {
        toast.error(json.message || 'Failed to create campaign');
      }
    } catch {
      toast.error('Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  const selectedChannel = watch('channel');

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader title="Create Campaign" description="Configure dynamic target criteria and templates">
        <Link href="/campaigns">
          <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 cursor-pointer">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </Link>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <GlassCard>
          <h3 className="text-sm font-bold tracking-tight mb-4 flex items-center gap-2 text-xeno-purple">
            <Megaphone className="w-4 h-4" /> Campaign Details
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Campaign Name</Label>
              <Input {...register('name')} placeholder="e.g. Summer VIP Offer" className="mt-1 bg-white/5 border-white/10 focus:border-purple-500/30 text-xs" />
              {errors.name && <p className="text-[10px] text-xeno-red mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Goal / Description</Label>
              <Textarea {...register('description')} placeholder="e.g. Target inactive shoppers who spent > 5k to re-engage..." className="mt-1 bg-white/5 border-white/10 focus:border-purple-500/30 text-xs" rows={2} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Strategic Metric Goal</Label>
              <Input {...register('goal')} placeholder="e.g. Increase repeat purchase conversions by 15%" className="mt-1 bg-white/5 border-white/10 focus:border-purple-500/30 text-xs" />
              {errors.goal && <p className="text-[10px] text-xeno-red mt-1">{errors.goal.message}</p>}
            </div>
          </div>
        </GlassCard>

        {/* Channel & Audience */}
        <GlassCard delay={0.1}>
          <h3 className="text-sm font-bold tracking-tight mb-4 text-xeno-purple">Target Audience & Delivery</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Campaign Type</Label>
              <Select defaultValue="email" onValueChange={(v) => v && setValue('type', v as any)}>
                <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0f0f15] border-white/5 text-xs">
                  <SelectItem value="email">Email Campaign</SelectItem>
                  <SelectItem value="sms">SMS Marketing</SelectItem>
                  <SelectItem value="push">Push Notification</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp Interactive</SelectItem>
                  <SelectItem value="multi_channel">Multi-Channel Flow</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Primary Delivery Channel</Label>
              <Select defaultValue="email" onValueChange={(v) => v && setValue('channel', v as any)}>
                <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0f0f15] border-white/5 text-xs">
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                Target Segment {loadingSegments && <Loader2 className="w-3 h-3 animate-spin inline" />}
              </Label>
              <Select onValueChange={(v) => v && setValue('targetSegment', v as any)}>
                <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-xs">
                  <SelectValue placeholder="Choose segment criteria" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f0f15] border-white/5 text-xs">
                  {segments.map((seg) => (
                    <SelectItem key={seg.key} value={seg.key}>
                      {seg.name} ({seg.count} matches)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.targetSegment && <p className="text-[10px] text-xeno-red mt-1">{errors.targetSegment.message}</p>}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Allocated Budget (₹)</Label>
              <Input type="number" {...register('budget', { valueAsNumber: true })} placeholder="0" className="mt-1 bg-white/5 border-white/10 focus:border-purple-500/30 text-xs" />
            </div>
          </div>
        </GlassCard>

        {/* Message */}
        <GlassCard delay={0.2}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold tracking-tight text-xeno-purple">Template Editor</h3>
            <span className="text-[9px] text-muted-foreground flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> Support <code>{"{{name}}"}</code>, <code>{"{{totalSpent}}"}</code> variables
            </span>
          </div>
          <div className="space-y-4">
            {selectedChannel === 'email' && (
              <div>
                <Label className="text-xs text-muted-foreground">Subject Line</Label>
                <Input {...register('message.subject')} placeholder="e.g. Hey {{name}}, we have a special gift for you!" className="mt-1 bg-white/5 border-white/10 focus:border-purple-500/30 text-xs" />
                {errors.message?.subject && <p className="text-[10px] text-xeno-red mt-1">{errors.message.subject.message}</p>}
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Body Content</Label>
              <Textarea
                {...register('message.body')}
                placeholder={`e.g. Hi {{name}},\n\nTake advantage of this special WhatsApp deal! You have spent {{totalSpent}} with us, so here is a flat 20% discount.`}
                className="mt-1 bg-white/5 border-white/10 focus:border-purple-500/30 text-xs leading-relaxed"
                rows={5}
              />
              {errors.message?.body && <p className="text-[10px] text-xeno-red mt-1">{errors.message.body.message}</p>}
            </div>
          </div>
        </GlassCard>

        {/* Schedule */}
        <GlassCard delay={0.3}>
          <h3 className="text-sm font-bold tracking-tight mb-4 text-xeno-purple">Launch Schedule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Start Date</Label>
              <Input type="date" {...register('schedule.startDate')} className="mt-1 bg-white/5 border-white/10 focus:border-purple-500/30 text-xs text-muted-foreground" />
              {errors.schedule?.startDate && <p className="text-[10px] text-xeno-red mt-1">{errors.schedule.startDate.message}</p>}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">End Date (optional)</Label>
              <Input type="date" {...register('schedule.endDate')} className="mt-1 bg-white/5 border-white/10 focus:border-purple-500/30 text-xs text-muted-foreground" />
            </div>
          </div>
        </GlassCard>

        {/* Submit */}
        <Button
          type="submit"
          disabled={saving}
          className="w-full gradient-purple text-white border-0 py-6 text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save & Schedule Campaign</>
          )}
        </Button>
      </form>
    </div>
  );
}
