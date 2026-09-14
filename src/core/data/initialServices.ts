import { ServiceEntity } from '../types/service';

export const INITIAL_SERVICES_DATA: ServiceEntity[] = [
  {
    id: 'serv-lp-01',
    name: 'Landing Page de Alta Conversão',
    code: 'LP-CONV-01',
    description: 'Página de aterrissagem ultra rápida com copywriting persuasivo voltada para conversão direta no WhatsApp e captação de clientes qualificados.',
    status: 'active',
    defaultFunnelStage: 'prospeccao',
    defaultFunnelStageName: 'Prospecção (Primeiro Toque)',
    deliverables: [
      'Estrutura com carregamento ultra rápido (< 1.2s)',
      'Copywriting persuasivo validado para direcionamento no WhatsApp',
      'Integração com Google Ads, Meta Pixel e tags de conversão',
      'Painel analítico e formulário com verificação anti-spam',
      'Design responsivo mobile-first'
    ],
    idealCustomerProfile: 'Clínicas estéticas, consultórios de alto padrão, prestadores de serviços premium e negócios com tráfego sem conversão.',
    countryPrices: [
      {
        id: 'cp-lp-mz',
        country: 'Moçambique',
        countryCode: 'MZ',
        currency: 'MT',
        currencySymbol: 'MT',
        myPrice: 10000,
        marketMinPrice: 6000,
        marketMaxPrice: 25000,
        notes: 'Preço padrão para negócios em Maputo, Matola e Beira.'
      },
      {
        id: 'cp-lp-pt',
        country: 'Portugal',
        countryCode: 'PT',
        currency: 'EUR',
        currencySymbol: '€',
        myPrice: 137,
        marketMinPrice: 90,
        marketMaxPrice: 450,
        notes: 'Preço para PMEs em Portugal (Lisboa, Porto, Braga).'
      },
      {
        id: 'cp-lp-br',
        country: 'Brasil',
        countryCode: 'BR',
        currency: 'BRL',
        currencySymbol: 'R$',
        myPrice: 597,
        marketMinPrice: 350,
        marketMaxPrice: 1800,
        notes: 'Setup rápido com entrega em 5 dias úteis.'
      },
      {
        id: 'cp-lp-ao',
        country: 'Angola',
        countryCode: 'AO',
        currency: 'AOA',
        currencySymbol: 'Kz',
        myPrice: 120000,
        marketMinPrice: 75000,
        marketMaxPrice: 300000,
        notes: 'Operações em Luanda e Benguela.'
      }
    ],
    qualificationCriteria: [
      {
        id: 'qc-lp-1',
        label: 'Presença digital inexistente ou site lento/desatualizado',
        importance: 'obrigatorio',
        description: 'A empresa não tem página onde os anúncios e redes direcionam, ou a atual perde visitantes.'
      },
      {
        id: 'qc-lp-2',
        label: 'Empresa já divulga ou investe em redes sociais/WhatsApp',
        importance: 'obrigatorio',
        description: 'Existe demanda ativa ou tráfego mínimo para ser convertido.'
      },
      {
        id: 'qc-lp-3',
        label: 'Decisor direto acessível (Dono, Gerente Comercial ou Diretor)',
        importance: 'obrigatorio',
        description: 'Capacidade de decidir fechamento em até 7 dias.'
      },
      {
        id: 'qc-lp-4',
        label: 'Capacidade de atender leads no WhatsApp no mesmo dia',
        importance: 'desejavel',
        description: 'Se a empresa demora dias para responder, a Landing Page não gera o ROI esperado.'
      }
    ],
    qualificationQuestions: [
      {
        id: 'qq-lp-1',
        question: 'Quando um cliente em potencial pesquisa pelo seu serviço no Google ou redes sociais, para onde você direciona ele hoje?',
        expectedAnswerInsight: 'Se responder "perfil do Instagram" ou "link direto solto", a perda de autoridade e conversão é imediata.',
        category: 'dor'
      },
      {
        id: 'qq-lp-2',
        question: 'Você sente que perde vendas para concorrentes porque sua apresentação digital não transmite toda a autoridade que sua empresa possui?',
        expectedAnswerInsight: 'Valida a dor psicológica de posicionamento e status da marca.',
        category: 'dor'
      },
      {
        id: 'qq-lp-3',
        question: 'Qual é o volume médio de contatos que chegam no seu WhatsApp por semana através da internet?',
        expectedAnswerInsight: 'Permite quantificar o ROI: dobrar a taxa de conversão sobre o volume atual.',
        category: 'orcamento'
      },
      {
        id: 'qq-lp-4',
        question: 'Se a estrutura estiver pronta em 7 dias, quem mais além de você precisa aprovar a publicação?',
        expectedAnswerInsight: 'Mapeia imediatamente outros decisores ocultos.',
        category: 'decisao'
      }
    ],
    createdAt: '13/09/2026',
    updatedAt: '13/09/2026',
    version: 1,
  },
  {
    id: 'serv-sales-os-02',
    name: 'Leadion Sales OS & Consultoria de Prospecção',
    code: 'SALES-OS-02',
    description: 'Estruturação completa da máquina de prospecção comercial outbound, playbooks de cadência, scripts por canal e acompanhamento diário de metas.',
    status: 'active',
    defaultFunnelStage: 'qualificacao',
    defaultFunnelStageName: 'Qualificação (Validando Dor/ICP)',
    deliverables: [
      'Implementação do Sales OS e painel de execução diária',
      'Matriz de scripts por nicho e scripts de quebra de objeções',
      'Treinamento operacional para SDRs e vendedores',
      'Auditoria semanal de cadência e taxa de conversão'
    ],
    idealCustomerProfile: 'Empresas B2B, prestadoras de serviços corporativos, distribuidoras e consultorias com equipe de 1 a 10 vendedores.',
    countryPrices: [
      {
        id: 'cp-sos-mz',
        country: 'Moçambique',
        countryCode: 'MZ',
        currency: 'MT',
        currencySymbol: 'MT',
        myPrice: 45000,
        marketMinPrice: 25000,
        marketMaxPrice: 90000,
        notes: 'Consultoria e implantação mensal.'
      },
      {
        id: 'cp-sos-pt',
        country: 'Portugal',
        countryCode: 'PT',
        currency: 'EUR',
        currencySymbol: '€',
        myPrice: 650,
        marketMinPrice: 400,
        marketMaxPrice: 1500,
        notes: 'Implementação de processos comerciais B2B.'
      },
      {
        id: 'cp-sos-br',
        country: 'Brasil',
        countryCode: 'BR',
        currency: 'BRL',
        currencySymbol: 'R$',
        myPrice: 2800,
        marketMinPrice: 1500,
        marketMaxPrice: 6500,
        notes: 'Rampagem de SDRs em 30 dias.'
      }
    ],
    qualificationCriteria: [
      {
        id: 'qc-sos-1',
        label: 'Ticket médio de venda acima de $500 ou equivalente local',
        importance: 'obrigatorio',
        description: 'Garante margem suficiente para retorno imediato do investimento.'
      },
      {
        id: 'qc-sos-2',
        label: 'Empresa quer crescer ativamente e não depender só de indicações',
        importance: 'obrigatorio',
        description: 'Empresas acomodadas não executam a rotina de prospecção diária.'
      }
    ],
    qualificationQuestions: [
      {
        id: 'qq-sos-1',
        question: 'Quantas novas empresas a sua equipe prospecta e contata ativamente por dia?',
        expectedAnswerInsight: 'Maioria faz menos de 5 por dia de forma desordenada. Dor forte de processo.',
        category: 'dor'
      },
      {
        id: 'qq-sos-2',
        question: 'Como você garante que nenhum lead qualificado fique mais de 48 horas esquecido sem próximo contato?',
        expectedAnswerInsight: 'Se não tiverem sistema rigoroso, perdem 30% dos leads na mesa.',
        category: 'dor'
      }
    ],
    createdAt: '13/09/2026',
    updatedAt: '13/09/2026',
    version: 1,
  },
  {
    id: 'serv-automation-03',
    name: 'Automação & Triagem Comercial no WhatsApp',
    code: 'AUTO-WPP-03',
    description: 'Sistema inteligente de pré-atendimento, triagem por regras de negócio e roteamento instantâneo para o corretor ou consultor responsável.',
    status: 'active',
    defaultFunnelStage: 'contato_feito',
    defaultFunnelStageName: 'Contato Feito (Em Conversa)',
    deliverables: [
      'Fluxo de triagem humanizado em menos de 10 segundos',
      'Distribuição automática de leads por consultor (Round-robin)',
      'Integração de agendamento automático na agenda Google/Outlook',
      'Painel de tempo de primeira resposta e conversão'
    ],
    idealCustomerProfile: 'Negócios com alto fluxo de mensagens recebidas (clínicas, imobiliárias, concessionárias e escolas).',
    countryPrices: [
      {
        id: 'cp-auto-mz',
        country: 'Moçambique',
        countryCode: 'MZ',
        currency: 'MT',
        currencySymbol: 'MT',
        myPrice: 20000,
        marketMinPrice: 12000,
        marketMaxPrice: 40000,
        notes: 'Automação para canais WhatsApp Business API.'
      },
      {
        id: 'cp-auto-pt',
        country: 'Portugal',
        countryCode: 'PT',
        currency: 'EUR',
        currencySymbol: '€',
        myPrice: 290,
        marketMinPrice: 180,
        marketMaxPrice: 700,
        notes: 'Integração de atendimento e triagem.'
      },
      {
        id: 'cp-auto-br',
        country: 'Brasil',
        countryCode: 'BR',
        currency: 'BRL',
        currencySymbol: 'R$',
        myPrice: 1200,
        marketMinPrice: 750,
        marketMaxPrice: 3000,
        notes: 'Atendimento instantâneo 24/7.'
      }
    ],
    qualificationCriteria: [
      {
        id: 'qc-auto-1',
        label: 'Recebe mais de 15 mensagens comerciais por dia',
        importance: 'obrigatorio',
        description: 'Sem volume mínimo, a automação não gera impacto perceptível.'
      },
      {
        id: 'qc-auto-2',
        label: 'Tempo de primeira resposta atual superior a 15 minutos',
        importance: 'desejavel',
        description: 'Leads esfriam rapidamente se não forem atendidos nos primeiros minutos.'
      }
    ],
    qualificationQuestions: [
      {
        id: 'qq-auto-1',
        question: 'Quanto tempo demora em média para um cliente que manda mensagem às 20h ou no fim de semana ser atendido pela sua empresa?',
        expectedAnswerInsight: 'Normalmente só na segunda-feira às 10h, quando o lead já comprou de outro.',
        category: 'dor'
      }
    ],
    createdAt: '13/09/2026',
    updatedAt: '13/09/2026',
    version: 1,
  },
  {
    id: 'serv-traffic-04',
    name: 'Gestão de Tráfego Pago de Alta Intenção',
    code: 'TRAF-ADS-04',
    description: 'Campanhas focadas em busca intencional no Google Ads e segmentação de alto valor no Meta Ads, orientadas exclusivamente a gerar conversas qualificadas.',
    status: 'active',
    defaultFunnelStage: 'prospeccao',
    defaultFunnelStageName: 'Prospecção (Primeiro Toque)',
    deliverables: [
      'Estruturação de campanhas no Google Search e Meta Ads',
      'Negativação de palavras-chave desqualificadas e termos sem intenção',
      'Otimização contínua de custo por contato (CPL)',
      'Relatório quinzenal focado em vendas e ROI real'
    ],
    idealCustomerProfile: 'Empresas com ticket acima de R$ 500 ou equivalente, já com equipe de atendimento pronta.',
    countryPrices: [
      {
        id: 'cp-traf-mz',
        country: 'Moçambique',
        countryCode: 'MZ',
        currency: 'MT',
        currencySymbol: 'MT',
        myPrice: 15000,
        marketMinPrice: 8000,
        marketMaxPrice: 35000,
        notes: 'Fee mensal de gestão.'
      },
      {
        id: 'cp-traf-pt',
        country: 'Portugal',
        countryCode: 'PT',
        currency: 'EUR',
        currencySymbol: '€',
        myPrice: 220,
        marketMinPrice: 150,
        marketMaxPrice: 600,
        notes: 'Campanhas em Google & Instagram.'
      },
      {
        id: 'cp-traf-br',
        country: 'Brasil',
        countryCode: 'BR',
        currency: 'BRL',
        currencySymbol: 'R$',
        myPrice: 950,
        marketMinPrice: 600,
        marketMaxPrice: 2500,
        notes: 'Fee mensal de gestão de tráfego.'
      }
    ],
    qualificationCriteria: [
      {
        id: 'qc-traf-1',
        label: 'Orçamento mensal para anúncios disponível',
        importance: 'obrigatorio',
        description: 'Além do fee de gestão, o cliente precisa investir na plataforma de anúncios.'
      }
    ],
    qualificationQuestions: [
      {
        id: 'qq-traf-1',
        question: 'Você já anunciou no Google ou no Instagram anteriormente? Como foi o retorno em vendas?',
        expectedAnswerInsight: 'Mapeia traumas de agências anteriores que só entregavam "cliques" e não vendas.',
        category: 'orcamento'
      }
    ],
    createdAt: '13/09/2026',
    updatedAt: '13/09/2026',
    version: 1,
  }
];
