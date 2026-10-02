import React, { useState } from 'react';
import { Project, ProjectStage, ProjectStatus } from '../../types';
import { db } from '../../services/db';
import { projectsService } from '../../services/projects';
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
  Save
} from 'lucide-react';

interface ProjectDetailPageProps {
  project: Project;
  onBack: () => void;
  onUpdate: (updated: Project) => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  project,
  onBack,
  onUpdate
}) => {
  const { showToast } = useToast();
  const [currentProject, setCurrentProject] = useState<Project>(project);
  const [newStageTitle, setNewStageTitle] = useState('');
  const [notes, setNotes] = useState(project.notes || '');

  // Toggle stage completion
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

    // Persiste no Supabase
    await projectsService.toggleStep(currentProject.id, stageId, newCompleted);
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
    showToast(`Status alterado para "${newStatus}"`, 'success');

    // Persiste no Supabase
    await projectsService.updateProject(currentProject.id, { status: newStatus });
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

    // Persiste no Supabase
    await projectsService.updateProject(currentProject.id, { description: notes });
  };

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb-container">
        <span className="breadcrumb-link" onClick={onBack}>
          Projetos
        </span>
        <ChevronRight size={14} />
        <span className="breadcrumb-link" onClick={onBack}>
          {currentProject.clientName}
        </span>
        <ChevronRight size={14} />
        <span className="breadcrumb-current">{currentProject.name}</span>
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
              Status da Entrega
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

        {/* Progress Bar with Subtle Styling */}
        <div style={{ padding: '18px 22px', background: 'var(--cream-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.88rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--green-deep)' }}>
              Progresso Geral das Etapas
            </span>
            <span style={{ fontWeight: 800, color: 'var(--green-primary)' }}>
              {currentProject.progress}% Concluído ({currentProject.stages.filter(s => s.completed).length}/{currentProject.stages.length} marcos)
            </span>
          </div>
          <div className="progress-bar-container" style={{ height: '9px' }}>
            <div className="progress-bar-fill" style={{ width: `${currentProject.progress}%` }} />
          </div>
        </div>

        {/* Metadata columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '18px',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid var(--cream-border-subtle)',
            fontSize: '0.9rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
            <User size={17} color="var(--green-primary)" />
            <span>Responsável: <strong style={{ color: 'var(--text-primary)' }}>{currentProject.responsible}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
            <Calendar size={17} color="var(--green-primary)" />
            <span>Início: <strong style={{ color: 'var(--text-primary)' }}>{new Date(currentProject.startDate).toLocaleDateString('pt-BR')}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
            <Clock size={17} color="var(--green-primary)" />
            <span>Prazo: <strong style={{ color: 'var(--text-primary)' }}>{new Date(currentProject.dueDate).toLocaleDateString('pt-BR')}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
            <Building2 size={17} color="var(--green-primary)" />
            <span>Cliente: <strong style={{ color: 'var(--text-primary)' }}>{currentProject.clientName}</strong></span>
          </div>
        </div>
      </div>

      {/* Two Columns: Checklist de Etapas & Observações/Materiais */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '28px',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Checklist de Etapas */}
        <div className="card" style={{ padding: '28px' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title font-serif" style={{ fontSize: '1.4rem' }}>
                Checklist de Etapas
              </h3>
              <p className="card-subtitle">
                Marque cada marco conforme a execução avança
              </p>
            </div>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                background: 'var(--green-tint)',
                color: 'var(--green-primary)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)'
              }}
            >
              {currentProject.stages.filter((s) => s.completed).length} / {currentProject.stages.length}
            </span>
          </div>

          {/* List of Stages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
            {currentProject.stages.map((stage) => (
              <div
                key={stage.id}
                onClick={() => handleToggleStage(stage.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '13px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: stage.completed ? '1px solid var(--status-active-border)' : '1px solid var(--cream-border)',
                  background: stage.completed ? 'var(--status-active-bg)' : 'var(--cream-subtle)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {stage.completed ? (
                    <CheckSquare size={20} color="var(--status-active-text)" />
                  ) : (
                    <Square size={20} color="var(--text-muted)" />
                  )}
                  <span
                    style={{
                      fontSize: '0.94rem',
                      fontWeight: stage.completed ? 650 : 500,
                      color: stage.completed ? 'var(--status-active-text)' : 'var(--text-primary)',
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
                  style={{ color: 'var(--text-muted)' }}
                  title="Remover etapa"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Form Add Stage */}
          <form onSubmit={handleAddStage} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Adicionar nova etapa (ex: Gravação de takes)..."
              value={newStageTitle}
              onChange={(e) => setNewStageTitle(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 18px', height: '46px' }}>
              <Plus size={16} /> Adicionar
            </button>
          </form>
        </div>

        {/* Right Column: Observações & Materiais Relacionados */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Internal Notes */}
          <div className="card" style={{ padding: '28px' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title font-serif" style={{ fontSize: '1.35rem' }}>
                  Observações Internas
                </h3>
                <p className="card-subtitle">
                  Diretrizes de produção e detalhes estratégicos
                </p>
              </div>
            </div>

            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Adicione notas, links de pastas de drive, feedbacks de reuniões..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ marginBottom: '14px' }}
            />

            <button className="btn btn-secondary btn-sm" onClick={handleSaveNotes} style={{ gap: '6px' }}>
              <Save size={15} /> Salvar Observações
            </button>
          </div>

          {/* Related Materials */}
          <div className="card" style={{ padding: '28px' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title font-serif" style={{ fontSize: '1.35rem' }}>
                  Materiais Vinculados
                </h3>
                <p className="card-subtitle">Documentos aplicados a este serviço</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentProject.relatedMaterials && currentProject.relatedMaterials.length > 0 ? (
                currentProject.relatedMaterials.map((matTitle, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--cream-subtle)',
                      border: '1px solid var(--cream-border)',
                      fontSize: '0.88rem'
                    }}
                  >
                    <FileText size={17} color="var(--green-primary)" />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {matTitle}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', padding: '8px 0' }}>
                  Nenhum material vinculado diretamente.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
