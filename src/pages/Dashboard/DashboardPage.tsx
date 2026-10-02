import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  Clock,
  Calendar,
  ArrowUpRight,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FolderOpen,
  GitMerge
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
      {/* 1. Área de Boas-vindas com Composição Institucional */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.76rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'var(--sand-gold-dark)',
              background: 'var(--sand-gold-tint)',
              padding: '3px 12px',
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

        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', fontWeight: 450, maxWidth: '640px' }}>
          Aqui está o panorama da operação da Alicerce.
        </p>
      </div>

      {/* 2. Bloco Composto de Operação (Não 4 caixas idênticas e isoladas) */}
      <div
        className="card"
        style={{
          padding: '0',
          overflow: 'hidden',
          background: 'var(--cream-card)',
          border: '1px solid var(--cream-border)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
          }}
          className="metric-composite-grid"
        >
          {/* Hero Indicator: Clientes Ativos */}
          <div
            onClick={() => onNavigate('clients')}
            style={{
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              background: 'linear-gradient(180deg, rgba(18, 53, 43, 0.02) 0%, transparent 100%)',
              borderRight: '1px solid var(--cream-border-subtle)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                Clientes Ativos
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--green-tint)',
                  color: 'var(--green-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Users size={18} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--green-deep)', lineHeight: 1 }}>
                {activeClientsCount}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--status-active-text)', fontWeight: 650, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingUp size={13} /> +20% carteira ativa
              </div>
            </div>
          </div>

          {/* Indicator: Projetos em Andamento */}
          <div
            onClick={() => onNavigate('projects')}
            style={{
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              borderRight: '1px solid var(--cream-border-subtle)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                Em Produção
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--status-prog-bg)',
                  color: 'var(--status-prog-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Briefcase size={18} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--green-deep)', lineHeight: 1 }}>
                {inProgressProjectsCount}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--status-prog-text)', fontWeight: 600, marginTop: '8px' }}>
                Em execução pela equipe
              </div>
            </div>
          </div>

          {/* Indicator: Aguardando Cliente */}
          <div
            onClick={() => onNavigate('projects')}
            style={{
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              borderRight: '1px solid var(--cream-border-subtle)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                Aguardando Cliente
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--status-wait-bg)',
                  color: 'var(--status-wait-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Clock size={18} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--green-deep)', lineHeight: 1 }}>
                {waitingClientProjectsCount}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--status-wait-text)', fontWeight: 600, marginTop: '8px' }}>
                Aguardando aprovação
              </div>
            </div>
          </div>

          {/* Indicator: Entregas Próximas */}
          <div
            onClick={() => onNavigate('projects')}
            style={{
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                Entregas Próximas
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--status-active-bg)',
                  color: 'var(--status-active-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Calendar size={18} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--green-deep)', lineHeight: 1 }}>
                {upcomingCount}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--green-primary)', fontWeight: 600, marginTop: '8px' }}>
                Próximos 15 dias
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Composition: Recent Projects & Side Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '32px',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Projetos Recentes (Desktop Table + Mobile Cards) */}
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

            {/* Desktop Table View */}
            <div className="desktop-table-container">
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

            {/* Mobile Card Behavior (Requested in Prompt) */}
            <div className="mobile-cards-container" style={{ padding: '16px' }}>
              {recentProjects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => onNavigate('projects', proj.id)}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--cream-border)',
                    background: 'var(--cream-subtle)',
                    marginBottom: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {proj.clientName}
                      </div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {proj.name}
                      </div>
                    </div>
                    <Badge status={proj.status} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--cream-border-subtle)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <span>Entrega: <strong style={{ color: 'var(--text-primary)' }}>{new Date(proj.dueDate).toLocaleDateString('pt-BR')}</strong></span>
                    <span>Resp: <strong style={{ color: 'var(--text-primary)' }}>{proj.responsible}</strong></span>
                  </div>

                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}
                  >
                    Abrir projeto
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Brand Center & Metodologia Banner */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, #0B221B 0%, #12352B 100%)',
              color: '#FAF8F5',
              padding: '36px',
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
                  style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}
                >
                  A estrutura por trás da nossa operação.
                </h4>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.96rem', maxWidth: '580px', lineHeight: 1.6 }}>
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
          {/* Próximas Entregas (Vertical Timeline) */}
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
                    <div className="delivery-date-badge">
                      <span className="delivery-date-day">{day}</span>
                      <span className="delivery-date-month">{month}</span>
                    </div>

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
