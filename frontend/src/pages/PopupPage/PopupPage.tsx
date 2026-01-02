import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useDeleteEmails } from '../../hooks/useDeleteEmails';
import { Header } from './components/Header/Header';
import { LoadingSpinner } from './components/LoadingSpinner/LoadingSpinner';
import { ErrorBanner } from './components/ErrorBanner/ErrorBanner';
import { ConnectButton } from './components/ConnectButton/ConnectButton';
import { UserInfo } from './components/UserInfo/UserInfo';
import { ChatSection } from './components/ChatSection/ChatSection';
import { ActionButtons } from './components/ActionButtons/ActionButtons';
import { DeleteResult } from './components/DeleteResult/DeleteResult';
import styles from './popup-page.module.scss';

export function PopupPage() {
  const { jwt, user, loading, error: authError, connectGoogle, disconnect } = useAuth();
  const { messages, loading: chatLoading, error: chatError, sendMessage, cancelPlan, clearMessages } = useChat(jwt);
  const { result: deleteResult, loading: deleting, error: deleteError, dryRunDelete, clearResult } = useDeleteEmails(jwt);

  // Combine all errors
  const error = authError || chatError || deleteError;

  // Clear chat and delete results on disconnect
  React.useEffect(() => {
    if (!user) {
      clearMessages();
      clearResult();
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
              loading={chatLoading}
            />

            <ActionButtons
              onDryRunDelete={dryRunDelete}
              onDisconnect={disconnect}
              deleting={deleting}
            />

            {deleteResult && <DeleteResult result={deleteResult} />}
          </>
        )}
      </div>
    </div>
  );
}

