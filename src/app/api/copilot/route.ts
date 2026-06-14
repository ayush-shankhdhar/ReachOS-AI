import { NextRequest, NextResponse } from 'next/server';
import { generateCopilotResponse } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context, history } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Message is required' },
        { status: 400 }
      );
    }

    const response = await generateCopilotResponse(message, history || [], context);

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Copilot API error:', error);
    return NextResponse.json(
      { success: false, message: 'AI service error. Please try again.' },
      { status: 500 }
    );
  }
}
