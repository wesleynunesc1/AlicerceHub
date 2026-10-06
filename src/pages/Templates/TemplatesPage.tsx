import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Play,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ProjectTemplate, ServiceType } from '../../types';
import { phase2Service } from '../../services/phase2';
import { projectsService } from '../../services/projects';
import { clientsService } from '../../services/clients';
import { Client } from '../../types';
import { Modal } from '../../components/Common/Modal';
import { useToast } from '../../components/Common/Toast';

export const TemplatesPage: React.FC = () => {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [isUseModalOpen, setIsUseModalOpen] = useState(false);

  const [useFormData, setUseFormData] = useState({
    clientId: '',
    projectName: '',
    responsible: 'Wesley Nunes',
    startDate: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    const [tmpls, cls] = await Promise.all([
      phase2Service.getTemplates(),
      clientsService.getClients()
    ]);
    setTemplates(tmpls);
    setClients(cls);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenUse = (tmpl: ProjectTemplate) => {
    setSelectedTemplate(tmpl);
    setUseFormData({
      clientId: clients[0]?.id || '',
      projectName: `${tmpl.title} - ${clients[0]?.companyName || 'Novo Projeto'}`,
      responsible: 'Wesley Nunes',
      startDate: new Date().toISOString().split('T')[0]
    });
    setIsUseModalOpen(true);
  };

  const handleInstantiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !useFormData.clientId) {
      showToast('Selecione o cliente para o novo projeto.', 'error');
      return;
    }

    const selectedCl = clients.find((c) => c.id === useFormData.clientId);
    const stages = selectedTemplate.steps.map((st, index) => ({
      id: `stg-${Date.now()}-${index}`,
      title: st.title,
      completed: false
    }));

    const totalDays = selectedTemplate.steps.reduce((acc, curr) => acc + (curr.estimatedDays || 2), 0);
    const dueDate = new Date(Date.now() + totalDays * 86400000).toISOString().split('T')[0];

    try {
      await projectsService.createProject({
        name: useFormData.projectName,
        clientId: useFormData.clientId,
        clientName: selectedCl?.companyName || 'Cliente',
        service: selectedTemplate.service,
        responsible: useFormData.responsible,
        startDate: useFormData.startDate,
        dueDate,
        description: `Projeto gerado a partir do template oficial "${selectedTemplate.title}". ${selectedTemplate.description}`,
        status: 'Planejamento',
        progress: 0,
        stages
      });

      showToast(`Projeto criado com sucesso com ${stages.length} etapas do template!`, 'success');
      setIsUseModalOpen(false);
    } catch (err: any) {
      showToast(err?.message || 'Falha ao instanciar template.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1400px' }}>
      {/* Header */}
      <div>
        <h1 className="font-serif" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
          Templates Operacionais
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', margin: '4px 0 0', fontWeight: 450 }}>
          Padronização de entregas para Meta Ads, Google Ads, Landing Pages, Social Media e Branding.
        </p>
      </div>

      {/* Grid de Templates */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '24px'
        }}
      >
        {templates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="card"
            style={{
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--sand-gold-dark)',
                    background: 'var(--sand-gold-tint)',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  {tmpl.service}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 550 }}>
                  {tmpl.steps.length} etapas estruturadas
                </span>
              </div>

              <h3 className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--green-deep)', margin: '0 0 8px' }}>
                {tmpl.title}
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                {tmpl.description}
              </p>

              {/* Etapas preview */}
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {tmpl.steps.slice(0, 4).map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--cream-subtle)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                      {idx + 1}
                    </span>
                    <span>{s.title}</span>
                  </div>
                ))}
                {tmpl.steps.length > 4 && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--sand-gold-dark)', fontWeight: 650, marginTop: '2px' }}>
                    +{tmpl.steps.length - 4} etapas adicionais
                  </span>
                )}
              </div>
            </div>

            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--cream-border)' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleOpenUse(tmpl)}
                style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
              >
                <Play size={16} /> Usar este Template
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Instanciar Projeto do Template */}
      {selectedTemplate && (
        <Modal
          isOpen={isUseModalOpen}
          onClose={() => setIsUseModalOpen(false)}
          title={`Criar Projeto a partir de "${selectedTemplate.title}"`}
        >
          <form onSubmit={handleInstantiate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Cliente *</label>
              <select
                className="form-input"
                value={useFormData.clientId}
                onChange={(e) => {
                  const selCl = clients.find((c) => c.id === e.target.value);
                  setUseFormData({
                    ...useFormData,
                    clientId: e.target.value,
                    projectName: `${selectedTemplate.title} - ${selCl?.companyName || ''}`
                  });
                }}
              >
                <option value="">Nenhum (Projeto interno)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Nome do Projeto *</label>
              <input
                type="text"
                className="form-input"
                value={useFormData.projectName}
                onChange={(e) => setUseFormData({ ...useFormData, projectName: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Responsável</label>
                <input
                  type="text"
                  className="form-input"
                  value={useFormData.responsible}
                  onChange={(e) => setUseFormData({ ...useFormData, responsible: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Data de Início</label>
                <input
                  type="date"
                  className="form-input"
                  value={useFormData.startDate}
                  onChange={(e) => setUseFormData({ ...useFormData, startDate: e.target.value })}
                />
              </div>
            </div>

            <div style={{ background: 'var(--cream-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Este projeto será criado com <strong>{selectedTemplate.steps.length} etapas configuradas</strong> e prazos calculados automaticamente.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsUseModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Gerar Projeto Operacional
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
