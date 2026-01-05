import styles from './disconnect-button.module.scss';

interface DisconnectButtonProps {
  onDisconnect: () => void;
}

export function DisconnectButton({
  onDisconnect,
}: DisconnectButtonProps) {
  return (
    <div className={styles.container}>
      <button
        onClick={onDisconnect}
        className={styles.button}
      >
        Disconnect
      </button>
    </div>
  );
}

