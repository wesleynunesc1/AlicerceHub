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
  ChevronRight,
  PhoneCall,
  CreditCard,
  Layers,
  FileCheck,
  CheckSquare
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

  // 1. Indicadores com Hierarquia
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
  const paidFinancialEntries = financials.filter((f) => f.status === 'Pago');
  const paidFinancialSum = paidFinancialEntries.reduce((sum, f) => sum + (f.value || 0), 0);

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

  const totalUrgentIssues = delayedTasks.length + expiringContractsCount + pendingApprovalsCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Bloco Superior: Visão Geral da Operação */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--cream-border)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: 'var(--sand-gold-dark)'
                }}
              >
                Alicerce OS • Central Operacional
              </span>
            </div>
            <h1
              className="font-serif"
              style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: 'var(--green-deep)',
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.15
              }}
            >
              Dashboard
            </h1>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: '#FFFFFF',
              border: '1px solid var(--cream-border)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Calendar size={16} color="var(--sand-gold-dark)" />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', margin: '4px 0 0', fontWeight: 450, maxWidth: '850px' }}>
          {totalUrgentIssues > 0 ? (
            <span>
              Operação com <strong>{activeClientsCount} clientes ativos</strong> e <strong>{activeProjects.length} projetos em andamento</strong>. Há <strong>{totalUrgentIssues} pendências</strong> requerendo sua atenção imediata hoje.
            </span>
          ) : (
            <span>
              Operação perfeitamente em dia com <strong>{activeClientsCount} clientes ativos</strong> e <strong>{activeProjects.length} projetos em andamento</strong> sem atrasos críticos.
            </span>
          )}
        </p>
      </section>

      {/* 1. Indicadores com Hierarquia de Importância */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Nível 1: Atenção Imediata (Destaque Nobre) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2
              style={{
                fontSize: '0.76rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--sand-gold-dark)',
                margin: 0
              }}
            >
              Atenção Imediata
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Clique para resolver diretamente na lista filtrada
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}
          >
            {/* 1. Tarefas Atrasadas */}
            <div
              onClick={() => onNavigate('tasks', { filter: 'atrasada' })}
              className="clickable-metric"
              style={{
                background: delayedTasks.length > 0 ? '#FFF8F8' : '#FFFFFF',
                border: delayedTasks.length > 0 ? '1px solid #FECACA' : '1px solid var(--cream-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '22px 24px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 650, color: delayedTasks.length > 0 ? '#DC2626' : 'var(--text-muted)' }}>
                    Tarefas Atrasadas
                  </span>
                  <div style={{ fontSize: '2.4rem', fontWeight: 800, color: delayedTasks.length > 0 ? '#B91C1C' : 'var(--green-deep)', lineHeight: 1.1, marginTop: '4px' }}>
                    {delayedTasks.length}
                  </div>
                </div>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: delayedTasks.length > 0 ? '#FEE2E2' : 'var(--cream-subtle)',
                    color: delayedTasks.length > 0 ? '#DC2626' : 'var(--green-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {delayedTasks.length > 0 ? 'Exigem replanejamento urgente' : 'Nenhuma tarefa em atraso'}
                </span>
                <ArrowUpRight size={14} className="clickable-metric-arrow" color="var(--text-muted)" />
              </div>
            </div>

            {/* 2. Contratos Vencendo */}
            <div
              onClick={() => onNavigate('contracts', { filter: 'vencendo' })}
              className="clickable-metric"
              style={{
                background: expiringContractsCount > 0 ? '#FFFBF2' : '#FFFFFF',
                border: expiringContractsCount > 0 ? '1px solid #FDE68A' : '1px solid var(--cream-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '22px 24px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 650, color: expiringContractsCount > 0 ? '#B45309' : 'var(--text-muted)' }}>
                    Contratos Vencendo (30d)
                  </span>
                  <div style={{ fontSize: '2.4rem', fontWeight: 800, color: expiringContractsCount > 0 ? '#92400E' : 'var(--green-deep)', lineHeight: 1.1, marginTop: '4px' }}>
                    {expiringContractsCount}
                  </div>
                </div>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: expiringContractsCount > 0 ? '#FEF3C7' : 'var(--cream-subtle)',
                    color: expiringContractsCount > 0 ? '#B45309' : 'var(--sand-gold-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FileCheck2 size={18} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {expiringContractsCount > 0 ? 'Exigem proposta de renovação' : 'Sem renovações imediatas'}
                </span>
                <ArrowUpRight size={14} className="clickable-metric-arrow" color="var(--text-muted)" />
              </div>
            </div>

            {/* 3. Aprovações Aguardando */}
            <div
              onClick={() => onNavigate('approvals', { filter: 'aguardando' })}
              className="clickable-metric"
              style={{
                background: pendingApprovalsCount > 0 ? '#FDFBF7' : '#FFFFFF',
                border: pendingApprovalsCount > 0 ? '1px solid var(--sand-gold)' : '1px solid var(--cream-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '22px 24px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 650, color: 'var(--sand-gold-dark)' }}>
                    Aprovações Pendentes
                  </span>
                  <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--green-deep)', lineHeight: 1.1, marginTop: '4px' }}>
                    {pendingApprovalsCount}
                  </div>
                </div>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--sand-gold-tint)',
                    color: 'var(--sand-gold-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FileCheck size={18} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {pendingApprovalsCount > 0 ? 'Aguardando validação do cliente' : 'Todas as entregas validadas'}
                </span>
                <ArrowUpRight size={14} className="clickable-metric-arrow" color="var(--text-muted)" />
              </div>
            </div>
          </div>
        </div>

        {/* Nível 2: Ritmo Operacional e Crescimento (6 cards estruturados) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2
              style={{
                fontSize: '0.76rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--text-muted)',
                margin: 0
              }}
            >
              Ritmo Operacional & Comercial
            </h2>
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
            {/* Clientes Ativos */}
            <div
              onClick={() => onNavigate('clients', { filter: 'Ativo' })}
              className="clickable-metric"
              style={{
                padding: '18px 20px',
                borderRight: '1px solid var(--cream-border-subtle)',
                borderBottom: '1px solid var(--cream-border-subtle)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Clientes Ativos</span>
                <ArrowUpRight size={13} className="clickable-metric-arrow" color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 750, color: 'var(--green-deep)', marginTop: '2px' }}>
                {activeClientsCount}
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>carteira sob gestão</span>
            </div>

            {/* Projetos Ativos */}
            <div
              onClick={() => onNavigate('projects', { filter: 'Ativo' })}
              className="clickable-metric"
              style={{
                padding: '18px 20px',
                borderRight: '1px solid var(--cream-border-subtle)',
                borderBottom: '1px solid var(--cream-border-subtle)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Projetos Ativos</span>
                <ArrowUpRight size={13} className="clickable-metric-arrow" color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 750, color: 'var(--green-deep)', marginTop: '2px' }}>
                {activeProjects.length}
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>em produção / revisão</span>
            </div>

            {/* Entregas Próximas */}
            <div
              onClick={() => onNavigate('calendar', { filter: 'Entrega' })}
              className="clickable-metric"
              style={{
                padding: '18px 20px',
                borderRight: '1px solid var(--cream-border-subtle)',
                borderBottom: '1px solid var(--cream-border-subtle)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Entregas Próximas</span>
                <ArrowUpRight size={13} className="clickable-metric-arrow" color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 750, color: 'var(--green-deep)', marginTop: '2px' }}>
                {upcomingDeliveries.length}
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>no cronograma ativo</span>
            </div>

            {/* Leads Ativos */}
            <div
              onClick={() => onNavigate('leads', { filter: 'ativos' })}
              className="clickable-metric"
              style={{
                padding: '18px 20px',
                borderRight: '1px solid var(--cream-border-subtle)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Leads no Funil</span>
                <ArrowUpRight size={13} className="clickable-metric-arrow" color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 750, color: 'var(--sand-gold-dark)', marginTop: '2px' }}>
                {activeLeadsCount}
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>em prospecção / proposta</span>
            </div>

            {/* Propostas Pendentes */}
            <div
              onClick={() => onNavigate('proposals', { filter: 'pendentes' })}
              className="clickable-metric"
              style={{
                padding: '18px 20px',
                borderRight: '1px solid var(--cream-border-subtle)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Propostas Abertas</span>
                <ArrowUpRight size={13} className="clickable-metric-arrow" color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 750, color: 'var(--green-deep)', marginTop: '2px' }}>
                {pendingProposalsCount}
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>em negociação</span>
            </div>

            {/* Valores a Receber */}
            <div
              onClick={() => onNavigate('financial', { filter: 'pendente' })}
              className="clickable-metric"
              style={{
                padding: '18px 20px',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Previsão a Receber</span>
                <ArrowUpRight size={13} className="clickable-metric-arrow" color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 750, color: 'var(--green-deep)', marginTop: '4px' }}>
                R$ {pendingFinancialSum.toLocaleString('pt-BR')}
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                {pendingFinancialEntries.length} faturas em aberto
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Seção HOJE — Centralizando Reuniões, Tarefas, Entregas, Follow-ups e Vencimentos */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 className="font-serif" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
              Hoje na Operação
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: '3px 0 0' }}>
              Tarefas com vencimento, reuniões, entregas de projetos, follow-ups de leads e faturas de hoje.
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px'
          }}
        >
          {/* Tarefas de Hoje */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={16} color="var(--green-primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--green-deep)' }}>Tarefas para Hoje</span>
              </div>
              <span style={{ fontSize: '0.76rem', background: 'var(--cream-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {todayTasks.length}
              </span>
            </div>

            {todayTasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0, padding: '8px 0' }}>Nenhuma tarefa com prazo hoje.</p>
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
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--cream-subtle)',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '6px' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} color="var(--sand-gold-dark)" />
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--green-deep)' }}>Reuniões & Agenda</span>
              </div>
              <span style={{ fontSize: '0.76rem', background: 'var(--cream-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {todayEvents.length}
              </span>
            </div>

            {todayEvents.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0, padding: '8px 0' }}>Nenhum compromisso marcado.</p>
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
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--cream-subtle)'
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{e.title}</span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--sand-gold-dark)', fontWeight: 700 }}>{e.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Entregas do Dia */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={16} color="var(--green-primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--green-deep)' }}>Entregas de Projetos</span>
              </div>
              <span style={{ fontSize: '0.76rem', background: 'var(--cream-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {todayDeliveries.length}
              </span>
            </div>

            {todayDeliveries.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0, padding: '8px 0' }}>Nenhum projeto com entrega hoje.</p>
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
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--cream-subtle)'
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.name}</span>
                    <Badge status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Follow-ups com Leads */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PhoneCall size={16} color="var(--sand-gold-dark)" />
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--green-deep)' }}>Follow-ups Comerciais</span>
              </div>
              <span style={{ fontSize: '0.76rem', background: 'var(--cream-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {todayFollowUps.length}
              </span>
            </div>

            {todayFollowUps.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0, padding: '8px 0' }}>Nenhum follow-up para hoje.</p>
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
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--cream-subtle)'
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{l.company}</span>
                    <span style={{ fontSize: '0.76rem', color: 'var(--sand-gold-dark)', fontWeight: 650 }}>{l.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vencimentos Financeiros */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={16} color="var(--green-primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--green-deep)' }}>Faturas de Hoje</span>
              </div>
              <span style={{ fontSize: '0.76rem', background: 'var(--cream-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {todayFinancialDue.length}
              </span>
            </div>

            {todayFinancialDue.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0, padding: '8px 0' }}>Nenhum recebível hoje.</p>
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
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--cream-subtle)'
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{f.clientName}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--green-deep)', fontWeight: 750 }}>
                      R$ {f.value.toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Projetos Críticos (Apenas o que merece atenção) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 className="font-serif" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
              Projetos que Exigem Atenção
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: '3px 0 0' }}>
              Filtro estrito de projetos com prazos ultrapassados ou pendentes de ação de aprovação externa.
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('projects')} style={{ gap: '6px' }}>
            Ver todos os projetos <ArrowRight size={14} />
          </button>
        </div>

        {attentionProjects.length === 0 ? (
          <div className="card" style={{ padding: '36px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--status-active-bg)',
                color: 'var(--status-active-text)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}
            >
              <CheckCircle2 size={24} />
            </div>
            <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: 'var(--green-deep)' }}>Operação em Conformidade</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0, fontWeight: 450 }}>
              Nenhum projeto com cronograma vencido ou travado aguardando cliente.
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
                        <td style={{ fontSize: '0.88rem', fontWeight: 650, color: isLate ? '#DC2626' : 'var(--text-primary)' }}>
                          {new Date(p.dueDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 650,
                              padding: '4px 10px',
                              borderRadius: '4px',
                              background: isLate ? '#FEE2E2' : '#FFF1EA',
                              color: isLate ? '#B91C1C' : '#A44512'
                            }}
                          >
                            {isLate ? 'Prazo ultrapassado' : 'Aguardando validação do cliente'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mobile-cards-container" style={{ padding: '16px' }}>
              {attentionProjects.map((p) => {
                const isLate = p.dueDate < todayStr;
                return (
                  <div
                    key={p.id}
                    className="mobile-item-card"
                    onClick={() => onNavigate('projects', { id: p.id })}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="mobile-item-header">
                      <div className="mobile-item-title">{p.name}</div>
                      <Badge status={p.service} type="service" />
                    </div>
                    <div className="mobile-item-meta">
                      <div className="mobile-item-row">
                        <span className="mobile-item-label">Cliente</span>
                        <span className="mobile-item-val">{p.clientName}</span>
                      </div>
                      <div className="mobile-item-row">
                        <span className="mobile-item-label">Prazo</span>
                        <span className="mobile-item-val" style={{ color: isLate ? '#DC2626' : 'inherit', fontWeight: 650 }}>
                          {new Date(p.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="mobile-item-row">
                        <span className="mobile-item-label">Status</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 650, color: isLate ? '#DC2626' : '#A44512' }}>
                          {isLate ? 'Prazo ultrapassado' : 'Aguardando cliente'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 4. Comercial & Financeiro — Resumo Essencial Equilibrado */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px'
        }}
      >
        {/* Bloco Comercial: Síntese de Pipeline */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--sand-gold-dark)' }}>
                Funil de Vendas
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--green-deep)', margin: '2px 0 0' }}>
                Comercial
              </h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('leads')}>
              Ver Leads <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {leads.slice(0, 4).map((l) => (
              <div
                key={l.id}
                onClick={() => onNavigate('leads', { id: l.id })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--cream-subtle)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                <div>
                  <div style={{ fontWeight: 650, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{l.company}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {l.name} • {l.serviceInterest}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--green-deep)' }}>
                    R$ {(l.estimatedValue || 0).toLocaleString('pt-BR')}
                  </div>
                  <Badge status={l.status} />
                </div>
              </div>
            ))}

            {leads.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, padding: '12px 0' }}>
                Nenhum lead em negociação no momento.
              </p>
            )}
          </div>
        </div>

        {/* Bloco Financeiro: Síntese de Recebimentos */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--sand-gold-dark)' }}>
                Fluxo de Caixa
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--green-deep)', margin: '2px 0 0' }}>
                Financeiro
              </h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('financial')}>
              Ver Faturas <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div style={{ background: 'var(--cream-subtle)', padding: '14px 16px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>Recebido no Período</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--status-active-text)', marginTop: '2px' }}>
                R$ {paidFinancialSum.toLocaleString('pt-BR')}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{paidFinancialEntries.length} recebimentos</span>
            </div>

            <div style={{ background: 'var(--cream-subtle)', padding: '14px 16px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>Valores a Liquidar</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--green-deep)', marginTop: '2px' }}>
                R$ {pendingFinancialSum.toLocaleString('pt-BR')}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{pendingFinancialEntries.length} pendentes</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {financials.slice(0, 3).map((f) => (
              <div
                key={f.id}
                onClick={() => onNavigate('financial', { id: f.id })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--cream-subtle)',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>{f.clientName}</span>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Vence em {new Date(f.dueDate).toLocaleDateString('pt-BR')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--green-deep)' }}>
                    R$ {f.value.toLocaleString('pt-BR')}
                  </span>
                  <div><Badge status={f.status} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Atividade Recente do Sistema */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="font-serif" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
              Atividade Recente do Sistema
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: '3px 0 0' }}>
              Registro cronológico auditável de todas as ações operacionais da equipe.
            </p>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="card" style={{ padding: '36px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0 }}>
              Nenhuma atividade recente registrada ainda. Conforme as operações ocorrem, o histórico é registrado automaticamente.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {activities.slice(0, 8).map((act, index) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    fontSize: '0.88rem',
                    borderBottom: index < Math.min(activities.length, 8) - 1 ? '1px solid var(--cream-border-subtle)' : 'none',
                    padding: '12px 0'
                  }}
                >
                  <div style={{ maxWidth: '85%' }}>
                    <div style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{act.title}</div>
                    <p style={{ color: 'var(--text-secondary)', margin: '2px 0 0', fontSize: '0.84rem' }}>{act.description}</p>
                  </div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '16px' }}>
                    {act.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
