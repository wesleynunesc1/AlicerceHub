import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  LayoutGrid,
  List,
  Edit,
  Trash2
} from 'lucide-react';
import { db } from '../../services/db';
import { projectsService } from '../../services/projects';
import { clientsService } from '../../services/clients';
import { Project, ProjectStatus, ServiceType, Client } from '../../types';
import { Badge } from '../../components/Common/Badge';
import { Modal } from '../../components/Common/Modal';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';
import { useToast } from '../../components/Common/Toast';
import { ProjectDetailPage } from './ProjectDetailPage';

interface ProjectsPageProps {
  selectedProjectId?: string;
  onClearSelectedProject?: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  selectedProjectId,
  onClearSelectedProject
}) => {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | ProjectStatus>('Todos');
  const [serviceFilter, setServiceFilter] = useState<'Todos' | ServiceType>('Todos');
  const [clientFilter, setClientFilter] = useState<'Todos' | string>('Todos');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    service: 'Meta Ads' as ServiceType,
    responsible: 'Wesley Nunes',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: '',
    status: 'Planejamento' as ProjectStatus
  });

  const loadData = async () => {
    try {
      const [remoteProjects, remoteClients] = await Promise.all([
        projectsService.getProjects(),
        clientsService.getClients(),
      ]);

      setProjects(remoteProjects || []);
      if (selectedProjectId && remoteProjects) {
        const found = remoteProjects.find((p) => p.id === selectedProjectId);
        if (found) setActiveProject(found);
      }

      setClients(remoteClients || []);
    } catch {
      setProjects([]);
      setClients([]);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProjectId]);

  const handleOpenCreate = () => {
    if (clients.length === 0) {
      showToast('Cadastre um cliente primeiro para criar um projeto.', 'error');
      return;
    }
    setEditingProject(null);
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    setFormData({
      name: '',
      clientId: clients[0].id,
      service: 'Meta Ads',
      responsible: 'Wesley Nunes',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: in30Days.toISOString().split('T')[0],
      description: '',
      status: 'Planejamento'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(proj);
    setFormData({
      name: proj.name,
      clientId: proj.clientId,
      service: proj.service,
      responsible: proj.responsible,
      startDate: proj.startDate,
      dueDate: proj.dueDate,
      description: proj.description,
      status: proj.status
    });
    setIsModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.clientId || !formData.dueDate) {
      showToast('Preencha os campos obrigatórios.', 'error');
      return;
    }

    const selectedClient = clients.find((c) => c.id === formData.clientId);
    const clientName = selectedClient ? selectedClient.companyName : 'Cliente';

    const payload = {
      name: formData.name,
      clientId: formData.clientId,
      clientName,
      service: formData.service,
      responsible: formData.responsible,
      startDate: formData.startDate,
      dueDate: formData.dueDate,
      description: formData.description,
      status: formData.status,
      progress: editingProject ? editingProject.progress : 0,
      stages: editingProject ? editingProject.stages : [],
      notes: editingProject ? editingProject.notes : '',
      relatedMaterials: editingProject ? editingProject.relatedMaterials : [],
    };

    if (editingProject) {
      await projectsService.updateProject(editingProject.id, payload);
      db.saveProject({
        ...editingProject,
        ...payload,
      });
      showToast('Projeto atualizado com sucesso!', 'success');
    } else {
      const created = await projectsService.createProject(payload);
      if (created) {
        db.saveProject(created);
      } else {
        const localProj: Project = {
          id: 'proj-' + Date.now(),
          ...payload,
          createdAt: new Date().toISOString(),
        };
        db.saveProject(localProj);
      }
      showToast('Projeto criado com sucesso!', 'success');
    }

    await loadData();
    setIsModalOpen(false);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    await projectsService.deleteProject(projectToDelete.id);
    db.deleteProject(projectToDelete.id);
    await loadData();
    if (activeProject?.id === projectToDelete.id) {
      setActiveProject(null);
    }
    showToast('Projeto removido.', 'info');
    setProjectToDelete(null);
  };

  // If viewing project details
  if (activeProject) {
    return (
      <ProjectDetailPage
        project={activeProject}
        onBack={() => {
          setActiveProject(null);
          if (onClearSelectedProject) onClearSelectedProject();
        }}
        onUpdate={(updated) => {
          setActiveProject(updated);
          loadData();
        }}
      />
    );
  }

  // Filter list
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || p.status === statusFilter;
    const matchesService = serviceFilter === 'Todos' || p.service === serviceFilter;
    const matchesClient = clientFilter === 'Todos' || p.clientId === clientFilter;

    return matchesSearch && matchesStatus && matchesService && matchesClient;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Title & Action */}
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
            Projetos
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', fontWeight: 450 }}>
            Acompanhe projetos ativos, prazos e etapas.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleOpenCreate}
          style={{ gap: '8px', padding: '12px 24px', fontSize: '0.96rem' }}
        >
          <Plus size={18} /> Novo Projeto
        </button>
      </div>

      {/* Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: '18px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search
              size={18}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '42px', borderRadius: 'var(--radius-full)' }}
              placeholder="Pesquisar projetos, clientes ou serviços..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Client Filter */}
          <div style={{ minWidth: '190px' }}>
            <select
              className="form-select"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
            >
              <option value="Todos">Todos os Clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Service Filter */}
          <div style={{ minWidth: '180px' }}>
            <select
              className="form-select"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value as any)}
            >
              <option value="Todos">Todos os Serviços</option>
              <option value="Meta Ads">Meta Ads</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Social Media">Social Media</option>
              <option value="Google Meu Negócio">Google Meu Negócio</option>
              <option value="Landing Page">Landing Page</option>
              <option value="Site Institucional">Site Institucional</option>
              <option value="Identidade Visual">Identidade Visual</option>
              <option value="Criativos">Criativos</option>
              <option value="Edição de Vídeo">Edição de Vídeo</option>
              <option value="Plano Estratégico">Plano Estratégico</option>
            </select>
          </div>

          {/* Grid/Table switch */}
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

        {/* Status Filter Badges */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['Todos', 'Planejamento', 'Em produção', 'Aguardando cliente', 'Revisão', 'Finalizado'] as const).map(
            (st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  fontWeight: statusFilter === st ? 700 : 500,
                  background: statusFilter === st ? 'var(--green-primary)' : 'var(--cream-subtle)',
                  color: statusFilter === st ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid',
                  borderColor: statusFilter === st ? 'var(--green-primary)' : 'var(--cream-border)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {st}
              </button>
            )
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <Briefcase size={30} />
          </div>
          <h3 className="empty-state-title">Nenhum projeto encontrado</h3>
          <p className="empty-state-text">
            Nenhum projeto corresponde aos critérios de pesquisa ou filtros selecionados.
          </p>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Criar Novo Projeto
          </button>
        </div>
      )}

      {/* Table View (Desktop) / Cards (Mobile) */}
      {viewMode === 'table' && filteredProjects.length > 0 && (
        <>
          <div className="desktop-table-container">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Projeto</th>
                    <th>Cliente</th>
                    <th>Serviço</th>
                    <th>Responsável</th>
                    <th>Prazo</th>
                    <th>Progresso</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((proj) => (
                    <tr
                      key={proj.id}
                      onClick={() => setActiveProject(proj)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 650, color: 'var(--text-primary)', fontSize: '0.96rem' }}>{proj.name}</td>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{proj.clientName}</td>
                      <td>
                        <Badge status={proj.service} type="service" />
                      </td>
                      <td style={{ fontWeight: 500 }}>{proj.responsible}</td>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: 550 }}>
                        {new Date(proj.dueDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{ minWidth: '130px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="progress-bar-container" style={{ width: '85px', height: '7px' }}>
                            <div className="progress-bar-fill" style={{ width: `${proj.progress}%` }} />
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green-primary)' }}>{proj.progress}%</span>
                        </div>
                      </td>
                      <td>
                        <Badge status={proj.status} />
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="sidebar-collapse-btn"
                            style={{ color: 'var(--text-secondary)' }}
                            onClick={(e) => handleOpenEdit(proj, e)}
                            title="Editar projeto"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            className="sidebar-collapse-btn"
                            style={{ color: '#dc2626' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToDelete(proj);
                            }}
                            title="Excluir projeto"
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

          {/* Mobile Auto-Cards (No wide tables on mobile) */}
          <div className="mobile-cards-container">
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
                className="mobile-item-card"
                onClick={() => setActiveProject(proj)}
                style={{ cursor: 'pointer' }}
              >
                <div className="mobile-item-header">
                  <div>
                    <div className="mobile-item-title">{proj.clientName}</div>
                    <div style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                      {proj.name}
                    </div>
                  </div>
                  <Badge status={proj.status} />
                </div>

                <div className="mobile-item-meta">
                  <div className="mobile-item-row">
                    <span className="mobile-item-label">Serviço</span>
                    <Badge status={proj.service} type="service" />
                  </div>
                  <div className="mobile-item-row">
                    <span className="mobile-item-label">Responsável</span>
                    <span className="mobile-item-val">{proj.responsible}</span>
                  </div>
                  <div className="mobile-item-row">
                    <span className="mobile-item-label">Entrega</span>
                    <span className="mobile-item-val">{new Date(proj.dueDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="mobile-item-row">
                    <span className="mobile-item-label">Progresso</span>
                    <span className="mobile-item-val" style={{ color: 'var(--green-primary)' }}>{proj.progress}%</span>
                  </div>
                </div>

                <div className="mobile-item-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Abrir projeto
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && filteredProjects.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}
        >
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
              onClick={() => setActiveProject(proj)}
            >
              <div>
                <div className="card-header" style={{ marginBottom: '12px' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--sand-gold-dark)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em'
                      }}
                    >
                      {proj.clientName}
                    </span>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {proj.name}
                    </h4>
                  </div>
                  <Badge status={proj.status} />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <Badge status={proj.service} type="service" />
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '18px', fontWeight: 450 }}>
                  {proj.description || 'Sem descrição cadastrada.'}
                </p>

                {/* Progress bar */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                      Progresso ({proj.stages.filter(s => s.completed).length}/{proj.stages.length} etapas)
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--green-primary)' }}>{proj.progress}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${proj.progress}%` }} />
                  </div>
                </div>
              </div>

              {/* Bottom metadata */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--cream-border-subtle)',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  fontWeight: 500
                }}
              >
                <div>
                  Prazo: <strong style={{ color: 'var(--text-primary)' }}>{new Date(proj.dueDate).toLocaleDateString('pt-BR')}</strong>
                </div>

                <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    className="sidebar-collapse-btn"
                    style={{ color: 'var(--text-secondary)' }}
                    onClick={(e) => handleOpenEdit(proj, e)}
                    title="Editar projeto"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    className="sidebar-collapse-btn"
                    style={{ color: '#dc2626' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setProjectToDelete(proj);
                    }}
                    title="Excluir projeto"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State when no projects exist */}
      {filteredProjects.length === 0 && (
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
            <Briefcase size={26} />
          </div>
          <h3 className="font-serif" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Nenhum projeto cadastrado ainda.
          </h3>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.5, marginBottom: '22px' }}>
            Quando um novo projeto for criado, ele aparecerá aqui.
          </p>
          <button
            className="btn btn-primary"
            onClick={handleOpenCreate}
            style={{ gap: '8px' }}
          >
            <Plus size={16} /> Criar projeto
          </button>
        </div>
      )}

      {/* Modal Criar / Editar Projeto */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? 'Editar Projeto' : 'Novo Projeto'}
        subtitle="Vincule a um cliente e defina o escopo operacional da entrega"
        maxWidth="700px"
      >
        <form onSubmit={handleSaveProject}>
          <div className="form-group">
            <label className="form-label">Nome do Projeto *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Aquisição Meta Ads Q4 — Escala"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cliente Vinculado *</label>
              <select
                className="form-select"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                required
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Serviço *</label>
              <select
                className="form-select"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value as ServiceType })}
              >
                <option value="Meta Ads">Meta Ads</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Social Media">Social Media</option>
                <option value="Google Meu Negócio">Google Meu Negócio</option>
                <option value="Landing Page">Landing Page</option>
                <option value="Site Institucional">Site Institucional</option>
                <option value="Identidade Visual">Identidade Visual</option>
                <option value="Criativos">Criativos</option>
                <option value="Edição de Vídeo">Edição de Vídeo</option>
                <option value="Plano Estratégico">Plano Estratégico</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Responsável</label>
              <select
                className="form-select"
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
              >
                <option value="Wesley Nunes">Wesley Nunes</option>
                <option value="Ana Castro">Ana Castro</option>
                <option value="Equipe Alicerce">Equipe Alicerce</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status Inicial</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
              >
                <option value="Planejamento">Planejamento</option>
                <option value="Em produção">Em produção</option>
                <option value="Aguardando cliente">Aguardando cliente</option>
                <option value="Revisão">Revisão</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </div>
          </div>

          <div className="form-row">
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
              <label className="form-label">Data Prevista de Entrega *</label>
              <input
                type="date"
                className="form-input"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descrição do Projeto</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Objetivos, público-alvo, diretrizes e canais envolvidos..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '18px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingProject ? 'Salvar Alterações' : 'Criar Projeto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDeleteProject}
        title="Excluir Projeto"
        message={`Deseja realmente excluir o projeto "${projectToDelete?.name}"? Esta ação removerá o checklist e o histórico de etapas.`}
      />
    </div>
  );
};
