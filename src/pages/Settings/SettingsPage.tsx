import React, { useState } from 'react';
import { Settings, RefreshCw, Download, Database, Shield, CheckCircle2 } from 'lucide-react';
import { db } from '../../services/db';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';
import { useToast } from '../../components/Common/Toast';

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleSyncData = () => {
    localStorage.removeItem('alicerce_clients');
    localStorage.removeItem('alicerce_projects');
    localStorage.removeItem('alicerce_processes');
    localStorage.removeItem('alicerce_materials');
    showToast('Cache local atualizado. Sincronizando com o Supabase...', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 600);
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
          Configurações do Sistema
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Gerenciamento da central operacional, integridade e persistência de dados.
        </p>
      </div>

      {/* System Information Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title font-serif" style={{ fontSize: '1.25rem' }}>
              Alicerce OS • Status do Ambiente
            </h3>
            <p className="card-subtitle">Infraestrutura e persistência de dados</p>
          </div>
          <span
            style={{
              fontSize: '0.76rem',
              fontWeight: 700,
              background: 'var(--status-active-bg)',
              color: 'var(--status-active-text)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)'
            }}
          >
            Conectado ao Supabase
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--cream-border-subtle)' }}>
            <span>Organização</span>
            <strong style={{ color: 'var(--text-primary)' }}>Agência Alicerce</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--cream-border-subtle)' }}>
            <span>Banco de Dados</span>
            <strong style={{ color: 'var(--text-primary)' }}>Supabase PostgreSQL (bgitssazeyfqbqajqojk)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--cream-border-subtle)' }}>
            <span>Segurança & Permissões</span>
            <strong style={{ color: 'var(--text-primary)' }}>Row Level Security (RLS) Ativo</strong>
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
              Gestão de Dados & Sincronização
            </h3>
            <p className="card-subtitle">Exportação e recarregamento da base</p>
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
                Baixe um arquivo JSON com o snapshot de clientes, projetos, processos e materiais.
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
              background: 'var(--cream-subtle)',
              border: '1px solid var(--cream-border)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                Forçar Sincronização com Supabase
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Limpa os caches temporários do navegador e recarrega os dados diretamente do PostgreSQL remoto.
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowResetDialog(true)}
              style={{ gap: '6px' }}
            >
              <RefreshCw size={14} /> Sincronizar Agora
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={handleSyncData}
        title="Sincronizar com o Banco de Dados"
        message="Deseja atualizar os caches locais do navegador? O sistema irá recarregar as informações atualizadas diretamente do Supabase."
        confirmLabel="Sim, Sincronizar"
      />
    </div>
  );
};
