import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  CreditCard,
  TrendingUp,
  Trash2,
  Edit2
} from 'lucide-react';
import { FinancialEntry, FinancialStatus, Client, Contract } from '../../types';
import { phase2Service } from '../../services/phase2';
import { clientsService } from '../../services/clients';
import { dashboardService } from '../../services/dashboard';
import { Modal } from '../../components/Common/Modal';
import { useToast } from '../../components/Common/Toast';
import { NavTab } from '../../components/Layout/Sidebar';

interface FinancialPageProps {
  initialFilter?: string;
  initialEntryId?: string;
  onNavigate?: (tab: NavTab, params?: any) => void;
}

export const FinancialPage: React.FC<FinancialPageProps> = ({
  initialFilter,
  initialEntryId,
  onNavigate
}) => {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | FinancialStatus>(() => {
    if (initialFilter?.toLowerCase() === 'pendente') return 'Pendente';
    if (initialFilter?.toLowerCase() === 'atrasado') return 'Atrasado';
    return 'Todos';
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    clientId: '',
    contractId: '',
    description: '',
    value: 3000,
    dueDate: todayStr,
    paymentDate: '',
    status: 'Pendente' as FinancialStatus
  });

  const loadData = async () => {
    const [fins, cls, ctrs] = await Promise.all([
      phase2Service.getFinancialEntries(),
      clientsService.getClients(),
      phase2Service.getContracts()
    ]);

    // Automação solicitada: se vencimento passou e ainda pendente, marca como atrasado
    const updatedFins = (fins || []).map((f) => {
      if (f.status === 'Pendente' && f.dueDate < todayStr) {
        return { ...f, status: 'Atrasado' as FinancialStatus };
      }
      return f;
    });

    setEntries(updatedFins);
    setClients(cls || []);
    setContracts(ctrs || []);

    if (initialEntryId && updatedFins) {
      const found = updatedFins.find((e) => e.id === initialEntryId);
      if (found) handleOpenEdit(found);
    }
  };

  useEffect(() => {
    loadData();
    if (initialFilter?.toLowerCase() === 'pendente') setStatusFilter('Pendente');
  }, [initialFilter, initialEntryId]);

  const handleOpenCreate = () => {
    setEditingEntry(null);
    setFormData({
      clientId: clients[0]?.id || '',
      contractId: contracts[0]?.id || '',
      description: 'Honorários Mensais de Gestão',
      value: 3000,
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      paymentDate: '',
      status: 'Pendente'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entry: FinancialEntry) => {
    setEditingEntry(entry);
    setFormData({
      clientId: entry.clientId,
      contractId: entry.contractId || '',
      description: entry.description,
      value: entry.value,
      dueDate: entry.dueDate,
      paymentDate: entry.paymentDate || '',
      status: entry.status
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      showToast('A descrição do lançamento é obrigatória.', 'error');
      return;
    }

    const selectedCl = clients.find((c) => c.id === formData.clientId);

    const saved = await phase2Service.saveFinancialEntry({
      ...(editingEntry ? { id: editingEntry.id } : {}),
      clientId: formData.clientId || undefined,
      clientName: selectedCl?.companyName || 'Avulso / Geral',
      contractId: formData.contractId || undefined,
      description: formData.description.trim(),
      value: Number(formData.value) || 0,
      dueDate: formData.dueDate || todayStr,
      paymentDate: formData.status === 'Pago' && !formData.paymentDate ? todayStr : formData.paymentDate || undefined,
      status: formData.status
    });

    await dashboardService.logActivity(
      editingEntry ? 'Lançamento Financeiro Atualizado' : 'Novo Recebível Registrado',
      'financial',
      saved.id,
      `Recebível "${saved.description}" (R$ ${saved.value.toLocaleString('pt-BR')}) para "${saved.clientName}".`
    );

    showToast(editingEntry ? 'Lançamento atualizado.' : 'Lançamento registrado com sucesso.', 'success');
    setIsModalOpen(false);
    loadData();
  };

  // Regra do Prompt: "Ao marcar como pago: Registrar: data de pagamento, usuário, valor"
  const handleMarkAsPaid = async (entry: FinancialEntry) => {
    await phase2Service.saveFinancialEntry({
      id: entry.id,
      status: 'Pago',
      paymentDate: todayStr
    });

    await dashboardService.logActivity(
      'Pagamento Confirmado',
      'financial',
      entry.id,
      `Recebimento de R$ ${entry.value.toLocaleString('pt-BR')} compensado com sucesso por Wesley Nunes.`
    );

    showToast(`Pagamento de R$ ${entry.value.toLocaleString('pt-BR')} confirmado!`, 'success');
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este lançamento financeiro?')) {
      await phase2Service.saveFinancialEntry({ id, status: 'Cancelado' });
      showToast('Lançamento cancelado.', 'info');
      loadData();
    }
  };

  // Métricas
  const totalReceivables = entries.reduce((acc, curr) => acc + curr.value, 0);
  const totalPaid = entries.filter((e) => e.status === 'Pago').reduce((acc, curr) => acc + curr.value, 0);
  const totalPending = entries.filter((e) => e.status === 'Pendente').reduce((acc, curr) => acc + curr.value, 0);
  const totalOverdue = entries.filter((e) => e.status === 'Atrasado' || (e.status === 'Pendente' && e.dueDate < todayStr)).reduce((acc, curr) => acc + curr.value, 0);

  const filteredEntries = entries.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.clientName.toLowerCase().includes(searchQuery.toLowerCase());

    const isLate = e.status === 'Pendente' && e.dueDate < todayStr;
    const effectiveStatus = isLate ? 'Atrasado' : e.status;

    let matchesStatus = true;
    if (statusFilter !== 'Todos') {
      matchesStatus = effectiveStatus === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (st: FinancialStatus, dueDate: string) => {
    const isLate = st === 'Pendente' && dueDate < todayStr;
    if (isLate || st === 'Atrasado') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEE2E2', color: '#B91C1C', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 650 }}>
          <AlertTriangle size={13} /> Atrasado
        </span>
      );
    }
    if (st === 'Pago') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#EAF5EE', color: '#1B6346', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 650 }}>
          <CheckCircle2 size={13} /> Pago
        </span>
      );
    }
    if (st === 'Cancelado') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', color: '#64748B', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 650 }}>
          Cancelado
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEF5E7', color: '#8F5310', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 650 }}>
        <Clock size={13} /> Pendente
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
            Financeiro & Recebíveis
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', margin: 0, fontWeight: 450 }}>
            Controle ágil de faturamento, liquidações, previsões contratuais e inadimplência.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '6px' }}>
          <Plus size={16} /> Nova Entrada
        </button>
      </div>

      {/* Cards de Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Recebido</span>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '4px' }}>
            R$ {totalPaid.toLocaleString('pt-BR')}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>compensado em conta</span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Valores Pendentes</span>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--sand-gold-dark)', marginTop: '4px' }}>
            R$ {totalPending.toLocaleString('pt-BR')}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>dentro do prazo de vencimento</span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Atrasados (Overdue)</span>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: totalOverdue > 0 ? '#DC2626' : 'var(--status-active-text)', marginTop: '4px' }}>
            R$ {totalOverdue.toLocaleString('pt-BR')}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>exigem cobrança imediata</span>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '420px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por descrição ou cliente..."
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
          <option value="Pendente">Pendente</option>
          <option value="Pago">Pago</option>
          <option value="Atrasado">Atrasado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>

      {/* Tabela de Recebíveis */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="desktop-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Data Pagamento</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => {
                const isLate = entry.status === 'Pendente' && entry.dueDate < todayStr;

                return (
                  <tr key={entry.id}>
                    <td>
                      <div style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{entry.description}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{entry.clientName}</td>
                    <td style={{ fontWeight: 700, color: 'var(--green-deep)', fontSize: '0.96rem' }}>
                      R$ {entry.value.toLocaleString('pt-BR')}
                    </td>
                    <td style={{ fontWeight: 600, color: isLate ? '#DC2626' : 'var(--text-primary)' }}>
                      {new Date(entry.dueDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                      {entry.paymentDate ? new Date(entry.paymentDate).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td>{getStatusBadge(entry.status, entry.dueDate)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {entry.status !== 'Pago' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleMarkAsPaid(entry)}
                            style={{ fontSize: '0.78rem', gap: '4px' }}
                            title="Marcar como recebido"
                          >
                            <CheckCircle2 size={13} /> Liquidar
                          </button>
                        )}
                        <button
                          className="sidebar-collapse-btn"
                          onClick={() => handleOpenEdit(entry)}
                          title="Editar lançamento"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Nenhum lançamento financeiro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Cadastro / Edição de Recebível */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEntry ? 'Editar Lançamento' : 'Novo Lançamento Financeiro'}
        subtitle="Vincule ao cliente e defina o valor e data de vencimento"
        maxWidth="600px"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Cliente (Opcional)</label>
            <select
              className="form-select"
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            >
              <option value="">Nenhum (Lançamento Geral / Avulso)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Descrição do Lançamento *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Mensalidade Meta Ads - Parcela 01"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Valor (R$)</label>
              <input
                type="number"
                className="form-input"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="form-label">Data de Vencimento (Opcional)</label>
              <input
                type="date"
                className="form-input"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as FinancialStatus })}
              >
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
                <option value="Atrasado">Atrasado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="form-label">Data do Pagamento (se pago)</label>
              <input
                type="date"
                className="form-input"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingEntry ? 'Salvar Alterações' : 'Registrar Lançamento'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
