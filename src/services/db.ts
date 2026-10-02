import {
  Client,
  Project,
  SOPProcess,
  Material,
  UserProfile,
  NotificationItem,
  ActivityItem
} from '../types';

const STORAGE_KEYS = {
  CLIENTS: 'alicerce_clients_v1',
  PROJECTS: 'alicerce_projects_v1',
  PROCESSES: 'alicerce_processes_v1',
  MATERIALS: 'alicerce_materials_v1',
  USER: 'alicerce_user_v1',
  NOTIFICATIONS: 'alicerce_notifications_v1',
  ACTIVITIES: 'alicerce_activities_v1',
  AUTH: 'alicerce_auth_v1'
};

export const defaultUser: UserProfile = {
  id: 'usr-1',
  name: 'Wesley Nunes',
  email: 'admin@alicerce.com',
  role: 'Diretor de Operações & Estratégia',
  roleType: 'Admin',
  phone: '(11) 98765-4321'
};

const initialClients: Client[] = [
  {
    id: 'cli-1',
    companyName: 'Vanguard Arquitetura & Engenharia',
    contactName: 'Ricardo Silveira',
    email: 'contato@vanguardarquitetura.com.br',
    phone: '(11) 99882-1100',
    website: 'https://vanguardarquitetura.com.br',
    instagram: '@vanguard.arq',
    segment: 'Arquitetura de Alto Padrão',
    services: ['Meta Ads', 'Google Ads', 'Landing Page', 'Identidade Visual'],
    startDate: '2024-03-15',
    accountManager: 'Wesley Nunes',
    notes: 'Cliente focado em captação de clientes para projetos residenciais acima de R$ 500k. Reunião mensal toda primeira terça-feira.',
    status: 'Ativo',
    createdAt: '2024-03-15T10:00:00.000Z'
  },
  {
    id: 'cli-2',
    companyName: 'Lumina Odontologia Estética',
    contactName: 'Dra. Camila Ferreira',
    email: 'gestao@luminaodonto.com.br',
    phone: '(11) 98722-4433',
    website: 'https://luminaodonto.com.br',
    instagram: '@lumina.odontologia',
    segment: 'Saúde & Estética Premium',
    services: ['Meta Ads', 'Google Meu Negócio', 'Criativos', 'Social Media'],
    startDate: '2024-05-10',
    accountManager: 'Wesley Nunes',
    notes: 'Meta de 40 novos agendamentos mensais para lentes de contato e harmonização orofacial.',
    status: 'Ativo',
    createdAt: '2024-05-10T14:30:00.000Z'
  },
  {
    id: 'cli-3',
    companyName: 'Nexum Consultoria Financeira',
    contactName: 'Eduardo Martins',
    email: 'eduardo@nexumfinance.com.br',
    phone: '(21) 97654-3210',
    website: 'https://nexumfinance.com.br',
    instagram: '@nexum.finance',
    segment: 'B2B & Finanças Corporativas',
    services: ['Site Institucional', 'Plano Estratégico', 'Google Ads'],
    startDate: '2024-08-01',
    accountManager: 'Ana Castro',
    notes: 'Em fase de transição de posicionamento institucional. Necessita alinhamento de personas executivas.',
    status: 'Onboarding',
    createdAt: '2024-08-01T09:15:00.000Z'
  },
  {
    id: 'cli-4',
    companyName: 'Aura Joias Contemporâneas',
    contactName: 'Mariana Duarte',
    email: 'mariana@aurajoias.com.br',
    phone: '(31) 98234-9988',
    website: 'https://aurajoias.com.br',
    instagram: '@aura.joias',
    segment: 'E-commerce & Luxo',
    services: ['Meta Ads', 'Criativos', 'Edição de Vídeo', 'Social Media'],
    startDate: '2024-02-20',
    accountManager: 'Wesley Nunes',
    notes: 'Campanhas de tráfego direto para e-commerce. Média de ROAS esperada de 4.5x.',
    status: 'Ativo',
    createdAt: '2024-02-20T11:45:00.000Z'
  },
  {
    id: 'cli-5',
    companyName: 'Origem Café Especial',
    contactName: 'Lucas Prado',
    email: 'lucas@origemcafe.com.br',
    phone: '(19) 99123-4567',
    instagram: '@origemcafes',
    segment: 'Varejo & Franquias',
    services: ['Identidade Visual', 'Social Media'],
    startDate: '2023-11-10',
    accountManager: 'Ana Castro',
    notes: 'Pausado momentaneamente para reforma física da segunda unidade franqueada. Retorno previsto próximo mês.',
    status: 'Pausado',
    createdAt: '2023-11-10T16:00:00.000Z'
  }
];

const initialProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Aquisição Meta & Google Q4 — Alta Conversão',
    clientId: 'cli-1',
    clientName: 'Vanguard Arquitetura & Engenharia',
    service: 'Meta Ads',
    responsible: 'Wesley Nunes',
    startDate: '2024-09-15',
    dueDate: '2024-10-25',
    description: 'Campanha de geração de leads qualificados para projetos residenciais de alto padrão em SP.',
    status: 'Em produção',
    progress: 60,
    stages: [
      { id: 'stg-1', title: 'Briefing e Alinhamento de ICP', completed: true },
      { id: 'stg-2', title: 'Auditoria e Acessos ao Gerenciador de Anúncios', completed: true },
      { id: 'stg-3', title: 'Planejamento de Testes e Estrutura de Campanhas', completed: true },
      { id: 'stg-4', title: 'Produção de Criativos e Copywriting', completed: false },
      { id: 'stg-5', title: 'Aprovação com o Cliente', completed: false },
      { id: 'stg-6', title: 'Publicação e Otimização Semanal', completed: false }
    ],
    notes: 'Pixel configurado via CAPI. Foco nos bairros Jardins, Moema e Morumbi.',
    relatedMaterials: ['Briefing Padrão de Aquisição', 'Template de Relatório Mensal de Performance'],
    createdAt: '2024-09-15T09:00:00.000Z'
  },
  {
    id: 'proj-2',
    name: 'Campanha Estética Premium & Harmonização',
    clientId: 'cli-2',
    clientName: 'Lumina Odontologia Estética',
    service: 'Criativos',
    responsible: 'Wesley Nunes',
    startDate: '2024-09-20',
    dueDate: '2024-10-18',
    description: 'Pack de 12 criativos estáticos + 4 vídeos curtos para captação de agendamentos no WhatsApp.',
    status: 'Revisão',
    progress: 80,
    stages: [
      { id: 'stg-21', title: 'Briefing com Dra. Camila', completed: true },
      { id: 'stg-22', title: 'Acessos aos ativos e fotos de casos clínicos', completed: true },
      { id: 'stg-23', title: 'Roteiros de Vídeo e Copy de Anúncios', completed: true },
      { id: 'stg-24', title: 'Design e Edição de Vídeos', completed: true },
      { id: 'stg-25', title: 'Revisão Interna e Ajustes de Compliance', completed: false },
      { id: 'stg-26', title: 'Entrega final e subida no Meta Ads', completed: false }
    ],
    notes: 'Respeitar normas do CFO para não prometer resultados garantidos.',
    relatedMaterials: ['Checklist de Compliance Saúde'],
    createdAt: '2024-09-20T10:30:00.000Z'
  },
  {
    id: 'proj-3',
    name: 'Portal Institucional Nexum 2025',
    clientId: 'cli-3',
    clientName: 'Nexum Consultoria Financeira',
    service: 'Site Institucional',
    responsible: 'Ana Castro',
    startDate: '2024-09-28',
    dueDate: '2024-11-10',
    description: 'Desenvolvimento do novo site institucional focado em autoridade, captação B2B e SEO técnico.',
    status: 'Planejamento',
    progress: 20,
    stages: [
      { id: 'stg-31', title: 'Briefing e Arquitetura de Conteúdo', completed: true },
      { id: 'stg-32', title: 'Acessos ao domínio e hospedagem', completed: false },
      { id: 'stg-33', title: 'Wireframe de Baixa Fidelidade', completed: false },
      { id: 'stg-34', title: 'UI Design no Figma', completed: false },
      { id: 'stg-35', title: 'Desenvolvimento Front-end', completed: false },
      { id: 'stg-36', title: 'Homologação e Publicação', completed: false }
    ],
    notes: 'Integração direta com CRM da Nexum para envio de leads.',
    relatedMaterials: ['Apresentação Institucional Alicerce'],
    createdAt: '2024-09-28T14:00:00.000Z'
  },
  {
    id: 'proj-4',
    name: 'Lançamento Coleção Aura Primavera/Verão',
    clientId: 'cli-4',
    clientName: 'Aura Joias Contemporâneas',
    service: 'Edição de Vídeo',
    responsible: 'Wesley Nunes',
    startDate: '2024-09-10',
    dueDate: '2024-10-15',
    description: 'Edição de 8 reels/TikToks dinâmicos gravados em estúdio com a modelo da nova coleção.',
    status: 'Aguardando cliente',
    progress: 50,
    stages: [
      { id: 'stg-41', title: 'Recebimento do material bruto', completed: true },
      { id: 'stg-42', title: 'Decupagem e seleção de takes', completed: true },
      { id: 'stg-43', title: 'Primeiro corte e trilha sonora', completed: true },
      { id: 'stg-44', title: 'Aprovação do corte pelo cliente', completed: false },
      { id: 'stg-45', title: 'Color grading e finalização', completed: false },
      { id: 'stg-46', title: 'Entrega dos arquivos em 4K', completed: false }
    ],
    notes: 'Aguardando feedback da Mariana sobre a música da versão 02.',
    relatedMaterials: ['Template de Relatório Mensal de Performance'],
    createdAt: '2024-09-10T11:00:00.000Z'
  },
  {
    id: 'proj-5',
    name: 'Reestruturação de Branding & Redesign',
    clientId: 'cli-5',
    clientName: 'Origem Café Especial',
    service: 'Identidade Visual',
    responsible: 'Ana Castro',
    startDate: '2024-08-01',
    dueDate: '2024-10-30',
    description: 'Renovação do manual de marca, embalagens dos grãos e padronização visual das cafeterias.',
    status: 'Planejamento',
    progress: 35,
    stages: [
      { id: 'stg-51', title: 'Pesquisa de mercado e benchmarking', completed: true },
      { id: 'stg-52', title: 'Definição do conceito e universo da marca', completed: true },
      { id: 'stg-53', title: 'Desenho do novo símbolo e tipografia', completed: false },
      { id: 'stg-54', title: 'Design das embalagens de café', completed: false },
      { id: 'stg-55', title: 'Apresentação da Identidade', completed: false },
      { id: 'stg-56', title: 'Fechamento de arquivos para impressão', completed: false }
    ],
    notes: 'Aguardando confirmação da abertura da segunda unidade.',
    relatedMaterials: ['Manual de Estilo e Tom de Voz'],
    createdAt: '2024-08-01T15:00:00.000Z'
  }
];

const initialProcesses: SOPProcess[] = [
  {
    id: 'proc-meta-ads',
    title: 'Meta Ads — Gestão de Tráfego de Alta Conversão',
    service: 'Meta Ads',
    category: 'Aquisição',
    responsible: 'Wesley Nunes',
    updatedAt: '2024-09-25',
    description: 'Processo padronizado da Alicerce para estruturação, escala e otimização contínua de campanhas no ecossistema Meta (Instagram & Facebook).',
    steps: [
      {
        stepNumber: '01',
        title: 'Briefing e Alinhamento Estratégico',
        description: 'Mapeamento profundo do ICP, ticket médio, histórico de vendas e metas numéricas do cliente.',
        checklist: [
          'Preencher formulário de briefing de aquisição com o cliente',
          'Definir meta clara de CPA (Custo por Aquisição) e ROAS mínimo viável',
          'Mapear principais objeções de compra e diferenciais da oferta',
          'Documentar verba diária recomendada e alocação por funil'
        ]
      },
      {
        stepNumber: '02',
        title: 'Acessos e Auditoria de Ativos',
        description: 'Garantir posse e configuração técnica impecável de todos os ativos do Gerenciador de Negócios.',
        checklist: [
          'Solicitar acesso de parceiro ao Business Manager (BM) do cliente',
          'Verificar Pixel do Meta e status de eventos via API de Conversões (CAPI)',
          'Verificar se o domínio está autenticado e mensuração de eventos agregados configurada',
          'Checar se conta de anúncio e método de pagamento estão saudáveis'
        ]
      },
      {
        stepNumber: '03',
        title: 'Planejamento e Arquitetura de Campanhas',
        description: 'Estruturação do funil de tráfego Alicerce: Topo (Atração/Validação), Meio (Engajamento/Autoridade) e Fundo (Conversão Direta).',
        checklist: [
          'Definir matriz de públicos: Lookalikes, Interesses qualificados e Públicos Personalizados',
          'Criar taxonomia e nomenclatura padronizada Alicerce para campanhas e anúncios',
          'Distribuir orçamento: 70% Perpétuo/Conversão, 20% Validação de Criativos, 10% Remarketing'
        ]
      },
      {
        stepNumber: '04',
        title: 'Configuração Técnica e Rastreamento',
        description: 'Validação da esteira de dados e parâmetros UTM para clareza total de atribuição.',
        checklist: [
          'Configurar parâmetros de URL padronizados (utm_source, utm_medium, utm_campaign, utm_content)',
          'Testar eventos de Lead, Purchase e Initiate Checkout no Events Manager',
          'Configurar regras automáticas de proteção de orçamento contra variações anômalas'
        ]
      },
      {
        stepNumber: '05',
        title: 'Produção de Criativos e Copywriting',
        description: 'Desenvolvimento de variações focadas em dores, benefícios e ganchos de alta retenção.',
        checklist: [
          'Elaborar no mínimo 3 ganchos iniciais (hook) para cada ângulo da oferta',
          'Produzir criativos em formatos nativos (9:16 para Reels/Stories e 1:1 / 4:5 para Feed)',
          'Inserir CTAs claros direcionando para Landing Page ou WhatsApp institucional'
        ]
      },
      {
        stepNumber: '06',
        title: 'Publicação e Validação Inicial',
        description: 'Lançamento das campanhas e checagem de aprovação nas políticas de publicidade do Meta.',
        checklist: [
          'Subir campanhas e validar se nenhum anúncio entrou em rejeição por política',
          'Realizar teste ponta a ponta: clicar no anúncio, preencher formulário e conferir recebimento',
          'Avisar o cliente sobre o início oficial da veiculação'
        ]
      },
      {
        stepNumber: '07',
        title: 'Otimização Semanal e Escala',
        description: 'Rotina de poda de criativos saturados e ampliação de orçamento nas combinações vencedoras.',
        checklist: [
          'Desativar criativos com CTR abaixo da média do nicho ou frequência excessiva',
          'Identificar públicos de menor CPA e aplicar escala vertical gradual (15% a 20% a cada 48h)',
          'Inserir novos testes de criativos semanais para evitar fadiga de audiência'
        ]
      },
      {
        stepNumber: '08',
        title: 'Relatório Executivo e Reunião de Resultados',
        description: 'Tradução de dados brutos em decisões de negócios para o cliente.',
        checklist: [
          'Consolidar Dashboard de Métricas com foco em Faturamento Gerado, Leads e ROI',
          'Gravar vídeo explicativo de 5 minutos destacando os principais insights',
          'Apresentar plano de ação e próximas hipóteses para o próximo ciclo'
        ]
      }
    ]
  },
  {
    id: 'proc-google-ads',
    title: 'Google Ads — Captura de Intenção e Fundo de Funil',
    service: 'Google Ads',
    category: 'Aquisição',
    responsible: 'Wesley Nunes',
    updatedAt: '2024-09-22',
    description: 'Processo estratégico para dominar buscas de alta intenção comercial no Google Search, Performance Max e Rede de Display.',
    steps: [
      {
        stepNumber: '01',
        title: 'Mapeamento de Palavras-Chave e Termos Negativos',
        description: 'Identificação exata do vocabulário do comprador pronto para fechar negócio.',
        checklist: [
          'Pesquisar volume e CPC no Planejador de Palavras-chave do Google',
          'Criar lista robusta de palavras-chave negativas (grátis, download, curso, emprego, pdf)',
          'Separar campanhas por intenção: Institucional, Serviços Específicos e Concorrentes'
        ]
      },
      {
        stepNumber: '02',
        title: 'Configuração do Google Tag Manager & GA4',
        description: 'Instalação sem falhas de conversões primárias no site do cliente.',
        checklist: [
          'Criar tags de conversão do Google Ads no GTM',
          'Ativar conversões aprimoradas para maior precisão pós-cookies',
          'Checar disparo em tempo real no Google Tag Assistant'
        ]
      },
      {
        stepNumber: '03',
        title: 'Estruturação de Anúncios Responsivos de Pesquisa (RSA)',
        description: 'Criação de títulos e descrições persuasivas com inserção dinâmica de palavras-chave.',
        checklist: [
          'Preencher no mínimo 10 títulos com alta relevância para a palavra-chave',
          'Incluir 4 extensões essenciais: Sitelinks, Snippets estruturados, Frases de destaque e Chamada',
          'Garantir Qualidade do Anúncio classificada como Excelente ou Boa'
        ]
      },
      {
        stepNumber: '04',
        title: 'Otimização Contínua de Termos de Pesquisa',
        description: 'Auditoria de consultas reais dos usuários para eliminar desperdício de verba.',
        checklist: [
          'Auditar relatório de termos de pesquisa 2 vezes por semana',
          'Negativar termos irrelevantes no nível da conta e campanha',
          'Ajustar lances com base em localização geográfica e dispositivos'
        ]
      }
    ]
  },
  {
    id: 'proc-social-media',
    title: 'Social Media — Posicionamento, Autoridade e Retenção',
    service: 'Social Media',
    category: 'Conteúdo',
    responsible: 'Wesley Nunes',
    updatedAt: '2024-09-20',
    description: 'Construção de presença digital com método editorial que posiciona a marca como referência no mercado.',
    steps: [
      {
        stepNumber: '01',
        title: 'Linha Editorial & Tom de Voz',
        description: 'Definição dos pilares de conteúdo e identidade verbal da marca.',
        checklist: [
          'Definir os 4 pilares: Educacional, Prova Social, Bastidores e Posicionamento Forte',
          'Ajustar vocabulário da marca: termos proibidos e expressões proprietárias',
          'Estabelecer proporção semanal de formatos (Reels, Carrossel, Estático, Stories)'
        ]
      },
      {
        stepNumber: '02',
        title: 'Calendário Mensal e Roteirização',
        description: 'Antecipação e planejamento para execução sem improviso.',
        checklist: [
          'Criar grade de posts do mês até o dia 25 do mês anterior',
          'Escrever roteiros com ganchos fortes nos primeiros 3 segundos para vídeos',
          'Submeter calendário para aprovação do cliente com prazo de retorno definido'
        ]
      },
      {
        stepNumber: '03',
        title: 'Design, Edição e Agendamento',
        description: 'Refinamento estético impecável alinhado à identidade visual da marca.',
        checklist: [
          'Produzir artes com tipografia legível e contraste harmonioso',
          'Revisar ortografia e gramática antes da publicação',
          'Agendar posts nos melhores horários de audiência da conta'
        ]
      }
    ]
  },
  {
    id: 'proc-gmb',
    title: 'Google Meu Negócio — Domínio da Busca Local',
    service: 'Google Meu Negócio',
    category: 'Presença Digital',
    responsible: 'Wesley Nunes',
    updatedAt: '2024-09-18',
    description: 'Transformação do perfil do Google em uma máquina diária de ligações, rotas e clientes locais.',
    steps: [
      {
        stepNumber: '01',
        title: 'Verificação e Otimização Cadastral 100%',
        description: 'Garantia de conformidade máxima para ranqueamento no Google Maps.',
        checklist: [
          'Definir categoria primária e secundárias mais estratégicas',
          'Preencher horários de funcionamento, telefone com WhatsApp e link para agendamento',
          'Escrever descrição do negócio contendo palavras-chave da cidade e serviços principais'
        ]
      },
      {
        stepNumber: '02',
        title: 'Catálogo de Produtos, Serviços e Fotos Profissionais',
        description: 'Apresentação visual que transmite credibilidade imediata ao usuário.',
        checklist: [
          'Cadastrar todos os serviços prestados com faixas de preço e descrições claras',
          'Subir fotos da fachada, equipe, recepção e estrutura em alta resolução com geolocalização',
          'Configurar mensagens diretas e respostas automáticas no aplicativo'
        ]
      },
      {
        stepNumber: '03',
        title: 'Estratégia Contínua de Avaliações 5 Estrelas',
        description: 'Mecanismo ativo para captação semanal de novos depoimentos de clientes satisfeitos.',
        checklist: [
          'Criar link curto personalizado para solicitação de avaliação',
          'Implantar roteiro de WhatsApp pós-atendimento para solicitação de review',
          'Responder 100% das avaliações (positivas e negativas) com tom profissional e acolhedor'
        ]
      }
    ]
  },
  {
    id: 'proc-landing-page',
    title: 'Landing Pages — Arquitetura de Alta Conversão',
    service: 'Landing Page',
    category: 'Presença Digital',
    responsible: 'Ana Castro',
    updatedAt: '2024-09-19',
    description: 'Construção de páginas de captura focadas em velocidade, narrativa persuasiva e conversão máxima.',
    steps: [
      {
        stepNumber: '01',
        title: 'Copywriting e Arquitetura de Informação',
        description: 'Estruturação da narrativa de vendas da página.',
        checklist: [
          'Headlines focadas na maior dor e principal transformação desejada pelo lead',
          'Seção de quebra de objeções, garantias e prova social inegável',
          'Formulário conciso priorizando campos estritamente necessários'
        ]
      },
      {
        stepNumber: '02',
        title: 'Design UI/UX e Responsividade Mobile-First',
        description: 'Estética premium com leitura fluida e carregamento ultrarrápido em 4G.',
        checklist: [
          'Desenhar layout com contraste adequado para botões de CTA primários',
          'Otimizar todas as imagens em formato WebP de até 150kb',
          'Testar usabilidade nos smartphones mais populares do mercado'
        ]
      },
      {
        stepNumber: '03',
        title: 'Integrações, Pixels e Mensuração',
        description: 'Conexão dos leads com o time comercial em tempo real.',
        checklist: [
          'Integrar envio de leads para WhatsApp, e-mail e CRM do cliente',
          'Instalar Pixel do Meta e tags de conversão do Google Ads',
          'Configurar página de agradecimento (Thank You Page) com eventos de conversão disparados'
        ]
      }
    ]
  },
  {
    id: 'proc-site-institucional',
    title: 'Site Institucional — Autoridade e Posicionamento Digital',
    service: 'Site Institucional',
    category: 'Presença Digital',
    responsible: 'Ana Castro',
    updatedAt: '2024-09-15',
    description: 'Desenvolvimento do ativo central da empresa com SEO técnico e experiência de marca sofisticada.',
    steps: [
      {
        stepNumber: '01',
        title: 'Mapeamento de Páginas e Wireframing',
        description: 'Definição da hierarquia de navegação e fluxos do usuário.',
        checklist: [
          'Definir mapa do site (Home, Sobre, Serviços, Cases, Contato, Blog)',
          'Aprovar wireframe de estrutura com o cliente antes de iniciar design final'
        ]
      },
      {
        stepNumber: '02',
        title: 'Desenvolvimento e SEO Técnico On-page',
        description: 'Performance técnica para ranqueamento orgânico no Google.',
        checklist: [
          'Configurar títulos, meta-descriptions e headings (H1, H2, H3) otimizados',
          'Garantir pontuação superior a 90 no Google PageSpeed Insights',
          'Instalar certificado SSL e configurar redirecionamento HTTPS'
        ]
      }
    ]
  },
  {
    id: 'proc-identidade-visual',
    title: 'Identidade Visual — Concepção de Marcas Marcantes',
    service: 'Identidade Visual',
    category: 'Marca',
    responsible: 'Ana Castro',
    updatedAt: '2024-09-12',
    description: 'Construção da linguagem visual e posicionamento estético de marcas premium.',
    steps: [
      {
        stepNumber: '01',
        title: 'Diagnóstico e Universo Visual (Moodboard)',
        description: 'Imersão nos valores, diferenciais e referências visuais da marca.',
        checklist: [
          'Conduzir entrevista de essência de marca com os fundadores',
          'Montar painel semântico com tipografias, cores, texturas e referências de mercado',
          'Definir arquétipo de marca e pilares conceituais'
        ]
      },
      {
        stepNumber: '02',
        title: 'Concepção do Símbolo, Tipografia e Paleta',
        description: 'Criação do sistema de identidade com rigor geométrico e significado.',
        checklist: [
          'Desenvolver estudos de símbolo e tipografia proprietária ou refinada',
          'Testar legibilidade em redução extrema (favicon) e grandes formatos',
          'Definir paleta primária, secundária e de apoio com códigos HEX, RGB e CMYK'
        ]
      },
      {
        stepNumber: '03',
        title: 'Manual de Identidade e Aplicações Reais',
        description: 'Entrega das diretrizes completas para aplicação consistente.',
        checklist: [
          'Criar mockups de aplicações reais: papelaria, fardamento, embalagens, digital',
          'Montar Brand Guidelines com regras de área de respiro e proibições de uso',
          'Exportar arquivos finais em vetores (.AI, .EPS, .SVG) e bitmap (.PNG transparente, .JPG)'
        ]
      }
    ]
  },
  {
    id: 'proc-criativos',
    title: 'Criativos de Alta Performance — Direção de Arte & Ganchos',
    service: 'Criativos',
    category: 'Conteúdo',
    responsible: 'Wesley Nunes',
    updatedAt: '2024-09-14',
    description: 'Metodologia Alicerce para criação de anúncios que prendem a atenção e convertem cliques.',
    steps: [
      {
        stepNumber: '01',
        title: 'Análise de Ganchos e Benchmarking de Concorrentes',
        description: 'Mapeamento do que está performando no nicho e na biblioteca de anúncios.',
        checklist: [
          'Analisar Biblioteca de Anúncios do Meta para identificar padrões ativos dos líderes',
          'Definir 5 ângulos emocionais e racionais para teste',
          'Rascunhar copies com chamada clara para ação nos primeiros 100 caracteres'
        ]
      },
      {
        stepNumber: '02',
        title: 'Direção de Arte e Produção Visual',
        description: 'Criação de peças visuais limpas, com tipografia de impacto e foco no produto/serviço.',
        checklist: [
          'Diagramar peças estáticas em 1:1, 4:5 e 9:16',
          'Garantir leitura imediata mesmo em telas de celular sob luz solar direta',
          'Submeter para controle de qualidade interno antes do envio'
        ]
      }
    ]
  },
  {
    id: 'proc-videos',
    title: 'Edição de Vídeos Promocionais — Ritmo e Retenção',
    service: 'Edição de Vídeo',
    category: 'Conteúdo',
    responsible: 'Wesley Nunes',
    updatedAt: '2024-09-10',
    description: 'Edição audiovisual com cortes dinâmicos, storytelling e retenção máxima nos primeiros segundos.',
    steps: [
      {
        stepNumber: '01',
        title: 'Decupagem e Seleção dos Melhores Momentos',
        description: 'Filtragem minuciosa dos melhores takes brutos.',
        checklist: [
          'Organizar pastas de projeto e sincronizar áudios de lapela',
          'Remover pausas, vícios de linguagem e respirações prolongadas',
          'Construir introdução impactante de no máximo 3 segundos'
        ]
      },
      {
        stepNumber: '02',
        title: 'Tratamento, Legendas e Sound Design',
        description: 'Polimento técnico de áudio, cor e elementos dinâmicos na tela.',
        checklist: [
          'Aplicar color grading equilibrado e natural',
          'Tratar áudio com compressão vocal e remoção de ruídos de fundo',
          'Inserir legendas dinâmicas animadas e efeitos sonoros sutis que pontuam a fala'
        ]
      }
    ]
  },
  {
    id: 'proc-plano-estrategico',
    title: 'Plano Estratégico — Estruturação de Crescimento com Base',
    service: 'Plano Estratégico',
    category: 'Estratégia',
    responsible: 'Wesley Nunes',
    updatedAt: '2024-09-05',
    description: 'Diagnóstico e arquitetura completa dos canais de crescimento, posicionamento e vendas da empresa.',
    steps: [
      {
        stepNumber: '01',
        title: 'Imersão Profunda e Diagnóstico Comercial',
        description: 'Entendimento total dos números, capacidade produtiva e margens do cliente.',
        checklist: [
          'Realizar reunião de imersão de 2 horas com lideranças do cliente',
          'Mapear funil atual de vendas e principais gargalos de fechamento',
          'Definir metas financeiras para os próximos 6 e 12 meses'
        ]
      },
      {
        stepNumber: '02',
        title: 'Construção do Roadmap e Matriz de Canais',
        description: 'Plano de ação faseado com definição clara de responsáveis e prazos.',
        checklist: [
          'Determinar canais prioritários (Google, Meta, Conteúdo, Parcerias)',
          'Elaborar matriz de orçamento por canal e projeção de receita esperada',
          'Entregar documento executivo do Plano Estratégico Alicerce'
        ]
      }
    ]
  }
];

const initialMaterials: Material[] = [
  {
    id: 'mat-1',
    title: 'Briefing Geral de Aquisição e Tráfego Pago',
    category: 'Briefings',
    description: 'Questionário completo para coleta de informações de ICP, oferta, metas e histórico de campanhas.',
    updatedAt: '2024-09-20',
    responsible: 'Wesley Nunes',
    fileType: 'doc',
    fileSize: '240 KB',
    externalLink: 'https://docs.google.com/document/d/alicerce-briefing-aquisicao'
  },
  {
    id: 'mat-2',
    title: 'Contrato de Prestação de Serviços Alicerce 2025',
    category: 'Contratos',
    description: 'Minuta jurídica padrão com cláusulas de escopo, confidencialidade, prazos e remuneração.',
    updatedAt: '2024-09-15',
    responsible: 'Wesley Nunes',
    fileType: 'pdf',
    fileSize: '512 KB',
    externalLink: 'https://alicerce.com.br/docs/contrato-padrao-2025.pdf'
  },
  {
    id: 'mat-3',
    title: 'Checklist Oficial de Onboarding de Clientes',
    category: 'Checklists',
    description: 'Roteiro passo a passo para os primeiros 15 dias de atendimento: acessos, reuniões e alinhamentos.',
    updatedAt: '2024-09-10',
    responsible: 'Ana Castro',
    fileType: 'sheet',
    fileSize: '180 KB',
    externalLink: 'https://docs.google.com/spreadsheets/d/alicerce-onboarding-checklist'
  },
  {
    id: 'mat-4',
    title: 'Apresentação Institucional & Credenciais Alicerce',
    category: 'Apresentações',
    description: 'Slide deck comercial com posicionamento, metodologia, cases de sucesso e serviços oferecidos.',
    updatedAt: '2024-09-28',
    responsible: 'Wesley Nunes',
    fileType: 'figma',
    fileSize: '18.4 MB',
    externalLink: 'https://figma.com/@alicerce/apresentacao-institucional'
  },
  {
    id: 'mat-5',
    title: 'Template de Relatório Mensal Executivo',
    category: 'Relatórios',
    description: 'Modelo visual padronizado para apresentação de resultados de tráfego, vendas e crescimento aos clientes.',
    updatedAt: '2024-09-18',
    responsible: 'Wesley Nunes',
    fileType: 'sheet',
    fileSize: '350 KB',
    externalLink: 'https://docs.google.com/spreadsheets/d/alicerce-template-relatorio'
  },
  {
    id: 'mat-6',
    title: 'Manual de Estilo e Diretrizes de Tom de Voz',
    category: 'Templates',
    description: 'Guia editorial de redação, posturas recomendadas, adjetivos-chave e diretrizes de comunicação da Alicerce.',
    updatedAt: '2024-08-30',
    responsible: 'Wesley Nunes',
    fileType: 'pdf',
    fileSize: '2.1 MB',
    externalLink: 'https://alicerce.com.br/docs/guia-tom-de-voz.pdf'
  },
  {
    id: 'mat-7',
    title: 'Guia de Solicitação de Acessos ao Cliente (Meta & Google)',
    category: 'Documentos internos',
    description: 'Passo a passo ilustrado para enviar ao cliente explicando como conceder acesso às contas com segurança.',
    updatedAt: '2024-09-05',
    responsible: 'Ana Castro',
    fileType: 'pdf',
    fileSize: '1.4 MB',
    externalLink: 'https://alicerce.com.br/docs/guia-acessos-cliente.pdf'
  },
  {
    id: 'mat-8',
    title: 'Proposta Comercial Padrão Alicerce — Estrutura de Vendas',
    category: 'Comercial',
    description: 'Template de proposta de alto impacto com apresentação de planos, escopos e termos de investimento.',
    updatedAt: '2024-09-22',
    responsible: 'Wesley Nunes',
    fileType: 'doc',
    fileSize: '620 KB',
    externalLink: 'https://docs.google.com/document/d/alicerce-proposta-comercial'
  }
];

const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Prazo próximo: Campanha Aura Joias',
    message: 'A entrega dos vídeos da campanha Primavera/Verão está prevista para 15 de Outubro.',
    type: 'deadline',
    timestamp: 'Hoje, 09:30',
    read: false,
    link: 'proj-4'
  },
  {
    id: 'notif-2',
    title: 'Novo material disponível',
    message: 'Wesley adicionou "Apresentação Institucional & Credenciais Alicerce" à biblioteca.',
    type: 'material',
    timestamp: 'Ontem, 16:45',
    read: false
  },
  {
    id: 'notif-3',
    title: 'Processo atualizado: Meta Ads',
    message: 'Etapas de auditoria técnica e CAPI revisadas conforme novas diretrizes de 2025.',
    type: 'update',
    timestamp: 'Há 2 dias',
    read: true,
    link: 'proc-meta-ads'
  }
];

const initialActivities: ActivityItem[] = [
  {
    id: 'act-1',
    title: 'Etapa de projeto concluída',
    description: 'Briefing e Alinhamento de ICP concluído no projeto Vanguard Arquitetura.',
    timestamp: 'Hoje, 11:20',
    type: 'project',
    user: 'Wesley Nunes'
  },
  {
    id: 'act-2',
    title: 'Novo cliente cadastrado',
    description: 'Nexum Consultoria Financeira iniciou onboarding na agência.',
    timestamp: 'Ontem, 15:40',
    type: 'client',
    user: 'Ana Castro'
  },
  {
    id: 'act-3',
    title: 'Material atualizado',
    description: 'Proposta Comercial Padrão Alicerce teve escopos revisados.',
    timestamp: 'Há 2 dias',
    type: 'material',
    user: 'Wesley Nunes'
  },
  {
    id: 'act-4',
    title: 'Processo operacional otimizado',
    description: 'SOP de Google Ads recebeu novas diretrizes para Performance Max.',
    timestamp: 'Há 3 dias',
    type: 'process',
    user: 'Wesley Nunes'
  }
];

// Database helper functions with LocalStorage persistence
class AlicerceDatabase {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // Init default data if empty
  public init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
      this.set(STORAGE_KEYS.CLIENTS, initialClients);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
      this.set(STORAGE_KEYS.PROJECTS, initialProjects);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROCESSES)) {
      this.set(STORAGE_KEYS.PROCESSES, initialProcesses);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MATERIALS)) {
      this.set(STORAGE_KEYS.MATERIALS, initialMaterials);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USER)) {
      this.set(STORAGE_KEYS.USER, defaultUser);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      this.set(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
      this.set(STORAGE_KEYS.ACTIVITIES, initialActivities);
    }
  }

  public resetToDefaults(): void {
    this.set(STORAGE_KEYS.CLIENTS, initialClients);
    this.set(STORAGE_KEYS.PROJECTS, initialProjects);
    this.set(STORAGE_KEYS.PROCESSES, initialProcesses);
    this.set(STORAGE_KEYS.MATERIALS, initialMaterials);
    this.set(STORAGE_KEYS.USER, defaultUser);
    this.set(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    this.set(STORAGE_KEYS.ACTIVITIES, initialActivities);
  }

  // Clients
  public getClients(): Client[] {
    return this.get<Client[]>(STORAGE_KEYS.CLIENTS, initialClients);
  }

  public saveClient(client: Client): Client {
    const clients = this.getClients();
    const index = clients.findIndex((c) => c.id === client.id);
    if (index >= 0) {
      clients[index] = client;
    } else {
      clients.unshift(client);
    }
    this.set(STORAGE_KEYS.CLIENTS, clients);
    this.addActivity({
      title: index >= 0 ? 'Cliente atualizado' : 'Novo cliente cadastrado',
      description: `${client.companyName} teve seus dados salvos.`,
      type: 'client',
      user: this.getUser().name
    });
    return client;
  }

  public deleteClient(id: string): void {
    const client = this.getClients().find((c) => c.id === id);
    const clients = this.getClients().filter((c) => c.id !== id);
    this.set(STORAGE_KEYS.CLIENTS, clients);
    if (client) {
      this.addActivity({
        title: 'Cliente removido',
        description: `${client.companyName} foi removido do sistema.`,
        type: 'client',
        user: this.getUser().name
      });
    }
  }

  // Projects
  public getProjects(): Project[] {
    return this.get<Project[]>(STORAGE_KEYS.PROJECTS, initialProjects);
  }

  public saveProject(project: Project): Project {
    const projects = this.getProjects();
    const index = projects.findIndex((p) => p.id === project.id);
    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.unshift(project);
    }
    this.set(STORAGE_KEYS.PROJECTS, projects);
    this.addActivity({
      title: index >= 0 ? 'Projeto atualizado' : 'Novo projeto criado',
      description: `Projeto "${project.name}" (${project.clientName}) atualizado.`,
      type: 'project',
      user: this.getUser().name
    });
    return project;
  }

  public deleteProject(id: string): void {
    const project = this.getProjects().find((p) => p.id === id);
    const projects = this.getProjects().filter((p) => p.id !== id);
    this.set(STORAGE_KEYS.PROJECTS, projects);
    if (project) {
      this.addActivity({
        title: 'Projeto removido',
        description: `Projeto "${project.name}" foi excluído.`,
        type: 'project',
        user: this.getUser().name
      });
    }
  }

  // Processes
  public getProcesses(): SOPProcess[] {
    return this.get<SOPProcess[]>(STORAGE_KEYS.PROCESSES, initialProcesses);
  }

  public saveProcess(process: SOPProcess): SOPProcess {
    const processes = this.getProcesses();
    const index = processes.findIndex((p) => p.id === process.id);
    if (index >= 0) {
      processes[index] = process;
    } else {
      processes.unshift(process);
    }
    this.set(STORAGE_KEYS.PROCESSES, processes);
    this.addActivity({
      title: index >= 0 ? 'Processo editado' : 'Novo processo criado',
      description: `SOP "${process.title}" foi salvo.`,
      type: 'process',
      user: this.getUser().name
    });
    return process;
  }

  public deleteProcess(id: string): void {
    const processes = this.getProcesses().filter((p) => p.id !== id);
    this.set(STORAGE_KEYS.PROCESSES, processes);
  }

  // Materials
  public getMaterials(): Material[] {
    return this.get<Material[]>(STORAGE_KEYS.MATERIALS, initialMaterials);
  }

  public saveMaterial(material: Material): Material {
    const materials = this.getMaterials();
    const index = materials.findIndex((m) => m.id === material.id);
    if (index >= 0) {
      materials[index] = material;
    } else {
      materials.unshift(material);
    }
    this.set(STORAGE_KEYS.MATERIALS, materials);
    this.addActivity({
      title: index >= 0 ? 'Material editado' : 'Material adicionado',
      description: `"${material.title}" disponível na biblioteca.`,
      type: 'material',
      user: this.getUser().name
    });
    return material;
  }

  public deleteMaterial(id: string): void {
    const material = this.getMaterials().find((m) => m.id === id);
    const materials = this.getMaterials().filter((m) => m.id !== id);
    this.set(STORAGE_KEYS.MATERIALS, materials);
    if (material) {
      this.addActivity({
        title: 'Material removido',
        description: `"${material.title}" foi removido da biblioteca.`,
        type: 'material',
        user: this.getUser().name
      });
    }
  }

  // User
  public getUser(): UserProfile {
    return this.get<UserProfile>(STORAGE_KEYS.USER, defaultUser);
  }

  public saveUser(user: UserProfile): void {
    this.set(STORAGE_KEYS.USER, user);
  }

  // Auth
  public getAuthSession(): { isAuthenticated: boolean; email: string } {
    return this.get(STORAGE_KEYS.AUTH, {
      isAuthenticated: true, // Default active for seamless initial view, or configurable
      email: 'admin@alicerce.com'
    });
  }

  public setAuthSession(session: { isAuthenticated: boolean; email: string }): void {
    this.set(STORAGE_KEYS.AUTH, session);
  }

  // Notifications
  public getNotifications(): NotificationItem[] {
    return this.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  }

  public markNotificationAsRead(id: string): void {
    const notifs = this.getNotifications().map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  public markAllNotificationsAsRead(): void {
    const notifs = this.getNotifications().map((n) => ({ ...n, read: true }));
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  // Activities
  public getActivities(): ActivityItem[] {
    return this.get<ActivityItem[]>(STORAGE_KEYS.ACTIVITIES, initialActivities);
  }

  public addActivity(activity: Omit<ActivityItem, 'id' | 'timestamp'>): void {
    const activities = this.getActivities();
    const newAct: ActivityItem = {
      ...activity,
      id: 'act-' + Date.now(),
      timestamp: 'Agora'
    };
    activities.unshift(newAct);
    if (activities.length > 20) activities.pop();
    this.set(STORAGE_KEYS.ACTIVITIES, activities);
  }
}

export const db = new AlicerceDatabase();
