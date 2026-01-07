const BASE_URL = 'http://localhost:4000';

export interface UserInfo {
  email: string;
  name: string;
  picture?: string;
}

export interface DeleteTodayResponse {
  trashedCount: number;
  queryUsed: string;
  dryRun: boolean;
  sample: Array<{
    id: string;
    subject: string;
    from: string;
    date: string;
  }>;
}

export interface ActionPlan {
  intent: 'DELETE_EMAILS' | 'ARCHIVE_EMAILS' | 'LABEL_EMAILS';
  params: {
    query: string;
    labelName?: string;
    maxResults?: number; // Optional limit (capped at 50 for safety)
  };
  estimatedImpact: {
    count: number;
    sample: Array<{
      subject: string;
      from: string;
      date: string;
    }>;
  };
  explanation: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
}

export interface ChatResponse {
  plan: ActionPlan;
}

export interface ExecuteResponse {
  success: boolean;
  action: string;
  emailsAffected: number;
  sample: Array<{
    subject: string;
    from: string;
    date: string;
  }>;
  message: string;
}

export async function getUserInfo(jwt: string): Promise<UserInfo> {
  const response = await fetch(`${BASE_URL}/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function deleteTodayEmails(
  jwt: string,
  dryRun: boolean = true,
  newest: boolean = false
): Promise<DeleteTodayResponse> {
  const params = new URLSearchParams();
  if (dryRun) params.append('dryRun', 'true');
  if (newest) params.append('newest', 'true');

  const response = await fetch(`${BASE_URL}/gmail/delete-today?${params.toString()}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function chat(jwt: string, message: string): Promise<ChatResponse> {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function executePlan(jwt: string, plan: ActionPlan): Promise<ExecuteResponse> {
  // Calculate execution cap to determine if confirmation is needed
  const cap = Math.min(plan.params?.maxResults ?? 50, 50);
  const requiresConfirm = 
    (plan.intent === 'DELETE_EMAILS' && cap > 1) ||
    (plan.risk === 'HIGH' && cap > 1);

  // Debug logging
  console.log('🔍 Frontend Execute Debug:', {
    intent: plan.intent,
    risk: plan.risk,
    maxResults: plan.params?.maxResults,
    cap,
    requiresConfirm,
  });

  const requestBody: { plan: ActionPlan; confirm?: boolean } = { 
    plan,
  };
  
  // Only include confirm if it's required (don't send undefined)
  if (requiresConfirm) {
    requestBody.confirm = true;
  }

  const response = await fetch(`${BASE_URL}/execute`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}
