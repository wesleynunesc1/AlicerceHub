import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou um erro não tratado:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--cream-bg, #FAF8F5)',
            padding: '24px',
            fontFamily: 'var(--font-sans, "Outfit", sans-serif)'
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#FFFFFF',
              border: '1px solid var(--cream-border, #E6E1D8)',
              borderRadius: 'var(--radius-lg, 16px)',
              padding: '40px 32px',
              textAlign: 'center',
              boxShadow: '0 12px 32px rgba(11, 34, 27, 0.08)'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#FEF2F2',
                color: '#DC2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}
            >
              <AlertTriangle size={32} />
            </div>

            <h1
              className="font-serif"
              style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: 'var(--green-deep, #0B221B)',
                margin: '0 0 12px'
              }}
            >
              Algo deu errado.
            </h1>

            <p
              style={{
                color: 'var(--text-secondary, #4A5B53)',
                fontSize: '0.96rem',
                lineHeight: 1.5,
                margin: '0 0 24px'
              }}
            >
              O sistema encontrou uma instabilidade temporária. Seus dados continuam salvos e seguros no Supabase.
            </p>

            {this.state.error?.message && (
              <div
                style={{
                  background: 'var(--cream-subtle, #F4F1EA)',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  color: 'var(--text-muted, #7A8B82)',
                  textAlign: 'left',
                  maxHeight: '100px',
                  overflowY: 'auto',
                  marginBottom: '24px'
                }}
              >
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  fontWeight: 650
                }}
              >
                <RefreshCw size={16} />
                Tentar novamente
              </button>
              <button
                onClick={this.handleGoHome}
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  fontWeight: 650
                }}
              >
                <Home size={16} />
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
