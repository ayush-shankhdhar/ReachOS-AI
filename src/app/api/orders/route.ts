import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/order';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId') || '';
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'orderDate';
    const order = searchParams.get('order') || 'desc';

    const filter: Record<string, unknown> = {};

    if (customerId) filter.customerId = customerId;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) (filter.orderDate as Record<string, unknown>).$gte = new Date(startDate);
      if (endDate) (filter.orderDate as Record<string, unknown>).$lte = new Date(endDate);
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('customerId', 'name email avatar')
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Revenue metrics
    const metrics = await Order.aggregate([
      { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // Monthly trends
    const trends = await Order.aggregate([
      { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$orderDate' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      metrics: metrics[0] || { totalRevenue: 0, avgOrderValue: 0, totalOrders: 0 },
      trends: trends.map((t) => ({ month: t._id, revenue: t.revenue, orders: t.orders })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const lastOrder = await Order.findOne().sort({ orderNumber: -1 }).lean();
    const lastNum = lastOrder ? parseInt(lastOrder.orderNumber.split('-')[2]) : 0;
    const orderNumber = `ORD-2024-${String(lastNum + 1).padStart(4, '0')}`;

    const order = new Order({
      ...body,
      orderNumber,
      orderDate: new Date(),
    });

    await order.save();

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    console.error('Orders POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create order' },
      { status: 500 }
    );
  }
}
