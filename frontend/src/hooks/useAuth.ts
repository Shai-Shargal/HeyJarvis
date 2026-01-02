import { useState, useEffect } from 'react';
import { getJWT, clearJWT } from '../helpers/storage';
import { getUserInfo, UserInfo } from '../helpers/api';

export function useAuth() {
  const [jwt, setJwt] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();

    // Listen for auth success messages from background
    const messageListener = (message: any) => {
      if (message.type === 'AUTH_SUCCESS') {
        setJwt(message.token);
        loadUserData();
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  async function loadUserData() {
    try {
      setLoading(true);
      setError(null);

      const storedJwt = await getJWT();
      setJwt(storedJwt);

      if (!storedJwt) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Try to get user info
      try {
        const userInfo = await getUserInfo(storedJwt);
        setUser(userInfo);
      } catch (err) {
        // JWT might be invalid, clear it
        console.error('Failed to get user info:', err);
        await clearJWT();
        setJwt(null);
        setUser(null);
        setError('Session expired. Please reconnect.');
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    try {
      await clearJWT();
      setJwt(null);
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Error disconnecting:', err);
      setError('Failed to disconnect');
    }
  }

  function connectGoogle() {
    const BASE_URL = 'http://localhost:4000';
    chrome.tabs.create({
      url: `${BASE_URL}/auth/google/start`,
    });
  }

  return {
    jwt,
    user,
    loading,
    error,
    connectGoogle,
    disconnect,
    reload: loadUserData,
  };
}

