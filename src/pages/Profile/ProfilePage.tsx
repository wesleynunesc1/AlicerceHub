import React, { useState } from 'react';
import { User, Mail, Shield, Phone, KeyRound, CheckCircle2, Lock } from 'lucide-react';
import { db } from '../../services/db';
import { useToast } from '../../components/Common/Toast';
import { UserProfile } from '../../types';

export const ProfilePage: React.FC = () => {
  const { showToast } = useToast();
  const [user, setUser] = useState<UserProfile>(db.getUser());
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [phone, setPhone] = useState(user.phone);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...user,
      name,
      email,
      role,
      phone
    };
    db.saveUser(updated);
    setUser(updated);
    showToast('Perfil atualizado com sucesso!', 'success');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('Preencha os campos de senha.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('A confirmação de senha não confere.', 'error');
      return;
    }
    showToast('Senha alterada com sucesso!', 'success');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Title */}
      <div>
        <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--green-deep)' }}>
          Meu Perfil
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Gerencie suas informações pessoais e credenciais de acesso ao Alicerce OS.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}
      >
        {/* Profile Card & Edit */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title font-serif" style={{ fontSize: '1.25rem' }}>
              Dados Pessoais
            </h3>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              background: 'var(--cream-subtle)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px'
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'var(--green-deep)',
                color: 'var(--sand-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 800,
                border: '2px solid var(--sand-gold)'
              }}
            >
              {name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>

            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {name}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {role}
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--green-primary)',
                  background: 'var(--green-tint)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  marginTop: '6px'
                }}
              >
                <Shield size={12} /> Acesso {user.roleType}
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label className="form-label">Nome Completo</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">E-mail Corporativo</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cargo / Função</label>
                <input
                  type="text"
                  className="form-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefone / WhatsApp</label>
                <input
                  type="text"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary">
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>

        {/* Password & Security Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title font-serif" style={{ fontSize: '1.25rem' }}>
                Segurança & Senha
              </h3>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Senha Atual</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nova Senha</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Mínimo de 8 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirmar Nova Senha</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button type="submit" className="btn btn-secondary">
                  Atualizar Senha
                </button>
              </div>
            </form>
          </div>

          {/* Permissões no MVP */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '10px' }}>
              <h3 className="card-title font-serif" style={{ fontSize: '1.15rem' }}>
                Arquitetura de Permissões
              </h3>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '14px' }}>
              O sistema foi estruturado para suportar perfis segmentados nas próximas fases:
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                'Admin (Acesso Total)',
                'Equipe',
                'Comercial',
                'Gestor',
                'Designer',
                'Social Media',
                'Gestor de Tráfego',
                'Portal do Cliente'
              ].map((p, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.74rem',
                    padding: '3px 9px',
                    borderRadius: 'var(--radius-full)',
                    background: idx === 0 ? 'var(--green-tint)' : 'var(--cream-subtle)',
                    color: idx === 0 ? 'var(--green-primary)' : 'var(--text-muted)',
                    fontWeight: 600,
                    border: '1px solid var(--cream-border)'
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
