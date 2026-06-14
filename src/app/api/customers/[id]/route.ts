import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/customer';
import Order from '@/models/order';
import Communication from '@/models/communication';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const customer = await Customer.findById(id).lean();
    if (!customer) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    const orders = await Order.find({ customerId: id }).sort({ orderDate: -1 }).limit(10).lean();
    const communications = await Communication.find({ customerId: id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('campaignId', 'name')
      .lean();

    const journey = [
      ...orders.map((o) => ({
        type: 'order' as const,
        title: `Order ${o.orderNumber}`,
        description: `₹${o.total.toLocaleString()} — ${o.status}`,
        date: o.orderDate,
        status: o.status,
      })),
      ...communications.map((c) => ({
        type: 'communication' as const,
        title: `${c.channel.toUpperCase()} ${c.status}`,
        description: c.message.subject || 'Campaign message',
        date: c.sentAt || c.createdAt,
        status: c.status,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      data: { ...customer, orders, journey },
    });
  } catch (error) {
    console.error('Customer GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch customer' },
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

    const customer = await Customer.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
    if (!customer) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    console.error('Customer PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update customer' },
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

    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    console.error('Customer DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
