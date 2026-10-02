import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, User, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/auth';
import { db } from '../../services/db';

interface RegisterPageProps {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onRegisterSuccess,
  onNavigateToLogin
}) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!nome.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem. Digite novamente.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.signUp(nome.trim(), email.trim(), password);

      if (res.success) {
        if (res.session) {
          db.setAuthSession({ isAuthenticated: true, email: email.trim() });
          if (res.profile) {
            db.saveUser(res.profile);
          }
          setSuccessMsg('Conta criada com sucesso! Entrando no sistema...');
          setTimeout(() => {
            onRegisterSuccess();
          }, 900);
        } else {
          // Caso a confirmação de e-mail esteja ativada no Supabase
          setSuccessMsg('Conta criada com sucesso! Verifique seu e-mail para confirmar seu cadastro ou faça login.');
          setTimeout(() => {
            onNavigateToLogin();
          }, 2000);
        }
      } else {
        setError(res.error || 'Não foi possível concluir o cadastro.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao conectar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-screen-wrapper">
      {/* Left/Top Architectural Brand Area */}
      <div className="login-brand-panel">
        <div className="login-decorative-grid" />

        <div className="login-brand-content">
          <div className="login-logo-badge" style={{ background: 'transparent', border: 'none', padding: 0 }}>
            <img
              src="/logo.png"
              alt="Logo Oficial Alicerce"
              style={{ maxHeight: '42px', maxWidth: '200px', objectFit: 'contain' }}
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
              Operação & Estratégia
            </span>
            <h1
              className="font-serif"
              style={{
                fontSize: '2.4rem',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.15,
                marginTop: '12px',
                letterSpacing: '0.01em'
              }}
            >
              Estrutura para negócios que querem crescer.
            </h1>
          </div>

          <p
            style={{
              color: 'rgba(255, 255, 255, 0.82)',
              fontSize: '0.98rem',
              lineHeight: 1.6,
              marginTop: '18px',
              maxWidth: '440px',
              fontWeight: 400
            }}
          >
            Cadastre seu acesso à central de operações para acompanhar contas, clientes, projetos e processos com padrão de execução.
          </p>

          <div
            style={{
              marginTop: '40px',
              paddingTop: '24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '0.82rem',
              color: 'rgba(255, 255, 255, 0.65)'
            }}
          >
            <ShieldCheck size={18} color="var(--sand-gold)" />
            <span>Ambiente seguro com criptografia e RLS Supabase</span>
          </div>
        </div>
      </div>

      {/* Right/Bottom Form Area */}
      <div className="login-form-panel">
        <div className="login-card-container">
          <div className="login-form-header">
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--sand-gold-dark)'
              }}
            >
              Novo Acesso Operacional
            </span>
            <h2
              className="font-serif"
              style={{
                fontSize: '2.1rem',
                fontWeight: 700,
                color: 'var(--green-deep)',
                marginTop: '6px'
              }}
            >
              Criar Conta
            </h2>
            <p
              style={{
                fontSize: '0.92rem',
                color: 'var(--text-secondary)',
                marginTop: '4px'
              }}
            >
              Preencha os dados abaixo para cadastrar seu usuário no Alicerce OS.
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(220, 38, 38, 0.08)',
                border: '1px solid rgba(220, 38, 38, 0.25)',
                color: '#dc2626',
                fontSize: '0.88rem',
                marginBottom: '20px',
                lineHeight: 1.45,
                fontWeight: 500
              }}
            >
              {error}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(22, 101, 52, 0.08)',
                border: '1px solid rgba(22, 101, 52, 0.25)',
                color: '#15803d',
                fontSize: '0.88rem',
                marginBottom: '20px',
                lineHeight: 1.45,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                Nome Completo *
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <User size={18} />
                </div>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                E-mail Profissional *
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  placeholder="seu.email@alicerce.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                Senha *
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                Confirmar Senha *
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  placeholder="Repita sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '0.98rem',
                justifyContent: 'center',
                marginTop: '8px'
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                'Criando conta...'
              ) : (
                <>
                  Criar conta <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div
            style={{
              textAlign: 'center',
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid var(--cream-border-subtle)',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)'
            }}
          >
            <span>Já possui uma conta? </span>
            <button
              type="button"
              onClick={onNavigateToLogin}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--green-primary)',
                fontWeight: 650,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
