import React from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  GitMerge,
  FolderOpen,
  Sparkles,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'clients'
  | 'projects'
  | 'processes'
  | 'materials'
  | 'brand-center'
  | 'settings'
  | 'profile';

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
  const mainNavItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients' as NavTab, label: 'Clientes', icon: Users },
    { id: 'projects' as NavTab, label: 'Projetos', icon: Briefcase },
    { id: 'processes' as NavTab, label: 'Processos', icon: GitMerge },
    { id: 'materials' as NavTab, label: 'Materiais', icon: FolderOpen },
    { id: 'brand-center' as NavTab, label: 'Brand Center', icon: Sparkles }
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
      />

      <aside
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
      >
        {/* Header with Official Logo */}
        <div className="sidebar-header">
          <div
            className="sidebar-logo-container"
            onClick={() => handleNavClick('dashboard')}
            style={{ cursor: 'pointer' }}
          >
            <img
              src="/Ab.png"
              alt="Logo Alicerce Oficial"
              className="sidebar-logo-img"
            />
            {!isCollapsed && (
              <div className="sidebar-brand-text">
                <span className="sidebar-brand-name">Alicerce</span>
                <span className="sidebar-brand-sub">OS • Central</span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
            style={{ display: isMobileOpen ? 'none' : 'flex' }}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Mobile Close Button */}
          {isMobileOpen && (
            <button
              className="sidebar-collapse-btn"
              onClick={onCloseMobile}
              title="Fechar menu"
              style={{ width: '36px', height: '36px' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="sidebar-nav">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="nav-item-icon">
                  <Icon size={20} />
                </div>
                {!isCollapsed && <span className="nav-item-label">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Separator & Footer Navigation */}
        <div className="sidebar-footer">
          {/* Institutional Editorial Note (Requested in prompt) */}
          {!isCollapsed && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(197, 168, 128, 0.2)',
                marginBottom: '10px'
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '0.86rem',
                  fontStyle: 'italic',
                  color: 'var(--sand-gold-light)',
                  lineHeight: 1.35,
                  display: 'block'
                }}
              >
                "Estrutura para negócios que querem crescer."
              </span>
            </div>
          )}

          <div className="sidebar-divider" />

          <button
            className={`nav-item ${currentTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavClick('settings')}
            title={isCollapsed ? 'Configurações' : undefined}
          >
            <div className="nav-item-icon">
              <Settings size={19} />
            </div>
            {!isCollapsed && <span className="nav-item-label">Configurações</span>}
          </button>

          <button
            className={`nav-item ${currentTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleNavClick('profile')}
            title={isCollapsed ? 'Perfil' : undefined}
          >
            <div className="nav-item-icon">
              <User size={19} />
            </div>
            {!isCollapsed && <span className="nav-item-label">Perfil</span>}
          </button>

          <button
            className="nav-item danger"
            onClick={onLogout}
            title={isCollapsed ? 'Sair' : undefined}
          >
            <div className="nav-item-icon">
              <LogOut size={19} />
            </div>
            {!isCollapsed && <span className="nav-item-label">Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
