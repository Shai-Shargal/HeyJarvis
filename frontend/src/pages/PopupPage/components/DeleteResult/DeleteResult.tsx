import React from 'react';
import { DeleteTodayResponse } from '../../../../helpers/api';
import styles from './delete-result.module.scss';

interface DeleteResultProps {
  result: DeleteTodayResponse;
}

export function DeleteResult({ result }: DeleteResultProps) {
  return (
    <div className={styles.result}>
      <h3 className={styles.resultTitle}>Delete Result:</h3>
      <p className={styles.text}>
        <strong>Found:</strong> {result.trashedCount} emails
      </p>
      <p className={styles.text}>
        <strong>Query:</strong> {result.queryUsed}
      </p>
      {result.sample.length > 0 && (
        <div className={styles.sample}>
          <strong>Sample:</strong>
          <ul className={styles.sampleList}>
            {result.sample.map((email) => (
              <li key={email.id} className={styles.sampleItem}>
                {email.subject || '(No subject)'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

