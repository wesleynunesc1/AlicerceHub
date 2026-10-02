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
  Square
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { phase2Service } from '../../services/phase2';
import { projectsService } from '../../services/projects';
import { clientsService } from '../../services/clients';
import { Project, Client } from '../../types';
import { Modal } from '../../components/Common/Modal';
import { useToast } from '../../components/Common/Toast';

export const TasksPage: React.FC = () => {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [viewMode, setViewMode] = useState<'lista' | 'kanban'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | TaskStatus>('Todos');
  const [priorityFilter, setPriorityFilter] = useState<'Todas' | TaskPriority>('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    clientId: '',
    responsible: 'Wesley Nunes',
    priority: 'Média' as TaskPriority,
    status: 'Pendente' as TaskStatus,
    dueDate: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    const [t, p, c] = await Promise.all([
      phase2Service.getTasks(),
      projectsService.getProjects(),
      clientsService.getClients()
    ]);
    setTasks(t);
    setProjects(p);
    setClients(c);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      projectId: projects[0]?.id || '',
      clientId: clients[0]?.id || '',
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

    await phase2Service.saveTask({
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

    showToast(editingTask ? 'Tarefa atualizada.' : 'Tarefa criada com sucesso.', 'success');
    setIsModalOpen(false);
    loadData();
  };

  const handleToggleComplete = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'Concluída' ? 'Pendente' : 'Concluída';
    await phase2Service.saveTask({
      id: task.id,
      status: nextStatus,
      completedAt: nextStatus === 'Concluída' ? new Date().toISOString() : undefined
    });
    showToast(nextStatus === 'Concluída' ? 'Tarefa concluída!' : 'Tarefa reaberta.', 'info');
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir esta tarefa?')) {
      await phase2Service.deleteTask(id);
      showToast('Tarefa removida.', 'info');
      loadData();
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.projectName && t.projectName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.clientName && t.clientName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'Todos' || t.status === statusFilter;
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
            Gerencie demandas operacionais, prazos e prioridades da equipe.
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

          <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '8px' }}>
            <Plus size={18} /> Nova Tarefa
          </button>
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
            placeholder="Pesquisar por título, cliente ou projeto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select
            className="form-input"
            style={{ width: 'auto', paddingRight: '32px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="Todos">Todos os status</option>
            <option value="Pendente">Pendente</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Aguardando">Aguardando</option>
            <option value="Concluída">Concluída</option>
          </select>

          <select
            className="form-input"
            style={{ width: 'auto', paddingRight: '32px' }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
          >
            <option value="Todas">Todas as prioridades</option>
            <option value="Baixa">Baixa</option>
            <option value="Média">Média</option>
            <option value="Alta">Alta</option>
            <option value="Urgente">Urgente</option>
          </select>
        </div>
      </div>

      {/* Conteúdo: Kanban ou Lista */}
      {filteredTasks.length === 0 ? (
        <div
          className="card"
          style={{ padding: '64px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <CheckSquare size={32} color="var(--sand-gold-dark)" style={{ marginBottom: '14px' }} />
          <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Nenhuma tarefa encontrada.
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', margin: '0 0 20px', maxWidth: '420px' }}>
            Crie tarefas associadas a projetos e clientes para organizar a rotina operacional.
          </p>
          <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '8px' }}>
            <Plus size={16} /> Criar primeira tarefa
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        /* Visualização KANBAN */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            alignItems: 'start'
          }}
        >
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col);
            return (
              <div
                key={col}
                style={{
                  background: 'var(--cream-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  border: '1px solid var(--cream-border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--green-deep)' }}>{col}</span>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 650,
                      background: 'rgba(0,0,0,0.06)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)'
                    }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '120px' }}>
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--cream-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleOpenEdit(task)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleComplete(task);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            {task.status === 'Concluída' ? (
                              <CheckCircle2 size={18} color="var(--status-active-text)" />
                            ) : (
                              <Square size={18} color="var(--text-muted)" />
                            )}
                          </button>
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: '0.92rem',
                              color: task.status === 'Concluída' ? 'var(--text-muted)' : 'var(--text-primary)',
                              textDecoration: task.status === 'Concluída' ? 'line-through' : 'none'
                            }}
                          >
                            {task.title}
                          </span>
                        </div>
                        {getPriorityBadge(task.priority)}
                      </div>

                      {task.clientName && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {task.clientName} {task.projectName && `• ${task.projectName}`}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--cream-border-subtle)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} color="var(--text-muted)" />
                          {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                        <span>{task.responsible}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Visualização LISTA */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="desktop-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Tarefa</th>
                  <th>Cliente / Projeto</th>
                  <th>Responsável</th>
                  <th>Prioridade</th>
                  <th>Prazo</th>
                  <th>Status</th>
                  <th style={{ width: '80px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id} style={{ cursor: 'pointer' }} onClick={() => handleOpenEdit(task)}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(task)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        {task.status === 'Concluída' ? (
                          <CheckCircle2 size={18} color="var(--status-active-text)" />
                        ) : (
                          <Square size={18} color="var(--text-muted)" />
                        )}
                      </button>
                    </td>
                    <td>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '0.94rem',
                          color: task.status === 'Concluída' ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: task.status === 'Concluída' ? 'line-through' : 'none'
                        }}
                      >
                        {task.title}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      {task.clientName || '—'} {task.projectName && `• ${task.projectName}`}
                    </td>
                    <td style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{task.responsible}</td>
                    <td>{getPriorityBadge(task.priority)}</td>
                    <td style={{ fontSize: '0.88rem', whiteSpace: 'nowrap', fontWeight: 550 }}>
                      {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 650,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'var(--cream-subtle)',
                          border: '1px solid var(--cream-border)'
                        }}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDelete(task.id)}
                        style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Tarefa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="form-group">
            <label className="form-label">Título da Tarefa *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Subir criativos validados para aprovação"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Cliente</label>
              <select
                className="form-input"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              >
                <option value="">Nenhum / Interno</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Projeto Associado</label>
              <select
                className="form-input"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              >
                <option value="">Nenhum / Geral</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Responsável</label>
              <input
                type="text"
                className="form-input"
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Prioridade</label>
              <select
                className="form-input"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
              >
                <option value="Pendente">Pendente</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Aguardando">Aguardando</option>
                <option value="Concluída">Concluída</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Prazo de Conclusão</label>
            <input
              type="date"
              className="form-input"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descrição / Instruções</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Instruções de execução, referências e entregáveis..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
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
