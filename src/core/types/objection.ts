import { ScriptChannel, ScriptGender, ScriptDelayConfig } from './script';

export type ObjectionCategory = 
  | 'preco'          // Está caro / Sem verba / Desconto
  | 'indecisao'      // Vou pensar / Preciso avaliar
  | 'desinteresse'   // Não tenho interesse / Não quero
  | 'concorrencia'   // Já tenho alguém / Já temos fornecedor
  | 'timing'         // Agora não / Sem tempo / Trimestre que vem
  | 'autoridade'     // Preciso falar com meu sócio / diretoria
  | 'informacao'     // Manda informação / Manda apresentação por e-mail
  | 'outros';

export type ObjectionStepType = 
  | 'response_1'   // Resposta 1 (Primeiro Desarme)
  | 'reaction'     // Nova Reação (Hipótese de retruco do lead)
  | 'response_2'   // Resposta 2 (Aprofundamento / Prova Social / Custo de Inação)
  | 'followup'     // Follow-up de Objeção (Reengajamento após silêncio)
  | 'next_stage';  // Próxima Etapa (Transição no funil / Agendamento)

export interface ObjectionStepResponse {
  id: string;
  name: string;
  stepType: ObjectionStepType;
  channel: ScriptChannel;
  country: string; // 'Moçambique' | 'Portugal' | 'Brasil' | 'Angola' | 'Todos'
  gender: ScriptGender;
  serviceId: string; // ID do serviço ou 'all'
  serviceName?: string;
  variables: string[];
  content: string;
  previousScriptId?: string | null;
  nextScriptId?: string | null;
  delay: ScriptDelayConfig;
  reactionHypothesis?: string; // O que o lead provavelmente vai dizer na nova reação
  nextStageTarget?: string; // Ex: 'Agendamento de Reunião', 'Apresentação Técnica'
  order: number;
}

export interface ObjectionSequence {
  id: string;
  name: string;
  description: string;
  channel: ScriptChannel;
  country?: string;
  serviceId?: string;
  isDefault: boolean;
  steps: ObjectionStepResponse[];
}

export interface ObjectionEntity {
  id: string;
  name: string; // ex: "Está caro", "Vou pensar", "Não tenho interesse", etc.
  category: ObjectionCategory;
  description: string; // O que o lead realmente quer dizer / psicologia de fundo
  conditions: string[]; // Condições e gatilhos de ativação
  sequences: ObjectionSequence[];
  createdAt: string;
  updatedAt: string;
}
