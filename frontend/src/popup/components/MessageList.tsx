import React from 'react';
import { MessageBubble } from './MessageBubble';
import { PlanCard } from './PlanCard';
import { ActionPlan } from '../api';

export interface Message {
  role: 'user' | 'assistant';
  text?: string;
  plan?: ActionPlan;
}

interface MessageListProps {
  messages: Message[];
  onCancelPlan: () => void;
}

export function MessageList({ messages, onCancelPlan }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div style={styles.empty}>
        <p style={styles.emptyText}>Start a conversation to get an action plan</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {messages.map((message, index) => (
        <div key={index} style={styles.messageWrapper}>
          {message.text && <MessageBubble role={message.role} text={message.text} />}
          {message.plan && <PlanCard plan={message.plan} onCancel={onCancelPlan} />}
        </div>
      ))}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  messageWrapper: {
    display: 'flex',
    flexDirection: 'column',
  },
  empty: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#999',
  },
  emptyText: {
    margin: 0,
    fontSize: '14px',
  },
};

