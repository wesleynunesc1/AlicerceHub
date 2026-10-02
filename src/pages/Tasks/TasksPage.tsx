import React, { useState, useEffect } from 'react';
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Search,
  List,
  Kanban as KanbanIcon,
  Calendar,
  User,
  Briefcase,
  ChevronRight,
  MoreVertical,
  CheckSquare,
  Square,
  Play,
  RotateCcw,
  Edit2,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, Project, Client } from '../../types';
import { phase2Service } from '../../services/phase2';
import { projectsService } from '../../services/projects';
import { clientsService } from '../../services/clients';
import { dashboardService } from '../../services/dashboard';
import { Modal } from '../../components/Common/Modal';
import { useToast } from '../../components/Common/Toast';

interface TasksPageProps {
  initialFilter?: string;
  initialTaskId?: string;
  initialClientId?: string;
  initialProjectId?: string;
  action?: string;
  onNavigateToProject?: (projectId: string) => void;
  onNavigateToClient?: (clientId: string) => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  initialFilter,
  initialTaskId,
  initialClientId,
  initialProjectId,
  action,
  onNavigateToProject,
  onNavigateToClient
}) => {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [viewMode, setViewMode] = useState<'lista' | 'kanban'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Atrasadas' | TaskStatus>(() => {
    if (initialFilter?.toLowerCase() === 'atrasada' || initialFilter?.toLowerCase() === 'atrasadas') {
      return 'Atrasadas';
    }
    return 'Todos';
  });
  const [priorityFilter, setPriorityFilter] = useState<'Todas' | TaskPriority>('Todas');

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: initialProjectId || '',
    clientId: initialClientId || '',
    responsible: 'Wesley Nunes',
    priority: 'Média' as TaskPriority,
    status: 'Pendente' as TaskStatus,
    dueDate: new Date().toISOString().split('T')[0]
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    const [t, p, c] = await Promise.all([
      phase2Service.getTasks(),
      projectsService.getProjects(),
      clientsService.getClients()
    ]);
    setTasks(t || []);
    setProjects(p || []);
    setClients(c || []);

    if (initialTaskId && t) {
      const found = t.find((item) => item.id === initialTaskId);
      if (found) setViewingTask(found);
    }
  };

  useEffect(() => {
    loadData();
    if (initialFilter?.toLowerCase() === 'atrasada' || initialFilter?.toLowerCase() === 'atrasadas') {
      setStatusFilter('Atrasadas');
      setViewMode('lista');
    }
    if (action === 'create') {
      handleOpenCreate();
    }
  }, [initialFilter, initialTaskId, action]);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      projectId: initialProjectId || projects[0]?.id || '',
      clientId: initialClientId || clients[0]?.id || '',
      responsible: 'Wesley Nunes',
      priority: 'Média',
      status: 'Pendente',
      dueDate: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      projectId: task.projectId || '',
      clientId: task.clientId || '',
      responsible: task.responsible,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('O título da tarefa é obrigatório.', 'error');
      return;
    }

    const selectedProj = projects.find((p) => p.id === formData.projectId);
    const selectedClient = clients.find((c) => c.id === formData.clientId);

    const saved = await phase2Service.saveTask({
      ...(editingTask ? { id: editingTask.id } : {}),
      title: formData.title,
      description: formData.description,
      projectId: formData.projectId || undefined,
      projectName: selectedProj?.name,
      clientId: formData.clientId || undefined,
      clientName: selectedClient?.companyName,
      responsible: formData.responsible,
      priority: formData.priority,
      status: formData.status,
      dueDate: formData.dueDate
    });

    await dashboardService.logActivity(
      editingTask ? 'Tarefa Atualizada' : 'Tarefa Criada',
      'task',
      saved.id,
      `Tarefa "${saved.title}" atribuída para ${saved.responsible} (Prazo: ${new Date(saved.dueDate).toLocaleDateString('pt-BR')}).`
    );

    showToast(editingTask ? 'Tarefa atualizada.' : 'Tarefa criada com sucesso.', 'success');
    setIsModalOpen(false);
    loadData();
  };

  // Atualização rápida de status da tarefa com recálculo automático de progresso do projeto
  const handleUpdateTaskStatus = async (task: Task, newStatus: TaskStatus) => {
    await phase2Service.saveTask({
      id: task.id,
      status: newStatus,
      completedAt: newStatus === 'Concluída' ? new Date().toISOString() : undefined
    });

    // Se a tarefa pertencer a um projeto, atualiza o progresso do projeto automaticamente
    if (task.projectId) {
      const projTasks = tasks.filter((t) => t.projectId === task.projectId);
      const completedCount = projTasks.filter((t) =>
        t.id === task.id ? newStatus === 'Concluída' : t.status === 'Concluída'
      ).length;
      const progress = Math.round((completedCount / (projTasks.length || 1)) * 100);
      await projectsService.updateProject(task.projectId, { progress });
    }

    await dashboardService.logActivity(
      'Status da Tarefa Atualizado',
      'task',
      task.id,
      `Tarefa "${task.title}" marcada como "${newStatus}".`
    );

    showToast(`Tarefa atualizada para "${newStatus}".`, 'info');
    if (viewingTask?.id === task.id) {
      setViewingTask({ ...viewingTask, status: newStatus });
    }
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir esta tarefa?')) {
      await phase2Service.deleteTask(id);
      showToast('Tarefa removida.', 'info');
      setViewingTask(null);
      loadData();
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.projectName && t.projectName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.clientName && t.clientName.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesStatus = true;
    if (statusFilter === 'Atrasadas') {
      matchesStatus = t.status !== 'Concluída' && t.dueDate < todayStr;
    } else if (statusFilter !== 'Todos') {
      matchesStatus = t.status === statusFilter;
    }

    const matchesPriority = priorityFilter === 'Todas' || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityBadge = (p: TaskPriority) => {
    const styles: Record<TaskPriority, { bg: string; color: string }> = {
      Baixa: { bg: '#F1F5F9', color: '#475569' },
      Média: { bg: '#E0F2FE', color: '#0369A1' },
      Alta: { bg: '#FEF3C7', color: '#B45309' },
      Urgente: { bg: '#FEE2E2', color: '#B91C1C' }
    };
    const s = styles[p] || styles.Média;
    return (
      <span
        style={{
          fontSize: '0.74rem',
          fontWeight: 650,
          padding: '2px 8px',
          borderRadius: '4px',
          background: s.bg,
          color: s.color,
          letterSpacing: '0.04em'
        }}
      >
        {p}
      </span>
    );
  };

  const kanbanColumns: TaskStatus[] = ['Pendente', 'Em andamento', 'Aguardando', 'Concluída'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
            Tarefas
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', margin: 0, fontWeight: 450 }}>
            Demandas operacionais, prazos de entrega e responsabilidades da equipe.
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
              <KanbanIcon size={16} /> Kanban
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
            <Plus size={16} /> Nova Tarefa
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '420px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por título, projeto ou cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{ minWidth: '150px' }}
          >
            <option value="Todos">Todos os Status</option>
            <option value="Atrasadas">Tarefas Atrasadas</option>
            <option value="Pendente">Pendente</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Aguardando">Aguardando</option>
            <option value="Concluída">Concluída</option>
          </select>

          <select
            className="form-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            style={{ minWidth: '140px' }}
          >
            <option value="Todas">Todas as Prioridades</option>
            <option value="Urgente">Urgente</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>
        </div>
      </div>

      {/* Visualização: Kanban */}
      {viewMode === 'kanban' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(260px, 1fr))',
            gap: '20px',
            overflowX: 'auto',
            paddingBottom: '20px',
            alignItems: 'start'
          }}
        >
          {kanbanColumns.map((column) => {
            const columnTasks = filteredTasks.filter((t) => t.status === column);

            return (
              <div
                key={column}
                style={{
                  background: 'var(--cream-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--cream-border-subtle)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  minHeight: '480px'
                }}
              >
                {/* Header da Coluna */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--green-deep)' }}>
                    {column}
                  </span>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: '#FFFFFF',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {columnTasks.length}
                  </span>
                </div>

                {/* Cards da Coluna */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {columnTasks.map((task) => {
                    const isLate = task.status !== 'Concluída' && task.dueDate < todayStr;

                    return (
                      <div
                        key={task.id}
                        className="card"
                        onClick={() => setViewingTask(task)}
                        style={{
                          padding: '16px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          borderLeft: isLate ? '3px solid #DC2626' : undefined
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 650, fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                            {task.title}
                          </span>
                          {getPriorityBadge(task.priority)}
                        </div>

                        {(task.projectName || task.clientName) && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Briefcase size={12} color="var(--sand-gold-dark)" />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {task.projectName || task.clientName}
                            </span>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '0.76rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isLate ? '#DC2626' : 'var(--text-muted)' }}>
                            <Clock size={12} />
                            <span style={{ fontWeight: isLate ? 700 : 500 }}>
                              {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <span style={{ color: 'var(--text-muted)' }}>{task.responsible}</span>
                        </div>
                      </div>
                    );
                  })}

                  {columnTasks.length === 0 && (
                    <div style={{ padding: '32px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      Nenhuma tarefa nesta etapa
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Visualização: Lista de Tarefas */}
      {viewMode === 'lista' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="desktop-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Tarefa</th>
                  <th>Projeto / Cliente</th>
                  <th>Responsável</th>
                  <th>Prioridade</th>
                  <th>Prazo</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => {
                  const isLate = task.status !== 'Concluída' && task.dueDate < todayStr;

                  return (
                    <tr key={task.id} onClick={() => setViewingTask(task)} style={{ cursor: 'pointer' }}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className="sidebar-collapse-btn"
                          onClick={() => handleUpdateTaskStatus(task, task.status === 'Concluída' ? 'Pendente' : 'Concluída')}
                          title={task.status === 'Concluída' ? 'Reabrir tarefa' : 'Concluir tarefa'}
                          style={{ color: task.status === 'Concluída' ? 'var(--status-active-text)' : 'var(--text-muted)' }}
                        >
                          {task.status === 'Concluída' ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                      </td>
                      <td>
                        <div
                          style={{
                            fontWeight: 650,
                            color: 'var(--text-primary)',
                            textDecoration: task.status === 'Concluída' ? 'line-through' : 'none'
                          }}
                        >
                          {task.title}
                        </div>
                        {task.description && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {task.description.slice(0, 70)}...
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{task.projectName || '—'}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{task.clientName}</div>
                      </td>
                      <td style={{ fontSize: '0.88rem' }}>{task.responsible}</td>
                      <td>{getPriorityBadge(task.priority)}</td>
                      <td>
                        <span style={{ fontSize: '0.86rem', fontWeight: isLate ? 700 : 500, color: isLate ? '#DC2626' : 'var(--text-primary)' }}>
                          {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                        {isLate && (
                          <span style={{ display: 'block', fontSize: '0.72rem', color: '#DC2626', fontWeight: 650 }}>
                            Atrasada
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', fontWeight: 650, padding: '3px 8px', borderRadius: '4px', background: 'var(--cream-subtle)' }}>
                          {task.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button
                            className="sidebar-collapse-btn"
                            onClick={() => handleOpenEdit(task)}
                            title="Editar tarefa"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="sidebar-collapse-btn"
                            onClick={() => handleDelete(task.id)}
                            title="Excluir tarefa"
                            style={{ color: '#DC2626' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal / Painel da Tarefa: Iniciar, Concluir, Reabrir, Editar, Excluir */}
      {viewingTask && (
        <Modal
          isOpen={!!viewingTask}
          onClose={() => setViewingTask(null)}
          title={viewingTask.title}
          subtitle={`Responsável: ${viewingTask.responsible} • Prazo: ${new Date(viewingTask.dueDate).toLocaleDateString('pt-BR')}`}
          maxWidth="640px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const t = viewingTask;
                    setViewingTask(null);
                    handleOpenEdit(t);
                  }}
                >
                  <Edit2 size={14} /> Editar
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
                  onClick={() => handleDelete(viewingTask.id)}
                >
                  <Trash2 size={14} /> Excluir
                </button>
              </div>

              {/* Botões do ciclo de vida da tarefa solicitados no prompt */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {viewingTask.status === 'Pendente' && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleUpdateTaskStatus(viewingTask, 'Em andamento')}
                  >
                    <Play size={14} /> Iniciar
                  </button>
                )}

                {viewingTask.status !== 'Concluída' ? (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleUpdateTaskStatus(viewingTask, 'Concluída')}
                  >
                    <CheckCircle2 size={14} /> Concluir Tarefa
                  </button>
                ) : (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleUpdateTaskStatus(viewingTask, 'Pendente')}
                  >
                    <RotateCcw size={14} /> Reabrir Tarefa
                  </button>
                )}
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div className="card" style={{ padding: '12px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</span>
                <div style={{ marginTop: '4px' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 650, padding: '3px 8px', borderRadius: '4px', background: 'var(--cream-subtle)' }}>
                    {viewingTask.status}
                  </span>
                </div>
              </div>

              <div className="card" style={{ padding: '12px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Prioridade</span>
                <div style={{ marginTop: '4px' }}>
                  {getPriorityBadge(viewingTask.priority)}
                </div>
              </div>

              <div className="card" style={{ padding: '12px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Prazo de Entrega</span>
                <div style={{ marginTop: '4px', fontSize: '0.9rem', fontWeight: 600, color: viewingTask.dueDate < todayStr && viewingTask.status !== 'Concluída' ? '#DC2626' : 'var(--text-primary)' }}>
                  {new Date(viewingTask.dueDate).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>

            {(viewingTask.projectName || viewingTask.clientName) && (
              <div className="card" style={{ padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Vinculação</span>
                  <div style={{ fontSize: '0.94rem', fontWeight: 650, color: 'var(--green-deep)', marginTop: '2px' }}>
                    {viewingTask.projectName || viewingTask.clientName}
                  </div>
                  {viewingTask.clientName && viewingTask.projectName && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cliente: {viewingTask.clientName}</div>
                  )}
                </div>

                {viewingTask.projectId && onNavigateToProject && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const pid = viewingTask.projectId;
                      setViewingTask(null);
                      if (pid) onNavigateToProject(pid);
                    }}
                    style={{ gap: '4px' }}
                  >
                    Abrir Projeto <ExternalLink size={12} />
                  </button>
                )}
              </div>
            )}

            {viewingTask.description && (
              <div className="card" style={{ padding: '16px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Descrição & Instruções
                </span>
                <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                  {viewingTask.description}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal: Cadastro / Edição de Tarefa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
        subtitle="Defina o responsável, prioridade e prazo"
        maxWidth="640px"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Título da Tarefa *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Subir campanha de remarketing no Meta Ads"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label">Cliente</label>
              <select
                className="form-select"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              >
                <option value="">Nenhum cliente vinculado</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Projeto</label>
              <select
                className="form-select"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              >
                <option value="">Nenhum projeto vinculado</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.clientName})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label">Responsável</label>
              <input
                type="text"
                className="form-input"
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Prioridade</label>
              <select
                className="form-select"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="form-label">Prazo de Entrega *</label>
              <input
                type="date"
                className="form-input"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Descrição / Checklist</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Instruções para execução da tarefa..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
