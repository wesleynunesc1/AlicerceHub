import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Menu,
  X,
  ExternalLink,
  Users,
  Briefcase,
  GitMerge,
  FolderOpen
} from 'lucide-react';
import { db } from '../../services/db';
import { NavTab } from './Sidebar';

interface HeaderProps {
  currentTab?: NavTab;
  onOpenMobileMenu: () => void;
  onNavigate: (tab: NavTab, targetId?: string) => void;
}

const TAB_META: Record<NavTab, { group: string; label: string }> = {
  dashboard: { group: 'Operação', label: 'Dashboard' },
  clients: { group: 'Operação', label: 'Clientes' },
  projects: { group: 'Operação', label: 'Projetos' },
  tasks: { group: 'Operação', label: 'Tarefas' },
  calendar: { group: 'Operação', label: 'Agenda' },
  approvals: { group: 'Operação', label: 'Aprovações' },
  leads: { group: 'Comercial', label: 'Leads' },
  proposals: { group: 'Comercial', label: 'Propostas' },
  contracts: { group: 'Comercial', label: 'Contratos' },
  financial: { group: 'Comercial', label: 'Financeiro' },
  processes: { group: 'Gestão', label: 'Processos' },
  templates: { group: 'Gestão', label: 'Templates' },
  materials: { group: 'Gestão', label: 'Materiais' },
  reports: { group: 'Gestão', label: 'Relatórios' },
  team: { group: 'Gestão', label: 'Equipe' },
  content: { group: 'Marca', label: 'Conteúdo' },
  'brand-center': { group: 'Marca', label: 'Brand Center' },
  settings: { group: 'Sistema', label: 'Configurações' },
  profile: { group: 'Sistema', label: 'Perfil' }
};

export const Header: React.FC<HeaderProps> = ({ currentTab = 'dashboard', onOpenMobileMenu, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const user = db.getUser();

  const searchRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Close desktop dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus mobile input when opened
  useEffect(() => {
    if (isMobileSearchOpen && mobileInputRef.current) {
      setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 150);
    }
  }, [isMobileSearchOpen]);

  // Data for search
  const clients = db.getClients();
  const projects = db.getProjects();
  const processes = db.getProcesses();
  const materials = db.getMaterials();

  const q = searchQuery.toLowerCase().trim();

  const filteredClients = q
    ? clients.filter(
        (c) =>
          c.companyName.toLowerCase().includes(q) ||
          c.contactName.toLowerCase().includes(q) ||
          c.segment.toLowerCase().includes(q)
      )
    : [];

  const filteredProjects = q
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.clientName.toLowerCase().includes(q) ||
          p.service.toLowerCase().includes(q)
      )
    : [];

  const filteredProcesses = q
    ? processes.filter(
        (pr) =>
          pr.title.toLowerCase().includes(q) ||
          pr.service.toLowerCase().includes(q) ||
          pr.category.toLowerCase().includes(q)
      )
    : [];

  const filteredMaterials = q
    ? materials.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      )
    : [];

  const hasResults =
    filteredClients.length > 0 ||
    filteredProjects.length > 0 ||
    filteredProcesses.length > 0 ||
    filteredMaterials.length > 0;

  const handleSelectResult = (tab: NavTab, id: string) => {
    onNavigate(tab, id);
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
    setSearchQuery('');
  };

  const renderSearchResults = () => (
    <>
      {!hasResults && q && (
        <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.94rem' }}>
          Nenhum resultado encontrado para "{searchQuery}"
        </div>
      )}

      {filteredClients.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div className="search-section-title">Clientes ({filteredClients.length})</div>
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="search-item"
              onClick={() => handleSelectResult('clients', client.id)}
            >
              <div className="search-item-left">
                <Users size={16} color="var(--green-primary)" />
                <div>
                  <div style={{ fontWeight: 650, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{client.companyName}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {client.contactName} • {client.segment}
                  </div>
                </div>
              </div>
              <span className="search-item-badge">{client.status}</span>
            </div>
          ))}
        </div>
      )}

      {filteredProjects.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div className="search-section-title">Projetos ({filteredProjects.length})</div>
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="search-item"
              onClick={() => handleSelectResult('projects', project.id)}
            >
              <div className="search-item-left">
                <Briefcase size={16} color="var(--sand-gold-dark)" />
                <div>
                  <div style={{ fontWeight: 650, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{project.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {project.clientName} • {project.service}
                  </div>
                </div>
              </div>
              <span className="search-item-badge">{project.status}</span>
            </div>
          ))}
        </div>
      )}

      {filteredProcesses.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div className="search-section-title">Processos SOP ({filteredProcesses.length})</div>
          {filteredProcesses.map((process) => (
            <div
              key={process.id}
              className="search-item"
              onClick={() => handleSelectResult('processes', process.id)}
            >
              <div className="search-item-left">
                <GitMerge size={16} color="var(--green-light)" />
                <div>
                  <div style={{ fontWeight: 650, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{process.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {process.category} • {process.service}
                  </div>
                </div>
              </div>
              <span className="search-item-badge">{process.service}</span>
            </div>
          ))}
        </div>
      )}

      {filteredMaterials.length > 0 && (
        <div>
          <div className="search-section-title">Materiais ({filteredMaterials.length})</div>
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              className="search-item"
              onClick={() => handleSelectResult('materials', material.id)}
            >
              <div className="search-item-left">
                <FolderOpen size={16} color="var(--text-secondary)" />
                <div>
                  <div style={{ fontWeight: 650, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{material.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {material.category} • {material.responsible}
                  </div>
                </div>
              </div>
              <ExternalLink size={14} color="var(--text-muted)" />
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <header className="app-header">
      {/* Left: Mobile Branding & Desktop Search */}
      <div className="header-left">
        {/* Mobile menu trigger */}
        <button
          className="mobile-menu-btn"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menu lateral"
        >
          <Menu size={22} />
        </button>

        {/* Mobile Brand Mark */}
        <div className="header-mobile-brand" onClick={() => onNavigate('dashboard')}>
          <img src="/Ab.png" alt="Logo Alicerce" className="header-mobile-logo" />
          <span className="header-mobile-title font-serif">Alicerce</span>
        </div>

        {/* Desktop Context Path */}
        <div className="desktop-header-context" style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', marginRight: '8px' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {TAB_META[currentTab]?.group || 'Operação'}
          </span>
          <span style={{ color: 'var(--sand-gold)', fontSize: '0.82rem', fontWeight: 600 }}>/</span>
          <span style={{ fontSize: '0.88rem', color: 'var(--green-deep)', fontWeight: 750 }}>
            {TAB_META[currentTab]?.label || 'Dashboard'}
          </span>
        </div>

        {/* Desktop Global Search Bar */}
        <div className="global-search-wrapper desktop-search" ref={searchRef}>
          <Search size={18} className="global-search-icon" />
          <input
            type="text"
            className="global-search-input"
            placeholder="Pesquisar clientes, projetos, processos ou materiais..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
          />

          {/* Desktop Search Dropdown */}
          {isSearchOpen && q && (
            <div className="search-results-dropdown">
              {renderSearchResults()}
            </div>
          )}
        </div>
      </div>

      {/* Right: Mobile Search Button & User Profile Pill */}
      <div className="header-right">
        {/* Mobile Search Button (Dedicated full sheet, avoids keyboard/zoom issues) */}
        <button
          className="header-action-btn mobile-search-btn"
          onClick={() => setIsMobileSearchOpen(true)}
          aria-label="Abrir busca"
        >
          <Search size={20} />
        </button>

        {/* User Profile Pill (Clean, without notification clutter) */}
        <button
          className="header-user-btn"
          onClick={() => onNavigate('profile')}
          title="Ver perfil de usuário"
        >
          <div className="user-avatar-circle">
            {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div className="header-user-info">
            <span className="header-user-name">{user.name}</span>
            <span className="header-user-role">{user.role}</span>
          </div>
        </button>
      </div>

      {/* Mobile Search Overlay / Fullsheet */}
      {isMobileSearchOpen && (
        <div className="mobile-search-overlay" onClick={() => setIsMobileSearchOpen(false)}>
          <div className="mobile-search-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-search-header">
              <Search size={20} color="var(--green-primary)" />
              <input
                ref={mobileInputRef}
                type="text"
                className="mobile-search-input"
                placeholder="Pesquisar clientes, projetos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                className="mobile-search-close"
                onClick={() => setIsMobileSearchOpen(false)}
                aria-label="Fechar busca"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mobile-search-body">
              {q ? (
                renderSearchResults()
              ) : (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '0.92rem', fontWeight: 500 }}>
                    Digite o nome de uma empresa, serviço, projeto ou material para buscar.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
