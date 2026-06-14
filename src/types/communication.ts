export interface CommunicationMessage {
  subject: string;
  body: string;
}

export interface CommunicationMetadata {
  deviceType: string;
  browser: string;
  location: string;
}

export interface ICommunication {
  _id: string;
  campaignId: string;
  customerId: string;
  channel: 'email' | 'sms' | 'push' | 'whatsapp';
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'bounced';
  message: CommunicationMessage;
  sentAt: Date | string | null;
  deliveredAt: Date | string | null;
  openedAt: Date | string | null;
  clickedAt: Date | string | null;
  failedAt: Date | string | null;
  failureReason: string | null;
  metadata: CommunicationMetadata;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type CommunicationStatus = ICommunication['status'];
export type CommunicationChannel = ICommunication['channel'];
