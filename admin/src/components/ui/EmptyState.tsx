import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <h3 style={{ margin: '0 0 0.4rem', color: 'var(--text)' }}>{title}</h3>
      {description ? <p style={{ margin: '0 0 1rem' }}>{description}</p> : null}
      {action}
    </div>
  );
}
