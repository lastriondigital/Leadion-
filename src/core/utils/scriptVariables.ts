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
    label: 'Nome do Decisor',
    description: 'Primeiro nome do decisor ou responsável principal',
    example: 'João',
  },
  {
    tag: '{{empresa}}',
    label: 'Nome da Empresa',
    description: 'Razão social ou nome fantasia da empresa',
    example: 'Clínica Aurora',
  },
  {
    tag: '{{cidade}}',
    label: 'Cidade',
    description: 'Cidade sede da empresa',
    example: 'Maputo',
  },
  {
    tag: '{{pais}}',
    label: 'País',
    description: 'País da empresa para regionalização de tom',
    example: 'Moçambique',
  },
  {
    tag: '{{servico}}',
    label: 'Serviço',
    description: 'Nome do serviço comercial proposto',
    example: 'Landing Page de Alta Conversão',
  },
  {
    tag: '{{preco}}',
    label: 'Preço',
    description: 'Preço correspondente ao país da empresa',
    example: '10.000 MT',
  },
  {
    tag: '{{moeda}}',
    label: 'Moeda',
    description: 'Moeda associada à precificação do país',
    example: 'MZN',
  },
  {
    tag: '{{responsavel}}',
    label: 'Responsável Leadion',
    description: 'Nome completo do consultor ou SDR do Leadion',
    example: 'Manuel Domingos',
  },
  {
    tag: '{{site}}',
    label: 'Site da Empresa',
    description: 'Endereço web ou domínio da empresa',
    example: 'https://clinicaaurora.co.mz',
  },
  {
    tag: '{{instagram}}',
    label: 'Instagram',
    description: 'Perfil de Instagram da empresa',
    example: '@clinicaauroramaputo',
  },
  {
    tag: '{{problema}}',
    label: 'Problema / Dor',
    description: 'Dor comercial mapeada ou oportunidade identificada',
    example: 'ausência de página rápida para conversão no WhatsApp',
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
 * Substitui as variáveis de um template com dados reais da empresa e serviço
 */
export function replaceScriptVariables(
  template: string,
  company?: Company | null,
  service?: ServiceEntity | null,
  operatorName = 'Manuel Domingos'
): string {
  if (!template) return '';

  // Decisor / contato
  const primaryContact = company?.responsibles?.find((r) => r.isPrimary) || company?.responsibles?.[0];
  const rawContactName = primaryContact?.name || company?.additionalContacts?.[0]?.name || 'Decisor(a)';
  // Extrai apenas o primeiro nome (ex: "Dra. Samira Patel" -> "Samira" ou "Dra. Samira")
  const firstName = rawContactName.replace(/^(Dr\.|Dra\.|Sr\.|Sra\.)\s*/i, '').split(' ')[0] || rawContactName;

  const companyName = company?.name || 'Clínica Aurora';
  const city = company?.city || (company?.location?.split('·')[0]?.trim()) || 'Maputo';
  const country = company?.country || 'Moçambique';

  // Serviço & Preço
  const serviceName = service?.name || (company?.associatedServices?.[0] ? 'Landing Page de Alta Conversão' : 'Consultoria Leadion');
  
  let formattedPrice = 'Sob Consulta';
  let currencyCode = 'MZN';

  if (service && company) {
    const pricing = getServicePriceForCompany(service, company.country);
    if (pricing) {
      formattedPrice = formatServiceCurrency(pricing.myPrice, pricing.currency, pricing.currencySymbol);
      currencyCode = pricing.currency;
    }
  } else if (service && service.countryPrices && service.countryPrices.length > 0) {
    const firstPrice = service.countryPrices[0];
    formattedPrice = `${firstPrice.currency} ${firstPrice.myPrice.toLocaleString()}`;
    currencyCode = firstPrice.currency;
  } else if (country === 'Moçambique') {
    formattedPrice = '10.000 MT';
    currencyCode = 'MZN';
  } else if (country === 'Portugal') {
    formattedPrice = '€137';
    currencyCode = 'EUR';
  } else {
    formattedPrice = 'R$ 597';
    currencyCode = 'BRL';
  }

  const website = company?.website || 'https://clinicaaurora.co.mz';
  const instagram = company?.socials?.instagram || '@clinicaaurora';
  const problem = company?.commercialNotes || 'ausência de página rápida para conversão direta no WhatsApp';

  let result = template;
  result = result.replace(/\{\{nome\}\}/gi, firstName);
  result = result.replace(/\{\{empresa\}\}/gi, companyName);
  result = result.replace(/\{\{cidade\}\}/gi, city);
  result = result.replace(/\{\{pais\}\}/gi, country);
  result = result.replace(/\{\{servico\}\}/gi, serviceName);
  result = result.replace(/\{\{preco\}\}/gi, formattedPrice);
  result = result.replace(/\{\{moeda\}\}/gi, currencyCode);
  result = result.replace(/\{\{responsavel\}\}/gi, operatorName);
  result = result.replace(/\{\{site\}\}/gi, website);
  result = result.replace(/\{\{instagram\}\}/gi, instagram);
  result = result.replace(/\{\{problema\}\}/gi, problem);

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
