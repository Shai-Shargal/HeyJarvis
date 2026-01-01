import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { getJWT, setJWT, clearJWT } from './storage';
import { getUserInfo, deleteTodayEmails, type UserInfo, type DeleteTodayResponse } from './api';

const BASE_URL = 'http://localhost:4000';

function Popup() {
  const [jwt, setJwt] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteResult, setDeleteResult] = useState<DeleteTodayResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  function handleConnectGoogle() {
    chrome.tabs.create({
      url: `${BASE_URL}/auth/google/start`,
    });
  }

  async function handleDisconnect() {
    try {
      await clearJWT();
      setJwt(null);
      setUser(null);
      setDeleteResult(null);
      setError(null);
    } catch (err) {
      console.error('Error disconnecting:', err);
      setError('Failed to disconnect');
    }
  }

  async function handleDryRunDelete() {
    if (!jwt) {
      setError('Not connected. Please connect Google first.');
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      setDeleteResult(null);

      const result = await deleteTodayEmails(jwt, true, false);
      setDeleteResult(result);
    } catch (err) {
      console.error('Error deleting emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete emails');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>HeyJarvis</h1>
        </div>
        <div style={styles.content}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>HeyJarvis</h1>
      </div>

      <div style={styles.content}>
        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {!user ? (
          <div style={styles.section}>
            <p style={styles.text}>Not connected to Google</p>
            <button onClick={handleConnectGoogle} style={styles.button}>
              Connect Google
            </button>
          </div>
        ) : (
          <div style={styles.section}>
            <div style={styles.userInfo}>
              <p style={styles.text}>
                <strong>Connected as:</strong>
              </p>
              <p style={styles.text}>{user.email}</p>
              {user.name && <p style={styles.text}>{user.name}</p>}
            </div>

            <div style={styles.actions}>
              <button
                onClick={handleDryRunDelete}
                disabled={deleting}
                style={{ ...styles.button, ...styles.buttonPrimary }}
              >
                {deleting ? 'Deleting...' : 'Dry-run Delete Today'}
              </button>

              <button
                onClick={handleDisconnect}
                style={{ ...styles.button, ...styles.buttonSecondary }}
              >
                Disconnect
              </button>
            </div>

            {deleteResult && (
              <div style={styles.result}>
                <h3 style={styles.resultTitle}>Delete Result:</h3>
                <p style={styles.text}>
                  <strong>Found:</strong> {deleteResult.trashedCount} emails
                </p>
                <p style={styles.text}>
                  <strong>Query:</strong> {deleteResult.queryUsed}
                </p>
                {deleteResult.sample.length > 0 && (
                  <div style={styles.sample}>
                    <strong>Sample:</strong>
                    <ul style={styles.sampleList}>
                      {deleteResult.sample.map((email) => (
                        <li key={email.id} style={styles.sampleItem}>
                          {email.subject || '(No subject)'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '400px',
    minHeight: '300px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    background: '#4285f4',
    color: 'white',
    padding: '16px',
    textAlign: 'center',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
  },
  content: {
    padding: '16px',
  },
  section: {
    marginBottom: '16px',
  },
  userInfo: {
    marginBottom: '16px',
    padding: '12px',
    background: '#f5f5f5',
    borderRadius: '8px',
  },
  text: {
    margin: '4px 0',
    fontSize: '14px',
    color: '#333',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  button: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  buttonPrimary: {
    background: '#34a853',
    color: 'white',
  },
  buttonSecondary: {
    background: '#ea4335',
    color: 'white',
  },
  error: {
    padding: '12px',
    background: '#fee',
    color: '#c33',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  result: {
    marginTop: '16px',
    padding: '12px',
    background: '#e8f5e9',
    borderRadius: '6px',
  },
  resultTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '600',
  },
  sample: {
    marginTop: '8px',
  },
  sampleList: {
    margin: '8px 0 0 0',
    paddingLeft: '20px',
  },
  sampleItem: {
    margin: '4px 0',
    fontSize: '13px',
  },
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}

