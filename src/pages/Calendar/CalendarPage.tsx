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
  AlertCircle
} from 'lucide-react';
import { CalendarEvent, CalendarEventType, Project, Task, Contract, FinancialEntry } from '../../types';
import { phase2Service } from '../../services/phase2';
import { projectsService } from '../../services/projects';
import { clientsService } from '../../services/clients';
import { Modal } from '../../components/Common/Modal';
import { useToast } from '../../components/Common/Toast';

export const CalendarPage: React.FC = () => {
  const { showToast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [financials, setFinancials] = useState<FinancialEntry[]>([]);
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
    const [evts, projs, tsks, ctrs, fins] = await Promise.all([
      phase2Service.getEvents(),
      projectsService.getProjects(),
      phase2Service.getTasks(),
      phase2Service.getContracts(),
      phase2Service.getFinancialEntries()
    ]);
    setEvents(evts);
    setProjects(projs);
    setTasks(tsks);
    setContracts(ctrs);
    setFinancials(fins);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Aggregated events from all modules (Tasks due, Project delivery, Contracts expiration, Financial dues)
  const allEvents: CalendarEvent[] = [
    ...events,
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
      projectName: p.name
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
      projectName: t.projectName
    })),
    ...contracts.map((c) => ({
      id: `ctr-due-${c.id}`,
      title: `Vencimento Contrato: ${c.clientName}`,
      date: c.endDate,
      time: '12:00',
      type: 'Contrato' as CalendarEventType,
      responsible: 'Comercial',
      clientId: c.clientId,
      clientName: c.clientName
    })),
    ...financials.map((f) => ({
      id: `fin-due-${f.id}`,
      title: `Recebível: ${f.clientName} (R$ ${f.value.toLocaleString('pt-BR')})`,
      date: f.dueDate,
      time: '12:00',
      type: 'Financeiro' as CalendarEventType,
      responsible: 'Financeiro',
      clientId: f.clientId,
      clientName: f.clientName
    }))
  ];

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
      case 'Entrega': return { bg: '#EAF5EE', color: '#1B6346', border: '#C6E7D5' };
      case 'Tarefa': return { bg: '#EDF4F9', color: '#1D557B', border: '#C4DCEB' };
      case 'Reunião': return { bg: '#FEF5E7', color: '#8F5310', border: '#FCDCA6' };
      case 'Follow-up': return { bg: '#F4EEFA', color: '#5C2F92', border: '#DFC8F3' };
      case 'Contrato': return { bg: '#FFF1EA', color: '#A44512', border: '#FDCBB0' };
      case 'Financeiro': return { bg: '#E0F2FE', color: '#0369A1', border: '#BAE6FD' };
      default: return { bg: 'var(--cream-subtle)', color: 'var(--text-primary)', border: 'var(--cream-border)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
            Agenda & Prazos
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', margin: 0, fontWeight: 450 }}>
            Cronograma unificado de entregas, tarefas, reuniões e vencimentos.
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
                cursor: 'pointer'
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
                cursor: 'pointer'
              }}
            >
              Lista
            </button>
          </div>

          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ gap: '8px' }}>
            <Plus size={18} /> Novo Evento
          </button>
        </div>
      </div>

      {/* Month Navigation Strip */}
      <div
        className="card"
        style={{
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary btn-sm" onClick={prevMonth} style={{ padding: '6px' }}>
            <ChevronLeft size={18} />
          </button>
          <span className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--green-deep)' }}>
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={nextMonth} style={{ padding: '6px' }}>
            <ChevronRight size={18} />
          </button>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setCurrentDate(new Date())}
        >
          Hoje
        </button>
      </div>

      {/* Visualização: Calendário Mensal */}
      {viewMode === 'mes' ? (
        <div
          className="card"
          style={{
            padding: '20px',
            overflowX: 'auto'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))',
              gap: '1px',
              background: 'var(--cream-border)',
              border: '1px solid var(--cream-border)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden'
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
                          textOverflow: 'ellipsis'
                        }}
                        title={`${evt.title} (${evt.type})`}
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
                </tr>
              </thead>
              <tbody>
                {allEvents
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((evt) => {
                    const style = getEventTypeColor(evt.type);
                    return (
                      <tr key={evt.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                          {new Date(evt.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{evt.time || '—'}</td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.76rem',
                              fontWeight: 650,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: style.bg,
                              color: style.color,
                              border: `1px solid ${style.border}`
                            }}
                          >
                            {evt.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{evt.title}</td>
                        <td style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                          {evt.clientName || '—'} {evt.projectName && `• ${evt.projectName}`}
                        </td>
                        <td style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{evt.responsible}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Criar Evento */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Evento na Agenda">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Título do Evento *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Reunião de Alinhamento Trimestral"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Data *</label>
              <input
                type="date"
                className="form-input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Horário</label>
              <input
                type="time"
                className="form-input"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Tipo de Evento</label>
              <select
                className="form-input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as CalendarEventType })}
              >
                <option value="Reunião">Reunião</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Entrega">Entrega</option>
                <option value="Tarefa">Tarefa</option>
                <option value="Contrato">Contrato</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Aprovação">Aprovação</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Responsável</label>
              <input
                type="text"
                className="form-input"
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Observações</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Pauta da reunião, link de videoconferência ou notas..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Salvar Evento
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
