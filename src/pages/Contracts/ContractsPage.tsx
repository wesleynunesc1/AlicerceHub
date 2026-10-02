import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Plus,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Contract, ContractStatus, ServiceType, Client } from '../../types';
import { phase2Service } from '../../services/phase2';
import { clientsService } from '../../services/clients';
import { Modal } from '../../components/Common/Modal';
import { useToast } from '../../components/Common/Toast';

export const ContractsPage: React.FC = () => {
  const { showToast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | ContractStatus>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  const [formData, setFormData] = useState({
    clientId: '',
    service: 'Meta Ads' as ServiceType,
    value: 3000,
    recurrence: 'Mensal' as const,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    autoRenew: true,
    status: 'Ativo' as ContractStatus,
    notes: ''
  });

  const loadData = async () => {
    const [ctrs, cls] = await Promise.all([
      phase2Service.getContracts(),
      clientsService.getClients()
    ]);
    setContracts(ctrs);
    setClients(cls);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingContract(null);
    setFormData({
      clientId: clients[0]?.id || '',
      service: 'Meta Ads',
      value: 3000,
      recurrence: 'Mensal',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      autoRenew: true,
      status: 'Ativo',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      clientId: contract.clientId,
      service: contract.service,
      value: contract.value,
      recurrence: contract.recurrence,
      startDate: contract.startDate,
      endDate: contract.endDate,
      autoRenew: contract.autoRenew,
      status: contract.status,
      notes: contract.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) {
      showToast('Selecione o cliente do contrato.', 'error');
      return;
    }

    const selectedCl = clients.find((c) => c.id === formData.clientId);

    await phase2Service.saveContract({
      ...(editingContract ? { id: editingContract.id } : {}),
      clientId: formData.clientId,
      clientName: selectedCl?.companyName || 'Cliente',
      service: formData.service,
      value: Number(formData.value),
      recurrence: formData.recurrence,
      startDate: formData.startDate,
      endDate: formData.endDate,
      autoRenew: formData.autoRenew,
      status: formData.status,
      notes: formData.notes
    });

    showToast(editingContract ? 'Contrato atualizado.' : 'Contrato cadastrado com sucesso.', 'success');
    setIsModalOpen(false);
    loadData();
  };

  const isNearExpiration = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  };

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const expiringContractsCount = contracts.filter((c) => isNearExpiration(c.endDate) && c.status === 'Ativo').length;
  const totalMonthlyRecurrence = contracts
    .filter((c) => c.status === 'Ativo' && c.recurrence === 'Mensal')
    .reduce((acc, c) => acc + c.value, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
            Contratos
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', margin: 0, fontWeight: 450 }}>
            Gestão de vigência, recorrência mensal e renovações contratuais.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '8px' }}>
          <Plus size={18} /> Novo Contrato
        </button>
      </div>

      {/* Alerta de Contratos Vencendo */}
      {expiringContractsCount > 0 && (
        <div
          style={{
            background: '#FEF3C7',
            border: '1px solid #FCD34D',
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#92400E'
          }}
        >
          <AlertTriangle size={20} color="#B45309" />
          <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>
            Atenção: <strong>{expiringContractsCount} contrato(s)</strong> vencem nos próximos 30 dias. Prepare o alinhamento de renovação com o cliente.
          </span>
        </div>
      )}

      {/* Resumo de Contratos */}
      <div
        className="card"
        style={{
          padding: '18px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px'
        }}
      >
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Receita Mensal Recorrente (MRR)
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '2px' }}>
            R$ {totalMonthlyRecurrence.toLocaleString('pt-BR')}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Contratos Vigentes
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--status-active-text)', marginTop: '2px' }}>
            {contracts.filter((c) => c.status === 'Ativo').length}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Próximos do Vencimento
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#B45309', marginTop: '2px' }}>
            {expiringContractsCount}
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
            placeholder="Pesquisar por cliente ou serviço..."
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
          <option value="Ativo">Ativo</option>
          <option value="Vencendo">Vencendo</option>
          <option value="Rascunho">Rascunho</option>
          <option value="Encerrado">Encerrado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>

      {/* Tabela de Contratos */}
      {filteredContracts.length === 0 ? (
        <div
          className="card"
          style={{ padding: '64px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <FileCheck2 size={32} color="var(--sand-gold-dark)" style={{ marginBottom: '14px' }} />
          <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Nenhum contrato cadastrado ainda.
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', margin: '0 0 20px', maxWidth: '420px' }}>
            Cadastre os contratos de clientes para acompanhar vigência e renovações.
          </p>
          <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '8px' }}>
            <Plus size={16} /> Cadastrar primeiro contrato
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="desktop-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Serviço Contratado</th>
                  <th>Valor</th>
                  <th>Recorrência</th>
                  <th>Vigência</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((ctr) => {
                  const nearExp = isNearExpiration(ctr.endDate) && ctr.status === 'Ativo';
                  return (
                    <tr key={ctr.id} style={{ cursor: 'pointer' }} onClick={() => handleOpenEdit(ctr)}>
                      <td>
                        <div style={{ fontWeight: 650, color: 'var(--text-primary)', fontSize: '0.94rem' }}>
                          {ctr.clientName}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{ctr.service}</td>
                      <td style={{ fontWeight: 700, color: 'var(--green-deep)' }}>
                        R$ {ctr.value.toLocaleString('pt-BR')}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', background: 'var(--cream-subtle)', padding: '2px 8px', borderRadius: '4px' }}>
                          {ctr.recurrence}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.88rem', color: nearExp ? '#B45309' : 'var(--text-primary)', fontWeight: nearExp ? 700 : 500 }}>
                          {new Date(ctr.startDate).toLocaleDateString('pt-BR')} até {new Date(ctr.endDate).toLocaleDateString('pt-BR')}
                        </div>
                        {nearExp && (
                          <div style={{ fontSize: '0.74rem', color: '#B45309', fontWeight: 600 }}>
                            Vence em breve
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 650,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: nearExp ? '#FEF3C7' : ctr.status === 'Ativo' ? '#EAF5EE' : 'var(--cream-subtle)',
                            color: nearExp ? '#B45309' : ctr.status === 'Ativo' ? '#1B6346' : 'var(--text-secondary)'
                          }}
                        >
                          {nearExp ? 'Vencendo' : ctr.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Contrato */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingContract ? 'Editar Contrato' : 'Novo Contrato'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              <label className="form-label">Serviço Principal</label>
              <select
                className="form-input"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value as ServiceType })}
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
              <label className="form-label">Recorrência</label>
              <select
                className="form-input"
                value={formData.recurrence}
                onChange={(e) => setFormData({ ...formData, recurrence: e.target.value as any })}
              >
                <option value="Mensal">Mensal</option>
                <option value="Trimestral">Trimestral</option>
                <option value="Semestral">Semestral</option>
                <option value="Anual">Anual</option>
                <option value="Pontual">Pontual</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Data de Início</label>
              <input
                type="date"
                className="form-input"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Data de Término</label>
              <input
                type="date"
                className="form-input"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status do Contrato</label>
            <select
              className="form-input"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ContractStatus })}
            >
              <option value="Ativo">Ativo</option>
              <option value="Vencendo">Vencendo</option>
              <option value="Rascunho">Rascunho</option>
              <option value="Encerrado">Encerrado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Observações e Cláusulas Específicas</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Dia de vencimento da fatura, reajustes, regras de rescisão..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Salvar Contrato
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
