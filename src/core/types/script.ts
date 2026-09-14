import { ChannelType } from './lead';

export type ScriptChannel = 'whatsapp' | 'email' | 'linkedin' | 'phone' | 'instagram' | 'other';
export type ScriptGender = 'all' | 'masculino' | 'feminino' | 'neutro';
export type ScriptStatus = 'active' | 'archived' | 'draft';
export type DelayUnit = 'minutes' | 'hours' | 'days' | 'weeks' | 'custom';
export type DelayEvent = 'previous_sent' | 'opened' | 'no_reply' | 'manual';
export type WhatsAppDispatchStatus = 'preparado' | 'aberto' | 'enviado_manualmente' | 'nao_enviado';

export interface ScriptDelayConfig {
  value: number;
  unit: DelayUnit;
  customLabel?: string;
  event: DelayEvent;
}

export interface ScriptEntity {
  id: string;
  name: string;
  channel: ScriptChannel;
  country: string; // Moçambique, Portugal, Brasil, Angola, Todos
  gender: ScriptGender;
  niche: string;
  serviceId: string; // ID do serviço ou 'all'
  serviceName?: string;
  funnelId: string; // ID do funil ou 'all'
  funnelName?: string;
  variables: string[];
  content: string;
  previousScriptId?: string | null;
  nextScriptId?: string | null;
  condition: string;
  delay: ScriptDelayConfig;
  status: ScriptStatus;
  sequenceOrder?: number;
  sequenceType?: 'message' | 'followup';
  createdAt: string;
  updatedAt: string;
}

export interface ProspectScript {
  id: string;
  title: string;
  channel: ChannelType;
  targetRole: string;
  triggerType: string;
  structure: {
    hook: string;
    context: string;
    valueProposition: string;
    cta: string;
  };
  fullTemplate: string;
  conversionRateApprox?: string;
  tags: string[];
}

export interface Objection {
  id: string;
  objectionText: string;
  category: 'timing' | 'budget' | 'authority' | 'satisfaction' | 'priority';
  corePsychology: string; // O que o lead realmente quer dizer
  recommendedResponses: Array<{
    approach: 'pivot' | 'qualification' | 'empathy_and_value' | 'case_study';
    label: string;
    script: string;
    nextStepQuestion: string;
  }>;
}

export interface ServiceOffering {
  id: string;
  name: string;
  code: string;
  shortDescription: string;
  coreValueProposition: string;
  targetPainPoints: string[];
  idealCustomerProfile: string;
  standardTicket: string;
  deliverables: string[];
}

