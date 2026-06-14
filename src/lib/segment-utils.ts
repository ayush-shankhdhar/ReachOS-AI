import { ISegmentRule } from '@/models/segment';

export function buildMongoQuery(rules: ISegmentRule[]): Record<string, any> {
  if (!rules || rules.length === 0) return {};

  const queryParts: Record<string, any>[] = [];

  for (const rule of rules) {
    const { field, operator, value } = rule;
    if (value === undefined || value === null || value === '') continue;

    let parsedValue: any = value;

    // Handle special fields
    if (field === 'totalSpent' || field === 'totalOrders') {
      parsedValue = Number(value);
      if (isNaN(parsedValue)) parsedValue = 0;
    } else if (field === 'lastOrderDate' || field === 'createdAt') {
      // If value is a string representation of number (like relative days ago: 30)
      if (!isNaN(Number(value))) {
        const days = Number(value);
        // "gt" in relative days means "more than X days ago" (i.e. date < now - X days)
        // Let's compute date threshold
        const dateLimit = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        
        if (operator === 'gt' || operator === 'gte') {
          // Date is OLDER than X days (i.e. less than dateLimit)
          queryParts.push({ [field]: { [operator === 'gt' ? '$lt' : '$lte']: dateLimit } });
        } else if (operator === 'lt' || operator === 'lte') {
          // Date is NEWER than X days (i.e. greater than dateLimit)
          queryParts.push({ [field]: { [operator === 'lt' ? '$gt' : '$gte']: dateLimit } });
        } else {
          queryParts.push({ [field]: dateLimit });
        }
        continue;
      } else {
        parsedValue = new Date(value);
      }
    }

    switch (operator) {
      case 'gt':
        queryParts.push({ [field]: { $gt: parsedValue } });
        break;
      case 'lt':
        queryParts.push({ [field]: { $lt: parsedValue } });
        break;
      case 'gte':
        queryParts.push({ [field]: { $gte: parsedValue } });
        break;
      case 'lte':
        queryParts.push({ [field]: { $lte: parsedValue } });
        break;
      case 'eq':
        if (typeof parsedValue === 'string') {
          queryParts.push({ [field]: { $regex: `^${escapeRegExp(parsedValue)}$`, $options: 'i' } });
        } else {
          queryParts.push({ [field]: parsedValue });
        }
        break;
      case 'ne':
        if (typeof parsedValue === 'string') {
          queryParts.push({ [field]: { $not: { $regex: `^${escapeRegExp(parsedValue)}$`, $options: 'i' } } });
        } else {
          queryParts.push({ [field]: { $ne: parsedValue } });
        }
        break;
      case 'contains':
        queryParts.push({ [field]: { $regex: escapeRegExp(String(parsedValue)), $options: 'i' } });
        break;
      default:
        queryParts.push({ [field]: parsedValue });
    }
  }

  if (queryParts.length === 0) return {};
  if (queryParts.length === 1) return queryParts[0];
  return { $and: queryParts };
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
