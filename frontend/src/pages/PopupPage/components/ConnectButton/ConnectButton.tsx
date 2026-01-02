import React from 'react';
import styles from './connect-button.module.scss';

interface ConnectButtonProps {
  onClick: () => void;
}

export function ConnectButton({ onClick }: ConnectButtonProps) {
  return (
    <div className={styles.section}>
      <p className={styles.text}>Not connected to Google</p>
      <button onClick={onClick} className={styles.button}>
        Connect Google
      </button>
    </div>
  );
}

