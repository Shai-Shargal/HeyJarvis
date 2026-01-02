import React from 'react';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  text?: string;
}

export function MessageBubble({ role, text }: MessageBubbleProps) {
  return (
    <div
      style={{
        ...styles.bubble,
        ...(role === 'user' ? styles.userBubble : styles.assistantBubble),
      }}
    >
      {text}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  bubble: {
    padding: '10px 14px',
    borderRadius: '12px',
    marginBottom: '8px',
    maxWidth: '80%',
    fontSize: '14px',
    lineHeight: '1.4',
    wordWrap: 'break-word',
  },
  userBubble: {
    background: '#4285f4',
    color: 'white',
    alignSelf: 'flex-end',
    marginLeft: 'auto',
  },
  assistantBubble: {
    background: '#e8e8e8',
    color: '#333',
    alignSelf: 'flex-start',
  },
};

