import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import VendorJob from '@/models/vendor-job';
import { v4 as uuidv4 } from 'uuid';

// Simulating external vendor's webhook processing worker
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Find up to 50 jobs that are ready for their next action
    const now = new Date();
    const jobs = await VendorJob.find({
      nextActionAt: { $lte: now },
      status: { $nin: ['failed', 'clicked'] } // Terminal states or states with no next action
    }).limit(50);

    if (jobs.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: 'Queue is empty' });
    }

    let processedCount = 0;

    for (const job of jobs) {
      let nextStatus = job.status;
      let delayUntilNext = 0;

      // Determine next state based on realistic probabilities
      if (job.status === 'pending') {
        const deliveryRate = 0.94; // 94% delivery rate
        nextStatus = Math.random() < deliveryRate ? 'delivered' : 'failed';
        // If delivered, maybe read after 2-5 seconds
        delayUntilNext = nextStatus === 'delivered' ? 2000 + Math.random() * 3000 : 0;
      } else if (job.status === 'delivered') {
        const readRate = 0.85; // 85% read rate
        if (Math.random() < readRate) {
          nextStatus = 'read';
          // If read, maybe open after 3-10 seconds
          delayUntilNext = 3000 + Math.random() * 7000;
        } else {
          delayUntilNext = 1000 * 60 * 60 * 24 * 365 * 10; // Terminal delivered
        }
      } else if (job.status === 'read') {
        const openRate = 0.45; // 45% open rate of those read
        if (Math.random() < openRate) {
          nextStatus = 'opened';
          // If opened, maybe click after 5-15 seconds
          delayUntilNext = 5000 + Math.random() * 10000;
        } else {
          delayUntilNext = 1000 * 60 * 60 * 24 * 365 * 10; // Terminal read
        }
      } else if (job.status === 'opened') {
        const clickRate = 0.25; // 25% click rate
        if (Math.random() < clickRate) {
          nextStatus = 'clicked';
        } else {
          delayUntilNext = 1000 * 60 * 60 * 24 * 365 * 10; // Terminal opened
        }
      }

      // Generate a unique event ID for idempotency on the CRM side
      const eventId = `evt_${uuidv4()}`;

      // Dispatch Webhook to CRM
      const payload = {
        eventId,
        communicationId: job.communicationId,
        campaignId: job.campaignId,
        status: nextStatus,
        timestamp: new Date().toISOString(),
        metadata: {
          vendorReason: nextStatus === 'failed' ? 'Carrier rejection' : null
        }
      };

      try {
        const response = await fetch(job.callbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          // Webhook delivered successfully, update the job
          job.status = nextStatus as any;
          job.nextActionAt = new Date(Date.now() + delayUntilNext);
          job.retries = 0;
          await job.save();
          processedCount++;
        } else {
          // Webhook failed (e.g. CRM is down), schedule a retry
          job.retries += 1;
          job.nextActionAt = new Date(Date.now() + 5000 * job.retries); // Exponential backoff
          await job.save();
        }
      } catch (err) {
        // Network error reaching CRM
        job.retries += 1;
        job.nextActionAt = new Date(Date.now() + 5000 * job.retries);
        await job.save();
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: processedCount,
      message: `Processed ${processedCount}/${jobs.length} vendor jobs` 
    });

  } catch (error) {
    console.error('Vendor process queue error:', error);
    return NextResponse.json({ success: false, message: 'Vendor Service Error' }, { status: 500 });
  }
}
