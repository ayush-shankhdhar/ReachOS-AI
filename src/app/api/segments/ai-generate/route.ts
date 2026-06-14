import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.API_KEY || '',
  baseURL: process.env.AI_BASE_URL || 'https://ai.ayushx.tech/v1',
});

const AI_MODEL = process.env.AI_MODEL || 'gemini-3.1-flash-lite-preview';

const RULES_SYSTEM_PROMPT = `You are a CRM Segment compiler. Your task is to translate natural language marketing queries into a structured JSON array of segmentation rules.

Allowed fields:
1. 'totalSpent' (number, representing total money spent in Rupees)
2. 'totalOrders' (number, representing number of orders)
3. 'lastOrderDate' (numeric value representing "days ago". e.g., 30 means 30 days ago. For "purchased in the last 30 days", operator is "lt" value is 30. For "has not purchased in over 90 days", operator is "gt" value is 90)
4. 'location.city' (string, e.g., 'Delhi', 'Mumbai', 'Bangalore', 'Pune', 'Chennai')
5. 'preferredChannel' (string: 'email' | 'sms' | 'push' | 'whatsapp')
6. 'status' (string: 'active' | 'inactive' | 'churned')

Operators allowed:
- 'gt' (greater than)
- 'lt' (less than)
- 'eq' (equals)
- 'gte' (greater than or equal)
- 'lte' (less than or equal)
- 'ne' (not equals)
- 'contains' (partial string match)

Rules:
- Pune, Pune, Bangalore should map to 'location.city'.
- "spent more than 5000" maps to { "field": "totalSpent", "operator": "gt", "value": 5000 }
- "inactive users" maps to { "field": "status", "operator": "eq", "value": "inactive" }
- "has not purchased in 6 months" (180 days) maps to { "field": "lastOrderDate", "operator": "gt", "value": 180 }
- "made at least 5 orders" maps to { "field": "totalOrders", "operator": "gte", "value": 5 }

Return ONLY a valid raw JSON array of objects (no markdown, no backticks, no code block wrappers).
Example Output:
[
  { "field": "location.city", "operator": "eq", "value": "Mumbai" },
  { "field": "totalSpent", "operator": "gt", "value": 10000 }
]`;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, message: 'Prompt is required' }, { status: 400 });
    }

    const response = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: RULES_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 800,
    });

    const reply = response.choices[0]?.message?.content || '[]';
    
    // Parse JSON safely
    const cleanJSON = reply.replace(/```json/g, '').replace(/```/g, '').trim();
    const rules = JSON.parse(cleanJSON);

    return NextResponse.json({
      success: true,
      data: {
        rules,
        explanation: `Compiled segment for: "${prompt}"`
      }
    });
  } catch (error) {
    console.error('Segments AI generation error:', error);
    return NextResponse.json(
      { success: false, message: `Failed to compile prompt: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
