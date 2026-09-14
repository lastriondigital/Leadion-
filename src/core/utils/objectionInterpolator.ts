import { Company } from '../types/company';
import { ScriptDelayConfig } from '../types/script';

/**
 * Interpola variáveis dinâmicas em scripts de objeção
 */
export function interpolateObjectionScript(
  template: string,
  company?: Company | null,
  responsibleName?: string,
  serviceName?: string
): string {
  if (!template) return '';

  const contactName = company?.decisionMakerName || company?.responsibles?.find((r) => r.isPrimary)?.name || company?.responsibles?.[0]?.name || company?.name?.split(' ')[0] || 'Decisor';
  const compName = company?.name || 'sua empresa';
  const city = company?.city || company?.address || 'sua região';
  const country = company?.country || 'Moçambique';
  const niche = company?.niche || company?.businessType || 'seu segmento';
  const service = serviceName || company?.serviceInterest || 'nossos serviços';
  const operator = responsibleName || 'Manuel Domingos';
  const website = company?.website || company?.domain || '';
  const instagram = company?.instagram || company?.socials?.instagram || '';

  // Determinação de moeda e preço com base no país
  let currency = 'MT';
  let samplePrice = '15.000 MT';
  if (country === 'Brasil') {
    currency = 'R$';
    samplePrice = 'R$ 2.500';
  } else if (country === 'Portugal') {
    currency = '€';
    samplePrice = '450 €';
  } else if (country === 'Angola') {
    currency = 'Kz';
    samplePrice = '350.000 Kz';
  }

  return template
    .replace(/\{\{nome\}\}/gi, contactName)
    .replace(/\{\{decisor\}\}/gi, contactName)
    .replace(/\{\{empresa\}\}/gi, compName)
    .replace(/\{\{cidade\}\}/gi, city)
    .replace(/\{\{pais\}\}/gi, country)
    .replace(/\{\{nicho\}\}/gi, niche)
    .replace(/\{\{setor\}\}/gi, niche)
    .replace(/\{\{servico\}\}/gi, service)
    .replace(/\{\{preco\}\}/gi, samplePrice)
    .replace(/\{\{moeda\}\}/gi, currency)
    .replace(/\{\{responsavel\}\}/gi, operator)
    .replace(/\{\{site\}\}/gi, website)
    .replace(/\{\{website\}\}/gi, website)
    .replace(/\{\{instagram\}\}/gi, instagram);
}

/**
 * Gera o link formatado wa.me para abertura direta do WhatsApp
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const cleanNumber = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Formata o delay legível em português
 */
export function formatObjectionDelay(delay?: ScriptDelayConfig): string {
  if (!delay || delay.value === 0) return 'Imediato';
  const unitLabels: Record<string, string> = {
    minutes: delay.value === 1 ? 'minuto' : 'minutos',
    hours: delay.value === 1 ? 'hora' : 'horas',
    days: delay.value === 1 ? 'dia' : 'dias',
    weeks: delay.value === 1 ? 'semana' : 'semanas',
    custom: 'personalizado',
  };
  return `${delay.value} ${unitLabels[delay.unit] || delay.unit}`;
}
