import { Client, Project, Task, TaskPriority } from '../types';

export interface ParsedTaskDraft {
  tempId: string;
  title: string;
  clientId?: string;
  clientName?: string;
  clientNotFound?: boolean;
  clientSearchTerm?: string;
  projectId?: string;
  projectName?: string;
  responsible: string;
  priority: TaskPriority;
  dueDate: string;
  description: string;
  checklist: string[];
  isPossibleDuplicate?: boolean;
  duplicateReason?: string;
}

export interface TaskCommandContext {
  clients: Client[];
  projects: Project[];
  existingTasks: Task[];
  currentUser?: string;
}

// Utilitário de normalização de texto
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Formatação YYYY-MM-DD
export function formatYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Interpretador de datas em linguagem natural (respeitando timezone local)
export function parseDueDate(text: string, baseDate = new Date()): string {
  if (!text) return formatYMD(baseDate);
  const norm = normalizeText(text);
  const d = new Date(baseDate);

  if (/\bhoje\b/.test(norm)) return formatYMD(d);
  if (/\bamanha\b/.test(norm)) {
    d.setDate(d.getDate() + 1);
    return formatYMD(d);
  }
  if (/\bdepois de amanha\b/.test(norm)) {
    d.setDate(d.getDate() + 2);
    return formatYMD(d);
  }

  if (/\b(semana que vem|proxima semana)\b/.test(norm)) {
    const day = d.getDay();
    const diff = (8 - day) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return formatYMD(d);
  }

  const weekdays: Record<string, number> = {
    domingo: 0,
    segunda: 1,
    terca: 2,
    quarta: 3,
    quinta: 4,
    sexta: 5,
    sabado: 6
  };

  for (const [name, targetDay] of Object.entries(weekdays)) {
    const regex = new RegExp(`\\b(ate\\s+|na\\s+|pra\\s+|para\\s+)?${name}(-feira)?\\b`);
    if (regex.test(norm)) {
      const currentDay = d.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0) {
        if (diff === 0 && /\b(ate|pra|para)\b/.test(norm)) {
          diff = 0;
        } else {
          diff += 7;
        }
      }
      d.setDate(d.getDate() + diff);
      return formatYMD(d);
    }
  }

  // DD/MM/YYYY
  const matchFullDate = norm.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (matchFullDate) {
    const day = parseInt(matchFullDate[1], 10);
    const month = parseInt(matchFullDate[2], 10) - 1;
    let year = parseInt(matchFullDate[3], 10);
    if (year < 100) year += 2000;
    return formatYMD(new Date(year, month, day));
  }

  // DD/MM
  const matchShortDate = norm.match(/\b(\d{1,2})\/(\d{1,2})\b/);
  if (matchShortDate) {
    const day = parseInt(matchShortDate[1], 10);
    const month = parseInt(matchShortDate[2], 10) - 1;
    return formatYMD(new Date(d.getFullYear(), month, day));
  }

  // "dia 10", "ate dia 10"
  const matchDayOnly = norm.match(/\b(ate\s+|para\s+|dia\s+)(\d{1,2})\b/);
  if (matchDayOnly) {
    const day = parseInt(matchDayOnly[2], 10);
    const currentDay = d.getDate();
    let month = d.getMonth();
    let year = d.getFullYear();
    if (day < currentDay) {
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }
    return formatYMD(new Date(year, month, day));
  }

  return formatYMD(d);
}

// Interpretador de prioridade
export function parsePriority(text: string, defaultPriority: TaskPriority = 'Média'): TaskPriority {
  if (!text) return defaultPriority;
  const norm = normalizeText(text);
  if (/\b(urgente|urgencia|pra ontem|asap)\b/.test(norm)) return 'Urgente';
  if (/\b(alta|prioridade alta|alta prioridade|importante|prioritario|critico)\b/.test(norm)) return 'Alta';
  if (/\b(baixa|prioridade baixa|sem pressa|quando der|tranquilo|pouco urgente)\b/.test(norm)) return 'Baixa';
  return defaultPriority;
}

// Limpeza e padronização do título da tarefa
export function cleanTaskTitle(title: string): string {
  let cleaned = title.trim();
  cleaned = cleaned.replace(
    /^(criar tarefa para|criar tarefa|tarefa para|preciso|hoje preciso|amanha preciso|favor|por favor|e)\s+/i,
    ''
  );
  cleaned = cleaned.replace(/\s+(?:ate|pra|para|na|com)\s*$/i, '');
  cleaned = cleaned.replace(/[.,;:]+$/, '').trim();
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}

// Extração de checklist
export function extractChecklist(text: string): string[] {
  const match = text.match(/(?:checklist|etapas|passos|fazer)[\s:]+([\s\S]+)/i);
  if (match) {
    const checklistRaw = match[1];
    return checklistRaw
      .split(/[\n,;•\-*]|\d+\.\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2 && !/^(e|ou)$/i.test(s));
  }
  return [];
}

// Correspondência inteligente de clientes existentes
export function matchClient(
  text: string,
  clients: Client[]
): { client: Client | null; searchTerm?: string } {
  if (!text || !clients || clients.length === 0) return { client: null };
  const norm = normalizeText(text);

  // 1. Busca exata ou por palavra nos clientes cadastrados
  for (const c of clients) {
    const compNorm = normalizeText(c.companyName);
    const contactNorm = normalizeText(c.contactName || '');
    const firstWord = compNorm.split(/\s+/)[0];

    // Nome completo da empresa
    if (new RegExp(`\\b${compNorm}\\b`, 'i').test(norm)) {
      return { client: c };
    }
    // Nome do contato principal
    if (contactNorm && new RegExp(`\\b${contactNorm}\\b`, 'i').test(norm)) {
      return { client: c };
    }
    // Primeira palavra do nome da empresa (ex: "Pablo" para "Pablo Transportes", "Pedro" para "Pedro Fit")
    if (firstWord.length >= 3 && new RegExp(`\\b${firstWord}\\b`, 'i').test(norm)) {
      return { client: c };
    }
  }

  // 2. Extrai menção a cliente quando não encontrado na base
  const explicitClient = norm.match(/cliente[\s:]+([a-z0-9\s]+?)(?:,|\.|$)/i);
  if (explicitClient) {
    return { client: null, searchTerm: explicitClient[1].trim() };
  }

  const prepositionMatch = norm.match(/(?:do|da|de|para|pro|pra)\s+([a-z0-9]+)/i);
  if (prepositionMatch && !/^(hoje|amanha|segunda|terca|quarta|quinta|sexta|sabado|domingo)$/i.test(prepositionMatch[1])) {
    return { client: null, searchTerm: prepositionMatch[1].trim() };
  }

  return { client: null };
}

// Correspondência inteligente de projetos
export function matchProject(text: string, client: Client | null, projects: Project[]): Project | null {
  if (!text || !projects || projects.length === 0) return null;
  const norm = normalizeText(text);

  const candidateProjects = client
    ? projects.filter((p) => p.clientId === client.id)
    : projects;

  for (const p of candidateProjects) {
    const projNorm = normalizeText(p.name);
    if (norm.includes(projNorm) || projNorm.includes(norm)) {
      return p;
    }
  }

  const keywords = [
    'meta ads',
    'google ads',
    'landing page',
    'site institucional',
    'site',
    'identidade visual',
    'social media',
    'criativos',
    'remarketing'
  ];

  for (const kw of keywords) {
    if (norm.includes(kw)) {
      const found = candidateProjects.find((p) => normalizeText(p.name).includes(kw));
      if (found) return found;
      const anyFound = projects.find((p) => normalizeText(p.name).includes(kw));
      if (anyFound) return anyFound;
    }
  }

  return null;
}

// Verificação de tarefas duplicadas existentes
export function checkDuplicate(
  draftTitle: string,
  clientId?: string,
  existingTasks: Task[] = []
): { isDuplicate: boolean; reason?: string } {
  if (!draftTitle || existingTasks.length === 0) return { isDuplicate: false };
  const normDraft = normalizeText(draftTitle);

  for (const task of existingTasks) {
    // Apenas compara com tarefas em aberto ou recentes
    if (task.status === 'Concluída') continue;

    const normExisting = normalizeText(task.title);

    // Título idêntico
    if (normDraft === normExisting) {
      return {
        isDuplicate: true,
        reason: `Já existe "${task.title}" (${task.status})`
      };
    }

    // Mesmo cliente com título muito similar (>80% de palavras em comum)
    if (clientId && task.clientId === clientId) {
      const wordsDraft = normDraft.split(/\s+/).filter((w) => w.length > 2);
      const wordsExisting = normExisting.split(/\s+/).filter((w) => w.length > 2);
      const common = wordsDraft.filter((w) => wordsExisting.includes(w));
      if (wordsDraft.length > 0 && common.length / wordsDraft.length >= 0.7) {
        return {
          isDuplicate: true,
          reason: `Tarefa similar para este cliente: "${task.title}" (${task.status})`
        };
      }
    }
  }

  return { isDuplicate: false };
}

/**
 * Motor nativo de processamento em linguagem natural para criação de tarefas
 */
export async function parseTaskCommand(
  rawInput: string,
  context: TaskCommandContext
): Promise<ParsedTaskDraft[]> {
  const { clients, projects, existingTasks, currentUser = 'Wesley Nunes' } = context;
  const baseDate = new Date();
  const input = rawInput.trim();

  if (!input) return [];

  // Se houver chave OpenAI ou Gemini configurada no .env, tenta chamada estruturada via IA com timeout
  const apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (apiKey) {
    try {
      const aiResult = await tryAiInterpretation(input, context, apiKey);
      if (aiResult && aiResult.length > 0) {
        return aiResult;
      }
    } catch (e) {
      console.warn('AI parser error, fallbacking to local engine:', e);
    }
  }

  // =========================================================================
  // MOTOR LOCAL DE ALTA PRECISÃO (Português Brasileiro)
  // =========================================================================

  // 1. Caso explícito com chaves estruturadas (ex: "Cliente: ...", "Projeto: ...", "Checklist: ...")
  const hasExplicitChecklist = /(?:checklist|etapas|passos):/i.test(input) || /•|(?:\n|^)\s*\d+[\.)]\s+/m.test(input);
  const explicitKeyMatches = input.match(/\b(cliente|projeto|responsavel|responsável|prazo|checklist):/gi) || [];
  const hasExplicitKeyValue = explicitKeyMatches.length >= 2 || hasExplicitChecklist;

  if (hasExplicitKeyValue) {
    let title = '';
    let clientName = '';
    let projectName = '';
    let responsible = currentUser;
    let priority: TaskPriority = 'Média';
    let dueDate = formatYMD(baseDate);
    let description = '';
    let checklist: string[] = [];

    if (hasExplicitChecklist) {
      checklist = extractChecklist(input);
    }

    const mainPart = input.replace(/(?:checklist|etapas|passos)[\s:]+[\s\S]+/i, '').trim();

    const clientMatch = mainPart.match(
      /cliente[\s:]+([A-Za-zÀ-ÿ0-9\s]+?)(?:,|\.|\bprojeto\b|\bresponsavel\b|\bresponsável\b|\bprioridade\b|\bprazo\b|$)/i
    );
    if (clientMatch) clientName = clientMatch[1].trim();

    const projectMatch = mainPart.match(
      /projeto[\s:]+([A-Za-zÀ-ÿ0-9\s]+?)(?:,|\.|\bresponsavel\b|\bresponsável\b|\bprioridade\b|\bprazo\b|$)/i
    );
    if (projectMatch) projectName = projectMatch[1].trim();

    const respMatch = mainPart.match(
      /(?:responsavel|responsável)[\s:]+([A-Za-zÀ-ÿ0-9\s]+?)(?:,|\.|\bprioridade\b|\bprazo\b|$)/i
    );
    if (respMatch) responsible = respMatch[1].trim();

    priority = parsePriority(mainPart);
    dueDate = parseDueDate(mainPart, baseDate);

    let titleCandidate = mainPart;
    if (titleCandidate.includes('.')) {
      titleCandidate = titleCandidate.split('.')[0];
    } else if (titleCandidate.includes(',')) {
      titleCandidate = titleCandidate.split(',')[0];
    }
    title = cleanTaskTitle(
      titleCandidate.replace(/(cliente|projeto|responsavel|responsável|prioridade|prazo)[\s:]+[\s\S]+/i, '')
    );

    const clientResolution = matchClient(clientName || title, clients);
    const matchedClient = clientResolution.client;
    const matchedProject = matchProject(projectName || title, matchedClient, projects);

    const dup = checkDuplicate(title || 'Nova Tarefa', matchedClient?.id, existingTasks);

    return [
      {
        tempId: `draft-${Date.now()}-0`,
        title: title || 'Nova Tarefa',
        clientId: matchedClient?.id,
        clientName: matchedClient?.companyName || (clientName ? clientName : undefined),
        clientNotFound: !matchedClient && !!clientName,
        clientSearchTerm: clientName,
        projectId: matchedProject?.id,
        projectName: matchedProject?.name || (projectName ? projectName : undefined),
        responsible: responsible || currentUser,
        priority,
        dueDate,
        description,
        checklist,
        isPossibleDuplicate: dup.isDuplicate,
        duplicateReason: dup.reason
      }
    ];
  }

  // 2. Multi-tarefas e comandos em fluxo contínuo
  let textToParse = input;
  let globalClient: Client | null = null;
  let globalClientName: string | undefined = undefined;

  // Escopo de cliente no início: "Pablo: ..."
  const prefixMatch = textToParse.match(/^([A-Za-zÀ-ÿ0-9\s]{2,25}):\s*([\s\S]+)/);
  if (prefixMatch) {
    const candidateClientName = prefixMatch[1].trim();
    const clientRes = matchClient(candidateClientName, clients);
    globalClient = clientRes.client;
    globalClientName = clientRes.client?.companyName || candidateClientName;
    textToParse = prefixMatch[2].trim();
  }

  // Modificadores globais no final (ex: "Tudo prioridade alta até sexta.", ". Prioridade alta.")
  let globalPriority: TaskPriority | null = null;
  let globalDate: string | null = null;

  const globalSuffixMatch = textToParse.match(
    /[.,;]?\s*(?:(?:tudo|todas?)\s+)?(prioridade\s+[a-zÀ-ÿ]+|urgente|alta|baixa)[.,;]?$/i
  );
  if (globalSuffixMatch) {
    const suffix = globalSuffixMatch[1];
    globalPriority = parsePriority(suffix);
    textToParse = textToParse
      .replace(/[.,;]?\s*(?:(?:tudo|todas?)\s+)?(?:prioridade\s+[a-zÀ-ÿ]+|urgente|alta|baixa)[.,;]?$/i, '')
      .trim();
  }

  // Modificador de data global no final (ex: "até sexta", "até dia 10")
  const globalDateSuffix = textToParse.match(
    /[.,;]?\s*(?:(?:tudo|todas?)\s+)?(ate\s+[a-zÀ-ÿ0-9\/]+|pra\s+[a-zÀ-ÿ0-9\/]+)[.,;]?$/i
  );
  if (globalDateSuffix) {
    globalDate = parseDueDate(globalDateSuffix[1], baseDate);
    textToParse = textToParse
      .replace(/[.,;]?\s*(?:(?:tudo|todas?)\s+)?(?:ate\s+[a-zÀ-ÿ0-9\/]+|pra\s+[a-zÀ-ÿ0-9\/]+)[.,;]?$/i, '')
      .trim();
  }

  // Prefixo de data global: "Hoje preciso ...", "Amanhã preciso ..."
  let globalPrefixDate: string | null = null;
  if (/^hoje\s+/i.test(textToParse)) {
    globalPrefixDate = parseDueDate('hoje', baseDate);
    textToParse = textToParse.replace(/^hoje\s+(?:preciso\s+)?/i, '');
  } else if (/^amanha\s+/i.test(textToParse)) {
    globalPrefixDate = parseDueDate('amanha', baseDate);
    textToParse = textToParse.replace(/^amanha\s+(?:preciso\s+)?/i, '');
  }

  // Caso especial: Tarefa única com ponto final e micro-etapas de checklist
  // ex: "Concluir site. Revisar mobile, testar formulário, revisar links e publicar."
  const sentenceList = textToParse
    .split(/\.\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentenceList.length === 2) {
    const second = sentenceList[1];
    const microItems = second
      .split(/,\s*|\s+e\s+/)
      .map((m) => m.trim().replace(/[.,;:]+$/, ''))
      .filter((m) => m.length > 0);

    if (microItems.length >= 2 && microItems.every((m) => m.split(' ').length <= 4)) {
      const cliRes = matchClient(sentenceList[0], clients);
      const cli = cliRes.client || globalClient;
      const proj = matchProject(sentenceList[0], cli, projects);
      const finalTitle = cleanTaskTitle(sentenceList[0]);
      const dup = checkDuplicate(finalTitle, cli?.id, existingTasks);

      return [
        {
          tempId: `draft-${Date.now()}-0`,
          title: finalTitle,
          clientId: cli?.id,
          clientName: cli?.companyName || globalClientName,
          clientNotFound: !cli && !!cliRes.searchTerm,
          clientSearchTerm: cliRes.searchTerm,
          projectId: proj?.id,
          projectName: proj?.name,
          responsible: currentUser,
          priority: globalPriority || parsePriority(sentenceList[0]),
          dueDate: globalDate || globalPrefixDate || parseDueDate(sentenceList[0], baseDate),
          description: '',
          checklist: microItems,
          isPossibleDuplicate: dup.isDuplicate,
          duplicateReason: dup.reason
        }
      ];
    }
  }

  // Quebra por linhas, pontos e vírgulas com ações
  const blocks = textToParse
    .split(/[\n;.]/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  const rawSegments: string[] = [];
  for (const block of blocks) {
    const subSegments = block.split(/,\s*|\s+e\s+/i);
    if (subSegments.length > 1) {
      for (const sub of subSegments) {
        if (sub.trim().length > 0) rawSegments.push(sub.trim());
      }
    } else {
      rawSegments.push(block);
    }
  }

  const resultTasks: ParsedTaskDraft[] = [];
  let lastSeenClient: Client | null = globalClient;
  let lastSeenClientName: string | undefined = globalClientName;

  for (let idx = 0; idx < rawSegments.length; idx++) {
    const seg = rawSegments[idx];
    if (!seg || seg.length < 2) continue;

    const cliRes = matchClient(seg, clients);
    let segClient = cliRes.client;
    let segClientName = cliRes.client?.companyName;

    if (!segClient) {
      if (/\b(para ele|dele|com ele|pra ele|para ela|dela|pra ela)\b/i.test(seg) && lastSeenClient) {
        segClient = lastSeenClient;
        segClientName = lastSeenClientName;
      } else if (globalClient) {
        segClient = globalClient;
        segClientName = globalClientName;
      }
    } else {
      lastSeenClient = segClient;
      lastSeenClientName = segClient.companyName;
    }

    const segProject = matchProject(seg, segClient, projects);
    const segPriority = globalPriority || parsePriority(seg);
    const segDueDate = globalDate || globalPrefixDate || parseDueDate(seg, baseDate);

    // Limpeza de palavras auxiliares do título
    let title = cleanTaskTitle(seg);
    title = title
      .replace(/\b(ate\s+|na\s+|pra\s+|para\s+)?(segunda|terca|quarta|quinta|sexta|sabado|domingo)(-feira)?\b/gi, '')
      .replace(/\b(hoje|amanha|depois de amanha)\b/gi, '')
      .replace(/\b(prioridade\s+alta|prioridade\s+baixa|prioridade\s+urgente|prioridade\s+media)\b/gi, '')
      .replace(/\b(urgente|alta|baixa)\b/gi, '')
      .replace(/\b(ate\s+|pra\s+|para\s+)?dia\s+\d+\b/gi, '')
      .replace(/\b(ate|pra|para|na)\s*$/gi, '')
      .trim();

    if (segClient && /\bpara ele\b/i.test(title)) {
      title = title.replace(/\bpara ele\b/i, `para ${segClient.contactName || segClient.companyName}`);
    }

    title = cleanTaskTitle(title);

    const dup = checkDuplicate(title || 'Nova Tarefa', segClient?.id, existingTasks);

    resultTasks.push({
      tempId: `draft-${Date.now()}-${idx}`,
      title: title || 'Nova Tarefa',
      clientId: segClient?.id,
      clientName: segClientName || (cliRes.searchTerm ? cliRes.searchTerm : undefined),
      clientNotFound: !segClient && !!cliRes.searchTerm,
      clientSearchTerm: cliRes.searchTerm,
      projectId: segProject?.id,
      projectName: segProject?.name,
      responsible: currentUser,
      priority: segPriority || 'Média',
      dueDate: segDueDate,
      description: '',
      checklist: [],
      isPossibleDuplicate: dup.isDuplicate,
      duplicateReason: dup.reason
    });
  }

  return resultTasks;
}

// Chamada opcional para API externa de IA se chave configurada
async function tryAiInterpretation(
  prompt: string,
  context: TaskCommandContext,
  apiKey: string
): Promise<ParsedTaskDraft[] | null> {
  const clientsList = context.clients.map((c) => ({ id: c.id, name: c.companyName, contact: c.contactName }));
  const projectsList = context.projects.map((p) => ({ id: p.id, name: p.name, clientId: p.clientId }));

  const systemPrompt = `Você é o interpretador de tarefas do Alicerce OS.
Hoje é ${formatYMD(new Date())}.
Analise o comando do usuário e retorne um JSON no formato:
{
  "tasks": [
    {
      "title": "Título claro da tarefa",
      "clientName": "Nome do cliente mencionado ou null",
      "projectName": "Nome do projeto ou null",
      "responsible": "Responsável ou '${context.currentUser || 'Wesley Nunes'}'",
      "priority": "Baixa" | "Média" | "Alta" | "Urgente",
      "dueDate": "YYYY-MM-DD",
      "description": "Texto adicional ou vazio",
      "checklist": ["item 1", "item 2"]
    }
  ]
}
Clientes conhecidos: ${JSON.stringify(clientsList.slice(0, 30))}
Projetos conhecidos: ${JSON.stringify(projectsList.slice(0, 30))}
Retorne APENAS o JSON.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (!parsed.tasks || !Array.isArray(parsed.tasks)) return null;

    return parsed.tasks.map((t: any, i: number) => {
      const cliRes = matchClient(t.clientName || t.title, context.clients);
      const proj = matchProject(t.projectName || t.title, cliRes.client, context.projects);
      const dup = checkDuplicate(t.title, cliRes.client?.id, context.existingTasks);

      return {
        tempId: `draft-ai-${Date.now()}-${i}`,
        title: cleanTaskTitle(t.title),
        clientId: cliRes.client?.id,
        clientName: cliRes.client?.companyName || t.clientName,
        clientNotFound: !cliRes.client && !!t.clientName,
        clientSearchTerm: t.clientName,
        projectId: proj?.id,
        projectName: proj?.name || t.projectName,
        responsible: t.responsible || context.currentUser || 'Wesley Nunes',
        priority: (['Baixa', 'Média', 'Alta', 'Urgente'].includes(t.priority) ? t.priority : 'Média') as TaskPriority,
        dueDate: t.dueDate || formatYMD(new Date()),
        description: t.description || '',
        checklist: Array.isArray(t.checklist) ? t.checklist : [],
        isPossibleDuplicate: dup.isDuplicate,
        duplicateReason: dup.reason
      };
    });
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
