import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  CheckSquare,
  AlertTriangle,
  Mail,
  Phone,
  Shield,
  Clock
} from 'lucide-react';
import { TeamMember, Project, Task } from '../../types';
import { phase2Service } from '../../services/phase2';
import { projectsService } from '../../services/projects';

export const TeamPage: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const load = async () => {
      const [projs, tsks] = await Promise.all([
        projectsService.getProjects(),
        phase2Service.getTasks()
      ]);
      setProjects(projs);
      setTasks(tsks);
      const members = await phase2Service.getTeamMembers(projs, tsks);
      setTeam(members);
    };
    load();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', maxWidth: '1400px' }}>
      {/* Header */}
      <div>
        <h1 className="font-serif" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--green-deep)', margin: 0 }}>
          Equipe & Carga Operacional
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', margin: '4px 0 0', fontWeight: 450 }}>
          Acompanhamento de especialistas, projetos ativos e equilíbrio de demandas da agência.
        </p>
      </div>

      {/* Grid de Membros da Equipe */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px'
        }}
      >
        {team.map((member) => {
          const hasOverload = member.delayedTasksCount > 2 || member.openTasksCount > 10;
          return (
            <div
              key={member.id}
              className="card"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '20px',
                border: hasOverload ? '1px solid #FCD34D' : '1px solid var(--cream-border)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'var(--green-surface)',
                        color: 'var(--sand-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        border: '1px solid rgba(197, 168, 128, 0.3)'
                      }}
                    >
                      {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                        {member.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {member.role}
                        </span>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(27, 99, 70, 0.08)',
                          color: 'var(--green-deep)',
                          fontFamily: 'var(--font-heading)'
                        }}>
                          {member.role?.toLowerCase().includes('design') ? 'Design' :
                           member.role?.toLowerCase().includes('tráfego') || member.role?.toLowerCase().includes('traffic') || member.role?.toLowerCase().includes('gestor') ? 'Tráfego & Ads' :
                           member.role?.toLowerCase().includes('dev') || member.role?.toLowerCase().includes('web') ? 'Web & Dev' :
                           member.role?.toLowerCase().includes('social') || member.role?.toLowerCase().includes('conteúdo') ? 'Social Media' :
                           member.role?.toLowerCase().includes('copy') ? 'Copywriting' :
                           member.role?.toLowerCase().includes('vídeo') || member.role?.toLowerCase().includes('video') ? 'Vídeo & Motion' :
                           member.role?.toLowerCase().includes('comercial') || member.role?.toLowerCase().includes('vendas') ? 'Comercial' :
                           'Estratégia & Operação'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 650,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: member.status === 'Ativo' ? '#EAF5EE' : 'var(--cream-subtle)',
                      color: member.status === 'Ativo' ? '#1B6346' : 'var(--text-muted)',
                      fontFamily: 'var(--font-heading)'
                    }}
                  >
                    {member.status}
                  </span>
                </div>

                {/* Métricas de Carga de Trabalho */}
                <div
                  style={{
                    background: 'var(--cream-subtle)',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '10px',
                    textAlign: 'center'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Projetos
                    </span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '2px' }}>
                      {member.activeProjectsCount}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Tarefas
                    </span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--green-deep)', marginTop: '2px' }}>
                      {member.openTasksCount}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Atrasadas
                    </span>
                    <div
                      style={{
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        color: member.delayedTasksCount > 0 ? '#B91C1C' : 'var(--status-active-text)',
                        marginTop: '2px'
                      }}
                    >
                      {member.delayedTasksCount}
                    </div>
                  </div>
                </div>

                {hasOverload && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#B45309', marginTop: '10px', fontWeight: 600 }}>
                    <AlertTriangle size={14} /> Atenção: Carga operacional elevada
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '14px', borderTop: '1px solid var(--cream-border-subtle)', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} color="var(--green-primary)" />
                  <span>{member.email}</span>
                </div>
                {member.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={14} color="var(--green-primary)" />
                    <span>{member.phone}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
