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
  PhoneCall,
  CreditCard,
  Layers,
  FileCheck,
  CheckSquare,
  Sparkles,
  Target,
  Megaphone,
  Video,
  Image,
  Eye,
  Zap,
  FolderOpen
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
  ApprovalItem,
  ContentItem
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
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [cls, projs, tsks, lds, props, ctrs, fins, apprs, evts, acts, cnts] = await Promise.all([
          clientsService.getClients(),
          projectsService.getProjects(),
          phase2Service.getTasks(),
          phase2Service.getLeads(),
          phase2Service.getProposals(),
          phase2Service.getContracts(),
          phase2Service.getFinancialEntries(),
          phase2Service.getApprovals(),
          phase2Service.getEvents(),
          dashboardService.getRecentActivities(),
          phase2Service.getContentItems()
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
        setContents(cnts || []);
      } catch (err) {
        console.error('Erro ao carregar dashboard da agência:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 1. Operação da Agência
  const activeClients = clients.filter((c) => c.status === 'Ativo');
  const activeProjects = projects.filter((p) => p.status !== 'Finalizado');
  const openTasks = tasks.filter((t) => t.status !== 'Concluída');
  const delayedTasks = openTasks.filter((t) => t.dueDate && t.dueDate < todayStr);
  const upcomingDeliveries = activeProjects
    .filter((p) => p.dueDate && p.dueDate >= todayStr)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // 2. Criação & Mesa Criativa
  const pendingApprovals = approvals.filter((a) => a.status === 'Aguardando aprovação');
  const contentsInProduction = contents.filter((c) => c.status !== 'Publicado');
  const contentsScriptOrDesign = contents.filter((c) => c.status === 'Roteiro' || c.status === 'Design');

  // 3. Performance & Tráfego
  const metaAdsClients = clients.filter((c) => c.status === 'Ativo' && c.services?.includes('Meta Ads'));
  const googleAdsClients = clients.filter((c) => c.status === 'Ativo' && c.services?.includes('Google Ads'));
  const activeAdsCampaigns = activeProjects.filter(
    (p) => p.service === 'Meta Ads' || p.service === 'Google Ads' || p.name.toLowerCase().includes('ads') || p.name.toLowerCase().includes('campanha')
  );

  // 4. Comercial
  const activeLeads = leads.filter((l) => l.status !== 'Fechado' && l.status !== 'Perdido');
  const pendingProposals = proposals.filter((p) => p.status === 'Enviada' || p.status === 'Visualizada' || p.status === 'Rascunho');
  const isExpiringContract = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const diff = Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 30;
  };
  const expiringContracts = contracts.filter((c) => c.status === 'Ativo' && isExpiringContract(c.endDate));

  // Financeiro
  const pendingFinancialEntries = financials.filter((f) => f.status === 'Pendente');
  const pendingFinancialSum = pendingFinancialEntries.reduce((sum, f) => sum + (f.value || 0), 0);
  const paidFinancialEntries = financials.filter((f) => f.status === 'Pago');
  const paidFinancialSum = paidFinancialEntries.reduce((sum, f) => sum + (f.value || 0), 0);

  // 5. Central do Dia (Hoje)
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
  const todayEvents = events.filter((e) => e.date === todayStr);
  const todayDeliveries = activeProjects.filter((p) => p.dueDate === todayStr);
  const todayFollowUps = leads.filter((l) => l.nextFollowUp === todayStr && l.status !== 'Fechado' && l.status !== 'Perdido');
  const todayFinancialDue = financials.filter((f) => f.dueDate === todayStr && f.status !== 'Pago');

  // Projetos que exigem atenção
  const attentionProjects = activeProjects.filter(
    (p) => (p.dueDate && p.dueDate < todayStr) || p.status === 'Aguardando cliente'
  );

  const totalUrgentIssues = delayedTasks.length + expiringContracts.length + pendingApprovals.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header Editorial da Agência */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--cream-border)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: 'var(--sand-gold-dark)',
                  background: 'var(--sand-gold-tint)',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                Creative & Business Operations
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                • Central da Agência Alicerce
              </span>
            </div>
            <h1
              className="font-heading"
              style={{
                fontSize: '2.4rem',
                fontWeight: 700,
                color: 'var(--green-deep)',
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.15
              }}
            >
              Visão Geral da Agência
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#FFFFFF',
                border: '1px solid var(--cream-border)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Calendar size={15} color="var(--sand-gold-dark)" />
              <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onNavigate('tasks', { action: 'create' })}
              style={{ gap: '6px' }}
            >
              <Sparkles size={14} /> Nova Demanda
            </button>
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', margin: '4px 0 0', fontWeight: 400, maxWidth: '900px' }}>
          {totalUrgentIssues > 0 ? (
            <span>
              A agência opera hoje com <strong>{activeClients.length} contas ativas</strong> e <strong>{activeProjects.length} projetos em produção</strong>. Há <strong>{totalUrgentIssues} prioridades</strong> requerendo direcionamento imediato.
            </span>
          ) : (
            <span>
              Operação rodando com excelência: <strong>{activeClients.length} contas atendidas</strong>, <strong>{activeProjects.length} projetos em andamento</strong> e entregas em dia.
            </span>
          )}
        </p>
      </section>

      {/* 4 PILARES DA AGÊNCIA: OPERAÇÃO • CRIAÇÃO • PERFORMANCE • COMERCIAL */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2
            style={{
              fontSize: '0.76rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--sand-gold-dark)',
              margin: 0,
              fontFamily: 'var(--font-heading)'
            }}
          >
            Pilares Estratégicos da Agência
          </h2>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Clique no card para abrir o módulo
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}
        >
          {/* 1. OPERAÇÃO */}
          <div
            onClick={() => onNavigate('projects')}
            className="card clickable-metric"
            style={{
              padding: '20px 22px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
              borderLeft: '4px solid var(--green-primary)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--green-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)' }}>
                  Operação
                </span>
                <Briefcase size={16} color="var(--green-primary)" />
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--green-deep)', lineHeight: 1.1, marginTop: '8px', fontFamily: 'var(--font-heading)' }}>
                {activeProjects.length}
              </div>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                projetos em produção
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--cream-border-subtle)', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{activeClients.length} contas • {openTasks.length} tarefas</span>
              <ArrowUpRight size={13} color="var(--text-muted)" />
            </div>
          </div>

          {/* 2. CRIAÇÃO & MESA CRIATIVA */}
          <div
            onClick={() => onNavigate('approvals')}
            className="card clickable-metric"
            style={{
              padding: '20px 22px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
              borderLeft: '4px solid var(--sand-gold)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--sand-gold-dark)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)' }}>
                  Mesa Criativa
                </span>
                <Sparkles size={16} color="var(--sand-gold-dark)" />
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--green-deep)', lineHeight: 1.1, marginTop: '8px', fontFamily: 'var(--font-heading)' }}>
                {pendingApprovals.length}
              </div>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                peças aguardando aprovação
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--cream-border-subtle)', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{contentsInProduction.length} conteúdos no fluxo editorial</span>
              <ArrowUpRight size={13} color="var(--text-muted)" />
            </div>
          </div>

          {/* 3. PERFORMANCE & ANÚNCIOS */}
          <div
            onClick={() => onNavigate('clients')}
            className="card clickable-metric"
            style={{
              padding: '20px 22px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
              borderLeft: '4px solid #3B82F6'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)' }}>
                  Performance
                </span>
                <Megaphone size={16} color="#2563EB" />
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--green-deep)', lineHeight: 1.1, marginTop: '8px', fontFamily: 'var(--font-heading)' }}>
                {metaAdsClients.length + googleAdsClients.length}
              </div>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                contas com campanhas ativas
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--cream-border-subtle)', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{metaAdsClients.length} Meta Ads • {googleAdsClients.length} Google Ads</span>
              <ArrowUpRight size={13} color="var(--text-muted)" />
            </div>
          </div>

          {/* 4. COMERCIAL & PIPELINE */}
          <div
            onClick={() => onNavigate('leads')}
            className="card clickable-metric"
            style={{
              padding: '20px 22px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
              borderLeft: '4px solid #10B981'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)' }}>
                  Comercial
                </span>
                <TrendingUp size={16} color="#059669" />
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--green-deep)', lineHeight: 1.1, marginTop: '8px', fontFamily: 'var(--font-heading)' }}>
                {activeLeads.length}
              </div>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                leads ativos no funil
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--cream-border-subtle)', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{pendingProposals.length} propostas em negociação</span>
              <ArrowUpRight size={13} color="var(--text-muted)" />
            </div>
          </div>
        </div>
      </section>

      {/* BLOCO CENTRAL: HOJE NA AGÊNCIA */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
              Hoje na Agência
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '2px 0 0' }}>
              Tarefas prioritárias, reuniões de alinhamento, entregas e follow-ups agendados para hoje.
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px'
          }}
        >
          {/* Tarefas de Hoje */}
          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={16} color="var(--green-primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--green-deep)', fontFamily: 'var(--font-heading)' }}>Tarefas de Hoje</span>
              </div>
              <span style={{ fontSize: '0.74rem', background: 'var(--cream-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>
                {todayTasks.length}
              </span>
            </div>

            {todayTasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0, padding: '6px 0' }}>Nenhuma tarefa com prazo hoje.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todayTasks.slice(0, 4).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onNavigate('tasks', { id: t.id })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.84rem',
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
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '6px' }}>
                      {t.responsible}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reuniões e Agenda */}
          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} color="var(--sand-gold-dark)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--green-deep)', fontFamily: 'var(--font-heading)' }}>Reuniões & Agenda</span>
              </div>
              <span style={{ fontSize: '0.74rem', background: 'var(--cream-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>
                {todayEvents.length}
              </span>
            </div>

            {todayEvents.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0, padding: '6px 0' }}>Nenhum compromisso marcado.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todayEvents.slice(0, 4).map((e) => (
                  <div
                    key={e.id}
                    onClick={() => onNavigate('calendar')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--cream-subtle)'
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--sand-gold-dark)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{e.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Entregas do Dia */}
          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={16} color="var(--green-primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--green-deep)', fontFamily: 'var(--font-heading)' }}>Entregas do Dia</span>
              </div>
              <span style={{ fontSize: '0.74rem', background: 'var(--cream-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>
                {todayDeliveries.length}
              </span>
            </div>

            {todayDeliveries.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0, padding: '6px 0' }}>Nenhum projeto com entrega hoje.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todayDeliveries.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onNavigate('projects', { id: p.id })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.84rem',
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

          {/* Follow-ups Comerciais */}
          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PhoneCall size={16} color="var(--sand-gold-dark)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--green-deep)', fontFamily: 'var(--font-heading)' }}>Follow-ups Comerciais</span>
              </div>
              <span style={{ fontSize: '0.74rem', background: 'var(--cream-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>
                {todayFollowUps.length}
              </span>
            </div>

            {todayFollowUps.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0, padding: '6px 0' }}>Nenhum follow-up para hoje.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todayFollowUps.slice(0, 4).map((l) => (
                  <div
                    key={l.id}
                    onClick={() => onNavigate('leads', { id: l.id })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--cream-subtle)'
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{l.company}</span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--sand-gold-dark)', fontWeight: 600 }}>{l.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MESA CRIATIVA: PEÇAS EM APROVAÇÃO & CONTEÚDOS */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
              Mesa de Criação & Aprovações
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '2px 0 0' }}>
              Peças criativas aguardando revisão e fluxos editoriais em andamento na agência.
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('approvals')} style={{ gap: '6px' }}>
            Ver Mesa Completa <ArrowRight size={13} />
          </button>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="card" style={{ padding: '28px', textAlign: 'center' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--status-active-bg)', color: 'var(--status-active-text)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
              <CheckCircle2 size={20} />
            </div>
            <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--green-deep)', fontFamily: 'var(--font-heading)' }}>Mesa Criativa sem Pendências</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
              Todas as peças e criativos foram aprovados pelos clientes.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: '16px'
            }}
          >
            {pendingApprovals.slice(0, 4).map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate('approvals')}
                className="card clickable-metric"
                style={{
                  padding: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: 'var(--sand-gold-dark)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      {item.clientName}
                    </span>
                    <Badge status={item.status} />
                  </div>
                  <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3, fontFamily: 'var(--font-heading)' }}>
                    {item.title}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Tipo: <strong style={{ color: 'var(--text-secondary)' }}>{item.type}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--cream-border-subtle)', fontSize: '0.76rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Resp: {item.responsible}</span>
                  <span style={{ fontWeight: 600, color: 'var(--green-primary)', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'var(--font-heading)' }}>
                    Revisar peça <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* PROJETOS EM PRODUÇÃO & CONTAS DE TRÁFEGO */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px'
        }}
      >
        {/* Projetos em Produção */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--sand-gold-dark)', fontFamily: 'var(--font-heading)' }}>
                Andamento Operacional
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--green-deep)', margin: '2px 0 0', fontFamily: 'var(--font-heading)' }}>
                Projetos em Produção
              </h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('projects')}>
              Ver Todos <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeProjects.slice(0, 4).map((p) => (
              <div
                key={p.id}
                onClick={() => onNavigate('projects', { id: p.id })}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--cream-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 650, fontSize: '0.9rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                    {p.name}
                  </span>
                  <Badge status={p.service} type="service" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>{p.clientName}</span>
                  <span style={{ fontWeight: 600, color: 'var(--green-primary)', fontFamily: 'var(--font-heading)' }}>{p.progress || 0}%</span>
                </div>
                {/* Barra de progresso */}
                <div style={{ width: '100%', height: '4px', background: 'var(--cream-border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${p.progress || 0}%`,
                      height: '100%',
                      background: 'var(--green-primary)',
                      borderRadius: '2px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contas em Performance / Campanhas Ativas */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--sand-gold-dark)', fontFamily: 'var(--font-heading)' }}>
                Tráfego Pago & Performance
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--green-deep)', margin: '2px 0 0', fontFamily: 'var(--font-heading)' }}>
                Contas com Campanhas
              </h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('clients')}>
              Ver Contas <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {metaAdsClients.concat(googleAdsClients.filter(gc => !metaAdsClients.find(mc => mc.id === gc.id))).slice(0, 4).map((c) => (
              <div
                key={c.id}
                onClick={() => onNavigate('clients', { id: c.id })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--cream-subtle)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: 'var(--green-deep)',
                      color: 'var(--sand-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-heading)'
                    }}
                  >
                    {c.companyName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 650, fontSize: '0.9rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                      {c.companyName}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {c.segment}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  {c.services.filter((s) => s.includes('Ads')).map((svc) => (
                    <Badge key={svc} status={svc} type="service" />
                  ))}
                </div>
              </div>
            ))}

            {metaAdsClients.length === 0 && googleAdsClients.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, padding: '16px 0', textAlign: 'center' }}>
                Nenhuma conta com serviço de Ads cadastrada.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* PIPELINE COMERCIAL & FLUXO FINANCEIRO */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px'
        }}
      >
        {/* Bloco Comercial */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--sand-gold-dark)', fontFamily: 'var(--font-heading)' }}>
                Funil de Vendas
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--green-deep)', margin: '2px 0 0', fontFamily: 'var(--font-heading)' }}>
                Leads em Negociação
              </h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('leads')}>
              Ver Leads <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {leads.slice(0, 3).map((l) => (
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
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontWeight: 650, fontSize: '0.88rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{l.company}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {l.name} • {l.serviceInterest}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--green-deep)', fontFamily: 'var(--font-heading)' }}>
                    R$ {(l.estimatedValue || 0).toLocaleString('pt-BR')}
                  </div>
                  <Badge status={l.status} />
                </div>
              </div>
            ))}

            {leads.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0, padding: '12px 0' }}>
                Nenhum lead em negociação no momento.
              </p>
            )}
          </div>
        </div>

        {/* Bloco Financeiro */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--sand-gold-dark)', fontFamily: 'var(--font-heading)' }}>
                Faturamento & Caixa
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--green-deep)', margin: '2px 0 0', fontFamily: 'var(--font-heading)' }}>
                Financeiro da Agência
              </h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('financial')}>
              Ver Faturas <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div style={{ background: 'var(--cream-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Realizado</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 750, color: 'var(--status-active-text)', marginTop: '2px', fontFamily: 'var(--font-heading)' }}>
                R$ {paidFinancialSum.toLocaleString('pt-BR')}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{paidFinancialEntries.length} recebimentos</span>
            </div>

            <div style={{ background: 'var(--cream-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>A Liquidar</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 750, color: 'var(--green-deep)', marginTop: '2px', fontFamily: 'var(--font-heading)' }}>
                R$ {pendingFinancialSum.toLocaleString('pt-BR')}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{pendingFinancialEntries.length} pendentes</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {financials.slice(0, 2).map((f) => (
              <div
                key={f.id}
                onClick={() => onNavigate('financial', { id: f.id })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--cream-subtle)',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-primary)' }}>{f.clientName}</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Vence em {new Date(f.dueDate).toLocaleDateString('pt-BR')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--green-deep)', fontFamily: 'var(--font-heading)' }}>
                    R$ {f.value.toLocaleString('pt-BR')}
                  </span>
                  <div><Badge status={f.status} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HISTÓRICO RECENTE DA AGÊNCIA */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="font-heading" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
              Atividades Recentes
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '2px 0 0' }}>
              Histórico operacional das contas, entregas e publicações da agência.
            </p>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="card" style={{ padding: '28px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
              Nenhuma atividade registrada hoje ainda. As atualizações aparecem aqui em tempo real.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: '14px 20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {activities.slice(0, 6).map((act, index) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    fontSize: '0.86rem',
                    borderBottom: index < Math.min(activities.length, 6) - 1 ? '1px solid var(--cream-border-subtle)' : 'none',
                    padding: '10px 0'
                  }}
                >
                  <div style={{ maxWidth: '85%' }}>
                    <div style={{ fontWeight: 650, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{act.title}</div>
                    <p style={{ color: 'var(--text-secondary)', margin: '2px 0 0', fontSize: '0.82rem' }}>{act.description}</p>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '12px' }}>
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
