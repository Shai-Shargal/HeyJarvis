import React from 'react';
import { UserInfo as UserInfoType } from '../../../../helpers/api';
import styles from './user-info.module.scss';

interface UserInfoProps {
  user: UserInfoType;
}

export function UserInfo({ user }: UserInfoProps) {
  return (
    <div className={styles.userInfo}>
      <p className={styles.text}>
        <strong>Connected as:</strong>
      </p>
      <p className={styles.text}>{user.email}</p>
      {user.name && <p className={styles.text}>{user.name}</p>}
    </div>
  );
}

