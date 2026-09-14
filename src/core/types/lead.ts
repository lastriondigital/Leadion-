export type ChannelType = 'whatsapp' | 'linkedin' | 'email' | 'phone';

export type LeadUrgency = 'high' | 'medium' | 'low';

export type TimingStatus = 'due_today' | 'overdue' | 'scheduled' | 'executed' | 'snoozed';

export type LeadPipelineStatus = 
  | 'pending_action' 
  | 'in_cadence' 
  | 'meeting_scheduled' 
  | 'qualified' 
  | 'disqualified' 
  | 'nurture';

export interface LeadTimelineEvent {
  id: string;
  timestamp: string;
  type: 
    | 'whatsapp_sent' 
    | 'call_made' 
    | 'linkedin_connected' 
    | 'email_sent' 
    | 'meeting_scheduled' 
    | 'objection_logged' 
    | 'status_changed' 
    | 'note_added';
  title: string;
  detail: string;
  channel?: ChannelType;
  result?: 'connected' | 'no_answer' | 'replied_positive' | 'objection' | 'rejected';
  author: string;
}

export interface Lead {
  id: string;
  
  // 1. Quem prospectar?
  name: string;
  role: string;
  company: string;
  companyId?: string;
  avatarUrl?: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  linkedinUrl: string;
  segment: string;
  companySize: string;
  annualRevenue?: string;
  location: string;
  
  // 2. Por que prospectar?
  why: {
    trigger: string;          // Fato/gatilho recente e relevante
    painPoint: string;        // Dor latente operacional
    urgencyLevel: LeadUrgency;
    icpFitReason: string;
  };
  
  // 3. O que oferecer?
  offer: {
    serviceId: string;
    serviceName: string;
    valueProposition: string; // Proposta de valor concisa e sem jargões
    estimatedTicket: string;
    deliverablesHighlight: string;
  };
  
  // 4. O que dizer?
  script: {
    channel: ChannelType;
    hook: string;             // Abertura que prende atenção
    body: string;             // O conteúdo da mensagem com personalização
    cta: string;              // Pergunta de fechamento clara
    fullText: string;         // Mensagem pronta para copiar/enviar
    alternativeChannels?: {
      whatsapp?: string;
      linkedin?: string;
      phone?: string;
      email?: string;
    };
  };
  
  // 5. Quando agir?
  timing: {
    status: TimingStatus;
    scheduledTime: string;    // ex: "09:30"
    scheduledDate: string;    // ex: "Hoje"
    cadenceStep: number;      // ex: 2
    totalCadenceSteps: number;// ex: 5
    stepLabel: string;        // ex: "Toque 2: Follow-up WhatsApp"
    timeIndicator: string;    // ex: "Agora", "Em 25 min", "Atrasado 10 min"
  };
  
  // 6. Qual é a próxima ação?
  nextAction: {
    channel: ChannelType;
    actionType: 'send_whatsapp' | 'make_call' | 'connect_linkedin' | 'send_email';
    label: string;            // ex: "Enviar WhatsApp com Script"
    shortcutKey?: string;
  };

  // Score & Métricas de Propensão (Ion Score)
  score: number; // 0-100
  scoreFactors: Array<{
    label: string;
    points: number;
    type: 'positive' | 'negative';
  }>;

  status: LeadPipelineStatus;
  history: LeadTimelineEvent[];
  notes: string;
  tags: string[];
}
