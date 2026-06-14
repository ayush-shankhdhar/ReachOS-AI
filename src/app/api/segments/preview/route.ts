import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/customer';
import { buildMongoQuery } from '@/lib/segment-utils';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { rules } = await request.json();

    if (!rules || !Array.isArray(rules)) {
      return NextResponse.json({ success: false, message: 'Rules array is required' }, { status: 400 });
    }

    const query = buildMongoQuery(rules);
    const count = await Customer.countDocuments(query);
    
    const previewCustomers = await Customer.find(query)
      .sort({ totalSpent: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        count,
        query,
        preview: previewCustomers,
      },
    });
  } catch (error) {
    console.error('Segments preview error:', error);
    return NextResponse.json(
      { success: false, message: `Failed to compile preview: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
