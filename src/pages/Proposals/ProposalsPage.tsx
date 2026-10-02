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
  DollarSign
} from 'lucide-react';
import { Proposal, ProposalStatus, ServiceType } from '../../types';
import { phase2Service } from '../../services/phase2';
import { clientsService } from '../../services/clients';
import { Client } from '../../types';
import { Modal } from '../../components/Common/Modal';
import { useToast } from '../../components/Common/Toast';

export const ProposalsPage: React.FC = () => {
  const { showToast } = useToast();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | ProposalStatus>('Todos');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
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
    const [props, cls] = await Promise.all([
      phase2Service.getProposals(),
      clientsService.getClients()
    ]);
    setProposals(props);
    setClients(cls);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingProposal(null);
    setFormData({
      title: 'Proposta de Estruturação Digital & Tráfego',
      clientId: clients[0]?.id || '',
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
      clientId: proposal.clientId || '',
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

  const handleDuplicate = async (prop: Proposal) => {
    const duplicated: Partial<Proposal> = {
      title: `${prop.title} (Cópia)`,
      clientId: prop.clientId,
      clientName: prop.clientName,
      description: prop.description,
      services: prop.services,
      items: prop.items,
      subtotal: prop.subtotal,
      discount: prop.discount,
      total: prop.total,
      deadline: prop.deadline,
      validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      notes: prop.notes,
      status: 'Rascunho'
    };

    await phase2Service.saveProposal(duplicated);
    showToast('Proposta duplicada com sucesso.', 'success');
    loadData();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const selectedCl = clients.find((c) => c.id === formData.clientId);
    const total = Math.max(0, formData.subtotal - formData.discount);

    await phase2Service.saveProposal({
      ...(editingProposal ? { id: editingProposal.id } : {}),
      title: formData.title,
      clientId: formData.clientId || undefined,
      clientName: selectedCl?.companyName || 'Lead Comercial',
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

    showToast(editingProposal ? 'Proposta atualizada.' : 'Proposta salva com sucesso.', 'success');
    setIsModalOpen(false);
    loadData();
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
      (p.clientName && p.clientName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'Todos' || p.status === statusFilter;
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
            Elabore, envie e acompanhe propostas de prestação de serviços.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '8px' }}>
          <Plus size={18} /> Nova Proposta
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
            placeholder="Pesquisar por proposta ou cliente..."
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
          <option value="Rascunho">Rascunho</option>
          <option value="Enviada">Enviada</option>
          <option value="Visualizada">Visualizada</option>
          <option value="Aprovada">Aprovada</option>
          <option value="Recusada">Recusada</option>
          <option value="Expirada">Expirada</option>
        </select>
      </div>

      {/* Tabela de Propostas */}
      {filteredProposals.length === 0 ? (
        <div
          className="card"
          style={{ padding: '64px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <FileText size={32} color="var(--sand-gold-dark)" style={{ marginBottom: '14px' }} />
          <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Nenhuma proposta cadastrada ainda.
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', margin: '0 0 20px', maxWidth: '420px' }}>
            Gere propostas comerciais com detalhamento de serviços, valores e prazos.
          </p>
          <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '8px' }}>
            <Plus size={16} /> Criar primeira proposta
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="desktop-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Proposta / Título</th>
                  <th>Cliente / Prospect</th>
                  <th>Serviços</th>
                  <th>Valor Total</th>
                  <th>Validade</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProposals.map((prop) => (
                  <tr key={prop.id} style={{ cursor: 'pointer' }} onClick={() => handleOpenEdit(prop)}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.94rem' }}>
                        {prop.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Prazo: {prop.deadline}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{prop.clientName || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {prop.services.map((s) => (
                          <span key={s} style={{ fontSize: '0.74rem', background: 'var(--cream-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--green-deep)' }}>
                      R$ {prop.total.toLocaleString('pt-BR')}
                      {prop.discount > 0 && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          R$ {prop.subtotal.toLocaleString('pt-BR')}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      {new Date(prop.validUntil).toLocaleDateString('pt-BR')}
                    </td>
                    <td>{getStatusBadge(prop.status)}</td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDuplicate(prop)}
                        title="Duplicar proposta"
                        style={{ padding: '5px 8px' }}
                      >
                        <Copy size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Proposta */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProposal ? 'Editar Proposta' : 'Nova Proposta Comercial'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Título da Proposta *</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Cliente / Prospect</label>
              <select
                className="form-input"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              >
                <option value="">Selecione ou deixe avulso</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status da Proposta</label>
              <select
                className="form-input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProposalStatus })}
              >
                <option value="Rascunho">Rascunho</option>
                <option value="Enviada">Enviada</option>
                <option value="Visualizada">Visualizada</option>
                <option value="Aprovada">Aprovada</option>
                <option value="Recusada">Recusada</option>
                <option value="Expirada">Expirada</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Subtotal dos Serviços (R$)</label>
              <input
                type="number"
                className="form-input"
                value={formData.subtotal}
                onChange={(e) => setFormData({ ...formData, subtotal: Number(e.target.value) })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Desconto Comercial (R$)</label>
              <input
                type="number"
                className="form-input"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Prazo de Execução</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: 15 dias úteis"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Validade da Proposta</label>
              <input
                type="date"
                className="form-input"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Escopo & Condições de Pagamento</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Detalhamento do que está incluso, forma de pagamento, cláusulas..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--green-deep)' }}>
              Total: R$ {Math.max(0, formData.subtotal - formData.discount).toLocaleString('pt-BR')}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Salvar Proposta
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
