import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  Kanban as KanbanIcon,
  Calendar,
  FileText,
  Video,
  Image,
  Layers,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ContentItem, ContentStatus, ContentPillar, ContentFormat } from '../../types';
import { phase2Service } from '../../services/phase2';
import { Modal } from '../../components/Common/Modal';
import { useToast } from '../../components/Common/Toast';

export const ContentPage: React.FC = () => {
  const { showToast } = useToast();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pillarFilter, setPillarFilter] = useState<'Todos' | ContentPillar>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    pauta: '',
    pillar: 'Institucional' as ContentPillar,
    format: 'Carrossel' as ContentFormat,
    responsible: 'Wesley Nunes',
    script: '',
    caption: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    status: 'Ideia' as ContentStatus,
    externalLink: ''
  });

  const loadData = async () => {
    const list = await phase2Service.getContentItems();
    setContentItems(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      pauta: '',
      pillar: 'Institucional',
      format: 'Carrossel',
      responsible: 'Wesley Nunes',
      script: '',
      caption: '',
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'Ideia',
      externalLink: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ContentItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      pauta: item.pauta,
      pillar: item.pillar,
      format: item.format,
      responsible: item.responsible,
      script: item.script || '',
      caption: item.caption || '',
      scheduledDate: item.scheduledDate,
      status: item.status,
      externalLink: item.externalLink || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    await phase2Service.saveContentItem({
      ...(editingItem ? { id: editingItem.id } : {}),
      ...formData
    });

    showToast(editingItem ? 'Pauta atualizada.' : 'Conteúdo cadastrado com sucesso.', 'success');
    setIsModalOpen(false);
    loadData();
  };

  const kanbanColumns: ContentStatus[] = [
    'Ideia',
    'Roteiro',
    'Design',
    'Revisão',
    'Aprovado',
    'Publicado'
  ];

  const getPillarBadge = (pillar: ContentPillar) => {
    const styles: Record<ContentPillar, { bg: string; color: string }> = {
      'Notícia / Atualidade': { bg: '#E0F2FE', color: '#0369A1' },
      'Curiosidade / Case': { bg: '#FEF3C7', color: '#B45309' },
      'Educação': { bg: '#EAF5EE', color: '#1B6346' },
      'Institucional': { bg: 'var(--sand-gold-tint)', color: 'var(--sand-gold-dark)' }
    };
    const s = styles[pillar] || styles.Institucional;
    return (
      <span style={{ fontSize: '0.72rem', fontWeight: 650, background: s.bg, color: s.color, padding: '2px 6px', borderRadius: '4px' }}>
        {pillar}
      </span>
    );
  };

  const filteredItems = contentItems.filter((i) => {
    const matchesSearch =
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.pauta.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPillar = pillarFilter === 'Todos' || i.pillar === pillarFilter;
    return matchesSearch && matchesPillar;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
            Planejamento de Conteúdo
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', margin: 0, fontWeight: 450 }}>
            Fluxo editorial de pautas, roteiros, peças visuais e publicações estratégicas.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '8px' }}>
          <Plus size={18} /> Nova Pauta
        </button>
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
            placeholder="Pesquisar por tema, pauta ou título..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="form-input"
          style={{ width: 'auto', paddingRight: '32px' }}
          value={pillarFilter}
          onChange={(e) => setPillarFilter(e.target.value as any)}
        >
          <option value="Todos">Todos os pilares</option>
          <option value="Notícia / Atualidade">Notícia / Atualidade</option>
          <option value="Curiosidade / Case">Curiosidade / Case</option>
          <option value="Educação">Educação</option>
          <option value="Institucional">Institucional</option>
        </select>
      </div>

      {/* Kanban de Conteúdo */}
      {filteredItems.length === 0 ? (
        <div
          className="card"
          style={{ padding: '64px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <Sparkles size={32} color="var(--sand-gold-dark)" style={{ marginBottom: '14px' }} />
          <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Nenhum conteúdo no fluxo editorial.
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', margin: '0 0 20px', maxWidth: '420px' }}>
            Crie pautas alinhadas aos pilares estratégicos da Alicerce.
          </p>
          <button className="btn btn-primary" onClick={handleOpenCreate} style={{ gap: '8px' }}>
            <Plus size={16} /> Criar primeira pauta
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            paddingBottom: '16px'
          }}
        >
          {kanbanColumns.map((col) => {
            const colItems = filteredItems.filter((i) => i.status === col);
            return (
              <div
                key={col}
                style={{
                  minWidth: '260px',
                  maxWidth: '280px',
                  flexShrink: 0,
                  background: 'var(--cream-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  border: '1px solid var(--cream-border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--green-deep)' }}>{col}</span>
                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      background: 'rgba(0,0,0,0.06)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)'
                    }}
                  >
                    {colItems.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {colItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--cream-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleOpenEdit(item)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                        <span style={{ fontWeight: 650, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          {item.title}
                        </span>
                      </div>

                      {item.pauta && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                          {item.pauta}
                        </p>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        {getPillarBadge(item.pillar)}
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {item.format}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--cream-border-subtle)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        <span>Previsto: {new Date(item.scheduledDate).toLocaleDateString('pt-BR')}</span>
                        <span>{item.responsible}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar / Editar Conteúdo */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Editar Pauta' : 'Nova Pauta de Conteúdo'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Título da Pauta *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Como Estruturar Tráfego para Negócios Locais"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Pilar Editorial</label>
              <select
                className="form-input"
                value={formData.pillar}
                onChange={(e) => setFormData({ ...formData, pillar: e.target.value as ContentPillar })}
              >
                <option value="Institucional">Institucional</option>
                <option value="Educação">Educação</option>
                <option value="Curiosidade / Case">Curiosidade / Case</option>
                <option value="Notícia / Atualidade">Notícia / Atualidade</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Formato</label>
              <select
                className="form-input"
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value as ContentFormat })}
              >
                <option value="Carrossel">Carrossel</option>
                <option value="Reels">Reels / Vídeo Curto</option>
                <option value="Post Estático">Post Estático</option>
                <option value="Story">Sequência de Stories</option>
                <option value="Vídeo">Vídeo Longo</option>
                <option value="Artigo">Artigo / Newsletter</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Etapa no Fluxo</label>
              <select
                className="form-input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentStatus })}
              >
                {kanbanColumns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Data Prevista de Postagem</label>
              <input
                type="date"
                className="form-input"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Briefing da Pauta / Gancho</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Ângulo principal, gancho inicial (hook) e objetivo..."
              value={formData.pauta}
              onChange={(e) => setFormData({ ...formData, pauta: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Roteiro / Copy</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Texto dos slides ou roteiro do vídeo..."
              value={formData.script}
              onChange={(e) => setFormData({ ...formData, script: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Link para Design (Figma / Drive)</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://figma.com/..."
              value={formData.externalLink}
              onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Salvar Pauta
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
