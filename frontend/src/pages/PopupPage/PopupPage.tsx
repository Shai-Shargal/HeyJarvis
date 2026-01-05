import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { Header } from './components/Header/Header';
import { LoadingSpinner } from './components/LoadingSpinner/LoadingSpinner';
import { ErrorBanner } from './components/ErrorBanner/ErrorBanner';
import { ConnectButton } from './components/ConnectButton/ConnectButton';
import { UserInfo } from './components/UserInfo/UserInfo';
import { ChatSection } from './components/ChatSection/ChatSection';
import { DisconnectButton } from './components/DisconnectButton/DisconnectButton';
// @ts-ignore: Missing CSS module type declaration
import styles from './popup-page.module.scss';

export function PopupPage() {
  const { jwt, user, loading, error: authError, connectGoogle, disconnect } = useAuth();
  const { messages, loading: chatLoading, error: chatError, executing, sendMessage, cancelPlan, clearMessages, executeActionPlan } = useChat(jwt);

  // Combine all errors
  const error = authError || chatError;

  // Clear chat on disconnect
  React.useEffect(() => {
    if (!user) {
      clearMessages();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.content}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.content}>
        {error && <ErrorBanner message={error} />}

        {!user ? (
          <ConnectButton onClick={connectGoogle} />
        ) : (
          <>
            <UserInfo user={user} />

            <ChatSection
              messages={messages}
              onSendMessage={sendMessage}
              onCancelPlan={cancelPlan}
              onApprovePlan={executeActionPlan}
              loading={chatLoading}
              executing={executing}
            />

            <DisconnectButton
              onDisconnect={disconnect}
            />
          </>
        )}
      </div>
    </div>
  );
}

