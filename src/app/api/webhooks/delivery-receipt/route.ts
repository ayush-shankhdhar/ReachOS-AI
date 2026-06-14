import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WebhookEvent from '@/models/webhook-event';
import Communication from '@/models/communication';
import Campaign from '@/models/campaign';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { eventId, communicationId, campaignId, status, timestamp, metadata } = body;

    if (!eventId || !communicationId || !campaignId || !status) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // 1. Idempotency Check: Have we seen this event before?
    const existingEvent = await WebhookEvent.findOne({ eventId });
    if (existingEvent) {
      // Return 200 so the vendor doesn't retry, but don't process it again.
      return NextResponse.json({ success: true, message: 'Event already processed' });
    }

    // 2. Register the event
    await WebhookEvent.create({
      eventId,
      communicationId,
      status,
    });

    // 3. Fetch the target communication
    const communication = await Communication.findById(communicationId);
    if (!communication) {
      return NextResponse.json({ success: false, message: 'Communication not found' }, { status: 404 });
    }

    // 4. State validation / ordering
    // In a real system, we might block 'opened' if it's already 'clicked', etc.
    // For this assignment, we will process the progression: pending -> delivered -> opened -> clicked.
    const validTransitions: Record<string, string[]> = {
      'pending': ['delivered', 'failed'],
      'sent': ['delivered', 'failed'],
      'delivered': ['read', 'opened', 'failed'],
      'read': ['opened', 'failed'],
      'opened': ['clicked'],
      'clicked': [], // Terminal
      'failed': []   // Terminal
    };

    // If the transition isn't strictly ordered, we might still accept it (e.g. if 'sent' event was delayed but 'delivered' arrived)
    // but typically we update the timestamps.
    const updatePayload: any = { status };
    if (status === 'delivered') updatePayload.deliveredAt = new Date(timestamp);
    if (status === 'read') updatePayload.readAt = new Date(timestamp);
    if (status === 'opened') updatePayload.openedAt = new Date(timestamp);
    if (status === 'clicked') updatePayload.clickedAt = new Date(timestamp);
    if (status === 'failed') {
      updatePayload.failedAt = new Date(timestamp);
      updatePayload.failureReason = metadata?.vendorReason || 'Vendor delivery failure';
    }

    await Communication.findByIdAndUpdate(communicationId, { $set: updatePayload });

    // 5. Atomically update campaign metrics using $inc
    // We increment the specific stat so we don't have race conditions when 10,000 webhooks fire concurrently.
    const metricKey = `metrics.${status}`;
    const incPayload: Record<string, number> = { [metricKey]: 1 };

    // If it clicked, we can simulate a conversion (revenue) right here, or let another system handle it.
    // For simplicity, we'll assign a flat conversion probability here too.
    if (status === 'clicked') {
      const converted = Math.random() < 0.2 ? 1 : 0; // 20% of clicks convert
      if (converted) {
        incPayload['metrics.converted'] = 1;
        incPayload['metrics.revenue'] = 500 + Math.random() * 4500;
      }
    }

    await Campaign.findByIdAndUpdate(campaignId, { $inc: incPayload });

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ success: false, message: 'Internal Webhook Error' }, { status: 500 });
  }
}
