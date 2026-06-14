import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Communication from '@/models/communication';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const filter: Record<string, unknown> = {};
    if (campaignId) filter.campaignId = campaignId;

    const total = await Communication.countDocuments(filter);
    const communications = await Communication.find(filter)
      .populate('customerId', 'name email avatar')
      .populate('campaignId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: communications,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Communications GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch communications' },
      { status: 500 }
    );
  }
}
