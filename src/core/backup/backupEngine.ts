import { Company, CompanyActivity, CompanyTimelineEvent } from '../types/company';
import { Lead } from '../types/lead';
import { ScriptEntity } from '../types/script';
import { FunnelEntity } from '../types/funnel';
import { ServiceEntity } from '../types/service';
import { ProspectAction } from '../types/prospectAction';
import { ObjectionEntity } from '../types/objection';
import { QualificationQuestion } from '../types/qualification';
import { PriorityWeights } from '../priority/priorityEngine';
import { getOrCreateDeviceId, getDeviceName } from '../storage/offlineEngine';

export interface LeadionBackupPayload {
  version: number;
  exportedAt: string;
  exportedByDeviceId: string;
  deviceName: string;
  system: 'LEADION Sales OS';
  metadata: {
    totalCompanies: number;
    totalScripts: number;
    totalFunnels: number;
    totalServices: number;
    totalActions: number;
    totalObjections: number;
  };
  companies: Company[];
  leads: Lead[];
  scripts: ScriptEntity[];
  funnels: FunnelEntity[];
  services: ServiceEntity[];
  actions: ProspectAction[];
  objections: ObjectionEntity[];
  qualificationQuestions?: QualificationQuestion[];
  qualificationAnswers?: Record<string, Record<string, string>>;
  priorityWeights?: PriorityWeights;
}

export interface LocalBackupSlot {
  id: string;
  name: string;
  createdAt: string;
  sizeBytes: number;
  itemCounts: {
    companies: number;
    scripts: number;
    funnels: number;
    services: number;
    actions: number;
  };
  payload: LeadionBackupPayload;
}

const LOCAL_SNAPSHOTS_KEY = 'leadion_local_backup_slots';

/**
 * Dispara o download de um arquivo no navegador
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * EXPORTAR PARA JSON (Backup Completo com 1 clique)
 */
export function exportDatabaseToJson(data: {
  companies: Company[];
  leads: Lead[];
  scripts: ScriptEntity[];
  funnels: FunnelEntity[];
  services: ServiceEntity[];
  actions: ProspectAction[];
  objections: ObjectionEntity[];
  qualificationQuestions?: QualificationQuestion[];
  qualificationAnswers?: Record<string, Record<string, string>>;
  priorityWeights?: PriorityWeights;
}): void {
  const payload: LeadionBackupPayload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    exportedByDeviceId: getOrCreateDeviceId(),
    deviceName: getDeviceName(),
    system: 'LEADION Sales OS',
    metadata: {
      totalCompanies: data.companies.length,
      totalScripts: data.scripts.length,
      totalFunnels: data.funnels.length,
      totalServices: data.services.length,
      totalActions: data.actions.length,
      totalObjections: data.objections.length,
    },
    companies: data.companies,
    leads: data.leads,
    scripts: data.scripts,
    funnels: data.funnels,
    services: data.services,
    actions: data.actions,
    objections: data.objections,
    qualificationQuestions: data.qualificationQuestions,
    qualificationAnswers: data.qualificationAnswers,
    priorityWeights: data.priorityWeights,
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `leadion-backup-${dateStr}.json`;

  triggerFileDownload(jsonString, filename, 'application/json');
}

/**
 * Escapa valores para CSV conforme especificação RFC 4180
 */
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * EXPORTAR EMPRESAS PARA CSV (compatível com Excel com BOM UTF-8)
 */
export function exportCompaniesToCsv(companies: Company[]): void {
  const headers = [
    'ID',
    'Nome da Empresa',
    'Tipo de Negócio',
    'Porte',
    'Website',
    'Telefone',
    'E-mail',
    'País',
    'Cidade',
    'Nicho',
    'Etapa do Funil',
    'Score Ion',
    'Serviço Principal',
    'Criado Em',
    'Total Atividades',
    'Total Eventos Timeline',
    'Notas Comerciais'
  ];

  const rows = companies.map((c) => [
    escapeCsv(c.id),
    escapeCsv(c.name),
    escapeCsv(c.businessType || 'B2B'),
    escapeCsv(c.size || ''),
    escapeCsv(c.website || ''),
    escapeCsv(c.phone || ''),
    escapeCsv(c.email || ''),
    escapeCsv(c.country || ''),
    escapeCsv(c.city || ''),
    escapeCsv(c.niche || ''),
    escapeCsv(c.funnelStageName || c.funnelStage),
    escapeCsv(c.score || 0),
    escapeCsv(c.primaryServiceId || ''),
    escapeCsv(c.createdAt || ''),
    escapeCsv(c.activities?.length || 0),
    escapeCsv(c.timeline?.length || 0),
    escapeCsv(c.commercialNotes || '')
  ].join(';'));

  // \uFEFF adiciona o Byte Order Mark (BOM) para o Excel reconhecer acentuação e caracteres especiais em UTF-8
  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `leadion-empresas-${dateStr}.csv`;

  triggerFileDownload(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * EXPORTAR HISTÓRICO DE ATIVIDADES PARA CSV (Auditoria e Preservação)
 */
export function exportActivitiesToCsv(companies: Company[]): void {
  const headers = [
    'ID da Atividade',
    'ID da Empresa',
    'Nome da Empresa',
    'Tipo de Atividade',
    'Título',
    'Descrição',
    'Status Concluída',
    'Criada Em',
    'Data Limite',
    'Concluída Em'
  ];

  const rows: string[] = [];
  companies.forEach((comp) => {
    comp.activities?.forEach((act) => {
      rows.push([
        escapeCsv(act.id),
        escapeCsv(comp.id),
        escapeCsv(comp.name),
        escapeCsv(act.type),
        escapeCsv(act.title),
        escapeCsv(act.notes || ''),
        escapeCsv(act.completed ? 'Sim' : 'Não'),
        escapeCsv(act.createdAt || ''),
        escapeCsv(act.dueDate || ''),
        escapeCsv(act.completedAt || '')
      ].join(';'));
    });
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `leadion-atividades-historico-${dateStr}.csv`;

  triggerFileDownload(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * EXPORTAR PIPELINE DE AÇÕES PARA CSV
 */
export function exportPipelineToCsv(actions: ProspectAction[], companies: Company[]): void {
  const companyMap = new Map<string, string>();
  companies.forEach((c) => companyMap.set(c.id, c.name));

  const headers = [
    'ID da Ação',
    'ID da Empresa',
    'Nome da Empresa',
    'Título da Ação',
    'Canal',
    'Status',
    'Prioridade Score',
    'Data Agendada',
    'Hora Agendada',
    'Desfecho (Outcome)',
    'Valor Potencial',
    'Notas de Execução'
  ];

  const rows = actions.map((act) => [
    escapeCsv(act.id),
    escapeCsv(act.companyId),
    escapeCsv(companyMap.get(act.companyId) || act.companyName || 'Empresa'),
    escapeCsv(act.nextAction),
    escapeCsv(act.channel),
    escapeCsv(act.status),
    escapeCsv(act.score || 50),
    escapeCsv(act.date || ''),
    escapeCsv(act.time || ''),
    escapeCsv((act as any).outcome || ''),
    escapeCsv(act.potentialValue || ''),
    escapeCsv(act.observation || (act as any).outcomeNotes || '')
  ].join(';'));

  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `leadion-pipeline-acoes-${dateStr}.csv`;

  triggerFileDownload(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * VALIDA E PROCESSA BACKUP JSON
 */
export function parseAndValidateJsonBackup(jsonString: string): {
  isValid: boolean;
  error?: string;
  payload?: LeadionBackupPayload;
  summary?: Record<string, number>;
} {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, error: 'O arquivo não é um objeto JSON válido.' };
    }

    if (!Array.isArray(parsed.companies)) {
      return { isValid: false, error: 'Arquivo inválido: campo "companies" não encontrado ou em formato incorreto.' };
    }

    const payload: LeadionBackupPayload = {
      version: parsed.version || 1,
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      exportedByDeviceId: parsed.exportedByDeviceId || 'imported-device',
      deviceName: parsed.deviceName || 'Backup Importado',
      system: parsed.system || 'LEADION Sales OS',
      metadata: {
        totalCompanies: parsed.companies?.length || 0,
        totalScripts: parsed.scripts?.length || 0,
        totalFunnels: parsed.funnels?.length || 0,
        totalServices: parsed.services?.length || 0,
        totalActions: parsed.actions?.length || 0,
        totalObjections: parsed.objections?.length || 0,
      },
      companies: parsed.companies || [],
      leads: parsed.leads || [],
      scripts: parsed.scripts || [],
      funnels: parsed.funnels || [],
      services: parsed.services || [],
      actions: parsed.actions || [],
      objections: parsed.objections || [],
      qualificationQuestions: parsed.qualificationQuestions,
      qualificationAnswers: parsed.qualificationAnswers,
      priorityWeights: parsed.priorityWeights,
    };

    return {
      isValid: true,
      payload,
      summary: {
        empresas: payload.companies.length,
        scripts: payload.scripts.length,
        funis: payload.funnels.length,
        servicos: payload.services.length,
        acoes: payload.actions.length,
        objeções: payload.objections.length,
      },
    };
  } catch (err: any) {
    return { isValid: false, error: `Falha ao processar JSON: ${err.message || 'formato corrompido'}` };
  }
}

/**
 * PARSER ROBUSTO DE CSV (Suporta vírgulas, ponto-e-vírgula e quebras de linha com aspas)
 */
export function parseCsvContent(text: string): string[][] {
  // Remove BOM se presente
  let clean = text.replace(/^\uFEFF/, '').trim();
  if (!clean) return [];

  // Detecta delimitador principal (; ou ,)
  const firstLine = clean.split(/\r?\n/)[0] || '';
  const semiCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const delimiter = semiCount >= commaCount ? ';' : ',';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // pula aspas escapadas
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentVal.trim());
      if (currentRow.length > 0 && currentRow.some((c) => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((c) => c !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * MAPEADOR AUTOMÁTICO DE COLUNAS CSV
 */
export function autoMapCsvHeaders(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};

  headers.forEach((h, idx) => {
    const norm = h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    if (!('name' in map) && (norm.includes('nome') || norm.includes('empresa') || norm.includes('company'))) {
      map['name'] = idx;
    } else if (!('phone' in map) && (norm.includes('telefone') || norm.includes('phone') || norm.includes('celular') || norm.includes('whatsapp') || norm.includes('contato'))) {
      map['phone'] = idx;
    } else if (!('email' in map) && (norm.includes('email') || norm.includes('e-mail') || norm.includes('mail'))) {
      map['email'] = idx;
    } else if (!('niche' in map) && (norm.includes('nicho') || norm.includes('setor') || norm.includes('segmento') || norm.includes('ramo') || norm.includes('categoria'))) {
      map['niche'] = idx;
    } else if (!('country' in map) && (norm.includes('pais') || norm.includes('country') || norm.includes('nacao'))) {
      map['country'] = idx;
    } else if (!('city' in map) && (norm.includes('cidade') || norm.includes('city') || norm.includes('municipio'))) {
      map['city'] = idx;
    } else if (!('website' in map) && (norm.includes('site') || norm.includes('website') || norm.includes('url') || norm.includes('web'))) {
      map['website'] = idx;
    } else if (!('document' in map) && (norm.includes('documento') || norm.includes('cnpj') || norm.includes('nuit') || norm.includes('nif') || norm.includes('cpf'))) {
      map['document'] = idx;
    } else if (!('notes' in map) && (norm.includes('nota') || norm.includes('observacao') || norm.includes('obs') || norm.includes('descricao'))) {
      map['notes'] = idx;
    }
  });

  return map;
}

/**
 * GESTÃO DE SLOTS DE BACKUP LOCAL NO NAVEGADOR
 */
export function listLocalBackupSlots(): LocalBackupSlot[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LOCAL_SNAPSHOTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalBackupSnapshot(
  name: string,
  payload: LeadionBackupPayload
): LocalBackupSlot {
  const slots = listLocalBackupSlots();
  const id = 'slot-' + Date.now();
  const serialized = JSON.stringify(payload);
  const sizeBytes = new Blob([serialized]).size;

  const newSlot: LocalBackupSlot = {
    id,
    name,
    createdAt: new Date().toISOString(),
    sizeBytes,
    itemCounts: {
      companies: payload.companies.length,
      scripts: payload.scripts.length,
      funnels: payload.funnels.length,
      services: payload.services.length,
      actions: payload.actions.length,
    },
    payload,
  };

  // Mantém os 5 backups locais mais recentes
  const updatedSlots = [newSlot, ...slots].slice(0, 5);
  localStorage.setItem(LOCAL_SNAPSHOTS_KEY, JSON.stringify(updatedSlots));
  return newSlot;
}

export function deleteLocalBackupSlot(slotId: string): void {
  const slots = listLocalBackupSlots().filter((s) => s.id !== slotId);
  localStorage.setItem(LOCAL_SNAPSHOTS_KEY, JSON.stringify(slots));
}
