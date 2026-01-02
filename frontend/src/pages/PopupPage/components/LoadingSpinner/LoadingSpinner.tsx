import React from 'react';
import styles from './loading-spinner.module.scss';

export function LoadingSpinner() {
  return (
    <div className={styles.container}>
      <p className={styles.text}>Loading...</p>
    </div>
  );
}

