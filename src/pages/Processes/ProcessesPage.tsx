import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ArrowRight,
  CheckCircle2,
  ListOrdered,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  User,
  Calendar,
  Layers,
  CheckSquare,
  Square
} from 'lucide-react';
import { db } from '../../services/db';
import { processesService } from '../../services/processes';
import { SOPProcess, ProcessCategory, ProcessStep, ServiceType } from '../../types';
import { Modal } from '../../components/Common/Modal';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';
import { useToast } from '../../components/Common/Toast';
import { Badge } from '../../components/Common/Badge';

const CATEGORIES: ('Todas' | ProcessCategory)[] = [
  'Todas',
  'Aquisição',
  'Presença Digital',
  'Conteúdo',
  'Marca',
  'Estratégia'
];

interface ProcessesPageProps {
  selectedProcessId?: string;
  onClearSelectedProcess?: () => void;
}

export const ProcessesPage: React.FC<ProcessesPageProps> = ({
  selectedProcessId,
  onClearSelectedProcess
}) => {
  const { showToast } = useToast();
  const [processes, setProcesses] = useState<SOPProcess[]>([]);
  const [activeCategory, setActiveCategory] = useState<'Todas' | ProcessCategory>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingProcess, setViewingProcess] = useState<SOPProcess | null>(null);

  // Completed checklist items in SOP viewer state
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Edit / Create modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<SOPProcess | null>(null);
  const [processToDelete, setProcessToDelete] = useState<SOPProcess | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    service: 'Meta Ads' as ServiceType,
    category: 'Aquisição' as ProcessCategory,
    description: '',
    responsible: 'Wesley Nunes',
    steps: [] as ProcessStep[]
  });

  const loadProcesses = async () => {
    try {
      const remoteProcesses = await processesService.getProcesses();
      setProcesses(remoteProcesses || []);
      if (selectedProcessId && remoteProcesses) {
        const found = remoteProcesses.find((p) => p.id === selectedProcessId);
        if (found) setViewingProcess(found);
      }
    } catch {
      setProcesses([]);
    }
  };

  useEffect(() => {
    loadProcesses();
  }, [selectedProcessId]);

  const handleOpenCreate = () => {
    setEditingProcess(null);
    setFormData({
      title: '',
      service: 'Meta Ads',
      category: 'Aquisição',
      description: '',
      responsible: 'Wesley Nunes',
      steps: [
        {
          stepNumber: '01',
          title: 'Briefing e Alinhamento Inicial',
          description: 'Levantamento de objetivos, histórico e expectativas.',
          checklist: ['Realizar reunião de alinhamento', 'Documentar diretrizes acordadas']
        },
        {
          stepNumber: '02',
          title: 'Execução e Aplicação do Método',
          description: 'Desenvolvimento do entregável seguindo os padrões Alicerce.',
          checklist: ['Produzir materiais', 'Revisar checklist interno']
        },
        {
          stepNumber: '03',
          title: 'Aprovação e Entrega',
          description: 'Apresentação formal ao cliente e orientações de próximos passos.',
          checklist: ['Enviar para validação', 'Registrar aprovação final']
        }
      ]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (proc: SOPProcess, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProcess(proc);
    setFormData({
      title: proc.title,
      service: proc.service,
      category: proc.category,
      description: proc.description,
      responsible: proc.responsible,
      steps: proc.steps
    });
    setIsModalOpen(true);
  };

  const handleSaveProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      showToast('Preencha os campos obrigatórios.', 'error');
      return;
    }

    const payload = {
      title: formData.title,
      service: formData.service,
      category: formData.category,
      description: formData.description,
      responsible: formData.responsible,
      steps: formData.steps,
    };

    if (editingProcess) {
      await processesService.updateProcess(editingProcess.id, payload);
      db.saveProcess({
        ...editingProcess,
        ...payload,
        updatedAt: new Date().toISOString().split('T')[0],
      });
      showToast('Processo atualizado com sucesso!', 'success');
    } else {
      const created = await processesService.createProcess(payload);
      if (created) {
        db.saveProcess(created);
      } else {
        const localProc: SOPProcess = {
          id: 'proc-' + Date.now(),
          ...payload,
          updatedAt: new Date().toISOString().split('T')[0],
        };
        db.saveProcess(localProc);
      }
      showToast('Processo SOP criado com sucesso!', 'success');
    }

    await loadProcesses();
    setIsModalOpen(false);
  };

  const handleDeleteProcess = async () => {
    if (!processToDelete) return;
    await processesService.deleteProcess(processToDelete.id);
    db.deleteProcess(processToDelete.id);
    await loadProcesses();
    if (viewingProcess?.id === processToDelete.id) {
      setViewingProcess(null);
    }
    showToast('Processo removido.', 'info');
    setProcessToDelete(null);
  };

  const handleToggleCheckItem = (key: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAddStepToForm = () => {
    const nextNum = (formData.steps.length + 1).toString().padStart(2, '0');
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        {
          stepNumber: nextNum,
          title: 'Nova Etapa Operacional',
          description: 'Descrição do procedimento desta fase.',
          checklist: ['Item de conferência 1']
        }
      ]
    });
  };

  const filteredProcesses = processes.filter((p) => {
    const matchesCategory = activeCategory === 'Todas' || p.category === activeCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // DETAIL VIEW OF SOP WITH VERTICAL STEPPER
  if (viewingProcess) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Breadcrumb Navigation */}
        <div className="breadcrumb-container">
          <span
            className="breadcrumb-link"
            onClick={() => {
              setViewingProcess(null);
              if (onClearSelectedProcess) onClearSelectedProcess();
            }}
          >
            Processos
          </span>
          <ChevronRight size={14} />
          <span
            className="breadcrumb-link"
            onClick={() => {
              setActiveCategory(viewingProcess.category);
              setViewingProcess(null);
            }}
          >
            {viewingProcess.category}
          </span>
          <ChevronRight size={14} />
          <span className="breadcrumb-current">{viewingProcess.service}</span>
        </div>

        {/* Process Master Header */}
        <div className="card" style={{ padding: '32px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '20px',
              marginBottom: '20px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--green-primary)',
                    background: 'var(--green-tint)',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  {viewingProcess.category}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>•</span>
                <Badge status={viewingProcess.service} type="service" />
              </div>

              <h1 className="font-serif" style={{ fontSize: '2.3rem', fontWeight: 700, color: 'var(--green-deep)' }}>
                {viewingProcess.title}
              </h1>

              <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', marginTop: '10px', maxWidth: '780px', lineHeight: 1.6, fontWeight: 450 }}>
                {viewingProcess.description}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => handleOpenEdit(viewingProcess)}
                style={{ gap: '6px' }}
              >
                <Edit2 size={16} /> Editar SOP
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '24px',
              paddingTop: '20px',
              borderTop: '1px solid var(--cream-border-subtle)',
              fontSize: '0.88rem',
              color: 'var(--text-muted)',
              fontWeight: 500
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} color="var(--green-primary)" />
              <span>Responsável: <strong style={{ color: 'var(--text-primary)' }}>{viewingProcess.responsible}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} color="var(--green-primary)" />
              <span>Atualizado: <strong style={{ color: 'var(--text-primary)' }}>{new Date(viewingProcess.updatedAt).toLocaleDateString('pt-BR')}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="var(--green-primary)" />
              <span>Etapas: <strong style={{ color: 'var(--green-primary)' }}>{viewingProcess.steps.length} passos estruturados</strong></span>
            </div>
          </div>
        </div>

        {/* Vertical Stepper Process View */}
        <div className="stepper-container" style={{ padding: '8px 0' }}>
          {viewingProcess.steps.map((step, idx) => (
            <div key={idx} className="stepper-item">
              <div className="stepper-line" />
              <div className="stepper-node">{step.stepNumber}</div>

              <div className="stepper-content">
                <div className="card" style={{ padding: '26px 28px' }}>
                  <h3
                    className="font-serif"
                    style={{ fontSize: '1.45rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '8px' }}
                  >
                    {step.stepNumber} — {step.title}
                  </h3>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', marginBottom: '18px', lineHeight: 1.6, fontWeight: 450 }}>
                    {step.description}
                  </p>

                  {/* Checklist with Interactive Completion */}
                  {step.checklist && step.checklist.length > 0 && (
                    <div
                      style={{
                        background: 'var(--cream-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '18px 20px',
                        border: '1px solid var(--cream-border)'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.07em',
                          color: 'var(--sand-gold-dark)',
                          marginBottom: '12px'
                        }}
                      >
                        Checklist Operacional
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {step.checklist.map((item, itemIdx) => {
                          const itemKey = `${viewingProcess.id}-${idx}-${itemIdx}`;
                          const isDone = Boolean(checkedItems[itemKey]);
                          return (
                            <div
                              key={itemIdx}
                              onClick={() => handleToggleCheckItem(itemKey)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                fontSize: '0.92rem',
                                color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                                textDecoration: isDone ? 'line-through' : 'none',
                                cursor: 'pointer',
                                userSelect: 'none',
                                transition: 'all var(--transition-fast)'
                              }}
                            >
                              {isDone ? (
                                <CheckSquare size={18} color="var(--status-active-text)" style={{ flexShrink: 0 }} />
                              ) : (
                                <Square size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                              )}
                              <span style={{ fontWeight: isDone ? 450 : 500 }}>{item}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // PROCESS LIBRARY VIEW
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header */}
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
            Processos
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', fontWeight: 450 }}>
            A maneira Alicerce de executar cada serviço. Biblioteca de procedimentos padronizados (SOPs).
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '8px' }}>
          <Plus size={18} /> Novo Processo SOP
        </button>
      </div>

      {/* Categories Tabs & Search */}
      <div
        className="card"
        style={{
          padding: '18px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '9px 18px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.86rem',
                fontWeight: activeCategory === cat ? 700 : 500,
                background: activeCategory === cat ? 'var(--green-primary)' : 'var(--cream-subtle)',
                color: activeCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: activeCategory === cat ? 'var(--green-primary)' : 'var(--cream-border)',
                transition: 'all var(--transition-fast)',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
          <Search
            size={18}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '42px', borderRadius: 'var(--radius-full)' }}
            placeholder="Pesquisar por SOP, serviço ou metodologia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of SOPs or Empty State */}
      {filteredProcesses.length === 0 ? (
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
            <GitMerge size={26} />
          </div>
          <h3 className="font-serif" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Nenhum processo cadastrado ainda.
          </h3>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', maxWidth: '440px', lineHeight: 1.5, marginBottom: '22px' }}>
            Crie os processos operacionais da Alicerce para padronizar a execução dos serviços.
          </p>
          <button
            className="btn btn-primary"
            onClick={handleOpenCreate}
            style={{ gap: '8px' }}
          >
            <Plus size={16} /> Criar processo
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}
        >
          {filteredProcesses.map((proc) => (
          <div
            key={proc.id}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
            onClick={() => setViewingProcess(proc)}
          >
            <div>
              <div className="card-header" style={{ marginBottom: '10px' }}>
                <span
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--sand-gold-dark)',
                    letterSpacing: '0.06em'
                  }}
                >
                  {proc.category}
                </span>
                <Badge status={proc.service} type="service" />
              </div>

              <h3 className="card-title font-serif" style={{ fontSize: '1.35rem', marginBottom: '8px' }}>
                {proc.title}
              </h3>

              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: '20px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  fontWeight: 450
                }}
              >
                {proc.description}
              </p>

              {/* Steps summary */}
              <div
                style={{
                  background: 'var(--cream-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '11px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.84rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 500
                }}
              >
                <ListOrdered size={16} color="var(--green-primary)" />
                <span>
                  Estruturado em <strong>{proc.steps.length} etapas padronizadas</strong>
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '16px',
                borderTop: '1px solid var(--cream-border-subtle)',
                marginTop: '18px'
              }}
            >
              <span
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 650,
                  color: 'var(--green-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                Abrir SOP <ArrowRight size={15} />
              </span>

              <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                <button
                  className="sidebar-collapse-btn"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={(e) => handleOpenEdit(proc, e)}
                  title="Editar processo"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  className="sidebar-collapse-btn"
                  style={{ color: '#dc2626' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setProcessToDelete(proc);
                  }}
                  title="Excluir processo"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Modal Criar / Editar Processo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProcess ? 'Editar Processo SOP' : 'Novo Processo SOP'}
        subtitle="Defina o título, serviço e as etapas do manual operacional"
        maxWidth="720px"
      >
        <form onSubmit={handleSaveProcess}>
          <div className="form-group">
            <label className="form-label">Título do Processo *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Meta Ads — Gestão de Tráfego de Alta Conversão"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Serviço Relacionado</label>
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

            <div className="form-group">
              <label className="form-label">Categoria</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ProcessCategory })}
              >
                <option value="Aquisição">Aquisição</option>
                <option value="Presença Digital">Presença Digital</option>
                <option value="Conteúdo">Conteúdo</option>
                <option value="Marca">Marca</option>
                <option value="Estratégia">Estratégia</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descrição Geral</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Explique o propósito deste SOP e como ele se encaixa na entrega da Alicerce..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          {/* Form Steps */}
          <div style={{ marginTop: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--sand-gold-dark)' }}>
                Etapas Operacionais ({formData.steps.length})
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddStepToForm}
                style={{ gap: '4px' }}
              >
                <Plus size={14} /> Adicionar Etapa
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '280px', overflowY: 'auto' }}>
              {formData.steps.map((st, i) => (
                <div
                  key={i}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--cream-subtle)',
                    border: '1px solid var(--cream-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--sand-gold-dark)', fontSize: '0.95rem' }}>
                      {st.stepNumber}
                    </span>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Título da etapa"
                      value={st.title}
                      onChange={(e) => {
                        const newSteps = [...formData.steps];
                        newSteps[i].title = e.target.value;
                        setFormData({ ...formData, steps: newSteps });
                      }}
                      style={{ height: '38px', fontSize: '0.9rem' }}
                    />
                    <button
                      type="button"
                      className="sidebar-collapse-btn"
                      onClick={() => {
                        const newSteps = formData.steps.filter((_, idx) => idx !== i);
                        setFormData({ ...formData, steps: newSteps });
                      }}
                      style={{ color: '#dc2626' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Descrição sucinta do procedimento"
                    value={st.description}
                    onChange={(e) => {
                      const newSteps = [...formData.steps];
                      newSteps[i].description = e.target.value;
                      setFormData({ ...formData, steps: newSteps });
                    }}
                    style={{ height: '38px', fontSize: '0.85rem' }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingProcess ? 'Salvar Alterações' : 'Criar Processo'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={Boolean(processToDelete)}
        onClose={() => setProcessToDelete(null)}
        onConfirm={handleDeleteProcess}
        title="Excluir Processo SOP"
        message={`Tem certeza que deseja excluir o processo "${processToDelete?.title}"?`}
      />
    </div>
  );
};
