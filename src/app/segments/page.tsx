'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Moon, ShoppingBag, AlertTriangle, Sparkles,
  Users, IndianRupee, TrendingUp, Plus, Trash2,
  PieChart, Eye, Search, Save, Bot, Loader2,
  Calendar, Check, Filter,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GlassCard from '@/components/shared/glass-card';
import PageHeader from '@/components/shared/page-header';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import { toast } from 'sonner';

interface SegmentRule {
  field: 'totalSpent' | 'totalOrders' | 'lastOrderDate' | 'location.city' | 'preferredChannel' | 'status';
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'ne';
  value: any;
}

interface SegmentInfo {
  _id?: string;
  name: string;
  key: string;
  description: string;
  icon: string;
  color: string;
  count: number;
  avgSpent: number;
  avgEngagement: number;
  totalRevenue: number;
  trend: number;
  isPreset: boolean;
  rules?: SegmentRule[];
  customers: Array<{ _id: string; name: string; email: string; totalSpent: number; engagementScore: number; status: string }>;
}

const FIELD_OPTIONS = [
  { value: 'totalSpent', label: 'Total Spent (₹)' },
  { value: 'totalOrders', label: 'Total Orders' },
  { value: 'lastOrderDate', label: 'Days Since Last Order' },
  { value: 'location.city', label: 'City' },
  { value: 'preferredChannel', label: 'Preferred Channel' },
  { value: 'status', label: 'Status' },
];

const OPERATOR_OPTIONS: Record<string, { value: string; label: string }[]> = {
  totalSpent: [
    { value: 'gt', label: 'Greater Than (>)' },
    { value: 'lt', label: 'Less Than (<)' },
    { value: 'gte', label: 'Greater Than or Equal (>=)' },
    { value: 'lte', label: 'Less Than or Equal (<=)' },
    { value: 'eq', label: 'Equals (=)' },
  ],
  totalOrders: [
    { value: 'gt', label: 'Greater Than (>)' },
    { value: 'lt', label: 'Less Than (<)' },
    { value: 'gte', label: 'Greater Than or Equal (>=)' },
    { value: 'lte', label: 'Less Than or Equal (<=)' },
    { value: 'eq', label: 'Equals (=)' },
  ],
  lastOrderDate: [
    { value: 'gt', label: 'Older Than (Days)' },
    { value: 'lt', label: 'Within (Days)' },
    { value: 'eq', label: 'Exactly (Days)' },
  ],
  'location.city': [
    { value: 'eq', label: 'Is' },
    { value: 'ne', label: 'Is Not' },
    { value: 'contains', label: 'Contains' },
  ],
  preferredChannel: [
    { value: 'eq', label: 'Is' },
    { value: 'ne', label: 'Is Not' },
  ],
  status: [
    { value: 'eq', label: 'Is' },
    { value: 'ne', label: 'Is Not' },
  ],
};

const CHANNEL_OPTIONS = ['email', 'sms', 'push', 'whatsapp'];
const STATUS_OPTIONS = ['active', 'inactive', 'churned'];

const iconMap: Record<string, React.ElementType> = {
  Crown, Moon, ShoppingBag, AlertTriangle, Sparkles, PieChart,
};

export default function SegmentsPage() {
  const [segments, setSegments] = useState<SegmentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  // Segment Builder state
  const [mode, setMode] = useState<'visual' | 'ai'>('visual');
  const [segmentName, setSegmentName] = useState('');
  const [segmentDesc, setSegmentDesc] = useState('');
  const [rules, setRules] = useState<SegmentRule[]>([
    { field: 'totalSpent', operator: 'gt', value: '5000' }
  ]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isCompilingAI, setIsCompilingAI] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewCustomers, setPreviewCustomers] = useState<any[]>([]);
  const [isRefreshingPreview, setIsRefreshingPreview] = useState(false);
  const [isSavingSegment, setIsSavingSegment] = useState(false);

  const fetchSegments = useCallback(async () => {
    try {
      const res = await fetch('/api/segments');
      const json = await res.json();
      if (json.success) {
        setSegments(json.data);
        if (json.data.length > 0 && !activeSegment) {
          setActiveSegment(json.data[0].key);
        }
      }
    } catch {
      toast.error('Failed to load segments');
    } finally {
      setLoading(false);
    }
  }, [activeSegment]);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  const updatePreview = useCallback(async (currentRules: SegmentRule[]) => {
    setIsRefreshingPreview(true);
    try {
      const res = await fetch('/api/segments/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: currentRules }),
      });
      const json = await res.json();
      if (json.success) {
        setPreviewCount(json.data.count);
        setPreviewCustomers(json.data.preview);
      }
    } catch {
      console.warn('Failed to retrieve live counts');
    } finally {
      setIsRefreshingPreview(false);
    }
  }, []);

  // Debounced/Triggered preview on rule updates
  useEffect(() => {
    const timer = setTimeout(() => {
      if (rules.length > 0) {
        updatePreview(rules);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [rules, updatePreview]);

  const addRule = () => {
    setRules([...rules, { field: 'totalSpent', operator: 'gt', value: '0' }]);
  };

  const removeRule = (idx: number) => {
    const nextRules = rules.filter((_, i) => i !== idx);
    setRules(nextRules);
  };

  const updateRule = (idx: number, updates: Partial<SegmentRule>) => {
    const nextRules = rules.map((r, i) => {
      if (i === idx) {
        const field = updates.field || r.field;
        // reset operator if field changes
        const operator = updates.field ? OPERATOR_OPTIONS[field][0].value as any : updates.operator || r.operator;
        const value = updates.field ? '' : updates.value !== undefined ? updates.value : r.value;
        return { field, operator, value };
      }
      return r;
    });
    setRules(nextRules);
  };

  const handleAICompile = async () => {
    if (!aiPrompt.trim() || isCompilingAI) return;
    setIsCompilingAI(true);
    try {
      const res = await fetch('/api/segments/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.rules)) {
        setRules(json.data.rules);
        setMode('visual');
        toast.success('AI compiled segment parameters successfully!');
      } else {
        toast.error(json.message || 'AI Segment Generation failed');
      }
    } catch {
      toast.error('Could not connect to Gemini Segment service');
    } finally {
      setIsCompilingAI(false);
    }
  };

  const handleSaveSegment = async () => {
    if (!segmentName.trim() || isSavingSegment) {
      toast.error('Segment name is required');
      return;
    }
    setIsSavingSegment(true);
    try {
      const res = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: segmentName,
          description: segmentDesc || 'Custom Rule Segment',
          rules,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Segment "${segmentName}" saved!`);
        setSegmentName('');
        setSegmentDesc('');
        fetchSegments();
      } else {
        toast.error(json.message || 'Failed to save segment');
      }
    } catch {
      toast.error('Segment save request rejected');
    } finally {
      setIsSavingSegment(false);
    }
  };

  const active = segments.find((s) => s.key === activeSegment);

  return (
    <div className="space-y-6">
      <PageHeader title="Customer Segmentation" description="Carve out dynamic target groups using rules or AI" />

      {/* Segment Presets Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? (
          <div className="col-span-full">
            <LoadingSkeleton count={1} />
          </div>
        ) : (
          segments.map((seg, i) => {
            const Icon = iconMap[seg.icon] || PieChart;
            const isActive = seg.key === activeSegment;

            return (
              <motion.div
                key={seg.key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setActiveSegment(seg.key)}
                className={`glass-card p-4 cursor-pointer transition-all duration-200 border-white/5 relative overflow-hidden ${
                  isActive
                    ? 'border-2 border-purple-500/30 bg-purple-950/5 shadow-lg shadow-purple-950/10'
                    : 'hover:border-white/10 hover:bg-white/[0.01]'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 w-12 h-12 bg-xeno-purple/10 rounded-full blur-xl" />
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="p-2 rounded-xl shrink-0"
                    style={{ backgroundColor: `${seg.color || '#7c3aed'}15`, border: `1px solid ${seg.color || '#7c3aed'}25` }}
                  >
                    <Icon className="w-4 h-4 text-xeno-purple" style={{ color: seg.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{seg.name}</p>
                    <p className="text-[9px] text-muted-foreground truncate">{seg.description}</p>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xl font-black text-xeno-purple" style={{ color: seg.color }}>{seg.count}</p>
                    <p className="text-[9px] text-muted-foreground">shoppers</p>
                  </div>
                  {seg.isPreset ? (
                    <Badge variant="secondary" className="text-[8px] bg-white/5 text-muted-foreground border-0 font-mono">Preset</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[8px] bg-xeno-purple/10 text-xeno-purple border-0 font-mono">Custom</Badge>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Segment details */}
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Stats */}
            <GlassCard className="relative overflow-hidden bg-[#07070b]/60">
              <div className="absolute top-0 right-0 w-24 h-24 bg-xeno-purple/5 rounded-full blur-2xl pointer-events-none" />
              <h3 className="text-sm font-bold tracking-tight mb-4 text-xeno-purple flex items-center gap-2" style={{ color: active.color }}>
                <Filter className="w-4 h-4" /> {active.name} Overview
              </h3>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-white/[0.01] border border-white/5">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5" /> Average Order Spend
                    </span>
                    <span className="font-semibold text-foreground">₹{active.avgSpent.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.01] border border-white/5">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Average Engagement Score
                    </span>
                    <span className="font-semibold text-foreground">{active.avgEngagement}/100</span>
                  </div>
                  <Progress value={active.avgEngagement} className="h-1.5" />
                </div>
                <div className="p-3 rounded-lg bg-white/[0.01] border border-white/5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5" /> CRM Influenced Revenue
                    </span>
                    <span className="font-semibold text-xeno-green">₹{active.totalRevenue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                {!active.isPreset && active.rules && active.rules.length > 0 && (
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-2">Targeting Rules:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {active.rules.map((rule, idx) => (
                        <Badge key={idx} variant="outline" className="text-[9px] bg-white/5 border-white/5 font-mono">
                          {rule.field} {rule.operator} {rule.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Top Customer Profiles */}
            <GlassCard className="lg:col-span-2 bg-[#07070b]/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Top Customer Profiles</h3>
                <span className="text-[10px] text-muted-foreground">Showing top {active.customers.length} purchasers</span>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                {active.customers.length === 0 ? (
                  <div className="text-center py-10 text-xs text-muted-foreground">No matching customer files found. Seed database to populate samples.</div>
                ) : (
                  active.customers.map((c, idx) => (
                    <div
                      key={c._id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[10px] font-mono text-muted-foreground w-4">#{idx + 1}</span>
                        <div className="w-7 h-7 rounded-lg bg-xeno-purple/10 border border-purple-500/20 flex items-center justify-center font-bold text-xeno-purple text-xs">
                          {c.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-foreground">₹{c.totalSpent.toLocaleString('en-IN')}</p>
                        <p className="text-[9px] text-muted-foreground">Engagement: {c.engagementScore}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Segment Workspace / Builder */}
      <GlassCard className="bg-[#050508]/60 relative border-purple-500/10">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <div>
            <h3 className="text-base font-bold">Dynamic Segment Builder Workspace</h3>
            <p className="text-xs text-muted-foreground">Configure query strings to filter audience demographics</p>
          </div>
          <div className="flex bg-[#0f0f16] border border-white/5 p-1 rounded-xl">
            <button
              onClick={() => setMode('visual')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'visual' ? 'bg-xeno-purple text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Visual rules builder
            </button>
            <button
              onClick={() => setMode('ai')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                mode === 'ai' ? 'bg-xeno-purple text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> Ask AI to write rules
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Editor Side */}
          <div className="lg:col-span-3 space-y-6">
            {mode === 'ai' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Write natural language segment prompt:</label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="E.g., shoppers who live in Bangalore and spent over 10,000 Rupees..."
                    rows={3}
                    className="w-full bg-[#0a0a0f] border border-white/5 focus:border-purple-500/30 focus:outline-none p-3 rounded-xl text-xs placeholder:text-muted-foreground/60 leading-relaxed font-sans"
                  />
                </div>
                <Button
                  onClick={handleAICompile}
                  disabled={!aiPrompt.trim() || isCompilingAI}
                  className="gradient-purple text-white border-0 py-5 text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                >
                  {isCompilingAI ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Compiling rules...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Compile Segment Rules</>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Define logical filters (AND query block):</span>
                    <Button onClick={addRule} variant="outline" size="sm" className="h-8 border-white/5 hover:bg-white/5 cursor-pointer text-xs">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add filter rule
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {rules.map((rule, idx) => {
                      const operators = OPERATOR_OPTIONS[rule.field] || [];
                      return (
                        <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-3.5 rounded-xl bg-black/40 border border-white/5">
                          {/* Field Select */}
                          <select
                            value={rule.field}
                            onChange={(e) => updateRule(idx, { field: e.target.value as any })}
                            className="bg-[#0f0f16] text-xs text-foreground p-2 rounded-lg border border-white/5 outline-none flex-1"
                          >
                            {FIELD_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>

                          {/* Operator Select */}
                          <select
                            value={rule.operator}
                            onChange={(e) => updateRule(idx, { operator: e.target.value as any })}
                            className="bg-[#0f0f16] text-xs text-foreground p-2 rounded-lg border border-white/5 outline-none flex-1"
                          >
                            {operators.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>

                          {/* Value Input depending on type */}
                          {rule.field === 'preferredChannel' ? (
                            <select
                              value={rule.value}
                              onChange={(e) => updateRule(idx, { value: e.target.value })}
                              className="bg-[#0f0f16] text-xs text-foreground p-2 rounded-lg border border-white/5 outline-none flex-1"
                            >
                              <option value="">Select Channel</option>
                              {CHANNEL_OPTIONS.map((c) => (
                                <option key={c} value={c}>{c.toUpperCase()}</option>
                              ))}
                            </select>
                          ) : rule.field === 'status' ? (
                            <select
                              value={rule.value}
                              onChange={(e) => updateRule(idx, { value: e.target.value })}
                              className="bg-[#0f0f16] text-xs text-foreground p-2 rounded-lg border border-white/5 outline-none flex-1"
                            >
                              <option value="">Select Status</option>
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s.toUpperCase()}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={rule.field === 'totalSpent' || rule.field === 'totalOrders' || rule.field === 'lastOrderDate' ? 'number' : 'text'}
                              value={rule.value}
                              onChange={(e) => updateRule(idx, { value: e.target.value })}
                              placeholder="Value..."
                              className="bg-[#0f0f16] text-xs text-foreground p-2 rounded-lg border border-white/5 outline-none flex-1"
                            />
                          )}

                          <Button
                            onClick={() => removeRule(idx)}
                            disabled={rules.length === 1}
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-xeno-red rounded-lg shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save segment card */}
                <div className="p-4 rounded-xl bg-purple-950/5 border border-purple-500/10 space-y-3.5">
                  <h4 className="text-xs font-bold text-foreground">Save Dynamic Segment Profile</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      value={segmentName}
                      onChange={(e) => setSegmentName(e.target.value)}
                      placeholder="Segment Name (e.g. VIP Delhi Shoppers)"
                      className="bg-[#0f0f16] border-white/5 text-xs text-foreground h-10"
                    />
                    <Input
                      value={segmentDesc}
                      onChange={(e) => setSegmentDesc(e.target.value)}
                      placeholder="Description (e.g. Spent > 10k in Mumbai)"
                      className="bg-[#0f0f16] border-white/5 text-xs text-foreground h-10"
                    />
                  </div>
                  <Button
                    onClick={handleSaveSegment}
                    disabled={isSavingSegment || rules.length === 0}
                    className="w-full gradient-purple text-white border-0 py-5 text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    {isSavingSegment ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" /> Save Segment Details</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Preview Side */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-2xl bg-black/40 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold tracking-tight text-muted-foreground uppercase">Live Preview Statistics</span>
                {isRefreshingPreview && <Loader2 className="w-3.5 h-3.5 text-xeno-purple animate-spin" />}
              </div>

              <div className="text-center py-6 border-b border-white/5">
                <span className="text-[10px] text-muted-foreground block">TARGET AUDIENCE POPULATION</span>
                <p className="text-4xl font-black gradient-text py-1 animate-pulse">
                  {previewCount !== null ? previewCount.toLocaleString() : '—'}
                </p>
                <span className="text-[9px] text-muted-foreground">active customers matching rules</span>
              </div>

              <div className="pt-4 space-y-2.5">
                <span className="text-[10px] text-muted-foreground block uppercase font-mono">Sample Matches:</span>
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto scrollbar-thin">
                  {previewCustomers.length === 0 ? (
                    <div className="text-center py-6 text-[10px] text-muted-foreground">No matches found. Adjust parameters.</div>
                  ) : (
                    previewCustomers.map((c) => (
                      <div key={c._id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.01]">
                        <span className="text-xs font-medium text-foreground truncate max-w-[120px]">{c.name}</span>
                        <span className="text-[10px] text-muted-foreground">{c.location?.city || 'India'}</span>
                        <span className="text-xs font-semibold text-xeno-purple">₹{c.totalSpent.toLocaleString('en-IN')}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
