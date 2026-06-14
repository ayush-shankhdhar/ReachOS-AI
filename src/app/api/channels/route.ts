import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Communication from '@/models/communication';

export async function GET() {
  try {
    await connectDB();

    const stats = await Communication.aggregate([
      {
        $group: {
          _id: '$channel',
          total: { $sum: 1 },
          sent: { $sum: { $cond: [{ $ne: ['$status', 'pending'] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $in: ['$status', ['delivered', 'read', 'opened', 'clicked']] }, 1, 0] } },
          read: { $sum: { $cond: [{ $in: ['$status', ['read', 'opened', 'clicked']] }, 1, 0] } },
          opened: { $sum: { $cond: [{ $in: ['$status', ['opened', 'clicked']] }, 1, 0] } },
          clicked: { $sum: { $cond: [{ $eq: ['$status', 'clicked'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $in: ['$status', ['failed', 'bounced']] }, 1, 0] } },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Get recent events
    const recentEvents = await Communication.find({ status: { $ne: 'pending' } })
      .sort({ updatedAt: -1 })
      .limit(50)
      .populate('customerId', 'name')
      .populate('campaignId', 'name')
      .lean();

    const events = recentEvents.map((e) => ({
      id: e._id.toString(),
      type: e.status,
      channel: e.channel,
      customerId: e.customerId?._id?.toString() || '',
      customerName: (e.customerId && typeof e.customerId === 'object' && 'name' in e.customerId)
        ? (e.customerId as unknown as { name: string }).name
        : 'Unknown',
      campaignName: (e.campaignId && typeof e.campaignId === 'object' && 'name' in e.campaignId)
        ? (e.campaignId as unknown as { name: string }).name
        : 'Unknown',
      timestamp: e.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        stats: stats.map((s) => ({
          channel: s._id,
          sent: s.sent,
          delivered: s.delivered,
          read: s.read || 0,
          opened: s.opened,
          clicked: s.clicked,
          failed: s.failed,
        })),
        events,
      },
    });
  } catch (error) {
    console.error('Channels GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch channel stats' },
      { status: 500 }
    );
  }
}
