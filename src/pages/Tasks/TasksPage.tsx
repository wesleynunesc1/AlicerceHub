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
  ExternalLink,
  ArrowLeft,
  X
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, Project, Client } from '../../types';
import { phase2Service } from '../../services/phase2';
import { projectsService } from '../../services/projects';
import { clientsService } from '../../services/clients';
import { dashboardService } from '../../services/dashboard';
import { parseTaskCommand, ParsedTaskDraft } from '../../services/taskCommandParser';
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

  // Modais e modo de criação (Manual ou Criar por comando)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // Estados do modo Criar por comando
  const [creationMode, setCreationMode] = useState<'manual' | 'prompt'>('manual');
  const [promptStep, setPromptStep] = useState<'input' | 'preview' | 'success'>('input');
  const [commandText, setCommandText] = useState('');
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [interpretError, setInterpretError] = useState<string | null>(null);
  const [parsedDrafts, setParsedDrafts] = useState<ParsedTaskDraft[]>([]);
  const [isSavingDrafts, setIsSavingDrafts] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);
  const [newChecklistInputs, setNewChecklistInputs] = useState<Record<string, string>>({});

  // Estados de Drag and Drop para o Kanban
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return 'Sem prazo';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? 'Sem prazo' : d.toLocaleDateString('pt-BR');
    } catch {
      return 'Sem prazo';
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: initialProjectId || '',
    clientId: initialClientId || '',
    responsible: 'Wesley Nunes',
    priority: 'Média' as TaskPriority,
    status: 'Pendente' as TaskStatus,
    dueDate: ''
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
    setCreationMode('manual');
    setPromptStep('input');
    setCommandText('');
    setInterpretError(null);
    setParsedDrafts([]);
    setCreatedCount(0);
    setFormData({
      title: '',
      description: '',
      projectId: initialProjectId || '',
      clientId: initialClientId || '',
      responsible: 'Wesley Nunes',
      priority: 'Média',
      status: 'Pendente',
      dueDate: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setCreationMode('manual');
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

  // Interpretador de comandos em linguagem natural
  const handleInterpretCommand = async () => {
    if (!commandText.trim()) {
      setInterpretError('Por favor, digite ou cole a descrição das tarefas.');
      return;
    }
    setInterpretError(null);
    setIsInterpreting(true);

    try {
      const results = await parseTaskCommand(commandText, {
        clients,
        projects,
        existingTasks: tasks,
        currentUser: formData.responsible || 'Wesley Nunes'
      });

      if (!results || results.length === 0) {
        setInterpretError('Não conseguimos identificar tarefas nesse texto. Revise as informações e tente novamente.');
        setIsInterpreting(false);
        return;
      }

      setParsedDrafts(results);
      setPromptStep('preview');
    } catch (err) {
      console.error('Erro na interpretação:', err);
      setInterpretError('Não conseguimos identificar tarefas nesse texto. Revise as informações e tente novamente.');
    } finally {
      setIsInterpreting(false);
    }
  };

  // Salvar rascunhos interpretados em lote no Supabase
  const handleSaveAllDrafts = async () => {
    if (parsedDrafts.length === 0) return;

    const hasEmptyTitle = parsedDrafts.some((d) => !d.title.trim());
    if (hasEmptyTitle) {
      showToast('Todas as tarefas precisam ter um título preenchido.', 'error');
      return;
    }

    setIsSavingDrafts(true);
    try {
      const createdTasks: Task[] = [];

      for (const draft of parsedDrafts) {
        const selectedProj = projects.find((p) => p.id === draft.projectId);
        const selectedClient = clients.find((c) => c.id === draft.clientId);

        let finalDescription = draft.description.trim();
        if (draft.checklist && draft.checklist.length > 0) {
          const checklistText = draft.checklist.map((c) => `• ${c}`).join('\n');
          finalDescription = finalDescription
            ? `Checklist:\n${checklistText}\n\nObservações:\n${finalDescription}`
            : `Checklist:\n${checklistText}`;
        }

        const saved = await phase2Service.saveTask({
          title: draft.title.trim(),
          description: finalDescription,
          projectId: draft.projectId || undefined,
          projectName: selectedProj?.name || draft.projectName,
          clientId: draft.clientId || undefined,
          clientName: selectedClient?.companyName || draft.clientName,
          responsible: draft.responsible || 'Wesley Nunes',
          priority: draft.priority,
          status: 'Pendente',
          dueDate: draft.dueDate
        });
        createdTasks.push(saved);
      }

      // Registro de histórico conforme especificação
      if (createdTasks.length === 1) {
        const prazoMsg = createdTasks[0].dueDate ? ` (Prazo: ${formatDueDate(createdTasks[0].dueDate)})` : '';
        await dashboardService.logActivity(
          'Tarefa criada via comando',
          'task',
          createdTasks[0].id,
          `Tarefa "${createdTasks[0].title}" atribuída para ${createdTasks[0].responsible}${prazoMsg}.`
        );
      } else {
        await dashboardService.logActivity(
          `${createdTasks.length} tarefas criadas via comando`,
          'task',
          createdTasks[0].id,
          `${createdTasks.length} tarefas criadas e organizadas em lote a partir de comando natural.`
        );
      }

      setCreatedCount(createdTasks.length);
      showToast(
        createdTasks.length === 1
          ? 'Tarefa criada com sucesso.'
          : `${createdTasks.length} tarefas criadas com sucesso.`,
        'success'
      );
      await loadData();
      setPromptStep('success');
    } catch (err) {
      console.error('Erro ao salvar tarefas em lote:', err);
      showToast('Erro ao criar tarefas. Tente novamente.', 'error');
    } finally {
      setIsSavingDrafts(false);
    }
  };

  const handleUpdateDraft = (index: number, updates: Partial<ParsedTaskDraft>) => {
    setParsedDrafts((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      if ('clientId' in updates) {
        const foundClient = clients.find((c) => c.id === updates.clientId);
        copy[index].clientName = foundClient?.companyName;
        copy[index].clientNotFound = false;
      }
      return copy;
    });
  };

  const handleRemoveDraft = (index: number) => {
    setParsedDrafts((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      if (filtered.length === 0) {
        setPromptStep('input');
      }
      return filtered;
    });
  };

  const handleAddDraftChecklistItem = (draftIndex: number) => {
    const tempId = parsedDrafts[draftIndex].tempId;
    const itemText = (newChecklistInputs[tempId] || '').trim();
    if (!itemText) return;

    setParsedDrafts((prev) => {
      const copy = [...prev];
      copy[draftIndex] = {
        ...copy[draftIndex],
        checklist: [...copy[draftIndex].checklist, itemText]
      };
      return copy;
    });

    setNewChecklistInputs((prev) => ({ ...prev, [tempId]: '' }));
  };

  const handleRemoveDraftChecklistItem = (draftIndex: number, itemIndex: number) => {
    setParsedDrafts((prev) => {
      const copy = [...prev];
      copy[draftIndex] = {
        ...copy[draftIndex],
        checklist: copy[draftIndex].checklist.filter((_, i) => i !== itemIndex)
      };
      return copy;
    });
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
      title: formData.title.trim(),
      description: formData.description,
      projectId: formData.projectId || undefined,
      projectName: selectedProj?.name,
      clientId: formData.clientId || undefined,
      clientName: selectedClient?.companyName,
      responsible: formData.responsible || 'Wesley Nunes',
      priority: formData.priority || 'Média',
      status: formData.status || 'Pendente',
      dueDate: formData.dueDate || ''
    });

    const prazoMsg = saved.dueDate ? ` (Prazo: ${formatDueDate(saved.dueDate)})` : '';

    await dashboardService.logActivity(
      editingTask ? 'Tarefa Atualizada' : 'Tarefa Criada',
      'task',
      saved.id,
      `Tarefa "${saved.title}" atribuída para ${saved.responsible}${prazoMsg}.`
    );

    showToast(editingTask ? 'Tarefa atualizada.' : 'Tarefa criada com sucesso.', 'success');
    setIsModalOpen(false);
    loadData();
  };

  // Mover tarefa entre etapas (Kanban Drag and Drop e ações explícitas) com Optimistic UI e Rollback
  const handleMoveTask = async (taskId: string, newStatus: TaskStatus) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask || targetTask.status === newStatus) return;

    const previousStatus = targetTask.status;
    const isCompleted = newStatus === 'Concluída';
    const completedAt = isCompleted ? new Date().toISOString() : undefined;

    // 1. Optimistic UI: Atualiza o estado da interface imediatamente
    const updatedTask: Task = {
      ...targetTask,
      status: newStatus,
      completedAt
    };

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
    if (viewingTask?.id === taskId) {
      setViewingTask(updatedTask);
    }

    try {
      // 2. Persistência real no Supabase / LocalStorage
      await phase2Service.saveTask({
        id: taskId,
        status: newStatus,
        completedAt: isCompleted ? completedAt : undefined
      });

      // 3. Atualização automática de progresso do projeto se houver vínculo
      if (targetTask.projectId) {
        const projTasks = tasks
          .map((t) => (t.id === taskId ? updatedTask : t))
          .filter((t) => t.projectId === targetTask.projectId);
        const completedCount = projTasks.filter((t) => t.status === 'Concluída').length;
        const progress = Math.round((completedCount / (projTasks.length || 1)) * 100);
        await projectsService.updateProject(targetTask.projectId, { progress });
      }

      // 4. Registro de log de atividade
      await dashboardService.logActivity(
        isCompleted ? 'Tarefa Concluída' : 'Tarefa Movida no Kanban',
        'task',
        taskId,
        isCompleted
          ? `Tarefa "${targetTask.title}" concluída.`
          : `Tarefa "${targetTask.title}" movida de "${previousStatus}" para "${newStatus}".`
      );

      showToast(`Tarefa atualizada para "${newStatus}".`, 'info');
    } catch (err) {
      console.error('Erro ao mover tarefa:', err);
      // Rollback se houver falha
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: previousStatus } : t)));
      if (viewingTask?.id === taskId) {
        setViewingTask(targetTask);
      }
      showToast('Não foi possível mover a tarefa. Tente novamente.', 'error');
    }
  };

  // Compatibilidade com ações existentes que passam o objeto task
  const handleUpdateTaskStatus = async (task: Task, newStatus: TaskStatus) => {
    await handleMoveTask(task.id, newStatus);
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

  const getAgencyTaskTag = (task: Task): string | null => {
    const text = `${task.title} ${task.description || ''} ${task.projectName || ''}`.toLowerCase();
    if (text.includes('design') || text.includes('arte') || text.includes('banner') || text.includes('criativo') || text.includes('layout')) return 'Design';
    if (text.includes('copy') || text.includes('legenda') || text.includes('roteiro') || text.includes('texto')) return 'Copy';
    if (text.includes('tráfego') || text.includes('meta ads') || text.includes('google ads') || text.includes('campanha') || text.includes('anúncio') || text.includes('cbo') || text.includes('público')) return 'Tráfego';
    if (text.includes('web') || text.includes('site') || text.includes('landing') || text.includes('página') || text.includes('lp') || text.includes('pixel') || text.includes('domínio')) return 'Web';
    if (text.includes('vídeo') || text.includes('video') || text.includes('edição') || text.includes('reels') || text.includes('corte')) return 'Vídeo';
    if (text.includes('social') || text.includes('post') || text.includes('stories') || text.includes('carrossel') || text.includes('feed')) return 'Social Media';
    if (text.includes('estratégia') || text.includes('planejamento') || text.includes('briefing') || text.includes('diagnóstico')) return 'Estratégia';
    if (text.includes('comercial') || text.includes('proposta') || text.includes('lead') || text.includes('venda') || text.includes('fechamento')) return 'Comercial';
    if (text.includes('aprova') || text.includes('revisão') || text.includes('validação')) return 'Aprovação';
    if (text.includes('reunião') || text.includes('cliente') || text.includes('onboarding') || text.includes('alinhamento') || text.includes('atendimento')) return 'Atendimento';
    return null;
  };

  const kanbanColumns: TaskStatus[] = ['Pendente', 'Em andamento', 'Aguardando', 'Concluída'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--sand-gold-dark)',
                fontFamily: 'var(--font-heading)'
              }}
            >
              Fluxo Operacional
            </span>
          </div>
          <h1 className="font-heading" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
            Tarefas & Demandas
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', margin: '4px 0 0', fontWeight: 400 }}>
            Quadro Kanban com arrastar e soltar, etiquetas de agência e criação ágil por comando natural.
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
            const isColumnTarget = dragOverColumn === column;

            return (
              <div
                key={column}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverColumn !== column) {
                    setDragOverColumn(column);
                  }
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  if (dragOverColumn === column) {
                    setDragOverColumn(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedId = e.dataTransfer.getData('text/plain') || draggedTaskId;
                  if (droppedId) {
                    handleMoveTask(droppedId, column);
                  }
                  setDraggedTaskId(null);
                  setDragOverColumn(null);
                }}
                style={{
                  background: isColumnTarget ? 'var(--cream-light)' : 'var(--cream-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: isColumnTarget
                    ? '2px dashed var(--green-primary)'
                    : '1px solid var(--cream-border-subtle)',
                  boxShadow: isColumnTarget ? '0 0 16px rgba(45, 90, 39, 0.15)' : 'none',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  minHeight: '480px',
                  transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease'
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
                    const isLate = Boolean(task.dueDate && task.status !== 'Concluída' && task.dueDate < todayStr);
                    const isBeingDragged = draggedTaskId === task.id;
                    const agencyTag = getAgencyTaskTag(task);

                    return (
                      <div
                        key={task.id}
                        className="card"
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', task.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggedTaskId(task.id);
                        }}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDragOverColumn(null);
                        }}
                        onClick={() => setViewingTask(task)}
                        style={{
                          padding: '16px',
                          cursor: 'grab',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          borderLeft: isLate ? '3px solid #DC2626' : undefined,
                          opacity: isBeingDragged ? 0.45 : 1,
                          transform: isBeingDragged ? 'scale(0.98)' : 'none',
                          transition: 'transform 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 650, fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                            {task.title}
                          </span>
                          {getPriorityBadge(task.priority)}
                        </div>

                        {agencyTag && (
                          <div style={{ display: 'flex' }}>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 650,
                                padding: '2px 7px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--cream-subtle)',
                                color: 'var(--green-deep)',
                                border: '1px solid var(--cream-border)',
                                fontFamily: 'var(--font-heading)'
                              }}
                            >
                              {agencyTag}
                            </span>
                          </div>
                        )}

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
                              {formatDueDate(task.dueDate)}
                            </span>
                          </div>
                          <span style={{ color: 'var(--text-muted)' }}>{task.responsible}</span>
                        </div>

                        {/* Fallback acessível e mobile para mover status sem exigir arrastar */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '4px',
                            paddingTop: '6px',
                            borderTop: '1px solid var(--cream-border-subtle)',
                            fontSize: '0.74rem'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>Mover para:</span>
                          <select
                            value={task.status}
                            onChange={(e) => handleMoveTask(task.id, e.target.value as TaskStatus)}
                            style={{
                              fontSize: '0.74rem',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--cream-border)',
                              background: '#FFFFFF',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                            aria-label={`Mover status da tarefa ${task.title}`}
                          >
                            <option value="Pendente">Pendente</option>
                            <option value="Em andamento">Em andamento</option>
                            <option value="Aguardando">Aguardando</option>
                            <option value="Concluída">Concluída</option>
                          </select>
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
                  const isLate = Boolean(task.dueDate && task.status !== 'Concluída' && task.dueDate < todayStr);

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
                          {formatDueDate(task.dueDate)}
                        </span>
                        {isLate && (
                          <span style={{ display: 'block', fontSize: '0.72rem', color: '#DC2626', fontWeight: 650 }}>
                            Atrasada
                          </span>
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select
                          value={task.status}
                          onChange={(e) => handleMoveTask(task.id, e.target.value as TaskStatus)}
                          style={{
                            fontSize: '0.78rem',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--cream-border)',
                            background: 'var(--cream-subtle)',
                            fontWeight: 650,
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="Pendente">Pendente</option>
                          <option value="Em andamento">Em andamento</option>
                          <option value="Aguardando">Aguardando</option>
                          <option value="Concluída">Concluída</option>
                        </select>
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
          subtitle={`Responsável: ${viewingTask.responsible} • Prazo: ${formatDueDate(viewingTask.dueDate)}`}
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
                <div style={{ marginTop: '4px', fontSize: '0.9rem', fontWeight: 600, color: viewingTask.dueDate && viewingTask.dueDate < todayStr && viewingTask.status !== 'Concluída' ? '#DC2626' : 'var(--text-primary)' }}>
                  {formatDueDate(viewingTask.dueDate)}
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
        title={editingTask ? 'Editar Tarefa' : creationMode === 'prompt' ? 'Criar por comando' : 'Nova Tarefa'}
        subtitle={
          editingTask
            ? 'Defina o responsável, prioridade e prazo'
            : creationMode === 'prompt'
            ? promptStep === 'preview'
              ? `Revise e edite as ${parsedDrafts.length} ${parsedDrafts.length === 1 ? 'tarefa identificada' : 'tarefas identificadas'} antes de salvar`
              : promptStep === 'success'
              ? 'Tarefas sincronizadas com sucesso'
              : 'Descreva as tarefas em linguagem natural e o Alicerce OS organiza tudo'
            : 'Defina o responsável, prioridade e prazo'
        }
        maxWidth={creationMode === 'prompt' && promptStep === 'preview' ? '780px' : '640px'}
      >
        {/* Seletor discreto de modo no topo (somente na criação de nova tarefa) */}
        {!editingTask && promptStep !== 'success' && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px',
              background: 'var(--cream-subtle)',
              borderRadius: '8px',
              border: '1px solid var(--cream-border)',
              marginBottom: '18px',
              width: 'fit-content'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setCreationMode('manual');
                setInterpretError(null);
              }}
              style={{
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: creationMode === 'manual' ? 650 : 500,
                borderRadius: '6px',
                border: 'none',
                background: creationMode === 'manual' ? 'var(--cream-card)' : 'transparent',
                color: creationMode === 'manual' ? 'var(--green-deep)' : 'var(--text-muted)',
                boxShadow: creationMode === 'manual' ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Manual
            </button>
            <button
              type="button"
              onClick={() => {
                setCreationMode('prompt');
                setInterpretError(null);
              }}
              style={{
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: creationMode === 'prompt' ? 650 : 500,
                borderRadius: '6px',
                border: 'none',
                background: creationMode === 'prompt' ? 'var(--cream-card)' : 'transparent',
                color: creationMode === 'prompt' ? 'var(--green-deep)' : 'var(--text-muted)',
                boxShadow: creationMode === 'prompt' ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Criar por comando
            </button>
          </div>
        )}

        {/* MODO MANUAL (ou edição de tarefa existente) */}
        {(editingTask || creationMode === 'manual') && (
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
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
                <label className="form-label">Prazo de Entrega (Opcional)</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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
        )}

        {/* MODO CRIAR POR COMANDO */}
        {!editingTask && creationMode === 'prompt' && (
          <div>
            {/* ETAPA 1: DIGITAÇÃO DO COMANDO */}
            {promptStep === 'input' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 650, color: 'var(--green-deep)', margin: 0 }}>
                    Descreva as tarefas
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.45 }}>
                    Escreva ou cole o que precisa ser feito. O Alicerce OS organiza as informações para você.
                  </p>
                </div>

                <div>
                  <textarea
                    className="form-textarea"
                    value={commandText}
                    onChange={(e) => {
                      setCommandText(e.target.value);
                      if (interpretError) setInterpretError(null);
                    }}
                    rows={5}
                    placeholder="Ex.: Criar tarefa para concluir landing page da Sabrina, responsável Wesley, prioridade alta, prazo amanhã. Checklist: revisar versão mobile, corrigir hero, testar formulário e publicar."
                    style={{
                      width: '100%',
                      minHeight: '150px',
                      fontSize: '16px',
                      lineHeight: 1.5,
                      padding: '14px',
                      borderRadius: '8px',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                    autoFocus
                  />
                </div>

                {/* Exemplos discretos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Exemplos de comandos:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      'Hoje preciso concluir site do Pedro Fit e landing page da Sabrina',
                      'Pablo: configurar campanha Meta Ads, subir campanha e criar 6 artes. Tudo prioridade alta até sexta.',
                      'Amanhã fazer remarketing Bora Flix',
                      'Concluir site. Revisar mobile, testar formulário, revisar links e publicar.'
                    ].map((tip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setCommandText(tip);
                          if (interpretError) setInterpretError(null);
                        }}
                        style={{
                          background: 'var(--cream-subtle)',
                          border: '1px solid var(--cream-border)',
                          borderRadius: '6px',
                          padding: '5px 10px',
                          fontSize: '0.78rem',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cream-border)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--cream-subtle)')}
                      >
                        &ldquo;{tip.length > 55 ? tip.slice(0, 55) + '...' : tip}&rdquo;
                      </button>
                    ))}
                  </div>
                </div>

                {interpretError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      background: 'rgba(220, 38, 38, 0.08)',
                      border: '1px solid rgba(220, 38, 38, 0.25)',
                      borderRadius: '8px',
                      color: '#B91C1C',
                      fontSize: '0.86rem'
                    }}
                  >
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{interpretError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isInterpreting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleInterpretCommand}
                    disabled={isInterpreting || !commandText.trim()}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {isInterpreting ? (
                      <>
                        <span className="spinner-sm" />
                        Organizando tarefas...
                      </>
                    ) : (
                      'Interpretar tarefas'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 2: PRÉ-VISUALIZAÇÃO E EDIÇÃO ANTES DE SALVAR */}
            {promptStep === 'preview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.12rem', fontWeight: 650, color: 'var(--green-deep)', margin: 0 }}>
                      Tarefas identificadas ({parsedDrafts.length})
                    </h4>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                      Revise e edite as informações antes de confirmar.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setParsedDrafts((prev) => [
                        ...prev,
                        {
                          tempId: `draft-manual-${Date.now()}`,
                          title: '',
                          responsible: formData.responsible || 'Wesley Nunes',
                          priority: 'Média',
                          dueDate: new Date().toISOString().split('T')[0],
                          description: '',
                          checklist: []
                        }
                      ]);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={14} /> Adicionar tarefa
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    maxHeight: '56vh',
                    overflowY: 'auto',
                    paddingRight: '4px'
                  }}
                >
                  {parsedDrafts.map((draft, idx) => (
                    <div
                      key={draft.tempId || idx}
                      style={{
                        padding: '16px',
                        border: '1px solid var(--cream-border)',
                        borderRadius: '10px',
                        background: 'var(--cream-card)',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      {/* Topo do card: índice, alerta de duplicidade e exclusão */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'var(--cream-subtle)',
                              color: 'var(--green-deep)'
                            }}
                          >
                            Tarefa #{idx + 1}
                          </span>

                          {draft.isPossibleDuplicate && (
                            <span
                              style={{
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: 'var(--status-prog-bg)',
                                color: 'var(--status-prog-text)',
                                border: '1px solid var(--status-prog-border)'
                              }}
                              title={draft.duplicateReason}
                            >
                              ⚠️ Possível tarefa duplicada
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDraft(idx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.8rem',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            transition: 'color 0.15s, background 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#DC2626';
                            e.currentTarget.style.background = 'rgba(220, 38, 38, 0.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-muted)';
                            e.currentTarget.style.background = 'transparent';
                          }}
                          title="Remover esta tarefa da lista"
                        >
                          <Trash2 size={14} /> Remover
                        </button>
                      </div>

                      {/* Título da Tarefa */}
                      <div>
                        <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                          Título da Tarefa *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={draft.title}
                          onChange={(e) => handleUpdateDraft(idx, { title: e.target.value })}
                          placeholder="Título da tarefa..."
                          required
                        />
                      </div>

                      {/* Cliente e Projeto */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <label className="form-label" style={{ fontSize: '0.8rem', margin: 0 }}>
                              Cliente
                            </label>
                            {draft.clientNotFound && draft.clientSearchTerm && (
                              <span style={{ fontSize: '0.72rem', color: '#B45309', fontWeight: 600 }}>
                                ⚠️ &ldquo;{draft.clientSearchTerm}&rdquo; não encontrado
                              </span>
                            )}
                          </div>
                          <select
                            className="form-select"
                            value={draft.clientId || ''}
                            onChange={(e) => handleUpdateDraft(idx, { clientId: e.target.value || undefined })}
                          >
                            <option value="">Nenhum cliente vinculado</option>
                            {clients.map((c) => (
                              <option key={c.id} value={c.id}>{c.companyName}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                            Projeto
                          </label>
                          <select
                            className="form-select"
                            value={draft.projectId || ''}
                            onChange={(e) => {
                              const projId = e.target.value || undefined;
                              const pName = projects.find((p) => p.id === projId)?.name;
                              handleUpdateDraft(idx, { projectId: projId, projectName: pName });
                            }}
                          >
                            <option value="">Nenhum projeto vinculado</option>
                            {projects
                              .filter((p) => !draft.clientId || p.clientId === draft.clientId)
                              .map((p) => (
                                <option key={p.id} value={p.id}>{p.name} ({p.clientName})</option>
                              ))}
                          </select>
                        </div>
                      </div>

                      {/* Responsável, Prioridade e Prazo */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                            Responsável
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={draft.responsible}
                            onChange={(e) => handleUpdateDraft(idx, { responsible: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                            Prioridade
                          </label>
                          <select
                            className="form-select"
                            value={draft.priority}
                            onChange={(e) => handleUpdateDraft(idx, { priority: e.target.value as TaskPriority })}
                          >
                            <option value="Baixa">Baixa</option>
                            <option value="Média">Média</option>
                            <option value="Alta">Alta</option>
                            <option value="Urgente">Urgente</option>
                          </select>
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                            Prazo (Opcional)
                          </label>
                          <input
                            type="date"
                            className="form-input"
                            value={draft.dueDate}
                            onChange={(e) => handleUpdateDraft(idx, { dueDate: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Checklist */}
                      <div>
                        <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '6px' }}>
                          Checklist {draft.checklist.length > 0 && `(${draft.checklist.length})`}
                        </label>
                        {draft.checklist.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                            {draft.checklist.map((item, itemIdx) => (
                              <div
                                key={itemIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '4px 8px',
                                  background: 'var(--cream-subtle)',
                                  borderRadius: '6px'
                                }}
                              >
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>•</span>
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => {
                                    const newItems = [...draft.checklist];
                                    newItems[itemIdx] = e.target.value;
                                    handleUpdateDraft(idx, { checklist: newItems });
                                  }}
                                  style={{
                                    flex: 1,
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: '0.84rem',
                                    color: 'var(--text-primary)',
                                    outline: 'none'
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDraftChecklistItem(idx, itemIdx)}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    borderRadius: '4px'
                                  }}
                                  title="Remover item"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Input rápido para novo item no checklist */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            placeholder="+ Novo item para o checklist..."
                            className="form-input"
                            value={newChecklistInputs[draft.tempId] || ''}
                            onChange={(e) =>
                              setNewChecklistInputs({ ...newChecklistInputs, [draft.tempId]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddDraftChecklistItem(idx);
                              }
                            }}
                            style={{ fontSize: '0.84rem', padding: '6px 10px' }}
                          />
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleAddDraftChecklistItem(idx)}
                            disabled={!(newChecklistInputs[draft.tempId] || '').trim()}
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>

                      {/* Descrição adicional */}
                      <div>
                        <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                          Descrição / Observações adicionais
                        </label>
                        <textarea
                          className="form-textarea"
                          rows={2}
                          value={draft.description}
                          onChange={(e) => handleUpdateDraft(idx, { description: e.target.value })}
                          placeholder="Instruções ou notas complementares..."
                          style={{ fontSize: '0.84rem', resize: 'vertical' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Barra de ações inferior */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setPromptStep('input')}
                    disabled={isSavingDrafts}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ArrowLeft size={14} /> Voltar ao comando
                  </button>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIsModalOpen(false)}
                      disabled={isSavingDrafts}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSaveAllDrafts}
                      disabled={isSavingDrafts || parsedDrafts.length === 0}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      {isSavingDrafts ? (
                        <>
                          <span className="spinner-sm" />
                          Criando tarefas...
                        </>
                      ) : parsedDrafts.length === 1 ? (
                        'Criar tarefa'
                      ) : (
                        `Criar todas as tarefas (${parsedDrafts.length})`
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 3: CONFIRMAÇÃO DE SUCESSO */}
            {promptStep === 'success' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: '24px 12px 12px',
                  gap: '16px'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--status-active-bg)',
                    border: '1px solid var(--status-active-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--status-active-text)'
                  }}
                >
                  <CheckCircle2 size={36} />
                </div>

                <div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
                    {createdCount} {createdCount === 1 ? 'tarefa criada' : 'tarefas criadas'} com sucesso.
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
                    As tarefas já foram salvas e estão sincronizadas no Kanban, Lista e Agenda.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setCommandText('');
                      setParsedDrafts([]);
                      setPromptStep('input');
                    }}
                  >
                    Criar mais
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Ver tarefas
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
