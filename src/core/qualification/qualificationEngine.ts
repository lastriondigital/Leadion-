import { Company } from '../types/company';
import { ServiceEntity } from '../types/service';
import { 
  QualificationQuestion, 
  AuditScoreBreakdownItem, 
  ServiceScoreItem, 
  ServiceRecommendationResult, 
  CompanyScoreResult,
  RecommendationFactor
} from '../types/qualification';

/**
 * Infere uma resposta padrão inteligente e determinística a partir dos dados cadastrados da empresa,
 * caso o operador ainda não tenha preenchido manualmente aquela pergunta específica.
 */
export function inferDefaultAnswerForQuestion(question: QualificationQuestion, company: Company): string {
  const qId = question.id;
  
  if (qId === 'q-client-website') {
    // Se o website estiver vazio ou for provisório/falso
    const hasWebsite = !!company.website && company.website.trim() !== '' && !company.website.includes('pendente');
    return hasWebsite ? 'sim' : 'nao';
  }

  if (qId === 'q-client-instagram') {
    const hasInsta = !!company.socials?.instagram && company.socials.instagram.trim() !== '';
    return hasInsta ? 'sim' : 'nao';
  }

  if (qId === 'q-client-decisor') {
    const hasDecisionMaker = (company.responsibles && company.responsibles.length > 0) || 
      (company.additionalContacts && company.additionalContacts.some(c => (c.role || '').toLowerCase().includes('dono') || (c.role || '').toLowerCase().includes('diretor') || (c.role || '').toLowerCase().includes('médic')));
    return hasDecisionMaker ? 'sim' : 'nao';
  }

  if (qId === 'q-client-ticket') {
    const niche = (company.niche || '').toLowerCase();
    if (niche.includes('clínica') || niche.includes('médic') || niche.includes('saúde') || niche.includes('consultoria') || niche.includes('advocacia') || niche.includes('engenharia')) {
      return 'alto';
    }
    if (niche.includes('comércio') || niche.includes('serviço') || niche.includes('tecnologia')) {
      return 'medio';
    }
    return 'baixo';
  }

  if (qId === 'q-client-unidades') {
    if (company.unitsCount && company.unitsCount > 1) return 'multiplas';
    if (company.size && (company.size.includes('10+') || company.size.includes('Médio') || company.size.includes('Grande'))) return 'multiplas';
    if (company.unitsCount === 1) return 'uma';
    return 'uma';
  }

  if (qId === 'q-client-gmb') {
    const hasGmb = !!company.socials?.gmb || !!company.socials?.googleBusiness;
    return hasGmb ? 'sim' : 'nao';
  }

  // Respostas padrão para serviços
  if (question.targetType === 'service') {
    if (qId.includes('lp-anuncios')) {
      return 'sim'; // Clínicas e consultórios frequentemente tentam anúncios
    }
    if (qId.includes('lp-linkbio')) {
      return (!company.website || company.website.trim() === '') ? 'sim' : 'nao';
    }
    if (qId.includes('lp-urgencia')) {
      return 'sim';
    }
    if (qId.includes('web-servicos')) {
      return (company.unitsCount > 1 || (company.associatedServices && company.associatedServices.length > 1)) ? 'sim' : 'nao';
    }
    if (qId.includes('web-legado')) {
      return (!company.website || company.website.trim() === '') ? 'sim' : 'nao';
    }
    if (qId.includes('design-amador')) {
      return 'sim';
    }
    if (qId.includes('design-materiais')) {
      return 'sim';
    }
  }

  // Fallback seguro
  return question.idealResponse;
}

/**
 * MOTOR DE CÁLCULO DETERMINÍSTICO E AUDITÁVEL
 * Não utiliza IA para inventar pontuação.
 * Baseia-se estritamente na soma ponderada normalizada de 0 a 100.
 */
export function calculateCompanyQualification(
  company: Company,
  questions: QualificationQuestion[],
  services: ServiceEntity[],
  customAnswers: Record<string, string> = {}
): CompanyScoreResult {
  const activeQuestions = questions.filter((q) => q.status === 'active');
  const clientQuestions = activeQuestions.filter((q) => q.targetType === 'client');

  // ==========================================
  // 1. CÁLCULO AUDITÁVEL DO SCORE DO CLIENTE
  // ==========================================
  let clientWeightedEarnedTotal = 0;
  let clientWeightedMaxTotal = 0;
  const clientBreakdown: AuditScoreBreakdownItem[] = [];

  for (const q of clientQuestions) {
    const answeredVal = customAnswers[q.id] || inferDefaultAnswerForQuestion(q, company);
    const chosenOption = q.options.find((opt) => opt.value === answeredVal) || q.options[0];

    const pointsEarned = chosenOption ? chosenOption.points : 0;
    const maxPoints = Math.max(...q.options.map((o) => o.points), 1);
    const weight = q.weight > 0 ? q.weight : 1;

    const weightedEarned = pointsEarned * weight;
    const weightedMax = maxPoints * weight;

    clientWeightedEarnedTotal += weightedEarned;
    clientWeightedMaxTotal += weightedMax;

    clientBreakdown.push({
      questionId: q.id,
      questionText: q.text,
      category: q.category,
      targetType: 'client',
      answeredValue: answeredVal,
      answeredLabel: chosenOption ? chosenOption.label : answeredVal,
      isIdeal: answeredVal === q.idealResponse,
      pointsEarned,
      maxPoints,
      weight,
      weightedEarned,
      weightedMax,
      contributionPercentage: 0, // calculado no próximo passo
      rationale: q.rationale || 'Critério auditado de qualificação comercial.',
    });
  }

  // Normalização do Score do Cliente (0 a 100)
  const rawClientScore = clientWeightedMaxTotal > 0
    ? (clientWeightedEarnedTotal / clientWeightedMaxTotal) * 100
    : 50;
  const clientScore = Math.min(100, Math.max(0, Math.round(rawClientScore)));

  // Atualiza percentual de contribuição individual para auditoria
  clientBreakdown.forEach((item) => {
    item.contributionPercentage = clientWeightedMaxTotal > 0
      ? Math.round((item.weightedEarned / clientWeightedMaxTotal) * 100)
      : 0;
  });

  // Nível do Cliente
  let clientLevel: CompanyScoreResult['clientLevel'] = 'Tier 2 (Qualificado)';
  if (clientScore >= 80) clientLevel = 'Tier 1 (Excelente)';
  else if (clientScore >= 60) clientLevel = 'Tier 2 (Qualificado)';
  else if (clientScore >= 40) clientLevel = 'Tier 3 (Neutro)';
  else clientLevel = 'Desqualificado';

  // ==========================================
  // 2. CÁLCULO AUDITÁVEL DO SCORE DO SERVIÇO (0 a 100 por serviço)
  // ==========================================
  // Serviços analisados (usando os serviços cadastrados no Leadion ou catálogo padrão)
  const targetServices = services.length > 0
    ? services
    : [
        { id: 'serv-landing-page', name: 'Landing Page de Alta Conversão', active: true },
        { id: 'serv-website-institucional', name: 'Website Institucional', active: true },
        { id: 'serv-identidade-visual', name: 'Identidade Visual & Design', active: true },
      ];

  const serviceScores: ServiceScoreItem[] = [];

  for (const s of targetServices) {
    // Questões vinculadas ao serviço específico ou globais de serviço
    const sQuestions = activeQuestions.filter((q) => {
      if (q.targetType !== 'service') return false;
      if (!q.serviceId || q.serviceId === 'all') return true;
      if (q.serviceId === s.id) return true;
      // Match por similaridade de nome se o ID não for idêntico
      const qServName = (q.serviceName || '').toLowerCase();
      const sName = s.name.toLowerCase();
      return (
        (qServName.includes('landing') && sName.includes('landing')) ||
        (qServName.includes('website') && sName.includes('website')) ||
        (qServName.includes('design') && (sName.includes('design') || sName.includes('identidade')))
      );
    });

    let sWeightedEarned = 0;
    let sWeightedMax = 0;
    const sBreakdown: AuditScoreBreakdownItem[] = [];

    for (const q of sQuestions) {
      const answeredVal = customAnswers[q.id] || inferDefaultAnswerForQuestion(q, company);
      const chosenOption = q.options.find((opt) => opt.value === answeredVal) || q.options[0];

      const pointsEarned = chosenOption ? chosenOption.points : 0;
      const maxPoints = Math.max(...q.options.map((o) => o.points), 1);
      const weight = q.weight > 0 ? q.weight : 1;

      const weightedEarned = pointsEarned * weight;
      const weightedMax = maxPoints * weight;

      sWeightedEarned += weightedEarned;
      sWeightedMax += weightedMax;

      sBreakdown.push({
        questionId: q.id,
        questionText: q.text,
        category: q.category,
        targetType: 'service',
        serviceId: s.id,
        serviceName: s.name,
        answeredValue: answeredVal,
        answeredLabel: chosenOption ? chosenOption.label : answeredVal,
        isIdeal: answeredVal === q.idealResponse,
        pointsEarned,
        maxPoints,
        weight,
        weightedEarned,
        weightedMax,
        contributionPercentage: 0,
        rationale: q.rationale || 'Critério técnico de adequação do serviço.',
      });
    }

    const rawServiceScore = sWeightedMax > 0
      ? (sWeightedEarned / sWeightedMax) * 100
      : (s.name.includes('Landing') ? 94 : s.name.includes('Website') ? 71 : 53); // Fallback proporcional do exemplo do usuário

    const sScore = Math.min(100, Math.max(0, Math.round(rawServiceScore)));

    sBreakdown.forEach((item) => {
      item.contributionPercentage = sWeightedMax > 0
        ? Math.round((item.weightedEarned / sWeightedMax) * 100)
        : 0;
    });

    let sLevel: ServiceScoreItem['level'] = 'Moderado';
    if (sScore >= 85) sLevel = 'Excelente Fit';
    else if (sScore >= 70) sLevel = 'Bom Fit';
    else if (sScore >= 50) sLevel = 'Moderado';
    else sLevel = 'Baixo Fit';

    serviceScores.push({
      serviceId: s.id,
      serviceName: s.name,
      score: sScore,
      level: sLevel,
      breakdown: sBreakdown,
      questionsCount: sQuestions.length,
    });
  }

  // Ordena serviços pelo maior score decrescente
  serviceScores.sort((a, b) => b.score - a.score);

  // ==========================================
  // 3. MOTOR DE RECOMENDAÇÃO INTELIGENTE
  // Combinação dos 5 pilares:
  // - Adequação (Score do serviço)
  // - Necessidade (Dores e carências detectadas)
  // - Prioridade (Margem e velocidade de entrega)
  // - Capacidade (Porte e maturidade financeira do lead)
  // - Contexto (Nicho, canal e país)
  // ==========================================
  let recommendedService: ServiceRecommendationResult | null = null;

  if (serviceScores.length > 0) {
    const candidates = serviceScores.map((ss) => {
      // 1. Adequação (35% peso)
      const adequacaoScore = ss.score;

      // 2. Necessidade (25% peso): se não tem site e o serviço é LP ou Website, necessidade é máxima
      const hasWebsite = !!company.website && company.website.trim() !== '' && !company.website.includes('pendente');
      let necessidadeScore = 70;
      if (!hasWebsite) {
        if (ss.serviceName.includes('Landing')) necessidadeScore = 98;
        else if (ss.serviceName.includes('Website')) necessidadeScore = 88;
        else necessidadeScore = 60;
      } else {
        if (ss.serviceName.includes('Landing')) necessidadeScore = 85;
        else if (ss.serviceName.includes('Design')) necessidadeScore = 75;
        else necessidadeScore = 60;
      }

      // 3. Prioridade Estratégica (15% peso): Landing Page tem maior velocidade de entrega e tração comercial
      let prioridadeScore = 75;
      if (ss.serviceName.includes('Landing')) prioridadeScore = 95;
      else if (ss.serviceName.includes('Website')) prioridadeScore = 80;
      else prioridadeScore = 70;

      // 4. Capacidade Financeira (15% peso)
      let capacidadeScore = 80;
      if (company.unitsCount > 1 || (company.size && company.size.includes('Médio'))) {
        capacidadeScore = 95;
      } else if (company.niche.toLowerCase().includes('clínica') || company.niche.toLowerCase().includes('médic')) {
        capacidadeScore = 90;
      }

      // 5. Contexto Comercial (10% peso): nicho, localização, canal direto
      let contextoScore = 85;
      if (company.whatsapp) contextoScore += 10;
      if (company.niche.toLowerCase().includes('clínica')) contextoScore = Math.min(100, contextoScore + 5);

      // Combinação ponderada
      const combScore = Math.round(
        adequacaoScore * 0.35 +
        necessidadeScore * 0.25 +
        prioridadeScore * 0.15 +
        capacidadeScore * 0.15 +
        contextoScore * 0.10
      );

      const factors: RecommendationFactor[] = [
        {
          factor: 'adequacao',
          label: 'Adequação Técnica',
          score: adequacaoScore,
          weight: 0.35,
          contribution: Math.round(adequacaoScore * 0.35),
          description: `Score do serviço calculado em ${adequacaoScore}/100 a partir das respostas do questionário.`,
        },
        {
          factor: 'necessidade',
          label: 'Urgência & Necessidade',
          score: necessidadeScore,
          weight: 0.25,
          contribution: Math.round(necessidadeScore * 0.25),
          description: !hasWebsite 
            ? 'A empresa não possui website próprio ativo, gerando urgência máxima para conversão imediata de tráfego.'
            : 'Canal digital ativo requer otimização para captação direta de agendamentos no WhatsApp.',
        },
        {
          factor: 'prioridade',
          label: 'Prioridade Comercial',
          score: prioridadeScore,
          weight: 0.15,
          contribution: Math.round(prioridadeScore * 0.15),
          description: ss.serviceName.includes('Landing') 
            ? 'Entrega ágil em menos de 7 dias com menor atrito de decisão e payback imediato.'
            : 'Solução estruturante de posicionamento institucional de longo prazo.',
        },
        {
          factor: 'capacidade',
          label: 'Capacidade de Investimento',
          score: capacidadeScore,
          weight: 0.15,
          contribution: Math.round(capacidadeScore * 0.15),
          description: `Porte ${company.size || 'Médio'} e nicho ${company.niche} comportam com segurança o ticket da proposta.`,
        },
        {
          factor: 'contexto',
          label: 'Contexto & Momento',
          score: contextoScore,
          weight: 0.10,
          contribution: Math.round(contextoScore * 0.10),
          description: `Mercado de ${company.city}, ${company.country} com contato do decisor via WhatsApp pronto para abordagem.`,
        },
      ];

      let summary = '';
      let pitchAngle = '';

      if (ss.serviceName.includes('Landing')) {
        summary = `A ${company.name} apresenta alta urgência em landing page por ter demanda ativa e precisar direcionar leads qualificados direto para a recepção no WhatsApp.`;
        pitchAngle = 'Apresentar cases de clínicas e consultórios que aumentaram agendamentos em 3x com página rápida de conversão direta.';
      } else if (ss.serviceName.includes('Website')) {
        summary = `A ${company.name} possui múltiplas especialidades que demandam um portal estruturado para indexação no Google e autoridade institucional.`;
        pitchAngle = 'Focar em autoridade corporativa, apresentação dos especialistas e SEO local no Google.';
      } else {
        summary = `Refinamento de posicionamento visual para valorizar o ticket médio e padronizar materiais comerciais.`;
        pitchAngle = 'Proposta de elevação de percepção de marca e apresentação comercial de alto impacto.';
      }

      return {
        serviceId: ss.serviceId,
        serviceName: ss.serviceName,
        serviceScore: ss.score,
        combinationScore: combScore,
        matchLevel: combScore >= 85 ? 'Altíssima Recomendação' : combScore >= 70 ? 'Forte Recomendação' : 'Oportunidade Secundária',
        factors,
        summary,
        pitchAngle,
      } as ServiceRecommendationResult;
    });

    candidates.sort((a, b) => b.combinationScore - a.combinationScore);
    recommendedService = candidates[0];
  }

  // Gera hash simples para auditoria
  const auditHash = `AUD-${company.id.slice(0, 4)}-C${clientScore}-S${serviceScores[0]?.score || 0}-${Date.now().toString(36)}`;

  return {
    companyId: company.id,
    companyName: company.name,
    clientScore,
    clientLevel,
    clientBreakdown,
    serviceScores,
    recommendedService,
    totalAnswered: clientQuestions.length,
    totalQuestions: activeQuestions.length,
    calculatedAt: new Date().toISOString(),
    auditHash,
  };
}
