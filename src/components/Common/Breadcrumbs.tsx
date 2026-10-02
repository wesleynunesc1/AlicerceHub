import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.84rem',
        color: 'var(--text-muted, #7A8B82)',
        marginBottom: '16px'
      }}
    >
      <button
        type="button"
        onClick={items[0]?.onClick}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          color: 'var(--text-muted, #7A8B82)',
          cursor: items[0]?.onClick ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: 500
        }}
      >
        <Home size={14} />
      </button>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight size={13} style={{ opacity: 0.6 }} />
            {isLast || !item.onClick ? (
              <span
                style={{
                  fontWeight: isLast ? 650 : 500,
                  color: isLast ? 'var(--green-deep, #0B221B)' : 'var(--text-secondary, #4A5B53)'
                }}
              >
                {item.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={item.onClick}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'var(--text-secondary, #4A5B53)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--sand-gold-dark, #8F7249)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary, #4A5B53)')}
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
