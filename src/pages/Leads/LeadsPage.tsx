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
  ExternalLink
} from 'lucide-react';
import { Lead, LeadStatus, LeadOrigin, ServiceType } from '../../types';
import { phase2Service } from '../../services/phase2';
import { clientsService } from '../../services/clients';
import { Modal } from '../../components/Common/Modal';
import { useToast } from '../../components/Common/Toast';

export const LeadsPage: React.FC = () => {
  const { showToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [originFilter, setOriginFilter] = useState<'Todas' | LeadOrigin>('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

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
    setLeads(list);
  };

  useEffect(() => {
    loadLeads();
  }, []);

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
    if (!formData.name.trim() || !formData.company.trim()) {
      showToast('Nome e empresa são obrigatórios.', 'error');
      return;
    }

    await phase2Service.saveLead({
      ...(editingLead ? { id: editingLead.id } : {}),
      ...formData
    });

    showToast(editingLead ? 'Lead atualizado.' : 'Lead cadastrado com sucesso.', 'success');
    setIsModalOpen(false);
    loadLeads();
  };

  const handleConvertToClient = async (lead: Lead) => {
    if (confirm(`Deseja converter o lead "${lead.company}" em cliente ativo da Alicerce?`)) {
      try {
        const newClient = await clientsService.createClient({
          companyName: lead.company,
          contactName: lead.name,
          email: lead.email || 'contato@' + lead.company.toLowerCase().replace(/\s+/g, '') + '.com',
          phone: lead.phone || lead.whatsapp || '',
          segment: 'Comercial',
          services: [lead.serviceOfInterest],
          startDate: new Date().toISOString().split('T')[0],
          accountManager: lead.responsible,
          notes: `Convertido de lead comercial em ${new Date().toLocaleDateString('pt-BR')}. Notas de pré-venda: ${lead.notes || 'Nenhuma'}`
        });

        await phase2Service.saveLead({
          id: lead.id,
          status: 'Fechado',
          convertedClientId: newClient.id
        });

        showToast(`Lead convertido com sucesso em cliente: "${lead.company}"!`, 'success');
        loadLeads();
      } catch (err: any) {
        showToast(err?.message || 'Falha ao converter lead.', 'error');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este lead do pipeline?')) {
      await phase2Service.deleteLead(id);
      showToast('Lead removido.', 'info');
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
    return matchesSearch && matchesOrigin;
  });

  const totalPipelineValue = leads
    .filter((l) => l.status !== 'Perdido')
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
            Pipeline de vendas, prospecção e conversão de novos clientes Alicerce.
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
                cursor: 'pointer'
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
                cursor: 'pointer'
              }}
            >
              <List size={16} /> Lista
            </button>
          </div>

          <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '8px' }}>
            <Plus size={18} /> Novo Lead
          </button>
        </div>
      </div>

      {/* Faixa de Métricas Rápidas do Pipeline */}
      <div
        className="card"
        style={{
          padding: '18px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}
      >
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Volume Total no Pipeline
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '2px' }}>
            R$ {totalPipelineValue.toLocaleString('pt-BR')}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Oportunidades Ativas
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--sand-gold-dark)', marginTop: '2px' }}>
            {leads.filter((l) => l.status !== 'Fechado' && l.status !== 'Perdido').length}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Contratos Fechados
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--status-active-text)', marginTop: '2px' }}>
            {leads.filter((l) => l.status === 'Fechado').length}
          </div>
        </div>
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
            placeholder="Pesquisar por contato, empresa ou serviço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="form-input"
          style={{ width: 'auto', paddingRight: '32px' }}
          value={originFilter}
          onChange={(e) => setOriginFilter(e.target.value as any)}
        >
          <option value="Todas">Todas as origens</option>
          <option value="Instagram">Instagram</option>
          <option value="Meta Ads">Meta Ads</option>
          <option value="Google Ads">Google Ads</option>
          <option value="Indicação">Indicação</option>
          <option value="Site">Site</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Orgânico">Orgânico</option>
        </select>
      </div>

      {/* Conteúdo: Pipeline Kanban ou Lista */}
      {filteredLeads.length === 0 ? (
        <div
          className="card"
          style={{ padding: '64px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <TrendingUp size={32} color="var(--sand-gold-dark)" style={{ marginBottom: '14px' }} />
          <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Nenhum lead no pipeline no momento.
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', margin: '0 0 20px', maxWidth: '420px' }}>
            Cadastre novos contatos comerciais para acompanhar negociações e propostas.
          </p>
          <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '8px' }}>
            <Plus size={16} /> Cadastrar primeiro lead
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        <div
          style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            paddingBottom: '16px'
          }}
        >
          {pipelineStages.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.status === stage);
            return (
              <div
                key={stage}
                style={{
                  minWidth: '270px',
                  maxWidth: '290px',
                  flexShrink: 0,
                  background: 'var(--cream-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  border: '1px solid var(--cream-border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--green-deep)' }}>{stage}</span>
                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      background: 'rgba(0,0,0,0.06)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)'
                    }}
                  >
                    {stageLeads.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--cream-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleOpenEdit(lead)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                          {lead.company}
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 650, color: 'var(--sand-gold-dark)', background: 'var(--sand-gold-tint)', padding: '2px 6px', borderRadius: '4px' }}>
                          {lead.origin}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {lead.name} • {lead.serviceOfInterest}
                      </div>

                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--green-deep)' }}>
                        R$ {lead.estimatedValue.toLocaleString('pt-BR')}
                      </div>

                      {stage === 'Fechado' && !lead.convertedClientId && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ marginTop: '6px', width: '100%', justifyContent: 'center', gap: '6px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConvertToClient(lead);
                          }}
                        >
                          <UserCheck size={14} /> Converter em Cliente
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="desktop-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Empresa / Contato</th>
                  <th>Serviço de Interesse</th>
                  <th>Origem</th>
                  <th>Valor Estimado</th>
                  <th>Responsável</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} style={{ cursor: 'pointer' }} onClick={() => handleOpenEdit(lead)}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.94rem' }}>
                        {lead.company}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lead.name} • {lead.email || lead.phone}</div>
                    </td>
                    <td style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{lead.serviceOfInterest}</td>
                    <td>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, background: 'var(--cream-subtle)', padding: '2px 8px', borderRadius: '4px' }}>
                        {lead.origin}
                      </span>
                    </td>
                    <td style={{ fontWeight: 650, color: 'var(--green-deep)' }}>
                      R$ {lead.estimatedValue.toLocaleString('pt-BR')}
                    </td>
                    <td style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{lead.responsible}</td>
                    <td>
                      <span style={{ fontSize: '0.78rem', fontWeight: 650, padding: '3px 8px', borderRadius: '4px', background: 'var(--cream-subtle)' }}>
                        {lead.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {lead.status === 'Fechado' && !lead.convertedClientId && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleConvertToClient(lead)}
                            style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                          >
                            Converter
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDelete(lead.id)}
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                        >
                          Excluir
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

      {/* Modal Criar / Editar Lead */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingLead ? 'Editar Lead' : 'Novo Lead Comercial'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Nome da Empresa *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Instituto Raízes"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contato Principal *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Carlos Mendes"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                type="email"
                className="form-input"
                placeholder="carlos@empresa.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp / Telefone</label>
              <input
                type="text"
                className="form-input"
                placeholder="(11) 98765-4321"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value, whatsapp: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Serviço de Interesse</label>
              <select
                className="form-input"
                value={formData.serviceOfInterest}
                onChange={(e) => setFormData({ ...formData, serviceOfInterest: e.target.value as ServiceType })}
              >
                <option value="Meta Ads">Meta Ads</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Social Media">Social Media</option>
                <option value="Landing Page">Landing Page</option>
                <option value="Site Institucional">Site Institucional</option>
                <option value="Identidade Visual">Identidade Visual</option>
                <option value="Plano Estratégico">Plano Estratégico</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Origem do Lead</label>
              <select
                className="form-input"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value as LeadOrigin })}
              >
                <option value="Instagram">Instagram</option>
                <option value="Meta Ads">Meta Ads</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Indicação">Indicação</option>
                <option value="Site">Site</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Orgânico">Orgânico</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Valor Estimado (R$)</label>
              <input
                type="number"
                className="form-input"
                value={formData.estimatedValue}
                onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Etapa no Pipeline</label>
              <select
                className="form-input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
              >
                {pipelineStages.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Próximo Follow-up</label>
              <input
                type="date"
                className="form-input"
                value={formData.nextFollowUp}
                onChange={(e) => setFormData({ ...formData, nextFollowUp: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notas e Diagnóstico Pré-venda</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Dores do prospect, faturamento atual, objetivos com a agência..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Salvar Lead
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
