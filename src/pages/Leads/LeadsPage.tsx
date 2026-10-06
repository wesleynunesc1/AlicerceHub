import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Kanban as KanbanIcon,
  List,
  UserCheck,
  TrendingUp,
  DollarSign,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MessageSquare,
  Clock,
  Send,
  FileText
} from 'lucide-react';
import { Lead, LeadStatus, LeadOrigin, ServiceType, InternalComment } from '../../types';
import { phase2Service } from '../../services/phase2';
import { dashboardService } from '../../services/dashboard';
import { Modal } from '../../components/Common/Modal';
import { useToast } from '../../components/Common/Toast';
import { NavTab } from '../../components/Layout/Sidebar';

interface LeadsPageProps {
  initialFilter?: string;
  selectedLeadId?: string;
  onNavigate?: (tab: NavTab, params?: any) => void;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({
  initialFilter,
  selectedLeadId,
  onNavigate
}) => {
  const { showToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [originFilter, setOriginFilter] = useState<'Todas' | LeadOrigin>('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);

  // Modal de Registro de Contato
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactData, setContactData] = useState({
    type: 'WhatsApp',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    result: 'Interessado na proposta',
    nextStep: 'Agendar apresentação',
    createFollowUp: true,
    followUpDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
  });

  // Modal de Criação / Edição de Lead
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    whatsapp: '',
    email: '',
    serviceOfInterest: 'Meta Ads' as ServiceType,
    origin: 'Instagram' as LeadOrigin,
    estimatedValue: 2500,
    responsible: 'Wesley Nunes',
    status: 'Novo lead' as LeadStatus,
    nextFollowUp: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    notes: ''
  });

  const loadLeads = async () => {
    const list = await phase2Service.getLeads();
    setLeads(list || []);

    if (selectedLeadId && list) {
      const found = list.find((l) => l.id === selectedLeadId);
      if (found) setViewingLead(found);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [selectedLeadId]);

  const handleOpenCreate = () => {
    setEditingLead(null);
    setFormData({
      name: '',
      company: '',
      phone: '',
      whatsapp: '',
      email: '',
      serviceOfInterest: 'Meta Ads',
      origin: 'Instagram',
      estimatedValue: 2500,
      responsible: 'Wesley Nunes',
      status: 'Novo lead',
      nextFollowUp: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      company: lead.company,
      phone: lead.phone,
      whatsapp: lead.whatsapp || '',
      email: lead.email,
      serviceOfInterest: lead.serviceOfInterest,
      origin: lead.origin,
      estimatedValue: lead.estimatedValue,
      responsible: lead.responsible,
      status: lead.status,
      nextFollowUp: lead.nextFollowUp || '',
      notes: lead.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() && !formData.company.trim()) {
      showToast('Informe o nome do contato ou da empresa.', 'error');
      return;
    }

    const resolvedName = formData.name.trim() || formData.company.trim();
    const resolvedCompany = formData.company.trim() || formData.name.trim();

    const saved = await phase2Service.saveLead({
      ...(editingLead ? { id: editingLead.id } : {}),
      ...formData,
      name: resolvedName,
      company: resolvedCompany
    });

    await dashboardService.logActivity(
      editingLead ? 'Lead Atualizado' : 'Novo Lead Cadastrado',
      'lead',
      saved.id,
      `Lead "${saved.company}" (${saved.serviceOfInterest}) salvo no funil comercial.`
    );

    showToast(editingLead ? 'Lead atualizado.' : 'Lead cadastrado com sucesso.', 'success');
    setIsModalOpen(false);
    loadLeads();
  };

  // Mover lead entre colunas do Kanban com persistência e histórico automático
  const handleStatusChange = async (lead: Lead, newStatus: LeadStatus) => {
    if (lead.status === newStatus) return;

    await phase2Service.saveLead({
      id: lead.id,
      status: newStatus
    });

    await dashboardService.logActivity(
      'Etapa do Lead Alterada',
      'lead',
      lead.id,
      `Lead "${lead.company}" movido de "${lead.status}" para "${newStatus}".`
    );

    showToast(`Lead "${lead.company}" avançou para "${newStatus}".`, 'info');
    loadLeads();

    // Se movido para Fechado, abre modal para converter em cliente
    if (newStatus === 'Fechado') {
      handleOpenConvertToClient(lead);
    }
  };

  // Ação: Registrar Contato com Lead
  const handleOpenContactModal = (lead: Lead) => {
    setViewingLead(lead);
    setContactData({
      type: 'WhatsApp',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      result: 'Interessado na proposta',
      nextStep: 'Apresentar proposta de serviços',
      createFollowUp: true,
      followUpDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
    });
    setIsContactModalOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingLead || !contactData.notes.trim()) {
      showToast('Preencha a observação do contato.', 'error');
      return;
    }

    await phase2Service.recordLeadContact(viewingLead.id, {
      type: contactData.type,
      date: contactData.date,
      notes: contactData.notes,
      result: contactData.result,
      nextStep: contactData.nextStep,
      followUpDate: contactData.createFollowUp ? contactData.followUpDate : undefined
    });

    showToast('Contato registrado com sucesso no histórico do lead!', 'success');
    setIsContactModalOpen(false);
    loadLeads();
  };

  // Ação: Converter Lead em Cliente (Regra do prompt: cria cliente, copia dados, atualiza lead para fechado, abre onboarding)
  const handleOpenConvertToClient = async (lead: Lead) => {
    if (confirm(`Deseja converter o lead "${lead.company}" em cliente da Alicerce e iniciar o Onboarding?`)) {
      try {
        const createdClient = await phase2Service.convertLeadToClient(lead);
        showToast(`Lead "${lead.company}" convertido em cliente com sucesso!`, 'success');
        loadLeads();
        setViewingLead(null);

        // Abre cliente na aba de Onboarding
        if (onNavigate) {
          onNavigate('clients', { id: createdClient.id, subTab: 'onboarding' });
        }
      } catch (err: any) {
        showToast(err?.message || 'Falha ao converter lead.', 'error');
      }
    }
  };

  // Ação: Criar Proposta a partir do Lead
  const handleCreateProposalFromLead = (lead: Lead) => {
    if (onNavigate) {
      onNavigate('proposals', {
        action: 'create',
        leadId: lead.id,
        leadName: lead.name,
        company: lead.company,
        service: lead.serviceOfInterest,
        estimatedValue: lead.estimatedValue
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este lead do pipeline?')) {
      await phase2Service.deleteLead(id);
      showToast('Lead removido.', 'info');
      setViewingLead(null);
      loadLeads();
    }
  };

  const pipelineStages: LeadStatus[] = [
    'Novo lead',
    'Contato realizado',
    'Diagnóstico',
    'Proposta',
    'Negociação',
    'Fechado',
    'Perdido'
  ];

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.serviceOfInterest.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOrigin = originFilter === 'Todas' || l.origin === originFilter;
    const matchesInitial = initialFilter === 'ativos' ? l.status !== 'Fechado' && l.status !== 'Perdido' : true;
    return matchesSearch && matchesOrigin && matchesInitial;
  });

  const totalPipelineValue = leads
    .filter((l) => l.status !== 'Perdido' && l.status !== 'Fechado')
    .reduce((acc, curr) => acc + curr.estimatedValue, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
            Comercial & Leads
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', margin: 0, fontWeight: 450 }}>
            Funil comercial, qualificação, registro de contatos e conversão em clientes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ display: 'flex', background: 'var(--cream-subtle)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: viewMode === 'kanban' ? '#FFFFFF' : 'transparent',
                fontWeight: viewMode === 'kanban' ? 650 : 500,
                color: viewMode === 'kanban' ? 'var(--green-deep)' : 'var(--text-muted)',
                cursor: 'pointer',
                boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <KanbanIcon size={16} /> Pipeline
            </button>
            <button
              onClick={() => setViewMode('lista')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: viewMode === 'lista' ? '#FFFFFF' : 'transparent',
                fontWeight: viewMode === 'lista' ? 650 : 500,
                color: viewMode === 'lista' ? 'var(--green-deep)' : 'var(--text-muted)',
                cursor: 'pointer',
                boxShadow: viewMode === 'lista' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <List size={16} /> Lista
            </button>
          </div>

          <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '6px' }}>
            <Plus size={16} /> Novo Lead
          </button>
        </div>
      </div>

      {/* Cards de Métricas Comerciais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Leads em Negociação</span>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '4px' }}>
            {leads.filter((l) => l.status !== 'Fechado' && l.status !== 'Perdido').length}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>no pipeline ativo</span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Valor em Proposta</span>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '4px' }}>
            R$ {totalPipelineValue.toLocaleString('pt-BR')}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>potencial negociado</span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Convertidos em Clientes</span>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--sand-gold-dark)', marginTop: '4px' }}>
            {leads.filter((l) => l.status === 'Fechado').length}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>fechados e ativos</span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '420px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por nome, empresa ou serviço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            className="form-select"
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value as any)}
            style={{ minWidth: '150px' }}
          >
            <option value="Todas">Todas as Origens</option>
            <option value="Instagram">Instagram</option>
            <option value="Indicação">Indicação</option>
            <option value="Site">Site</option>
            <option value="Outbound">Outbound</option>
            <option value="Google">Google</option>
          </select>
        </div>
      </div>

      {/* Visualização: Pipeline Kanban */}
      {viewMode === 'kanban' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(240px, 1fr))',
            gap: '16px',
            overflowX: 'auto',
            paddingBottom: '20px',
            alignItems: 'start'
          }}
        >
          {pipelineStages.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.status === stage);
            const stageValue = stageLeads.reduce((acc, curr) => acc + curr.estimatedValue, 0);

            return (
              <div
                key={stage}
                style={{
                  background: 'var(--cream-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--cream-border-subtle)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  minHeight: '400px'
                }}
              >
                {/* Header da Coluna */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--green-deep)' }}>
                      {stage}
                    </span>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      R$ {stageValue.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: '#FFFFFF',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards da Coluna */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="card"
                      onClick={() => setViewingLead(lead)}
                      style={{
                        padding: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 650, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                          {lead.company}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'var(--cream-subtle)',
                            color: 'var(--sand-gold-dark)'
                          }}
                        >
                          {lead.origin}
                        </span>
                      </div>

                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {lead.name}
                      </span>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.76rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--green-deep)' }}>
                          R$ {lead.estimatedValue.toLocaleString('pt-BR')}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {lead.serviceOfInterest}
                        </span>
                      </div>

                      {/* Seletor rápido de coluna */}
                      <div style={{ marginTop: '6px', paddingTop: '8px', borderTop: '1px solid var(--cream-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mover:</span>
                        <select
                          className="form-select"
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead, e.target.value as LeadStatus)}
                          style={{ fontSize: '0.72rem', padding: '2px 6px', width: 'auto', height: '24px' }}
                        >
                          {pipelineStages.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      Nenhum lead nesta etapa
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Visualização: Lista de Leads */}
      {viewMode === 'lista' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="desktop-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Contato</th>
                  <th>Serviço de Interesse</th>
                  <th>Origem</th>
                  <th>Valor Estimado</th>
                  <th>Status</th>
                  <th>Próximo Follow-up</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} onClick={() => setViewingLead(lead)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{lead.company}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{lead.name}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{lead.phone || lead.whatsapp}</div>
                    </td>
                    <td>{lead.serviceOfInterest}</td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: 'var(--sand-gold-dark)', fontWeight: 600 }}>
                        {lead.origin}
                      </span>
                    </td>
                    <td style={{ fontWeight: 650, color: 'var(--green-deep)' }}>
                      R$ {lead.estimatedValue.toLocaleString('pt-BR')}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', fontWeight: 650, padding: '3px 8px', borderRadius: '4px', background: 'var(--cream-subtle)' }}>
                        {lead.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      {lead.nextFollowUp ? new Date(lead.nextFollowUp).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenContactModal(lead)}
                          title="Registrar contato"
                          style={{ padding: '4px 8px' }}
                        >
                          <Phone size={13} />
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleCreateProposalFromLead(lead)}
                          title="Criar proposta"
                          style={{ padding: '4px 8px' }}
                        >
                          <FileText size={13} />
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

      {/* Modal: Detalhes do Lead (com dados, histórico, e botões de ação do prompt) */}
      {viewingLead && (
        <Modal
          isOpen={!!viewingLead}
          onClose={() => setViewingLead(null)}
          title={viewingLead.company}
          subtitle={`Lead qualificado • Responsável: ${viewingLead.responsible}`}
          maxWidth="720px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const l = viewingLead;
                    setViewingLead(null);
                    handleOpenEdit(l);
                  }}
                >
                  Editar Dados
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
                  onClick={() => handleDelete(viewingLead.id)}
                >
                  Excluir
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleOpenContactModal(viewingLead)}
                >
                  <Phone size={14} /> Registrar Contato
                </button>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCreateProposalFromLead(viewingLead)}
                >
                  <FileText size={14} /> Criar Proposta
                </button>

                {viewingLead.status !== 'Fechado' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleOpenConvertToClient(viewingLead)}
                  >
                    <CheckCircle2 size={14} /> Converter em Cliente
                  </button>
                )}
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div className="card" style={{ padding: '14px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Contato</span>
                <div style={{ fontSize: '0.94rem', fontWeight: 650, color: 'var(--text-primary)', marginTop: '2px' }}>{viewingLead.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{viewingLead.phone || viewingLead.whatsapp}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{viewingLead.email}</div>
              </div>

              <div className="card" style={{ padding: '14px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Interesse Comercial</span>
                <div style={{ fontSize: '0.94rem', fontWeight: 650, color: 'var(--green-deep)', marginTop: '2px' }}>{viewingLead.serviceOfInterest}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Origem: {viewingLead.origin}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 650, color: 'var(--green-deep)' }}>
                  Valor: R$ {viewingLead.estimatedValue.toLocaleString('pt-BR')}
                </div>
              </div>

              <div className="card" style={{ padding: '14px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Etapa no Funil</span>
                <div style={{ fontSize: '0.94rem', fontWeight: 650, color: 'var(--sand-gold-dark)', marginTop: '2px' }}>{viewingLead.status}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Próximo follow-up: {viewingLead.nextFollowUp ? new Date(viewingLead.nextFollowUp).toLocaleDateString('pt-BR') : 'Não agendado'}
                </div>
              </div>
            </div>

            {viewingLead.notes && (
              <div className="card" style={{ padding: '14px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Notas de Qualificação</span>
                <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {viewingLead.notes}
                </p>
              </div>
            )}

            {/* Histórico de Alinhamentos e Contatos */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--green-deep)', margin: '0 0 10px' }}>
                Histórico de Contatos e Atividades
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {phase2Service.getComments('lead', viewingLead.id).map((c) => (
                  <div key={c.id} className="card" style={{ padding: '10px 14px', fontSize: '0.84rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                      <strong>{c.userName}</strong>
                      <span>{new Date(c.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>{c.content}</p>
                  </div>
                ))}
                {phase2Service.getComments('lead', viewingLead.id).length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0 }}>
                    Nenhum contato registrado ainda. Clique em "Registrar Contato" para documentar.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Registrar Contato (Prompt requirement) */}
      {isContactModalOpen && viewingLead && (
        <Modal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          title={`Registrar Contato: ${viewingLead.company}`}
          subtitle="Documente a interação comercial e defina o próximo passo"
          maxWidth="560px"
        >
          <form onSubmit={handleSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">Canal de Contato</label>
                <select
                  className="form-select"
                  value={contactData.type}
                  onChange={(e) => setContactData({ ...contactData, type: e.target.value })}
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Reunião Online">Reunião Online</option>
                  <option value="Ligação Telefônica">Ligação Telefônica</option>
                  <option value="E-mail">E-mail</option>
                  <option value="Presencial">Presencial</option>
                </select>
              </div>

              <div>
                <label className="form-label">Data do Contato</label>
                <input
                  type="date"
                  className="form-input"
                  value={contactData.date}
                  onChange={(e) => setContactData({ ...contactData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Observação / Alinhamento Realizado</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Detalhes do que foi conversado..."
                value={contactData.notes}
                onChange={(e) => setContactData({ ...contactData, notes: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">Resultado</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Alinhado envio de proposta"
                  value={contactData.result}
                  onChange={(e) => setContactData({ ...contactData, result: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Próximo Passo</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Follow-up para apresentação"
                  value={contactData.nextStep}
                  onChange={(e) => setContactData({ ...contactData, nextStep: e.target.value })}
                />
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--cream-subtle)', borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={contactData.createFollowUp}
                  onChange={(e) => setContactData({ ...contactData, createFollowUp: e.target.checked })}
                />
                Criar evento de Follow-up na Agenda
              </label>

              {contactData.createFollowUp && (
                <div style={{ marginTop: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Data do Follow-up</label>
                  <input
                    type="date"
                    className="form-input"
                    value={contactData.followUpDate}
                    onChange={(e) => setContactData({ ...contactData, followUpDate: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsContactModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Salvar Contato
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Cadastro / Edição de Lead */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLead ? 'Editar Lead' : 'Novo Lead Comercial'}
        subtitle="Qualificação de nova oportunidade para a Alicerce"
        maxWidth="640px"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label">Nome do Contato *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Carlos Mendes"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label">Nome da Empresa (Opcional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Mendes Arquitetura"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label">Telefone / WhatsApp</label>
              <input
                type="text"
                className="form-input"
                placeholder="(11) 98765-4321"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value, whatsapp: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">E-mail</label>
              <input
                type="email"
                className="form-input"
                placeholder="contato@empresa.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label">Serviço de Interesse</label>
              <select
                className="form-select"
                value={formData.serviceOfInterest}
                onChange={(e) => setFormData({ ...formData, serviceOfInterest: e.target.value as ServiceType })}
              >
                <option value="Meta Ads">Meta Ads</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Landing Page">Landing Page</option>
                <option value="Social Media">Social Media</option>
                <option value="Identidade Visual">Identidade Visual</option>
                <option value="Plano Estratégico">Plano Estratégico</option>
              </select>
            </div>

            <div>
              <label className="form-label">Origem do Lead</label>
              <select
                className="form-select"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value as LeadOrigin })}
              >
                <option value="Instagram">Instagram</option>
                <option value="Indicação">Indicação</option>
                <option value="Site">Site</option>
                <option value="Outbound">Outbound</option>
                <option value="Google">Google</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label">Valor Estimado (R$)</label>
              <input
                type="number"
                className="form-input"
                value={formData.estimatedValue}
                onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="form-label">Status no Pipeline</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
              >
                {pipelineStages.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Observações Estratégicas</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Descreva o contexto do lead, dores relatadas e modelo de negócio..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingLead ? 'Salvar Alterações' : 'Cadastrar Lead'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
