import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import VendorJob from '@/models/vendor-job';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { batch } = await request.json();

    if (!batch || !Array.isArray(batch) || batch.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    const jobs = batch.map((item: any) => ({
      communicationId: item.communicationId,
      campaignId: item.campaignId,
      callbackUrl: item.callbackUrl,
      status: 'pending',
      // Random delay between 1 and 3 seconds before first webhook (delivery)
      nextActionAt: new Date(Date.now() + 1000 + Math.random() * 2000), 
      retries: 0
    }));

    await VendorJob.insertMany(jobs);

    return NextResponse.json({ 
      success: true, 
      accepted: jobs.length,
      message: 'Batch accepted for processing' 
    }, { status: 202 });
  } catch (error) {
    console.error('Vendor send error:', error);
    return NextResponse.json({ success: false, message: 'Vendor Service Error' }, { status: 500 });
  }
}
