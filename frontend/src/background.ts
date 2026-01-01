const AUTH_SUCCESS_URL = 'http://localhost:4000/auth/success';

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.startsWith(AUTH_SUCCESS_URL)) {
      handleAuthSuccess(tab.url, tabId);
    }
  }
});

async function handleAuthSuccess(url: string, tabId: number) {
  try {
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get('token');

    if (!token) {
      console.error('No token found in auth success URL');
      return;
    }

    // Save token to storage
    await chrome.storage.local.set({
      heyjarvis_data: { jwt: token },
    });

    console.log('✅ JWT token saved successfully');

    // Close the auth tab
    if (tabId) {
      chrome.tabs.remove(tabId).catch((error) => {
        console.error('Error closing auth tab:', error);
      });
    }

    // Notify popup if it's open
    try {
      await chrome.runtime.sendMessage({
        type: 'AUTH_SUCCESS',
        token,
      });
    } catch (error) {
      // Popup might not be open, that's okay
      console.log('Popup not open, skipping message');
    }
  } catch (error) {
    console.error('Error handling auth success:', error);
  }
}

