import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Plus,
  ExternalLink,
  MessageSquare,
  Search,
  Filter,
  History,
  FileCheck
} from 'lucide-react';
import { ApprovalItem, ApprovalStatus, Project, Client } from '../../types';
import { phase2Service } from '../../services/phase2';
import { projectsService } from '../../services/projects';
import { clientsService } from '../../services/clients';
import { Modal } from '../../components/Common/Modal';
import { useToast } from '../../components/Common/Toast';

export const ApprovalsPage: React.FC = () => {
  const { showToast } = useToast();
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | ApprovalStatus>('Todos');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionStatus, setActionStatus] = useState<ApprovalStatus>('Aprovado');
  const [actionFeedback, setActionFeedback] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    projectId: '',
    type: 'Criativo',
    fileUrl: '',
    externalLink: '',
    responsible: 'Wesley Nunes',
    notes: ''
  });

  const loadData = async () => {
    const [apprs, projs, cls] = await Promise.all([
      phase2Service.getApprovals(),
      projectsService.getProjects(),
      clientsService.getClients()
    ]);
    setApprovals(apprs);
    setProjects(projs);
    setClients(cls);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      clientId: clients[0]?.id || '',
      projectId: projects[0]?.id || '',
      type: 'Criativo',
      fileUrl: '',
      externalLink: '',
      responsible: 'Wesley Nunes',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const selectedCl = clients.find((c) => c.id === formData.clientId);
    const selectedPr = projects.find((p) => p.id === formData.projectId);

    await phase2Service.saveApproval({
      title: formData.title,
      clientId: formData.clientId,
      clientName: selectedCl?.companyName || 'Cliente',
      projectId: formData.projectId || undefined,
      projectName: selectedPr?.name,
      type: formData.type,
      fileUrl: formData.fileUrl || undefined,
      externalLink: formData.externalLink || undefined,
      responsible: formData.responsible,
      notes: formData.notes,
      status: 'Aguardando aprovação'
    });

    showToast('Item enviado para aprovação com sucesso.', 'success');
    setIsModalOpen(false);
    loadData();
  };

  const handleOpenAction = (item: ApprovalItem) => {
    setSelectedApproval(item);
    setActionStatus(item.status);
    setActionFeedback('');
    setIsActionModalOpen(true);
  };

  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval) return;

    const newHistory = [
      ...(selectedApproval.history || []),
      {
        date: new Date().toISOString(),
        status: actionStatus,
        user: 'Wesley Nunes',
        feedback: actionFeedback || 'Atualização de status'
      }
    ];

    await phase2Service.saveApproval({
      id: selectedApproval.id,
      status: actionStatus,
      feedback: actionFeedback,
      history: newHistory
    });

    showToast(`Status atualizado para "${actionStatus}".`, 'success');
    setIsActionModalOpen(false);
    loadData();
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'Aprovado':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#EAF5EE', color: '#1B6346', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 650 }}>
            <CheckCircle2 size={13} /> Aprovado
          </span>
        );
      case 'Alterações solicitadas':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEF5E7', color: '#8F5310', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 650 }}>
            <Clock size={13} /> Alterações solicitadas
          </span>
        );
      case 'Rejeitado':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEE2E2', color: '#B91C1C', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 650 }}>
            <XCircle size={13} /> Rejeitado
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#EDF4F9', color: '#1D557B', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 650 }}>
            <Clock size={13} /> Aguardando aprovação
          </span>
        );
    }
  };

  const filteredApprovals = approvals.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
            Aprovações
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', margin: 0, fontWeight: 450 }}>
            Fluxo de validação de criativos, copys, páginas e entregas da agência.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '8px' }}>
          <Plus size={18} /> Novo Item para Aprovação
        </button>
      </div>

      {/* Filtros e Busca */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '40px', borderRadius: 'var(--radius-full)' }}
            placeholder="Pesquisar por material, cliente ou tipo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="form-input"
          style={{ width: 'auto', paddingRight: '32px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="Todos">Todos os status</option>
          <option value="Aguardando aprovação">Aguardando aprovação</option>
          <option value="Aprovado">Aprovado</option>
          <option value="Alterações solicitadas">Alterações solicitadas</option>
          <option value="Rejeitado">Rejeitado</option>
        </select>
      </div>

      {/* Tabela de Aprovações */}
      {filteredApprovals.length === 0 ? (
        <div
          className="card"
          style={{ padding: '64px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <FileCheck size={32} color="var(--sand-gold-dark)" style={{ marginBottom: '14px' }} />
          <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Nenhum item pendente de aprovação.
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', margin: '0 0 20px', maxWidth: '420px' }}>
            Envie criativos, layouts e documentos para controle de aprovação interna ou pelo cliente.
          </p>
          <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '8px' }}>
            <Plus size={16} /> Enviar primeiro item
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="desktop-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item / Material</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Responsável</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredApprovals.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.94rem' }}>
                        {item.title}
                      </div>
                      {item.notes && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {item.clientName} {item.projectName && `• ${item.projectName}`}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', fontWeight: 650, background: 'var(--cream-subtle)', padding: '2px 8px', borderRadius: '4px' }}>
                        {item.type}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{item.responsible}</td>
                    <td style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(item.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        {item.externalLink && (
                          <a
                            href={item.externalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px' }}
                            title="Abrir arquivo ou link externo"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenAction(item)}
                          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                        >
                          Avaliar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Criar Item de Aprovação */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Material para Validação">
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Título do Item *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Criativos de Lançamento (Carrossel 1 a 4)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Cliente *</label>
              <select
                className="form-input"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                required
              >
                <option value="">Selecione o cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Projeto Relacionado</label>
              <select
                className="form-input"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              >
                <option value="">Nenhum / Geral</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Tipo de Material</label>
              <select
                className="form-input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Criativo">Criativo / Design</option>
                <option value="Legenda">Legenda / Copy</option>
                <option value="Vídeo">Vídeo / Reel</option>
                <option value="Identidade Visual">Identidade Visual</option>
                <option value="Site / Landing Page">Site / Landing Page</option>
                <option value="Proposta">Proposta Comercial</option>
                <option value="Documento">Documento Estratégico</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Responsável</label>
              <input
                type="text"
                className="form-input"
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Link Externo / Pré-visualização</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://figma.com/..., https://drive.google.com/..."
              value={formData.externalLink}
              onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Observações / Contexto</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Instruções para o revisor, pontos de atenção..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Enviar para Aprovação
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Avaliação / Feedback */}
      {selectedApproval && (
        <Modal
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          title={`Avaliação: ${selectedApproval.title}`}
        >
          <form onSubmit={handleSaveAction} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group">
              <label className="form-label">Decisão de Aprovação *</label>
              <select
                className="form-input"
                value={actionStatus}
                onChange={(e) => setActionStatus(e.target.value as ApprovalStatus)}
                required
              >
                <option value="Aguardando aprovação">Aguardando aprovação</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Alterações solicitadas">Alterações solicitadas</option>
                <option value="Rejeitado">Rejeitado</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Parecer / Feedback para a equipe</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Detalhes dos ajustes solicitados ou aprovação..."
                value={actionFeedback}
                onChange={(e) => setActionFeedback(e.target.value)}
              />
            </div>

            {/* Histórico da Aprovação */}
            {selectedApproval.history && selectedApproval.history.length > 0 && (
              <div style={{ marginTop: '10px', paddingTop: '14px', borderTop: '1px solid var(--cream-border)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                  Histórico de Pareceres
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  {selectedApproval.history.map((h, i) => (
                    <div key={i} style={{ fontSize: '0.82rem', padding: '8px 10px', background: 'var(--cream-subtle)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 650 }}>
                        <span>{h.user} • {h.status}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>{new Date(h.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {h.feedback && <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{h.feedback}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsActionModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Confirmar Decisão
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
