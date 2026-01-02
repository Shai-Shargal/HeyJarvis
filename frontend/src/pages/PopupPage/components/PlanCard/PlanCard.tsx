import React from 'react';
import { ActionPlan } from '../../../../helpers/api';
import styles from './plan-card.module.scss';

interface PlanCardProps {
  plan: ActionPlan;
  onCancel: () => void;
}

export function PlanCard({ plan, onCancel }: PlanCardProps) {
  const intentLabels: Record<ActionPlan['intent'], string> = {
    DELETE_EMAILS: 'Delete Emails',
    ARCHIVE_EMAILS: 'Archive Emails',
    LABEL_EMAILS: 'Label Emails',
  };

  const riskColors: Record<ActionPlan['risk'], string> = {
    LOW: '#34a853',
    MEDIUM: '#fbbc04',
    HIGH: '#ea4335',
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{intentLabels[plan.intent]}</h3>
        <span
          className={styles.riskBadge}
          style={{ background: riskColors[plan.risk] }}
        >
          {plan.risk} Risk
        </span>
      </div>

      <p className={styles.explanation}>{plan.explanation}</p>

      <div className={styles.details}>
        <div className={styles.detailRow}>
          <strong>Query:</strong> <code className={styles.query}>{plan.params.query}</code>
        </div>
        {plan.params.labelName && (
          <div className={styles.detailRow}>
            <strong>Label:</strong> {plan.params.labelName}
          </div>
        )}
        <div className={styles.detailRow}>
          <strong>Estimated Count:</strong> {plan.estimatedImpact.count} emails
        </div>
        <div className={styles.detailRow}>
          <strong>Confidence:</strong> {Math.round(plan.confidence * 100)}%
        </div>
      </div>

      {plan.estimatedImpact.sample.length > 0 && (
        <div className={styles.sample}>
          <strong>Sample Emails:</strong>
          <ul className={styles.sampleList}>
            {plan.estimatedImpact.sample.map((email, index) => (
              <li key={index} className={styles.sampleItem}>
                <div className={styles.emailSubject}>{email.subject || '(No subject)'}</div>
                <div className={styles.emailMeta}>
                  From: {email.from} • {email.date}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.actions}>
        <button
          disabled
          className={`${styles.button} ${styles.buttonApprove} ${styles.buttonDisabled}`}
          title="Coming in Day 7"
        >
          Approve (Coming Day 7)
        </button>
        <button
          onClick={onCancel}
          className={`${styles.button} ${styles.buttonCancel}`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

