import { Company } from '../types/company';
import { ServiceEntity, getServicePriceForCompany, formatServiceCurrency } from '../types/service';
import { ScriptDelayConfig } from '../types/script';

export interface ScriptVariableMeta {
  tag: string;
  label: string;
  description: string;
  example: string;
}

export const SCRIPT_AVAILABLE_VARIABLES: ScriptVariableMeta[] = [
  {
    tag: '{{nome}}',
    label: 'Nome do Decisor/Contato',
    description: 'Primeiro nome ou nome preferido do contato principal',
    example: 'Ana',
  },
  {
    tag: '{{cargo}}',
    label: 'Cargo do Contato',
    description: 'Função do decisor (ex: Diretora Médica, Sócio)',
    example: 'Diretora',
  },
  {
    tag: '{{empresa}}',
    label: 'Nome da Empresa',
    description: 'Nome fantasia ou razão social da empresa',
    example: 'Clínica Aurora',
  },
  {
    tag: '{{cidade}}',
    label: 'Cidade',
    description: 'Cidade da empresa',
    example: 'Maputo',
  },
  {
    tag: '{{pais}}',
    label: 'País',
    description: 'País para regionalização de tom e contexto',
    example: 'Moçambique',
  },
  {
    tag: '{{servico}}',
    label: 'Serviço',
    description: 'Nome do serviço comercial selecionado',
    example: 'Landing Page de Alta Conversão',
  },
  {
    tag: '{{preco}}',
    label: 'Preço',
    description: 'Preço configurado para a moeda e país da empresa',
    example: '10.000 MT',
  },
  {
    tag: '{{moeda}}',
    label: 'Moeda',
    description: 'Código da moeda (MT, EUR, BRL, etc.)',
    example: 'MT',
  },
  {
    tag: '{{problema}}',
    label: 'Problema Mapeado',
    description: 'Problema ou dor identificada na empresa',
    example: 'não possui website rápido para receber clientes',
  },
  {
    tag: '{{necessidade}}',
    label: 'Necessidade',
    description: 'Necessidade percebida pelo operador comercial',
    example: 'captar pacientes particulares pelo Google',
  },
  {
    tag: '{{objetivo}}',
    label: 'Objetivo da Empresa',
    description: 'Meta principal do lead',
    example: 'aumentar agendamentos diretos no WhatsApp',
  },
  {
    tag: '{{dor}}',
    label: 'Dor Principal',
    description: 'Principal gargalo ou prejuízo atual',
    example: 'perda de pacientes para concorrentes locais',
  },
  {
    tag: '{{ponto_positivo}}',
    label: 'Ponto Positivo',
    description: 'Destaque favorável mapeado (ex: Instagram ativo)',
    example: 'perfil de Instagram ativo e com boa audiência',
  },
  {
    tag: '{{ponto_negativo}}',
    label: 'Ponto Negativo',
    description: 'Gargalo ou ponto de melhoria identificado',
    example: 'link da bio direciona apenas para um link genérico',
  },
  {
    tag: '{{website}}',
    label: 'Website / Domínio',
    description: 'Endereço web ou link institucional',
    example: 'https://exemplo.co.mz',
  },
  {
    tag: '{{instagram}}',
    label: 'Instagram',
    description: 'Perfil de Instagram da empresa',
    example: '@clinicaaurora',
  },
  {
    tag: '{{responsavel}}',
    label: 'Responsável Comercial',
    description: 'Nome do operador ou consultor Leadion',
    example: 'Manuel Domingos',
  },
];

/**
 * Extrai todas as variáveis detectadas no template
 */
export function extractScriptVariables(content: string): string[] {
  const matches = content.match(/\{\{[a-zA-Z0-9_-]+\}\}/g);
  if (!matches) return [];
  return Array.from(new Set(matches));
}

/**
 * Substitui as variáveis de um template com dados reais da empresa e serviço.
 * REGRA FUNDAMENTAL: Se uma informação não existir, NÃO inventar!
 * Exemplo: se não há nome do decisor cadastrado, substitui saudações
 * como "Olá {{nome}}, tudo bem?" por "Olá, tudo bem?" de forma natural.
 */
export function replaceScriptVariables(
  template: string,
  company?: Company | null,
  service?: ServiceEntity | null,
  operatorName = 'Manuel Domingos'
): string {
  if (!template) return '';

  // 1. Contato e Decisor Real
  // Não assume que o primeiro é decisor se houver um marcado explicitamente com isDecisionMaker
  const decisionMaker = company?.responsibles?.find((r) => r.isDecisionMaker) ||
    company?.additionalContacts?.find((c) => c.isDecisionMaker) ||
    company?.responsibles?.find((r) => r.isPrimary) ||
    company?.responsibles?.[0];

  const rawContactName = decisionMaker?.preferredName || decisionMaker?.name || '';
  const hasRealContactName = rawContactName.trim().length > 0;
  
  // Extrai primeiro nome se houver nome real
  const firstName = hasRealContactName 
    ? rawContactName.replace(/^(Dr\.|Dra\.|Sr\.|Sra\.|Prof\.|Eng\.)\s*/i, '').split(' ')[0] || rawContactName
    : '';

  const role = decisionMaker?.role || '';
  const companyName = company?.name || '';
  const city = company?.city || (company?.location?.split('·')[0]?.trim()) || '';
  const country = company?.country || '';

  // 2. Serviço & Preço correspondente ao país real da empresa
  const serviceName = service?.name || '';
  
  let formattedPrice = '';
  let currencyCode = '';

  if (service && company?.country) {
    const pricing = getServicePriceForCompany(service, company.country);
    if (pricing) {
      formattedPrice = formatServiceCurrency(pricing.myPrice, pricing.currency, pricing.currencySymbol);
      currencyCode = pricing.currency;
    }
  } else if (service && service.countryPrices && service.countryPrices.length > 0) {
    const firstPrice = service.countryPrices[0];
    formattedPrice = `${firstPrice.currencySymbol || firstPrice.currency} ${firstPrice.myPrice.toLocaleString()}`;
    currencyCode = firstPrice.currency;
  }

  // 3. Redes e Presença Digital Real
  const website = company?.website || '';
  const instagram = company?.socials?.instagram || '';

  // 4. Contexto Comercial, Dores e Pontos
  const problem = company?.commercialContext?.problem || company?.commercialNotes || '';
  const need = company?.commercialContext?.perceivedNeed || '';
  const goal = company?.commercialContext?.companyGoal || '';
  const pain = company?.commercialContext?.mainPain || '';
  const positivePoint = company?.positivePoints?.[0] || '';
  const negativePoint = company?.negativePoints?.[0] || '';

  let result = template;

  // Tratamento especial para saudação caso {{nome}} não exista
  if (!hasRealContactName) {
    result = result.replace(/Olá\s+\{\{nome\}\},\s*/gi, 'Olá, ');
    result = result.replace(/Olá\s+\{\{nome\}\}\s*/gi, 'Olá! ');
    result = result.replace(/Oi\s+\{\{nome\}\},\s*/gi, 'Oi, ');
    result = result.replace(/Oi\s+\{\{nome\}\}\s*/gi, 'Oi! ');
    result = result.replace(/Prezado\(a\)\s+\{\{nome\}\},\s*/gi, 'Olá, ');
    result = result.replace(/\{\{nome\}\}/gi, '');
  } else {
    result = result.replace(/\{\{nome\}\}/gi, firstName);
  }

  result = result.replace(/\{\{cargo\}\}/gi, role);
  result = result.replace(/\{\{empresa\}\}/gi, companyName || 'sua empresa');
  result = result.replace(/\{\{cidade\}\}/gi, city);
  result = result.replace(/\{\{pais\}\}/gi, country);
  result = result.replace(/\{\{servico\}\}/gi, serviceName);
  result = result.replace(/\{\{preco\}\}/gi, formattedPrice);
  result = result.replace(/\{\{moeda\}\}/gi, currencyCode);
  result = result.replace(/\{\{responsavel\}\}/gi, operatorName);
  result = result.replace(/\{\{site\}\}/gi, website);
  result = result.replace(/\{\{website\}\}/gi, website);
  result = result.replace(/\{\{instagram\}\}/gi, instagram);
  result = result.replace(/\{\{problema\}\}/gi, problem);
  result = result.replace(/\{\{necessidade\}\}/gi, need);
  result = result.replace(/\{\{objetivo\}\}/gi, goal);
  result = result.replace(/\{\{dor\}\}/gi, pain || problem);
  result = result.replace(/\{\{ponto_positivo\}\}/gi, positivePoint);
  result = result.replace(/\{\{ponto_negativo\}\}/gi, negativePoint);

  // Limpa espaços duplos residuais de substituições vazias
  result = result.replace(/\s{2,}/g, ' ').trim();

  return result;
}

/**
 * Gera URL do WhatsApp sanitizando o telefone e codificando a mensagem
 */
export function buildWhatsAppLink(rawPhone: string, text: string): string {
  // Remove todos os caracteres não numéricos
  let cleanPhone = rawPhone.replace(/\D/g, '');

  // Se o número não tem DDI mas é de Moçambique ou Brasil, garante prefixo
  if (cleanPhone.length === 9 && (cleanPhone.startsWith('82') || cleanPhone.startsWith('84') || cleanPhone.startsWith('85') || cleanPhone.startsWith('86') || cleanPhone.startsWith('87'))) {
    cleanPhone = `258${cleanPhone}`;
  } else if ((cleanPhone.length === 10 || cleanPhone.length === 11) && !cleanPhone.startsWith('55') && !cleanPhone.startsWith('351') && !cleanPhone.startsWith('258') && !cleanPhone.startsWith('244')) {
    cleanPhone = `55${cleanPhone}`;
  }

  const encodedMessage = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Formata rótulo de tempo e evento de follow-up
 */
export function formatScriptDelayLabel(delay?: ScriptDelayConfig | null): string {
  if (!delay) return 'Imediato';
  const unitLabels: Record<string, string> = {
    minutes: delay.value === 1 ? 'minuto' : 'minutos',
    hours: delay.value === 1 ? 'hora' : 'horas',
    days: delay.value === 1 ? 'dia' : 'dias',
    weeks: delay.value === 1 ? 'semana' : 'semanas',
    custom: 'personalizado',
  };

  const eventLabels: Record<string, string> = {
    previous_sent: 'após o envio da mensagem anterior',
    opened: 'após mensagem visualizada',
    no_reply: 'se permanecer sem resposta',
    manual: 'manual / sob demanda',
  };

  if (delay.unit === 'custom') {
    return `${delay.customLabel || `${delay.value} unidades`} (${eventLabels[delay.event] || 'após ação'})`;
  }

  return `+${delay.value} ${unitLabels[delay.unit] || delay.unit} ${eventLabels[delay.event] || ''}`.trim();
}

/**
 * Calcula data e hora alvo a partir do delay
 */
export function calculateTargetSchedule(delay?: ScriptDelayConfig | null, baseDate: Date = new Date()): { dueDate: string; dueTime: string } {
  const target = new Date(baseDate.getTime());

  if (delay) {
    switch (delay.unit) {
      case 'minutes':
        target.setMinutes(target.getMinutes() + delay.value);
        break;
      case 'hours':
        target.setHours(target.getHours() + delay.value);
        break;
      case 'days':
        target.setDate(target.getDate() + delay.value);
        break;
      case 'weeks':
        target.setDate(target.getDate() + delay.value * 7);
        break;
      case 'custom':
      default:
        target.setDate(target.getDate() + (delay.value || 2));
        break;
    }
  } else {
    // Default 2 dias
    target.setDate(target.getDate() + 2);
  }

  const day = String(target.getDate()).padStart(2, '0');
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const year = target.getFullYear();
  const hours = String(target.getHours()).padStart(2, '0');
  const minutes = String(target.getMinutes()).padStart(2, '0');

  return {
    dueDate: `${year}-${month}-${day}`,
    dueTime: `${hours}:${minutes}`,
  };
}
