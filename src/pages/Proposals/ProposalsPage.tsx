import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Send,
  Trash2,
  DollarSign,
  ArrowRight,
  Briefcase,
  FileCheck2,
  UserCheck
} from 'lucide-react';
import { Proposal, ProposalStatus, ServiceType, Client, Lead } from '../../types';
import { phase2Service } from '../../services/phase2';
import { clientsService } from '../../services/clients';
import { dashboardService } from '../../services/dashboard';
import { Modal } from '../../components/Common/Modal';
import { useToast } from '../../components/Common/Toast';
import { NavTab } from '../../components/Layout/Sidebar';

interface ProposalsPageProps {
  initialFilter?: string;
  action?: string;
  leadId?: string;
  leadName?: string;
  company?: string;
  service?: string;
  estimatedValue?: number;
  onNavigate?: (tab: NavTab, params?: any) => void;
}

const ALL_SERVICES: ServiceType[] = [
  'Meta Ads',
  'Google Ads',
  'Social Media',
  'Google Meu Negócio',
  'Landing Page',
  'Site Institucional',
  'Identidade Visual',
  'Criativos',
  'Edição de Vídeo',
  'Plano Estratégico',
  'Outros'
];

export const ProposalsPage: React.FC<ProposalsPageProps> = ({
  initialFilter,
  action,
  leadId,
  leadName,
  company,
  service,
  estimatedValue,
  onNavigate
}) => {
  const { showToast } = useToast();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | ProposalStatus | 'Pendentes'>(() => {
    if (initialFilter?.toLowerCase() === 'pendente' || initialFilter?.toLowerCase() === 'pendentes') {
      return 'Pendentes';
    }
    return 'Todos';
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [approvedProposalModal, setApprovedProposalModal] = useState<Proposal | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    targetType: 'client' as 'client' | 'lead',
    clientId: '',
    leadId: '',
    customName: '',
    description: '',
    services: ['Meta Ads'] as ServiceType[],
    subtotal: 3500,
    discount: 0,
    deadline: '15 dias úteis',
    validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    notes: '',
    status: 'Rascunho' as ProposalStatus
  });

  const loadData = async () => {
    const [props, cls, lds] = await Promise.all([
      phase2Service.getProposals(),
      clientsService.getClients(),
      phase2Service.getLeads()
    ]);
    setProposals(props || []);
    setClients(cls || []);
    setLeads(lds || []);
  };

  useEffect(() => {
    loadData();
    if (action === 'create') {
      handleOpenCreatePrefilled();
    }
  }, [action, leadId, company, service, estimatedValue]);

  const handleOpenCreatePrefilled = () => {
    setEditingProposal(null);
    setFormData({
      title: `Proposta Estratégica: ${company || 'Cliente'}`,
      targetType: leadId ? 'lead' : 'client',
      clientId: '',
      leadId: leadId || '',
      customName: company || '',
      description: 'Estruturação operacional de presença, tráfego pago e conversão.',
      services: service ? [service as ServiceType] : ['Meta Ads'],
      subtotal: estimatedValue || 3500,
      discount: 0,
      deadline: '15 dias úteis',
      validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      notes: 'Investimento sob contrato semestral com acompanhamento executivo.',
      status: 'Rascunho'
    });
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingProposal(null);
    setFormData({
      title: 'Proposta de Estruturação Digital & Tráfego',
      targetType: 'client',
      clientId: clients[0]?.id || '',
      leadId: '',
      customName: '',
      description: 'Estruturação operacional de presença, tráfego pago e conversão.',
      services: ['Meta Ads'],
      subtotal: 3500,
      discount: 0,
      deadline: '15 dias úteis',
      validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      notes: 'Investimento mensal recorrente sob contrato semestral.',
      status: 'Rascunho'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (proposal: Proposal) => {
    setEditingProposal(proposal);
    setFormData({
      title: proposal.title,
      targetType: proposal.leadId ? 'lead' : 'client',
      clientId: proposal.clientId || '',
      leadId: proposal.leadId || '',
      customName: proposal.clientName || '',
      description: proposal.description,
      services: proposal.services,
      subtotal: proposal.subtotal,
      discount: proposal.discount,
      deadline: proposal.deadline,
      validUntil: proposal.validUntil,
      notes: proposal.notes || '',
      status: proposal.status
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('O título da proposta é obrigatório.', 'error');
      return;
    }

    let clientName = formData.customName;
    if (formData.targetType === 'client' && formData.clientId) {
      const selectedCl = clients.find((c) => c.id === formData.clientId);
      if (selectedCl) clientName = selectedCl.companyName;
    } else if (formData.targetType === 'lead' && formData.leadId) {
      const selectedLd = leads.find((l) => l.id === formData.leadId);
      if (selectedLd) clientName = selectedLd.company;
    }

    const total = Math.max(0, Number(formData.subtotal) - Number(formData.discount));

    const saved = await phase2Service.saveProposal({
      ...(editingProposal ? { id: editingProposal.id } : {}),
      title: formData.title,
      clientId: formData.targetType === 'client' ? formData.clientId : undefined,
      leadId: formData.targetType === 'lead' ? formData.leadId : undefined,
      clientName: clientName || 'Lead Comercial',
      description: formData.description,
      services: formData.services,
      subtotal: Number(formData.subtotal),
      discount: Number(formData.discount),
      total,
      deadline: formData.deadline,
      validUntil: formData.validUntil,
      notes: formData.notes,
      status: formData.status
    });

    await dashboardService.logActivity(
      editingProposal ? 'Proposta Atualizada' : 'Proposta Criada',
      'proposal',
      saved.id,
      `Proposta "${saved.title}" (R$ ${saved.total.toLocaleString('pt-BR')}) para "${saved.clientName}".`
    );

    showToast(editingProposal ? 'Proposta atualizada.' : 'Proposta criada com sucesso.', 'success');
    setIsModalOpen(false);
    loadData();
  };

  // Botão Enviar Proposta (atualiza para Enviada e registra data)
  const handleSendProposal = async (prop: Proposal) => {
    await phase2Service.saveProposal({
      id: prop.id,
      status: 'Enviada'
    });

    await dashboardService.logActivity(
      'Proposta Enviada',
      'proposal',
      prop.id,
      `Proposta "${prop.title}" enviada formalmente para o cliente "${prop.clientName}".`
    );

    showToast(`Proposta marcada como enviada para "${prop.clientName}".`, 'success');
    loadData();
  };

  // Ao marcar proposta como Aprovada -> Opção de Converter em cliente ou Criar Projeto/Contrato
  const handleApproveProposal = async (prop: Proposal) => {
    await phase2Service.saveProposal({
      id: prop.id,
      status: 'Aprovada'
    });

    await dashboardService.logActivity(
      'Proposta Aprovada',
      'proposal',
      prop.id,
      `Proposta "${prop.title}" (R$ ${prop.total.toLocaleString('pt-BR')}) APROVADA por "${prop.clientName}".`
    );

    showToast('Proposta aprovada com sucesso!', 'success');
    loadData();

    // Abre diálogo para desdobrar em cliente, projeto ou contrato
    setApprovedProposalModal(prop);
  };

  const handleConvertApprovedLeadToClient = async (prop: Proposal) => {
    const lead = leads.find((l) => l.id === prop.leadId);
    if (lead) {
      const created = await phase2Service.convertLeadToClient(lead);
      showToast(`Cliente "${created.companyName}" criado e Onboarding iniciado!`, 'success');
      setApprovedProposalModal(null);
      if (onNavigate) {
        onNavigate('clients', { id: created.id, subTab: 'onboarding' });
      }
    } else {
      // Se não encontrar o lead cadastrado, cria o cliente com os dados da proposta
      const created = await clientsService.createClient({
        companyName: prop.clientName,
        contactName: prop.clientName,
        email: `contato@${prop.clientName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br`,
        phone: '',
        segment: 'Comercial',
        services: prop.services,
        startDate: new Date().toISOString().split('T')[0],
        status: 'Onboarding',
        accountManager: 'Wesley Nunes',
        notes: `Convertido a partir da proposta aprovada "${prop.title}".`
      });
      showToast(`Cliente "${prop.clientName}" criado com sucesso!`, 'success');
      setApprovedProposalModal(null);
      if (onNavigate && created) {
        onNavigate('clients', { id: created.id, subTab: 'onboarding' });
      }
    }
  };

  const handleCreateProjectFromApproved = (prop: Proposal) => {
    setApprovedProposalModal(null);
    if (onNavigate) {
      onNavigate('projects', {
        action: 'create',
        clientId: prop.clientId,
        clientName: prop.clientName,
        service: prop.services[0] || 'Meta Ads'
      });
    }
  };

  const handleCreateContractFromApproved = (prop: Proposal) => {
    setApprovedProposalModal(null);
    if (onNavigate) {
      onNavigate('contracts', {
        action: 'create',
        clientId: prop.clientId,
        clientName: prop.clientName,
        service: prop.services[0] || 'Meta Ads',
        value: prop.total
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir esta proposta?')) {
      await phase2Service.deleteProposal(id);
      showToast('Proposta removida.', 'info');
      loadData();
    }
  };

  const getStatusBadge = (st: ProposalStatus) => {
    const styles: Record<ProposalStatus, { bg: string; color: string }> = {
      Rascunho: { bg: 'var(--cream-subtle)', color: 'var(--text-muted)' },
      Enviada: { bg: '#EDF4F9', color: '#1D557B' },
      Visualizada: { bg: '#FEF5E7', color: '#8F5310' },
      Aprovada: { bg: '#EAF5EE', color: '#1B6346' },
      Recusada: { bg: '#FEE2E2', color: '#B91C1C' },
      Expirada: { bg: '#F1F5F9', color: '#64748B' }
    };
    const s = styles[st] || styles.Rascunho;
    return (
      <span style={{ fontSize: '0.76rem', fontWeight: 650, padding: '3px 8px', borderRadius: '4px', background: s.bg, color: s.color }}>
        {st}
      </span>
    );
  };

  const filteredProposals = proposals.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.services.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesStatus = true;
    if (statusFilter === 'Pendentes') {
      matchesStatus = p.status === 'Enviada' || p.status === 'Visualizada' || p.status === 'Rascunho';
    } else if (statusFilter !== 'Todos') {
      matchesStatus = p.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
            Propostas Comerciais
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', margin: 0, fontWeight: 450 }}>
            Propostas de escopo, precificação e envio formal para clientes e leads.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '6px' }}>
          <Plus size={16} /> Nova Proposta
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '420px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por título ou empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{ minWidth: '160px' }}
        >
          <option value="Todos">Todos os Status</option>
          <option value="Pendentes">Pendentes de Retorno</option>
          <option value="Rascunho">Rascunho</option>
          <option value="Enviada">Enviada</option>
          <option value="Visualizada">Visualizada</option>
          <option value="Aprovada">Aprovada</option>
          <option value="Recusada">Recusada</option>
        </select>
      </div>

      {/* Grid de Propostas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {filteredProposals.map((prop) => (
          <div
            key={prop.id}
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
                  {prop.clientName}
                </span>
                {getStatusBadge(prop.status)}
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--green-deep)', margin: '0 0 8px' }}>
                {prop.title}
              </h3>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                {prop.services.map((s) => (
                  <span
                    key={s}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'var(--cream-subtle)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>

              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 12px' }}>
                {prop.description}
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--cream-border-subtle)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Valor Total</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--green-deep)' }}>
                  R$ {prop.total.toLocaleString('pt-BR')}
                </span>
              </div>

              {/* Botões de Ação Funcional Conforme Regra do Prompt */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
                {prop.status === 'Rascunho' && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleSendProposal(prop)}
                    style={{ gap: '4px', fontSize: '0.78rem' }}
                  >
                    <Send size={13} /> Enviar Proposta
                  </button>
                )}

                {prop.status !== 'Aprovada' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleApproveProposal(prop)}
                    style={{ gap: '4px', fontSize: '0.78rem' }}
                  >
                    <CheckCircle2 size={13} /> Marcar Aprovada
                  </button>
                )}

                <button
                  className="sidebar-collapse-btn"
                  onClick={() => handleOpenEdit(prop)}
                  title="Editar proposta"
                >
                  Editar
                </button>
                <button
                  className="sidebar-collapse-btn"
                  onClick={() => handleDelete(prop.id)}
                  title="Excluir proposta"
                  style={{ color: '#DC2626' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredProposals.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center' }}>
            <FileText size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', margin: 0 }}>
              Nenhuma proposta encontrada com os filtros selecionados.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Desdobramento de Proposta Aprovada (Prompt requirement) */}
      {approvedProposalModal && (
        <Modal
          isOpen={!!approvedProposalModal}
          onClose={() => setApprovedProposalModal(null)}
          title="Proposta Aprovada!"
          subtitle={`A proposta "${approvedProposalModal.title}" foi aceita. Deseja desdobrar nos próximos passos operacionais?`}
          maxWidth="560px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Escolha a ação desejada para iniciar a operação deste novo serviço ou cliente:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {approvedProposalModal.leadId && (
                <button
                  className="card"
                  onClick={() => handleConvertApprovedLeadToClient(approvedProposalModal)}
                  style={{
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    border: '1px solid var(--green-primary)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <UserCheck size={20} color="var(--green-deep)" />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 650, color: 'var(--green-deep)' }}>Converter em Cliente & Iniciar Onboarding</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Cadastra na carteira e abre o checklist de onboarding</div>
                    </div>
                  </div>
                  <ArrowRight size={16} color="var(--green-deep)" />
                </button>
              )}

              <button
                className="card"
                onClick={() => handleCreateContractFromApproved(approvedProposalModal)}
                style={{
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileCheck2 size={20} color="var(--sand-gold-dark)" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 650, color: 'var(--text-primary)' }}>Gerar Contrato Formal</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Preenche valores e serviços da proposta no módulo de contratos</div>
                  </div>
                </div>
                <ArrowRight size={16} color="var(--text-muted)" />
              </button>

              <button
                className="card"
                onClick={() => handleCreateProjectFromApproved(approvedProposalModal)}
                style={{
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Briefcase size={20} color="var(--sand-gold-dark)" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 650, color: 'var(--text-primary)' }}>Abrir Projeto Operacional</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Inicia o projeto com template correspondente</div>
                  </div>
                </div>
                <ArrowRight size={16} color="var(--text-muted)" />
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Cadastro / Edição de Proposta */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProposal ? 'Editar Proposta' : 'Nova Proposta'}
        subtitle="Construa o escopo, valores e termos da proposta"
        maxWidth="680px"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Título da Proposta *</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
            <div>
              <label className="form-label">Destinatário</label>
              <select
                className="form-select"
                value={formData.targetType}
                onChange={(e) => setFormData({ ...formData, targetType: e.target.value as any })}
              >
                <option value="client">Cliente Cadastrado</option>
                <option value="lead">Lead Comercial</option>
              </select>
            </div>

            <div>
              <label className="form-label">Selecionar Destinatário</label>
              {formData.targetType === 'client' ? (
                <select
                  className="form-select"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                >
                  <option value="">Selecione o cliente...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
              ) : (
                <select
                  className="form-select"
                  value={formData.leadId}
                  onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                >
                  <option value="">Selecione o lead...</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>{l.company} ({l.name})</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="form-label">Serviços Inclusos na Proposta</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
              {ALL_SERVICES.map((svc) => {
                const isSelected = formData.services.includes(svc);
                return (
                  <button
                    key={svc}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setFormData({ ...formData, services: formData.services.filter((s) => s !== svc) });
                      } else {
                        setFormData({ ...formData, services: [...formData.services, svc] });
                      }
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--cream-border)',
                      background: isSelected ? 'var(--green-deep)' : 'var(--cream-subtle)',
                      color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {svc}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Subtotal (R$)</label>
              <input
                type="number"
                className="form-input"
                value={formData.subtotal}
                onChange={(e) => setFormData({ ...formData, subtotal: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="form-label">Desconto (R$)</label>
              <input
                type="number"
                className="form-input"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="form-label">Total Final</label>
              <div style={{ height: '38px', display: 'flex', alignItems: 'center', fontWeight: 700, color: 'var(--green-deep)', fontSize: '1.1rem' }}>
                R$ {Math.max(0, formData.subtotal - formData.discount).toLocaleString('pt-BR')}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Prazo de Entrega Estimado</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: 15 dias úteis"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Validade da Proposta</label>
              <input
                type="date"
                className="form-input"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Descrição do Escopo</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Resumo das entregas incluídas..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingProposal ? 'Salvar Alterações' : 'Salvar como Rascunho'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
