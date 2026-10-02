import React, { useState } from 'react';
import { Settings, RefreshCw, Download, Database, Shield, CheckCircle2 } from 'lucide-react';
import { db } from '../../services/db';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';
import { useToast } from '../../components/Common/Toast';

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleResetData = () => {
    db.resetToDefaults();
    showToast('Dados restaurados para o padrão de demonstração!', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleExportData = () => {
    const data = {
      clients: db.getClients(),
      projects: db.getProjects(),
      processes: db.getProcesses(),
      materials: db.getMaterials(),
      user: db.getUser(),
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alicerce-os-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado com sucesso!', 'success');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--green-deep)' }}>
          Configurações Básicas
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Gerenciamento da central operacional e persistência de dados.
        </p>
      </div>

      {/* System Information Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title font-serif" style={{ fontSize: '1.25rem' }}>
              Alicerce OS • Versão do Sistema
            </h3>
            <p className="card-subtitle">Ambiente operacional interno</p>
          </div>
          <span
            style={{
              fontSize: '0.76rem',
              fontWeight: 700,
              background: 'var(--green-tint)',
              color: 'var(--green-primary)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)'
            }}
          >
            v1.0.0 (MVP Estável)
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--cream-border-subtle)' }}>
            <span>Organização</span>
            <strong style={{ color: 'var(--text-primary)' }}>Agência Alicerce</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--cream-border-subtle)' }}>
            <span>Arquitetura de Dados</span>
            <strong style={{ color: 'var(--text-primary)' }}>LocalStorage + Indexed Cache</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--cream-border-subtle)' }}>
            <span>Status da Operação</span>
            <span style={{ color: '#15803d', fontWeight: 600 }}>● Ativo e Operacional</span>
          </div>
        </div>
      </div>

      {/* Data Management Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title font-serif" style={{ fontSize: '1.25rem' }}>
              Gestão de Dados & Backup
            </h3>
            <p className="card-subtitle">Exportação e restauração dos cadastros</p>
          </div>
          <Database size={20} color="var(--green-primary)" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              background: 'var(--cream-subtle)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                Exportar Backup Completo
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Baixe um arquivo JSON com todos os clientes, projetos, processos e materiais.
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleExportData} style={{ gap: '6px' }}>
              <Download size={14} /> Exportar JSON
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              background: '#FFF7F7',
              border: '1px solid #FED7D7',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#9B2C2C' }}>
                Restaurar Dados de Demonstração
              </div>
              <div style={{ fontSize: '0.8rem', color: '#742A2A' }}>
                Restaura o banco de dados para os dados padrão da Alicerce com clientes e projetos de exemplo.
              </div>
            </div>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setShowResetDialog(true)}
              style={{ gap: '6px' }}
            >
              <RefreshCw size={14} /> Restaurar Padrão
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={handleResetData}
        title="Restaurar Dados de Demonstração"
        message="Tem certeza que deseja restaurar os dados padrão? Todas as alterações personalizadas feitas nesta sessão serão substituídas pelos dados de exemplo da Alicerce."
        confirmLabel="Sim, Restaurar"
      />
    </div>
  );
};
