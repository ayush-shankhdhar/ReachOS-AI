import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  company: z.string().min(1, 'Company is required'),
  segment: z.enum(['high_value', 'inactive', 'frequent_buyer', 'churn_risk', 'new']).optional(),
  status: z.enum(['active', 'inactive', 'churned']).optional(),
  tags: z.array(z.string()).optional(),
  preferredChannel: z.enum(['email', 'sms', 'push', 'whatsapp']).optional(),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

export const orderSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  items: z.array(z.object({
    name: z.string().min(1),
    category: z.string().min(1),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    totalPrice: z.number().min(0),
  })).min(1, 'At least one item is required'),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  discount: z.number().min(0).optional(),
  total: z.number().min(0),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet']),
  channel: z.enum(['website', 'mobile_app', 'in_store', 'phone']),
});

export const campaignSchema = z.object({
  name: z.string().min(3, 'Campaign name must be at least 3 characters'),
  description: z.string().optional(),
  type: z.enum(['email', 'sms', 'push', 'whatsapp', 'multi_channel']),
  goal: z.string().min(1, 'Goal is required'),
  targetSegment: z.string().min(1, 'Target segment is required'),
  channel: z.enum(['email', 'sms', 'push', 'whatsapp']),
  message: z.object({
    subject: z.string().min(1, 'Subject is required'),
    body: z.string().min(1, 'Message body is required'),
    template: z.string().optional(),
  }),
  schedule: z.object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional().nullable(),
    timezone: z.string().optional(),
  }),
  budget: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
});

export const copilotSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  context: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
export type OrderFormData = z.infer<typeof orderSchema>;
export type CampaignFormData = z.infer<typeof campaignSchema>;
export type CopilotFormData = z.infer<typeof copilotSchema>;
