import React, { useState } from 'react';
import styles from './chat-input.module.scss';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message... (e.g., 'Delete today's emails')"
        disabled={disabled}
        className={styles.textarea}
        rows={3}
      />
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        className={`${styles.button} ${(disabled || !message.trim()) ? styles.buttonDisabled : ''}`}
      >
        {disabled ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}

