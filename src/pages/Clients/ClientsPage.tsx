import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Building2,
  Mail,
  Phone,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { db } from '../../services/db';
import { clientsService } from '../../services/clients';
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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table'); // Default to table on desktop as requested

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

  const loadClients = async () => {
    try {
      const remoteClients = await clientsService.getClients();
      setClients(remoteClients || []);
      if (selectedClientId && remoteClients) {
        const found = remoteClients.find((c) => c.id === selectedClientId);
        if (found) setViewingClient(found);
      }
    } catch {
      setClients([]);
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

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.contactName || !formData.email) {
      showToast('Preencha os campos obrigatórios.', 'error');
      return;
    }

    const payload = {
      companyName: formData.companyName,
      contactName: formData.contactName,
      email: formData.email,
      phone: formData.phone,
      website: formData.website,
      instagram: formData.instagram,
      segment: formData.segment || 'Geral',
      services: formData.services.length > 0 ? formData.services : (['Meta Ads'] as ServiceType[]),
      startDate: formData.startDate,
      accountManager: formData.accountManager,
      notes: formData.notes,
      status: formData.status,
    };

    if (editingClient) {
      await clientsService.updateClient(editingClient.id, payload);
      db.saveClient({
        ...editingClient,
        ...payload,
      });
      showToast('Cliente atualizado com sucesso!', 'success');
    } else {
      const created = await clientsService.createClient(payload);
      if (created) {
        db.saveClient(created);
      } else {
        const localClient: Client = {
          id: 'cli-' + Date.now(),
          ...payload,
          createdAt: new Date().toISOString(),
        };
        db.saveClient(localClient);
      }
      showToast('Cliente cadastrado com sucesso!', 'success');
    }

    await loadClients();
    setIsFormModalOpen(false);
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    await clientsService.deleteClient(clientToDelete.id);
    db.deleteClient(clientToDelete.id);
    await loadClients();
    if (viewingClient?.id === clientToDelete.id) {
      setViewingClient(null);
    }
    showToast('Cliente removido do sistema.', 'info');
    setClientToDelete(null);
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.segment.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Header & Prominent CTA Action */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div>
          <h1 className="font-serif" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--green-deep)' }}>
            Clientes
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', fontWeight: 450 }}>
            Gerencie clientes, contatos, contratos e status da conta.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleOpenCreate}
          style={{ gap: '8px', padding: '12px 24px', fontSize: '0.96rem' }}
        >
          <Plus size={18} /> Novo Cliente
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div
        className="card"
        style={{
          padding: '18px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '18px'
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '260px', maxWidth: '460px' }}>
          <Search
            size={18}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '42px', borderRadius: 'var(--radius-full)' }}
            placeholder="Pesquisar por empresa, responsável ou segmento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filter buttons & View Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--cream-subtle)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            {(['Todos', 'Ativo', 'Onboarding', 'Pausado', 'Encerrado'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem',
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
              onClick={() => setViewMode('table')}
              style={{
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                background: viewMode === 'table' ? 'var(--cream-subtle)' : 'transparent',
                color: viewMode === 'table' ? 'var(--green-primary)' : 'var(--text-muted)'
              }}
              title="Tabela"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                background: viewMode === 'grid' ? 'var(--cream-subtle)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--green-primary)' : 'var(--text-muted)'
              }}
              title="Cards"
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <Building2 size={30} />
          </div>
          <h3 className="empty-state-title">Nenhum cliente encontrado</h3>
          <p className="empty-state-text">
            Não encontramos nenhum cliente com os filtros aplicados. Tente ajustar os termos de pesquisa ou cadastre um novo cliente.
          </p>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Cadastrar Primeiro Cliente
          </button>
        </div>
      )}

      {/* Table View (Desktop Primary View) */}
      {/* Table View (Desktop) / Cards (Mobile) */}
      {viewMode === 'table' && filteredClients.length > 0 && (
        <>
          <div className="desktop-table-container">
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              background: 'var(--green-deep)',
                              color: 'var(--sand-gold)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '1rem',
                              flexShrink: 0
                            }}
                          >
                            {client.companyName.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 650, color: 'var(--text-primary)', fontSize: '0.96rem' }}>
                              {client.companyName}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>
                              {client.segment}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 550, color: 'var(--text-primary)' }}>
                        {client.contactName}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>{client.email}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>{client.phone}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', maxWidth: '280px' }}>
                          {client.services.slice(0, 3).map((s) => (
                            <Badge key={s} status={s} type="service" />
                          ))}
                          {client.services.length > 3 && (
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', alignSelf: 'center', fontWeight: 600 }}>
                              +{client.services.length - 3}
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Auto-Cards for Clients */}
          <div className="mobile-cards-container">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="mobile-item-card"
                onClick={() => setViewingClient(client)}
                style={{ cursor: 'pointer' }}
              >
                <div className="mobile-item-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        background: 'var(--green-deep)',
                        color: 'var(--sand-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.95rem'
                      }}
                    >
                      {client.companyName.charAt(0)}
                    </div>
                    <div>
                      <div className="mobile-item-title">{client.companyName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {client.segment}
                      </div>
                    </div>
                  </div>
                  <Badge status={client.status} />
                </div>

                <div className="mobile-item-meta">
                  <div className="mobile-item-row">
                    <span className="mobile-item-label">Responsável</span>
                    <span className="mobile-item-val">{client.contactName}</span>
                  </div>
                  <div className="mobile-item-row">
                    <span className="mobile-item-label">Contato</span>
                    <span className="mobile-item-val">{client.phone || client.email}</span>
                  </div>
                  <div className="mobile-item-row" style={{ alignItems: 'flex-start' }}>
                    <span className="mobile-item-label" style={{ marginTop: '4px' }}>Serviços</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'flex-end', maxWidth: '70%' }}>
                      {client.services.slice(0, 2).map((s) => (
                        <Badge key={s} status={s} type="service" />
                      ))}
                      {client.services.length > 2 && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          +{client.services.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mobile-item-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Ver detalhes do cliente
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Grid View (Mobile / Card Alternative) */}
      {viewMode === 'grid' && filteredClients.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '24px'
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
                <div className="card-header" style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--green-deep)',
                        color: 'var(--sand-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.2rem'
                      }}
                    >
                      {client.companyName.charAt(0)}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                        {client.companyName}
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {client.segment}
                      </span>
                    </div>
                  </div>

                  <Badge status={client.status} />
                </div>

                {/* Contact information */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '16px 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  <div>Responsável: <strong style={{ color: 'var(--text-primary)' }}>{client.contactName}</strong></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={15} color="var(--green-primary)" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={15} color="var(--green-primary)" />
                    <span>{client.phone}</span>
                  </div>
                </div>

                {/* Services tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '14px 0' }}>
                  {client.services.slice(0, 3).map((svc) => (
                    <Badge key={svc} status={svc} type="service" />
                  ))}
                  {client.services.length > 3 && (
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', alignSelf: 'center', fontWeight: 600 }}>
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
                  paddingTop: '16px',
                  borderTop: '1px solid var(--cream-border-subtle)',
                  marginTop: '12px'
                }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Gestor: <strong style={{ color: 'var(--text-primary)' }}>{client.accountManager}</strong>
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

      {/* Empty State when no clients exist */}
      {filteredClients.length === 0 && (
        <div
          className="card"
          style={{
            padding: '64px 32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--cream-subtle)',
              border: '1px solid var(--cream-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              color: 'var(--sand-gold-dark)'
            }}
          >
            <Building2 size={26} />
          </div>
          <h3 className="font-serif" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Nenhum cliente cadastrado ainda.
          </h3>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.5, marginBottom: '22px' }}>
            Cadastre o primeiro cliente da Alicerce para começar.
          </p>
          <button
            className="btn btn-primary"
            onClick={handleOpenCreate}
            style={{ gap: '8px' }}
          >
            <Plus size={16} /> Novo cliente
          </button>
        </div>
      )}

      {/* Modal Cadastrar / Editar Cliente */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
        subtitle="Preencha os dados cadastrais e escopo de atendimento da conta"
        maxWidth="720px"
      >
        <form onSubmit={handleSaveClient}>
          {/* Dados da Empresa */}
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sand-gold-dark)' }}>
              1. Dados da Empresa
            </span>

            <div className="form-row" style={{ marginTop: '12px' }}>
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
                <label className="form-label">E-mail Corporativo *</label>
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
                  placeholder="https://empresa.com.br"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Instagram</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="@empresa"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Segmento</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Arquitetura de Alto Padrão"
                  value={formData.segment}
                  onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Serviços Contratados */}
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sand-gold-dark)' }}>
              2. Serviços Contratados (Selecione múltiplos)
            </span>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '8px',
                marginTop: '12px'
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
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.84rem',
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
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sand-gold-dark)' }}>
              3. Informações Internas & Status
            </span>

            <div className="form-row" style={{ marginTop: '12px' }}>
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
              <label className="form-label">Observações Estratégicas</label>
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
