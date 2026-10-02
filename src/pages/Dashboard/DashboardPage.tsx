import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  Clock,
  Calendar,
  AlertTriangle,
  TrendingUp,
  FileText,
  FileCheck2,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import {
  Client,
  Project,
  Task,
  Lead,
  Proposal,
  Contract,
  CalendarEvent,
  ActivityItem
} from '../../types';
import { projectsService } from '../../services/projects';
import { clientsService } from '../../services/clients';
import { phase2Service } from '../../services/phase2';
import { dashboardService } from '../../services/dashboard';
import { Badge } from '../../components/Common/Badge';
import { NavTab } from '../../components/Layout/Sidebar';

interface DashboardPageProps {
  onNavigate: (tab: NavTab, targetId?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [cls, projs, tsks, lds, props, ctrs, evts, acts] = await Promise.all([
          clientsService.getClients(),
          projectsService.getProjects(),
          phase2Service.getTasks(),
          phase2Service.getLeads(),
          phase2Service.getProposals(),
          phase2Service.getContracts(),
          phase2Service.getEvents(),
          dashboardService.getRecentActivities()
        ]);
        setClients(cls);
        setProjects(projs);
        setTasks(tsks);
        setLeads(lds);
        setProposals(props);
        setContracts(ctrs);
        setEvents(evts);
        setActivities(acts);
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Cálculos de métricas solicitadas
  const activeClientsCount = clients.filter((c) => c.status === 'Ativo').length;
  const activeProjects = projects.filter((p) => p.status !== 'Finalizado');
  const delayedTasks = tasks.filter((t) => t.status !== 'Concluída' && t.dueDate < todayStr);
  const upcomingDeliveries = activeProjects
    .filter((p) => p.dueDate >= todayStr)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const activeLeadsCount = leads.filter((l) => l.status !== 'Fechado' && l.status !== 'Perdido').length;
  const openProposalsCount = proposals.filter((p) => p.status === 'Enviada' || p.status === 'Visualizada' || p.status === 'Rascunho').length;
  
  const isExpiringContract = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const diff = Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 30;
  };
  const expiringContractsCount = contracts.filter((c) => c.status === 'Ativo' && isExpiringContract(c.endDate)).length;
  const totalContractedMRR = contracts
    .filter((c) => c.status === 'Ativo' && c.recurrence === 'Mensal')
    .reduce((acc, c) => acc + c.value, 0);

  // Seção "Hoje"
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
  const todayEvents = events.filter((e) => e.date === todayStr);
  const todayDeliveries = activeProjects.filter((p) => p.dueDate === todayStr);

  // Projetos que precisam de atenção (Atrasados ou Aguardando cliente)
  const attentionProjects = activeProjects.filter(
    (p) => p.dueDate < todayStr || p.status === 'Aguardando cliente'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', maxWidth: '1400px' }}>
      {/* Header Funcional */}
      <div>
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
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', margin: '4px 0 0', fontWeight: 450 }}>
          Central de comando operacional, entregas imediatas e saúde do negócio.
        </p>
      </div>

      {/* 1. Visão Geral da Operação — Grid Editorial com os 8 Indicadores Solicitados */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--sand-gold-dark)',
            margin: 0
          }}
        >
          Visão Geral da Operação
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            background: '#FFFFFF',
            border: '1px solid var(--cream-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div
            onClick={() => onNavigate('clients')}
            style={{ padding: '20px 24px', borderRight: '1px solid var(--cream-border-subtle)', borderBottom: '1px solid var(--cream-border-subtle)', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 550 }}>Clientes Ativos</span>
            <div style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '4px' }}>{activeClientsCount}</div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>carteira ativa</span>
          </div>

          <div
            onClick={() => onNavigate('projects')}
            style={{ padding: '20px 24px', borderRight: '1px solid var(--cream-border-subtle)', borderBottom: '1px solid var(--cream-border-subtle)', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 550 }}>Projetos Ativos</span>
            <div style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '4px' }}>{activeProjects.length}</div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>em produção / revisão</span>
          </div>

          <div
            onClick={() => onNavigate('tasks')}
            style={{ padding: '20px 24px', borderRight: '1px solid var(--cream-border-subtle)', borderBottom: '1px solid var(--cream-border-subtle)', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 550 }}>Tarefas Atrasadas</span>
            <div style={{ fontSize: '2.1rem', fontWeight: 700, color: delayedTasks.length > 0 ? '#DC2626' : 'var(--status-active-text)', marginTop: '4px' }}>
              {delayedTasks.length}
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>prazo ultrapassado</span>
          </div>

          <div
            onClick={() => onNavigate('calendar')}
            style={{ padding: '20px 24px', borderBottom: '1px solid var(--cream-border-subtle)', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 550 }}>Entregas Próximas</span>
            <div style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '4px' }}>{upcomingDeliveries.length}</div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>cronograma imediato</span>
          </div>

          <div
            onClick={() => onNavigate('leads')}
            style={{ padding: '20px 24px', borderRight: '1px solid var(--cream-border-subtle)', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 550 }}>Leads Ativos</span>
            <div style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--sand-gold-dark)', marginTop: '4px' }}>{activeLeadsCount}</div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>no funil comercial</span>
          </div>

          <div
            onClick={() => onNavigate('proposals')}
            style={{ padding: '20px 24px', borderRight: '1px solid var(--cream-border-subtle)', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 550 }}>Propostas Abertas</span>
            <div style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '4px' }}>{openProposalsCount}</div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>aguardando aceite</span>
          </div>

          <div
            onClick={() => onNavigate('contracts')}
            style={{ padding: '20px 24px', borderRight: '1px solid var(--cream-border-subtle)', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 550 }}>Contratos Vencendo</span>
            <div style={{ fontSize: '2.1rem', fontWeight: 700, color: expiringContractsCount > 0 ? '#B45309' : 'var(--status-active-text)', marginTop: '4px' }}>
              {expiringContractsCount}
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>próximos 30 dias</span>
          </div>

          <div
            onClick={() => onNavigate('financial')}
            style={{ padding: '20px 24px', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 550 }}>Receita Contratada</span>
            <div style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '4px' }}>
              R$ {totalContractedMRR.toLocaleString('pt-BR')}
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>MRR mensal vigente</span>
          </div>
        </div>
      </section>

      {/* 2. Seção HOJE (Tarefas, Reuniões, Entregas do Dia) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h2 className="font-serif" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
          Hoje
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px'
          }}
        >
          {/* Tarefas de Hoje */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--green-deep)' }}>Tarefas para Hoje</span>
              <span style={{ fontSize: '0.78rem', background: 'var(--cream-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 650 }}>
                {todayTasks.length}
              </span>
            </div>

            {todayTasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>Nenhuma tarefa com prazo para hoje.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todayTasks.map((t) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 550 }}>{t.title}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.responsible}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reuniões e Agenda */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--green-deep)' }}>Reuniões & Compromissos</span>
              <span style={{ fontSize: '0.78rem', background: 'var(--cream-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 650 }}>
                {todayEvents.length}
              </span>
            </div>

            {todayEvents.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>Nenhum compromisso na agenda hoje.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todayEvents.map((e) => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 550 }}>{e.title}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--sand-gold-dark)', fontWeight: 600 }}>{e.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Entregas do Dia */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--green-deep)' }}>Entregas Marcadas para Hoje</span>
              <span style={{ fontSize: '0.78rem', background: 'var(--cream-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 650 }}>
                {todayDeliveries.length}
              </span>
            </div>

            {todayDeliveries.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>Nenhum projeto com entrega prevista para hoje.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todayDeliveries.map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 550 }}>{p.name} ({p.clientName})</span>
                    <Badge status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Projetos que Precisam de Atenção */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="font-serif" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
            Projetos que precisam de atenção
          </h2>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('projects')} style={{ gap: '6px' }}>
            Ver todos os projetos <ArrowRight size={14} />
          </button>
        </div>

        {attentionProjects.length === 0 ? (
          <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <CheckCircle2 size={24} color="var(--status-active-text)" style={{ marginBottom: '8px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', margin: 0, fontWeight: 550 }}>
              Operação em dia. Nenhum projeto com prazo atrasado ou travado aguardando cliente.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="desktop-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Projeto</th>
                    <th>Cliente</th>
                    <th>Serviço</th>
                    <th>Responsável</th>
                    <th>Prazo</th>
                    <th>Motivo de Atenção</th>
                  </tr>
                </thead>
                <tbody>
                  {attentionProjects.map((p) => {
                    const isLate = p.dueDate < todayStr;
                    return (
                      <tr key={p.id} onClick={() => onNavigate('projects', p.id)} style={{ cursor: 'pointer' }}>
                        <td>
                          <div style={{ fontWeight: 650, color: 'var(--text-primary)', fontSize: '0.94rem' }}>{p.name}</div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{p.clientName}</td>
                        <td><Badge status={p.service} type="service" /></td>
                        <td style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{p.responsible}</td>
                        <td style={{ fontSize: '0.88rem', fontWeight: 600, color: isLate ? '#DC2626' : 'var(--text-primary)' }}>
                          {new Date(p.dueDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 650,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: isLate ? '#FEE2E2' : '#FFF1EA',
                              color: isLate ? '#B91C1C' : '#A44512'
                            }}
                          >
                            {isLate ? 'Prazo ultrapassado' : 'Aguardando aprovação do cliente'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* 4. Atividade Recente */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
        <h2 className="font-serif" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
          Atividade Recente
        </h2>

        {activities.length === 0 ? (
          <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              Nenhuma atividade registrada na operação ainda.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {activities.slice(0, 6).map((act) => (
                <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', fontSize: '0.88rem', borderBottom: '1px solid var(--cream-border-subtle)', paddingBottom: '10px' }}>
                  <div>
                    <span style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{act.title}</span>
                    <p style={{ color: 'var(--text-secondary)', margin: '2px 0 0', fontSize: '0.82rem' }}>{act.description}</p>
                  </div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{act.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
