import React from 'react';
import { MessageBubble } from '../MessageBubble/MessageBubble';
import { PlanCard } from '../PlanCard/PlanCard';
import { ActionPlan } from '../../../../helpers/api';
import styles from './message-list.module.scss';

export interface Message {
  role: 'user' | 'assistant';
  text?: string;
  plan?: ActionPlan;
}

interface MessageListProps {
  messages: Message[];
  onCancelPlan: () => void;
  onApprovePlan?: (plan: Message['plan']) => void;
  executing?: boolean;
}

export function MessageList({ messages, onCancelPlan, onApprovePlan, executing = false }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>Start a conversation to get an action plan</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {messages.map((message, index) => (
        <div key={index} className={styles.messageWrapper}>
          {message.text && <MessageBubble role={message.role} text={message.text} />}
          {message.plan && (
            <PlanCard 
              plan={message.plan} 
              onCancel={onCancelPlan}
              onApprove={onApprovePlan ? () => {
                console.log('📋 MessageList: Calling onApprovePlan with plan:', message.plan);
                onApprovePlan(message.plan);
              } : undefined}
              executing={executing}
            />
          )}
        </div>
      ))}
    </div>
  );
}

