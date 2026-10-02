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
  FileCheck,
  Send,
  AlertTriangle
} from 'lucide-react';
import { ApprovalItem, ApprovalStatus, Project, Client } from '../../types';
import { phase2Service } from '../../services/phase2';
import { projectsService } from '../../services/projects';
import { clientsService } from '../../services/clients';
import { dashboardService } from '../../services/dashboard';
import { Modal } from '../../components/Common/Modal';
import { useToast } from '../../components/Common/Toast';
import { NavTab } from '../../components/Layout/Sidebar';

interface ApprovalsPageProps {
  initialFilter?: string;
  onNavigate?: (tab: NavTab, params?: any) => void;
}

export const ApprovalsPage: React.FC<ApprovalsPageProps> = ({
  initialFilter,
  onNavigate
}) => {
  const { showToast } = useToast();
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | ApprovalStatus>(() => {
    if (initialFilter?.toLowerCase() === 'aguardando') {
      return 'Aguardando aprovação';
    }
    return 'Todos';
  });

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
    setApprovals(apprs || []);
    setProjects(projs || []);
    setClients(cls || []);
  };

  useEffect(() => {
    loadData();
    if (initialFilter?.toLowerCase() === 'aguardando') {
      setStatusFilter('Aguardando aprovação');
    }
  }, [initialFilter]);

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

    const saved = await phase2Service.saveApproval({
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

    await dashboardService.logActivity(
      'Item Enviado para Aprovação',
      'approval',
      saved.id,
      `Material "${saved.title}" enviado para aprovação do cliente "${saved.clientName}".`
    );

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

  // Regra do Prompt: "Ao aprovar: Registrar quem aprovou, data, comentário. Ao solicitar alteração: Criar automaticamente tarefa: Realizar ajustes vinculada ao projeto"
  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval) return;

    if (actionStatus === 'Alterações solicitadas') {
      await phase2Service.requestApprovalChanges(
        selectedApproval.id,
        actionFeedback || 'Ajustes solicitados no material enviado',
        selectedApproval.responsible
      );
      showToast('Alterações solicitadas! Tarefa "Realizar ajustes" gerada automaticamente no projeto.', 'info');
    } else {
      const newHistory = [
        ...(selectedApproval.history || []),
        {
          date: new Date().toISOString(),
          status: actionStatus,
          user: 'Wesley Nunes',
          feedback: actionFeedback || `Status alterado para ${actionStatus}`
        }
      ];

      await phase2Service.saveApproval({
        id: selectedApproval.id,
        status: actionStatus,
        feedback: actionFeedback,
        history: newHistory
      });

      await dashboardService.logActivity(
        'Decisão de Aprovação',
        'approval',
        selectedApproval.id,
        `Item "${selectedApproval.title}" marcado como "${actionStatus}" por Wesley Nunes.`
      );

      showToast(`Status atualizado para "${actionStatus}".`, 'success');
    }

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

  const filteredApprovals = approvals.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.projectName && item.projectName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'Todos' || item.status === statusFilter;
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
            Fluxo de validação de criativos, roteiros, páginas e entregáveis com clientes.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '6px' }}>
          <Plus size={16} /> Nova Solicitação
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '420px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por peça, cliente ou projeto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{ minWidth: '180px' }}
        >
          <option value="Todos">Todos os Status</option>
          <option value="Aguardando aprovação">Aguardando Aprovação</option>
          <option value="Alterações solicitadas">Alterações Solicitadas</option>
          <option value="Aprovado">Aprovado</option>
          <option value="Rejeitado">Rejeitado</option>
        </select>
      </div>

      {/* Grid de Aprovações */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {filteredApprovals.map((item) => (
          <div
            key={item.id}
            className="card"
            style={{
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--sand-gold-dark)' }}>
                  {item.clientName}
                </span>
                {getStatusBadge(item.status)}
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--green-deep)', margin: '0 0 6px' }}>
                {item.title}
              </h3>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '10px' }}>
                {item.projectName && <div>Projeto: {item.projectName}</div>}
                <div>Tipo: {item.type} • Responsável: {item.responsible}</div>
              </div>

              {item.notes && (
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 12px' }}>
                  {item.notes}
                </p>
              )}

              {item.feedback && (
                <div style={{ padding: '10px 12px', background: 'var(--cream-subtle)', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--sand-gold-dark)' }}>
                  <strong>Último Feedback:</strong> {item.feedback}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--cream-border-subtle)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {item.externalLink && (
                  <a
                    href={item.externalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78rem', gap: '4px' }}
                  >
                    <ExternalLink size={12} /> Acessar Link
                  </a>
                )}
              </div>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleOpenAction(item)}
                style={{ fontSize: '0.78rem' }}
              >
                Gerenciar Status
              </button>
            </div>
          </div>
        ))}

        {filteredApprovals.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center' }}>
            <FileCheck size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', margin: 0 }}>
              Nenhum item de aprovação encontrado com os filtros selecionados.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Ação / Mudança de Status com Automação de Tarefa de Ajuste */}
      {selectedApproval && (
        <Modal
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          title={`Aprovação: ${selectedApproval.title}`}
          subtitle={`Cliente: ${selectedApproval.clientName}`}
          maxWidth="560px"
        >
          <form onSubmit={handleSaveAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="form-label">Atualizar Decisão / Status</label>
              <select
                className="form-select"
                value={actionStatus}
                onChange={(e) => setActionStatus(e.target.value as ApprovalStatus)}
              >
                <option value="Aprovado">Aprovado pelo Cliente</option>
                <option value="Alterações solicitadas">Alterações Solicitadas (Gera Tarefa de Ajuste)</option>
                <option value="Aguardando aprovação">Aguardando Retorno do Cliente</option>
                <option value="Rejeitado">Rejeitado</option>
              </select>
            </div>

            {actionStatus === 'Alterações solicitadas' && (
              <div style={{ padding: '12px', background: '#FEF5E7', borderRadius: '8px', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#8F5310' }}>
                <AlertTriangle size={16} />
                <span>Uma tarefa <strong>"Realizar ajustes"</strong> será criada automaticamente para a equipe no projeto.</span>
              </div>
            )}

            <div>
              <label className="form-label">Feedback / Observações do Cliente</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Insira os comentários, pontuações ou alterações exigidas..."
                value={actionFeedback}
                onChange={(e) => setActionFeedback(e.target.value)}
                required={actionStatus === 'Alterações solicitadas'}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsActionModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Salvar Decisão
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Nova Solicitação de Aprovação */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enviar Item para Aprovação"
        subtitle="Submeta criativos, páginas ou copys para aprovação do cliente"
        maxWidth="640px"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Título da Peça / Material *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Roteiro de Vídeo Hook-Story-Offer"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Cliente *</label>
              <select
                className="form-select"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                required
              >
                <option value="">Selecione o cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Projeto Vinculado</label>
              <select
                className="form-select"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              >
                <option value="">Nenhum projeto específico</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Tipo de Peça</label>
              <select
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Criativo">Criativo / Anúncio</option>
                <option value="Landing Page">Landing Page</option>
                <option value="Roteiro">Roteiro / Copy</option>
                <option value="Identidade Visual">Identidade Visual</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="form-label">Responsável Interno</label>
              <input
                type="text"
                className="form-input"
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Link Externo para Prévia (Figma / Drive / URL)</label>
            <input
              type="text"
              className="form-input"
              placeholder="https://..."
              value={formData.externalLink}
              onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Orientações para o Cliente</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Pontos de atenção para validação..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Enviar para Aprovação
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
