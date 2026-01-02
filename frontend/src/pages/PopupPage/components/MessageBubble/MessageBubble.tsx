import React from 'react';
import styles from './message-bubble.module.scss';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  text?: string;
}

export function MessageBubble({ role, text }: MessageBubbleProps) {
  return (
    <div
      className={`${styles.bubble} ${
        role === 'user' ? styles.userBubble : styles.assistantBubble
      }`}
    >
      {text}
    </div>
  );
}

