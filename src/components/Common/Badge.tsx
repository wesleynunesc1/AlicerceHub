import React from 'react';
import { ClientStatus, ProjectStatus } from '../../types';

interface BadgeProps {
  status: ClientStatus | ProjectStatus | string;
  type?: 'status' | 'service';
}

export const Badge: React.FC<BadgeProps> = ({ status, type = 'status' }) => {
  if (type === 'service') {
    return <span className="badge badge-service">{status}</span>;
  }

  const normalized = status
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');

  return (
    <span className={`badge badge-${normalized}`}>
      <span className="badge-dot" />
      {status}
    </span>
  );
};
