import React from 'react';
import { MessageList } from '../MessageList/MessageList';
import { ChatInput } from '../ChatInput/ChatInput';
import { Message } from '../MessageList/MessageList';
import styles from './chat-section.module.scss';

interface ChatSectionProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onCancelPlan: () => void;
  loading: boolean;
}

export function ChatSection({
  messages,
  onSendMessage,
  onCancelPlan,
  loading,
}: ChatSectionProps) {
  return (
    <div className={styles.chatSection}>
      <h2 className={styles.sectionTitle}>Chat</h2>
      <MessageList messages={messages} onCancelPlan={onCancelPlan} />
      <ChatInput onSend={onSendMessage} disabled={loading} />
    </div>
  );
}

