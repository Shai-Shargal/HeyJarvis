export type Intent = 'DELETE_EMAILS' | 'ARCHIVE_EMAILS' | 'LABEL_EMAILS';

export interface EmailSample {
  subject: string;
  from: string;
  date: string;
}

export interface EstimatedImpact {
  count: number; // 0..1000
  sample: EmailSample[]; // 0..3 items
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ActionPlan {
  intent: Intent;
  params: {
    query: string; // Gmail search query
    labelName?: string; // For LABEL_EMAILS
    maxResults?: number; // Optional limit (capped at 50 for safety)
  };
  estimatedImpact: EstimatedImpact;
  explanation: string;
  risk: RiskLevel;
  confidence: number; // 0..1
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  plan: ActionPlan;
}

