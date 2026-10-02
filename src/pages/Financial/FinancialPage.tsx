import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  ArrowUpRight
} from 'lucide-react';
import { FinancialEntry, FinancialStatus, Client } from '../../types';
import { phase2Service } from '../../services/phase2';
import { clientsService } from '../../services/clients';
import { Modal } from '../../components/Common/Modal';
import { useToast } from '../../components/Common/Toast';

export const FinancialPage: React.FC = () => {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | FinancialStatus>('Todos');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null);

  const [formData, setFormData] = useState({
    clientId: '',
    description: '',
    value: 2500,
    dueDate: new Date().toISOString().split('T')[0],
    paymentDate: '',
    status: 'Pendente' as FinancialStatus
  });

  const loadData = async () => {
    const [fins, cls] = await Promise.all([
      phase2Service.getFinancialEntries(),
      clientsService.getClients()
    ]);
    setEntries(fins);
    setClients(cls);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingEntry(null);
    setFormData({
      clientId: clients[0]?.id || '',
      description: 'Mensalidade Operacional (Retainer)',
      value: 2500,
      dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      paymentDate: '',
      status: 'Pendente'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entry: FinancialEntry) => {
    setEditingEntry(entry);
    setFormData({
      clientId: entry.clientId,
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
    if (!formData.clientId) {
      showToast('Selecione o cliente pagador.', 'error');
      return;
    }

    const selectedCl = clients.find((c) => c.id === formData.clientId);

    await phase2Service.saveFinancialEntry({
      ...(editingEntry ? { id: editingEntry.id } : {}),
      clientId: formData.clientId,
      clientName: selectedCl?.companyName || 'Cliente',
      description: formData.description,
      value: Number(formData.value),
      dueDate: formData.dueDate,
      paymentDate: formData.status === 'Pago' && !formData.paymentDate ? new Date().toISOString().split('T')[0] : formData.paymentDate || undefined,
      status: formData.status
    });

    showToast(editingEntry ? 'Lançamento atualizado.' : 'Lançamento registrado com sucesso.', 'success');
    setIsModalOpen(false);
    loadData();
  };

  const handleMarkAsPaid = async (entry: FinancialEntry) => {
    await phase2Service.saveFinancialEntry({
      id: entry.id,
      status: 'Pago',
      paymentDate: new Date().toISOString().split('T')[0]
    });
    showToast('Pagamento confirmado e compensado!', 'success');
    loadData();
  };

  // Metrics
  const totalContracted = entries
    .filter((e) => e.status !== 'Cancelado')
    .reduce((acc, curr) => acc + curr.value, 0);

  const receivedThisMonth = entries
    .filter((e) => e.status === 'Pago')
    .reduce((acc, curr) => acc + curr.value, 0);

  const pendingValue = entries
    .filter((e) => e.status === 'Pendente')
    .reduce((acc, curr) => acc + curr.value, 0);

  const overdueValue = entries
    .filter((e) => e.status === 'Atrasado' || (e.status === 'Pendente' && e.dueDate < new Date().toISOString().split('T')[0]))
    .reduce((acc, curr) => acc + curr.value, 0);

  const filteredEntries = entries.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (st: FinancialStatus, dueDate: string) => {
    const isLate = st === 'Pendente' && dueDate < new Date().toISOString().split('T')[0];
    if (isLate || st === 'Atrasado') {
      return (
        <span style={{ fontSize: '0.78rem', fontWeight: 650, padding: '3px 8px', borderRadius: '4px', background: '#FEE2E2', color: '#B91C1C' }}>
          Atrasado
        </span>
      );
    }
    switch (st) {
      case 'Pago':
        return (
          <span style={{ fontSize: '0.78rem', fontWeight: 650, padding: '3px 8px', borderRadius: '4px', background: '#EAF5EE', color: '#1B6346' }}>
            Pago
          </span>
        );
      case 'Cancelado':
        return (
          <span style={{ fontSize: '0.78rem', fontWeight: 650, padding: '3px 8px', borderRadius: '4px', background: 'var(--cream-subtle)', color: 'var(--text-muted)' }}>
            Cancelado
          </span>
        );
      default:
        return (
          <span style={{ fontSize: '0.78rem', fontWeight: 650, padding: '3px 8px', borderRadius: '4px', background: '#FEF3C7', color: '#B45309' }}>
            Pendente
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
            Financeiro Básico
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', margin: 0, fontWeight: 450 }}>
            Controle de recebíveis, vencimentos de mensalidades e status de quitação.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '8px' }}>
          <Plus size={18} /> Novo Recebível
        </button>
      </div>

      {/* Dashboard Financeiro Básico */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px'
        }}
      >
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Receita Contratada
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '2px' }}>
            R$ {totalContracted.toLocaleString('pt-BR')}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>faturamento total em carteira</span>
        </div>

        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Recebido no Mês
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--status-active-text)', marginTop: '2px' }}>
            R$ {receivedThisMonth.toLocaleString('pt-BR')}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>faturas liquidadas</span>
        </div>

        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Pendente
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#B45309', marginTop: '2px' }}>
            R$ {pendingValue.toLocaleString('pt-BR')}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>a vencer nos próximos dias</span>
        </div>

        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Atrasado
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#DC2626', marginTop: '2px' }}>
            R$ {overdueValue.toLocaleString('pt-BR')}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>cobranças pendentes</span>
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
            placeholder="Pesquisar por cliente ou descrição..."
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
          <option value="Pendente">Pendente</option>
          <option value="Pago">Pago</option>
          <option value="Atrasado">Atrasado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>

      {/* Tabela de Recebíveis */}
      {filteredEntries.length === 0 ? (
        <div
          className="card"
          style={{ padding: '64px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <DollarSign size={32} color="var(--sand-gold-dark)" style={{ marginBottom: '14px' }} />
          <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Nenhum lançamento financeiro registrado.
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', margin: '0 0 20px', maxWidth: '420px' }}>
            Cadastre os recebíveis de mensalidades e projetos para controle de caixa.
          </p>
          <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '8px' }}>
            <Plus size={16} /> Cadastrar primeiro recebível
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="desktop-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>Data de Pagamento</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} style={{ cursor: 'pointer' }} onClick={() => handleOpenEdit(entry)}>
                    <td>
                      <div style={{ fontWeight: 650, color: 'var(--text-primary)', fontSize: '0.94rem' }}>
                        {entry.clientName}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{entry.description}</td>
                    <td style={{ fontWeight: 700, color: 'var(--green-deep)' }}>
                      R$ {entry.value.toLocaleString('pt-BR')}
                    </td>
                    <td style={{ fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                      {new Date(entry.dueDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                      {entry.paymentDate ? new Date(entry.paymentDate).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td>{getStatusBadge(entry.status, entry.dueDate)}</td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      {entry.status !== 'Pago' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleMarkAsPaid(entry)}
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        >
                          Dar Baixa
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Lançamento */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEntry ? 'Editar Lançamento' : 'Novo Recebível'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            <label className="form-label">Descrição do Faturamento *</label>
            <input
              type="text"
              className="form-input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Valor (R$)</label>
              <input
                type="number"
                className="form-input"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Data de Vencimento</label>
              <input
                type="date"
                className="form-input"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as FinancialStatus })}
              >
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
                <option value="Atrasado">Atrasado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Data de Pagamento (se quitado)</label>
              <input
                type="date"
                className="form-input"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Salvar Recebível
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
