import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { db } from '../../services/db';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@alicerce.com');
  const [password, setPassword] = useState('alicerce2025');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Allow admin credentials or valid email format
      if (email.includes('@')) {
        db.setAuthSession({ isAuthenticated: true, email });
        onLoginSuccess();
      } else {
        setError('E-mail ou senha incorretos.');
      }
      setIsLoading(false);
    }, 450);
  };

  const handleFillDemo = () => {
    setEmail('admin@alicerce.com');
    setPassword('alicerce2025');
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSent(true);
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotSent(false);
      setForgotEmail('');
    }, 2500);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--cream-bg)',
        padding: '24px',
        position: 'relative'
      }}
    >
      {/* Background subtle luxury watermark */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '380px',
          background: 'radial-gradient(ellipse at 50% -20%, #12352B 0%, #0B221B 65%, transparent 100%)',
          opacity: 0.15,
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--cream-card)',
          border: '1px solid var(--cream-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          padding: '40px 36px',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Brand Logo & Presentation */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '6px',
              borderRadius: '16px',
              background: 'var(--green-deep)',
              border: '1px solid var(--sand-gold)',
              boxShadow: '0 8px 24px rgba(11, 34, 27, 0.25)',
              marginBottom: '20px'
            }}
          >
            <img
              src="/Ab.png"
              alt="Logo Oficial Alicerce"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '10px',
                objectFit: 'cover'
              }}
            />
          </div>

          <h1
            className="font-serif"
            style={{
              fontSize: '1.9rem',
              fontWeight: 700,
              color: 'var(--green-deep)',
              letterSpacing: '-0.02em',
              marginBottom: '8px'
            }}
          >
            Bem-vindo ao Alicerce OS
          </h1>

          <p
            style={{
              fontSize: '0.92rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
              maxWidth: '320px',
              margin: '0 auto'
            }}
          >
            A estrutura por trás da nossa operação.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email input */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              E-mail corporativo
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                id="login-email"
                type="email"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="seu.email@alicerce.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" htmlFor="login-password">
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                id="login-password"
                type="password"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Remember me & Forgot Password */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              fontSize: '0.82rem'
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--green-primary)' }}
              />
              Manter conectado
            </label>

            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              style={{
                color: 'var(--green-primary)',
                fontWeight: 600,
                fontSize: '0.82rem'
              }}
            >
              Esqueci minha senha
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '13px', fontSize: '0.95rem', gap: '10px' }}
            disabled={isLoading}
          >
            {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Demo Fast Helper */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--cream-border)',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={14} color="var(--sand-gold)" />
            Acesso Restrito à Equipe Alicerce
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleFillDemo}
            style={{ width: '100%', fontSize: '0.78rem', padding: '8px' }}
          >
            Preencher credenciais de demonstração (Admin)
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="card-title font-serif">Redefinir Senha</h3>
            </div>
            <div className="modal-body">
              {forgotSent ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <CheckCircle2 size={42} color="var(--sand-gold)" style={{ marginBottom: '12px' }} />
                  <h4 style={{ marginBottom: '6px' }}>Instruções Enviadas!</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    Verifique sua caixa de entrada no e-mail <strong>{forgotEmail}</strong> com o link seguro de redefinição.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '16px' }}>
                    Informe seu e-mail corporativo cadastrado na Alicerce. Enviaremos um link temporário para restauração de acesso.
                  </p>
                  <div className="form-group">
                    <label className="form-label">E-mail corporativo</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="admin@alicerce.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowForgotModal(false)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Enviar Link
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
