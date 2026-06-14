import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Campaign from '@/models/campaign';
import Communication from '@/models/communication';
import Segment from '@/models/segment';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const campaign = await Campaign.findById(id).lean();
    if (!campaign) {
      return NextResponse.json({ success: false, message: 'Campaign not found' }, { status: 404 });
    }

    let targetSegmentName = campaign.targetSegment;
    if (mongoose.Types.ObjectId.isValid(campaign.targetSegment)) {
      const seg = await Segment.findById(campaign.targetSegment).lean();
      if (seg) {
        targetSegmentName = seg.name;
      }
    }

    const communicationStats = await Communication.aggregate([
      { $match: { campaignId: campaign._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const channelBreakdown = await Communication.aggregate([
      { $match: { campaignId: campaign._id } },
      {
        $group: {
          _id: '$channel',
          sent: { $sum: { $cond: [{ $ne: ['$status', 'pending'] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $in: ['$status', ['delivered', 'read', 'opened', 'clicked']] }, 1, 0] } },
          read: { $sum: { $cond: [{ $in: ['$status', ['read', 'opened', 'clicked']] }, 1, 0] } },
          opened: { $sum: { $cond: [{ $in: ['$status', ['opened', 'clicked']] }, 1, 0] } },
          clicked: { $sum: { $cond: [{ $eq: ['$status', 'clicked'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $in: ['$status', ['failed', 'bounced']] }, 1, 0] } },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...campaign,
        targetSegmentName,
        communicationStats: communicationStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        channelBreakdown,
      },
    });
  } catch (error) {
    console.error('Campaign GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const campaign = await Campaign.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
    if (!campaign) {
      return NextResponse.json({ success: false, message: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: campaign });
  } catch (error) {
    console.error('Campaign PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const campaign = await Campaign.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true }
    ).lean();

    if (!campaign) {
      return NextResponse.json({ success: false, message: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: campaign });
  } catch (error) {
    console.error('Campaign DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to cancel campaign' },
      { status: 500 }
    );
  }
}
