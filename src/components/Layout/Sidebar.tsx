import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  Calendar,
  FileCheck,
  TrendingUp,
  FileText,
  FileCheck2,
  DollarSign,
  GitMerge,
  Layers,
  FolderOpen,
  BarChart3,
  UserCheck,
  Sparkles,
  Palette,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'clients'
  | 'projects'
  | 'tasks'
  | 'calendar'
  | 'approvals'
  | 'leads'
  | 'proposals'
  | 'contracts'
  | 'financial'
  | 'processes'
  | 'templates'
  | 'materials'
  | 'reports'
  | 'team'
  | 'content'
  | 'brand-center'
  | 'settings'
  | 'profile';

interface NavGroup {
  title: string;
  items: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }[];
}

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onLogout
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const navGroups: NavGroup[] = [
    {
      title: 'Operação',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'clients', label: 'Clientes', icon: Users },
        { id: 'projects', label: 'Projetos', icon: Briefcase },
        { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
        { id: 'calendar', label: 'Agenda', icon: Calendar },
        { id: 'approvals', label: 'Aprovações', icon: FileCheck }
      ]
    },
    {
      title: 'Comercial',
      items: [
        { id: 'leads', label: 'Leads', icon: TrendingUp },
        { id: 'proposals', label: 'Propostas', icon: FileText },
        { id: 'contracts', label: 'Contratos', icon: FileCheck2 },
        { id: 'financial', label: 'Financeiro', icon: DollarSign }
      ]
    },
    {
      title: 'Criação',
      items: [
        { id: 'content', label: 'Conteúdo', icon: Sparkles },
        { id: 'materials', label: 'Materiais', icon: FolderOpen }
      ]
    },
    {
      title: 'Performance',
      items: [
        { id: 'reports', label: 'Relatórios', icon: BarChart3 }
      ]
    },
    {
      title: 'Gestão & Marca',
      items: [
        { id: 'processes', label: 'Processos', icon: GitMerge },
        { id: 'templates', label: 'Templates', icon: Layers },
        { id: 'team', label: 'Equipe', icon: UserCheck },
        { id: 'brand-center', label: 'Brand Center', icon: Palette }
      ]
    }
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-overlay ${isMobileOpen ? 'mobile-open' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
      >
        {/* Top Header - Official Alicerce Logo & Agency Concept */}
        <div className="sidebar-header">
          <div
            className="sidebar-logo-container"
            onClick={() => handleNavClick('dashboard')}
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
            title="Alicerce OS — Creative & Business Operations"
          >
            {isCollapsed ? (
              <img
                src="/Ab.png"
                alt="Alicerce"
                className="sidebar-logo-icon"
              />
            ) : (
              <>
                <img
                  src="/logo.png"
                  alt="Alicerce"
                  className="sidebar-logo-full"
                />
                <span
                  style={{
                    fontSize: '0.62rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--sand-gold-light)',
                    fontWeight: 600,
                    marginTop: '4px',
                    fontFamily: 'var(--font-heading)',
                    opacity: 0.9
                  }}
                >
                  Creative & Operations
                </span>
              </>
            )}
          </div>

          {/* Minimalist discreet desktop collapse control */}
          <button
            type="button"
            className="sidebar-collapse-toggle"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Mobile Close Button */}
          {isMobileOpen && (
            <button
              type="button"
              className="sidebar-close-mobile-btn"
              onClick={onCloseMobile}
              aria-label="Fechar menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Grouped Navigation */}
        <nav className="sidebar-nav" style={{ overflowY: 'auto', paddingBottom: '20px' }}>
          {navGroups.map((group) => {
            const isGroupCollapsed = Boolean(collapsedGroups[group.title]);
            return (
              <div key={group.title} className="sidebar-nav-group" style={{ marginBottom: isCollapsed ? '8px' : '14px' }}>
                {!isCollapsed && (
                  <div
                    onClick={() => toggleGroup(group.title)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 14px 4px',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        color: 'var(--sand-gold-light)',
                        opacity: 0.85
                      }}
                    >
                      {group.title}
                    </span>
                    <ChevronDown
                      size={12}
                      color="var(--sand-gold-light)"
                      style={{
                        transform: isGroupCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        opacity: 0.6
                      }}
                    />
                  </div>
                )}

                {!isGroupCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`nav-item ${isActive ? 'active' : ''}`}
                          onClick={() => handleNavClick(item.id)}
                          data-tooltip={item.label}
                        >
                          <div className="nav-item-icon">
                            <Icon size={18} />
                          </div>
                          {!isCollapsed && <span className="nav-item-label">{item.label}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Navigation */}
        <div className="sidebar-footer">
          <div className="sidebar-divider" />

          <button
            type="button"
            className={`nav-item ${currentTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavClick('settings')}
            data-tooltip="Configurações"
          >
            <div className="nav-item-icon">
              <Settings size={18} />
            </div>
            {!isCollapsed && <span className="nav-item-label">Configurações</span>}
          </button>

          <button
            type="button"
            className={`nav-item ${currentTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleNavClick('profile')}
            data-tooltip="Perfil"
          >
            <div className="nav-item-icon">
              <User size={18} />
            </div>
            {!isCollapsed && <span className="nav-item-label">Perfil</span>}
          </button>

          <button
            type="button"
            className="nav-item nav-item-logout"
            onClick={onLogout}
            data-tooltip="Sair"
          >
            <div className="nav-item-icon">
              <LogOut size={18} />
            </div>
            {!isCollapsed && <span className="nav-item-label">Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
