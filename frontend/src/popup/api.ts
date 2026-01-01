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

