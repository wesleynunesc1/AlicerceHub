import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  DollarSign
} from 'lucide-react';
import { Client, Project, Task, Lead, Contract, FinancialEntry } from '../../types';
import { projectsService } from '../../services/projects';
import { clientsService } from '../../services/clients';
import { phase2Service } from '../../services/phase2';

export const ReportsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [financials, setFinancials] = useState<FinancialEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      const [cls, projs, tsks, lds, ctrs, fins] = await Promise.all([
        clientsService.getClients(),
        projectsService.getProjects(),
        phase2Service.getTasks(),
        phase2Service.getLeads(),
        phase2Service.getContracts(),
        phase2Service.getFinancialEntries()
      ]);
      setClients(cls);
      setProjects(projs);
      setTasks(tsks);
      setLeads(lds);
      setContracts(ctrs);
      setFinancials(fins);
    };
    load();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  // Calculos operacionais
  const activeClients = clients.filter((c) => c.status === 'Ativo');
  const activeProjects = projects.filter((p) => p.status !== 'Finalizado');
  const delayedProjects = activeProjects.filter((p) => p.dueDate < today);
  const openTasks = tasks.filter((t) => t.status !== 'Concluída');
  const delayedTasks = openTasks.filter((t) => t.dueDate < today);
  const activeContracts = contracts.filter((c) => c.status === 'Ativo');
  const totalContractedMRR = activeContracts
    .filter((c) => c.recurrence === 'Mensal')
    .reduce((acc, c) => acc + c.value, 0);

  // Serviços mais contratados
  const serviceDistribution: Record<string, number> = {};
  projects.forEach((p) => {
    serviceDistribution[p.service] = (serviceDistribution[p.service] || 0) + 1;
  });

  // Projetos por responsável
  const projectsByResponsible: Record<string, number> = {};
  projects.forEach((p) => {
    projectsByResponsible[p.responsible] = (projectsByResponsible[p.responsible] || 0) + 1;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', maxWidth: '1400px' }}>
      {/* Header */}
      <div>
        <h1 className="font-serif" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
          Relatórios Operacionais
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', margin: '4px 0 0', fontWeight: 450 }}>
          Indicadores consolidados de entrega, pontualidade, carteira e receita.
        </p>
      </div>

      {/* Grid de Resumo Executivo */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        <div className="card" style={{ padding: '22px 24px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Taxa de Pontualidade
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '4px' }}>
            {activeProjects.length > 0
              ? `${Math.round(((activeProjects.length - delayedProjects.length) / activeProjects.length) * 100)}%`
              : '100%'}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {delayedProjects.length} projeto(s) atrasado(s)
          </span>
        </div>

        <div className="card" style={{ padding: '22px 24px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Volume de Demandas
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '4px' }}>
            {openTasks.length}
          </div>
          <span style={{ fontSize: '0.8rem', color: delayedTasks.length > 0 ? '#B91C1C' : 'var(--text-secondary)' }}>
            {delayedTasks.length} tarefa(s) com prazo estourado
          </span>
        </div>

        <div className="card" style={{ padding: '22px 24px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Receita Mensal Recorrente
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--sand-gold-dark)', marginTop: '4px' }}>
            R$ {totalContractedMRR.toLocaleString('pt-BR')}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {activeContracts.length} contratos ativos
          </span>
        </div>

        <div className="card" style={{ padding: '22px 24px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Conversão Comercial
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--status-active-text)', marginTop: '4px' }}>
            {leads.length > 0
              ? `${Math.round((leads.filter((l) => l.status === 'Fechado').length / leads.length) * 100)}%`
              : '0%'}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {leads.filter((l) => l.status === 'Fechado').length} fechados de {leads.length} leads
          </span>
        </div>
      </div>

      {/* Distribuição de Serviços & Equipe */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px'
        }}
      >
        {/* Serviços mais prestados */}
        <div className="card" style={{ padding: '26px' }}>
          <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--green-deep)', margin: '0 0 16px' }}>
            Distribuição de Serviços por Projeto
          </h3>
          {Object.keys(serviceDistribution).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Nenhum projeto cadastrado.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {Object.entries(serviceDistribution).map(([service, count]) => {
                const pct = Math.round((count / (projects.length || 1)) * 100);
                return (
                  <div key={service}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{service}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--cream-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green-primary)', borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Projetos por Responsável */}
        <div className="card" style={{ padding: '26px' }}>
          <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--green-deep)', margin: '0 0 16px' }}>
            Carga de Projetos por Responsável
          </h3>
          {Object.keys(projectsByResponsible).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Nenhum responsável vinculado.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {Object.entries(projectsByResponsible).map(([resp, count]) => {
                const pct = Math.round((count / (projects.length || 1)) * 100);
                return (
                  <div key={resp}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{resp}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{count} projetos</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--cream-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--sand-gold-dark)', borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
