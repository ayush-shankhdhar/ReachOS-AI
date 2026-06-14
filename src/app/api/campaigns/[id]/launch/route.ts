import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Campaign from '@/models/campaign';
import Communication from '@/models/communication';
import Customer from '@/models/customer';
import Segment from '@/models/segment';
import { buildMongoQuery } from '@/lib/segment-utils';

function interpolate(text: string, data: any): string {
  if (!text) return '';
  return text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const cleanPath = path.trim();
    const parts = cleanPath.split('.');
    let val = data;
    for (const part of parts) {
      if (val && typeof val === 'object' && part in val) {
        val = val[part];
      } else {
        val = undefined;
        break;
      }
    }
    if (val instanceof Date) {
      return val.toLocaleDateString('en-IN', { dateStyle: 'medium' });
    }
    if (typeof val === 'number') {
      if (cleanPath === 'totalSpent' || cleanPath === 'lifetimeValue') {
        return `₹${val.toLocaleString('en-IN')}`;
      }
      return String(val);
    }
    return val !== undefined ? String(val) : match;
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return NextResponse.json({ success: false, message: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status === 'active') {
      return NextResponse.json({ success: false, message: 'Campaign is already active' }, { status: 400 });
    }

    // Determine customer query based on targetSegment
    let filterQuery: Record<string, any> = {};
    let hasCustomStatus = false;

    if (mongoose.Types.ObjectId.isValid(campaign.targetSegment)) {
      const customSegment = await Segment.findById(campaign.targetSegment);
      if (customSegment) {
        filterQuery = buildMongoQuery(customSegment.rules);
        hasCustomStatus = customSegment.rules.some((rule: any) => rule.field === 'status');
      } else {
        return NextResponse.json({ success: false, message: 'Custom segment targeting not found' }, { status: 404 });
      }
    } else {
      filterQuery = { segment: campaign.targetSegment };
    }

    // Only filter for status: 'active' if status is not already specified in custom rules
    if (!hasCustomStatus) {
      filterQuery.status = 'active';
    }

    const customers = await Customer.find(filterQuery).lean();

    if (customers.length === 0) {
      return NextResponse.json({ success: false, message: 'No active customers in target segment' }, { status: 400 });
    }

    // Create communications in 'sent' state with interpolated templates
    const communications = customers.map((customer) => {
      const subject = interpolate(campaign.message.subject, customer);
      const body = interpolate(campaign.message.body, customer);

      return {
        campaignId: campaign._id,
        customerId: customer._id,
        channel: campaign.channel,
        status: 'sent' as const,
        message: {
          subject,
          body,
        },
        sentAt: new Date(),
        metadata: {
          deviceType: 'unknown',
          browser: 'unknown',
          location: customer.location?.city ? `${customer.location.city}, ${customer.location.country || 'India'}` : 'unknown',
        },
      };
    });

    const insertedComms = await Communication.insertMany(communications);

    // Update campaign status and metrics
    campaign.status = 'active';
    campaign.audienceSize = customers.length;
    campaign.metrics = {
      sent: customers.length,
      delivered: 0,
      read: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
      failed: 0,
      revenue: 0,
    };
    await campaign.save();

    const baseUrl = new URL(request.url).origin;
    const callbackUrl = `${baseUrl}/api/webhooks/delivery-receipt`;

    // Construct batch for the Mock Channel Vendor
    const vendorBatch = insertedComms.map((comm) => ({
      communicationId: comm._id.toString(),
      campaignId: campaign._id.toString(),
      callbackUrl,
    }));

    const vendorUrl = `${baseUrl}/api/vendor/channel/send`;
    
    // Call Vendor Service
    const vendorResponse = await fetch(vendorUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch: vendorBatch }),
    });

    if (!vendorResponse.ok) {
      console.warn('Vendor channel service rejected the payload.');
    }

    return NextResponse.json({
      success: true,
      data: campaign,
      message: `Campaign launched to ${customers.length} customers. Personalization and dynamic variable interpolation applied.`,
    });
  } catch (error) {
    console.error('Campaign launch error:', error);
    return NextResponse.json(
      { success: false, message: `Failed to launch campaign: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
