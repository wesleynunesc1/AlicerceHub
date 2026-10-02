import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Building2,
  Mail,
  Phone,
  ArrowRight,
  MoreVertical,
  Trash2,
  Edit2,
  ExternalLink
} from 'lucide-react';
import { db } from '../../services/db';
import { Client, ClientStatus, ServiceType } from '../../types';
import { Badge } from '../../components/Common/Badge';
import { Modal } from '../../components/Common/Modal';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';
import { useToast } from '../../components/Common/Toast';
import { ClientDetailModal } from './ClientDetailModal';

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

interface ClientsPageProps {
  onNavigateToProject?: (projectId: string) => void;
  onNavigateToMaterial?: (materialId: string) => void;
  selectedClientId?: string;
}

export const ClientsPage: React.FC<ClientsPageProps> = ({
  onNavigateToProject,
  onNavigateToMaterial,
  selectedClientId
}) => {
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | ClientStatus>('Todos');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    instagram: '',
    segment: '',
    services: [] as ServiceType[],
    startDate: new Date().toISOString().split('T')[0],
    accountManager: 'Wesley Nunes',
    notes: '',
    status: 'Ativo' as ClientStatus
  });

  const loadClients = () => {
    const list = db.getClients();
    setClients(list);
    if (selectedClientId) {
      const found = list.find((c) => c.id === selectedClientId);
      if (found) setViewingClient(found);
    }
  };

  useEffect(() => {
    loadClients();
  }, [selectedClientId]);

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormData({
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      website: '',
      instagram: '',
      segment: '',
      services: ['Meta Ads'],
      startDate: new Date().toISOString().split('T')[0],
      accountManager: 'Wesley Nunes',
      notes: '',
      status: 'Ativo'
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      companyName: client.companyName,
      contactName: client.contactName,
      email: client.email,
      phone: client.phone,
      website: client.website || '',
      instagram: client.instagram || '',
      segment: client.segment,
      services: client.services,
      startDate: client.startDate,
      accountManager: client.accountManager,
      notes: client.notes || '',
      status: client.status
    });
    setIsFormModalOpen(true);
  };

  const handleToggleService = (svc: ServiceType) => {
    setFormData((prev) => {
      const exists = prev.services.includes(svc);
      if (exists) {
        return { ...prev, services: prev.services.filter((s) => s !== svc) };
      } else {
        return { ...prev, services: [...prev.services, svc] };
      }
    });
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.contactName || !formData.email) {
      showToast('Preencha os campos obrigatórios.', 'error');
      return;
    }

    const clientToSave: Client = {
      id: editingClient ? editingClient.id : 'cli-' + Date.now(),
      companyName: formData.companyName,
      contactName: formData.contactName,
      email: formData.email,
      phone: formData.phone,
      website: formData.website,
      instagram: formData.instagram,
      segment: formData.segment || 'Geral',
      services: formData.services.length > 0 ? formData.services : ['Meta Ads'],
      startDate: formData.startDate,
      accountManager: formData.accountManager,
      notes: formData.notes,
      status: formData.status,
      createdAt: editingClient ? editingClient.createdAt : new Date().toISOString()
    };

    db.saveClient(clientToSave);
    loadClients();
    setIsFormModalOpen(false);
    showToast(
      editingClient ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!',
      'success'
    );
  };

  const handleDeleteClient = () => {
    if (!clientToDelete) return;
    db.deleteClient(clientToDelete.id);
    loadClients();
    if (viewingClient?.id === clientToDelete.id) {
      setViewingClient(null);
    }
    showToast('Cliente removido do sistema.', 'info');
    setClientToDelete(null);
  };

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.segment.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Top Header & Action */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div>
          <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--green-deep)' }}>
            Clientes
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Empresas e contas atendidas pela estrutura da Alicerce.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '8px' }}>
          <Plus size={18} /> Novo Cliente
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '420px' }}>
          <Search
            size={18}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px', borderRadius: 'var(--radius-full)' }}
            placeholder="Pesquisar por empresa, responsável ou segmento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filter buttons & View Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--cream-subtle)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            {(['Todos', 'Ativo', 'Onboarding', 'Pausado', 'Encerrado'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: statusFilter === st ? 700 : 500,
                  background: statusFilter === st ? 'var(--cream-card)' : 'transparent',
                  color: statusFilter === st ? 'var(--green-deep)' : 'var(--text-muted)',
                  boxShadow: statusFilter === st ? 'var(--shadow-sm)' : 'none',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', gap: '2px', border: '1px solid var(--cream-border)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                background: viewMode === 'grid' ? 'var(--cream-subtle)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--green-primary)' : 'var(--text-muted)'
              }}
              title="Visualização em Cards"
            >
              <LayoutGrid size={17} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                background: viewMode === 'table' ? 'var(--cream-subtle)' : 'transparent',
                color: viewMode === 'table' ? 'var(--green-primary)' : 'var(--text-muted)'
              }}
              title="Visualização em Tabela"
            >
              <List size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <Building2 size={28} />
          </div>
          <h3 className="empty-state-title">Nenhum cliente encontrado</h3>
          <p className="empty-state-text">
            Não encontramos nenhum cliente com os filtros aplicados. Tente ajustar a busca ou cadastre um novo cliente.
          </p>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Cadastrar Primeiro Cliente
          </button>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && filteredClients.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}
        >
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
              onClick={() => setViewingClient(client)}
            >
              <div>
                <div className="card-header" style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--green-deep)',
                        color: 'var(--sand-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.1rem'
                      }}
                    >
                      {client.companyName.charAt(0)}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                        {client.companyName}
                      </h4>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {client.segment}
                      </span>
                    </div>
                  </div>

                  <Badge status={client.status} />
                </div>

                {/* Contact information */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '14px 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <div>Responsável: <strong>{client.contactName}</strong></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} color="var(--text-muted)" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} color="var(--text-muted)" />
                    <span>{client.phone}</span>
                  </div>
                </div>

                {/* Services tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '12px 0' }}>
                  {client.services.slice(0, 3).map((svc) => (
                    <Badge key={svc} status={svc} type="service" />
                  ))}
                  {client.services.length > 3 && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                      +{client.services.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--cream-border-subtle)',
                  marginTop: '10px'
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Resp.: {client.accountManager}
                </span>

                <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    className="sidebar-collapse-btn"
                    style={{ color: 'var(--text-secondary)' }}
                    onClick={() => handleOpenEdit(client)}
                    title="Editar cliente"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    className="sidebar-collapse-btn"
                    style={{ color: '#dc2626' }}
                    onClick={() => setClientToDelete(client)}
                    title="Excluir cliente"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && filteredClients.length > 0 && (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Responsável</th>
                <th>Contato</th>
                <th>Serviços Contratados</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => setViewingClient(client)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {client.companyName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {client.segment}
                    </div>
                  </td>
                  <td>{client.contactName}</td>
                  <td>
                    <div style={{ fontSize: '0.82rem' }}>{client.email}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{client.phone}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '260px' }}>
                      {client.services.slice(0, 2).map((s) => (
                        <Badge key={s} status={s} type="service" />
                      ))}
                      {client.services.length > 2 && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                          +{client.services.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <Badge status={client.status} />
                  </td>
                  <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        className="sidebar-collapse-btn"
                        style={{ color: 'var(--text-secondary)' }}
                        onClick={() => handleOpenEdit(client)}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="sidebar-collapse-btn"
                        style={{ color: '#dc2626' }}
                        onClick={() => setClientToDelete(client)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Cadastrar / Editar Cliente */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
        subtitle="Preencha os dados cadastrais e escopo da conta"
        maxWidth="680px"
      >
        <form onSubmit={handleSaveClient}>
          {/* Dados da Empresa */}
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sand-gold-dark)' }}>
              1. Dados da Empresa
            </span>

            <div className="form-row" style={{ marginTop: '10px' }}>
              <div className="form-group">
                <label className="form-label">Nome da Empresa *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Vanguard Arquitetura"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nome do Responsável *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Dr. Ricardo Silveira"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">E-mail *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="contato@empresa.com.br"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefone / WhatsApp</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="(11) 99882-1100"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Site Institucional</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://..."
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Instagram</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="@perfil"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Segmento de Mercado</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Imobiliário Alto Padrão"
                  value={formData.segment}
                  onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Serviços Contratados */}
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sand-gold-dark)' }}>
              2. Serviços Contratados (Selecione múltiplos)
            </span>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '8px',
                marginTop: '10px'
              }}
            >
              {ALL_SERVICES.map((svc) => {
                const isSelected = formData.services.includes(svc);
                return (
                  <button
                    key={svc}
                    type="button"
                    onClick={() => handleToggleService(svc)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      textAlign: 'left',
                      border: isSelected ? '1px solid var(--green-primary)' : '1px solid var(--cream-border)',
                      background: isSelected ? 'var(--green-tint)' : 'var(--cream-card)',
                      color: isSelected ? 'var(--green-primary)' : 'var(--text-secondary)',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {svc}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Informações Internas */}
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sand-gold-dark)' }}>
              3. Informações Internas & Status
            </span>

            <div className="form-row" style={{ marginTop: '10px' }}>
              <div className="form-group">
                <label className="form-label">Data de Entrada</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Responsável Interno</label>
                <select
                  className="form-select"
                  value={formData.accountManager}
                  onChange={(e) => setFormData({ ...formData, accountManager: e.target.value })}
                >
                  <option value="Wesley Nunes">Wesley Nunes</option>
                  <option value="Ana Castro">Ana Castro</option>
                  <option value="Equipe Alicerce">Equipe Alicerce</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status da Conta</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ClientStatus })}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Pausado">Pausado</option>
                  <option value="Encerrado">Encerrado</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Observações Internas</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Metas contratuais, detalhes de reuniões, histórico ou diretrizes particulares..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsFormModalOpen(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Client Detail Modal */}
      <ClientDetailModal
        client={viewingClient}
        isOpen={Boolean(viewingClient)}
        onClose={() => setViewingClient(null)}
        onEdit={(c) => {
          setViewingClient(null);
          handleOpenEdit(c);
        }}
        onNavigateToProject={onNavigateToProject}
        onNavigateToMaterial={onNavigateToMaterial}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(clientToDelete)}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleDeleteClient}
        title="Remover Cliente"
        message={`Tem certeza que deseja remover ${clientToDelete?.companyName}? Esta ação excluirá os registros deste cliente no sistema.`}
      />
    </div>
  );
};
