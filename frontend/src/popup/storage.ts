export interface StorageData {
  jwt?: string;
}

const STORAGE_KEY = 'heyjarvis_data';

export async function getJWT(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const data = result[STORAGE_KEY] as StorageData | undefined;
    return data?.jwt || null;
  } catch (error) {
    console.error('Error getting JWT from storage:', error);
    return null;
  }
}

export async function setJWT(token: string): Promise<void> {
  try {
    const data: StorageData = { jwt: token };
    await chrome.storage.local.set({ [STORAGE_KEY]: data });
  } catch (error) {
    console.error('Error setting JWT in storage:', error);
    throw error;
  }
}

export async function clearJWT(): Promise<void> {
  try {
    await chrome.storage.local.remove(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing JWT from storage:', error);
    throw error;
  }
}

