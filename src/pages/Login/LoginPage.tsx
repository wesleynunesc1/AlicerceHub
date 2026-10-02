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
    <div className="login-screen-wrapper">
      {/* Left/Top Architectural Brand Area */}
      <div className="login-brand-panel">
        {/* Discreet decorative lines */}
        <div className="login-decorative-grid" />

        <div className="login-brand-content">
          <div className="login-logo-badge">
            <img
              src="/Ab.png"
              alt="Logo Oficial Alicerce"
              className="login-official-logo"
            />
          </div>

          <div style={{ marginTop: '28px' }}>
            <span
              style={{
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                color: 'var(--sand-gold)',
                fontWeight: 700
              }}
            >
              Central Operacional Interna
            </span>

            <h1
              className="font-serif"
              style={{
                fontSize: '2.8rem',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.15,
                marginTop: '10px',
                marginBottom: '16px',
                letterSpacing: '-0.02em'
              }}
            >
              Alicerce OS
            </h1>

            <p
              style={{
                fontSize: '1.1rem',
                color: 'rgba(255, 255, 255, 0.85)',
                lineHeight: 1.6,
                maxWidth: '440px',
                fontWeight: 450
              }}
            >
              A estrutura por trás da nossa operação. Gestão de clientes, projetos, processos e autoridade de marca.
            </p>
          </div>

          {/* Institutional Quote */}
          <div className="login-manifesto-quote">
            <div style={{ fontStyle: 'italic', color: 'var(--sand-gold-light)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              "A Alicerce estrutura marcas, presença, aquisição e comunicação para negócios que querem crescer com base."
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Alicerce — A estrutura do seu negócio.
            </div>
          </div>
        </div>
      </div>

      {/* Right/Bottom Interactive Access Form */}
      <div className="login-form-panel">
        <div className="login-form-card">
          <div style={{ marginBottom: '28px' }}>
            <h2
              className="font-serif"
              style={{
                fontSize: '2.1rem',
                fontWeight: 700,
                color: 'var(--green-deep)',
                letterSpacing: '-0.015em',
                marginBottom: '6px'
              }}
            >
              Acesse sua conta
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', fontWeight: 450 }}>
              Insira suas credenciais corporativas para entrar na central.
            </p>
          </div>

          {error && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                marginBottom: '22px',
                fontWeight: 500
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email input */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" htmlFor="login-email">
                E-mail corporativo
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                />
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '44px', fontSize: '16px' }}
                  placeholder="seu.email@alicerce.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password input */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" htmlFor="login-password">
                Senha de acesso
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                />
                <input
                  id="login-password"
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '44px', fontSize: '16px' }}
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
                marginBottom: '28px',
                fontSize: '0.88rem'
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--green-primary)' }}
                />
                Manter conectado
              </label>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                style={{
                  color: 'var(--green-primary)',
                  fontWeight: 650,
                  fontSize: '0.88rem'
                }}
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '48px', fontSize: '1rem', gap: '10px' }}
              disabled={isLoading}
            >
              {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Demo helper */}
          <div
            style={{
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid var(--cream-border)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontWeight: 500
              }}
            >
              <ShieldCheck size={15} color="var(--sand-gold-dark)" />
              Ambiente Restrito à Equipe Alicerce
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleFillDemo}
              style={{ width: '100%', padding: '10px 14px', fontSize: '0.84rem' }}
            >
              Preencher credenciais de demonstração (Admin)
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '460px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="card-title font-serif">Redefinir Senha</h3>
            </div>
            <div className="modal-body">
              {forgotSent ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <CheckCircle2 size={46} color="var(--sand-gold)" style={{ marginBottom: '14px' }} />
                  <h4 style={{ marginBottom: '8px', fontSize: '1.2rem' }}>Instruções Enviadas!</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.5 }}>
                    Verifique sua caixa de entrada no e-mail <strong>{forgotEmail}</strong> com o link seguro para restaurar seu acesso.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '18px', lineHeight: 1.5 }}>
                    Informe seu e-mail corporativo cadastrado na Alicerce. Enviaremos um link temporário para restauração de acesso.
                  </p>
                  <div className="form-group">
                    <label className="form-label">E-mail corporativo</label>
                    <input
                      type="email"
                      className="form-input"
                      style={{ fontSize: '16px' }}
                      placeholder="admin@alicerce.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
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
