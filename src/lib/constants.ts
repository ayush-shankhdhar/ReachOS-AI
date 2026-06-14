export const APP_NAME = 'XenoPilot AI';
export const APP_DESCRIPTION = 'AI-Native Marketing CRM';

export const SEGMENTS = [
  { key: 'high_value', name: 'High Value', description: 'Customers with high lifetime value', icon: 'Crown', color: '#f59e0b' },
  { key: 'inactive', name: 'Inactive', description: 'Customers with no recent activity', icon: 'Moon', color: '#64748b' },
  { key: 'frequent_buyer', name: 'Frequent Buyers', description: 'Customers who purchase regularly', icon: 'ShoppingBag', color: '#10b981' },
  { key: 'churn_risk', name: 'Churn Risk', description: 'Customers likely to leave', icon: 'AlertTriangle', color: '#ef4444' },
  { key: 'new', name: 'New Customers', description: 'Recently acquired customers', icon: 'Sparkles', color: '#8b5cf6' },
] as const;

export const CAMPAIGN_TYPES = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push Notification' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'multi_channel', label: 'Multi-Channel' },
] as const;

export const CAMPAIGN_STATUSES = [
  { value: 'draft', label: 'Draft', color: '#64748b' },
  { value: 'scheduled', label: 'Scheduled', color: '#f59e0b' },
  { value: 'active', label: 'Active', color: '#10b981' },
  { value: 'paused', label: 'Paused', color: '#f59e0b' },
  { value: 'completed', label: 'Completed', color: '#8b5cf6' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
] as const;

export const CHANNELS = ['email', 'sms', 'push', 'whatsapp'] as const;

export const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/customers', label: 'Customers', icon: 'Users' },
  { href: '/orders', label: 'Orders', icon: 'ShoppingCart' },
  { href: '/copilot', label: 'AI Copilot', icon: 'Bot' },
  { href: '/campaigns', label: 'Campaigns', icon: 'Megaphone' },
  { href: '/segments', label: 'Segments', icon: 'PieChart' },
  { href: '/channels', label: 'Channels', icon: 'Radio' },
  { href: '/analytics', label: 'Analytics', icon: 'BarChart3' },
] as const;

export const ITEMS_PER_PAGE = 20;

export const PRODUCT_CATEGORIES = [
  'Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Sports',
  'Books', 'Toys', 'Health', 'Automotive', 'Grocery',
];

export const CITIES = [
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Bangalore', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
];

export const COMPANIES = [
  'TechNova Solutions', 'CloudBridge Inc', 'DataPulse Analytics', 'NexGen Systems',
  'QuantumLeap Tech', 'VelocityAI Labs', 'PixelForge Studio', 'CyberEdge Security',
  'GreenWave Energy', 'SkyNet Logistics', 'BlueOcean Commerce', 'RedShift Media',
  'StarLight Ventures', 'IronClad Solutions', 'SwiftStream Digital',
];

export const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan',
  'Krishna', 'Ishaan', 'Ananya', 'Diya', 'Myra', 'Sara', 'Aadhya', 'Isha',
  'Kiara', 'Riya', 'Priya', 'Neha', 'Rohan', 'Karan', 'Rahul', 'Amit',
  'Shreya', 'Pooja', 'Meera', 'Kavya', 'Tanvi', 'Sanya',
];

export const LAST_NAMES = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Mehta', 'Joshi', 'Reddy',
  'Nair', 'Iyer', 'Verma', 'Rao', 'Das', 'Kapoor', 'Malhotra', 'Agarwal',
  'Chopra', 'Bose', 'Pillai', 'Menon',
];

export const PRODUCTS = [
  { name: 'Wireless Earbuds Pro', category: 'Electronics', price: 2999 },
  { name: 'Smart Watch Ultra', category: 'Electronics', price: 14999 },
  { name: 'Laptop Stand Ergonomic', category: 'Electronics', price: 1999 },
  { name: 'Premium Leather Jacket', category: 'Fashion', price: 8999 },
  { name: 'Running Shoes Elite', category: 'Sports', price: 5999 },
  { name: 'Organic Face Serum', category: 'Beauty', price: 1299 },
  { name: 'Air Purifier HD', category: 'Home & Kitchen', price: 12999 },
  { name: 'Yoga Mat Premium', category: 'Sports', price: 1499 },
  { name: 'Coffee Maker Deluxe', category: 'Home & Kitchen', price: 4999 },
  { name: 'Bestseller Novel Collection', category: 'Books', price: 899 },
  { name: 'Gaming Mouse RGB', category: 'Electronics', price: 2499 },
  { name: 'Cotton Kurta Set', category: 'Fashion', price: 3499 },
  { name: 'Protein Supplement', category: 'Health', price: 2199 },
  { name: 'Bluetooth Speaker', category: 'Electronics', price: 3999 },
  { name: 'Stainless Steel Bottle', category: 'Home & Kitchen', price: 699 },
];
