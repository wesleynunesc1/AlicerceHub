import React, { useState, useEffect } from 'react';
import {
  GitMerge,
  Search,
  Plus,
  Edit2,
  Trash2,
  ArrowRight,
  CheckCircle2,
  ListOrdered,
  ChevronRight,
  Share2,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import { db } from '../../services/db';
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

  const loadProcesses = () => {
    const list = db.getProcesses();
    setProcesses(list);
    if (selectedProcessId) {
      const found = list.find((p) => p.id === selectedProcessId);
      if (found) setViewingProcess(found);
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

  const handleSaveProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      showToast('Preencha os campos obrigatórios.', 'error');
      return;
    }

    const procToSave: SOPProcess = {
      id: editingProcess ? editingProcess.id : 'proc-' + Date.now(),
      title: formData.title,
      service: formData.service,
      category: formData.category,
      description: formData.description,
      responsible: formData.responsible,
      steps: formData.steps,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    db.saveProcess(procToSave);
    loadProcesses();
    if (viewingProcess && viewingProcess.id === procToSave.id) {
      setViewingProcess(procToSave);
    }
    setIsModalOpen(false);
    showToast(
      editingProcess ? 'Processo atualizado com sucesso!' : 'Processo SOP criado!',
      'success'
    );
  };

  const handleDeleteProcess = () => {
    if (!processToDelete) return;
    db.deleteProcess(processToDelete.id);
    loadProcesses();
    if (viewingProcess?.id === processToDelete.id) {
      setViewingProcess(null);
    }
    showToast('Processo removido.', 'info');
    setProcessToDelete(null);
  };

  // Add / Edit step in form
  const handleAddStepToForm = () => {
    const nextNum = (formData.steps.length + 1).toString().padStart(2, '0');
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        {
          stepNumber: nextNum,
          title: 'Nova Etapa Operacional',
          description: 'Descrição do que deve ser executado nesta fase.',
          checklist: ['Item de conferência 1']
        }
      ]
    });
  };

  // Filtered
  const filteredProcesses = processes.filter((p) => {
    const matchesCategory = activeCategory === 'Todas' || p.category === activeCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // DETAIL VIEW OF SOP
  if (viewingProcess) {
    return (
      <div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setViewingProcess(null);
            if (onClearSelectedProcess) onClearSelectedProcess();
          }}
          style={{ marginBottom: '20px', gap: '6px' }}
        >
          <ArrowLeft size={16} /> Voltar para lista de processos
        </button>

        {/* Process Header */}
        <div className="card" style={{ marginBottom: '28px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '16px',
              marginBottom: '16px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--green-primary)',
                    background: 'var(--green-tint)',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  Categoria: {viewingProcess.category}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>•</span>
                <Badge status={viewingProcess.service} type="service" />
              </div>

              <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--green-deep)' }}>
                {viewingProcess.title}
              </h1>

              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '8px', maxWidth: '780px' }}>
                {viewingProcess.description}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
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
              gap: '24px',
              paddingTop: '16px',
              borderTop: '1px solid var(--cream-border-subtle)',
              fontSize: '0.82rem',
              color: 'var(--text-muted)'
            }}
          >
            <span>Responsável pelo Método: <strong style={{ color: 'var(--text-primary)' }}>{viewingProcess.responsible}</strong></span>
            <span>Última Atualização: <strong style={{ color: 'var(--text-primary)' }}>{new Date(viewingProcess.updatedAt).toLocaleDateString('pt-BR')}</strong></span>
            <span>Total de Etapas: <strong style={{ color: 'var(--green-primary)' }}>{viewingProcess.steps.length} passos</strong></span>
          </div>
        </div>

        {/* Steps List (Numbered 01, 02, etc.) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {viewingProcess.steps.map((step, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                position: 'relative',
                borderLeft: '4px solid var(--green-primary)',
                padding: '24px 28px'
              }}
            >
              <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                {/* Step number badge */}
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    color: 'var(--sand-gold-dark)',
                    lineHeight: 1,
                    minWidth: '40px'
                  }}
                >
                  {step.stepNumber}
                </div>

                <div style={{ flex: 1 }}>
                  <h3
                    className="font-serif"
                    style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}
                  >
                    {step.title}
                  </h3>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '16px' }}>
                    {step.description}
                  </p>

                  {/* Step Checklist */}
                  {step.checklist && step.checklist.length > 0 && (
                    <div
                      style={{
                        background: 'var(--cream-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px 20px',
                        border: '1px solid var(--cream-border-subtle)'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: 'var(--text-muted)',
                          marginBottom: '10px'
                        }}
                      >
                        Checklist Obrigatório desta Etapa
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {step.checklist.map((item, itemIdx) => (
                          <div
                            key={itemIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              fontSize: '0.88rem',
                              color: 'var(--text-primary)'
                            }}
                          >
                            <CheckCircle2 size={16} color="var(--green-primary)" style={{ flexShrink: 0 }} />
                            <span>{item}</span>
                          </div>
                        ))}
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

  return (
    <div>
      {/* Page Header */}
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
            Processos
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem' }}>
            A maneira Alicerce de executar cada serviço.
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
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.84rem',
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
        <div style={{ position: 'relative', width: '100%', maxWidth: '460px' }}>
          <Search
            size={18}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px', borderRadius: 'var(--radius-full)' }}
            placeholder="Pesquisar por SOP, serviço ou metodologia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of SOPs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px'
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
              <div className="card-header" style={{ marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--sand-gold-dark)',
                    letterSpacing: '0.04em'
                  }}
                >
                  {proc.category}
                </span>
                <Badge status={proc.service} type="service" />
              </div>

              <h3 className="card-title font-serif" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
                {proc.title}
              </h3>

              <p
                style={{
                  fontSize: '0.84rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.45,
                  marginBottom: '18px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {proc.description}
              </p>

              {/* Steps summary */}
              <div
                style={{
                  background: 'var(--cream-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <ListOrdered size={15} color="var(--green-primary)" />
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
                paddingTop: '14px',
                borderTop: '1px solid var(--cream-border-subtle)',
                marginTop: '16px'
              }}
            >
              <span
                style={{
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: 'var(--green-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Abrir SOP <ArrowRight size={14} />
              </span>

              <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                <button
                  className="sidebar-collapse-btn"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={(e) => handleOpenEdit(proc, e)}
                  title="Editar processo"
                >
                  <Edit2 size={14} />
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
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

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
              rows={2}
              placeholder="Explique o propósito deste SOP e como ele se encaixa na entrega da Alicerce..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          {/* Form Steps */}
          <div style={{ marginTop: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--sand-gold-dark)' }}>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '260px', overflowY: 'auto' }}>
              {formData.steps.map((st, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--cream-subtle)',
                    border: '1px solid var(--cream-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--sand-gold-dark)', fontSize: '0.9rem' }}>
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
                      style={{ padding: '6px 10px', fontSize: '0.85rem' }}
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
                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
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
