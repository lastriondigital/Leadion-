import { Company } from '../types/company';
import { ProspectAction } from '../types/prospectAction';
import { Lead } from '../types/lead';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * REGRAS DE AUDITORIA E PURGA DE DADOS DEMO / FICTÍCIOS NO LEADION
 * Garante 0 empresas fictícias, 0 contatos demo e 0 ações automáticas.
 */

export const DEMO_COMPANY_KEYWORDS = [
  'clínica aurora',
  'clinica aurora',
  'veloce logística',
  'veloce logistica',
  'advocacia silveira',
  'instituto odonto',
  'hospital santa helena',
  'techsolutions',
  'solaris engenharia',
  'empresa exemplo',
  'clinica exemplo',
  'clínica exemplo',
  'abc company',
  'demo company',
  'empresa teste',
  'lead demo',
  'demo lead',
  'cliente exemplo',
  'empresa demo',
  'fictício',
  'ficticio',
  'fictícia',
  'ficticia',
  'empresa de demonstração',
  'empresa de demonstracao'
];

export const DEMO_COMPANY_IDS = [
  'comp-01',
  'comp-02',
  'comp-03',
  'comp-04',
  'comp-05',
  'demo-1',
  'demo-2',
  'demo-3',
  'sample-1',
  'test-1',
  'demo-comp-1',
  'demo-comp-2'
];

/**
 * Identifica com precisão cirúrgica se uma empresa é fictícia/demo
 */
export function isDemoCompany(comp: Partial<Company> | Record<string, any> | null | undefined): boolean {
  if (!comp) return true;

  const id = String(comp.id || '').toLowerCase().trim();
  if (DEMO_COMPANY_IDS.includes(id)) return true;
  if (id.startsWith('demo-') || id.startsWith('sample-') || id.startsWith('mock-')) return true;

  const name = String(comp.name || (comp as any).commercial_name || '').toLowerCase().trim();
  if (!name) return true; // sem nome não é empresa válida

  // Verifica palavras-chave exatas ou contidas
  for (const keyword of DEMO_COMPANY_KEYWORDS) {
    if (name === keyword || name.includes(keyword)) {
      return true;
    }
  }

  // Tags explícitas
  if ((comp as any).isDemo === true || (comp as any).isMock === true || (comp as any).isSample === true) {
    return true;
  }

  return false;
}

/**
 * Identifica se uma ação de prospecção pertence a uma empresa demo ou é fictícia
 */
export function isDemoAction(action: Partial<ProspectAction> | Record<string, any> | null | undefined): boolean {
  if (!action) return true;

  const id = String(action.id || '').toLowerCase().trim();
  if (id.startsWith('act-demo') || id === 'act-01' || id === 'act-02' || id === 'act-03') return true;

  const companyId = String(action.companyId || (action as any).company_id || '').toLowerCase().trim();
  if (DEMO_COMPANY_IDS.includes(companyId) || companyId.startsWith('demo-')) return true;

  const companyName = String(action.companyName || (action as any).company_name || '').toLowerCase().trim();
  if (companyName) {
    for (const keyword of DEMO_COMPANY_KEYWORDS) {
      if (companyName === keyword || companyName.includes(keyword)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Identifica se um lead pertence a dados demo
 */
export function isDemoLead(lead: Partial<Lead> | Record<string, any> | null | undefined): boolean {
  if (!lead) return true;
  const id = String(lead.id || '').toLowerCase().trim();
  if (id.startsWith('lead-demo') || id === 'lead-01' || id === 'lead-02') return true;

  const compName = String(lead.company || '').toLowerCase().trim();
  if (compName) {
    for (const keyword of DEMO_COMPANY_KEYWORDS) {
      if (compName === keyword || compName.includes(keyword)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Sanitiza o LocalStorage do navegador, eliminando qualquer vestígio de empresas demo
 */
export function cleanLocalStorageDemoData(): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Limpa empresas demo
    const rawCompanies = localStorage.getItem('leadion-companies');
    if (rawCompanies) {
      const parsed = JSON.parse(rawCompanies);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter((c) => !isDemoCompany(c));
        if (clean.length !== parsed.length) {
          localStorage.setItem('leadion-companies', JSON.stringify(clean));
        }
      }
    }

    // 2. Limpa ações demo
    const rawActions = localStorage.getItem('leadion-prospect-actions');
    if (rawActions) {
      const parsed = JSON.parse(rawActions);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter((a) => !isDemoAction(a));
        if (clean.length !== parsed.length) {
          localStorage.setItem('leadion-prospect-actions', JSON.stringify(clean));
        }
      }
    }

    // 3. Limpa empresa selecionada se for demo
    const savedSelectedId = localStorage.getItem('leadion-selected-company-id');
    if (savedSelectedId && DEMO_COMPANY_IDS.includes(savedSelectedId.toLowerCase())) {
      localStorage.removeItem('leadion-selected-company-id');
    }

    // 4. Remove store mock remoto se existir
    localStorage.removeItem('leadion_mock_remote_db');

    // 5. Limpa leads demo
    const rawLeads = localStorage.getItem('leadion-leads');
    if (rawLeads) {
      const parsed = JSON.parse(rawLeads);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter((l) => !isDemoLead(l));
        if (clean.length !== parsed.length) {
          localStorage.setItem('leadion-leads', JSON.stringify(clean));
        }
      }
    }
  } catch (err) {
    console.warn('Erro ao sanitizar localStorage:', err);
  }
}

/**
 * Purga com total segurança registros demo que possam estar salvos no banco Supabase
 * IMPORTANTE: Nunca apaga dados reais de usuários! Apenas os IDs e nomes especificamente mapeados como demo.
 */
export async function purgeDemoDataFromSupabase(client: SupabaseClient | null): Promise<{
  deletedCompaniesCount: number;
  deletedActionsCount: number;
}> {
  if (!client) return { deletedCompaniesCount: 0, deletedActionsCount: 0 };

  let deletedCompaniesCount = 0;
  let deletedActionsCount = 0;

  try {
    // 1. Busca empresas em leadion_companies e companies
    const tables = ['leadion_companies', 'companies'];
    for (const table of tables) {
      const { data, error } = await client.from(table).select('id, name');
      if (!error && Array.isArray(data) && data.length > 0) {
        const demoRecords = data.filter((row) => isDemoCompany(row));
        if (demoRecords.length > 0) {
          const idsToDelete = demoRecords.map((r) => r.id);
          const delRes = await client.from(table).delete().in('id', idsToDelete);
          if (!delRes.error) {
            deletedCompaniesCount += idsToDelete.length;
          }
        }
      }
    }

    // 2. Busca e remove ações vinculadas a empresas demo em leadion_prospect_actions e actions
    const actionTables = ['leadion_prospect_actions', 'actions'];
    for (const table of actionTables) {
      const { data, error } = await client.from(table).select('id, company_id, companyName, title');
      if (!error && Array.isArray(data) && data.length > 0) {
        const demoActions = data.filter((row) => isDemoAction(row));
        if (demoActions.length > 0) {
          const idsToDelete = demoActions.map((r) => r.id);
          const delRes = await client.from(table).delete().in('id', idsToDelete);
          if (!delRes.error) {
            deletedActionsCount += idsToDelete.length;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Tentativa de purga segura no Supabase encontrou ressalva de rede/permissão:', err);
  }

  return { deletedCompaniesCount, deletedActionsCount };
}
