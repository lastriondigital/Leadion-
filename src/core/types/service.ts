import { CompanyFunnelStage } from './company';

export type ServiceStatus = 'active' | 'archived' | 'draft';

export interface ServiceCountryPrice {
  id: string;
  country: string;          // Ex: "Moçambique", "Portugal", "Brasil", "Angola", "Estados Unidos"
  countryCode: string;      // Ex: "MZ", "PT", "BR", "AO", "US"
  currency: string;         // Ex: "MT", "EUR", "BRL", "AOA", "USD"
  currencySymbol: string;   // Ex: "MT", "€", "R$", "Kz", "$"
  myPrice: number;          // Meu Preço
  marketMinPrice: number;   // Preço Mínimo de Mercado
  marketMaxPrice: number;   // Preço Máximo de Mercado
  notes?: string;           // Ex: "Preço para landing page institucional com domínio .co.mz incluso"
}

export interface ServiceQualificationCriterion {
  id: string;
  label: string;            // Ex: "Decisor direto acessível (Dono, Sócio ou Diretor)"
  importance: 'obrigatorio' | 'desejavel' | 'eliminatorio';
  description?: string;
}

export interface ServiceQualificationQuestion {
  id: string;
  question: string;         // Ex: "Qual é o principal canal de vendas atual da empresa?"
  expectedAnswerInsight?: string; // Ex: "Se depender 100% de indicação boca a boca, dor de previsibilidade é alta."
  category?: 'dor' | 'orcamento' | 'decisao' | 'timing';
}

export interface ServiceEntity {
  id: string;
  name: string;
  code: string;             // Ex: "LP-CONV-01"
  description: string;
  status: ServiceStatus;
  
  // Precificação Multipaís & Multimoeda
  countryPrices: ServiceCountryPrice[];
  
  // Funil Padrão Associado
  defaultFunnelId?: string;         // ID do Funil Padrão associado ao serviço
  defaultFunnelStageId?: string;    // ID da etapa inicial dentro desse funil
  defaultFunnelStage: CompanyFunnelStage;
  defaultFunnelStageName?: string;
  
  // Qualificação
  qualificationCriteria: ServiceQualificationCriterion[];
  qualificationQuestions: ServiceQualificationQuestion[];

  // Entregáveis & ICP
  deliverables: string[];
  idealCustomerProfile: string;

  // Compatibilidade retroativa
  shortDescription?: string;
  coreValueProposition?: string;
  standardTicket?: string;

  // Controle de Versão e Datas (Preservação Histórica)
  createdAt: string;
  updatedAt: string;
  version: number;
}

// Snapshot de Preço Histórico Imutável (garante que alterações futuras não afetem propostas passadas)
export interface ServicePriceSnapshot {
  serviceId: string;
  serviceName: string;
  serviceVersion: number;
  country: string;
  currency: string;
  currencySymbol: string;
  myPrice: number;
  marketMinPrice: number;
  marketMaxPrice: number;
  formattedMyPrice: string;
  formattedMinPrice: string;
  formattedMaxPrice: string;
  capturedAt: string; // ISO String
}

// Mapeamento de Países Comuns e Moedas Padrão
export interface CountryCurrencyPreset {
  country: string;
  countryCode: string;
  currency: string;
  currencySymbol: string;
}

export const COUNTRY_CURRENCY_PRESETS: CountryCurrencyPreset[] = [
  { country: 'Moçambique', countryCode: 'MZ', currency: 'MT', currencySymbol: 'MT' },
  { country: 'Portugal', countryCode: 'PT', currency: 'EUR', currencySymbol: '€' },
  { country: 'Brasil', countryCode: 'BR', currency: 'BRL', currencySymbol: 'R$' },
  { country: 'Angola', countryCode: 'AO', currency: 'AOA', currencySymbol: 'Kz' },
  { country: 'Estados Unidos', countryCode: 'US', currency: 'USD', currencySymbol: '$' },
  { country: 'Reino Unido', countryCode: 'GB', currency: 'GBP', currencySymbol: '£' },
  { country: 'África do Sul', countryCode: 'ZA', currency: 'ZAR', currencySymbol: 'R' },
  { country: 'Espanha', countryCode: 'ES', currency: 'EUR', currencySymbol: '€' },
  { country: 'Cabo Verde', countryCode: 'CV', currency: 'CVE', currencySymbol: 'Esc' },
];

/**
 * Retorna a configuração de preço correspondente ao país da empresa.
 * Se não houver match exato, busca por proximidade ou fallback para a primeira configuração.
 */
export function getServicePriceForCompany(
  service: ServiceEntity,
  companyCountry?: string
): ServiceCountryPrice | null {
  if (!service || !service.countryPrices || service.countryPrices.length === 0) {
    return null;
  }

  if (!companyCountry || !companyCountry.trim()) {
    return service.countryPrices[0];
  }

  const cleanCountry = companyCountry.trim().toLowerCase();

  // Match exato por país
  const exactMatch = service.countryPrices.find(
    (cp) => cp.country.trim().toLowerCase() === cleanCountry
  );
  if (exactMatch) return exactMatch;

  // Match aproximado (ex: "Brasil" em "São Paulo, SP - Brasil", "Moçambique" em "Maputo, Moçambique")
  const partialMatch = service.countryPrices.find((cp) => {
    const cpCountry = cp.country.trim().toLowerCase();
    return cleanCountry.includes(cpCountry) || cpCountry.includes(cleanCountry);
  });
  if (partialMatch) return partialMatch;

  // Fallback para a primeira configuração cadastrada
  return service.countryPrices[0];
}

/**
 * Formata um valor numérico de acordo com a moeda e símbolo do país.
 */
export function formatServiceCurrency(amount: number, currency: string, symbol: string): string {
  if (isNaN(amount) || amount === null || amount === undefined) return `${symbol} 0`;

  // Formata com separador de milhar
  const formattedNumber = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (currency === 'EUR') {
    return `${symbol}${formattedNumber}`;
  }
  if (currency === 'USD') {
    return `${symbol}${formattedNumber}`;
  }
  if (currency === 'MT') {
    return `${formattedNumber} MT`;
  }
  if (currency === 'BRL') {
    return `R$ ${formattedNumber}`;
  }
  return `${symbol} ${formattedNumber}`;
}

/**
 * Cria um snapshot congelado imutável do preço atual do serviço
 */
export function createServicePriceSnapshot(
  service: ServiceEntity,
  countryPrice: ServiceCountryPrice
): ServicePriceSnapshot {
  return {
    serviceId: service.id,
    serviceName: service.name,
    serviceVersion: service.version || 1,
    country: countryPrice.country,
    currency: countryPrice.currency,
    currencySymbol: countryPrice.currencySymbol,
    myPrice: countryPrice.myPrice,
    marketMinPrice: countryPrice.marketMinPrice,
    marketMaxPrice: countryPrice.marketMaxPrice,
    formattedMyPrice: formatServiceCurrency(countryPrice.myPrice, countryPrice.currency, countryPrice.currencySymbol),
    formattedMinPrice: formatServiceCurrency(countryPrice.marketMinPrice, countryPrice.currency, countryPrice.currencySymbol),
    formattedMaxPrice: formatServiceCurrency(countryPrice.marketMaxPrice, countryPrice.currency, countryPrice.currencySymbol),
    capturedAt: new Date().toISOString(),
  };
}
