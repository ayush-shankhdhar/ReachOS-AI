'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, ShoppingCart, Bot, Megaphone,
  PieChart, Radio, BarChart3, Menu, X, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, Users, ShoppingCart, Bot, Megaphone,
  PieChart, Radio, BarChart3,
};

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/customers', label: 'Customers', icon: 'Users' },
  { href: '/orders', label: 'Orders', icon: 'ShoppingCart' },
  { href: '/copilot', label: 'AI Copilot', icon: 'Bot' },
  { href: '/campaigns', label: 'Campaigns', icon: 'Megaphone' },
  { href: '/segments', label: 'Segments', icon: 'PieChart' },
  { href: '/channels', label: 'Channels', icon: 'Radio' },
  { href: '/analytics', label: 'Analytics', icon: 'BarChart3' },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 border-b border-white/5"
        style={{ background: 'rgba(10, 10, 15, 0.95)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-mixed flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold gradient-text">XenoPilot</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-foreground p-1">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 z-50 border-r border-white/5 p-4 pt-16"
              style={{ background: 'rgba(10, 10, 15, 0.98)' }}
            >
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = NAV_ICONS[item.icon];
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                  return (
                    <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                      <div
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                          isActive
                            ? 'bg-xeno-purple/15 text-xeno-purple'
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
