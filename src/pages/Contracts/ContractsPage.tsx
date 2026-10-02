import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  FileText,
  DollarSign,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Contract, ContractStatus, ServiceType, Client } from '../../types';
import { phase2Service } from '../../services/phase2';
import { clientsService } from '../../services/clients';
import { dashboardService } from '../../services/dashboard';
import { Modal } from '../../components/Common/Modal';
import { useToast } from '../../components/Common/Toast';
import { NavTab } from '../../components/Layout/Sidebar';

interface ContractsPageProps {
  initialFilter?: string;
  action?: string;
  clientId?: string;
  clientName?: string;
  service?: string;
  value?: number;
  onNavigate?: (tab: NavTab, params?: any) => void;
}

export const ContractsPage: React.FC<ContractsPageProps> = ({
  initialFilter,
  action,
  clientId,
  clientName,
  service,
  value,
  onNavigate
}) => {
  const { showToast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Vencendo' | ContractStatus>(() => {
    if (initialFilter?.toLowerCase() === 'vencendo') return 'Vencendo';
    return 'Todos';
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  const [formData, setFormData] = useState({
    clientId: clientId || '',
    service: (service as ServiceType) || 'Meta Ads',
    value: value || 3000,
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
    setContracts(ctrs || []);
    setClients(cls || []);
  };

  useEffect(() => {
    loadData();
    if (action === 'create') {
      handleOpenCreate();
    }
  }, [action, clientId, clientName, service, value]);

  const handleOpenCreate = () => {
    setEditingContract(null);
    setFormData({
      clientId: clientId || clients[0]?.id || '',
      service: (service as ServiceType) || 'Meta Ads',
      value: value || 3000,
      recurrence: 'Mensal',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      autoRenew: true,
      status: 'Rascunho', // Prompt: "Ao criar: Status draft"
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

    const saved = await phase2Service.saveContract({
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

    // Se salvo diretamente como Ativo e não era Ativo antes, gera lançamento financeiro
    if (formData.status === 'Ativo' && (!editingContract || editingContract.status !== 'Ativo')) {
      await phase2Service.activateContract(saved.id);
    }

    showToast(editingContract ? 'Contrato atualizado.' : 'Contrato cadastrado com sucesso.', 'success');
    setIsModalOpen(false);
    loadData();
  };

  // Botão Ativar Contrato (Prompt: "Ao ativar: Status active. Se recorrente: criar previsão financeira")
  const handleActivate = async (contract: Contract) => {
    try {
      await phase2Service.activateContract(contract.id);
      showToast(`Contrato ativado e previsão financeira gerada para "${contract.clientName}"!`, 'success');
      loadData();
    } catch {
      showToast('Falha ao ativar contrato.', 'error');
    }
  };

  const isNearExpiration = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate).getTime() < Date.now();
  };

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.service.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'Vencendo') {
      matchesStatus = c.status === 'Ativo' && isNearExpiration(c.endDate);
    } else if (statusFilter !== 'Todos') {
      matchesStatus = c.status === statusFilter;
    }

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
            Gestão de vigência contratual, recorrência, prazos de renovação e previsões financeiras.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '6px' }}>
          <Plus size={16} /> Novo Contrato
        </button>
      </div>

      {/* Cards de Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Contratos Ativos</span>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '4px' }}>
            {contracts.filter((c) => c.status === 'Ativo').length}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>em vigência regular</span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>MRR Contratado</span>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '4px' }}>
            R$ {totalMonthlyRecurrence.toLocaleString('pt-BR')}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>faturamento mensal recorrente</span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Vencendo em 30 Dias</span>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: expiringContractsCount > 0 ? '#B45309' : 'var(--status-active-text)', marginTop: '4px' }}>
            {expiringContractsCount}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>atenção para renovação</span>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '420px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por cliente ou serviço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{ minWidth: '170px' }}
        >
          <option value="Todos">Todos os Contratos</option>
          <option value="Vencendo">Vencendo nos Próximos 30d</option>
          <option value="Ativo">Ativo</option>
          <option value="Rascunho">Rascunho</option>
          <option value="Encerrado">Encerrado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>

      {/* Grid de Contratos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {filteredContracts.map((c) => {
          const nearExp = isNearExpiration(c.endDate) && c.status === 'Ativo';
          const expired = isExpired(c.endDate) && c.status === 'Ativo';

          return (
            <div
              key={c.id}
              className="card"
              style={{
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                borderLeft: nearExp ? '3px solid #B45309' : expired ? '3px solid #DC2626' : undefined
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sand-gold-dark)' }}>
                    {c.clientName}
                  </span>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 650,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: c.status === 'Ativo' ? '#EAF5EE' : 'var(--cream-subtle)',
                      color: c.status === 'Ativo' ? '#1B6346' : 'var(--text-secondary)'
                    }}
                  >
                    {c.status}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--green-deep)', margin: '0 0 8px' }}>
                  {c.service}
                </h3>

                <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>Recorrência: <strong>{c.recurrence}</strong></div>
                  <div>Início: {new Date(c.startDate).toLocaleDateString('pt-BR')}</div>
                  <div style={{ color: nearExp ? '#B45309' : expired ? '#DC2626' : 'var(--text-secondary)', fontWeight: nearExp || expired ? 650 : 400 }}>
                    Término: {new Date(c.endDate).toLocaleDateString('pt-BR')}
                    {nearExp && ' (Vence em breve)'}
                    {expired && ' (Vencido)'}
                  </div>
                  <div>Renovação Automática: {c.autoRenew ? 'Sim' : 'Não'}</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--cream-border-subtle)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Valor do Contrato</span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--green-deep)' }}>
                    R$ {c.value.toLocaleString('pt-BR')}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                  {c.status === 'Rascunho' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleActivate(c)}
                      style={{ fontSize: '0.78rem', gap: '4px' }}
                    >
                      <ShieldCheck size={13} /> Ativar Contrato
                    </button>
                  )}

                  <button
                    className="sidebar-collapse-btn"
                    onClick={() => handleOpenEdit(c)}
                    title="Editar contrato"
                  >
                    <Edit2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredContracts.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center' }}>
            <FileCheck2 size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', margin: 0 }}>
              Nenhum contrato encontrado para os filtros selecionados.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Cadastro / Edição de Contrato */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingContract ? 'Editar Contrato' : 'Novo Contrato'}
        subtitle="Vincule ao cliente e defina os termos e vigência"
        maxWidth="640px"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Serviço Principal *</label>
              <select
                className="form-select"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value as ServiceType })}
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
              <label className="form-label">Valor (R$) *</label>
              <input
                type="number"
                className="form-input"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Recorrência</label>
              <select
                className="form-select"
                value={formData.recurrence}
                onChange={(e) => setFormData({ ...formData, recurrence: e.target.value as any })}
              >
                <option value="Mensal">Mensal</option>
                <option value="Trimestral">Trimestral</option>
                <option value="Semestral">Semestral</option>
                <option value="Anual">Anual</option>
                <option value="Projeto Único">Projeto Único</option>
              </select>
            </div>

            <div>
              <label className="form-label">Status Inicial</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ContractStatus })}
              >
                <option value="Rascunho">Rascunho</option>
                <option value="Ativo">Ativo</option>
                <option value="Encerrado">Encerrado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Data de Início *</label>
              <input
                type="date"
                className="form-input"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label">Data de Término *</label>
              <input
                type="date"
                className="form-input"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="autoRenew"
              checked={formData.autoRenew}
              onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
            />
            <label htmlFor="autoRenew" style={{ fontSize: '0.86rem', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500 }}>
              Renovação automática ao término da vigência
            </label>
          </div>

          <div>
            <label className="form-label">Observações e Cláusulas Especiais</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Regras de rescisão, escopo detalhado..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingContract ? 'Salvar Alterações' : 'Cadastrar Contrato'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
