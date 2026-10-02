import React, { useState } from 'react';
import { Modal } from '../../components/Common/Modal';
import { Badge } from '../../components/Common/Badge';
import { Client, Project, Material, ServiceType } from '../../types';
import { db } from '../../services/db';
import {
  Mail,
  Phone,
  FolderOpen,
  ExternalLink
} from 'lucide-react';

interface ClientDetailModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (client: Client) => void;
  onNavigateToProject?: (projectId: string) => void;
  onNavigateToMaterial?: (materialId: string) => void;
}

type TabType = 'overview' | 'projects' | 'materials' | 'info';

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client,
  isOpen,
  onClose,
  onEdit,
  onNavigateToProject,
  onNavigateToMaterial
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!client) return null;

  const projects = db.getProjects().filter((p) => p.clientId === client.id);
  const materials = db.getMaterials();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client.companyName}
      subtitle={`Segmento: ${client.segment} • Início em ${new Date(client.startDate).toLocaleDateString('pt-BR')}`}
      maxWidth="780px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge status={client.status} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Fechar
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                onClose();
                onEdit(client);
              }}
            >
              Editar Cliente
            </button>
          </div>
        </div>
      }
    >
      {/* Client Quick Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '16px',
          background: 'var(--cream-subtle)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--green-deep)',
              color: 'var(--sand-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.1rem'
            }}
          >
            {client.companyName.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{client.contactName}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Responsável pelo Contrato</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.82rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <Mail size={15} color="var(--green-primary)" />
            <span>{client.email}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <Phone size={15} color="var(--green-primary)" />
            <span>{client.phone}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--cream-border)',
          marginBottom: '20px',
          gap: '4px'
        }}
      >
        {(
          [
            { id: 'overview', label: 'Visão Geral' },
            { id: 'projects', label: `Projetos (${projects.length})` },
            { id: 'materials', label: 'Materiais' },
            { id: 'info', label: 'Informações Cadastrais' }
          ] as { id: TabType; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 16px',
              fontSize: '0.88rem',
              fontWeight: activeTab === t.id ? 700 : 500,
              color: activeTab === t.id ? 'var(--green-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === t.id ? '2px solid var(--green-primary)' : '2px solid transparent',
              transition: 'all var(--transition-fast)'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: VISÃO GERAL */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Services list */}
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Serviços Contratados
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {client.services.map((svc) => (
                <span
                  key={svc}
                  style={{
                    background: 'var(--green-tint)',
                    color: 'var(--green-primary)',
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: '1px solid rgba(18, 53, 43, 0.15)'
                  }}
                >
                  {svc}
                </span>
              ))}
            </div>
          </div>

          {/* Account manager & Start date */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              padding: '16px',
              border: '1px solid var(--cream-border)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Responsável Interno
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                {client.accountManager}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Data de Entrada
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                {new Date(client.startDate).toLocaleDateString('pt-BR')}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Projetos Ativos
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--green-primary)', marginTop: '4px' }}>
                {projects.filter((p) => p.status !== 'Finalizado').length} em andamento
              </div>
            </div>
          </div>

          {/* Observações importantes */}
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Observações Estratégicas
            </span>
            <div
              style={{
                marginTop: '8px',
                padding: '14px 16px',
                background: 'var(--cream-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontSize: '0.88rem',
                lineHeight: 1.5,
                borderLeft: '3px solid var(--sand-gold)'
              }}
            >
              {client.notes || 'Nenhuma observação interna cadastrada para este cliente.'}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROJETOS */}
      {activeTab === 'projects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
              Nenhum projeto vinculado a este cliente no momento.
            </div>
          ) : (
            projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => {
                  if (onNavigateToProject) {
                    onClose();
                    onNavigateToProject(proj.id);
                  }
                }}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--cream-border)',
                  background: 'var(--cream-card)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {proj.name}
                  </div>
                  <Badge status={proj.status} />
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  <span>Serviço: <strong>{proj.service}</strong></span>
                  <span>Responsável: <strong>{proj.responsible}</strong></span>
                  <span>Prazo: <strong>{new Date(proj.dueDate).toLocaleDateString('pt-BR')}</strong></span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${proj.progress}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: MATERIAIS */}
      {activeTab === 'materials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Documentos, contratos e templates aplicáveis à operação de {client.companyName}:
          </p>

          {materials.slice(0, 4).map((mat) => (
            <div
              key={mat.id}
              onClick={() => {
                if (onNavigateToMaterial) {
                  onClose();
                  onNavigateToMaterial(mat.id);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--cream-border)',
                background: 'var(--cream-subtle)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FolderOpen size={18} color="var(--green-primary)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{mat.title}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {mat.category} • Atualizado em {new Date(mat.updatedAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
              <ExternalLink size={16} color="var(--text-muted)" />
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: INFORMAÇÕES CADASTRAIS */}
      {activeTab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-row">
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>RAZÃO / NOME FANTASIA</div>
              <div style={{ fontWeight: 600, marginTop: '4px' }}>{client.companyName}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CONTATO PRINCIPAL</div>
              <div style={{ fontWeight: 600, marginTop: '4px' }}>{client.contactName}</div>
            </div>
          </div>

          <div className="form-row">
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>E-MAIL</div>
              <div style={{ marginTop: '4px' }}>{client.email}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TELEFONE / WHATSAPP</div>
              <div style={{ marginTop: '4px' }}>{client.phone}</div>
            </div>
          </div>

          <div className="form-row">
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>SITE INSTITUCIONAL</div>
              <div style={{ marginTop: '4px' }}>
                {client.website ? (
                  <a href={client.website} target="_blank" rel="noreferrer" style={{ color: 'var(--green-primary)', textDecoration: 'underline' }}>
                    {client.website}
                  </a>
                ) : (
                  'Não informado'
                )}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>INSTAGRAM</div>
              <div style={{ marginTop: '4px' }}>{client.instagram || 'Não informado'}</div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
