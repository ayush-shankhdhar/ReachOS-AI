import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Campaign from '@/models/campaign';
import Customer from '@/models/customer';
import Segment from '@/models/segment';
import { buildMongoQuery } from '@/lib/segment-utils';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const total = await Campaign.countDocuments(filter);
    const campaigns = await Campaign.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const customSegments = await Segment.find({}).lean();
    const mappedCampaigns = campaigns.map((campaign) => {
      let targetSegmentName = campaign.targetSegment;
      if (mongoose.Types.ObjectId.isValid(campaign.targetSegment)) {
        const seg = customSegments.find((s) => s._id.toString() === campaign.targetSegment);
        if (seg) targetSegmentName = seg.name;
      } else {
        targetSegmentName = targetSegmentName.replace('_', ' ');
      }
      return { ...campaign, targetSegmentName };
    });

    return NextResponse.json({
      success: true,
      data: mappedCampaigns,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Campaigns GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    let audienceSize = 0;
    if (body.targetSegment) {
      if (mongoose.Types.ObjectId.isValid(body.targetSegment)) {
        const customSegment = await Segment.findById(body.targetSegment);
        if (customSegment) {
          const query = buildMongoQuery(customSegment.rules);
          audienceSize = await Customer.countDocuments({ ...query, status: 'active' });
        }
      } else {
        audienceSize = await Customer.countDocuments({ segment: body.targetSegment, status: 'active' });
      }
    }

    const campaign = new Campaign({
      ...body,
      audienceSize,
      schedule: {
        ...body.schedule,
        startDate: body.schedule?.startDate ? new Date(body.schedule.startDate) : new Date(),
        endDate: body.schedule?.endDate ? new Date(body.schedule.endDate) : null,
        timezone: body.schedule?.timezone || 'Asia/Kolkata',
      },
      metrics: { sent: 0, delivered: 0, read: 0, opened: 0, clicked: 0, converted: 0, failed: 0, revenue: 0 },
      createdBy: 'admin',
    });

    await campaign.save();

    return NextResponse.json({ success: true, data: campaign }, { status: 201 });
  } catch (error) {
    console.error('Campaigns POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
