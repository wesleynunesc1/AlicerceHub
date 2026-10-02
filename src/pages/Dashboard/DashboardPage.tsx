import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  Clock,
  Calendar,
  ArrowUpRight,
  Plus,
  ArrowRight
} from 'lucide-react';
import { db } from '../../services/db';
import { dashboardService, DashboardMetrics } from '../../services/dashboard';
import { projectsService } from '../../services/projects';
import { clientsService } from '../../services/clients';
import { Badge } from '../../components/Common/Badge';
import { NavTab } from '../../components/Layout/Sidebar';
import { Project, Client } from '../../types';

interface DashboardPageProps {
  onNavigate: (tab: NavTab, targetId?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        const [remoteProjects, remoteClients, remoteMetrics] = await Promise.all([
          projectsService.getProjects(),
          clientsService.getClients(),
          dashboardService.getMetrics(),
        ]);

        setProjects(remoteProjects || []);
        setClients(remoteClients || []);
        setMetrics(remoteMetrics || {
          activeClientsCount: 0,
          inProgressProjectsCount: 0,
          waitingClientProjectsCount: 0,
          upcomingCount: 0,
        });
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
        setProjects([]);
        setClients([]);
        setMetrics({
          activeClientsCount: 0,
          inProgressProjectsCount: 0,
          waitingClientProjectsCount: 0,
          upcomingCount: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const activeClientsCount = metrics?.activeClientsCount ?? clients.filter((c) => c.status === 'Ativo').length;
  const inProgressProjects = projects.filter(
    (p) => p.status === 'Em produção' || p.status === 'Planejamento' || p.status === 'Revisão'
  );
  const inProgressProjectsCount = metrics?.inProgressProjectsCount ?? inProgressProjects.length;
  const waitingClientProjectsCount = metrics?.waitingClientProjectsCount ?? projects.filter((p) => p.status === 'Aguardando cliente').length;

  const upcomingDeliveries = [...projects]
    .filter((p) => p.status !== 'Finalizado')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  const upcomingCount = metrics?.upcomingCount ?? upcomingDeliveries.length;
  const recentClients = [...clients].slice(0, 5);

  const formatDeliveryDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
      return { day, month };
    } catch {
      return { day: '--', month: '---' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', maxWidth: '1400px' }}>
      {/* 1. Header Funcional */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h1
          className="font-serif"
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: 'var(--green-deep)',
            letterSpacing: '-0.02em',
            margin: 0
          }}
        >
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', margin: 0, fontWeight: 450 }}>
          Visão geral da operação da Alicerce.
        </p>
      </div>

      {/* 2. Visão Geral da Operação — Faixa Horizontal / Grid Editorial */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--sand-gold-dark)',
              margin: 0
            }}
          >
            Visão geral da operação
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            background: '#FFFFFF',
            border: '1px solid var(--cream-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {/* Indicador 1: Clientes Ativos */}
          <div
            onClick={() => onNavigate('clients')}
            style={{
              padding: '24px 28px',
              borderRight: '1px solid var(--cream-border-subtle)',
              borderBottom: '1px solid var(--cream-border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              transition: 'background var(--transition-fast)'
            }}
            className="editorial-indicator"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 550 }}>
                Clientes ativos
              </span>
              <Users size={18} color="var(--green-primary)" />
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--green-deep)', lineHeight: 1 }}>
                {activeClientsCount}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', display: 'block' }}>
                contas com contrato vigente
              </span>
            </div>
          </div>

          {/* Indicador 2: Projetos em Produção */}
          <div
            onClick={() => onNavigate('projects')}
            style={{
              padding: '24px 28px',
              borderRight: '1px solid var(--cream-border-subtle)',
              borderBottom: '1px solid var(--cream-border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              transition: 'background var(--transition-fast)'
            }}
            className="editorial-indicator"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 550 }}>
                Projetos em produção
              </span>
              <Briefcase size={18} color="var(--sand-gold-dark)" />
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--green-deep)', lineHeight: 1 }}>
                {inProgressProjectsCount}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', display: 'block' }}>
                em execução pela equipe
              </span>
            </div>
          </div>

          {/* Indicador 3: Aguardando Cliente */}
          <div
            onClick={() => onNavigate('projects')}
            style={{
              padding: '24px 28px',
              borderRight: '1px solid var(--cream-border-subtle)',
              borderBottom: '1px solid var(--cream-border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              transition: 'background var(--transition-fast)'
            }}
            className="editorial-indicator"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 550 }}>
                Aguardando cliente
              </span>
              <Clock size={18} color="var(--status-wait-text)" />
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--green-deep)', lineHeight: 1 }}>
                {waitingClientProjectsCount}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', display: 'block' }}>
                pendentes de aprovação externa
              </span>
            </div>
          </div>

          {/* Indicador 4: Próximas Entregas */}
          <div
            onClick={() => onNavigate('projects')}
            style={{
              padding: '24px 28px',
              borderBottom: '1px solid var(--cream-border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              transition: 'background var(--transition-fast)'
            }}
            className="editorial-indicator"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 550 }}>
                Entregas próximas
              </span>
              <Calendar size={18} color="var(--green-primary)" />
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--green-deep)', lineHeight: 1 }}>
                {upcomingCount}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', display: 'block' }}>
                prazos nos próximos 15 dias
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Projetos em Andamento — Seção Aberta com Tabela Limpa */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2
              className="font-serif"
              style={{
                fontSize: '1.6rem',
                fontWeight: 700,
                color: 'var(--green-deep)',
                margin: 0
              }}
            >
              Projetos em andamento
            </h2>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('projects')}
            style={{ gap: '6px' }}
          >
            Ver todos <ArrowUpRight size={14} />
          </button>
        </div>

        {inProgressProjects.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              background: '#FFFFFF',
              border: '1px solid var(--cream-border)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center'
            }}
          >
            <p style={{ fontSize: '0.96rem', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              Nenhum projeto em andamento no momento.
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onNavigate('projects')}
              style={{ gap: '6px', margin: '0 auto' }}
            >
              <Plus size={15} /> Criar projeto
            </button>
          </div>
        ) : (
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--cream-border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div className="desktop-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Projeto</th>
                    <th>Cliente</th>
                    <th>Serviço</th>
                    <th>Responsável</th>
                    <th>Prazo</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inProgressProjects.slice(0, 6).map((proj) => (
                    <tr
                      key={proj.id}
                      onClick={() => onNavigate('projects', proj.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.94rem' }}>
                          {proj.name}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                        {proj.clientName}
                      </td>
                      <td>
                        <Badge status={proj.service} type="service" />
                      </td>
                      <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {proj.responsible}
                      </td>
                      <td style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', fontWeight: 550, color: 'var(--text-primary)' }}>
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

            {/* Mobile View */}
            <div className="mobile-cards-container" style={{ padding: '16px', display: 'none' }}>
              {inProgressProjects.slice(0, 6).map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => onNavigate('projects', proj.id)}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--cream-border)',
                    background: 'var(--cream-subtle)',
                    marginBottom: '10px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                        {proj.name}
                      </div>
                      <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {proj.clientName}
                      </div>
                    </div>
                    <Badge status={proj.status} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--cream-border-subtle)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <span>Prazo: <strong style={{ color: 'var(--text-primary)' }}>{new Date(proj.dueDate).toLocaleDateString('pt-BR')}</strong></span>
                    <span>{proj.responsible}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 4. Entregas Próximas */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2
              className="font-serif"
              style={{
                fontSize: '1.6rem',
                fontWeight: 700,
                color: 'var(--green-deep)',
                margin: 0
              }}
            >
              Entregas próximas
            </h2>
          </div>
          <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Cronograma prioritário
          </span>
        </div>

        {upcomingDeliveries.length === 0 ? (
          <div
            style={{
              padding: '40px 24px',
              background: '#FFFFFF',
              border: '1px solid var(--cream-border)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center'
            }}
          >
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', margin: 0 }}>
              Nenhuma entrega pendente para os próximos dias.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}
          >
            {upcomingDeliveries.map((proj) => {
              const { day, month } = formatDeliveryDate(proj.dueDate);
              return (
                <div
                  key={proj.id}
                  onClick={() => onNavigate('projects', proj.id)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--cream-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'border-color var(--transition-fast)'
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '52px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--green-surface)',
                      color: '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <span style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1 }}>{day}</span>
                    <span style={{ fontSize: '0.66rem', letterSpacing: '0.08em', color: 'var(--sand-gold)', marginTop: '2px' }}>{month}</span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 650,
                        fontSize: '0.94rem',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {proj.name}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                      {proj.clientName} • <span style={{ color: 'var(--sand-gold-dark)', fontWeight: 600 }}>{proj.service}</span>
                    </div>
                  </div>

                  <Badge status={proj.status} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Clientes Recentes */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2
              className="font-serif"
              style={{
                fontSize: '1.6rem',
                fontWeight: 700,
                color: 'var(--green-deep)',
                margin: 0
              }}
            >
              Clientes recentes
            </h2>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('clients')}
            style={{ gap: '6px' }}
          >
            Ver carteira <ArrowRight size={14} />
          </button>
        </div>

        {recentClients.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              background: '#FFFFFF',
              border: '1px solid var(--cream-border)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center'
            }}
          >
            <p style={{ fontSize: '0.96rem', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              Nenhum cliente cadastrado ainda.
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onNavigate('clients')}
              style={{ gap: '6px', margin: '0 auto' }}
            >
              <Plus size={15} /> Cadastrar cliente
            </button>
          </div>
        ) : (
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--cream-border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div className="desktop-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th>Segmento</th>
                    <th>Contato Principal</th>
                    <th>Cidade / UF</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentClients.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => onNavigate('clients', client.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ fontWeight: 650, color: 'var(--text-primary)', fontSize: '0.94rem' }}>
                          {client.companyName}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {client.segment}
                      </td>
                      <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {client.contactName}
                      </td>
                      <td style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                        {client.city ? `${client.city}/${client.state || ''}` : '—'}
                      </td>
                      <td>
                        <Badge status={client.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
