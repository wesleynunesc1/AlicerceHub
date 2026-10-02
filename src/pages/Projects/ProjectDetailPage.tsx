import React, { useState, useEffect } from 'react';
import { Project, ProjectStage, ProjectStatus, Task, Material, ApprovalItem, InternalComment, ActivityItem } from '../../types';
import { db } from '../../services/db';
import { projectsService } from '../../services/projects';
import { phase2Service } from '../../services/phase2';
import { materialsService } from '../../services/materials';
import { dashboardService } from '../../services/dashboard';
import { Badge } from '../../components/Common/Badge';
import { useToast } from '../../components/Common/Toast';
import {
  Calendar,
  User,
  Building2,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  FileText,
  Clock,
  ChevronRight,
  Save,
  MessageSquare,
  Send,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ProjectDetailPageProps {
  project: Project;
  onBack: () => void;
  onUpdate: (updated: Project) => void;
  onNavigateToTask?: (taskId: string) => void;
  onNavigateToMaterial?: (materialId: string) => void;
}

type TabType = 'overview' | 'stages' | 'tasks' | 'materials' | 'approvals' | 'comments' | 'history';

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  project,
  onBack,
  onUpdate,
  onNavigateToTask,
  onNavigateToMaterial
}) => {
  const { showToast } = useToast();
  const [currentProject, setCurrentProject] = useState<Project>(project);
  const [activeTab, setActiveTab] = useState<TabType>('stages');
  const [newStageTitle, setNewStageTitle] = useState('');
  const [notes, setNotes] = useState(project.notes || '');

  // Sub-entidades
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [projectMaterials, setProjectMaterials] = useState<Material[]>([]);
  const [projectApprovals, setProjectApprovals] = useState<ApprovalItem[]>([]);
  const [comments, setComments] = useState<InternalComment[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  const loadProjectRelations = async () => {
    try {
      const [tasks, mats, apprs, acts] = await Promise.all([
        phase2Service.getTasks(),
        materialsService.getMaterials(),
        phase2Service.getApprovals(),
        dashboardService.getRecentActivities()
      ]);

      setProjectTasks((tasks || []).filter((t) => t.projectId === currentProject.id));
      setProjectMaterials((mats || []).filter((m) => m.projectId === currentProject.id));
      setProjectApprovals((apprs || []).filter((a) => a.projectId === currentProject.id));
      setComments(phase2Service.getComments('project', currentProject.id));
      setActivities((acts || []).filter((a) => a.entity_id === currentProject.id || a.description?.toLowerCase().includes(currentProject.name.toLowerCase())));
    } catch (e) {
      console.warn('Erro ao carregar dados do projeto:', e);
    }
  };

  useEffect(() => {
    loadProjectRelations();
  }, [currentProject.id]);

  // Toggle stage completion com recálculo automático de progresso
  const handleToggleStage = async (stageId: string) => {
    const stage = currentProject.stages.find((s) => s.id === stageId);
    const newCompleted = stage ? !stage.completed : false;

    const updatedStages = currentProject.stages.map((stg) =>
      stg.id === stageId ? { ...stg, completed: newCompleted } : stg
    );
    const completedCount = updatedStages.filter((s) => s.completed).length;
    const progress = Math.round((completedCount / updatedStages.length) * 100);

    const updatedProj: Project = {
      ...currentProject,
      stages: updatedStages,
      progress
    };

    setCurrentProject(updatedProj);
    db.saveProject(updatedProj);
    onUpdate(updatedProj);
    showToast('Etapa atualizada!', 'info');

    // Persiste no Supabase e registra log de atividade
    await projectsService.toggleStep(currentProject.id, stageId, newCompleted);
    await dashboardService.logActivity(
      'Etapa Concluída',
      'project',
      currentProject.id,
      `Etapa "${stage?.title}" do projeto "${currentProject.name}" marcada como ${newCompleted ? 'concluída' : 'pendente'}. Progresso: ${progress}%.`
    );
  };

  // Add new stage
  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageTitle.trim()) return;

    const newStage: ProjectStage = {
      id: 'stg-' + Date.now(),
      title: newStageTitle.trim(),
      completed: false
    };

    const updatedStages = [...currentProject.stages, newStage];
    const completedCount = updatedStages.filter((s) => s.completed).length;
    const progress = Math.round((completedCount / updatedStages.length) * 100);

    const updatedProj: Project = {
      ...currentProject,
      stages: updatedStages,
      progress
    };

    setCurrentProject(updatedProj);
    db.saveProject(updatedProj);
    onUpdate(updatedProj);
    setNewStageTitle('');
    showToast('Nova etapa adicionada ao checklist!', 'success');
  };

  // Delete stage
  const handleDeleteStage = (stageId: string) => {
    const updatedStages = currentProject.stages.filter((s) => s.id !== stageId);
    const completedCount = updatedStages.filter((s) => s.completed).length;
    const progress =
      updatedStages.length > 0
        ? Math.round((completedCount / updatedStages.length) * 100)
        : 0;

    const updatedProj: Project = {
      ...currentProject,
      stages: updatedStages,
      progress
    };

    setCurrentProject(updatedProj);
    db.saveProject(updatedProj);
    onUpdate(updatedProj);
    showToast('Etapa removida.', 'info');
  };

  // Change project status
  const handleStatusChange = async (newStatus: ProjectStatus) => {
    const updatedProj: Project = {
      ...currentProject,
      status: newStatus
    };
    setCurrentProject(updatedProj);
    db.saveProject(updatedProj);
    onUpdate(updatedProj);
    showToast(`Status atualizado para "${newStatus}".`, 'success');

    await projectsService.updateProject(currentProject.id, { status: newStatus });
    await dashboardService.logActivity(
      'Status do Projeto Alterado',
      'project',
      currentProject.id,
      `Projeto "${currentProject.name}" alterado para "${newStatus}".`
    );
  };

  // Add Comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const added = phase2Service.addComment({
      entityType: 'project',
      entityId: currentProject.id,
      userName: 'Wesley Nunes',
      content: newCommentText
    });

    setComments([added, ...comments]);
    setNewCommentText('');
    showToast('Comentário registrado no projeto.', 'success');
  };

  // Save notes
  const handleSaveNotes = async () => {
    const updatedProj: Project = {
      ...currentProject,
      notes
    };
    setCurrentProject(updatedProj);
    db.saveProject(updatedProj);
    onUpdate(updatedProj);
    showToast('Observações salvas com sucesso!', 'success');

    await projectsService.updateProject(currentProject.id, { description: notes });
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Breadcrumb Navigation com preservação de contexto */}
      <div className="breadcrumb-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 550 }}
        >
          Projetos
        </button>
        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        <span style={{ color: 'var(--sand-gold-dark)', fontWeight: 600 }}>
          {currentProject.clientName}
        </span>
        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        <span style={{ color: 'var(--green-deep)', fontWeight: 700 }}>
          {currentProject.name}
        </span>
      </div>

      {/* Main Project Header Card */}
      <div className="card" style={{ padding: '32px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '20px',
            marginBottom: '24px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Badge status={currentProject.service} type="service" />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 650, color: 'var(--sand-gold-dark)' }}>
                {currentProject.clientName}
              </span>
            </div>

            <h1 className="font-serif" style={{ fontSize: '2.3rem', fontWeight: 700, color: 'var(--green-deep)' }}>
              {currentProject.name}
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', marginTop: '8px', maxWidth: '750px', lineHeight: 1.55, fontWeight: 450 }}>
              {currentProject.description}
            </p>
          </div>

          {/* Quick status selector */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <span style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 650 }}>
              Status da Operação
            </span>
            <select
              className="form-select"
              value={currentProject.status}
              onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
              style={{ fontWeight: 650, minWidth: '180px', height: '42px' }}
            >
              <option value="Planejamento">Planejamento</option>
              <option value="Em produção">Em produção</option>
              <option value="Aguardando cliente">Aguardando cliente</option>
              <option value="Revisão">Revisão</option>
              <option value="Finalizado">Finalizado</option>
            </select>
          </div>
        </div>

        {/* Progress Bar com Cálculo Automático */}
        <div style={{ padding: '18px 22px', background: 'var(--cream-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.88rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--green-deep)' }}>
              Progresso Calculado das Etapas
            </span>
            <span style={{ fontWeight: 800, color: 'var(--green-primary)' }}>
              {currentProject.progress}% Concluído ({currentProject.stages.filter((s) => s.completed).length}/{currentProject.stages.length} marcos)
            </span>
          </div>
          <div className="progress-bar-container" style={{ height: '9px' }}>
            <div className="progress-bar-fill" style={{ width: `${currentProject.progress}%` }} />
          </div>
        </div>

        {/* Informações Rápidas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid var(--cream-border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={18} color="var(--sand-gold-dark)" />
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Responsável</span>
              <div style={{ fontSize: '0.9rem', fontWeight: 650, color: 'var(--text-primary)' }}>{currentProject.responsible}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={18} color="var(--sand-gold-dark)" />
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Início</span>
              <div style={{ fontSize: '0.9rem', fontWeight: 650, color: 'var(--text-primary)' }}>
                {new Date(currentProject.startDate).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={18} color="var(--sand-gold-dark)" />
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Prazo Final</span>
              <div style={{ fontSize: '0.9rem', fontWeight: 650, color: 'var(--text-primary)' }}>
                {new Date(currentProject.dueDate).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Abas Solicitadas no Prompt */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          borderBottom: '1px solid var(--cream-border)',
          overflowX: 'auto',
          paddingBottom: '2px'
        }}
      >
        {[
          { id: 'stages', label: `Etapas (${currentProject.stages.length})` },
          { id: 'tasks', label: `Tarefas (${projectTasks.length})` },
          { id: 'materials', label: `Materiais (${projectMaterials.length})` },
          { id: 'approvals', label: `Aprovações (${projectApprovals.length})` },
          { id: 'comments', label: `Comentários (${comments.length})` },
          { id: 'history', label: 'Histórico' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            style={{
              padding: '8px 14px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--green-deep)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--green-deep)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '0.88rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. ABA: ETAPAS */}
      {activeTab === 'stages' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 className="card-title font-serif" style={{ fontSize: '1.25rem', marginBottom: '16px' }}>
              Checklist Operacional do Projeto
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentProject.stages.map((stage) => (
                <div
                  key={stage.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: stage.completed ? 'rgba(34, 197, 94, 0.05)' : 'var(--cream-subtle)',
                    border: stage.completed ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid var(--cream-border-subtle)',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleToggleStage(stage.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {stage.completed ? (
                      <CheckSquare size={20} color="#15803D" />
                    ) : (
                      <Square size={20} color="var(--text-muted)" />
                    )}
                    <span
                      style={{
                        fontSize: '0.94rem',
                        fontWeight: stage.completed ? 600 : 500,
                        color: stage.completed ? '#15803D' : 'var(--text-primary)',
                        textDecoration: stage.completed ? 'line-through' : 'none'
                      }}
                    >
                      {stage.title}
                    </span>
                  </div>

                  <button
                    className="sidebar-collapse-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStage(stage.id);
                    }}
                    style={{ color: '#DC2626' }}
                    title="Excluir etapa"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Adicionar nova etapa */}
            <form onSubmit={handleAddStage} style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Adicionar nova etapa personalizada ao projeto..."
                value={newStageTitle}
                onChange={(e) => setNewStageTitle(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary" style={{ whiteSpace: 'nowrap', gap: '6px' }}>
                <Plus size={16} /> Adicionar Etapa
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. ABA: TAREFAS */}
      {activeTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 650, color: 'var(--green-deep)' }}>
              Tarefas do Projeto
            </span>
          </div>

          {projectTasks.length === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
              <CheckSquare size={28} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                Nenhuma tarefa vinculada diretamente a este projeto.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {projectTasks.map((t) => (
                <div
                  key={t.id}
                  className="card"
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => onNavigateToTask && onNavigateToTask(t.id)}
                >
                  <div>
                    <div style={{ fontWeight: 650, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                      {t.title}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Responsável: {t.responsible} • Prazo: {new Date(t.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <Badge status={t.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. ABA: MATERIAIS */}
      {activeTab === 'materials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {projectMaterials.length === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
              <FileText size={28} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                Nenhum material anexado a este projeto.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {projectMaterials.map((m) => (
                <div key={m.id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{m.name}</div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{m.category}</span>
                  {m.externalUrl && (
                    <a
                      href={m.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ alignSelf: 'flex-start', marginTop: '6px', fontSize: '0.76rem' }}
                    >
                      <ExternalLink size={12} /> Acessar Link
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. ABA: APROVAÇÕES */}
      {activeTab === 'approvals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {projectApprovals.length === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                Nenhum item em fluxo de aprovação para este projeto.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {projectApprovals.map((a) => (
                <div key={a.id} className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 650, fontSize: '0.94rem', color: 'var(--text-primary)' }}>{a.title}</div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tipo: {a.type}</span>
                  </div>
                  <Badge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. ABA: COMENTÁRIOS */}
      {activeTab === 'comments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <form onSubmit={handleAddComment} className="card" style={{ padding: '16px' }}>
            <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 650 }}>
              Adicionar Alinhamento Interno sobre o Projeto
            </label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Escreva um comentário ou atualização para a equipe..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap', gap: '6px' }}>
                <Send size={14} /> Comentar
              </button>
            </div>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {comments.map((c) => (
              <div key={c.id} className="card" style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  <strong>{c.userName}</strong>
                  <span>{new Date(c.createdAt).toLocaleString('pt-BR')}</span>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  {c.content}
                </p>
              </div>
            ))}
            {comments.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', textAlign: 'center', margin: '20px 0' }}>
                Nenhum comentário registrado ainda.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 6. ABA: HISTÓRICO */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activities.length === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                Nenhuma atividade recente registrada neste projeto.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activities.map((a) => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '10px', borderBottom: '1px solid var(--cream-border-subtle)' }}>
                    <div>
                      <div style={{ fontWeight: 650, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{a.title}</div>
                      <p style={{ color: 'var(--text-secondary)', margin: '2px 0 0', fontSize: '0.82rem' }}>{a.description}</p>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{a.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
