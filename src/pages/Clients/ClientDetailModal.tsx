import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/Common/Modal';
import { Badge } from '../../components/Common/Badge';
import {
  Client,
  Project,
  Task,
  Material,
  Contract,
  FinancialEntry,
  ApprovalItem,
  OnboardingCheckItem,
  QuickLink,
  InternalComment,
  ActivityItem
} from '../../types';
import { phase2Service } from '../../services/phase2';
import { projectsService } from '../../services/projects';
import { materialsService } from '../../services/materials';
import { dashboardService } from '../../services/dashboard';
import { useToast } from '../../components/Common/Toast';
import {
  Building2,
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
  Link as LinkIcon,
  CheckCircle2,
  Clock,
  Briefcase,
  DollarSign,
  FileCheck2,
  FileText,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ClientDetailModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (client: Client) => void;
  onNavigateToProject?: (projectId: string) => void;
  onNavigateToMaterial?: (materialId: string) => void;
  onNavigateToTask?: (taskId: string) => void;
  onClientUpdated?: () => void;
  onCreateProjectForClient?: (client: Client) => void;
  onCreateTaskForClient?: (client: Client) => void;
  onCreateContractForClient?: (client: Client) => void;
  onCreateMaterialForClient?: (client: Client) => void;
  initialTab?: string;
}

type TabType =
  | 'overview'
  | 'projects'
  | 'tasks'
  | 'materials'
  | 'approvals'
  | 'contracts'
  | 'financial'
  | 'onboarding'
  | 'history'
  | 'links'
  | 'offboarding';

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client,
  isOpen,
  onClose,
  onEdit,
  onNavigateToProject,
  onNavigateToMaterial,
  onNavigateToTask,
  onClientUpdated,
  onCreateProjectForClient,
  onCreateTaskForClient,
  onCreateContractForClient,
  onCreateMaterialForClient,
  initialTab = 'overview'
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>((initialTab as TabType) || 'overview');

  // Client-related entities
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [financials, setFinancials] = useState<FinancialEntry[]>([]);
  const [onboardingItems, setOnboardingItems] = useState<OnboardingCheckItem[]>([]);
  const [offboardingItems, setOffboardingItems] = useState<OnboardingCheckItem[]>([]);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [comments, setComments] = useState<InternalComment[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Form states inside tabs
  const [newCommentText, setNewCommentText] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkCat, setNewLinkCat] = useState<QuickLink['category']>('Drive');
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as TabType);
    }
  }, [initialTab]);

  const loadClientData = async () => {
    if (!client) return;

    try {
      const [allProjs, allTasks, allMats, allApprs, allCtrs, allFins, acts] = await Promise.all([
        projectsService.getProjects(),
        phase2Service.getTasks(),
        materialsService.getMaterials(),
        phase2Service.getApprovals(),
        phase2Service.getContracts(),
        phase2Service.getFinancialEntries(),
        dashboardService.getRecentActivities()
      ]);

      setProjects((allProjs || []).filter((p) => p.clientId === client.id));
      setTasks((allTasks || []).filter((t) => t.clientId === client.id));
      setMaterials((allMats || []).filter((m) => m.clientId === client.id));
      setApprovals((allApprs || []).filter((a) => a.clientId === client.id));
      setContracts((allCtrs || []).filter((c) => c.clientId === client.id));
      setFinancials((allFins || []).filter((f) => f.clientId === client.id));
      setActivities((acts || []).filter((a) => a.description?.toLowerCase().includes(client.companyName.toLowerCase())));

      setOnboardingItems(phase2Service.getOnboarding(client.id));
      setOffboardingItems(phase2Service.getOffboarding(client.id));
      setQuickLinks(phase2Service.getQuickLinks(client.id));
      setComments(phase2Service.getComments('client', client.id));
    } catch (err) {
      console.error('Erro ao carregar dados do cliente:', err);
    }
  };

  useEffect(() => {
    if (client && isOpen) {
      loadClientData();
    }
  }, [client, isOpen]);

  if (!client) return null;

  // Onboarding progress
  const completedOnboardingCount = onboardingItems.filter((i) => i.completed).length;
  const onboardingProgress = Math.round((completedOnboardingCount / (onboardingItems.length || 1)) * 100);

  // Offboarding progress
  const completedOffboardingCount = offboardingItems.filter((i) => i.completed).length;
  const offboardingProgress = Math.round((completedOffboardingCount / (offboardingItems.length || 1)) * 100);

  const handleToggleOnboarding = (key: string) => {
    const updated = phase2Service.toggleOnboardingItem(client.id, key, 'Wesley Nunes');
    setOnboardingItems(updated);
  };

  const handleToggleOffboarding = (key: string) => {
    const updated = phase2Service.toggleOffboardingItem(client.id, key, 'Wesley Nunes');
    setOffboardingItems(updated);
  };

  const handleActivateClientFromOnboarding = async () => {
    setIsActivating(true);
    try {
      await phase2Service.completeOnboarding(client.id);
      showToast(`Cliente "${client.companyName}" ativado com sucesso na operação!`, 'success');
      if (onClientUpdated) onClientUpdated();
      onClose();
    } catch {
      showToast('Falha ao ativar cliente.', 'error');
    } finally {
      setIsActivating(false);
    }
  };

  const handleCloseClientFromOffboarding = async () => {
    if (confirm(`Confirma o encerramento do contrato e offboarding de "${client.companyName}"?`)) {
      try {
        await phase2Service.completeOffboarding(client.id);
        showToast(`Cliente "${client.companyName}" encerrado formalmente.`, 'info');
        if (onClientUpdated) onClientUpdated();
        onClose();
      } catch {
        showToast('Falha ao encerrar cliente.', 'error');
      }
    }
  };

  const handleAddQuickLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
    const added = phase2Service.saveQuickLink({
      clientId: client.id,
      title: newLinkTitle,
      url: newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`,
      category: newLinkCat
    });
    setQuickLinks([...quickLinks, added]);
    setNewLinkTitle('');
    setNewLinkUrl('');
    showToast('Link rápido adicionado!', 'success');
  };

  const handleDeleteQuickLink = (id: string) => {
    phase2Service.deleteQuickLink(id);
    setQuickLinks(quickLinks.filter((l) => l.id !== id));
    showToast('Link removido.', 'info');
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
    showToast('Registro de histórico adicionado.', 'success');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client.companyName}
      subtitle={`Segmento: ${client.segment} • Início em ${new Date(client.startDate).toLocaleDateString('pt-BR')} • Gestor: ${client.accountManager}`}
      maxWidth="980px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge status={client.status} />
            {client.status === 'Onboarding' && (
              <span style={{ fontSize: '0.8rem', color: 'var(--sand-gold-dark)', fontWeight: 650 }}>
                Onboarding: {onboardingProgress}% concluído
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onEdit(client)}>
              Editar Cadastro
            </button>
            <button className="btn btn-primary btn-sm" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Barra de Ações Rápidas do Cliente */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            background: 'var(--cream-subtle)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--cream-border)'
          }}
        >
          <span style={{ fontSize: '0.82rem', fontWeight: 650, color: 'var(--green-deep)' }}>
            Ações Rápidas:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (onCreateProjectForClient) onCreateProjectForClient(client);
              }}
              style={{ fontSize: '0.78rem', padding: '5px 10px', gap: '4px' }}
            >
              <Plus size={13} /> Criar projeto
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (onCreateTaskForClient) onCreateTaskForClient(client);
              }}
              style={{ fontSize: '0.78rem', padding: '5px 10px', gap: '4px' }}
            >
              <Plus size={13} /> Criar tarefa
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (onCreateContractForClient) onCreateContractForClient(client);
              }}
              style={{ fontSize: '0.78rem', padding: '5px 10px', gap: '4px' }}
            >
              <Plus size={13} /> Adicionar contrato
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (onCreateMaterialForClient) onCreateMaterialForClient(client);
              }}
              style={{ fontSize: '0.78rem', padding: '5px 10px', gap: '4px' }}
            >
              <Plus size={13} /> Adicionar material
            </button>
          </div>
        </div>

        {/* Abas solicitadas no Prompt */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            borderBottom: '1px solid var(--cream-border)',
            overflowX: 'auto',
            paddingBottom: '2px'
          }}
        >
          {[
            { id: 'overview', label: 'Visão Geral' },
            { id: 'projects', label: `Projetos (${projects.length})` },
            { id: 'tasks', label: `Tarefas (${tasks.length})` },
            { id: 'materials', label: `Materiais (${materials.length})` },
            { id: 'approvals', label: `Aprovações (${approvals.length})` },
            { id: 'contracts', label: `Contratos (${contracts.length})` },
            { id: 'financial', label: `Financeiro (${financials.length})` },
            { id: 'onboarding', label: `Onboarding (${onboardingProgress}%)` },
            { id: 'links', label: `Links Rápidos (${quickLinks.length})` },
            { id: 'history', label: 'Histórico & Notas' },
            { id: 'offboarding', label: 'Offboarding' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                padding: '8px 14px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--green-deep)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--green-deep)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.86rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 1. ABA: VISÃO GERAL */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div className="card" style={{ padding: '16px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Contato Principal
                </span>
                <div style={{ fontSize: '1rem', fontWeight: 650, color: 'var(--green-deep)', marginTop: '4px' }}>
                  {client.contactName}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px', fontSize: '0.86rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <Mail size={14} color="var(--sand-gold-dark)" /> {client.email}
                  </div>
                  {client.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                      <Phone size={14} color="var(--sand-gold-dark)" /> {client.phone}
                    </div>
                  )}
                </div>
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Serviços Contratados
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {client.services && client.services.length > 0 ? (
                    client.services.map((s) => <Badge key={s} status={s} type="service" />)
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>Nenhum serviço vinculado.</span>
                  )}
                </div>
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Operação & Gestão
                </span>
                <div style={{ marginTop: '8px', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div><strong>Gestor da Conta:</strong> {client.accountManager}</div>
                  <div><strong>Status:</strong> {client.status}</div>
                  <div><strong>Início da Parceria:</strong> {new Date(client.startDate).toLocaleDateString('pt-BR')}</div>
                </div>
              </div>
            </div>

            {client.notes && (
              <div className="card" style={{ padding: '16px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Observações Estratégicas
                </span>
                <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {client.notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 2. ABA: PROJETOS */}
        {activeTab === 'projects' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 650, color: 'var(--green-deep)' }}>
                Projetos vinculados a {client.companyName}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onCreateProjectForClient && onCreateProjectForClient(client)}
                style={{ gap: '4px' }}
              >
                <Plus size={14} /> Novo Projeto
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <FolderOpen size={28} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                  Nenhum projeto cadastrado para este cliente.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="card"
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (onNavigateToProject) {
                        onClose();
                        onNavigateToProject(p.id);
                      }
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 650, color: 'var(--text-primary)', fontSize: '0.96rem' }}>{p.name}</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Badge status={p.service} type="service" />
                        <span>Prazo: {new Date(p.dueDate).toLocaleDateString('pt-BR')}</span>
                        <span>• Responsável: {p.responsible}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Badge status={p.status} />
                      <ArrowRight size={16} color="var(--text-muted)" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. ABA: TAREFAS */}
        {activeTab === 'tasks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 650, color: 'var(--green-deep)' }}>
                Tarefas operacionais
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onCreateTaskForClient && onCreateTaskForClient(client)}
                style={{ gap: '4px' }}
              >
                <Plus size={14} /> Nova Tarefa
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <CheckSquare size={28} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                  Nenhuma tarefa pendente para este cliente.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="card"
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (onNavigateToTask) {
                        onClose();
                        onNavigateToTask(t.id);
                      }
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{t.title}</span>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Responsável: {t.responsible} • Prazo: {new Date(t.dueDate).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <Badge status={t.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. ABA: MATERIAIS */}
        {activeTab === 'materials' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 650, color: 'var(--green-deep)' }}>
                Biblioteca e Ativos do Cliente
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onCreateMaterialForClient && onCreateMaterialForClient(client)}
                style={{ gap: '4px' }}
              >
                <Plus size={14} /> Adicionar Material
              </button>
            </div>

            {materials.length === 0 ? (
              <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                  Nenhum arquivo ou material vinculado a este cliente.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                {materials.map((m) => (
                  <div
                    key={m.id}
                    className="card"
                    style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                  >
                    <div style={{ fontWeight: 650, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{m.name}</div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{m.category}</span>
                    {m.externalUrl && (
                      <a
                        href={m.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ alignSelf: 'flex-start', marginTop: '6px', fontSize: '0.76rem' }}
                      >
                        <ExternalLink size={12} /> Acessar Link
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. ABA: APROVAÇÕES */}
        {activeTab === 'approvals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 650, color: 'var(--green-deep)' }}>
              Aprovações do Cliente
            </span>
            {approvals.length === 0 ? (
              <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                  Nenhum item em fluxo de aprovação para este cliente.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {approvals.map((a) => (
                  <div
                    key={a.id}
                    className="card"
                    style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ fontWeight: 650, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{a.title}</div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tipo: {a.type}</span>
                    </div>
                    <Badge status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. ABA: CONTRATOS */}
        {activeTab === 'contracts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 650, color: 'var(--green-deep)' }}>
                Contratos Vigentes
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onCreateContractForClient && onCreateContractForClient(client)}
                style={{ gap: '4px' }}
              >
                <Plus size={14} /> Adicionar Contrato
              </button>
            </div>

            {contracts.length === 0 ? (
              <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                  Nenhum contrato formal cadastrado para este cliente.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {contracts.map((c) => (
                  <div
                    key={c.id}
                    className="card"
                    style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ fontWeight: 650, color: 'var(--text-primary)', fontSize: '0.96rem' }}>
                        {c.service} — R$ {c.value.toLocaleString('pt-BR')} ({c.recurrence})
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Vigência: {new Date(c.startDate).toLocaleDateString('pt-BR')} até {new Date(c.endDate).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <Badge status={c.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. ABA: FINANCEIRO */}
        {activeTab === 'financial' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 650, color: 'var(--green-deep)' }}>
              Extrato Financeiro
            </span>
            {financials.length === 0 ? (
              <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                  Nenhum lançamento financeiro registrado para este cliente.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {financials.map((f) => (
                  <div
                    key={f.id}
                    className="card"
                    style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{f.description}</div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Vencimento: {new Date(f.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--green-deep)', fontSize: '0.95rem' }}>
                        R$ {f.value.toLocaleString('pt-BR')}
                      </span>
                      <Badge status={f.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 8. ABA: ONBOARDING */}
        {activeTab === 'onboarding' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--green-deep)', fontSize: '1.05rem' }}>
                    Checklist de Onboarding da Alicerce
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    Ao concluir 100% das etapas, o cliente pode ser ativado diretamente na carteira operacional.
                  </p>
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--sand-gold-dark)' }}>
                  {onboardingProgress}%
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: '8px', background: 'var(--cream-subtle)', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ width: `${onboardingProgress}%`, height: '100%', background: 'var(--green-primary)', transition: 'width 0.3s ease' }} />
              </div>

              {/* Checklist items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {onboardingItems.map((item) => (
                  <div
                    key={item.key}
                    onClick={() => handleToggleOnboarding(item.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: item.completed ? 'rgba(34, 197, 94, 0.06)' : 'var(--cream-subtle)',
                      border: item.completed ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid var(--cream-border-subtle)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {item.completed ? (
                        <CheckSquare size={18} color="#15803D" />
                      ) : (
                        <Square size={18} color="var(--text-muted)" />
                      )}
                      <span
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: item.completed ? 600 : 500,
                          color: item.completed ? '#15803D' : 'var(--text-primary)',
                          textDecoration: item.completed ? 'line-through' : 'none'
                        }}
                      >
                        {item.title}
                      </span>
                    </div>

                    {item.completedAt && (
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Concluído em {new Date(item.completedAt).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Botão de Conclusão e Ativação */}
              {client.status === 'Onboarding' && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--cream-border)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleActivateClientFromOnboarding}
                    disabled={isActivating}
                    style={{ gap: '8px', fontWeight: 650 }}
                  >
                    <CheckCircle2 size={16} />
                    {onboardingProgress === 100 ? 'Concluir Onboarding & Ativar Cliente' : 'Ativar Cliente na Operação'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 9. ABA: LINKS RÁPIDOS */}
        {activeTab === 'links' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <form onSubmit={handleAddQuickLink} className="card" style={{ padding: '16px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--green-deep)', display: 'block', marginBottom: '10px' }}>
                Adicionar Link Rápido (Drive, Meta Ads, Redes, Site)
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Título</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Pasta Google Drive"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>URL</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://drive.google.com/..."
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Categoria</label>
                  <select
                    className="form-select"
                    value={newLinkCat}
                    onChange={(e) => setNewLinkCat(e.target.value as any)}
                  >
                    <option value="Drive">Drive</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Meta Ads">Meta Ads</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Google Meu Negócio">Google Meu Negócio</option>
                    <option value="Site">Site</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '10px 14px' }}>
                  <Plus size={14} /> Salvar
                </button>
              </div>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {quickLinks.map((link) => (
                <div
                  key={link.id}
                  className="card"
                  style={{
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--sand-gold-dark)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {link.category}
                    </span>
                    <div style={{ fontWeight: 650, fontSize: '0.94rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {link.title}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 10px', fontSize: '0.78rem', gap: '4px' }}
                    >
                      <ExternalLink size={13} /> Abrir
                    </a>
                    <button
                      className="sidebar-collapse-btn"
                      onClick={() => handleDeleteQuickLink(link.id)}
                      style={{ color: '#DC2626' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. ABA: HISTÓRICO & NOTAS */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <form onSubmit={handleAddComment} className="card" style={{ padding: '16px' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 650 }}>
                Registrar Nota Interna ou Alinhamento
              </label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Alinhamento realizado sobre aprovação de criativos..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap', gap: '6px' }}>
                  <Send size={14} /> Registrar
                </button>
              </div>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {comments.map((cmt) => (
                <div key={cmt.id} className="card" style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <strong>{cmt.userName}</strong>
                    <span>{new Date(cmt.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    {cmt.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 11. ABA: OFFBOARDING */}
        {activeTab === 'offboarding' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--green-deep)', fontSize: '1.05rem' }}>
                    Checklist de Offboarding / Encerramento
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    Rito formal de entrega de arquivos, revogação de acessos e quitação de pendências.
                  </p>
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--sand-gold-dark)' }}>
                  {offboardingProgress}%
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: '8px', background: 'var(--cream-subtle)', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ width: `${offboardingProgress}%`, height: '100%', background: '#DC2626', transition: 'width 0.3s ease' }} />
              </div>

              {/* Checklist items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {offboardingItems.map((item) => (
                  <div
                    key={item.key}
                    onClick={() => handleToggleOffboarding(item.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: item.completed ? 'rgba(220, 38, 38, 0.06)' : 'var(--cream-subtle)',
                      border: item.completed ? '1px solid rgba(220, 38, 38, 0.2)' : '1px solid var(--cream-border-subtle)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {item.completed ? (
                        <CheckSquare size={18} color="#DC2626" />
                      ) : (
                        <Square size={18} color="var(--text-muted)" />
                      )}
                      <span
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: item.completed ? 600 : 500,
                          color: item.completed ? '#DC2626' : 'var(--text-primary)',
                          textDecoration: item.completed ? 'line-through' : 'none'
                        }}
                      >
                        {item.title}
                      </span>
                    </div>

                    {item.completedAt && (
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Concluído em {new Date(item.completedAt).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {client.status !== 'Encerrado' && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--cream-border)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={handleCloseClientFromOffboarding}
                    style={{ color: '#DC2626', borderColor: '#FCA5A5', gap: '6px' }}
                  >
                    Encerrar Parceria com o Cliente
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
