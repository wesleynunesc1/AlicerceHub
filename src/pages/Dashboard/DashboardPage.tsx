import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  Clock,
  Calendar,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  FolderOpen,
  GitMerge,
  CheckCircle2
} from 'lucide-react';
import { db } from '../../services/db';
import { Badge } from '../../components/Common/Badge';
import { NavTab } from '../../components/Layout/Sidebar';
import { Project, Client, ActivityItem } from '../../types';

interface DashboardPageProps {
  onNavigate: (tab: NavTab, targetId?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const user = db.getUser();

  useEffect(() => {
    setClients(db.getClients());
    setProjects(db.getProjects());
    setActivities(db.getActivities());
  }, []);

  const activeClientsCount = clients.filter((c) => c.status === 'Ativo').length;
  const inProgressProjectsCount = projects.filter((p) => p.status === 'Em produção').length;
  const waitingClientProjectsCount = projects.filter((p) => p.status === 'Aguardando cliente').length;

  // Upcoming deliveries (projects not finished, sorted by due date)
  const upcomingDeliveries = [...projects]
    .filter((p) => p.status !== 'Finalizado')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  const upcomingCount = upcomingDeliveries.length;
  const recentProjects = [...projects].slice(0, 5);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const firstName = user.name.split(' ')[0];

  return (
    <div>
      {/* Header section with refined editorial greeting */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '32px',
          gap: '6px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'var(--sand-gold-dark)',
              background: 'var(--sand-gold-tint)',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)'
            }}
          >
            Central Operacional Alicerce
          </span>
        </div>

        <h1
          className="font-serif"
          style={{
            fontSize: '2.4rem',
            fontWeight: 700,
            color: 'var(--green-deep)',
            letterSpacing: '-0.02em',
            marginTop: '4px'
          }}
        >
          {getGreeting()}, {firstName}.
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', maxWidth: '640px' }}>
          Aqui está uma visão geral da operação da Alicerce.
        </p>
      </div>

      {/* 4 Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card" onClick={() => onNavigate('clients')} style={{ cursor: 'pointer' }}>
          <div className="metric-info">
            <span className="metric-label">Clientes Ativos</span>
            <span className="metric-value">{activeClientsCount}</span>
          </div>
          <div className="metric-icon-wrap">
            <Users size={24} />
          </div>
        </div>

        <div className="metric-card" onClick={() => onNavigate('projects')} style={{ cursor: 'pointer' }}>
          <div className="metric-info">
            <span className="metric-label">Em Andamento</span>
            <span className="metric-value">{inProgressProjectsCount}</span>
          </div>
          <div className="metric-icon-wrap" style={{ background: 'var(--status-prog-bg)', color: 'var(--status-prog-text)' }}>
            <Briefcase size={24} />
          </div>
        </div>

        <div className="metric-card" onClick={() => onNavigate('projects')} style={{ cursor: 'pointer' }}>
          <div className="metric-info">
            <span className="metric-label">Aguardando Cliente</span>
            <span className="metric-value">{waitingClientProjectsCount}</span>
          </div>
          <div className="metric-icon-wrap" style={{ background: 'var(--status-wait-bg)', color: 'var(--status-wait-text)' }}>
            <Clock size={24} />
          </div>
        </div>

        <div className="metric-card" onClick={() => onNavigate('projects')} style={{ cursor: 'pointer' }}>
          <div className="metric-info">
            <span className="metric-label">Entregas Próximas</span>
            <span className="metric-value">{upcomingCount}</span>
          </div>
          <div className="metric-icon-wrap" style={{ background: 'var(--status-active-bg)', color: 'var(--status-active-text)' }}>
            <Calendar size={24} />
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Projects + Side Panel (Upcoming Deliveries & Activities) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '28px',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Recent Projects Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', gridColumn: 'span 2' }}>
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div
              style={{
                padding: '22px 26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--cream-border)'
              }}
            >
              <div>
                <h3 className="card-title font-serif" style={{ fontSize: '1.35rem' }}>
                  Projetos Recentes
                </h3>
                <p className="card-subtitle">Fluxo de entregas prioritárias da agência</p>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigate('projects')}
                style={{ gap: '6px' }}
              >
                Ver todos <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="table-responsive" style={{ border: 'none', borderRadius: '0' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cliente / Projeto</th>
                    <th>Serviço</th>
                    <th>Responsável</th>
                    <th>Prazo</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProjects.map((proj) => (
                    <tr
                      key={proj.id}
                      onClick={() => onNavigate('projects', proj.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {proj.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {proj.clientName}
                        </div>
                      </td>
                      <td>
                        <Badge status={proj.service} type="service" />
                      </td>
                      <td style={{ fontSize: '0.84rem' }}>{proj.responsible}</td>
                      <td style={{ fontSize: '0.84rem', whiteSpace: 'nowrap' }}>
                        {new Date(proj.dueDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td>
                        <Badge status={proj.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Access to Key Modules banner */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, #0B221B 0%, #12352B 100%)',
              color: '#FAF8F5',
              padding: '28px',
              border: '1px solid var(--sand-gold-dark)'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '20px'
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--sand-gold)',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    fontWeight: 700,
                    marginBottom: '8px'
                  }}
                >
                  <Sparkles size={16} /> Brand Center & Metodologia
                </div>
                <h4
                  className="font-serif"
                  style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '6px' }}
                >
                  A estrutura por trás da nossa operação.
                </h4>
                <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.9rem', maxWidth: '520px' }}>
                  Acesse os manuais de identidade da marca Alicerce, paleta cromática oficial e os SOPs de execução dos nossos serviços.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="btn btn-gold"
                  onClick={() => onNavigate('brand-center')}
                  style={{ gap: '6px' }}
                >
                  Brand Center
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => onNavigate('processes')}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    borderColor: 'rgba(255,255,255,0.2)',
                    color: '#fff'
                  }}
                >
                  Processos SOP
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Deliveries & Recent Activities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Próximas Entregas */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '14px' }}>
              <div>
                <h3 className="card-title font-serif" style={{ fontSize: '1.25rem' }}>
                  Próximas Entregas
                </h3>
                <p className="card-subtitle">Prazos mais imediatos</p>
              </div>
              <Calendar size={18} color="var(--sand-gold-dark)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingDeliveries.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => onNavigate('projects', proj.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--cream-border-subtle)',
                    background: 'var(--cream-subtle)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {proj.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    <span>{proj.clientName}</span>
                    <span style={{ fontWeight: 600, color: 'var(--green-primary)' }}>
                      {new Date(proj.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Atividade Recente */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '14px' }}>
              <div>
                <h3 className="card-title font-serif" style={{ fontSize: '1.25rem' }}>
                  Atividade Recente
                </h3>
                <p className="card-subtitle">Movimentações operacionais</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {activities.slice(0, 5).map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    fontSize: '0.85rem'
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--cream-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--green-primary)',
                      flexShrink: 0
                    }}
                  >
                    {act.type === 'project' && <Briefcase size={15} />}
                    {act.type === 'client' && <Users size={15} />}
                    {act.type === 'material' && <FolderOpen size={15} />}
                    {act.type === 'process' && <GitMerge size={15} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {act.title}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {act.timestamp}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px', lineHeight: 1.35 }}>
                      {act.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
