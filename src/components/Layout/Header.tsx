import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Menu,
  Check,
  ExternalLink,
  Users,
  Briefcase,
  GitMerge,
  FolderOpen
} from 'lucide-react';
import { db } from '../../services/db';
import { NavTab } from './Sidebar';
import { Client, Project, SOPProcess, Material, NotificationItem } from '../../types';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onNavigate: (tab: NavTab, targetId?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const user = db.getUser();

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotifications(db.getNotifications());
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    db.markAllNotificationsAsRead();
    setNotifications(db.getNotifications());
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    db.markNotificationAsRead(notif.id);
    setNotifications(db.getNotifications());
    setIsNotifOpen(false);
    if (notif.link?.startsWith('proj-')) {
      onNavigate('projects', notif.link);
    } else if (notif.link?.startsWith('proc-')) {
      onNavigate('processes', notif.link);
    }
  };

  // Search Results
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

  return (
    <header className="app-header">
      {/* Left: Mobile hamburger & Global Search */}
      <div className="header-left">
        <button
          className="mobile-menu-btn"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>

        <div className="global-search-wrapper" ref={searchRef}>
          <Search size={18} className="global-search-icon" />
          <input
            type="text"
            className="global-search-input"
            placeholder="Pesquisar clientes, projetos, processos e materiais..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
          />

          {/* Instant Search Results Dropdown */}
          {isSearchOpen && q && (
            <div className="search-results-dropdown">
              {!hasResults && (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Nenhum resultado encontrado para "{searchQuery}"
                </div>
              )}

              {filteredClients.length > 0 && (
                <div>
                  <div className="search-section-title">Clientes ({filteredClients.length})</div>
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className="search-item"
                      onClick={() => {
                        onNavigate('clients', client.id);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      <div className="search-item-left">
                        <Users size={16} color="var(--green-primary)" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{client.companyName}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
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
                <div>
                  <div className="search-section-title">Projetos ({filteredProjects.length})</div>
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="search-item"
                      onClick={() => {
                        onNavigate('projects', project.id);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      <div className="search-item-left">
                        <Briefcase size={16} color="var(--sand-gold-dark)" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{project.name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
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
                <div>
                  <div className="search-section-title">Processos SOP ({filteredProcesses.length})</div>
                  {filteredProcesses.map((process) => (
                    <div
                      key={process.id}
                      className="search-item"
                      onClick={() => {
                        onNavigate('processes', process.id);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      <div className="search-item-left">
                        <GitMerge size={16} color="var(--green-light)" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{process.title}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            Categoria: {process.category}
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
                      onClick={() => {
                        onNavigate('materials', material.id);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      <div className="search-item-left">
                        <FolderOpen size={16} color="var(--text-secondary)" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{material.title}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {material.category} • {material.responsible}
                          </div>
                        </div>
                      </div>
                      <ExternalLink size={14} color="var(--text-muted)" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Notifications & User profile pill */}
      <div className="header-right">
        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="header-action-btn"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            aria-label="Notificações"
          >
            <Bell size={19} />
            {unreadCount > 0 && <span className="header-badge-dot" />}
          </button>

          {isNotifOpen && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>Notificações</span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        marginLeft: '8px',
                        background: 'var(--green-tint)',
                        color: 'var(--green-primary)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}
                    >
                      {unreadCount} novas
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    className="btn-ghost btn-sm"
                    onClick={handleMarkAllRead}
                    style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Check size={14} /> Marcar todas
                  </button>
                )}
              </div>

              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhuma notificação no momento.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`notification-item ${!notif.read ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {notif.title}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {notif.timestamp}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {notif.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        <button
          className="header-user-btn"
          onClick={() => onNavigate('profile')}
        >
          <div className="user-avatar-circle">
            {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div className="header-user-info">
            <span className="header-user-name">{user.name}</span>
            <span className="header-user-role">{user.roleType}</span>
          </div>
        </button>
      </div>
    </header>
  );
};
