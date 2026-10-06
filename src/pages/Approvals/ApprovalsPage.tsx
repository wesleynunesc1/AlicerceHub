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
  AlertTriangle,
  Sparkles,
  Palette,
  Video,
  Image,
  Globe,
  Check
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

  const handleQuickApprove = async (item: ApprovalItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = [
      ...(item.history || []),
      {
        date: new Date().toISOString(),
        status: 'Aprovado' as ApprovalStatus,
        user: 'Wesley Nunes',
        feedback: 'Aprovado na Mesa Criativa'
      }
    ];

    await phase2Service.saveApproval({
      id: item.id,
      status: 'Aprovado',
      feedback: 'Aprovado',
      history: newHistory
    });

    await dashboardService.logActivity(
      'Peça Aprovada',
      'approval',
      item.id,
      `Material "${item.title}" aprovado na Mesa Criativa por Wesley Nunes.`
    );

    showToast(`"${item.title}" aprovado com sucesso!`, 'success');
    loadData();
  };

  const handleQuickRequestChanges = (item: ApprovalItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedApproval(item);
    setActionStatus('Alterações solicitadas');
    setActionFeedback('');
    setIsActionModalOpen(true);
  };

  const getMaterialTypeIcon = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('vídeo') || t.includes('video') || t.includes('reels')) return <Video size={13} />;
    if (t.includes('arte') || t.includes('criativo') || t.includes('banner')) return <Image size={13} />;
    if (t.includes('logo') || t.includes('identidade')) return <Palette size={13} />;
    if (t.includes('site') || t.includes('landing') || t.includes('página')) return <Globe size={13} />;
    if (t.includes('copy') || t.includes('legenda') || t.includes('roteiro')) return <MessageSquare size={13} />;
    return <Sparkles size={13} />;
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'Aprovado':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#EAF5EE', color: '#1B6346', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 650, fontFamily: 'var(--font-heading)' }}>
            <CheckCircle2 size={13} /> Aprovado
          </span>
        );
      case 'Alterações solicitadas':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEF5E7', color: '#8F5310', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 650, fontFamily: 'var(--font-heading)' }}>
            <Clock size={13} /> Alterações solicitadas
          </span>
        );
      case 'Rejeitado':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEE2E2', color: '#B91C1C', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 650, fontFamily: 'var(--font-heading)' }}>
            <XCircle size={13} /> Rejeitado
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#EDF4F9', color: '#1D557B', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 650, fontFamily: 'var(--font-heading)' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--sand-gold-dark)',
                fontFamily: 'var(--font-heading)'
              }}
            >
              Mesa de Revisão Criativa
            </span>
          </div>
          <h1 className="font-heading" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
            Aprovações & Criação
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', margin: '4px 0 0', fontWeight: 400 }}>
            Central de revisão de peças, criativos, páginas, vídeos e aprovação ágil com clientes.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '6px' }}>
          <Plus size={16} /> Nova Peça para Aprovação
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

      {/* Grid de Aprovações - Mesa Criativa */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {filteredApprovals.map((item) => {
          const versionNumber = (item.history?.length || 0) + 1;
          return (
            <div
              key={item.id}
              className="card"
              style={{
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                borderLeft: item.status === 'Aguardando aprovação' ? '3px solid var(--sand-gold)' : undefined
              }}
            >
              <div>
                {/* Top Bar: Cliente, Projeto, Versão, Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        color: 'var(--sand-gold-dark)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      {item.clientName}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--cream-subtle)',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      v{versionNumber}
                    </span>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                {/* Título da Peça */}
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--green-deep)', margin: '0 0 8px', lineHeight: 1.3, fontFamily: 'var(--font-heading)' }}>
                  {item.title}
                </h3>

                {/* Metadados: Tipo com Ícone, Projeto, Responsável */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--cream-subtle)',
                      border: '1px solid var(--cream-border)',
                      fontSize: '0.74rem',
                      fontWeight: 650,
                      color: 'var(--green-deep)',
                      fontFamily: 'var(--font-heading)'
                    }}
                  >
                    {getMaterialTypeIcon(item.type)}
                    {item.type}
                  </span>
                  {item.projectName && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      • {item.projectName}
                    </span>
                  )}
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    • Resp: {item.responsible}
                  </span>
                </div>

                {item.notes && (
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0 0 12px' }}>
                    {item.notes}
                  </p>
                )}

                {item.feedback && (
                  <div style={{ padding: '10px 12px', background: 'var(--cream-subtle)', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--sand-gold)' }}>
                    <strong style={{ fontFamily: 'var(--font-heading)', color: 'var(--green-deep)' }}>Feedback:</strong> {item.feedback}
                  </div>
                )}
              </div>

              {/* Ações Criativas Diretas */}
              <div style={{ borderTop: '1px solid var(--cream-border-subtle)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {item.externalLink && (
                    <a
                      href={item.externalLink}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.76rem', gap: '4px' }}
                    >
                      <ExternalLink size={12} /> Ver Link
                    </a>
                  )}
                  <button
                    className="sidebar-collapse-btn"
                    onClick={() => handleOpenAction(item)}
                    title="Ver Histórico & Detalhes"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <History size={14} />
                  </button>
                </div>

                {/* Ações Rápidas: Aprovar e Solicitar Ajustes */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={(e) => handleQuickRequestChanges(item, e)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: '#FEF5E7',
                      color: '#8F5310',
                      border: '1px solid #FCDCA6',
                      fontSize: '0.76rem',
                      fontWeight: 650,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-heading)'
                    }}
                  >
                    Solicitar Ajustes
                  </button>
                  <button
                    onClick={(e) => handleQuickApprove(item, e)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--green-primary)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.76rem',
                      fontWeight: 650,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-heading)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Check size={12} /> Aprovar
                  </button>
                </div>
              </div>
            </div>
          );
        })}

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
