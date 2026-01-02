import React from 'react';
import styles from './header.module.scss';

export function Header() {
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>HeyJarvis</h1>
    </div>
  );
}

