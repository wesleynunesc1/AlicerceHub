import { supabase } from './supabase';
import { clientsService } from './clients';
import { projectsService } from './projects';
import { dashboardService } from './dashboard';
import {
  Task,
  CalendarEvent,
  ApprovalItem,
  Lead,
  Proposal,
  Contract,
  FinancialEntry,
  ProjectTemplate,
  ContentItem,
  InternalComment,
  QuickLink,
  OnboardingCheckItem,
  TeamMember,
  Client,
  Project
} from '../types';

const STORAGE_KEYS = {
  TASKS: 'alicerce_tasks_v2',
  CALENDAR: 'alicerce_calendar_v2',
  APPROVALS: 'alicerce_approvals_v2',
  LEADS: 'alicerce_leads_v2',
  PROPOSALS: 'alicerce_proposals_v2',
  CONTRACTS: 'alicerce_contracts_v2',
  FINANCIAL: 'alicerce_financial_v2',
  TEMPLATES: 'alicerce_templates_v2',
  CONTENT: 'alicerce_content_v2',
  COMMENTS: 'alicerce_comments_v2',
  QUICK_LINKS: 'alicerce_quick_links_v2',
  ONBOARDING: 'alicerce_onboarding_v2',
  OFFBOARDING: 'alicerce_offboarding_v2',
  TEAM: 'alicerce_team_v2'
};

// Initial default templates for Alicerce services (Operational SOP Templates)
const DEFAULT_PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'tmpl-meta-ads',
    title: 'Projeto Meta Ads',
    service: 'Meta Ads',
    description: 'Estruturação completa de aquisição e tráfego pago no ecossistema Meta.',
    createdAt: new Date().toISOString(),
    steps: [
      { title: 'Briefing e Alinhamento Estratégico', estimatedDays: 2, checklist: ['Definir ICP e persona', 'Meta de CPL e CPA', 'Ofertas principais'] },
      { title: 'Acessos e Pixel/CAPI', estimatedDays: 2, checklist: ['Business Manager', 'Instalação do Pixel e Conversions API', 'Verificação de domínio'] },
      { title: 'Planejamento de Públicos & Campanhas', estimatedDays: 3, checklist: ['Públicos Lookalike', 'Remarketing', 'Interesses e Aberto'] },
      { title: 'Produção e Validação de Criativos', estimatedDays: 4, checklist: ['Estáticos com copy', 'Vídeos em hook-story-offer', 'Carrosséis'] },
      { title: 'Configuração Técnica e Subida de Campanhas', estimatedDays: 1, checklist: ['Parâmetros UTM', 'Páginas de destino verificadas', 'Budget inicial'] },
      { title: 'Publicação e Validação de Aprendizado', estimatedDays: 2, checklist: ['Aprovação das peças', 'Verificação de entrega'] },
      { title: 'Otimização Contínua e Escala', estimatedDays: 15, checklist: ['Pausar criativos saturados', 'Testar novos ângulos', 'Escalar vencedores'] },
      { title: 'Relatório Mensal de Resultados', estimatedDays: 2, checklist: ['ROAS', 'CPA', 'Leads gerados', 'Próximos passos'] }
    ]
  },
  {
    id: 'tmpl-google-ads',
    title: 'Projeto Google Ads',
    service: 'Google Ads',
    description: 'Campanhas de alta intenção na Rede de Pesquisa, Performance Max e Remarketing.',
    createdAt: new Date().toISOString(),
    steps: [
      { title: 'Pesquisa de Palavras-chave e Concorrência', estimatedDays: 3, checklist: ['Volume de busca', 'Intenção transacional', 'Palavras negativas'] },
      { title: 'Tag Manager e Rastreamento de Conversões', estimatedDays: 2, checklist: ['Conversão no WhatsApp', 'Formulário do site', 'Ligação telefônica'] },
      { title: 'Criação de Anúncios e Extensões', estimatedDays: 3, checklist: ['Títulos responsivos', 'Descrições com proposta de valor', 'Sitelinks e Snippets'] },
      { title: 'Estruturação de Grupos e Lances', estimatedDays: 1, checklist: ['Estratégia Maximizar Cliques/Conversões', 'Configuração geográfica'] },
      { title: 'Lançamento e Negativação Diária', estimatedDays: 7, checklist: ['Análise de termos de busca', 'Negativação preventiva'] },
      { title: 'Relatório de Eficiência e Conversão', estimatedDays: 2, checklist: ['Taxa de conversão', 'Custo por conversão', 'Qualidade dos leads'] }
    ]
  },
  {
    id: 'tmpl-landing-page',
    title: 'Landing Page de Alta Conversão',
    service: 'Landing Page',
    description: 'Página ultra rápida e persuasiva voltada exclusivamente para conversão.',
    createdAt: new Date().toISOString(),
    steps: [
      { title: 'Briefing e Proposta Única de Valor', estimatedDays: 2, checklist: ['Dores do cliente', 'Diferenciais exclusivos', 'Call to Action'] },
      { title: 'Copywriting Estruturado', estimatedDays: 3, checklist: ['Headline de impacto', 'Benefícios', 'Prova social', 'FAQ'] },
      { title: 'Design UI/UX no Figma', estimatedDays: 4, checklist: ['Layout desktop e mobile', 'Hierarquia visual Alicerce', 'Tipografia e cores'] },
      { title: 'Desenvolvimento e Otimização de Performance', estimatedDays: 3, checklist: ['Código limpo', 'Carregamento < 2s', 'Pixel e tags integradas'] },
      { title: 'Testes de Responsividade e Formulários', estimatedDays: 1, checklist: ['Envio para CRM/WhatsApp', 'Disparos de webhook'] },
      { title: 'Publicação e Entrega', estimatedDays: 1, checklist: ['Apontamento de DNS', 'Certificado SSL'] }
    ]
  },
  {
    id: 'tmpl-social-media',
    title: 'Social Media & Posicionamento',
    service: 'Social Media',
    description: 'Gestão de presença editorial, branding e engajamento qualificado.',
    createdAt: new Date().toISOString(),
    steps: [
      { title: 'Linha Editorial e Pilares de Conteúdo', estimatedDays: 3, checklist: ['Educação', 'Autoridade', 'Prova social', 'Institucional'] },
      { title: 'Grade Mensal de Publicações', estimatedDays: 3, checklist: ['Pautas definidas', 'Formatos recomendados', 'Datas estratégicas'] },
      { title: 'Criação de Roteiros e Copys', estimatedDays: 4, checklist: ['Ganchos fortes', 'Legendas completas', 'Diretrizes visuais'] },
      { title: 'Design das Peças e Carrosséis', estimatedDays: 5, checklist: ['Identidade alinhada', 'Arquivos para aprovação'] },
      { title: 'Aprovação com o Cliente', estimatedDays: 3, checklist: ['Ajustes solicitados', 'Liberação para agendamento'] },
      { title: 'Publicação e Monitoramento de Interações', estimatedDays: 30, checklist: ['Respostas ativas', 'Análise de métricas'] }
    ]
  },
  {
    id: 'tmpl-identidade-visual',
    title: 'Identidade Visual & Branding',
    service: 'Identidade Visual',
    description: 'Construção da essência visual da marca, posicionamento e manuais.',
    createdAt: new Date().toISOString(),
    steps: [
      { title: 'Imersão e Diagnóstico da Marca', estimatedDays: 4, checklist: ['Arquétipo de marca', 'Valores inegociáveis', 'Território visual'] },
      { title: 'Painel Semântico & Direção de Arte', estimatedDays: 3, checklist: ['Moodboard', 'Referências estéticas'] },
      { title: 'Desenvolvimento de Conceitos', estimatedDays: 7, checklist: ['Símbolo e tipografia', 'Paleta cromática', 'Aplicações reais'] },
      { title: 'Apresentação Estratégica', estimatedDays: 2, checklist: ['Defesa conceitual com o cliente'] },
      { title: 'Refinamento e Brandbook', estimatedDays: 5, checklist: ['Manual da marca', 'Exportação de arquivos vetoriais'] },
      { title: 'Entrega Final e Brand Center', estimatedDays: 2, checklist: ['Arquivos organizados na nuvem', 'Guidelines'] }
    ]
  }
];

class Phase2Service {
  private getLocal<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private setLocal<T>(key: string, val: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }

  // ==========================================
  // 1. TAREFAS
  // ==========================================
  async getTasks(): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: Task[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          description: d.description || '',
          projectId: d.project_id,
          projectName: d.project_name || '',
          clientId: d.client_id,
          clientName: d.client_name || '',
          responsible: d.responsible || 'Equipe Alicerce',
          priority: d.priority || 'Média',
          status: d.status || 'Pendente',
          dueDate: d.due_date || '',
          createdAt: d.created_at || new Date().toISOString(),
          completedAt: d.completed_at,
          commentsCount: d.comments_count || 0,
          attachments: d.attachments || []
        }));
        this.setLocal(STORAGE_KEYS.TASKS, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase tasks unavailable, using local cache:', err);
    }
    return this.getLocal<Task[]>(STORAGE_KEYS.TASKS, []);
  }

  async saveTask(task: Partial<Task>): Promise<Task> {
    const existing = this.getLocal<Task[]>(STORAGE_KEYS.TASKS, []);
    const id = task.id || `tsk-${Date.now()}`;
    const prevTask = existing.find((t) => t.id === id);

    const newTask: Task = {
      id,
      title: task.title !== undefined ? task.title : (prevTask?.title || 'Nova Tarefa'),
      description: task.description !== undefined ? task.description : (prevTask?.description || ''),
      projectId: task.projectId !== undefined ? task.projectId : prevTask?.projectId,
      projectName: task.projectName !== undefined ? task.projectName : (prevTask?.projectName || ''),
      clientId: task.clientId !== undefined ? task.clientId : prevTask?.clientId,
      clientName: task.clientName !== undefined ? task.clientName : (prevTask?.clientName || ''),
      responsible: task.responsible !== undefined ? task.responsible : (prevTask?.responsible || 'Wesley Nunes'),
      priority: task.priority !== undefined ? task.priority : (prevTask?.priority || 'Média'),
      status: task.status !== undefined ? task.status : (prevTask?.status || 'Pendente'),
      dueDate: task.dueDate !== undefined ? task.dueDate : (prevTask?.dueDate || ''),
      createdAt: task.createdAt !== undefined ? task.createdAt : (prevTask?.createdAt || new Date().toISOString()),
      completedAt: task.completedAt !== undefined
        ? (task.completedAt || undefined)
        : (task.status ? (task.status === 'Concluída' ? new Date().toISOString() : undefined) : prevTask?.completedAt),
      commentsCount: task.commentsCount !== undefined ? task.commentsCount : (prevTask?.commentsCount || 0),
      attachments: task.attachments !== undefined ? task.attachments : (prevTask?.attachments || [])
    };

    const updated = existing.some((t) => t.id === id)
      ? existing.map((t) => (t.id === id ? newTask : t))
      : [newTask, ...existing];

    this.setLocal(STORAGE_KEYS.TASKS, updated);

    try {
      const payload: any = {
        title: newTask.title,
        description: newTask.description,
        project_id: newTask.projectId || null,
        client_id: newTask.clientId || null,
        responsible: newTask.responsible,
        priority: newTask.priority,
        status: newTask.status,
        due_date: newTask.dueDate || null,
        completed_at: newTask.completedAt || null
      };

      if (!newTask.id.startsWith('tsk-')) {
        payload.id = newTask.id;
      }

      await supabase.from('tasks').upsert(payload);
    } catch (err) {
      console.warn('Failed to upsert task to Supabase:', err);
    }

    return newTask;
  }

  async deleteTask(id: string): Promise<void> {
    const existing = this.getLocal<Task[]>(STORAGE_KEYS.TASKS, []);
    this.setLocal(STORAGE_KEYS.TASKS, existing.filter((t) => t.id !== id));
    try {
      await supabase.from('tasks').delete().eq('id', id);
    } catch (e) {
      console.warn('Delete task remote error:', e);
    }
  }

  // ==========================================
  // 2. AGENDA & EVENTOS
  // ==========================================
  async getEvents(): Promise<CalendarEvent[]> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('date', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: CalendarEvent[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          date: d.date,
          time: d.time || '',
          type: d.type || 'Reunião',
          responsible: d.responsible || 'Equipe Alicerce',
          clientId: d.client_id,
          clientName: d.client_name,
          projectId: d.project_id,
          projectName: d.project_name,
          notes: d.notes || ''
        }));
        this.setLocal(STORAGE_KEYS.CALENDAR, mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase events fallback:', e);
    }
    return this.getLocal<CalendarEvent[]>(STORAGE_KEYS.CALENDAR, []);
  }

  async saveEvent(event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const existing = this.getLocal<CalendarEvent[]>(STORAGE_KEYS.CALENDAR, []);
    const id = event.id || `evt-${Date.now()}`;
    const newEvent: CalendarEvent = {
      id,
      title: event.title || 'Novo Evento',
      date: event.date || new Date().toISOString().split('T')[0],
      time: event.time || '10:00',
      type: event.type || 'Reunião',
      responsible: event.responsible || 'Wesley Nunes',
      clientId: event.clientId,
      clientName: event.clientName,
      projectId: event.projectId,
      projectName: event.projectName,
      notes: event.notes || ''
    };

    const updated = existing.some((e) => e.id === id)
      ? existing.map((e) => (e.id === id ? newEvent : e))
      : [...existing, newEvent].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    this.setLocal(STORAGE_KEYS.CALENDAR, updated);

    try {
      await supabase.from('calendar_events').upsert({
        id: newEvent.id.startsWith('evt-') ? undefined : newEvent.id,
        title: newEvent.title,
        date: newEvent.date,
        time: newEvent.time,
        type: newEvent.type,
        responsible: newEvent.responsible,
        client_id: newEvent.clientId || null,
        project_id: newEvent.projectId || null,
        notes: newEvent.notes
      });
    } catch (err) {
      console.warn('Failed to upsert event:', err);
    }

    return newEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    const existing = this.getLocal<CalendarEvent[]>(STORAGE_KEYS.CALENDAR, []);
    this.setLocal(STORAGE_KEYS.CALENDAR, existing.filter((e) => e.id !== id));
    try {
      await supabase.from('calendar_events').delete().eq('id', id);
    } catch (e) {
      console.warn('Delete event remote error:', e);
    }
  }

  // ==========================================
  // 3. APROVAÇÕES
  // ==========================================
  async getApprovals(): Promise<ApprovalItem[]> {
    try {
      const { data, error } = await supabase
        .from('approvals')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: ApprovalItem[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          clientId: d.client_id,
          clientName: d.client_name || 'Cliente Alicerce',
          projectId: d.project_id,
          projectName: d.project_name,
          type: d.type || 'Criativo',
          fileUrl: d.file_url,
          externalLink: d.external_link,
          responsible: d.responsible || 'Equipe',
          date: d.date || new Date().toISOString().split('T')[0],
          notes: d.notes || '',
          feedback: d.feedback || '',
          status: d.status || 'Aguardando aprovação',
          history: d.history || [],
          createdAt: d.created_at || new Date().toISOString()
        }));
        this.setLocal(STORAGE_KEYS.APPROVALS, mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase approvals fallback:', e);
    }
    return this.getLocal<ApprovalItem[]>(STORAGE_KEYS.APPROVALS, []);
  }

  async saveApproval(approval: Partial<ApprovalItem>): Promise<ApprovalItem> {
    const existing = this.getLocal<ApprovalItem[]>(STORAGE_KEYS.APPROVALS, []);
    const id = approval.id || `appr-${Date.now()}`;
    const newApproval: ApprovalItem = {
      id,
      title: approval.title || 'Material para Aprovação',
      clientId: approval.clientId || '',
      clientName: approval.clientName || '',
      projectId: approval.projectId,
      projectName: approval.projectName,
      type: approval.type || 'Criativo',
      fileUrl: approval.fileUrl,
      externalLink: approval.externalLink,
      responsible: approval.responsible || 'Wesley Nunes',
      date: approval.date || new Date().toISOString().split('T')[0],
      notes: approval.notes || '',
      feedback: approval.feedback || '',
      status: approval.status || 'Aguardando aprovação',
      history: approval.history || [
        {
          date: new Date().toISOString(),
          status: approval.status || 'Aguardando aprovação',
          user: 'Wesley Nunes',
          feedback: 'Envio inicial para validação'
        }
      ],
      createdAt: approval.createdAt || new Date().toISOString()
    };

    const updated = existing.some((a) => a.id === id)
      ? existing.map((a) => (a.id === id ? newApproval : a))
      : [newApproval, ...existing];

    this.setLocal(STORAGE_KEYS.APPROVALS, updated);

    try {
      await supabase.from('approvals').upsert({
        id: newApproval.id.startsWith('appr-') ? undefined : newApproval.id,
        title: newApproval.title,
        client_id: newApproval.clientId || null,
        project_id: newApproval.projectId || null,
        type: newApproval.type,
        file_url: newApproval.fileUrl,
        external_link: newApproval.externalLink,
        responsible: newApproval.responsible,
        date: newApproval.date,
        notes: newApproval.notes,
        feedback: newApproval.feedback,
        status: newApproval.status,
        history: newApproval.history
      });
    } catch (e) {
      console.warn('Supabase save approval error:', e);
    }

    return newApproval;
  }

  // ==========================================
  // 4. COMERCIAL / LEADS
  // ==========================================
  async getLeads(): Promise<Lead[]> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('entry_date', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: Lead[] = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          company: d.company,
          phone: d.phone || '',
          whatsapp: d.whatsapp || '',
          email: d.email || '',
          serviceOfInterest: d.service_of_interest || 'Meta Ads',
          origin: d.origin || 'Instagram',
          estimatedValue: Number(d.estimated_value) || 0,
          responsible: d.responsible || 'Wesley Nunes',
          status: d.status || 'Novo lead',
          nextFollowUp: d.next_follow_up,
          notes: d.notes || '',
          entryDate: d.entry_date || new Date().toISOString().split('T')[0],
          convertedClientId: d.converted_client_id
        }));
        this.setLocal(STORAGE_KEYS.LEADS, mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase leads fallback:', e);
    }
    return this.getLocal<Lead[]>(STORAGE_KEYS.LEADS, []);
  }

  async saveLead(lead: Partial<Lead>): Promise<Lead> {
    const existing = this.getLocal<Lead[]>(STORAGE_KEYS.LEADS, []);
    const id = lead.id || `lead-${Date.now()}`;
    const newLead: Lead = {
      id,
      name: lead.name || 'Contato Comercial',
      company: lead.company || 'Empresa',
      phone: lead.phone || '',
      whatsapp: lead.whatsapp || '',
      email: lead.email || '',
      serviceOfInterest: lead.serviceOfInterest || 'Meta Ads',
      origin: lead.origin || 'Instagram',
      estimatedValue: Number(lead.estimatedValue) || 0,
      responsible: lead.responsible || 'Wesley Nunes',
      status: lead.status || 'Novo lead',
      nextFollowUp: lead.nextFollowUp,
      notes: lead.notes || '',
      entryDate: lead.entryDate || new Date().toISOString().split('T')[0],
      convertedClientId: lead.convertedClientId
    };

    const updated = existing.some((l) => l.id === id)
      ? existing.map((l) => (l.id === id ? newLead : l))
      : [newLead, ...existing];

    this.setLocal(STORAGE_KEYS.LEADS, updated);

    try {
      await supabase.from('leads').upsert({
        id: newLead.id.startsWith('lead-') ? undefined : newLead.id,
        name: newLead.name,
        company: newLead.company,
        phone: newLead.phone,
        whatsapp: newLead.whatsapp,
        email: newLead.email,
        service_of_interest: newLead.serviceOfInterest,
        origin: newLead.origin,
        estimated_value: newLead.estimatedValue,
        responsible: newLead.responsible,
        status: newLead.status,
        next_follow_up: newLead.nextFollowUp || null,
        notes: newLead.notes,
        entry_date: newLead.entryDate,
        converted_client_id: newLead.convertedClientId || null
      });
    } catch (e) {
      console.warn('Save lead remote error:', e);
    }

    return newLead;
  }

  async deleteLead(id: string): Promise<void> {
    const existing = this.getLocal<Lead[]>(STORAGE_KEYS.LEADS, []);
    this.setLocal(STORAGE_KEYS.LEADS, existing.filter((l) => l.id !== id));
    try {
      await supabase.from('leads').delete().eq('id', id);
    } catch (e) {
      console.warn('Delete lead remote error:', e);
    }
  }

  // ==========================================
  // 5. PROPOSTAS
  // ==========================================
  async getProposals(): Promise<Proposal[]> {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: Proposal[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          clientId: d.client_id,
          clientName: d.client_name || '',
          leadId: d.lead_id,
          description: d.description || '',
          services: d.services || [],
          items: d.items || [],
          subtotal: Number(d.subtotal) || 0,
          discount: Number(d.discount) || 0,
          total: Number(d.total) || 0,
          deadline: d.deadline || '',
          validUntil: d.valid_until || '',
          notes: d.notes || '',
          status: d.status || 'Rascunho',
          createdAt: d.created_at || new Date().toISOString()
        }));
        this.setLocal(STORAGE_KEYS.PROPOSALS, mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase proposals fallback:', e);
    }
    return this.getLocal<Proposal[]>(STORAGE_KEYS.PROPOSALS, []);
  }

  async saveProposal(proposal: Partial<Proposal>): Promise<Proposal> {
    const existing = this.getLocal<Proposal[]>(STORAGE_KEYS.PROPOSALS, []);
    const id = proposal.id || `prop-${Date.now()}`;
    const subtotal = proposal.subtotal ?? (proposal.items?.reduce((acc, i) => acc + (i.value || 0), 0) || 0);
    const discount = proposal.discount ?? 0;
    const total = Math.max(0, subtotal - discount);

    const newProposal: Proposal = {
      id,
      title: proposal.title || 'Proposta de Serviços Alicerce',
      clientId: proposal.clientId,
      clientName: proposal.clientName || '',
      leadId: proposal.leadId,
      description: proposal.description || '',
      services: proposal.services || ['Meta Ads'],
      items: proposal.items || [],
      subtotal,
      discount,
      total,
      deadline: proposal.deadline || '15 dias úteis',
      validUntil: proposal.validUntil || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      notes: proposal.notes || '',
      status: proposal.status || 'Rascunho',
      createdAt: proposal.createdAt || new Date().toISOString()
    };

    const updated = existing.some((p) => p.id === id)
      ? existing.map((p) => (p.id === id ? newProposal : p))
      : [newProposal, ...existing];

    this.setLocal(STORAGE_KEYS.PROPOSALS, updated);

    try {
      await supabase.from('proposals').upsert({
        id: newProposal.id.startsWith('prop-') ? undefined : newProposal.id,
        title: newProposal.title,
        client_id: newProposal.clientId || null,
        lead_id: newProposal.leadId || null,
        description: newProposal.description,
        services: newProposal.services,
        items: newProposal.items,
        subtotal: newProposal.subtotal,
        discount: newProposal.discount,
        total: newProposal.total,
        deadline: newProposal.deadline,
        valid_until: newProposal.validUntil,
        notes: newProposal.notes,
        status: newProposal.status
      });
    } catch (e) {
      console.warn('Save proposal remote error:', e);
    }

    return newProposal;
  }

  // ==========================================
  // 6. CONTRATOS
  // ==========================================
  async getContracts(): Promise<Contract[]> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: Contract[] = data.map((d: any) => ({
          id: d.id,
          clientId: d.client_id,
          clientName: d.client_name || '',
          service: d.service || 'Meta Ads',
          value: Number(d.value) || 0,
          recurrence: d.recurrence || 'Mensal',
          startDate: d.start_date || '',
          endDate: d.end_date || '',
          autoRenew: Boolean(d.auto_renew),
          status: d.status || 'Ativo',
          fileUrl: d.file_url,
          notes: d.notes || '',
          createdAt: d.created_at || new Date().toISOString()
        }));
        this.setLocal(STORAGE_KEYS.CONTRACTS, mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase contracts fallback:', e);
    }
    return this.getLocal<Contract[]>(STORAGE_KEYS.CONTRACTS, []);
  }

  async saveContract(contract: Partial<Contract>): Promise<Contract> {
    const existing = this.getLocal<Contract[]>(STORAGE_KEYS.CONTRACTS, []);
    const id = contract.id || `ctr-${Date.now()}`;
    const newContract: Contract = {
      id,
      clientId: contract.clientId || '',
      clientName: contract.clientName || '',
      service: contract.service || 'Meta Ads',
      value: Number(contract.value) || 0,
      recurrence: contract.recurrence || 'Mensal',
      startDate: contract.startDate || new Date().toISOString().split('T')[0],
      endDate: contract.endDate || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      autoRenew: contract.autoRenew ?? true,
      status: contract.status || 'Ativo',
      fileUrl: contract.fileUrl,
      notes: contract.notes || '',
      createdAt: contract.createdAt || new Date().toISOString()
    };

    const updated = existing.some((c) => c.id === id)
      ? existing.map((c) => (c.id === id ? newContract : c))
      : [newContract, ...existing];

    this.setLocal(STORAGE_KEYS.CONTRACTS, updated);

    try {
      await supabase.from('contracts').upsert({
        id: newContract.id.startsWith('ctr-') ? undefined : newContract.id,
        client_id: newContract.clientId || null,
        service: newContract.service,
        value: newContract.value,
        recurrence: newContract.recurrence,
        start_date: newContract.startDate,
        end_date: newContract.endDate,
        auto_renew: newContract.autoRenew,
        status: newContract.status,
        file_url: newContract.fileUrl,
        notes: newContract.notes
      });
    } catch (e) {
      console.warn('Save contract remote error:', e);
    }

    return newContract;
  }

  // ==========================================
  // 7. FINANCEIRO BÁSICO
  // ==========================================
  async getFinancialEntries(): Promise<FinancialEntry[]> {
    try {
      const { data, error } = await supabase
        .from('financial_entries')
        .select('*')
        .order('due_date', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: FinancialEntry[] = data.map((d: any) => ({
          id: d.id,
          clientId: d.client_id,
          clientName: d.client_name || '',
          contractId: d.contract_id,
          description: d.description,
          value: Number(d.value) || 0,
          dueDate: d.due_date,
          paymentDate: d.payment_date,
          status: d.status || 'Pendente',
          createdAt: d.created_at || new Date().toISOString()
        }));
        this.setLocal(STORAGE_KEYS.FINANCIAL, mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase financial fallback:', e);
    }
    return this.getLocal<FinancialEntry[]>(STORAGE_KEYS.FINANCIAL, []);
  }

  async saveFinancialEntry(entry: Partial<FinancialEntry>): Promise<FinancialEntry> {
    const existing = this.getLocal<FinancialEntry[]>(STORAGE_KEYS.FINANCIAL, []);
    const id = entry.id || `fin-${Date.now()}`;
    const newEntry: FinancialEntry = {
      id,
      clientId: entry.clientId || '',
      clientName: entry.clientName || '',
      contractId: entry.contractId,
      description: entry.description || 'Faturamento Mensal',
      value: Number(entry.value) || 0,
      dueDate: entry.dueDate || new Date().toISOString().split('T')[0],
      paymentDate: entry.paymentDate,
      status: entry.status || 'Pendente',
      createdAt: entry.createdAt || new Date().toISOString()
    };

    const updated = existing.some((f) => f.id === id)
      ? existing.map((f) => (f.id === id ? newEntry : f))
      : [...existing, newEntry];

    this.setLocal(STORAGE_KEYS.FINANCIAL, updated);

    try {
      await supabase.from('financial_entries').upsert({
        id: newEntry.id.startsWith('fin-') ? undefined : newEntry.id,
        client_id: newEntry.clientId || null,
        contract_id: newEntry.contractId || null,
        description: newEntry.description,
        value: newEntry.value,
        due_date: newEntry.dueDate,
        payment_date: newEntry.paymentDate || null,
        status: newEntry.status
      });
    } catch (e) {
      console.warn('Save financial entry error:', e);
    }

    return newEntry;
  }

  // ==========================================
  // 8. TEMPLATES
  // ==========================================
  async getTemplates(): Promise<ProjectTemplate[]> {
    const local = this.getLocal<ProjectTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
    if (local.length === 0) {
      this.setLocal(STORAGE_KEYS.TEMPLATES, DEFAULT_PROJECT_TEMPLATES);
      return DEFAULT_PROJECT_TEMPLATES;
    }
    return local;
  }

  async saveTemplate(tmpl: Partial<ProjectTemplate>): Promise<ProjectTemplate> {
    const existing = await this.getTemplates();
    const id = tmpl.id || `tmpl-${Date.now()}`;
    const newTemplate: ProjectTemplate = {
      id,
      title: tmpl.title || 'Novo Template',
      service: tmpl.service || 'Meta Ads',
      description: tmpl.description || '',
      steps: tmpl.steps || [],
      createdAt: tmpl.createdAt || new Date().toISOString()
    };
    const updated = existing.some((t) => t.id === id)
      ? existing.map((t) => (t.id === id ? newTemplate : t))
      : [...existing, newTemplate];
    this.setLocal(STORAGE_KEYS.TEMPLATES, updated);
    return newTemplate;
  }

  // ==========================================
  // 9. CONTEÚDO EDITORIAL
  // ==========================================
  async getContentItems(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: ContentItem[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          pauta: d.pauta || '',
          pillar: d.pillar || 'Educação',
          format: d.format || 'Post Estático',
          responsible: d.responsible || 'Equipe',
          clientId: d.client_id,
          clientName: d.client_name,
          script: d.script || '',
          caption: d.caption || '',
          scheduledDate: d.scheduled_date || '',
          status: d.status || 'Ideia',
          files: d.files || [],
          externalLink: d.external_link,
          createdAt: d.created_at || new Date().toISOString()
        }));
        this.setLocal(STORAGE_KEYS.CONTENT, mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase content fallback:', e);
    }
    return this.getLocal<ContentItem[]>(STORAGE_KEYS.CONTENT, []);
  }

  async saveContentItem(item: Partial<ContentItem>): Promise<ContentItem> {
    const existing = this.getLocal<ContentItem[]>(STORAGE_KEYS.CONTENT, []);
    const id = item.id || `cnt-${Date.now()}`;
    const newItem: ContentItem = {
      id,
      title: item.title || 'Nova Pauta de Conteúdo',
      pauta: item.pauta || '',
      pillar: item.pillar || 'Institucional',
      format: item.format || 'Carrossel',
      responsible: item.responsible || 'Wesley Nunes',
      clientId: item.clientId,
      clientName: item.clientName,
      script: item.script || '',
      caption: item.caption || '',
      scheduledDate: item.scheduledDate || new Date().toISOString().split('T')[0],
      status: item.status || 'Ideia',
      files: item.files || [],
      externalLink: item.externalLink,
      createdAt: item.createdAt || new Date().toISOString()
    };

    const updated = existing.some((c) => c.id === id)
      ? existing.map((c) => (c.id === id ? newItem : c))
      : [newItem, ...existing];

    this.setLocal(STORAGE_KEYS.CONTENT, updated);

    try {
      await supabase.from('content_items').upsert({
        id: newItem.id.startsWith('cnt-') ? undefined : newItem.id,
        title: newItem.title,
        pauta: newItem.pauta,
        pillar: newItem.pillar,
        format: newItem.format,
        responsible: newItem.responsible,
        client_id: newItem.clientId || null,
        script: newItem.script,
        caption: newItem.caption,
        scheduled_date: newItem.scheduledDate,
        status: newItem.status,
        files: newItem.files,
        external_link: newItem.externalLink
      });
    } catch (e) {
      console.warn('Save content item error:', e);
    }

    return newItem;
  }

  // ==========================================
  // 10. COMENTÁRIOS INTERNOS
  // ==========================================
  getComments(entityType: string, entityId: string): InternalComment[] {
    const all = this.getLocal<InternalComment[]>(STORAGE_KEYS.COMMENTS, []);
    return all.filter((c) => c.entityType === entityType && c.entityId === entityId);
  }

  addComment(comment: Omit<InternalComment, 'id' | 'createdAt'>): InternalComment {
    const all = this.getLocal<InternalComment[]>(STORAGE_KEYS.COMMENTS, []);
    const newComment: InternalComment = {
      ...comment,
      id: `cmt-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.setLocal(STORAGE_KEYS.COMMENTS, [newComment, ...all]);

    try {
      supabase.from('comments').insert({
        entity_type: newComment.entityType,
        entity_id: newComment.entityId,
        user_name: newComment.userName,
        content: newComment.content
      });
    } catch {
      // ignore
    }
    return newComment;
  }

  // ==========================================
  // 11. QUICK LINKS (LINKS RÁPIDOS)
  // ==========================================
  getQuickLinks(clientId?: string, projectId?: string): QuickLink[] {
    const all = this.getLocal<QuickLink[]>(STORAGE_KEYS.QUICK_LINKS, []);
    return all.filter((l) => (clientId && l.clientId === clientId) || (projectId && l.projectId === projectId));
  }

  saveQuickLink(link: Omit<QuickLink, 'id'>): QuickLink {
    const all = this.getLocal<QuickLink[]>(STORAGE_KEYS.QUICK_LINKS, []);
    const newLink: QuickLink = { ...link, id: `lnk-${Date.now()}` };
    this.setLocal(STORAGE_KEYS.QUICK_LINKS, [...all, newLink]);
    return newLink;
  }

  deleteQuickLink(id: string): void {
    const all = this.getLocal<QuickLink[]>(STORAGE_KEYS.QUICK_LINKS, []);
    this.setLocal(STORAGE_KEYS.QUICK_LINKS, all.filter((l) => l.id !== id));
  }

  // ==========================================
  // 12. ONBOARDING & OFFBOARDING
  // ==========================================
  getDefaultOnboardingItems(clientId: string): OnboardingCheckItem[] {
    const defaults = [
      { key: 'contrato_assinado', title: 'Contrato assinado pelas partes' },
      { key: 'pagamento_inicial', title: 'Pagamento inicial compensado' },
      { key: 'formulario_preenchido', title: 'Formulário de onboarding preenchido' },
      { key: 'acessos_recebidos', title: 'Acessos recebidos (BM, Google, Redes)' },
      { key: 'drive_criado', title: 'Pasta no Google Drive estruturada' },
      { key: 'grupo_criado', title: 'Canal de comunicação / Grupo criado' },
      { key: 'briefing_realizado', title: 'Reunião de briefing de alinhamento realizada' },
      { key: 'materiais_recebidos', title: 'Manual de marca e ativos recebidos' },
      { key: 'projeto_criado', title: 'Projeto operacional aberto no sistema' },
      { key: 'responsavel_definido', title: 'Responsável e equipe definidos' }
    ];

    return defaults.map((d, index) => ({
      id: `onb-${clientId}-${d.key}`,
      clientId,
      key: d.key,
      title: d.title,
      completed: false,
      orderIndex: index
    }));
  }

  getOnboarding(clientId: string): OnboardingCheckItem[] {
    const all = this.getLocal<Record<string, OnboardingCheckItem[]>>(STORAGE_KEYS.ONBOARDING, {});
    if (!all[clientId]) {
      const initial = this.getDefaultOnboardingItems(clientId);
      all[clientId] = initial;
      this.setLocal(STORAGE_KEYS.ONBOARDING, all);
      return initial;
    }
    return all[clientId];
  }

  toggleOnboardingItem(clientId: string, key: string, completedBy: string): OnboardingCheckItem[] {
    const all = this.getLocal<Record<string, OnboardingCheckItem[]>>(STORAGE_KEYS.ONBOARDING, {});
    const items = all[clientId] || this.getDefaultOnboardingItems(clientId);
    const updated = items.map((i) => {
      if (i.key === key) {
        const nextCompleted = !i.completed;
        return {
          ...i,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
          completedBy: nextCompleted ? completedBy : undefined
        };
      }
      return i;
    });
    all[clientId] = updated;
    this.setLocal(STORAGE_KEYS.ONBOARDING, all);
    return updated;
  }

  getDefaultOffboardingItems(clientId: string): OnboardingCheckItem[] {
    const defaults = [
      { key: 'projeto_finalizado', title: 'Todos os projetos operacionais finalizados' },
      { key: 'arquivos_entregues', title: 'Arquivos finais e entregáveis compartilhados' },
      { key: 'acessos_revisados', title: 'Acessos e vínculos de BM/Google revogados' },
      { key: 'materiais_organizados', title: 'Acervo e materiais arquivados' },
      { key: 'relatorio_final', title: 'Relatório executivo final apresentado' },
      { key: 'pendencias_financeiras', title: 'Quitação de pendências financeiras' },
      { key: 'depoimento_solicitado', title: 'Depoimento / Case solicitado' },
      { key: 'contrato_encerrado', title: 'Termo de encerramento assinado' }
    ];

    return defaults.map((d, index) => ({
      id: `off-${clientId}-${d.key}`,
      clientId,
      key: d.key,
      title: d.title,
      completed: false,
      orderIndex: index
    }));
  }

  getOffboarding(clientId: string): OnboardingCheckItem[] {
    const all = this.getLocal<Record<string, OnboardingCheckItem[]>>(STORAGE_KEYS.OFFBOARDING, {});
    if (!all[clientId]) {
      const initial = this.getDefaultOffboardingItems(clientId);
      all[clientId] = initial;
      this.setLocal(STORAGE_KEYS.OFFBOARDING, all);
      return initial;
    }
    return all[clientId];
  }

  toggleOffboardingItem(clientId: string, key: string, completedBy: string): OnboardingCheckItem[] {
    const all = this.getLocal<Record<string, OnboardingCheckItem[]>>(STORAGE_KEYS.OFFBOARDING, {});
    const items = all[clientId] || this.getDefaultOffboardingItems(clientId);
    const updated = items.map((i) => {
      if (i.key === key) {
        const nextCompleted = !i.completed;
        return {
          ...i,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
          completedBy: nextCompleted ? completedBy : undefined
        };
      }
      return i;
    });
    all[clientId] = updated;
    this.setLocal(STORAGE_KEYS.OFFBOARDING, all);
    return updated;
  }

  // ==========================================
  // 13. EQUIPE & CARGA DE TRABALHO
  // ==========================================
  async getTeamMembers(projects: Project[], tasks: Task[]): Promise<TeamMember[]> {
    const defaultTeam: TeamMember[] = [
      {
        id: 'tm-1',
        name: 'Wesley Nunes',
        email: 'wesley@alicerce.com',
        role: 'Diretor de Operações & Estratégia',
        roleType: 'admin',
        status: 'Ativo',
        phone: '(11) 98765-4321',
        activeProjectsCount: 0,
        openTasksCount: 0,
        delayedTasksCount: 0
      },
      {
        id: 'tm-2',
        name: 'Estrategista de Tráfego',
        email: 'trafego@alicerce.com',
        role: 'Gestor de Tráfego Pago (Meta & Google)',
        roleType: 'traffic_manager',
        status: 'Ativo',
        activeProjectsCount: 0,
        openTasksCount: 0,
        delayedTasksCount: 0
      },
      {
        id: 'tm-3',
        name: 'Designer Visual',
        email: 'design@alicerce.com',
        role: 'Diretor de Arte & Design',
        roleType: 'designer',
        status: 'Ativo',
        activeProjectsCount: 0,
        openTasksCount: 0,
        delayedTasksCount: 0
      },
      {
        id: 'tm-4',
        name: 'Social Media & Copy',
        email: 'conteudo@alicerce.com',
        role: 'Estrategista de Conteúdo & Copywriter',
        roleType: 'social_media',
        status: 'Ativo',
        activeProjectsCount: 0,
        openTasksCount: 0,
        delayedTasksCount: 0
      }
    ];

    const today = new Date().toISOString().split('T')[0];

    return defaultTeam.map((member) => {
      const activeProj = projects.filter(
        (p) => p.responsible.toLowerCase().includes(member.name.toLowerCase()) || member.roleType === 'admin'
      ).length;
      const openTasks = tasks.filter(
        (t) =>
          t.status !== 'Concluída' &&
          (t.responsible.toLowerCase().includes(member.name.toLowerCase()) || member.roleType === 'admin')
      );
      const delayedTasks = openTasks.filter((t) => t.dueDate < today).length;

      return {
        ...member,
        activeProjectsCount: activeProj,
        openTasksCount: openTasks.length,
        delayedTasksCount: delayedTasks
      };
    });
  }

  // ==========================================
  // 14. AUTOMAÇÕES OPERACIONAIS END-TO-END
  // ==========================================

  /**
   * Converte Lead em Cliente com Onboarding inicial automático
   */
  async convertLeadToClient(lead: Lead, clientOverride?: Partial<Client>): Promise<Client> {
    const companyName = clientOverride?.companyName || lead.company;
    const contactName = clientOverride?.contactName || lead.name;
    const email = clientOverride?.email || lead.email || `contato@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br`;
    const phone = clientOverride?.phone || lead.phone || lead.whatsapp || '';

    const newClientData = {
      companyName,
      contactName,
      email,
      phone,
      segment: clientOverride?.segment || 'Comercial',
      services: clientOverride?.services || [lead.serviceOfInterest],
      startDate: new Date().toISOString().split('T')[0],
      status: 'Onboarding' as const,
      accountManager: lead.responsible || 'Wesley Nunes',
      notes: `Convertido de lead comercial em ${new Date().toLocaleDateString('pt-BR')}. Notas de qualificação: ${lead.notes || 'Nenhuma'}`
    };

    let createdClient = await clientsService.createClient(newClientData);
    if (!createdClient) {
      createdClient = {
        id: `cli-${Date.now()}`,
        ...newClientData,
        createdAt: new Date().toISOString()
      };
    }

    // Atualiza status do Lead para Fechado e salva referência
    await this.saveLead({
      id: lead.id,
      status: 'Fechado',
      convertedClientId: createdClient.id
    });

    // Inicializa checklist de Onboarding
    this.getOnboarding(createdClient.id);

    // Registra atividade no sistema
    await dashboardService.logActivity(
      'Conversão de Lead',
      'lead',
      lead.id,
      `Lead "${lead.company}" convertido em cliente. Onboarding iniciado automaticamente.`
    );

    return createdClient;
  }

  /**
   * Registra contato com Lead e opcionalmente cria Follow-up na Agenda
   */
  async recordLeadContact(
    leadId: string,
    contact: {
      type: string;
      date: string;
      notes: string;
      result: string;
      nextStep?: string;
      followUpDate?: string;
    }
  ): Promise<void> {
    const leads = await this.getLeads();
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead) return;

    // Registra comentário/histórico
    this.addComment({
      entityType: 'lead',
      entityId: leadId,
      userName: 'Wesley Nunes',
      content: `[Contato: ${contact.type}] ${contact.notes} | Resultado: ${contact.result}${contact.nextStep ? ` | Próximo passo: ${contact.nextStep}` : ''}`
    });

    // Se informada data de follow-up, atualiza lead e cria evento na agenda
    if (contact.followUpDate) {
      await this.saveLead({
        id: leadId,
        nextFollowUp: contact.followUpDate
      });

      await this.saveEvent({
        title: `Follow-up: ${targetLead.company}`,
        date: contact.followUpDate,
        time: '14:00',
        type: 'Reunião',
        responsible: targetLead.responsible,
        notes: contact.nextStep || 'Follow-up de alinhamento comercial'
      });
    }

    await dashboardService.logActivity(
      'Contato Registrado',
      'lead',
      leadId,
      `Contato via ${contact.type} registrado com o lead "${targetLead.company}".`
    );
  }

  /**
   * Ativa contrato e gera lançamentos financeiros automáticos
   */
  async activateContract(contractId: string): Promise<Contract> {
    const contracts = await this.getContracts();
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) throw new Error('Contrato não encontrado.');

    const updated = await this.saveContract({
      id: contractId,
      status: 'Ativo'
    });

    // Gera previsão financeira
    const dueDate = contract.startDate || new Date().toISOString().split('T')[0];
    const desc = contract.recurrence === 'Mensal'
      ? `Mensalidade ${contract.service} (1ª parcela)`
      : `Contrato ${contract.service}`;

    await this.saveFinancialEntry({
      clientId: contract.clientId,
      clientName: contract.clientName,
      contractId: contract.id,
      description: desc,
      value: contract.value,
      dueDate,
      status: 'Pendente'
    });

    await dashboardService.logActivity(
      'Contrato Ativado',
      'contract',
      contractId,
      `Contrato de R$ ${contract.value.toLocaleString('pt-BR')} ativado para "${contract.clientName}". Previsão financeira gerada.`
    );

    return updated;
  }

  /**
   * Solicita alteração em aprovação e gera tarefa de ajustes automaticamente
   */
  async requestApprovalChanges(
    approvalId: string,
    feedback: string,
    responsible?: string
  ): Promise<{ approval: ApprovalItem; task: Task }> {
    const approvals = await this.getApprovals();
    const approval = approvals.find((a) => a.id === approvalId);
    if (!approval) throw new Error('Aprovação não encontrada.');

    const updatedHistory = [
      ...(approval.history || []),
      {
        date: new Date().toISOString(),
        status: 'Alterações solicitadas' as const,
        user: 'Wesley Nunes',
        feedback: feedback || 'Ajustes solicitados na peça/material'
      }
    ];

    const updatedApproval = await this.saveApproval({
      id: approvalId,
      status: 'Alterações solicitadas',
      feedback,
      history: updatedHistory
    });

    // Gera tarefa de ajuste em 2 dias
    const in2Days = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
    const newTask = await this.saveTask({
      title: `Realizar ajustes: ${approval.title}`,
      description: `Alterações solicitadas: ${feedback}`,
      projectId: approval.projectId,
      projectName: approval.projectName,
      clientId: approval.clientId,
      clientName: approval.clientName,
      responsible: responsible || approval.responsible || 'Wesley Nunes',
      priority: 'Alta',
      status: 'Pendente',
      dueDate: in2Days
    });

    await dashboardService.logActivity(
      'Ajustes Solicitados',
      'approval',
      approvalId,
      `Alterações solicitadas em "${approval.title}". Tarefa de ajuste criada para ${newTask.responsible}.`
    );

    return { approval: updatedApproval, task: newTask };
  }

  /**
   * Instancia projeto a partir de template e gera tarefas automaticamente
   */
  async instantiateProjectFromTemplate(
    templateId: string,
    data: {
      name: string;
      clientId: string;
      clientName: string;
      responsible: string;
      startDate: string;
      dueDate: string;
    }
  ): Promise<Project> {
    const templates = await this.getTemplates();
    const template = templates.find((t) => t.id === templateId);
    if (!template) throw new Error('Template operacional não encontrado.');

    // Constrói estágios do projeto
    const stages = template.steps.map((st, index) => ({
      name: st.title,
      completed: false,
      completedAt: undefined,
      orderIndex: index
    }));

    const newProject = await projectsService.createProject({
      name: data.name,
      clientId: data.clientId,
      clientName: data.clientName,
      service: template.service,
      responsible: data.responsible,
      startDate: data.startDate,
      dueDate: data.dueDate,
      description: `Projeto gerado a partir do template "${template.title}". ${template.description}`,
      status: 'Planejamento',
      progress: 0,
      stages
    });

    // Gera tarefas padrão para cada etapa do template
    let runningDate = new Date(data.startDate);
    for (const step of template.steps) {
      runningDate.setDate(runningDate.getDate() + (step.estimatedDays || 2));
      const stepDueDate = runningDate.toISOString().split('T')[0];

      await this.saveTask({
        title: `${step.title}`,
        description: step.checklist && step.checklist.length > 0 ? step.checklist.map((c) => `• ${c}`).join('\n') : '',
        projectId: newProject.id,
        projectName: newProject.name,
        clientId: data.clientId,
        clientName: data.clientName,
        responsible: data.responsible,
        priority: 'Média',
        status: 'Pendente',
        dueDate: stepDueDate <= data.dueDate ? stepDueDate : data.dueDate
      });
    }

    await dashboardService.logActivity(
      'Projeto Criado com Template',
      'project',
      newProject.id,
      `Projeto "${data.name}" iniciado via template "${template.title}" com ${template.steps.length} tarefas automáticas.`
    );

    return newProject;
  }

  /**
   * Conclui Onboarding do cliente e ativa cliente na operação
   */
  async completeOnboarding(clientId: string): Promise<boolean> {
    const success = await clientsService.updateClient(clientId, { status: 'Ativo' });
    await dashboardService.logActivity(
      'Onboarding Concluído',
      'client',
      clientId,
      'Checklist de onboarding concluído. Cliente ativado com sucesso.'
    );
    return success;
  }

  /**
   * Conclui Offboarding do cliente e finaliza ciclo
   */
  async completeOffboarding(clientId: string): Promise<boolean> {
    const success = await clientsService.updateClient(clientId, { status: 'Encerrado' });
    await dashboardService.logActivity(
      'Offboarding Concluído',
      'client',
      clientId,
      'Checklist de offboarding concluído. Cliente encerrado formalmente.'
    );
    return success;
  }
}

export const phase2Service = new Phase2Service();
