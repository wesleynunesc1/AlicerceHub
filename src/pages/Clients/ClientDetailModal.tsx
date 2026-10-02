import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/Common/Modal';
import { Badge } from '../../components/Common/Badge';
import { Client, Project, Material, ServiceType, OnboardingCheckItem, QuickLink, InternalComment } from '../../types';
import { db } from '../../services/db';
import { phase2Service } from '../../services/phase2';
import {
  Mail,
  Phone,
  FolderOpen,
  ExternalLink,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Send,
  MessageSquare,
  Link as LinkIcon
} from 'lucide-react';

interface ClientDetailModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (client: Client) => void;
  onNavigateToProject?: (projectId: string) => void;
  onNavigateToMaterial?: (materialId: string) => void;
}

type TabType = 'overview' | 'projects' | 'materials' | 'onboarding' | 'links' | 'comments' | 'info';

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client,
  isOpen,
  onClose,
  onEdit,
  onNavigateToProject,
  onNavigateToMaterial
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [onboardingItems, setOnboardingItems] = useState<OnboardingCheckItem[]>([]);
  const [offboardingItems, setOffboardingItems] = useState<OnboardingCheckItem[]>([]);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [comments, setComments] = useState<InternalComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkCat, setNewLinkCat] = useState<QuickLink['category']>('Drive');

  useEffect(() => {
    if (client) {
      setOnboardingItems(phase2Service.getOnboarding(client.id));
      setOffboardingItems(phase2Service.getOffboarding(client.id));
      setQuickLinks(phase2Service.getQuickLinks(client.id));
      setComments(phase2Service.getComments('client', client.id));
    }
  }, [client]);

  if (!client) return null;

  const projects = db.getProjects().filter((p) => p.clientId === client.id);
  const materials = db.getMaterials();

  const handleToggleOnboarding = (key: string) => {
    const updated = phase2Service.toggleOnboardingItem(client.id, key, 'Wesley Nunes');
    setOnboardingItems(updated);
  };

  const handleToggleOffboarding = (key: string) => {
    const updated = phase2Service.toggleOffboardingItem(client.id, key, 'Wesley Nunes');
    setOffboardingItems(updated);
  };

  const handleAddQuickLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
    const added = phase2Service.saveQuickLink({
      clientId: client.id,
      title: newLinkTitle,
      url: newLinkUrl,
      category: newLinkCat
    });
    setQuickLinks([...quickLinks, added]);
    setNewLinkTitle('');
    setNewLinkUrl('');
  };

  const handleDeleteQuickLink = (id: string) => {
    phase2Service.deleteQuickLink(id);
    setQuickLinks(quickLinks.filter((l) => l.id !== id));
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const added = phase2Service.addComment({
      entityType: 'client',
      entityId: client.id,
      userName: 'Wesley Nunes',
      content: newCommentText
    });
    setComments([added, ...comments]);
    setNewCommentText('');
  };

  const completedOnboardingCount = onboardingItems.filter((i) => i.completed).length;
  const onboardingProgress = Math.round((completedOnboardingCount / (onboardingItems.length || 1)) * 100);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client.companyName}
      subtitle={`Segmento: ${client.segment} • Início em ${new Date(client.startDate).toLocaleDateString('pt-BR')}`}
      maxWidth="820px"
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
          gap: '4px',
          overflowX: 'auto'
        }}
      >
        {(
          [
            { id: 'overview', label: 'Visão Geral' },
            { id: 'projects', label: `Projetos (${projects.length})` },
            { id: 'onboarding', label: `Onboarding (${onboardingProgress}%)` },
            { id: 'links', label: `Links Rápidos (${quickLinks.length})` },
            { id: 'comments', label: `Comentários (${comments.length})` },
            { id: 'info', label: 'Cadastro' }
          ] as { id: TabType; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 14px',
              fontSize: '0.86rem',
              whiteSpace: 'nowrap',
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
                Status de Onboarding
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--sand-gold-dark)', marginTop: '4px' }}>
                {onboardingProgress}% concluído
              </div>
            </div>
          </div>

          {client.notes && (
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                Observações Operacionais
              </span>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px', lineHeight: 1.5 }}>
                {client.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROJETOS */}
      {activeTab === 'projects' && (
        <div>
          {projects.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
              Nenhum projeto cadastrado para este cliente.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--cream-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.94rem' }}>{proj.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Entrega: {new Date(proj.dueDate).toLocaleDateString('pt-BR')} • {proj.service}
                    </div>
                  </div>
                  <Badge status={proj.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ONBOARDING & OFFBOARDING */}
      {activeTab === 'onboarding' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Onboarding Checklist */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--green-deep)' }}>
                Checklist de Onboarding
              </span>
              <span style={{ fontSize: '0.84rem', fontWeight: 650, color: 'var(--sand-gold-dark)' }}>
                {completedOnboardingCount} de {onboardingItems.length} ({onboardingProgress}%)
              </span>
            </div>

            <div style={{ height: '6px', background: 'var(--cream-subtle)', borderRadius: '3px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ width: `${onboardingProgress}%`, height: '100%', background: 'var(--green-primary)', transition: 'width 0.3s ease' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {onboardingItems.map((item) => (
                <div
                  key={item.key}
                  onClick={() => handleToggleOnboarding(item.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: item.completed ? 'var(--cream-subtle)' : '#FFFFFF',
                    border: '1px solid var(--cream-border)',
                    cursor: 'pointer'
                  }}
                >
                  {item.completed ? (
                    <CheckSquare size={18} color="var(--status-active-text)" />
                  ) : (
                    <Square size={18} color="var(--text-muted)" />
                  )}
                  <span style={{ fontSize: '0.9rem', color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: item.completed ? 'line-through' : 'none' }}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Offboarding Checklist */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--cream-border)' }}>
            <span style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--green-deep)', display: 'block', marginBottom: '12px' }}>
              Checklist de Encerramento (Offboarding)
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {offboardingItems.map((item) => (
                <div
                  key={item.key}
                  onClick={() => handleToggleOffboarding(item.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: item.completed ? 'var(--cream-subtle)' : '#FFFFFF',
                    border: '1px solid var(--cream-border)',
                    cursor: 'pointer'
                  }}
                >
                  {item.completed ? (
                    <CheckSquare size={18} color="var(--status-active-text)" />
                  ) : (
                    <Square size={18} color="var(--text-muted)" />
                  )}
                  <span style={{ fontSize: '0.9rem', color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: item.completed ? 'line-through' : 'none' }}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LINKS RÁPIDOS */}
      {activeTab === 'links' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <form onSubmit={handleAddQuickLink} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, minWidth: '160px' }}
              placeholder="Título (Ex: Pasta no Google Drive)"
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
              required
            />
            <input
              type="url"
              className="form-input"
              style={{ flex: 2, minWidth: '220px' }}
              placeholder="https://drive.google.com/..."
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ gap: '6px' }}>
              <Plus size={16} /> Adicionar Link
            </button>
          </form>

          {quickLinks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
              Nenhum link rápido cadastrado para este cliente.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {quickLinks.map((link) => (
                <div
                  key={link.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--cream-border)',
                    background: '#FFFFFF'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <LinkIcon size={16} color="var(--green-primary)" />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{link.title}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 10px', gap: '4px', fontSize: '0.78rem' }}
                    >
                      Acessar <ExternalLink size={12} />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuickLink(link.id)}
                      style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px' }}
                      title="Remover link"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: COMENTÁRIOS INTERNOS */}
      {activeTab === 'comments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Escreva uma anotação interna sobre este cliente..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ gap: '6px' }}>
              <Send size={15} /> Registrar
            </button>
          </form>

          {comments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
              Nenhuma anotação registrada ainda.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {comments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--cream-subtle)',
                    border: '1px solid var(--cream-border)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 650, fontSize: '0.86rem', color: 'var(--green-deep)' }}>
                      {c.userName}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {new Date(c.createdAt).toLocaleDateString('pt-BR')} às {new Date(c.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.45 }}>
                    {c.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: INFORMAÇÕES CADASTRAIS */}
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
