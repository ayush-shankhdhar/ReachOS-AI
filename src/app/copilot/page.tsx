'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles, User, Megaphone, Loader2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import GlassCard from '@/components/shared/glass-card';
import PageHeader from '@/components/shared/page-header';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  campaign?: {
    name: string;
    type: string;
    targetSegment: string;
    message: { subject: string; body: string };
    channel: string;
  };
}

const QUICK_PROMPTS = [
  { label: 'Create a campaign', prompt: 'Create an email campaign to re-engage inactive customers with a special discount offer', icon: Megaphone },
  { label: 'Audience insights', prompt: 'Analyze my customer segments and recommend which segment to target for maximum ROI', icon: User },
  { label: 'Generate message', prompt: 'Generate a compelling promotional email for our upcoming summer sale targeting high-value customers', icon: Lightbulb },
  { label: 'Campaign strategy', prompt: 'Suggest a multi-channel campaign strategy to reduce customer churn rate by 20%', icon: Sparkles },
];

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, history }),
      });

      const json = await res.json();

      if (json.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: json.data.reply,
          timestamp: new Date(),
          suggestions: json.data.suggestions,
          campaign: json.data.campaign,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        toast.error('AI response failed');
      }
    } catch {
      toast.error('Failed to reach AI service');
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error connecting to the AI service. Please check your API configuration and try again.',
        timestamp: new Date(),
        suggestions: ['Try again', 'Check API settings'],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const createCampaignFromAI = async (campaign: Message['campaign']) => {
    if (!campaign) return;
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaign.name,
          type: campaign.type,
          targetSegment: campaign.targetSegment,
          channel: campaign.channel,
          message: { ...campaign.message, template: 'default' },
          schedule: { startDate: new Date().toISOString() },
          goal: `AI-generated campaign: ${campaign.name}`,
          aiGenerated: true,
          aiPrompt: messages[messages.length - 2]?.content || '',
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Campaign created! Redirecting...');
        router.push('/campaigns');
      } else {
        toast.error('Failed to create campaign');
      }
    } catch {
      toast.error('Campaign creation failed');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] lg:h-[calc(100vh-4rem)] flex flex-col">
      <PageHeader title="AI Copilot" description="Your intelligent marketing assistant" />

      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto scrollbar-thin px-1"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-20 h-20 rounded-3xl gradient-mixed flex items-center justify-center mx-auto mb-6 animate-glow">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">How can I help you today?</h2>
                <p className="text-muted-foreground max-w-md mb-8">
                  I can create campaigns, analyze audiences, generate messages, and optimize your marketing strategy.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    onClick={() => sendMessage(prompt.prompt)}
                    className="glass-card-hover p-4 text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-xeno-purple/10 border border-xeno-purple/20 group-hover:bg-xeno-purple/20 transition-colors">
                        <prompt.icon className="w-4 h-4 text-xeno-purple" />
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">{prompt.label}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{prompt.prompt}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4 max-w-4xl mx-auto">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-xl gradient-mixed flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                      <div className={`p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'gradient-purple text-white rounded-br-md'
                          : 'glass-card rounded-bl-md'
                      }`}>
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      </div>

                      {/* Campaign Preview */}
                      {msg.campaign && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 p-4 rounded-xl bg-xeno-purple/5 border border-xeno-purple/20"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Megaphone className="w-4 h-4 text-xeno-purple" />
                            <span className="text-sm font-semibold">Campaign Preview</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div><span className="text-muted-foreground">Name:</span> {msg.campaign.name}</div>
                            <div><span className="text-muted-foreground">Channel:</span> <Badge variant="secondary" className="bg-white/5 border-0">{msg.campaign.channel}</Badge></div>
                            <div><span className="text-muted-foreground">Segment:</span> <Badge variant="secondary" className="bg-white/5 border-0">{msg.campaign.targetSegment}</Badge></div>
                            <div><span className="text-muted-foreground">Subject:</span> {msg.campaign.message.subject}</div>
                          </div>
                          <Button
                            onClick={() => createCampaignFromAI(msg.campaign)}
                            className="mt-3 gradient-purple text-white border-0 w-full"
                            size="sm"
                          >
                            <Megaphone className="w-3.5 h-3.5 mr-2" /> Create This Campaign
                          </Button>
                        </motion.div>
                      )}

                      {/* Suggestions */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {msg.suggestions.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => sendMessage(s)}
                              className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-muted-foreground hover:text-foreground hover:border-xeno-purple/30 hover:bg-xeno-purple/5 transition-all"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}

                      <p className="text-[10px] text-muted-foreground mt-2 px-1">
                        {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-xl bg-xeno-cyan/20 flex items-center justify-center shrink-0 mt-1">
                        <User className="w-4 h-4 text-xeno-cyan" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-xl gradient-mixed flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="glass-card p-4 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-xeno-purple" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card p-2 flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your marketing..."
                rows={1}
                className="flex-1 bg-transparent border-0 resize-none text-sm px-3 py-2 focus:outline-none text-foreground placeholder:text-muted-foreground min-h-[40px] max-h-[120px]"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                }}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="gradient-purple text-white border-0 rounded-xl h-10 w-10 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Powered by XenoPilot AI • Responses may not always be accurate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
