import React from 'react';
import { ActionPlan } from '../api';

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
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>{intentLabels[plan.intent]}</h3>
        <span
          style={{
            ...styles.riskBadge,
            background: riskColors[plan.risk],
          }}
        >
          {plan.risk} Risk
        </span>
      </div>

      <p style={styles.explanation}>{plan.explanation}</p>

      <div style={styles.details}>
        <div style={styles.detailRow}>
          <strong>Query:</strong> <code style={styles.query}>{plan.params.query}</code>
        </div>
        {plan.params.labelName && (
          <div style={styles.detailRow}>
            <strong>Label:</strong> {plan.params.labelName}
          </div>
        )}
        <div style={styles.detailRow}>
          <strong>Estimated Count:</strong> {plan.estimatedImpact.count} emails
        </div>
        <div style={styles.detailRow}>
          <strong>Confidence:</strong> {Math.round(plan.confidence * 100)}%
        </div>
      </div>

      {plan.estimatedImpact.sample.length > 0 && (
        <div style={styles.sample}>
          <strong>Sample Emails:</strong>
          <ul style={styles.sampleList}>
            {plan.estimatedImpact.sample.map((email, index) => (
              <li key={index} style={styles.sampleItem}>
                <div style={styles.emailSubject}>{email.subject || '(No subject)'}</div>
                <div style={styles.emailMeta}>
                  From: {email.from} • {email.date}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={styles.actions}>
        <button
          disabled
          style={{ ...styles.button, ...styles.buttonApprove, ...styles.buttonDisabled }}
          title="Coming in Day 7"
        >
          Approve (Coming Day 7)
        </button>
        <button
          onClick={onCancel}
          style={{ ...styles.button, ...styles.buttonCancel }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '16px',
    background: '#f9f9f9',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
  },
  riskBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
  },
  explanation: {
    margin: '12px 0',
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.5',
  },
  details: {
    margin: '12px 0',
    fontSize: '13px',
  },
  detailRow: {
    margin: '6px 0',
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
  },
  query: {
    background: '#e8e8e8',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  sample: {
    marginTop: '16px',
    fontSize: '13px',
  },
  sampleList: {
    margin: '8px 0',
    paddingLeft: '20px',
  },
  sampleItem: {
    margin: '8px 0',
    padding: '8px',
    background: 'white',
    borderRadius: '4px',
  },
  emailSubject: {
    fontWeight: '600',
    marginBottom: '4px',
  },
  emailMeta: {
    fontSize: '11px',
    color: '#666',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
  },
  button: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  buttonApprove: {
    background: '#34a853',
    color: 'white',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  buttonCancel: {
    background: '#ea4335',
    color: 'white',
  },
};

