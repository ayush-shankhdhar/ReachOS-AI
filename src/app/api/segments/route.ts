import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/customer';
import Segment from '@/models/segment';
import { SEGMENTS } from '@/lib/constants';
import { buildMongoQuery } from '@/lib/segment-utils';

export async function GET() {
  try {
    await connectDB();

    // 1. Fetch system static presets
    const presetData = await Promise.all(
      SEGMENTS.map(async (seg) => {
        const count = await Customer.countDocuments({ segment: seg.key });
        const stats = await Customer.aggregate([
          { $match: { segment: seg.key } },
          {
            $group: {
              _id: null,
              avgSpent: { $avg: '$totalSpent' },
              avgEngagement: { $avg: '$engagementScore' },
              totalRevenue: { $sum: '$totalSpent' },
            },
          },
        ]);

        const customers = await Customer.find({ segment: seg.key })
          .sort({ totalSpent: -1 })
          .limit(10)
          .lean();

        const monthAgo = new Date(Date.now() - 30 * 86400000);
        const recentCount = await Customer.countDocuments({
          segment: seg.key,
          createdAt: { $gte: monthAgo },
        });
        const trend = count > 0 ? Math.round((recentCount / count) * 100) : 0;

        return {
          name: seg.name,
          key: seg.key,
          description: seg.description,
          icon: seg.icon,
          color: seg.color,
          count,
          avgSpent: Math.round(stats[0]?.avgSpent || 0),
          avgEngagement: Math.round(stats[0]?.avgEngagement || 0),
          totalRevenue: Math.round(stats[0]?.totalRevenue || 0),
          trend,
          customers,
          isPreset: true,
          rules: []
        };
      })
    );

    // 2. Fetch custom saved segments
    const customSegments = await Segment.find({}).sort({ createdAt: -1 }).lean();
    const customData = await Promise.all(
      customSegments.map(async (seg: any) => {
        const query = seg.query || buildMongoQuery(seg.rules);
        const count = await Customer.countDocuments(query);
        
        const stats = await Customer.aggregate([
          { $match: query },
          {
            $group: {
              _id: null,
              avgSpent: { $avg: '$totalSpent' },
              avgEngagement: { $avg: '$engagementScore' },
              totalRevenue: { $sum: '$totalSpent' },
            },
          },
        ]);

        const customers = await Customer.find(query)
          .sort({ totalSpent: -1 })
          .limit(10)
          .lean();

        const monthAgo = new Date(Date.now() - 30 * 86400000);
        const recentCount = await Customer.countDocuments({
          ...query,
          createdAt: { $gte: monthAgo },
        });
        const trend = count > 0 ? Math.round((recentCount / count) * 100) : 0;

        return {
          _id: seg._id.toString(),
          name: seg.name,
          key: seg._id.toString(),
          description: seg.description || 'Custom segment',
          icon: 'PieChart',
          color: '#8b5cf6',
          count,
          avgSpent: Math.round(stats[0]?.avgSpent || 0),
          avgEngagement: Math.round(stats[0]?.avgEngagement || 0),
          totalRevenue: Math.round(stats[0]?.totalRevenue || 0),
          trend,
          customers,
          isPreset: false,
          rules: seg.rules,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: [...customData, ...presetData],
    });
  } catch (error) {
    console.error('Segments GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch segments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, description, rules } = body;

    if (!name || !rules || !Array.isArray(rules)) {
      return NextResponse.json({ success: false, message: 'Name and rules are required' }, { status: 400 });
    }

    const query = buildMongoQuery(rules);
    const count = await Customer.countDocuments(query);

    // Save or update
    const segment = await Segment.findOneAndUpdate(
      { name },
      {
        name,
        description,
        rules,
        query,
        count,
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      data: segment,
      message: 'Segment saved successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Segments POST error:', error);
    return NextResponse.json(
      { success: false, message: `Failed to save segment: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
