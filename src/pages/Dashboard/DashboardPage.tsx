import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  Clock,
  Calendar,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  FolderOpen,
  GitMerge,
  ArrowRight
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

  // Upcoming deliveries sorted chronologically
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

  const formatDeliveryDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    return { day, month };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Editorial Header Section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontSize: '0.76rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--sand-gold-dark)',
              background: 'var(--sand-gold-tint)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)'
            }}
          >
            Central Operacional Alicerce
          </span>
        </div>

        <h1
          className="font-serif"
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: 'var(--green-deep)',
            letterSpacing: '-0.02em',
            margin: '4px 0 2px'
          }}
        >
          {getGreeting()}, {firstName}.
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', fontWeight: 450, maxWidth: '680px' }}>
          Aqui está uma visão geral da operação da Alicerce.
        </p>
      </div>

      {/* 4 Metric Cards with Subtle Trends and Clear Hierarchy */}
      <div className="metrics-grid">
        <div className="metric-card" onClick={() => onNavigate('clients')} style={{ cursor: 'pointer' }}>
          <div className="metric-info">
            <span className="metric-label">Clientes Ativos</span>
            <span className="metric-value">{activeClientsCount}</span>
            <span className="metric-subtext">
              <TrendingUp size={13} /> +20% vs mês anterior
            </span>
          </div>
          <div className="metric-icon-wrap">
            <Users size={24} />
          </div>
        </div>

        <div className="metric-card" onClick={() => onNavigate('projects')} style={{ cursor: 'pointer' }}>
          <div className="metric-info">
            <span className="metric-label">Em Andamento</span>
            <span className="metric-value">{inProgressProjectsCount}</span>
            <span className="metric-subtext" style={{ color: 'var(--status-prog-text)' }}>
              Em produção ativa
            </span>
          </div>
          <div className="metric-icon-wrap" style={{ background: 'var(--status-prog-bg)', color: 'var(--status-prog-text)' }}>
            <Briefcase size={24} />
          </div>
        </div>

        <div className="metric-card" onClick={() => onNavigate('projects')} style={{ cursor: 'pointer' }}>
          <div className="metric-info">
            <span className="metric-label">Aguardando Cliente</span>
            <span className="metric-value">{waitingClientProjectsCount}</span>
            <span className="metric-subtext" style={{ color: 'var(--status-wait-text)' }}>
              Revisão de aprovação
            </span>
          </div>
          <div className="metric-icon-wrap" style={{ background: 'var(--status-wait-bg)', color: 'var(--status-wait-text)' }}>
            <Clock size={24} />
          </div>
        </div>

        <div className="metric-card" onClick={() => onNavigate('projects')} style={{ cursor: 'pointer' }}>
          <div className="metric-info">
            <span className="metric-label">Entregas Próximas</span>
            <span className="metric-value">{upcomingCount}</span>
            <span className="metric-subtext" style={{ color: 'var(--green-primary)' }}>
              Próximos 15 dias
            </span>
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '32px',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Recent Projects Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', gridColumn: 'span 2' }}>
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div
              style={{
                padding: '24px 30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--cream-border)'
              }}
            >
              <div>
                <h3 className="card-title font-serif" style={{ fontSize: '1.45rem' }}>
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
                        <div style={{ fontWeight: 650, color: 'var(--text-primary)', fontSize: '0.96rem' }}>
                          {proj.name}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>
                          {proj.clientName}
                        </div>
                      </td>
                      <td>
                        <Badge status={proj.service} type="service" />
                      </td>
                      <td style={{ fontSize: '0.9rem', fontWeight: 500 }}>{proj.responsible}</td>
                      <td style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', fontWeight: 550 }}>
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

          {/* Brand Center & Metodologia Banner */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, #0B221B 0%, #12352B 100%)',
              color: '#FAF8F5',
              padding: '34px 36px',
              border: '1px solid var(--sand-gold-dark)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '24px'
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
                    letterSpacing: '0.14em',
                    fontWeight: 700,
                    marginBottom: '10px'
                  }}
                >
                  <Sparkles size={16} /> Brand Center & Metodologia
                </div>
                <h4
                  className="font-serif"
                  style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}
                >
                  A estrutura por trás da nossa operação.
                </h4>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', maxWidth: '560px', lineHeight: 1.55 }}>
                  Acesse os manuais de identidade da marca Alicerce, paleta cromática com cópia de HEX e os procedimentos operacionais (SOPs) de cada serviço.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-gold"
                  onClick={() => onNavigate('brand-center')}
                  style={{ gap: '8px' }}
                >
                  Brand Center <ArrowRight size={16} />
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => onNavigate('processes')}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    borderColor: 'rgba(255,255,255,0.25)',
                    color: '#ffffff',
                    fontWeight: 600
                  }}
                >
                  Processos SOP
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Deliveries & Recent Activities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Próximas Entregas (Vertical Clean Timeline) */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '18px' }}>
              <div>
                <h3 className="card-title font-serif" style={{ fontSize: '1.35rem' }}>
                  Próximas Entregas
                </h3>
                <p className="card-subtitle">Prazos e cronogramas imediatos</p>
              </div>
              <Calendar size={20} color="var(--sand-gold-dark)" />
            </div>

            <div className="deliveries-timeline">
              {upcomingDeliveries.map((proj) => {
                const { day, month } = formatDeliveryDate(proj.dueDate);
                return (
                  <div
                    key={proj.id}
                    className="delivery-item"
                    onClick={() => onNavigate('projects', proj.id)}
                  >
                    {/* Left date badge */}
                    <div className="delivery-date-badge">
                      <span className="delivery-date-day">{day}</span>
                      <span className="delivery-date-month">{month}</span>
                    </div>

                    {/* Middle info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.94rem',
                          fontWeight: 650,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {proj.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-muted)',
                          marginTop: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>{proj.clientName}</span>
                        <span>•</span>
                        <span style={{ color: 'var(--sand-gold-dark)', fontWeight: 600 }}>{proj.service}</span>
                      </div>
                    </div>

                    {/* Right status */}
                    <Badge status={proj.status} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Atividade Recente */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '18px' }}>
              <div>
                <h3 className="card-title font-serif" style={{ fontSize: '1.35rem' }}>
                  Atividade Recente
                </h3>
                <p className="card-subtitle">Histórico de atualizações operacionais</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activities.slice(0, 5).map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    fontSize: '0.9rem'
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--cream-subtle)',
                      border: '1px solid var(--cream-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--green-primary)',
                      flexShrink: 0
                    }}
                  >
                    {act.type === 'project' && <Briefcase size={16} />}
                    {act.type === 'client' && <Users size={16} />}
                    {act.type === 'material' && <FolderOpen size={16} />}
                    {act.type === 'process' && <GitMerge size={16} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 650, color: 'var(--text-primary)' }}>
                        {act.title}
                      </span>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {act.timestamp}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: '3px', lineHeight: 1.45, fontWeight: 450 }}>
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
