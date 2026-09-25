import { Lead } from '../types/lead';
import { Company } from '../types/company';
import { Objection, ProspectScript, ServiceOffering } from '../types/script';

/**
 * DADOS INICIAIS DO LEADION
 * As coleções de Leads e Empresas iniciam completamente limpas para novos usuários.
 * Nenhum dado fictício ou de demonstração (ex: Clínica Aurora, Veloce) é carregado.
 */

export const INITIAL_LEADS: Lead[] = [];

export const INITIAL_COMPANIES: Company[] = [];

export const INITIAL_OBJECTIONS: Objection[] = [
  {
    id: 'obj-01',
    objectionText: '"Já temos um fornecedor / sistema que resolve isso."',
    category: 'satisfaction',
    corePsychology: 'O lead quer evitar o risco e o esforço de migração. Não quer que você fale mal da escolha dele.',
    recommendedResponses: [
      {
        approach: 'qualification',
        label: 'Pivot de Comparação Convivência',
        script: 'Com certeza, e não queremos que vocês troquem nada agora. Na maioria dos nossos clientes eles também utilizavam a ferramenta X. O que fizemos foi atuar exatamente onde o sistema legado não cobre, que é a automação preditiva. Se eu puder te mostrar em 10 minutos sem mexer no seu contrato atual, faria sentido?',
        nextStepQuestion: 'Hoje esse fornecedor consegue te dar esse dado em tempo real ou exige trabalho manual da equipe?',
      },
      {
        approach: 'case_study',
        label: 'Prova Social Direta',
        script: 'Entendo perfeitamente. A Empresa Alfa dizia exatamente o mesmo há 4 meses. Eles mantiveram o ERP atual e integraram nossa camada apenas para resolver o gargalo de rotas. O resultado foi R$ 45k de economia no primeiro mês.',
        nextStepQuestion: 'Se conseguirmos o mesmo ganho sem romper com eles, você avaliaria os números?',
      }
    ],
  },
  {
    id: 'obj-02',
    objectionText: '"Não temos orçamento / verba para isso agora."',
    category: 'budget',
    corePsychology: 'O lead não enxergou o custo de continuar com o problema atual, ou está usando verba como desculpa educada.',
    recommendedResponses: [
      {
        approach: 'pivot',
        label: 'Inversão Custo vs. Perda Operacional',
        script: 'Faz total sentido o cuidado com caixa no trimestre. Justamente por isso: nosso modelo não é um centro de custo extra, e sim um estancador de vazamento de margem. Pelos dados da sua frota, o desperdício atual em rotas custa mais do que o triplo da mensalidade da plataforma.',
        nextStepQuestion: 'Se o projeto se pagar em menos de 30 dias com o combustível economizado, isso justificaria uma conversa técnica?',
      }
    ],
  },
  {
    id: 'obj-03',
    objectionText: '"Me manda um e-mail com apresentação para eu dar uma olhada."',
    category: 'timing',
    corePsychology: 'Despacho educado padrão para encerrar a ligação/conversa sem compromisso.',
    recommendedResponses: [
      {
        approach: 'empathy_and_value',
        label: 'Filtro de Relevância e Agendamento',
        script: 'Posso te enviar sim, com prazer. Mas temos apresentações diferentes para cada porte de operação. Para eu não te mandar 40 slides genéricos que ninguém lê: qual é o principal indicador que você mais precisa melhorar neste semestre?',
        nextStepQuestion: 'Prefere que eu envie focando no corte de custos ou na velocidade da expedição?',
      }
    ],
  },
  {
    id: 'obj-04',
    objectionText: '"Estou sem tempo / muito corrido esta semana."',
    category: 'timing',
    corePsychology: 'A prioridade da prospecção não superou as urgências imediatas do dia a dia.',
    recommendedResponses: [
      {
        approach: 'pivot',
        label: 'Microrreunião de 8 Minutos',
        script: 'Totalmente compreensível. Ninguém da diretoria de operações tem 1 hora livre. É exatamente por isso que nossas conversas iniciais duram no máximo 8 minutos no cronômetro, direto ao ponto.',
        nextStepQuestion: 'Sua agenda costuma ser mais tranquila no início da manhã de quinta ou no final de sexta?',
      }
    ],
  },
];

export const INITIAL_SERVICES: ServiceOffering[] = [
  {
    id: 'serv-lp-01',
    name: 'Landing Page de Alta Conversão',
    code: 'LP-CONV-01',
    shortDescription: 'Página de aterrissagem ultra rápida com copywriting persuasivo e conversão direta para WhatsApp.',
    coreValueProposition: 'Aumento de até 140% em agendamentos diretos e triagem automatizada para o time de atendimento.',
    targetPainPoints: ['Pacientes que desistem antes de agendar', 'Tráfego sem conversão', 'Falta de presença digital profissional'],
    idealCustomerProfile: 'Clínicas estéticas, consultórios médicos de alto padrão e prestadores de serviços premium.',
    standardTicket: 'R$ 4.500 (Setup) + R$ 800/mês',
    deliverables: [
      'Estrutura com carregamento em < 1.2 segundos',
      'Copywriting validado para conversão no WhatsApp',
      'Integração com Google Ads e Meta Pixel',
      'Painel de métricas de conversão em tempo real'
    ],
  },
  {
    id: 'serv-01',
    name: 'Leadion Fleet Route & Cost Optimizer',
    code: 'FROTA-OPT-01',
    shortDescription: 'Otimizador preditivo de rotas e combustível para frotas comerciais próprias.',
    coreValueProposition: 'Redução auditada de 14% no custo por quilômetro e telemetria preditiva em 45 dias.',
    targetPainPoints: ['Combustível elevado', 'Atrasos de SLA', 'Replanejamento manual de rotas'],
    idealCustomerProfile: 'Transportadoras, distribuidores e operadoras de logística com frotas acima de 30 veículos.',
    standardTicket: 'R$ 6.800/mês',
    deliverables: [
      'Roteirizador dinâmico com inteligência geográfica',
      'Painel de telemetria em tempo real',
      'Integração via API com ERPs de logística',
      'Acompanhamento mensal com especialista de operações'
    ],
  },
  {
    id: 'serv-02',
    name: 'Leadion Medical Shift & Compliance OS',
    code: 'MED-SHIFT-02',
    shortDescription: 'Automação inteligente de escalas médicas e controle de passivo trabalhista.',
    coreValueProposition: 'Corte de 90% no retrabalho de montagem de escalas e conformidade legal total.',
    targetPainPoints: ['Turnover de plantonistas', 'Horas extras descontroladas', 'Passivo CLT'],
    idealCustomerProfile: 'Hospitais, redes de clínicas de imagem e grupos de pronto atendimento médico.',
    standardTicket: 'R$ 11.500/mês',
    deliverables: [
      'App para médicos confirmarem e trocarem plantões em segundos',
      'Algoritmo de escala justa sem extrapolação de horas',
      'Exportação direta para folha de pagamento',
      'Auditoria de conformidade CRM/CLT'
    ],
  },
  {
    id: 'serv-03',
    name: 'Leadion Outbound Ramp-up & Sales OS',
    code: 'SALES-RAMP-03',
    shortDescription: 'Estruturação de máquina de prospecção outbound de alta conversão para times B2B.',
    coreValueProposition: 'Rampagem de novos SDRs de 60 para 18 dias com redução drástica no custo de aquisição (CAC).',
    targetPainPoints: ['SDRs demorando para gerar reuniões', 'No-show alto', 'Falta de playbooks claros'],
    idealCustomerProfile: 'Fintechs, SaaS B2B e empresas de serviços corporativos com metas de crescimento agressivas.',
    standardTicket: 'R$ 8.500/mês',
    deliverables: [
      'Implementação do Sales OS operacional',
      'Scripts de abordagem e matriz de objeções sob medida',
      'Treinamento prático de prospecção executiva',
      'Painel de cadência e conversão por canal'
    ],
  },
  {
    id: 'serv-04',
    name: 'Leadion Procurement Efficiency Engine',
    code: 'PROC-EFF-04',
    shortDescription: 'Centralização e auditoria de compras de insumos para canteiros de obras e infraestrutura.',
    coreValueProposition: 'Economia média de 9,4% por lote de obra e fim das compras de emergência desreguladas.',
    targetPainPoints: ['Compras emergenciais caras', 'Cotações em planilhas soltas', 'Falta de auditoria'],
    idealCustomerProfile: 'Construtoras civis, empresas de engenharia pesada e instaladoras elétricas.',
    standardTicket: 'R$ 7.200/mês',
    deliverables: [
      'Portal central de cotação de fornecedores',
      'Comparativo automático de preços e prazos de entrega',
      'Regras de aprovação por alçada financeira',
      'Histórico de compras e variação de insumos'
    ],
  }
];

export const INITIAL_SCRIPTS: ProspectScript[] = [
  {
    id: 'script-01',
    title: 'Gatilho de Expansão de Filiais / Novos Centros',
    channel: 'whatsapp',
    targetRole: 'Diretores de Operações e Logística',
    triggerType: 'Novos Centros de Distribuição / Abertura de Filiais',
    structure: {
      hook: 'Reconhecimento do fato recente (abertura de filiais) com cumprimento sincero.',
      context: 'Gargalo comum que operações enfrentam quando expandem (custo de km e rotas).',
      valueProposition: 'Prova social de cliente semelhante com percentual de economia mensurável.',
      cta: 'Pergunta com baixo atrito e data/horário específico de 10 minutos.',
    },
    fullTemplate: '[Nome], vi que a [Empresa] expandiu para [Fato Recente] — parabéns pela conquista! Geralmente quando uma operação cresce nesse ritmo, o custo de combustível e o replanejamento de rotas viram um gargalo diário para o time de operações. Você teria 10 minutos na quinta-feira às 10h para eu te mostrar como a [Case de Sucesso] cortou 14% do custo de km na mesma região que vocês operam?',
    conversionRateApprox: '28% de agendamento qualificado',
    tags: ['WhatsApp', 'Logística', 'Gatilho de Expansão'],
  },
  {
    id: 'script-02',
    title: 'Gatilho de Aporte de Capital / Série A',
    channel: 'linkedin',
    targetRole: 'Fundadores & C-Level B2B',
    triggerType: 'Investimento Anunciado / Captação Recente',
    structure: {
      hook: 'Parabéns pela rodada e menção à meta divulgada.',
      context: 'O principal obstáculo de quem capta: tempo de rampagem e perda de CAC.',
      valueProposition: 'Framework que acelerou empresas do mesmo estágio.',
      cta: 'Oferta de teardown prático de 3 minutos sem pressão de venda.',
    },
    fullTemplate: '[Nome], parabéns pela nova rodada da [Empresa]! Acompanhando a meta de expansão comercial. Quem escala outbound nessa fase normalmente enfrenta o desafio de ver SDRs demorarem 2 meses para engrenar e taxa de no-show em reuniões. Faz sentido te enviar um teardown de 3 minutos de como aceleramos a rampagem de vendas em fintechs?',
    conversionRateApprox: '34% de resposta positiva',
    tags: ['LinkedIn', 'C-Level', 'Pós-Aporte'],
  },
  {
    id: 'script-03',
    title: 'Cold Call Direta com Gancho Setorial',
    channel: 'phone',
    targetRole: 'Gerentes de Compras & Suprimentos',
    triggerType: 'Licitação Vencida / Obra Iniciada',
    structure: {
      hook: 'Transparência imediata de quem fala e o motivo exato da ligação (2 minutos).',
      context: 'Dor real das primeiras 4 semanas de mobilização de suprimentos.',
      valueProposition: 'Economia direta por lote sem burocracia.',
      cta: 'Fechamento para validação de interesse.',
    },
    fullTemplate: '[Nome], bom dia! Aqui é o [Meu Nome] da Leadion. O motivo direto da minha ligação é a nova fase de obras da [Empresa]. Sei que a mobilização inicial de insumos costuma ser uma correria com compras urgentes que corroem a margem. Você tem 2 minutos para eu te explicar como a [Referência] blindou as cotações do último canteiro?',
    conversionRateApprox: '22% de conversão em reunião',
    tags: ['Cold Call', 'Compras', 'Construção'],
  },
];
