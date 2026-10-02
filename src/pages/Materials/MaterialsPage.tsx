import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Search,
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  FileText,
  FileCode,
  FileSpreadsheet,
  Link,
  Download
} from 'lucide-react';
import { db } from '../../services/db';
import { materialsService } from '../../services/materials';
import { Material, MaterialCategory } from '../../types';
import { Modal } from '../../components/Common/Modal';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';
import { useToast } from '../../components/Common/Toast';

const CATEGORIES: ('Todas' | MaterialCategory)[] = [
  'Todas',
  'Comercial',
  'Onboarding',
  'Contratos',
  'Briefings',
  'Checklists',
  'Relatórios',
  'Apresentações',
  'Templates',
  'Documentos internos'
];

interface MaterialsPageProps {
  selectedMaterialId?: string;
  onClearSelectedMaterial?: () => void;
}

export const MaterialsPage: React.FC<MaterialsPageProps> = () => {
  const { showToast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activeCategory, setActiveCategory] = useState<'Todas' | MaterialCategory>('Todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Briefings' as MaterialCategory,
    description: '',
    responsible: 'Wesley Nunes',
    externalLink: '',
    fileUrl: '',
    fileType: 'pdf' as 'pdf' | 'doc' | 'sheet' | 'figma' | 'link' | 'archive',
    fileSize: '1.2 MB'
  });

  const loadMaterials = async () => {
    try {
      const remoteMaterials = await materialsService.getMaterials();
      setMaterials(remoteMaterials || []);
    } catch {
      setMaterials([]);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleOpenCreate = () => {
    setEditingMaterial(null);
    setSelectedFile(null);
    setFormData({
      title: '',
      category: 'Briefings',
      description: '',
      responsible: 'Wesley Nunes',
      externalLink: '',
      fileUrl: '',
      fileType: 'doc',
      fileSize: '500 KB'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mat: Material, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMaterial(mat);
    setSelectedFile(null);
    setFormData({
      title: mat.title,
      category: mat.category,
      description: mat.description,
      responsible: mat.responsible,
      externalLink: mat.externalLink || '',
      fileUrl: mat.fileUrl || '',
      fileType: mat.fileType || 'pdf',
      fileSize: mat.fileSize || '1.0 MB'
    });
    setIsModalOpen(true);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      showToast('Preencha os campos obrigatórios.', 'error');
      return;
    }

    let finalFileUrl = formData.fileUrl;

    if (selectedFile) {
      setIsUploading(true);
      showToast('Enviando arquivo para o Supabase Storage...', 'info');
      const uploadRes = await materialsService.uploadFile(selectedFile);
      setIsUploading(false);

      if (uploadRes.publicUrl) {
        finalFileUrl = uploadRes.publicUrl;
      } else {
        showToast(uploadRes.error || 'Aviso: arquivo mantido localmente.', 'info');
      }
    }

    const payload = {
      title: formData.title,
      category: formData.category,
      description: formData.description,
      responsible: formData.responsible,
      externalLink: formData.externalLink,
      fileUrl: finalFileUrl,
      fileType: formData.fileType,
      fileSize: selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB` : formData.fileSize,
    };

    if (editingMaterial) {
      await materialsService.updateMaterial(editingMaterial.id, payload);
      db.saveMaterial({
        ...editingMaterial,
        ...payload,
        updatedAt: new Date().toISOString().split('T')[0],
      });
      showToast('Material atualizado com sucesso!', 'success');
    } else {
      const created = await materialsService.createMaterial(payload);
      if (created) {
        db.saveMaterial(created);
      } else {
        const localMat: Material = {
          id: 'mat-' + Date.now(),
          ...payload,
          updatedAt: new Date().toISOString().split('T')[0],
        };
        db.saveMaterial(localMat);
      }
      showToast('Material adicionado à biblioteca!', 'success');
    }

    await loadMaterials();
    setIsModalOpen(false);
  };

  const handleDeleteMaterial = async () => {
    if (!materialToDelete) return;
    await materialsService.deleteMaterial(materialToDelete.id);
    db.deleteMaterial(materialToDelete.id);
    await loadMaterials();
    showToast('Material removido.', 'info');
    setMaterialToDelete(null);
  };

  const getFileIcon = (type?: string) => {
    switch (type) {
      case 'pdf':
        return <FileText size={22} color="#DC2626" />;
      case 'doc':
        return <FileText size={22} color="#2563EB" />;
      case 'sheet':
        return <FileSpreadsheet size={22} color="#059669" />;
      case 'figma':
        return <FileCode size={22} color="#9333EA" />;
      default:
        return <Link size={22} color="var(--green-primary)" />;
    }
  };

  const filteredMaterials = materials.filter((m) => {
    const matchesCategory = activeCategory === 'Todas' || m.category === activeCategory;
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.responsible.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Title & Action */}
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
            Materiais
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', fontWeight: 450 }}>
            Biblioteca central de templates, contratos, briefings e documentos internos da Alicerce.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleOpenCreate}
          style={{ gap: '8px', padding: '12px 24px', fontSize: '0.96rem' }}
        >
          <Plus size={18} /> Adicionar Material
        </button>
      </div>

      {/* Category Filter Pills & Search */}
      <div
        className="card"
        style={{
          padding: '18px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
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
            placeholder="Pesquisar materiais por título ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Materials */}
      {filteredMaterials.length === 0 ? (
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
            <FolderOpen size={26} />
          </div>
          <h3 className="font-serif" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Nenhum material cadastrado ainda.
          </h3>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.5, marginBottom: '22px' }}>
            Centralize aqui os materiais e documentos da Alicerce.
          </p>
          <button
            className="btn btn-primary"
            onClick={handleOpenCreate}
            style={{ gap: '8px' }}
          >
            <Plus size={16} /> Adicionar material
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '24px'
          }}
        >
          {filteredMaterials.map((mat) => (
            <div
              key={mat.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div className="card-header" style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--cream-subtle)',
                        border: '1px solid var(--cream-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {getFileIcon(mat.fileType)}
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--sand-gold-dark)',
                          letterSpacing: '0.06em'
                        }}
                      >
                        {mat.category}
                      </span>
                      <h4
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          lineHeight: 1.3,
                          marginTop: '2px'
                        }}
                      >
                        {mat.title}
                      </h4>
                    </div>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    marginBottom: '18px',
                    fontWeight: 450
                  }}
                >
                  {mat.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    background: 'var(--cream-subtle)',
                    padding: '9px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 500
                  }}
                >
                  <span>Resp.: <strong style={{ color: 'var(--text-primary)' }}>{mat.responsible}</strong></span>
                  <span>Atualizado: <strong style={{ color: 'var(--text-primary)' }}>{new Date(mat.updatedAt).toLocaleDateString('pt-BR')}</strong></span>
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
                  marginTop: '16px'
                }}
              >
                {mat.externalLink ? (
                  <a
                    href={mat.externalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px', fontSize: '0.82rem' }}
                  >
                    Abrir Material <ExternalLink size={14} />
                  </a>
                ) : (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => showToast('Download iniciado.', 'info')}
                    style={{ gap: '6px', fontSize: '0.82rem' }}
                  >
                    Baixar Arquivo <Download size={14} />
                  </button>
                )}

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="sidebar-collapse-btn"
                    style={{ color: 'var(--text-secondary)' }}
                    onClick={(e) => handleOpenEdit(mat, e)}
                    title="Editar material"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    className="sidebar-collapse-btn"
                    style={{ color: '#dc2626' }}
                    onClick={() => setMaterialToDelete(mat)}
                    title="Excluir material"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Adicionar / Editar Material */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMaterial ? 'Editar Material' : 'Adicionar Novo Material'}
        subtitle="Catalogar arquivo, template ou link na biblioteca operacional"
        maxWidth="700px"
      >
        <form onSubmit={handleSaveMaterial}>
          <div className="form-group">
            <label className="form-label">Nome do Material *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Proposta Comercial Padrão Alicerce 2025"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Categoria *</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as MaterialCategory })}
              >
                <option value="Comercial">Comercial</option>
                <option value="Onboarding">Onboarding</option>
                <option value="Contratos">Contratos</option>
                <option value="Briefings">Briefings</option>
                <option value="Checklists">Checklists</option>
                <option value="Relatórios">Relatórios</option>
                <option value="Apresentações">Apresentações</option>
                <option value="Templates">Templates</option>
                <option value="Documentos internos">Documentos internos</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Responsável Interno</label>
              <select
                className="form-select"
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
              >
                <option value="Wesley Nunes">Wesley Nunes</option>
                <option value="Ana Castro">Ana Castro</option>
                <option value="Equipe Alicerce">Equipe Alicerce</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tipo de Formato</label>
              <select
                className="form-select"
                value={formData.fileType}
                onChange={(e) => setFormData({ ...formData, fileType: e.target.value as any })}
              >
                <option value="pdf">Documento PDF</option>
                <option value="doc">Word / Google Docs</option>
                <option value="sheet">Planilha / Excel</option>
                <option value="figma">Figma / Design</option>
                <option value="link">Link Web Externo</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Link Externo / Acesso Seguro</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://docs.google.com/..."
                value={formData.externalLink}
                onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
              />
            </div>
          </div>

          {/* Upload de arquivo direto para o Supabase Storage */}
          <div className="form-group">
            <label className="form-label">Upload de Arquivo (Supabase Storage: PDF, DOCX, XLSX, Imagem)</label>
            <input
              type="file"
              className="form-input"
              style={{ height: 'auto', padding: '10px' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
            {selectedFile && (
              <span style={{ fontSize: '0.8rem', color: 'var(--green-primary)', fontWeight: 600, marginTop: '4px' }}>
                ✓ Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Descrição do Material *</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Explique o objetivo deste documento e orientações de uso para a equipe..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '18px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingMaterial ? 'Salvar Alterações' : 'Salvar Material'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={Boolean(materialToDelete)}
        onClose={() => setMaterialToDelete(null)}
        onConfirm={handleDeleteMaterial}
        title="Excluir Material"
        message={`Deseja remover "${materialToDelete?.title}" da biblioteca?`}
      />
    </div>
  );
};
