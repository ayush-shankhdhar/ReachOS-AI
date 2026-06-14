import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/customer';
import Order from '@/models/order';
import Campaign from '@/models/campaign';
import Communication from '@/models/communication';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    let startDate: Date;
    const now = new Date();

    switch (period) {
      case '7d': startDate = new Date(now.getTime() - 7 * 86400000); break;
      case '90d': startDate = new Date(now.getTime() - 90 * 86400000); break;
      case '1y': startDate = new Date(now.getTime() - 365 * 86400000); break;
      default: startDate = new Date(now.getTime() - 30 * 86400000);
    }

    // Revenue aggregation
    const revenueAgg = await Order.aggregate([
      { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
    ]);

    const monthlyRevenue = await Order.aggregate([
      { $match: { status: { $nin: ['cancelled', 'refunded'] }, orderDate: { $gte: new Date(now.getTime() - 365 * 86400000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$orderDate' } },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]);

    const lastMonthRevenue = await Order.aggregate([
      {
        $match: {
          status: { $nin: ['cancelled', 'refunded'] },
          orderDate: {
            $gte: new Date(now.getTime() - 60 * 86400000),
            $lt: new Date(now.getTime() - 30 * 86400000),
          },
        },
      },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    const thisMonthRevenue = await Order.aggregate([
      {
        $match: {
          status: { $nin: ['cancelled', 'refunded'] },
          orderDate: { $gte: new Date(now.getTime() - 30 * 86400000) },
        },
      },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    const lastRev = lastMonthRevenue[0]?.total || 1;
    const thisRev = thisMonthRevenue[0]?.total || 0;
    const revenueGrowth = Math.round(((thisRev - lastRev) / lastRev) * 100);

    // Customer stats
    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ status: 'active' });
    const newCustomers = await Customer.countDocuments({
      createdAt: { $gte: new Date(now.getTime() - 30 * 86400000) },
    });

    const lastMonthCustomers = await Customer.countDocuments({
      createdAt: {
        $gte: new Date(now.getTime() - 60 * 86400000),
        $lt: new Date(now.getTime() - 30 * 86400000),
      },
    });
    const customerGrowth = lastMonthCustomers > 0
      ? Math.round(((newCustomers - lastMonthCustomers) / lastMonthCustomers) * 100)
      : 100;

    // Campaign stats
    const totalCampaigns = await Campaign.countDocuments();
    const activeCampaigns = await Campaign.countDocuments({ status: 'active' });

    const campaignMetrics = await Campaign.aggregate([
      { $match: { 'metrics.sent': { $gt: 0 } } },
      {
        $group: {
          _id: null,
          avgOpenRate: {
            $avg: { $cond: [{ $gt: ['$metrics.delivered', 0] }, { $divide: ['$metrics.opened', '$metrics.delivered'] }, 0] },
          },
          avgClickRate: {
            $avg: { $cond: [{ $gt: ['$metrics.opened', 0] }, { $divide: ['$metrics.clicked', '$metrics.opened'] }, 0] },
          },
        },
      },
    ]);

    // AI Insights based on actual data
    const insights: string[] = [];
    const highValueCount = await Customer.countDocuments({ segment: 'high_value' });
    const churnRiskCount = await Customer.countDocuments({ segment: 'churn_risk' });
    const inactiveCount = await Customer.countDocuments({ segment: 'inactive' });

    insights.push(`${highValueCount} high-value customers contribute to ${Math.round((highValueCount / totalCustomers) * 100)}% of your base — consider a VIP loyalty program.`);
    insights.push(`${churnRiskCount} customers are at risk of churning. Launch a win-back campaign with personalized offers to retain them.`);
    if (inactiveCount > 5) {
      insights.push(`${inactiveCount} inactive customers detected. A re-engagement email series could recover up to 15% of them.`);
    }
    if (activeCampaigns > 0) {
      insights.push(`${activeCampaigns} campaigns are currently active. Monitor open rates closely for the first 24 hours.`);
    }
    insights.push(`Revenue growth is ${revenueGrowth > 0 ? '+' : ''}${revenueGrowth}% this month. ${revenueGrowth > 0 ? 'Great momentum!' : 'Consider running a promotional campaign to boost sales.'}`);

    // Recent activity
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(3).populate('customerId', 'name');
    const recentCampaigns = await Campaign.find().sort({ createdAt: -1 }).limit(3);

    const recentActivity = [
      ...recentOrders.map((o) => ({
        id: o._id.toString(),
        type: 'order_placed' as const,
        description: `Order ${o.orderNumber} placed${o.customerId && typeof o.customerId === 'object' && 'name' in o.customerId ? ` by ${(o.customerId as unknown as { name: string }).name}` : ''} — ₹${o.total.toLocaleString()}`,
        timestamp: o.createdAt,
      })),
      ...recentCampaigns.map((c) => ({
        id: c._id.toString(),
        type: (c.status === 'active' ? 'campaign_launched' : 'campaign_completed') as 'campaign_launched' | 'campaign_completed',
        description: `Campaign "${c.name}" ${c.status === 'active' ? 'launched' : c.status}`,
        timestamp: c.createdAt,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);

    return NextResponse.json({
      success: true,
      data: {
        revenue: {
          total: revenueAgg[0]?.total || 0,
          growth: revenueGrowth,
          monthly: monthlyRevenue.map((m) => ({ month: m._id, revenue: m.revenue })),
        },
        customers: {
          total: totalCustomers,
          active: activeCustomers,
          newThisMonth: newCustomers,
          growth: customerGrowth,
        },
        campaigns: {
          total: totalCampaigns,
          active: activeCampaigns,
          avgOpenRate: Math.round((campaignMetrics[0]?.avgOpenRate || 0) * 100),
          avgClickRate: Math.round((campaignMetrics[0]?.avgClickRate || 0) * 100),
        },
        aiInsights: insights,
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
