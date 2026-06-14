import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/customer';
import Order from '@/models/order';
import Campaign from '@/models/campaign';
import Communication from '@/models/communication';
import {
  FIRST_NAMES, LAST_NAMES, COMPANIES, CITIES, PRODUCTS, CHANNELS,
} from '@/lib/constants';

function randomElement<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generatePhone(): string {
  return `+91${randomBetween(70000, 99999)}${randomBetween(10000, 99999)}`;
}

export async function POST() {
  try {
    await connectDB();

    // Clear existing data
    await Promise.all([
      Customer.deleteMany({}),
      Order.deleteMany({}),
      Campaign.deleteMany({}),
      Communication.deleteMany({}),
    ]);

    // Generate 50 customers
    const customers = [];
    const usedEmails = new Set<string>();

    for (let i = 0; i < 50; i++) {
      const firstName = randomElement(FIRST_NAMES);
      const lastName = randomElement(LAST_NAMES);
      const name = `${firstName} ${lastName}`;
      let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomBetween(1, 999)}@${randomElement(['gmail.com', 'outlook.com', 'yahoo.com', 'company.com'])}`;

      while (usedEmails.has(email)) {
        email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomBetween(1, 9999)}@${randomElement(['gmail.com', 'outlook.com', 'yahoo.com', 'company.com'])}`;
      }
      usedEmails.add(email);

      const location = randomElement(CITIES);
      const segments: Array<'high_value' | 'inactive' | 'frequent_buyer' | 'churn_risk' | 'new'> = ['high_value', 'inactive', 'frequent_buyer', 'churn_risk', 'new'];
      const statuses: Array<'active' | 'inactive' | 'churned'> = ['active', 'active', 'active', 'inactive', 'churned'];
      const segment = randomElement(segments);
      const status = randomElement(statuses);

      const totalSpent = segment === 'high_value' ? randomBetween(50000, 500000) :
        segment === 'frequent_buyer' ? randomBetween(20000, 100000) :
        segment === 'inactive' ? randomBetween(1000, 10000) :
        segment === 'churn_risk' ? randomBetween(5000, 30000) :
        randomBetween(0, 5000);

      const totalOrders = segment === 'frequent_buyer' ? randomBetween(15, 50) :
        segment === 'high_value' ? randomBetween(5, 20) :
        segment === 'inactive' ? randomBetween(1, 3) :
        randomBetween(1, 10);

      const engagementScore = segment === 'high_value' ? randomBetween(70, 100) :
        segment === 'frequent_buyer' ? randomBetween(60, 90) :
        segment === 'inactive' ? randomBetween(0, 20) :
        segment === 'churn_risk' ? randomBetween(10, 40) :
        randomBetween(30, 70);

      const firstContact = randomDate(new Date('2023-01-01'), new Date('2024-06-01'));
      const lastContact = randomDate(firstContact, new Date());
      const lastOrderDate = status === 'inactive' ? randomDate(new Date('2023-01-01'), new Date('2024-01-01')) :
        randomDate(new Date('2024-06-01'), new Date());

      customers.push({
        name,
        email,
        phone: generatePhone(),
        company: randomElement(COMPANIES),
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=8b5cf6`,
        segment,
        status,
        tags: [
          ...(segment === 'high_value' ? ['vip'] : []),
          ...(totalSpent > 100000 ? ['enterprise'] : []),
          ...(engagementScore > 80 ? ['engaged'] : []),
          ...(Math.random() > 0.5 ? ['newsletter'] : []),
        ],
        totalSpent,
        totalOrders,
        lastOrderDate,
        lifetimeValue: Math.round(totalSpent * 1.3),
        engagementScore,
        preferredChannel: randomElement(CHANNELS),
        location: {
          city: location.city,
          state: location.state,
          country: 'India',
        },
        metadata: {
          source: randomElement(['website', 'referral', 'social', 'ads'] as const),
          firstContactDate: firstContact,
          lastContactDate: lastContact,
          notes: '',
        },
      });
    }

    const savedCustomers = await Customer.insertMany(customers);

    // Generate 200 orders
    const orders = [];
    for (let i = 0; i < 200; i++) {
      const customer = randomElement(savedCustomers);
      const numItems = randomBetween(1, 4);
      const items = [];
      let subtotal = 0;

      for (let j = 0; j < numItems; j++) {
        const product = randomElement(PRODUCTS);
        const quantity = randomBetween(1, 3);
        const totalPrice = product.price * quantity;
        subtotal += totalPrice;
        items.push({
          name: product.name,
          category: product.category,
          quantity,
          unitPrice: product.price,
          totalPrice,
        });
      }

      const tax = Math.round(subtotal * 0.18);
      const discount = Math.random() > 0.7 ? Math.round(subtotal * randomBetween(5, 20) / 100) : 0;
      const total = subtotal + tax - discount;

      const orderDate = randomDate(new Date('2024-01-01'), new Date());
      const statusOptions: Array<'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'> =
        ['delivered', 'delivered', 'delivered', 'shipped', 'confirmed', 'pending', 'cancelled', 'refunded'];
      const orderStatus = randomElement(statusOptions);

      orders.push({
        customerId: customer._id,
        orderNumber: `ORD-2024-${String(i + 1).padStart(4, '0')}`,
        items,
        subtotal,
        tax,
        discount,
        total,
        status: orderStatus,
        paymentMethod: randomElement(['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet'] as const),
        channel: randomElement(['website', 'mobile_app', 'in_store', 'phone'] as const),
        orderDate,
        deliveryDate: orderStatus === 'delivered' ? new Date(orderDate.getTime() + randomBetween(2, 7) * 86400000) : null,
      });
    }

    await Order.insertMany(orders);

    // Generate 15 campaigns
    const campaignNames = [
      'Summer Sale Blast', 'Diwali Special Offers', 'New Year Welcome',
      'Flash Friday Deals', 'Loyalty Rewards Program', 'Abandoned Cart Recovery',
      'Win-Back Inactive Users', 'VIP Exclusive Preview', 'Product Launch Announcement',
      'Festive Season Bundle', 'Customer Appreciation Week', 'Referral Bonus Campaign',
      'Early Bird Access', 'Weekend Flash Sale', 'Monthly Newsletter',
    ];

    const campaigns = [];
    for (let i = 0; i < 15; i++) {
      const channel = randomElement(CHANNELS);
      const statusOptions: Array<'draft' | 'scheduled' | 'active' | 'completed' | 'paused'> =
        ['completed', 'completed', 'completed', 'active', 'active', 'draft', 'scheduled', 'paused'];
      const status = randomElement(statusOptions);
      const audienceSize = randomBetween(500, 5000);
      const sent = status === 'draft' ? 0 : audienceSize;
      const delivered = Math.round(sent * (randomBetween(92, 98) / 100));
      const opened = Math.round(delivered * (randomBetween(20, 45) / 100));
      const clicked = Math.round(opened * (randomBetween(15, 40) / 100));
      const converted = Math.round(clicked * (randomBetween(5, 25) / 100));
      const failed = sent - delivered;

      const segments = ['high_value', 'inactive', 'frequent_buyer', 'churn_risk', 'new'];

      campaigns.push({
        name: campaignNames[i],
        description: `A ${channel} campaign targeting ${randomElement(segments)} customers with personalized ${campaignNames[i].toLowerCase()} messaging.`,
        type: Math.random() > 0.8 ? 'multi_channel' : channel,
        status,
        goal: randomElement([
          'Increase revenue by 20%',
          'Re-engage inactive customers',
          'Drive repeat purchases',
          'Boost brand awareness',
          'Reduce churn rate',
          'Promote new product line',
        ]),
        targetSegment: randomElement(segments),
        audienceSize,
        channel,
        message: {
          subject: `${campaignNames[i]} - Don't Miss Out!`,
          body: `Dear Customer, We're excited to bring you our ${campaignNames[i].toLowerCase()}. Take advantage of exclusive offers tailored just for you. Shop now and save big!`,
          template: randomElement(['promotional', 'newsletter', 'transactional', 'announcement']),
        },
        schedule: {
          startDate: randomDate(new Date('2024-01-01'), new Date()),
          endDate: status === 'completed' ? randomDate(new Date('2024-06-01'), new Date()) : null,
          timezone: 'Asia/Kolkata',
        },
        metrics: {
          sent,
          delivered,
          read: Math.round(delivered * (randomBetween(80, 95) / 100)),
          opened,
          clicked,
          converted,
          failed,
          revenue: converted * randomBetween(500, 5000),
        },
        budget: randomBetween(5000, 100000),
        aiGenerated: Math.random() > 0.6,
        aiPrompt: Math.random() > 0.6 ? `Create a campaign for ${randomElement(segments)} customers` : null,
        tags: [channel, randomElement(['promotional', 'seasonal', 'retention', 'acquisition'])],
        createdBy: 'admin',
      });
    }

    const savedCampaigns = await Campaign.insertMany(campaigns);

    // Generate 500 communications
    const communications = [];
    for (let i = 0; i < 500; i++) {
      const campaign = randomElement(savedCampaigns);
      const customer = randomElement(savedCustomers);
      const channel = campaign.channel;

      const statusFlow: Array<'pending' | 'sent' | 'delivered' | 'read' | 'opened' | 'clicked' | 'failed' | 'bounced'> =
        ['sent', 'sent', 'delivered', 'delivered', 'read', 'read', 'opened', 'opened', 'clicked', 'failed', 'bounced'];
      const status = campaign.status === 'draft' ? 'pending' as const : randomElement(statusFlow);

      const sentAt = status !== 'pending' ? randomDate(new Date('2024-01-01'), new Date()) : null;
      const deliveredAt = ['delivered', 'read', 'opened', 'clicked'].includes(status) && sentAt
        ? new Date(sentAt.getTime() + randomBetween(1000, 5000))
        : null;
      const readAt = ['read', 'opened', 'clicked'].includes(status) && deliveredAt
        ? new Date(deliveredAt.getTime() + randomBetween(2000, 5000))
        : null;
      const openedAt = ['opened', 'clicked'].includes(status) && readAt
        ? new Date(readAt.getTime() + randomBetween(3000, 20000))
        : null;
      const clickedAt = status === 'clicked' && openedAt
        ? new Date(openedAt.getTime() + randomBetween(10000, 60000))
        : null;

      communications.push({
        campaignId: campaign._id,
        customerId: customer._id,
        channel,
        status,
        message: {
          subject: campaign.message.subject,
          body: campaign.message.body,
        },
        sentAt,
        deliveredAt,
        readAt,
        openedAt,
        clickedAt,
        failedAt: status === 'failed' && sentAt ? new Date(sentAt.getTime() + randomBetween(1000, 3000)) : null,
        failureReason: status === 'failed' ? randomElement(['Invalid address', 'Bounced', 'Rate limited', 'Server error']) : null,
        metadata: {
          deviceType: randomElement(['desktop', 'mobile', 'tablet']),
          browser: randomElement(['chrome', 'safari', 'firefox', 'edge']),
          location: `${randomElement(CITIES).city}, India`,
        },
      });
    }

    await Communication.insertMany(communications);

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        customers: savedCustomers.length,
        orders: orders.length,
        campaigns: savedCampaigns.length,
        communications: communications.length,
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, message: `Seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
