import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Briefcase,
  CheckSquare,
  FileText,
  DollarSign,
  Users,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import {
  CalendarEvent,
  CalendarEventType,
  Project,
  Task,
  Contract,
  FinancialEntry,
  Lead,
  ApprovalItem
} from '../../types';
import { phase2Service } from '../../services/phase2';
import { projectsService } from '../../services/projects';
import { clientsService } from '../../services/clients';
import { Modal } from '../../components/Common/Modal';
import { useToast } from '../../components/Common/Toast';
import { NavTab } from '../../components/Layout/Sidebar';

interface CalendarPageProps {
  initialFilter?: string;
  onNavigate?: (tab: NavTab, params?: any) => void;
}

interface CalendarEntityEvent extends CalendarEvent {
  originalType: 'task' | 'project' | 'contract' | 'financial' | 'lead' | 'approval' | 'event';
  originalId: string;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  initialFilter,
  onNavigate
}) => {
  const { showToast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [financials, setFinancials] = useState<FinancialEntry[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [viewMode, setViewMode] = useState<'mes' | 'semana' | 'lista'>('mes');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    type: 'Reunião' as CalendarEventType,
    responsible: 'Wesley Nunes',
    clientId: '',
    projectId: '',
    notes: ''
  });

  const loadAll = async () => {
    const [evts, projs, tsks, ctrs, fins, lds, apprs] = await Promise.all([
      phase2Service.getEvents(),
      projectsService.getProjects(),
      phase2Service.getTasks(),
      phase2Service.getContracts(),
      phase2Service.getFinancialEntries(),
      phase2Service.getLeads(),
      phase2Service.getApprovals()
    ]);
    setEvents(evts || []);
    setProjects(projs || []);
    setTasks(tsks || []);
    setContracts(ctrs || []);
    setFinancials(fins || []);
    setLeads(lds || []);
    setApprovals(apprs || []);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Agregação automática solicitada no Prompt: Tarefas com prazo, Entregas, Follow-ups, Reuniões, Contratos, Vencimentos, Aprovações
  const allEvents: CalendarEntityEvent[] = [
    ...events.map((e) => ({
      ...e,
      originalType: 'event' as const,
      originalId: e.id
    })),
    ...projects.map((p) => ({
      id: `proj-due-${p.id}`,
      title: `Entrega: ${p.name}`,
      date: p.dueDate,
      time: '18:00',
      type: 'Entrega' as CalendarEventType,
      responsible: p.responsible,
      clientId: p.clientId,
      clientName: p.clientName,
      projectId: p.id,
      projectName: p.name,
      originalType: 'project' as const,
      originalId: p.id
    })),
    ...tasks.map((t) => ({
      id: `task-due-${t.id}`,
      title: `Tarefa: ${t.title}`,
      date: t.dueDate,
      time: '18:00',
      type: 'Tarefa' as CalendarEventType,
      responsible: t.responsible,
      clientId: t.clientId,
      clientName: t.clientName,
      projectId: t.projectId,
      projectName: t.projectName,
      originalType: 'task' as const,
      originalId: t.id
    })),
    ...contracts.map((c) => ({
      id: `ctr-due-${c.id}`,
      title: `Vencimento: ${c.clientName}`,
      date: c.endDate,
      time: '12:00',
      type: 'Contrato' as CalendarEventType,
      responsible: 'Comercial',
      clientId: c.clientId,
      clientName: c.clientName,
      originalType: 'contract' as const,
      originalId: c.id
    })),
    ...financials.map((f) => ({
      id: `fin-due-${f.id}`,
      title: `Recebível: ${f.clientName} (R$ ${f.value.toLocaleString('pt-BR')})`,
      date: f.dueDate,
      time: '12:00',
      type: 'Financeiro' as CalendarEventType,
      responsible: 'Financeiro',
      clientId: f.clientId,
      clientName: f.clientName,
      originalType: 'financial' as const,
      originalId: f.id
    })),
    ...leads
      .filter((l) => l.nextFollowUp && l.status !== 'Fechado' && l.status !== 'Perdido')
      .map((l) => ({
        id: `lead-fu-${l.id}`,
        title: `Follow-up: ${l.company}`,
        date: l.nextFollowUp!,
        time: '14:00',
        type: 'Reunião' as CalendarEventType,
        responsible: l.responsible,
        notes: `Qualificação comercial de ${l.serviceOfInterest}`,
        originalType: 'lead' as const,
        originalId: l.id
      })),
    ...approvals
      .filter((a) => a.status === 'Aguardando aprovação')
      .map((a) => ({
        id: `appr-due-${a.id}`,
        title: `Aprovação: ${a.title}`,
        date: new Date().toISOString().split('T')[0],
        time: '17:00',
        type: 'Entrega' as CalendarEventType,
        responsible: a.responsible,
        clientId: a.clientId,
        clientName: a.clientName,
        projectId: a.projectId,
        projectName: a.projectName,
        originalType: 'approval' as const,
        originalId: a.id
      }))
  ];

  // Ao clicar em evento: Abre entidade original conforme regra do Prompt
  const handleEventClick = (evt: CalendarEntityEvent) => {
    if (!onNavigate) return;

    switch (evt.originalType) {
      case 'task':
        onNavigate('tasks', { id: evt.originalId });
        break;
      case 'project':
        onNavigate('projects', { id: evt.originalId });
        break;
      case 'contract':
        onNavigate('contracts', { id: evt.originalId });
        break;
      case 'financial':
        onNavigate('financial', { id: evt.originalId });
        break;
      case 'lead':
        onNavigate('leads', { id: evt.originalId });
        break;
      case 'approval':
        onNavigate('approvals', { id: evt.originalId });
        break;
      default:
        showToast(`Evento: ${evt.title} (${evt.time})`, 'info');
        break;
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    await phase2Service.saveEvent(formData);
    showToast('Evento agendado com sucesso.', 'success');
    setIsModalOpen(false);
    loadAll();
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const getEventTypeColor = (type: CalendarEventType) => {
    switch (type) {
      case 'Reunião':
        return { bg: '#E0F2FE', color: '#0369A1', border: '#BAE6FD' };
      case 'Entrega':
        return { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' };
      case 'Tarefa':
        return { bg: 'var(--cream-subtle)', color: 'var(--green-deep)', border: 'var(--cream-border)' };
      case 'Contrato':
        return { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
      case 'Financeiro':
        return { bg: '#EAF5EE', color: '#1B6346', border: '#C6E7D2' };
      default:
        return { bg: '#F4F1EA', color: '#5C5449', border: '#E6E1D8' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
            Agenda Operacional
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', margin: 0, fontWeight: 450 }}>
            Cronograma unificado de tarefas, entregas de projetos, follow-ups e vencimentos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ display: 'flex', background: 'var(--cream-subtle)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
            <button
              onClick={() => setViewMode('mes')}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: viewMode === 'mes' ? '#FFFFFF' : 'transparent',
                fontWeight: viewMode === 'mes' ? 650 : 500,
                color: viewMode === 'mes' ? 'var(--green-deep)' : 'var(--text-muted)',
                cursor: 'pointer',
                boxShadow: viewMode === 'mes' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              Mês
            </button>
            <button
              onClick={() => setViewMode('lista')}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: viewMode === 'lista' ? '#FFFFFF' : 'transparent',
                fontWeight: viewMode === 'lista' ? 650 : 500,
                color: viewMode === 'lista' ? 'var(--green-deep)' : 'var(--text-muted)',
                cursor: 'pointer',
                boxShadow: viewMode === 'lista' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              Lista
            </button>
          </div>

          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ gap: '6px' }}>
            <Plus size={16} /> Novo Evento
          </button>
        </div>
      </div>

      {/* Visualização: Calendário Mensal */}
      {viewMode === 'mes' ? (
        <div className="card" style={{ padding: '24px' }}>
          {/* Navegação do Mês */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
              {monthNames[currentMonth]} {currentYear}
            </h2>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={prevMonth} style={{ padding: '6px 10px' }}>
                <ChevronLeft size={16} />
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setCurrentDate(new Date())}
                style={{ fontSize: '0.8rem', fontWeight: 650 }}
              >
                Hoje
              </button>
              <button className="btn btn-secondary btn-sm" onClick={nextMonth} style={{ padding: '6px 10px' }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Grid do Mês (Desktop) */}
          <div
            className="desktop-calendar-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '1px',
              background: 'var(--cream-border)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: '1px solid var(--cream-border)'
            }}
          >
            {/* Dias da semana */}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
              <div
                key={dia}
                style={{
                  background: 'var(--cream-subtle)',
                  padding: '10px 8px',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase'
                }}
              >
                {dia}
              </div>
            ))}

            {/* Células vazias antes do dia 1 */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} style={{ background: '#FAF8F5', minHeight: '110px' }} />
            ))}

            {/* Dias do mês */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
              const dayEvents = allEvents.filter((e) => e.date === dateStr);
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              return (
                <div
                  key={dayNum}
                  style={{
                    background: isToday ? 'rgba(197, 168, 128, 0.08)' : '#FFFFFF',
                    minHeight: '110px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div
                    style={{
                      fontWeight: isToday ? 800 : 600,
                      fontSize: '0.86rem',
                      color: isToday ? 'var(--sand-gold-dark)' : 'var(--text-primary)',
                      marginBottom: '4px'
                    }}
                  >
                    {dayNum}
                  </div>

                  {dayEvents.slice(0, 3).map((evt) => {
                    const style = getEventTypeColor(evt.type);
                    return (
                      <div
                        key={evt.id}
                        onClick={() => handleEventClick(evt)}
                        style={{
                          background: style.bg,
                          color: style.color,
                          border: `1px solid ${style.border}`,
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          cursor: 'pointer',
                          transition: 'transform 0.1s ease'
                        }}
                        title={`Clique para abrir: ${evt.title} (${evt.type})`}
                      >
                        {evt.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      +{dayEvents.length - 3} mais
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Lista de Compromissos por Dia (Mobile - evita calendário espremido) */}
          <div
            className="mobile-calendar-list"
            style={{
              display: 'none',
              flexDirection: 'column',
              gap: '12px',
              padding: '8px 0'
            }}
          >
            {allEvents.filter((e) => {
              const d = new Date(e.date);
              return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
            }).length === 0 ? (
              <div className="card" style={{ padding: '28px 16px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                  Nenhum compromisso para este mês.
                </p>
              </div>
            ) : (
              allEvents
                .filter((e) => {
                  const d = new Date(e.date);
                  return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
                })
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((evt) => {
                  const style = getEventTypeColor(evt.type);
                  return (
                    <div
                      key={evt.id}
                      className="mobile-item-card"
                      onClick={() => handleEventClick(evt)}
                      style={{ cursor: 'pointer', padding: '14px', borderLeft: `4px solid ${style.color}` }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--sand-gold-dark)' }}>
                          {new Date(evt.date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })} • {evt.time}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 650,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: style.bg,
                            color: style.color
                          }}
                        >
                          {evt.type}
                        </span>
                      </div>
                      <div style={{ fontWeight: 650, fontSize: '0.94rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {evt.title}
                      </div>
                      {(evt.clientName || evt.projectName) && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {evt.clientName} {evt.projectName ? `• ${evt.projectName}` : ''}
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      ) : (
        /* Visualização: Lista de Eventos */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="desktop-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Horário</th>
                  <th>Tipo</th>
                  <th>Título</th>
                  <th>Cliente / Projeto</th>
                  <th>Responsável</th>
                  <th style={{ textAlign: 'right' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {allEvents
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((evt) => {
                    const style = getEventTypeColor(evt.type);
                    return (
                      <tr key={evt.id} onClick={() => handleEventClick(evt)} style={{ cursor: 'pointer' }}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {new Date(evt.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td>{evt.time}</td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 650,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: style.bg,
                              color: style.color
                            }}
                          >
                            {evt.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 650, color: 'var(--text-primary)' }}>
                          {evt.title}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{evt.clientName || '—'}</div>
                          {evt.projectName && (
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{evt.projectName}</div>
                          )}
                        </td>
                        <td>{evt.responsible}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.76rem', color: 'var(--sand-gold-dark)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            Ver <ExternalLink size={12} />
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

      {/* Modal: Novo Evento */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Compromisso"
        subtitle="Agende reuniões de alinhamento, briefings e entregas"
        maxWidth="560px"
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Título do Evento *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Reunião Semanal de Resultados"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Data *</label>
              <input
                type="date"
                className="form-input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="form-label">Horário *</label>
              <input
                type="time"
                className="form-input"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Tipo de Evento</label>
              <select
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as CalendarEventType })}
              >
                <option value="Reunião">Reunião</option>
                <option value="Entrega">Entrega</option>
                <option value="Tarefa">Tarefa</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="form-label">Responsável</label>
              <input
                type="text"
                className="form-input"
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Observações / Pauta</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Pontos de discussão, link da call (Google Meet / Zoom)..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Agendar Evento
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
