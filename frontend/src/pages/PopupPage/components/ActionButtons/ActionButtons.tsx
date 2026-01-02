import React from 'react';
import styles from './action-buttons.module.scss';

interface ActionButtonsProps {
  onDryRunDelete: () => void;
  onDisconnect: () => void;
  deleting: boolean;
}

export function ActionButtons({
  onDryRunDelete,
  onDisconnect,
  deleting,
}: ActionButtonsProps) {
  return (
    <div className={styles.actions}>
      <button
        onClick={onDryRunDelete}
        disabled={deleting}
        className={`${styles.button} ${styles.buttonPrimary}`}
      >
        {deleting ? 'Deleting...' : 'Dry-run Delete Today'}
      </button>

      <button
        onClick={onDisconnect}
        className={`${styles.button} ${styles.buttonSecondary}`}
      >
        Disconnect
      </button>
    </div>
  );
}

