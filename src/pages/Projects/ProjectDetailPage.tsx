import React, { useState } from 'react';
import { Project, ProjectStage, ProjectStatus } from '../../types';
import { db } from '../../services/db';
import { Badge } from '../../components/Common/Badge';
import { useToast } from '../../components/Common/Toast';
import {
  ArrowLeft,
  Calendar,
  User,
  Building2,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  FileText,
  Clock,
  Sparkles
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
  const handleToggleStage = (stageId: string) => {
    const updatedStages = currentProject.stages.map((stg) =>
      stg.id === stageId ? { ...stg, completed: !stg.completed } : stg
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
  const handleStatusChange = (newStatus: ProjectStatus) => {
    const updatedProj: Project = {
      ...currentProject,
      status: newStatus
    };
    setCurrentProject(updatedProj);
    db.saveProject(updatedProj);
    onUpdate(updatedProj);
    showToast(`Status alterado para "${newStatus}"`, 'success');
  };

  // Save notes
  const handleSaveNotes = () => {
    const updatedProj: Project = {
      ...currentProject,
      notes
    };
    setCurrentProject(updatedProj);
    db.saveProject(updatedProj);
    onUpdate(updatedProj);
    showToast('Observações salvas com sucesso!', 'success');
  };

  return (
    <div>
      {/* Top back button */}
      <button
        className="btn btn-secondary btn-sm"
        onClick={onBack}
        style={{ marginBottom: '20px', gap: '6px' }}
      >
        <ArrowLeft size={16} /> Voltar para lista de projetos
      </button>

      {/* Main Project Header Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            marginBottom: '20px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Badge status={currentProject.service} type="service" />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--sand-gold-dark)' }}>
                {currentProject.clientName}
              </span>
            </div>
            <h1 className="font-serif" style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--green-deep)' }}>
              {currentProject.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px', maxWidth: '720px' }}>
              {currentProject.description}
            </p>
          </div>

          {/* Quick status selector */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
              Status Atual
            </span>
            <select
              className="form-select"
              value={currentProject.status}
              onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
              style={{ fontWeight: 600, minWidth: '170px' }}
            >
              <option value="Planejamento">Planejamento</option>
              <option value="Em produção">Em produção</option>
              <option value="Aguardando cliente">Aguardando cliente</option>
              <option value="Revisão">Revisão</option>
              <option value="Finalizado">Finalizado</option>
            </select>
          </div>
        </div>

        {/* Progress Bar with Percentage */}
        <div style={{ padding: '16px', background: 'var(--cream-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--green-deep)' }}>
              Progresso Geral das Etapas
            </span>
            <span style={{ fontWeight: 800, color: 'var(--green-primary)' }}>
              {currentProject.progress}% Concluído
            </span>
          </div>
          <div className="progress-bar-container" style={{ height: '10px' }}>
            <div className="progress-bar-fill" style={{ width: `${currentProject.progress}%` }} />
          </div>
        </div>

        {/* Metadata columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--cream-border-subtle)',
            fontSize: '0.86rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <User size={16} color="var(--green-primary)" />
            <span>Resp.: <strong>{currentProject.responsible}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <Calendar size={16} color="var(--green-primary)" />
            <span>Início: <strong>{new Date(currentProject.startDate).toLocaleDateString('pt-BR')}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <Clock size={16} color="var(--green-primary)" />
            <span>Prazo: <strong>{new Date(currentProject.dueDate).toLocaleDateString('pt-BR')}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <Building2 size={16} color="var(--green-primary)" />
            <span>Cliente: <strong>{currentProject.clientName}</strong></span>
          </div>
        </div>
      </div>

      {/* Two Columns: Checklist de Etapas & Observações/Materiais */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Checklist de Etapas */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title font-serif" style={{ fontSize: '1.3rem' }}>
                Checklist de Etapas
              </h3>
              <p className="card-subtitle">
                Marque cada marco conforme a execução avança
              </p>
            </div>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                background: 'var(--green-tint)',
                color: 'var(--green-primary)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)'
              }}
            >
              {currentProject.stages.filter((s) => s.completed).length} / {currentProject.stages.length}
            </span>
          </div>

          {/* List of Stages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {currentProject.stages.map((stage) => (
              <div
                key={stage.id}
                onClick={() => handleToggleStage(stage.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: stage.completed ? '1px solid var(--status-active-border)' : '1px solid var(--cream-border)',
                  background: stage.completed ? 'var(--status-active-bg)' : 'var(--cream-subtle)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {stage.completed ? (
                    <CheckSquare size={19} color="var(--status-active-text)" />
                  ) : (
                    <Square size={19} color="var(--text-muted)" />
                  )}
                  <span
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: stage.completed ? 600 : 500,
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
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Form Add Stage */}
          <form onSubmit={handleAddStage} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Adicionar nova etapa (ex: Gravação de takes)..."
              value={newStageTitle}
              onChange={(e) => setNewStageTitle(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 16px' }}>
              <Plus size={16} /> Adicionar
            </button>
          </form>
        </div>

        {/* Right Column: Observações & Materiais Relacionados */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Internal Notes */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title font-serif" style={{ fontSize: '1.25rem' }}>
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
              style={{ marginBottom: '12px' }}
            />

            <button className="btn btn-secondary btn-sm" onClick={handleSaveNotes}>
              Salvar Observações
            </button>
          </div>

          {/* Related Materials */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title font-serif" style={{ fontSize: '1.25rem' }}>
                  Materiais Relacionados
                </h3>
                <p className="card-subtitle">Documentos aplicados a este serviço</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentProject.relatedMaterials && currentProject.relatedMaterials.length > 0 ? (
                currentProject.relatedMaterials.map((matTitle, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--cream-subtle)',
                      border: '1px solid var(--cream-border)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <FileText size={16} color="var(--green-primary)" />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {matTitle}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
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
