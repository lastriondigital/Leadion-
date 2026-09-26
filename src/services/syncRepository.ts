import {
  OfflineMutation,
  dequeueOfflineMutation,
  recordMutationFailure,
  MAX_RETRY_ATTEMPTS,
} from '../core/storage/offlineEngine';
import { idbDelete, idbPut, idbGet, STORES, StoreName } from '../core/storage/indexedDB';
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
  saveQualificationAnswersToSupabase,
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
 * SERVIÇO DE SINCRONIZAÇÃO BIDIRECIONAL COM BACKOFF PROGRESSIVO & TOMBSTONES
 * Processa mutações offline acumuladas e consolida estado remoto do Supabase.
 */

export interface SyncPushResult {
  totalProcessed: number;
  succeeded: number;
  failed: number;
  failedCount: number;
  exhaustedCount: number;
  nextRetryDelayMs: number | null;
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

function getStoreForEntity(entityType: string): StoreName | null {
  switch (entityType) {
    case 'company':
      return STORES.COMPANIES;
    case 'action':
      return STORES.ACTIONS;
    case 'script':
      return STORES.SCRIPTS;
    case 'funnel':
      return STORES.FUNNELS;
    case 'service':
      return STORES.SERVICES;
    case 'objection':
      return STORES.OBJECTIONS;
    case 'qualification':
      return STORES.QUALIFICATIONS;
    case 'setting':
      return STORES.SETTINGS;
    default:
      return null;
  }
}

/**
 * Processa a fila de mutações offline e envia para o Supabase
 * Respeita backoff progressivo (2s, 5s, 15s, 30s -> sync_error) e remove tombstones após confirmação de DELETE.
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
    qualificationQuestions?: QualificationQuestion[];
    qualificationAnswers?: Record<string, Record<string, string>>;
  },
  userId?: string | null,
  options?: { forceRetryAll?: boolean }
): Promise<SyncPushResult> {
  const result: SyncPushResult = {
    totalProcessed: 0,
    succeeded: 0,
    failed: 0,
    failedCount: 0,
    exhaustedCount: 0,
    nextRetryDelayMs: null,
    errors: [],
  };

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return result;
  }

  const nowMs = Date.now();

  for (const mut of mutations) {
    // Se já atingiu o limite máximo de tentativas e não foi forçado manualmente, aguarda ação futura
    if (!options?.forceRetryAll && (mut.status === 'sync_error' || (mut.attempts || 0) >= MAX_RETRY_ATTEMPTS)) {
      result.exhaustedCount++;
      continue;
    }

    // Se está em janela de backoff e não foi forçado manualmente, calcula próximo agendamento
    if (!options?.forceRetryAll && mut.nextRetryAt && mut.nextRetryAt > nowMs) {
      const remaining = mut.nextRetryAt - nowMs;
      if (result.nextRetryDelayMs === null || remaining < result.nextRetryDelayMs) {
        result.nextRetryDelayMs = remaining;
      }
      continue;
    }

    result.totalProcessed++;
    let success = false;
    let errorMsg: string | undefined;
    const nowIso = new Date().toISOString();
    const storeName = getStoreForEntity(mut.entityType);

    try {
      switch (mut.entityType) {
        case 'company': {
          if (mut.operation === 'DELETE') {
            const targetId = mut.remote_id || mut.entityId;
            const res = await deleteCompanyFromSupabase(targetId);
            success = res.success;
            errorMsg = res.error;
            if (success && storeName) {
              // Remove definitivamente o tombstone local após confirmação do Supabase
              await idbDelete(storeName, mut.entityId);
            }
          } else {
            const localRecord = currentContextState?.companies?.find((c) => c.id === mut.entityId);
            const idbRecord = storeName ? await idbGet<Company>(storeName, mut.entityId) : null;
            const companyData: Company | undefined = localRecord || idbRecord || mut.payload;

            if (companyData && !(companyData as any).deleted_at) {
              const mergedCompany: Company = {
                ...companyData,
                ...(typeof mut.payload === 'object' && mut.payload ? mut.payload : {}),
                id: companyData.id || mut.entityId,
              };
              const res = await upsertCompanyToSupabase(mergedCompany, userId);
              success = res.success;
              errorMsg = res.error;
              if (success && storeName) {
                const syncedRecord: Company = {
                  ...mergedCompany,
                  ...(res.company || {}),
                  local_id: mergedCompany.local_id || mergedCompany.id,
                  remote_id: res.company?.id || mergedCompany.id,
                  sync_status: 'synced',
                  synced_at: nowIso,
                };
                await idbPut(storeName, syncedRecord);
              }
            } else {
              success = true;
            }
          }
          break;
        }

        case 'action': {
          if (mut.operation === 'DELETE') {
            const res = await deleteActionFromSupabase(mut.entityId);
            success = res.success;
            errorMsg = res.error;
            if (success && storeName) {
              await idbDelete(storeName, mut.entityId);
            }
          } else {
            const localAction = currentContextState?.actions?.find((a) => a.id === mut.entityId);
            const idbAction = storeName ? await idbGet<ProspectAction>(storeName, mut.entityId) : null;
            const actionData: ProspectAction | undefined = localAction || idbAction || mut.payload;
            if (actionData && !(actionData as any).deleted_at) {
              const res = await upsertActionToSupabase(actionData, userId);
              success = res.success;
              errorMsg = res.error;
              if (success && storeName) {
                await idbPut(storeName, {
                  ...actionData,
                  sync_status: 'synced',
                  synced_at: nowIso,
                });
              }
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
            if (success && storeName) {
              await idbDelete(storeName, mut.entityId);
            }
          } else {
            const localScript = currentContextState?.scripts?.find((s) => s.id === mut.entityId);
            const idbScript = storeName ? await idbGet<ScriptEntity>(storeName, mut.entityId) : null;
            const scriptData: ScriptEntity | undefined = localScript || idbScript || mut.payload;
            if (scriptData && !(scriptData as any).deleted_at) {
              const mergedScript = {
                ...scriptData,
                ...(typeof mut.payload === 'object' && mut.payload ? mut.payload : {}),
                id: scriptData.id || mut.entityId,
              };
              const res = await upsertScriptToSupabase(mergedScript, userId);
              success = res.success;
              errorMsg = res.error;
              if (success && storeName) {
                await idbPut(storeName, {
                  ...mergedScript,
                  sync_status: 'synced',
                  synced_at: nowIso,
                });
              }
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
            if (success && storeName) {
              await idbDelete(storeName, mut.entityId);
            }
          } else {
            const localFunnel = currentContextState?.funnels?.find((f) => f.id === mut.entityId);
            const idbFunnel = storeName ? await idbGet<FunnelEntity>(storeName, mut.entityId) : null;
            const funnelData: FunnelEntity | undefined = localFunnel || idbFunnel || mut.payload;
            if (funnelData && !(funnelData as any).deleted_at) {
              const mergedFunnel = {
                ...funnelData,
                ...(typeof mut.payload === 'object' && mut.payload ? mut.payload : {}),
                id: funnelData.id || mut.entityId,
              };
              const res = await upsertFunnelToSupabase(mergedFunnel, userId);
              success = res.success;
              errorMsg = res.error;
              if (success && storeName) {
                await idbPut(storeName, {
                  ...mergedFunnel,
                  sync_status: 'synced',
                  synced_at: nowIso,
                });
              }
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
            if (success && storeName) {
              await idbDelete(storeName, mut.entityId);
            }
          } else {
            const localService = currentContextState?.services?.find((s) => s.id === mut.entityId);
            const idbService = storeName ? await idbGet<ServiceEntity>(storeName, mut.entityId) : null;
            const serviceData: ServiceEntity | undefined = localService || idbService || mut.payload;
            if (serviceData && !(serviceData as any).deleted_at) {
              const mergedService = {
                ...serviceData,
                ...(typeof mut.payload === 'object' && mut.payload ? mut.payload : {}),
                id: serviceData.id || mut.entityId,
              };
              const res = await upsertServiceToSupabase(mergedService, userId);
              success = res.success;
              errorMsg = res.error;
              if (success && storeName) {
                await idbPut(storeName, {
                  ...mergedService,
                  sync_status: 'synced',
                  synced_at: nowIso,
                });
              }
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
            if (success && storeName) {
              await idbDelete(storeName, mut.entityId);
            }
          } else {
            const localObjection = currentContextState?.objections?.find((o) => o.id === mut.entityId);
            const idbObjection = storeName ? await idbGet<ObjectionEntity>(storeName, mut.entityId) : null;
            const objectionData: ObjectionEntity | undefined = localObjection || idbObjection || mut.payload;
            if (objectionData && !(objectionData as any).deleted_at) {
              const mergedObjection = {
                ...objectionData,
                ...(typeof mut.payload === 'object' && mut.payload ? mut.payload : {}),
                id: objectionData.id || mut.entityId,
              };
              const res = await upsertObjectionToSupabase(mergedObjection, userId);
              success = res.success;
              errorMsg = res.error;
              if (success && storeName) {
                await idbPut(storeName, {
                  ...mergedObjection,
                  sync_status: 'synced',
                  synced_at: nowIso,
                });
              }
            } else {
              success = true;
            }
          }
          break;
        }

        case 'qualification': {
          if (mut.entityId === 'qualification_questions') {
            const questions = mut.payload || currentContextState?.qualificationQuestions || [];
            const res = await saveQualificationQuestionsToSupabase(questions, userId);
            success = res.success;
            errorMsg = res.error;
          } else if (mut.entityId === 'qualification_answers') {
            const answers = mut.payload || currentContextState?.qualificationAnswers || {};
            const res = await saveQualificationAnswersToSupabase(answers, userId);
            success = res.success;
            errorMsg = res.error;
          } else {
            success = true;
          }
          break;
        }

        default:
          success = true;
      }
    } catch (e: any) {
      success = false;
      errorMsg = e.message || 'Erro de rede ao sincronizar mutação.';
    }

    if (success) {
      result.succeeded++;
      dequeueOfflineMutation(mut.id);
    } else {
      result.failed++;
      result.failedCount++;
      const errText = errorMsg || 'Falha ao sincronizar com Supabase.';
      result.errors.push(`[${mut.entityType}:${mut.operation}] ${errText}`);
      const updatedMut = recordMutationFailure(mut.id, errText);
      if (updatedMut) {
        if (updatedMut.status === 'sync_error') {
          result.exhaustedCount++;
        } else if (updatedMut.nextRetryAt) {
          const delay = Math.max(500, updatedMut.nextRetryAt - Date.now());
          if (result.nextRetryDelayMs === null || delay < result.nextRetryDelayMs) {
            result.nextRetryDelayMs = delay;
          }
        }
      }
    }
  }

  return result;
}

/**
 * Puxa todos os dados mais recentes do Supabase (nunca bloqueia quando offline)
 */
export async function pullAllRemoteData(): Promise<RemotePullResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      companies: [],
      actions: [],
      scripts: [],
      funnels: [],
      services: [],
      objections: [],
      hasRemoteData: false,
    };
  }

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
