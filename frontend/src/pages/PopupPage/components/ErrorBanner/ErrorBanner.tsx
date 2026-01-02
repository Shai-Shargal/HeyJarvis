import React from 'react';
import styles from './error-banner.module.scss';

interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return <div className={styles.error}>{message}</div>;
}

