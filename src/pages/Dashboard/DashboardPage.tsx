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
  ExternalLink,
  ChevronRight,
  PhoneCall,
  CreditCard
} from 'lucide-react';
import {
  Client,
  Project,
  Task,
  Lead,
  Proposal,
  Contract,
  CalendarEvent,
  ActivityItem,
  FinancialEntry,
  ApprovalItem
} from '../../types';
import { projectsService } from '../../services/projects';
import { clientsService } from '../../services/clients';
import { phase2Service } from '../../services/phase2';
import { dashboardService } from '../../services/dashboard';
import { Badge } from '../../components/Common/Badge';
import { NavTab } from '../../components/Layout/Sidebar';

interface DashboardPageProps {
  onNavigate: (tab: NavTab, params?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [financials, setFinancials] = useState<FinancialEntry[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [cls, projs, tsks, lds, props, ctrs, fins, apprs, evts, acts] = await Promise.all([
          clientsService.getClients(),
          projectsService.getProjects(),
          phase2Service.getTasks(),
          phase2Service.getLeads(),
          phase2Service.getProposals(),
          phase2Service.getContracts(),
          phase2Service.getFinancialEntries(),
          phase2Service.getApprovals(),
          phase2Service.getEvents(),
          dashboardService.getRecentActivities()
        ]);
        setClients(cls || []);
        setProjects(projs || []);
        setTasks(tsks || []);
        setLeads(lds || []);
        setProposals(props || []);
        setContracts(ctrs || []);
        setFinancials(fins || []);
        setApprovals(apprs || []);
        setEvents(evts || []);
        setActivities(acts || []);
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 1. Os 9 Indicadores Operacionais Solicitados no Prompt
  const activeClientsCount = clients.filter((c) => c.status === 'Ativo').length;
  const activeProjects = projects.filter((p) => p.status !== 'Finalizado');
  const delayedTasks = tasks.filter((t) => t.status !== 'Concluída' && t.dueDate < todayStr);
  const upcomingDeliveries = activeProjects
    .filter((p) => p.dueDate >= todayStr)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const activeLeadsCount = leads.filter((l) => l.status !== 'Fechado' && l.status !== 'Perdido').length;
  const pendingProposalsCount = proposals.filter((p) => p.status === 'Enviada' || p.status === 'Visualizada' || p.status === 'Rascunho').length;

  const isExpiringContract = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const diff = Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 30;
  };
  const expiringContractsCount = contracts.filter((c) => c.status === 'Ativo' && isExpiringContract(c.endDate)).length;

  const pendingFinancialEntries = financials.filter((f) => f.status === 'Pendente');
  const pendingFinancialSum = pendingFinancialEntries.reduce((sum, f) => sum + (f.value || 0), 0);

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'Aguardando aprovação').length;

  // 2. Seção "Hoje"
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
  const todayEvents = events.filter((e) => e.date === todayStr);
  const todayDeliveries = activeProjects.filter((p) => p.dueDate === todayStr);
  const todayFollowUps = leads.filter((l) => l.nextFollowUp === todayStr && l.status !== 'Fechado' && l.status !== 'Perdido');
  const todayFinancialDue = financials.filter((f) => f.dueDate === todayStr && f.status !== 'Pago');

  // 3. Projetos que precisam de atenção (Atrasados ou Aguardando cliente)
  const attentionProjects = activeProjects.filter(
    (p) => p.dueDate < todayStr || p.status === 'Aguardando cliente'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', maxWidth: '1400px' }}>
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
          Central de comando operacional da Alicerce. Métricas em tempo real e ações imediatas.
        </p>
      </div>

      {/* 1. Visão Geral da Operação — Grid com os 9 Indicadores Solicitados */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Clique em qualquer indicador para abrir com filtro
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            background: '#FFFFFF',
            border: '1px solid var(--cream-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {/* 1. Clientes Ativos */}
          <div
            onClick={() => onNavigate('clients', { filter: 'Ativo' })}
            className="clickable-metric"
            style={{
              padding: '20px 22px',
              borderRight: '1px solid var(--cream-border-subtle)',
              borderBottom: '1px solid var(--cream-border-subtle)',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 550 }}>Clientes Ativos</span>
              <ArrowUpRight size={14} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '4px' }}>
              {activeClientsCount}
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>carteira ativa</span>
          </div>

          {/* 2. Projetos Ativos */}
          <div
            onClick={() => onNavigate('projects', { filter: 'Ativo' })}
            className="clickable-metric"
            style={{
              padding: '20px 22px',
              borderRight: '1px solid var(--cream-border-subtle)',
              borderBottom: '1px solid var(--cream-border-subtle)',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 550 }}>Projetos Ativos</span>
              <ArrowUpRight size={14} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '4px' }}>
              {activeProjects.length}
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>em produção / revisão</span>
          </div>

          {/* 3. Tarefas Atrasadas */}
          <div
            onClick={() => onNavigate('tasks', { filter: 'atrasada' })}
            className="clickable-metric"
            style={{
              padding: '20px 22px',
              borderRight: '1px solid var(--cream-border-subtle)',
              borderBottom: '1px solid var(--cream-border-subtle)',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 550 }}>Tarefas Atrasadas</span>
              <ArrowUpRight size={14} color="var(--text-muted)" />
            </div>
            <div
              style={{
                fontSize: '2.1rem',
                fontWeight: 700,
                color: delayedTasks.length > 0 ? '#DC2626' : 'var(--status-active-text)',
                marginTop: '4px'
              }}
            >
              {delayedTasks.length}
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>prazo ultrapassado</span>
          </div>

          {/* 4. Entregas Próximas */}
          <div
            onClick={() => onNavigate('calendar', { filter: 'Entrega' })}
            className="clickable-metric"
            style={{
              padding: '20px 22px',
              borderRight: '1px solid var(--cream-border-subtle)',
              borderBottom: '1px solid var(--cream-border-subtle)',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 550 }}>Entregas Próximas</span>
              <ArrowUpRight size={14} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '4px' }}>
              {upcomingDeliveries.length}
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>cronograma imediato</span>
          </div>

          {/* 5. Leads Ativos */}
          <div
            onClick={() => onNavigate('leads', { filter: 'ativos' })}
            className="clickable-metric"
            style={{
              padding: '20px 22px',
              borderRight: '1px solid var(--cream-border-subtle)',
              borderBottom: '1px solid var(--cream-border-subtle)',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 550 }}>Leads Ativos</span>
              <ArrowUpRight size={14} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--sand-gold-dark)', marginTop: '4px' }}>
              {activeLeadsCount}
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>no funil comercial</span>
          </div>

          {/* 6. Propostas Pendentes */}
          <div
            onClick={() => onNavigate('proposals', { filter: 'pendentes' })}
            className="clickable-metric"
            style={{
              padding: '20px 22px',
              borderRight: '1px solid var(--cream-border-subtle)',
              borderBottom: '1px solid var(--cream-border-subtle)',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 550 }}>Propostas Pendentes</span>
              <ArrowUpRight size={14} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '4px' }}>
              {pendingProposalsCount}
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>aguardando retorno</span>
          </div>

          {/* 7. Contratos Vencendo */}
          <div
            onClick={() => onNavigate('contracts', { filter: 'vencendo' })}
            className="clickable-metric"
            style={{
              padding: '20px 22px',
              borderRight: '1px solid var(--cream-border-subtle)',
              borderBottom: '1px solid var(--cream-border-subtle)',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 550 }}>Contratos Vencendo</span>
              <ArrowUpRight size={14} color="var(--text-muted)" />
            </div>
            <div
              style={{
                fontSize: '2.1rem',
                fontWeight: 700,
                color: expiringContractsCount > 0 ? '#B45309' : 'var(--status-active-text)',
                marginTop: '4px'
              }}
            >
              {expiringContractsCount}
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>próximos 30 dias</span>
          </div>

          {/* 8. Valores Pendentes */}
          <div
            onClick={() => onNavigate('financial', { filter: 'pendente' })}
            className="clickable-metric"
            style={{
              padding: '20px 22px',
              borderRight: '1px solid var(--cream-border-subtle)',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 550 }}>Valores Pendentes</span>
              <ArrowUpRight size={14} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '6px' }}>
              R$ {pendingFinancialSum.toLocaleString('pt-BR')}
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              {pendingFinancialEntries.length} lançamentos a receber
            </span>
          </div>

          {/* 9. Aprovações Aguardando */}
          <div
            onClick={() => onNavigate('approvals', { filter: 'aguardando' })}
            className="clickable-metric"
            style={{
              padding: '20px 22px',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 550 }}>Aprovações Pendentes</span>
              <ArrowUpRight size={14} color="var(--text-muted)" />
            </div>
            <div
              style={{
                fontSize: '2.1rem',
                fontWeight: 700,
                color: pendingApprovalsCount > 0 ? '#B45309' : 'var(--status-active-text)',
                marginTop: '4px'
              }}
            >
              {pendingApprovalsCount}
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>aguardando cliente</span>
          </div>
        </div>
      </section>

      {/* 2. Seção HOJE — Centralizando Reuniões, Tarefas, Entregas, Follow-ups e Vencimentos */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="font-serif" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
              Hoje
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '2px 0 0' }}>
              Compromissos, entregas e tarefas com vencimento para a data de hoje.
            </p>
          </div>
          <span style={{ fontSize: '0.84rem', fontWeight: 650, color: 'var(--sand-gold-dark)', background: 'var(--cream-subtle)', padding: '4px 12px', borderRadius: 'var(--radius-full)' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px'
          }}
        >
          {/* Tarefas de Hoje */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--green-deep)' }}>Tarefas para Hoje</span>
              <span style={{ fontSize: '0.76rem', background: 'var(--cream-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                {todayTasks.length}
              </span>
            </div>

            {todayTasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0 }}>Nenhuma tarefa com prazo hoje.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todayTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onNavigate('tasks', { id: t.id })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: 'var(--cream-subtle)'
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)', fontWeight: 550, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title}
                    </span>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '6px' }}>
                      {t.responsible}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reuniões e Agenda */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--green-deep)' }}>Reuniões & Agenda</span>
              <span style={{ fontSize: '0.76rem', background: 'var(--cream-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                {todayEvents.length}
              </span>
            </div>

            {todayEvents.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0 }}>Nenhum compromisso marcado.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todayEvents.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => onNavigate('calendar')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: 'var(--cream-subtle)'
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)', fontWeight: 550 }}>{e.title}</span>
                    <span style={{ fontSize: '0.76rem', color: 'var(--sand-gold-dark)', fontWeight: 650 }}>{e.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Entregas do Dia */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--green-deep)' }}>Entregas de Projetos</span>
              <span style={{ fontSize: '0.76rem', background: 'var(--cream-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                {todayDeliveries.length}
              </span>
            </div>

            {todayDeliveries.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0 }}>Nenhum projeto com entrega hoje.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todayDeliveries.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onNavigate('projects', { id: p.id })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: 'var(--cream-subtle)'
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)', fontWeight: 550 }}>{p.name}</span>
                    <Badge status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Follow-ups com Leads */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--green-deep)' }}>Follow-ups de Leads</span>
              <span style={{ fontSize: '0.76rem', background: 'var(--cream-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                {todayFollowUps.length}
              </span>
            </div>

            {todayFollowUps.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0 }}>Nenhum follow-up para hoje.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todayFollowUps.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => onNavigate('leads', { id: l.id })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: 'var(--cream-subtle)'
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)', fontWeight: 550 }}>{l.company}</span>
                    <span style={{ fontSize: '0.76rem', color: 'var(--sand-gold-dark)', fontWeight: 600 }}>{l.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vencimentos Financeiros */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--green-deep)' }}>Vencimentos Financeiros</span>
              <span style={{ fontSize: '0.76rem', background: 'var(--cream-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                {todayFinancialDue.length}
              </span>
            </div>

            {todayFinancialDue.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0 }}>Nenhum boleto/fatura hoje.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todayFinancialDue.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => onNavigate('financial', { id: f.id })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: 'var(--cream-subtle)'
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)', fontWeight: 550 }}>{f.clientName}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--green-deep)', fontWeight: 700 }}>
                      R$ {f.value.toLocaleString('pt-BR')}
                    </span>
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
          <div>
            <h2 className="font-serif" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
              Projetos que precisam de atenção
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '2px 0 0' }}>
              Projetos com prazos vencidos ou pendentes de ação de aprovação do cliente.
            </p>
          </div>
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
                      <tr key={p.id} onClick={() => onNavigate('projects', { id: p.id })} style={{ cursor: 'pointer' }}>
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
          Atividade Recente do Sistema
        </h2>

        {activities.length === 0 ? (
          <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              Nenhuma atividade registrada na operação ainda. Conforme as ações ocorrem, o histórico é registrado automaticamente.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {activities.slice(0, 8).map((act) => (
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
