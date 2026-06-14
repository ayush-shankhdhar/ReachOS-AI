'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IndianRupee, Users, Megaphone, TrendingUp, Sparkles, Activity,
  ShoppingCart, Zap, Clock, ArrowUpRight, Eye, MousePointerClick,
  Bot, Send, CheckCircle2, ChevronRight, Play, Loader2, Sparkle,
  Radio, BarChart3, AlertCircle, RefreshCw, XCircle, LayoutDashboard,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import StatCard from '@/components/shared/stat-card';
import GlassCard from '@/components/shared/glass-card';
import PageHeader from '@/components/shared/page-header';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { toast } from 'sonner';

interface DashboardData {
  revenue: { total: number; growth: number; monthly: { month: string; revenue: number }[] };
  customers: { total: number; active: number; newThisMonth: number; growth: number };
  campaigns: { total: number; active: number; avgOpenRate: number; avgClickRate: number };
  aiInsights: string[];
  recentActivity: { id: string; type: string; description: string; timestamp: string }[];
}

const QUICK_ACTIONS = [
  { text: 'Increase repeat purchases in Mumbai', icon: ShoppingCart },
  { text: 'Recover inactive customers who spent > ₹5,000', icon: Clock },
  { text: 'Launch WhatsApp loyalty offers for VIP customers', icon: Zap },
  { text: 'Boost weekend sales with a special discount code', icon: Sparkles },
];

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'copilot' | 'dashboard'>('copilot');

  // Copilot agent state
  const [promptInput, setPromptInput] = useState('');
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentStep, setAgentStep] = useState(0);
  const [agentLogs, setAgentLogs] = useState<{ step: number; text: string; status: 'pending' | 'loading' | 'success' | 'failed' }[]>([]);
  const [generatedCampaign, setGeneratedCampaign] = useState<any>(null);
  const [generatedSegment, setGeneratedSegment] = useState<any>(null);
  const [campaignLaunched, setCampaignLaunched] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [agentLogs]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    const seedToast = toast.loading('Seeding database with realistic records...');
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        toast.success(`Success: Ingested ${json.data.customers} customers & ${json.data.orders} orders!`, { id: seedToast });
        fetchDashboard();
      } else {
        toast.error(json.message, { id: seedToast });
      }
    } catch {
      toast.error('Seeding request failed', { id: seedToast });
    }
  };

  const executeCopilotAgent = async (promptText: string) => {
    if (!promptText.trim() || agentRunning) return;
    setPromptInput('');
    setAgentRunning(true);
    setCampaignLaunched(false);
    setGeneratedCampaign(null);
    setGeneratedSegment(null);
    setAgentStep(1);

    // Initial agent log layout
    const initialLogs = [
      { step: 1, text: 'Analyzing marketing objective & channel context...', status: 'loading' as const },
      { step: 2, text: 'Compiling segmentation rules & matching audience size...', status: 'pending' as const },
      { step: 3, text: 'Drafting personalized copy with variable fields...', status: 'pending' as const },
      { step: 4, text: 'Resolving channel recommendation metrics...', status: 'pending' as const },
      { step: 5, text: 'Calculating budget, reach & conversion ROI...', status: 'pending' as const },
      { step: 6, text: 'Preparing workspace and campaign layout...', status: 'pending' as const },
    ];
    setAgentLogs(initialLogs);

    try {
      // Step 1: Objective parsing
      await new Promise((resolve) => setTimeout(resolve, 800));
      setAgentLogs((prev) => prev.map((l) => l.step === 1 ? { ...l, status: 'success' } : l.step === 2 ? { ...l, status: 'loading' } : l));
      setAgentStep(2);

      // Step 2: Segment AI compilation
      const segmentRes = await fetch('/api/segments/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });
      const segmentJson = await segmentRes.json();
      let rules = [];
      if (segmentJson.success && segmentJson.data?.rules) {
        rules = segmentJson.data.rules;
      } else {
        // Fallback rule if AI compilation fails
        rules = [{ field: 'status', operator: 'eq', value: 'active' }];
      }

      // Preview segment size
      const previewRes = await fetch('/api/segments/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules }),
      });
      const previewJson = await previewRes.json();
      const count = previewJson.success ? previewJson.data.count : 0;
      setGeneratedSegment({ rules, count });

      await new Promise((resolve) => setTimeout(resolve, 600));
      setAgentLogs((prev) => prev.map((l) =>
        l.step === 2
          ? { ...l, text: `Compiled Segment query. Found ${count} matching customers.`, status: 'success' }
          : l.step === 3 ? { ...l, status: 'loading' } : l
      ));
      setAgentStep(3);

      // Step 3: Call Gemini Copilot for text copies
      const copilotRes = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Create a campaign for target segment. Prompt context: ${promptText}` }),
      });
      const copilotJson = await copilotRes.json();
      let campaignDetail = copilotJson.success ? copilotJson.data.campaign : null;

      if (!campaignDetail) {
        campaignDetail = {
          name: `Campaign: ${promptText.slice(0, 30)}...`,
          type: promptText.toLowerCase().includes('email') ? 'email' : 'whatsapp',
          targetSegment: 'new',
          message: {
            subject: 'Exclusive Offer For You!',
            body: 'Hey {{name}}, we have a special offer just for you. Get 20% off your next purchase using code VIP20! Shop now at our store.',
          },
          channel: promptText.toLowerCase().includes('email') ? 'email' : 'whatsapp',
        };
      }

      // Ensure template interpolation tokens exist in body
      if (!campaignDetail.message.body.includes('{{name}}')) {
        campaignDetail.message.body = `Hi {{name}},\n\n${campaignDetail.message.body}`;
      }

      await new Promise((resolve) => setTimeout(resolve, 800));
      setAgentLogs((prev) => prev.map((l) => l.step === 3 ? { ...l, status: 'success' } : l.step === 4 ? { ...l, status: 'loading' } : l));
      setAgentStep(4);

      // Step 4: Channel Recommendation
      await new Promise((resolve) => setTimeout(resolve, 700));
      const recommendedChannel = campaignDetail.channel || 'whatsapp';
      setAgentLogs((prev) => prev.map((l) =>
        l.step === 4
          ? { ...l, text: `Recommended Channel: ${recommendedChannel.toUpperCase()} (highest predicted open rate)`, status: 'success' }
          : l.step === 5 ? { ...l, status: 'loading' } : l
      ));
      setAgentStep(5);

      // Step 5: ROI Impact Calculation
      const reach = count;
      const ctr = recommendedChannel === 'whatsapp' ? 0.38 : recommendedChannel === 'email' ? 0.18 : 0.22;
      const expectedConversions = Math.round(reach * ctr * 0.12);
      const expectedRevenue = expectedConversions * 1250;

      await new Promise((resolve) => setTimeout(resolve, 800));
      setAgentLogs((prev) => prev.map((l) =>
        l.step === 5
          ? { ...l, text: `Estimated reach: ${reach} shoppers • Expected ROI: ₹${expectedRevenue.toLocaleString('en-IN')}`, status: 'success' }
          : l.step === 6 ? { ...l, status: 'loading' } : l
      ));
      setAgentStep(6);

      // Step 6: Package workspace
      // Save segment first
      const segmentSaveRes = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Segment - ${promptText.slice(0, 25)}`,
          description: `AI-compiled rules matching: "${promptText}"`,
          rules,
        }),
      });
      const segmentSaveJson = await segmentSaveRes.json();
      const segmentId = segmentSaveJson.success ? segmentSaveJson.data._id : 'new';

      // Create campaign draft
      const campaignCreateRes = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignDetail.name,
          type: campaignDetail.type,
          targetSegment: segmentId,
          channel: campaignDetail.channel,
          message: campaignDetail.message,
          goal: promptText,
          aiGenerated: true,
          budget: 5000,
        }),
      });
      const campaignCreateJson = await campaignCreateRes.json();

      await new Promise((resolve) => setTimeout(resolve, 600));
      setAgentLogs((prev) => prev.map((l) => l.step === 6 ? { ...l, status: 'success' } : l));

      if (campaignCreateJson.success) {
        setGeneratedCampaign(campaignCreateJson.data);
      } else {
        toast.error('Failed to register campaign draft');
      }
    } catch (err) {
      console.error(err);
      toast.error('Agent compilation error');
      setAgentLogs((prev) => prev.map((l) => l.status === 'loading' ? { ...l, status: 'failed', text: 'Error executing agent step' } : l));
    } finally {
      setAgentRunning(false);
    }
  };

  const handleLaunchCampaign = async () => {
    if (!generatedCampaign || isLaunching) return;
    setIsLaunching(true);
    const campaignId = generatedCampaign._id;

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/launch`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        toast.success('Campaign launched and queued in Mock Service!');
        setCampaignLaunched(true);
        fetchDashboard();
      } else {
        toast.error(json.message || 'Failed to dispatch communications');
      }
    } catch {
      toast.error('Launch request rejected');
    } finally {
      setIsLaunching(false);
    }
  };

  if (loading) return <LoadingSkeleton count={4} />;

  const hasData = data && data.customers.total > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="w-24 h-24 rounded-3xl gradient-mixed flex items-center justify-center mx-auto mb-6 animate-float">
            <Zap className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-3 gradient-text">Welcome to XenoPilot CRM</h2>
          <p className="text-muted-foreground max-w-md">
            Deploy an interactive experience by seeding the database with customer records, orders, and initial analytics.
          </p>
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleSeed}
            size="lg"
            className="gradient-purple text-white border-0 px-8 py-6 text-base font-semibold rounded-xl hover:opacity-95 transition-opacity cursor-pointer shadow-lg shadow-purple-900/20"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Seed Database with Sample Data
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aurora light spots */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-xeno-purple/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-10 w-[300px] h-[300px] rounded-full bg-xeno-cyan/5 blur-[100px] pointer-events-none -z-10" />

      {/* Tabs Layout */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workspace</h1>
          <p className="text-xs text-muted-foreground">Orchestrate and monitor intelligent marketing pipelines</p>
        </div>
        <div className="flex bg-[#0f0f16] border border-white/5 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('copilot')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'copilot' ? 'bg-xeno-purple text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bot className="w-3.5 h-3.5" /> AI Campaign Copilot
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-xeno-purple text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Executive Dashboard
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'copilot' ? (
          <motion.div
            key="copilot-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Copilot ChatGPT styled Workspace */}
            <div className="max-w-4xl mx-auto flex flex-col items-center py-6">
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="text-center mb-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-xeno-purple/10 border border-xeno-purple/20 flex items-center justify-center mx-auto mb-4 glow-purple">
                  <Bot className="w-8 h-8 text-xeno-purple" />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight gradient-text">What would you like to achieve today?</h2>
                <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                  Describe your objective in natural language. The AI agent will auto-generate segments, message, recommended channel, and prepare the campaign launcher.
                </p>
              </motion.div>

              {/* Glowing Console Card */}
              <div className="w-full glass-card p-2 shadow-2xl relative border-purple-500/20 bg-black/45">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  <span className="text-[10px] text-muted-foreground font-mono ml-2">XenoPilot Agent console v1.2</span>
                </div>

                <div className="flex gap-2 p-2 mt-2">
                  <textarea
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        executeCopilotAgent(promptInput);
                      }
                    }}
                    placeholder="E.g., Recover inactive shoppers who spent more than ₹10,000 using WhatsApp..."
                    rows={2}
                    className="flex-1 bg-transparent border-0 resize-none text-sm p-2 focus:outline-none placeholder:text-muted-foreground/60 min-h-[50px] scrollbar-none"
                  />
                  <Button
                    onClick={() => executeCopilotAgent(promptInput)}
                    disabled={!promptInput.trim() || agentRunning}
                    className="gradient-purple hover:opacity-90 text-white self-end rounded-xl h-10 px-4 border-0 shadow-lg shadow-purple-900/10 cursor-pointer"
                  >
                    {agentRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Sample Prompts */}
              {!agentRunning && !generatedCampaign && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-6">
                  {QUICK_ACTIONS.map((act, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => executeCopilotAgent(act.text)}
                      className="flex items-center gap-3 p-3 text-left rounded-xl bg-white/[0.02] border border-white/5 hover:border-purple-500/20 hover:bg-white/[0.04] transition-all duration-200 group cursor-pointer"
                    >
                      <div className="p-2 rounded-lg bg-xeno-purple/10 group-hover:bg-xeno-purple/20 transition-colors shrink-0">
                        <act.icon className="w-3.5 h-3.5 text-xeno-purple" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1">{act.text}</span>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Real-time Agent Reasoning UI */}
              {(agentRunning || generatedCampaign) && (
                <div className="w-full mt-8 space-y-6">
                  <div className="glass-card p-5 border-white/5 bg-[#07070b]/60">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-xeno-purple animate-pulse" /> Agent Thinking Protocol
                    </h3>

                    <div className="space-y-3 font-mono text-xs">
                      {agentLogs.map((log) => (
                        <div key={log.step} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.01]">
                          <div className="flex items-center gap-3">
                            {log.status === 'success' && <CheckCircle2 className="w-4 h-4 text-xeno-green shrink-0" />}
                            {log.status === 'loading' && <Loader2 className="w-4 h-4 text-xeno-purple animate-spin shrink-0" />}
                            {log.status === 'pending' && <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" />}
                            {log.status === 'failed' && <XCircle className="w-4 h-4 text-xeno-red shrink-0" />}
                            <span className={log.status === 'success' ? 'text-foreground font-semibold' : 'text-muted-foreground'}>
                              Step {log.step}: {log.text}
                            </span>
                          </div>
                          {log.status === 'loading' && (
                            <span className="text-[10px] text-xeno-purple animate-pulse">thinking...</span>
                          )}
                        </div>
                      ))}
                      <div ref={consoleEndRef} />
                    </div>
                  </div>

                  {/* Generated Campaign Launcher Card */}
                  {generatedCampaign && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-card p-6 border-purple-500/20 bg-gradient-to-br from-purple-950/10 to-cyan-950/5 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-xeno-purple/10 rounded-full blur-2xl -mr-10 -mt-10" />

                      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-5 h-5 text-xeno-purple" />
                          <div>
                            <h4 className="font-bold text-sm">{generatedCampaign.name}</h4>
                            <p className="text-[10px] text-muted-foreground">Target Segment ID: <span className="font-mono text-xeno-cyan">{generatedCampaign.targetSegment}</span> • Goal: {generatedCampaign.goal}</p>
                          </div>
                        </div>
                        <Badge className="bg-xeno-purple/10 text-xeno-purple border border-purple-500/20 text-xs">
                          {generatedCampaign.channel.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="space-y-4 text-xs">
                        {generatedCampaign.message.subject && (
                          <div>
                            <span className="text-muted-foreground block mb-1">Subject Template:</span>
                            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">{generatedCampaign.message.subject}</div>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground block mb-1">Body Template (Personalized):</span>
                          <div className="p-3 rounded-lg bg-black/40 border border-white/5 whitespace-pre-wrap leading-relaxed font-sans">{generatedCampaign.message.body}</div>
                        </div>

                        {generatedSegment && (
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="p-3 rounded-lg bg-[#0e0e15] border border-white/5">
                              <span className="text-[10px] text-muted-foreground">Audience Count</span>
                              <p className="text-lg font-bold text-xeno-purple">{generatedSegment.count}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-[#0e0e15] border border-white/5">
                              <span className="text-[10px] text-muted-foreground">Est. Growth conversion</span>
                              <p className="text-lg font-bold text-xeno-green">~{(generatedSegment.count * 0.05).toFixed(0)} orders</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-6 border-t border-white/5 pt-4">
                        {campaignLaunched ? (
                          <div className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-xeno-green/10 border border-xeno-green/20 text-xeno-green text-xs font-semibold">
                            <CheckCircle2 className="w-4 h-4" /> Campaign Dispatched & Simulated Successfully!
                          </div>
                        ) : (
                          <>
                            <Button
                              onClick={handleLaunchCampaign}
                              disabled={isLaunching}
                              className="flex-1 gradient-purple text-white border-0 py-5 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20"
                            >
                              {isLaunching ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                              Launch Campaign Now
                            </Button>
                            <Link href="/campaigns" className="flex-1">
                              <Button variant="outline" className="w-full py-5 border-white/10 text-xs font-semibold hover:bg-white/5 cursor-pointer">
                                Open Campaigns Manager
                              </Button>
                            </Link>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Executive Overview Analytics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Revenue Influenced"
                value={data.revenue.total}
                prefix="₹"
                change={data.revenue.growth}
                icon={IndianRupee}
                color="green"
                delay={0}
              />
              <StatCard
                title="Total Customers"
                value={data.customers.total}
                change={data.customers.growth}
                icon={Users}
                color="purple"
                delay={0.1}
              />
              <StatCard
                title="Active Campaigns"
                value={data.campaigns.active}
                icon={Megaphone}
                color="cyan"
                delay={0.2}
              />
              <StatCard
                title="Avg Open Rate"
                value={data.campaigns.avgOpenRate}
                suffix="%"
                icon={Eye}
                color="amber"
                delay={0.3}
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GlassCard className="lg:col-span-2" delay={0.2}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Revenue Trend</h3>
                    <p className="text-xs text-muted-foreground">Monthly CRM-attributed sales</p>
                  </div>
                  <Badge variant="outline" className="border-xeno-purple/20 bg-xeno-purple/5 text-xeno-purple text-xs font-mono">
                    ₹/month
                  </Badge>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data.revenue.monthly}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.06)" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(5,5,8,0.95)',
                        border: '1px solid rgba(124,58,237,0.2)',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        backdropFilter: 'blur(20px)',
                      }}
                      formatter={(val: any) => [`₹${val.toLocaleString('en-IN')}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2}
                      fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </GlassCard>

              {/* AI Insight Feed */}
              <GlassCard delay={0.3} glow="purple">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 rounded-xl bg-xeno-purple/10 border border-xeno-purple/20">
                    <Bot className="w-5 h-5 text-xeno-purple animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">AI Insights Feed</h3>
                    <p className="text-[10px] text-muted-foreground">Dynamic optimization logic</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {data.aiInsights.map((insight, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-purple-500/10 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-xeno-purple shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Activities */}
              <GlassCard delay={0.4}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 rounded-xl bg-xeno-cyan/10 border border-xeno-cyan/20">
                    <Clock className="w-5 h-5 text-xeno-cyan" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Recent Activity Logs</h3>
                    <p className="text-[10px] text-muted-foreground">Audit logs</p>
                  </div>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin">
                  {data.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{activity.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(activity.timestamp).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'medium' })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[9px] bg-white/5 border-0">
                        {activity.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Seed / Reseed actions */}
              <GlassCard className="flex flex-col justify-between" delay={0.5}>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Simulated Sandbox Controls</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This CRM runs completely stubbed environments. If you want to reset simulation states, orders, or communications and trigger new webhooks, clear the workspace datasets below.
                  </p>
                </div>
                <div className="mt-6 space-y-3">
                  <Button
                    onClick={handleSeed}
                    variant="outline"
                    className="w-full py-5 border-white/10 hover:bg-white/5 text-xs font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Clean & Re-seed Entire Sandbox
                  </Button>
                  <Link href="/channels" className="block w-full">
                    <Button
                      variant="outline"
                      className="w-full py-5 border-purple-500/20 text-xeno-purple hover:bg-xeno-purple/5 text-xs font-semibold cursor-pointer"
                    >
                      <Radio className="w-4 h-4 mr-2" /> Open Channel simulation worker
                    </Button>
                  </Link>
                </div>
              </GlassCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
