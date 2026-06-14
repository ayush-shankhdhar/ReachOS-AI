export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | string;
  suggestions?: string[];
  campaign?: {
    name: string;
    type: string;
    targetSegment: string;
    message: { subject: string; body: string };
    channel: string;
  };
}

export interface CopilotRequest {
  message: string;
  context?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}
