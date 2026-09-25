import { OfflineMutation, dequeueOfflineMutation } from '../core/storage/offlineEngine';
import { fetchCompaniesFromSupabase, upsertCompanyToSupabase, deleteCompanyFromSupabase } from './companiesRepository';
import { fetchActionsFromSupabase, upsertActionToSupabase, deleteActionFromSupabase } from './actionsRepository';
import { fetchScriptsFromSupabase, upsertScriptToSupabase, deleteScriptFromSupabase } from './scriptsRepository';
import { fetchFunnelsFromSupabase, upsertFunnelToSupabase, deleteFunnelFromSupabase } from './funnelsRepository';
import { fetchServicesFromSupabase, upsertServiceToSupabase, deleteServiceFromSupabase } from './servicesRepository';
import { fetchObjectionsFromSupabase, upsertObjectionToSupabase, deleteObjectionFromSupabase } from './objectionsRepository';
import { 
  fetchQualificationQuestionsFromSupabase, 
  saveQualificationQuestionsToSupabase,
  fetchQualificationAnswersFromSupabase,
  saveQualificationAnswersToSupabase 
} from './qualificationsRepository';
import { Company } from '../core/types/company';
import { ProspectAction } from '../core/types/prospectAction';
import { ScriptEntity } from '../core/types/script';
import { FunnelEntity } from '../core/types/funnel';
import { ServiceEntity } from '../core/types/service';
import { ObjectionEntity } from '../core/types/objection';
import { QualificationQuestion } from '../core/types/qualification';
import { isDemoCompany, isDemoAction } from '../core/utils/demoCleaners';

/**
 * SERVIÇO DE SINCRONIZAÇÃO BIDIRECIONAL
 * Processa mutações offline acumuladas e consolida estado remoto do Supabase.
 */

export interface SyncPushResult {
  totalProcessed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

export interface RemotePullResult {
  companies: Company[];
  actions: ProspectAction[];
  scripts: ScriptEntity[];
  funnels: FunnelEntity[];
  services: ServiceEntity[];
  objections: ObjectionEntity[];
  qualificationQuestions?: QualificationQuestion[];
  qualificationAnswers?: Record<string, Record<string, string | number>>;
  hasRemoteData: boolean;
}

/**
 * Processa a fila de mutações offline e envia para o Supabase
 */
export async function processOfflineMutations(
  mutations: OfflineMutation[],
  currentContextState?: {
    companies?: Company[];
    actions?: ProspectAction[];
    scripts?: ScriptEntity[];
    funnels?: FunnelEntity[];
    services?: ServiceEntity[];
    objections?: ObjectionEntity[];
  },
  userId?: string | null
): Promise<SyncPushResult> {
  const result: SyncPushResult = {
    totalProcessed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  for (const mut of mutations) {
    result.totalProcessed++;
    let success = false;
    let errorMsg: string | undefined;

    try {
      switch (mut.entityType) {
        case 'company': {
          if (mut.operation === 'DELETE') {
            const res = await deleteCompanyFromSupabase(mut.entityId);
            success = res.success;
            errorMsg = res.error;
          } else {
            // Obtém dados da mutação ou do estado atual
            const companyData: Company | undefined = mut.payload || currentContextState?.companies?.find((c) => c.id === mut.entityId);
            if (companyData) {
              const res = await upsertCompanyToSupabase(companyData, userId);
              success = res.success;
              errorMsg = res.error;
            } else {
              success = true; // Objeto não existe mais localmente
            }
          }
          break;
        }

        case 'action': {
          if (mut.operation === 'DELETE') {
            const res = await deleteActionFromSupabase(mut.entityId);
            success = res.success;
            errorMsg = res.error;
          } else {
            const actionData: ProspectAction | undefined = mut.payload || currentContextState?.actions?.find((a) => a.id === mut.entityId);
            if (actionData) {
              const res = await upsertActionToSupabase(actionData, userId);
              success = res.success;
              errorMsg = res.error;
            } else {
              success = true;
            }
          }
          break;
        }

        case 'script': {
          if (mut.operation === 'DELETE') {
            const res = await deleteScriptFromSupabase(mut.entityId);
            success = res.success;
            errorMsg = res.error;
          } else {
            const scriptData: ScriptEntity | undefined = mut.payload || currentContextState?.scripts?.find((s) => s.id === mut.entityId);
            if (scriptData) {
              const res = await upsertScriptToSupabase(scriptData, userId);
              success = res.success;
              errorMsg = res.error;
            } else {
              success = true;
            }
          }
          break;
        }

        case 'funnel': {
          if (mut.operation === 'DELETE') {
            const res = await deleteFunnelFromSupabase(mut.entityId);
            success = res.success;
            errorMsg = res.error;
          } else {
            const funnelData: FunnelEntity | undefined = mut.payload || currentContextState?.funnels?.find((f) => f.id === mut.entityId);
            if (funnelData) {
              const res = await upsertFunnelToSupabase(funnelData, userId);
              success = res.success;
              errorMsg = res.error;
            } else {
              success = true;
            }
          }
          break;
        }

        case 'service': {
          if (mut.operation === 'DELETE') {
            const res = await deleteServiceFromSupabase(mut.entityId);
            success = res.success;
            errorMsg = res.error;
          } else {
            const serviceData: ServiceEntity | undefined = mut.payload || currentContextState?.services?.find((s) => s.id === mut.entityId);
            if (serviceData) {
              const res = await upsertServiceToSupabase(serviceData, userId);
              success = res.success;
              errorMsg = res.error;
            } else {
              success = true;
            }
          }
          break;
        }

        case 'objection': {
          if (mut.operation === 'DELETE') {
            const res = await deleteObjectionFromSupabase(mut.entityId);
            success = res.success;
            errorMsg = res.error;
          } else {
            const objectionData: ObjectionEntity | undefined = mut.payload || currentContextState?.objections?.find((o) => o.id === mut.entityId);
            if (objectionData) {
              const res = await upsertObjectionToSupabase(objectionData, userId);
              success = res.success;
              errorMsg = res.error;
            } else {
              success = true;
            }
          }
          break;
        }

        default:
          success = true;
      }
    } catch (e: any) {
      success = false;
      errorMsg = e.message;
    }

    if (success) {
      result.succeeded++;
      dequeueOfflineMutation(mut.id);
    } else {
      result.failed++;
      if (errorMsg) {
        result.errors.push(`[${mut.entityType}:${mut.operation}] ${errorMsg}`);
      }
    }
  }

  return result;
}

/**
 * Puxa todos os dados mais recentes do Supabase
 */
export async function pullAllRemoteData(): Promise<RemotePullResult> {
  const [
    compRes,
    actRes,
    scrRes,
    funRes,
    srvRes,
    objRes,
    questRes,
    ansRes,
  ] = await Promise.all([
    fetchCompaniesFromSupabase(),
    fetchActionsFromSupabase(),
    fetchScriptsFromSupabase(),
    fetchFunnelsFromSupabase(),
    fetchServicesFromSupabase(),
    fetchObjectionsFromSupabase(),
    fetchQualificationQuestionsFromSupabase(),
    fetchQualificationAnswersFromSupabase(),
  ]);

  const cleanCompanies = (compRes.data || []).filter((c) => !isDemoCompany(c));
  const cleanActions = (actRes.data || []).filter((a) => !isDemoAction(a));

  const hasRemoteData = Boolean(
    (compRes.success && cleanCompanies.length > 0) ||
    (actRes.success && cleanActions.length > 0) ||
    (scrRes.success && scrRes.data.length > 0) ||
    (funRes.success && funRes.data.length > 0) ||
    (srvRes.success && srvRes.data.length > 0) ||
    (objRes.success && objRes.data.length > 0)
  );

  return {
    companies: cleanCompanies,
    actions: cleanActions,
    scripts: scrRes.data || [],
    funnels: funRes.data || [],
    services: srvRes.data || [],
    objections: objRes.data || [],
    qualificationQuestions: questRes.data,
    qualificationAnswers: ansRes.data,
    hasRemoteData,
  };
}
