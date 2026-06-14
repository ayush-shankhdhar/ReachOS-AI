'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Filter, Mail, Phone, MapPin,
  Star, ShoppingBag, TrendingUp, X, Clock, Package,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import GlassCard from '@/components/shared/glass-card';
import PageHeader from '@/components/shared/page-header';
import LoadingSkeleton from '@/components/shared/loading-skeleton';
import { ICustomer } from '@/types/customer';
import { toast } from 'sonner';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('');
  const [status, setStatus] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [customerDetail, setCustomerDetail] = useState<ICustomer & { orders?: unknown[]; journey?: unknown[] } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 0 });

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (segment) params.set('segment', segment);
      if (status) params.set('status', status);
      params.set('page', String(pagination.page));
      params.set('limit', '20');

      const res = await fetch(`/api/customers?${params}`);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data);
        setPagination(json.pagination);
      }
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [search, segment, status, pagination.page]);

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const openCustomerDrawer = async (customer: ICustomer) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
    try {
      const res = await fetch(`/api/customers/${customer._id}`);
      const json = await res.json();
      if (json.success) setCustomerDetail(json.data);
    } catch {
      toast.error('Failed to load customer details');
    }
  };

  const segmentColors: Record<string, string> = {
    high_value: 'bg-xeno-amber/10 text-xeno-amber border-xeno-amber/20',
    inactive: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    frequent_buyer: 'bg-xeno-green/10 text-xeno-green border-xeno-green/20',
    churn_risk: 'bg-xeno-red/10 text-xeno-red border-xeno-red/20',
    new: 'bg-xeno-purple/10 text-xeno-purple border-xeno-purple/20',
  };

  const statusColors: Record<string, string> = {
    active: 'bg-xeno-green/10 text-xeno-green',
    inactive: 'bg-gray-500/10 text-gray-400',
    churned: 'bg-xeno-red/10 text-xeno-red',
  };

  if (loading && customers.length === 0) return <LoadingSkeleton count={4} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description={`${pagination.total} total customers`}>
        <Badge variant="secondary" className="bg-xeno-purple/10 text-xeno-purple border-xeno-purple/20">
          <Users className="w-3 h-3 mr-1" /> {pagination.total}
        </Badge>
      </PageHeader>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 focus:border-xeno-purple/50"
            />
          </div>
          <Select value={segment} onValueChange={(v) => v && setSegment(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full md:w-48 bg-white/5 border-white/10">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Segment" />
            </SelectTrigger>
            <SelectContent className="bg-[#111118] border-white/10">
              <SelectItem value="all">All Segments</SelectItem>
              <SelectItem value="high_value">High Value</SelectItem>
              <SelectItem value="frequent_buyer">Frequent Buyer</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="churn_risk">Churn Risk</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => v && setStatus(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full md:w-40 bg-white/5 border-white/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#111118] border-white/10">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="churned">Churned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {customers.map((customer, i) => (
          <motion.div
            key={customer._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div
              onClick={() => openCustomerDrawer(customer)}
              className="glass-card-hover p-5 cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-xeno-purple/20 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-xeno-purple">
                    {customer.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{customer.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">{customer.company}</p>
                </div>
                <Badge className={`${statusColors[customer.status]} border-0 text-xs`}>
                  {customer.status}
                </Badge>
              </div>

              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <Badge className={`${segmentColors[customer.segment]} border text-xs`}>
                  {customer.segment.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {customer.location?.city}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                  <p className="text-sm font-semibold">₹{(customer.totalSpent / 1000).toFixed(1)}k</p>
                  <p className="text-[10px] text-muted-foreground">Spent</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                  <p className="text-sm font-semibold">{customer.totalOrders}</p>
                  <p className="text-[10px] text-muted-foreground">Orders</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                  <p className="text-sm font-semibold">{customer.engagementScore}</p>
                  <p className="text-[10px] text-muted-foreground">Score</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            className="border-white/10"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            className="border-white/10"
          >
            Next
          </Button>
        </div>
      )}

      {/* Customer Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg bg-[#0d0d14] border-l border-white/5 p-0">
          <SheetHeader className="p-6 border-b border-white/5">
            <SheetTitle className="text-foreground">Customer Profile</SheetTitle>
          </SheetHeader>
          {selectedCustomer && (
            <ScrollArea className="h-[calc(100vh-80px)]">
              <div className="p-6 space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-xeno-purple/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-xeno-purple">
                      {selectedCustomer.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedCustomer.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.company}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge className={`${segmentColors[selectedCustomer.segment]} border text-xs`}>
                        {selectedCustomer.segment.replace('_', ' ')}
                      </Badge>
                      <Badge className={`${statusColors[selectedCustomer.status]} border-0 text-xs`}>
                        {selectedCustomer.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedCustomer.location?.city}, {selectedCustomer.location?.state}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <Star className="w-4 h-4 text-xeno-amber mb-2" />
                    <p className="text-xl font-bold">₹{selectedCustomer.totalSpent.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <ShoppingBag className="w-4 h-4 text-xeno-green mb-2" />
                    <p className="text-xl font-bold">{selectedCustomer.totalOrders}</p>
                    <p className="text-xs text-muted-foreground">Orders</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <TrendingUp className="w-4 h-4 text-xeno-purple mb-2" />
                    <p className="text-xl font-bold">{selectedCustomer.engagementScore}</p>
                    <p className="text-xs text-muted-foreground">Engagement</p>
                    <Progress value={selectedCustomer.engagementScore} className="mt-2 h-1.5" />
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <Star className="w-4 h-4 text-xeno-cyan mb-2" />
                    <p className="text-xl font-bold">₹{selectedCustomer.lifetimeValue.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground">Lifetime Value</p>
                  </div>
                </div>

                {/* Journey Timeline */}
                {customerDetail?.journey && (
                  <div>
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-xeno-purple" /> Customer Journey
                    </h3>
                    <div className="space-y-3 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                      {(customerDetail.journey as Array<{type: string; title: string; description: string; date: string; status: string}>).slice(0, 10).map((event, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex gap-4 pl-7 relative"
                        >
                          <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center
                            ${event.type === 'order' ? 'bg-xeno-green/20' : 'bg-xeno-purple/20'}`}
                          >
                            {event.type === 'order'
                              ? <Package className="w-3 h-3 text-xeno-green" />
                              : <Mail className="w-3 h-3 text-xeno-purple" />
                            }
                          </div>
                          <div className="flex-1 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                            <p className="text-sm font-medium">{event.title}</p>
                            <p className="text-xs text-muted-foreground">{event.description}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(event.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
