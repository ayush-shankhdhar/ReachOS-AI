import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.API_KEY || '',
  baseURL: process.env.AI_BASE_URL || 'https://ai.ayushx.tech/v1',
});

const AI_MODEL = process.env.AI_MODEL || 'gemini-3.1-flash-lite-preview';

const SYSTEM_PROMPT = `You are XenoPilot AI, an expert marketing copilot for a CRM platform. You help marketing teams create effective campaigns, analyze customer data, and optimize engagement strategies.

Your capabilities:
1. **Campaign Creation**: Generate complete campaign strategies with target segments, messaging, and channel recommendations
2. **Audience Insights**: Analyze customer segments and recommend targeting strategies
3. **Message Generation**: Create compelling marketing messages for email, SMS, push notifications, and WhatsApp
4. **Channel Optimization**: Recommend the best channels based on audience behavior
5. **Performance Prediction**: Estimate campaign outcomes based on historical data

When generating campaigns, always structure your response with:
- Campaign name
- Target segment
- Channel recommendation
- Message subject and body
- Expected outcomes

Be concise, data-driven, and actionable. Use marketing best practices.
Format responses with clear headers and bullet points for readability.`;

export async function generateCopilotResponse(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[] = [],
  context?: string
): Promise<{
  reply: string;
  suggestions: string[];
  campaign?: {
    name: string;
    type: string;
    targetSegment: string;
    message: { subject: string; body: string };
    channel: string;
  };
}> {
  try {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT + (context ? `\n\nCurrent context: ${context}` : '') },
      ...history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await client.chat.completions.create({
      model: AI_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const reply = response.choices[0]?.message?.content || 'I apologize, I was unable to generate a response. Please try again.';

    const isCampaignRequest = /campaign|create|launch|send|blast|promote/i.test(message);
    let campaign = undefined;

    if (isCampaignRequest) {
      const campaignMessages: OpenAI.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `Based on the conversation, extract or generate a campaign configuration. Return ONLY a valid JSON object (no markdown, no code blocks) with these exact fields:
{
  "name": "campaign name",
  "type": "email|sms|push|whatsapp",
  "targetSegment": "high_value|inactive|frequent_buyer|churn_risk|new",
  "message": { "subject": "email subject", "body": "message body" },
  "channel": "email|sms|push|whatsapp"
}`,
        },
        { role: 'user', content: `User request: ${message}\n\nAI Response: ${reply}` },
      ];

      try {
        const campaignResponse = await client.chat.completions.create({
          model: AI_MODEL,
          messages: campaignMessages,
          temperature: 0.3,
          max_tokens: 500,
        });

        const campaignText = campaignResponse.choices[0]?.message?.content || '';
        const jsonMatch = campaignText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          campaign = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Campaign extraction failed, that's okay
      }
    }

    const suggestions = generateSuggestions(message, reply);

    return { reply, suggestions, campaign };
  } catch (error) {
    console.error('AI Copilot error:', error);
    return {
      reply: 'I encountered an issue processing your request. Please check your AI configuration and try again.',
      suggestions: [
        'Create an email campaign',
        'Show me customer segments',
        'Generate a promotional message',
      ],
    };
  }
}

function generateSuggestions(userMessage: string, reply: string): string[] {
  const lowerMsg = userMessage.toLowerCase();
  const lowerReply = reply.toLowerCase();

  if (lowerMsg.includes('campaign') || lowerReply.includes('campaign')) {
    return [
      'Launch this campaign now',
      'Modify the target audience',
      'Generate alternative messages',
      'Predict campaign performance',
    ];
  }

  if (lowerMsg.includes('segment') || lowerReply.includes('segment')) {
    return [
      'Create a campaign for this segment',
      'Show churn risk customers',
      'Compare segment performance',
      'Recommend engagement strategy',
    ];
  }

  if (lowerMsg.includes('message') || lowerMsg.includes('email') || lowerMsg.includes('sms')) {
    return [
      'Generate A/B test variants',
      'Optimize for higher open rates',
      'Create a follow-up message',
      'Translate to regional languages',
    ];
  }

  return [
    'Create a new campaign',
    'Analyze customer segments',
    'Generate marketing messages',
    'Show performance insights',
  ];
}
