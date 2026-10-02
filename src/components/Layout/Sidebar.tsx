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

  const footerNavItems = [
    { id: 'settings' as NavTab, label: 'Configurações', icon: Settings },
    { id: 'profile' as NavTab, label: 'Perfil', icon: User }
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
        {/* Top Header - ONLY official Alicerce Logo, no typed text */}
        <div className="sidebar-header">
          <div
            className="sidebar-logo-container"
            onClick={() => handleNavClick('dashboard')}
            style={{ cursor: 'pointer' }}
            title="Alicerce OS"
          >
            {isCollapsed ? (
              <img
                src="/Ab.png"
                alt="Alicerce"
                className="sidebar-logo-icon"
              />
            ) : (
              <img
                src="/logo.png"
                alt="Alicerce"
                className="sidebar-logo-full"
              />
            )}
          </div>

          {/* Minimal discreet desktop collapse control */}
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

        {/* Main Navigation */}
        <nav className="sidebar-nav">
          {mainNavItems.map((item) => {
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
                  <Icon size={19} />
                </div>
                {!isCollapsed && <span className="nav-item-label">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Separator & Footer Navigation */}
        <div className="sidebar-footer">
          <div className="sidebar-divider" />

          {footerNavItems.map((item) => {
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
                  <Icon size={19} />
                </div>
                {!isCollapsed && <span className="nav-item-label">{item.label}</span>}
              </button>
            );
          })}

          <button
            type="button"
            className="nav-item nav-item-logout"
            onClick={onLogout}
            data-tooltip="Sair"
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
