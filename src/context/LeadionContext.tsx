import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { Lead, LeadPipelineStatus, ChannelType, LeadTimelineEvent } from '../core/types/lead';
import { DesktopNavId } from '../core/types/navigation';
import { Company, CompanyTimelineEvent, CompanyActivity, CompanyResponsible } from '../core/types/company';
import { Objection, ProspectScript, ServiceOffering, ScriptEntity, WhatsAppDispatchStatus } from '../core/types/script';
import { ObjectionEntity, ObjectionSequence, ObjectionStepResponse } from '../core/types/objection';
import { INITIAL_OBJECTIONS_LIBRARY } from '../core/data/initialObjectionsLibrary';
import { 
  ServiceEntity, 
  ServiceCountryPrice, 
  ServicePriceSnapshot, 
  getServicePriceForCompany, 
  createServicePriceSnapshot,
  formatServiceCurrency 
} from '../core/types/service';
import { 
  FunnelEntity, 
  FunnelStage, 
  StageTransitionPayload 
} from '../core/types/funnel';
import { duplicateFunnelWithCleanGraph } from '../core/funnel/flowGraphEngine';
import { INITIAL_LEADS, INITIAL_COMPANIES, INITIAL_OBJECTIONS, INITIAL_SERVICES, INITIAL_SCRIPTS } from '../core/data/initialData';
import { INITIAL_SCRIPTS_DATA } from '../core/data/initialScriptsData';
import { INITIAL_SERVICES_DATA } from '../core/data/initialServices';
import { INITIAL_FUNNELS_DATA } from '../core/data/initialFunnels';
import { ProspectAction, PlanningFormData, ActionOutcomeDetails } from '../core/types/prospectAction';
import { INITIAL_ACTIONS } from '../core/data/initialActions';
import { PriorityWeights, DEFAULT_PRIORITY_WEIGHTS, loadSavedPriorityWeights, savePriorityWeights, sortActionsByPriority } from '../core/priority/priorityEngine';
import { QualificationQuestion, CompanyScoreResult } from '../core/types/qualification';
import { INITIAL_QUALIFICATION_QUESTIONS } from '../core/data/initialQualificationData';
import { calculateCompanyQualification } from '../core/qualification/qualificationEngine';
import { useToast } from './ToastContext';
import { 
  SyncStatus, 
  OfflineMutation, 
  SyncConflict, 
  loadPendingQueue, 
  savePendingQueue, 
  enqueueOfflineMutation, 
  dequeueOfflineMutation, 
  clearPendingQueue, 
  loadSyncConflicts, 
  saveSyncConflicts,
  recordSyncConflict, 
  resolveSyncConflict, 
  detectFieldConflicts,
  getLastSyncTimestamp, 
  setLastSyncTimestamp, 
  getLastSyncError, 
  setLastSyncError, 
  getOrCreateDeviceId, 
  getDeviceName,
  generateSecureUUID
} from '../core/storage/offlineEngine';
import { UserAccount, WorkspaceProfile } from '../core/types/account';
import { idbGet, idbPut, idbBulkPut, idbDelete, idbClear, idbGetAll, STORES } from '../core/storage/indexedDB';
import { connectivityEngine } from '../core/storage/connectivityEngine';
import { 
  getSupabaseClient,
  getSupabaseCredentials,
  runSupabaseDiagnostics,
  testSupabaseConnection, 
  uploadCloudBackup, 
  listCloudBackups, 
  downloadCloudBackup 
} from '../core/supabase/supabaseClient';
import { 
  LeadionBackupPayload, 
  saveLocalBackupSnapshot 
} from '../core/backup/backupEngine';
import { 
  getCurrentUser, 
  getCurrentSession, 
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser, 
  subscribeToAuthChanges,
  fetchCompaniesFromSupabase, 
  fetchCompanyByIdFromSupabase,
  createCompanyInSupabase,
  upsertCompanyToSupabase, 
  deleteCompanyFromSupabase,
  fetchActionsFromSupabase, 
  upsertActionToSupabase, 
  deleteActionFromSupabase,
  fetchScriptsFromSupabase, 
  upsertScriptToSupabase, 
  deleteScriptFromSupabase,
  fetchFunnelsFromSupabase, 
  upsertFunnelToSupabase, 
  deleteFunnelFromSupabase,
  fetchServicesFromSupabase, 
  upsertServiceToSupabase, 
  deleteServiceFromSupabase,
  fetchObjectionsFromSupabase, 
  upsertObjectionToSupabase, 
  deleteObjectionFromSupabase,
  fetchQualificationQuestionsFromSupabase, 
  saveQualificationQuestionsToSupabase,
  fetchQualificationAnswersFromSupabase,
  saveQualificationAnswersToSupabase,
  processOfflineMutations, 
  pullAllRemoteData 
} from '../services';
import type { User, Session } from '@supabase/supabase-js';
import { 
  isDemoCompany, 
  isDemoAction, 
  isDemoLead, 
  cleanLocalStorageDemoData, 
  purgeDemoDataFromSupabase 
} from '../core/utils/demoCleaners';

export type ProspectFilter = 'all' | 'due_today' | 'overdue' | 'high_score' | 'first_touch';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedField?: string;
  matchedValue?: string;
  existingCompany?: Company;
}

interface LeadionContextType {
  activeNav: DesktopNavId;
  setActiveNav: (nav: DesktopNavId) => void;
  
  // Leads & Prospecting Queue
  leads: Lead[];
  selectedLead: Lead | null;
  setSelectedLead: (lead: Lead | null) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  
  // Filters & Search
  prospectFilter: ProspectFilter;
  setProspectFilter: (filter: ProspectFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Actions
  executeLeadAction: (
    leadId: string, 
    channel: ChannelType, 
    actionResult: 'connected' | 'no_answer' | 'replied_positive' | 'objection' | 'rejected', 
    note?: string
  ) => void;
  updateLeadStatus: (leadId: string, status: LeadPipelineStatus) => void;
  snoozeLead: (leadId: string, minutes: number) => void;
  addNewLead: (leadData: Partial<Lead>) => void;
  
  // Data catalogs & Companies Management
  companies: Company[];
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  isNewCompanyModalOpen: boolean;
  setIsNewCompanyModalOpen: (open: boolean) => void;
  editingCompany: Company | null;
  setEditingCompany: (company: Company | null) => void;
  addCompany: (companyData: Partial<Company>) => Promise<{ success: boolean; error?: string; company?: Company }>;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  archiveCompany: (id: string) => void;
  unarchiveCompany: (id: string) => void;
  duplicateCompany: (id: string) => Company | null;
  addCompanyTimelineEvent: (companyId: string, event: Omit<CompanyTimelineEvent, 'id' | 'timestamp'>) => void;
  addCompanyActivity: (companyId: string, activity: Omit<CompanyActivity, 'id' | 'createdAt'>) => void;
  toggleCompanyActivity: (companyId: string, activityId: string) => void;
  checkCompanyDuplicate: (name: string, website?: string, email?: string, phone?: string, excludeId?: string) => DuplicateCheckResult;

  objections: Objection[];
  services: ServiceEntity[];
  scripts: ProspectScript[];

  // Construtor de Scripts & Sequências
  scriptsEntities: ScriptEntity[];
  createScript: (script: Omit<ScriptEntity, 'id' | 'createdAt' | 'updatedAt'>) => ScriptEntity;
  updateScript: (id: string, updates: Partial<ScriptEntity>) => void;
  duplicateScript: (id: string) => ScriptEntity | null;
  deleteScript: (id: string) => boolean;
  recordWhatsAppDispatch: (companyId: string, scriptId: string, status: WhatsAppDispatchStatus, notes?: string) => void;
  isScriptModalOpen: boolean;
  setIsScriptModalOpen: (open: boolean) => void;
  editingScript: ScriptEntity | null;
  setEditingScript: (script: ScriptEntity | null) => void;
  isWhatsAppModalOpen: boolean;
  setIsWhatsAppModalOpen: (open: boolean) => void;
  whatsAppModalData: {
    company: Company;
    script?: ScriptEntity | null;
    customMessage?: string;
    actionId?: string;
  } | null;
  openWhatsAppForCompany: (company: Company, script?: ScriptEntity | null, customMessage?: string, actionId?: string) => void;
  isObjectionModalOpen: boolean;
  setIsObjectionModalOpen: (open: boolean) => void;
  objectionModalData: {
    companyName?: string;
    contactName?: string;
    onSelectResponseScript?: (scriptText: string) => void;
  } | null;
  openObjectionModal: (companyName?: string, contactName?: string, onSelectResponseScript?: (scriptText: string) => void) => void;

  // Biblioteca de Objeções & Mini-Funis Estruturados
  objectionsEntities: ObjectionEntity[];
  addObjection: (objection: Omit<ObjectionEntity, 'id' | 'createdAt' | 'updatedAt'>) => ObjectionEntity;
  updateObjection: (id: string, updates: Partial<ObjectionEntity>) => void;
  duplicateObjection: (id: string) => ObjectionEntity | null;
  deleteObjection: (id: string) => boolean;
  addSequenceToObjection: (objectionId: string, seq: Omit<ObjectionSequence, 'id'>) => ObjectionSequence | null;
  updateSequenceInObjection: (objectionId: string, seqId: string, updates: Partial<ObjectionSequence>) => void;
  deleteSequenceFromObjection: (objectionId: string, seqId: string) => boolean;
  addStepToObjectionSequence: (objectionId: string, seqId: string, step: Omit<ObjectionStepResponse, 'id'>) => ObjectionStepResponse | null;
  updateStepInObjectionSequence: (objectionId: string, seqId: string, stepId: string, updates: Partial<ObjectionStepResponse>) => void;
  deleteStepFromObjectionSequence: (objectionId: string, seqId: string, stepId: string) => boolean;
  recordObjectionHandled: (
    companyId: string,
    objectionName: string,
    sequenceName: string,
    stepName: string,
    stepType: string,
    scriptContent: string,
    actionId?: string,
    notes?: string
  ) => void;
  isObjectionBuilderModalOpen: boolean;
  setIsObjectionBuilderModalOpen: (open: boolean) => void;
  editingObjectionEntity: ObjectionEntity | null;
  setEditingObjectionEntity: (obj: ObjectionEntity | null) => void;
  isObjectionSequenceModalOpen: boolean;
  setIsObjectionSequenceModalOpen: (open: boolean) => void;
  editingObjectionSequence: { objectionId: string; sequence?: ObjectionSequence | null } | null;
  setEditingObjectionSequence: (data: { objectionId: string; sequence?: ObjectionSequence | null } | null) => void;
  isObjectionDispatchModalOpen: boolean;
  setIsObjectionDispatchModalOpen: (open: boolean) => void;
  objectionDispatchData: {
    company?: Company | null;
    actionId?: string;
    preselectedObjectionId?: string;
  } | null;
  openObjectionDispatchModal: (company?: Company | null, actionId?: string, preselectedObjectionId?: string) => void;

  // Módulo de Serviços & Precificação Multipaís
  addService: (service: Omit<ServiceEntity, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => ServiceEntity;
  updateService: (id: string, serviceData: Partial<ServiceEntity>) => void;
  duplicateService: (id: string) => ServiceEntity | null;
  archiveService: (id: string) => void;
  unarchiveService: (id: string) => void;
  deleteService: (id: string) => void;
  getServicePriceForCompanyCountry: (serviceId: string, country?: string) => ServiceCountryPrice | null;
  isServiceModalOpen: boolean;
  setIsServiceModalOpen: (open: boolean) => void;
  editingService: ServiceEntity | null;
  setEditingService: (service: ServiceEntity | null) => void;
  selectedServiceDetail: ServiceEntity | null;
  setSelectedServiceDetail: (service: ServiceEntity | null) => void;

  // Módulo de Funis & Etapas
  funnels: FunnelEntity[];
  activeFunnelId: string;
  setActiveFunnelId: (id: string) => void;
  activeFunnel: FunnelEntity | undefined;

  // Motor de Qualificação & Scores (0 a 100)
  qualificationQuestions: QualificationQuestion[];
  addQualificationQuestion: (question: QualificationQuestion) => void;
  updateQualificationQuestion: (question: QualificationQuestion) => void;
  deleteQualificationQuestion: (id: string) => void;
  qualificationAnswers: Record<string, Record<string, string>>;
  saveCompanyQualificationAnswers: (companyId: string, answers: Record<string, string>) => void;
  getCompanyScoreResult: (companyId: string) => CompanyScoreResult | null;
  addFunnel: (funnelData: Omit<FunnelEntity, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => FunnelEntity;
  updateFunnel: (id: string, updates: Partial<FunnelEntity>) => void;
  duplicateFunnel: (id: string) => FunnelEntity | null;
  archiveFunnel: (id: string) => void;
  unarchiveFunnel: (id: string) => void;
  deleteFunnel: (id: string) => boolean;
  addFunnelStage: (funnelId: string, stage: Omit<FunnelStage, 'id' | 'order'>) => FunnelStage;
  updateFunnelStage: (funnelId: string, stageId: string, updates: Partial<FunnelStage>) => void;
  removeFunnelStage: (funnelId: string, stageId: string) => boolean;
  reorderFunnelStages: (funnelId: string, orderedStageIds: string[]) => void;
  transitionCompanyStage: (payload: StageTransitionPayload) => void;

  // Modais de Funil
  isFunnelModalOpen: boolean;
  setIsFunnelModalOpen: (open: boolean) => void;
  editingFunnel: FunnelEntity | null;
  setEditingFunnel: (funnel: FunnelEntity | null) => void;
  isFunnelStagesModalOpen: boolean;
  setIsFunnelStagesModalOpen: (open: boolean) => void;
  activeFunnelForStages: FunnelEntity | null;
  setActiveFunnelForStages: (funnel: FunnelEntity | null) => void;

  // User Profile & Greeting
  userName: string;
  setUserName: (name: string) => void;
  greeting: string;

  // Prospect Actions Execution Queue
  actions: ProspectAction[];
  planAction: (data: PlanningFormData) => void;
  completeAction: (actionId: string, notes?: string) => void;
  cancelAction: (actionId: string, reason?: string) => void;
  reopenAction: (actionId: string) => void;
  openWhatsAppAction: (actionId: string) => void;

  // Outcome Modal & Automated Next Action Engine
  isOutcomeModalOpen: boolean;
  setIsOutcomeModalOpen: (open: boolean) => void;
  outcomeModalAction: ProspectAction | null;
  setOutcomeModalAction: (action: ProspectAction | null) => void;
  openActionOutcomeModal: (action: ProspectAction) => void;
  closeActionOutcomeModal: () => void;
  resolveActionWithOutcome: (actionId: string, details: ActionOutcomeDetails) => void;

  // Priority Engine configuration
  priorityWeights: PriorityWeights;
  updatePriorityWeights: (weights: PriorityWeights) => void;

  // Modals & Drawers
  isPlanningModalOpen: boolean;
  setIsPlanningModalOpen: (open: boolean) => void;
  planningPreselectedCompany: Company | null;
  setPlanningPreselectedCompany: (company: Company | null) => void;
  isPriorityModalOpen: boolean;
  setIsPriorityModalOpen: (open: boolean) => void;
  quickViewCompany: Company | null;
  setQuickViewCompany: (company: Company | null) => void;
  companyNeedingNextAction: Company | null;
  setCompanyNeedingNextAction: (company: Company | null) => void;

  // Compliance & Unplanned Companies
  unplannedCompanies: Company[];
  actionCounters: {
    atrasadas: number;
    hoje: number;
    proxima: number;
    concluidas: number;
    canceladas: number;
    semProximaAcao: number;
  };

  // Modals
  isNewLeadModalOpen: boolean;
  setIsNewLeadModalOpen: (open: boolean) => void;
  
  // Queue stats specifically for Hoje
  todayMetrics: {
    totalDueToday: number;
    completedToday: number;
    overdueCount: number;
    highScoreCount: number;
  };

  // Offline-First & Supabase Sync Engine
  syncStatus: SyncStatus;
  pendingMutations: OfflineMutation[];
  syncConflicts: SyncConflict[];
  lastSyncTime: string | null;
  lastSyncError: string | null;
  triggerCloudSync: () => Promise<void>;
  isSyncCenterModalOpen: boolean;
  setIsSyncCenterModalOpen: (open: boolean) => void;
  isDataManagementModalOpen: boolean;
  setIsDataManagementModalOpen: (open: boolean) => void;
  dataManagementDefaultTab: 'export' | 'import' | 'backup';
  openDataManagementModal: (tab?: 'export' | 'import' | 'backup') => void;
  isConflictModalOpen: boolean;
  setIsConflictModalOpen: (open: boolean) => void;
  activeConflict: SyncConflict | null;
  openConflictResolutionModal: (conflict: SyncConflict) => void;
  resolveActiveConflict: (
    conflictId: string, 
    strategy: 'keep_local' | 'keep_remote' | 'custom_merge', 
    customData?: Record<string, any>
  ) => void;
  restoreEntireState: (payload: LeadionBackupPayload, mode: 'merge' | 'replace') => void;
  importCompaniesList: (imported: Partial<Company>[], mode: 'merge' | 'create_only') => void;
  simulateRemoteConflict: () => void;

  // User Profile & Account (Local / Online Dual Engine)
  userAccount: UserAccount | null;
  workspaceProfile: WorkspaceProfile | null;
  createLocalAccount: (data: {
    fullName: string;
    companyName: string;
    sector?: string;
    country?: string;
    state?: string;
    region?: string;
    phone?: string;
    whatsapp?: string;
    localCredential?: string;
  }) => Promise<UserAccount>;
  createOnlineAccount: (data: {
    fullName: string;
    email: string;
    password: string;
    companyName: string;
    sector?: string;
    country?: string;
    state?: string;
    region?: string;
    phone?: string;
    whatsapp?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  linkLocalAccountToCloud: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logoutAccount: () => Promise<void>;
  isLinkModalOpen: boolean;
  setIsLinkModalOpen: (open: boolean) => void;
  openLinkModal: () => void;

  // Supabase Auth & Session
  currentUser: User | null;
  currentSession: Session | null;
  authLoading: boolean;
  signIn: (email: string, pass: string, options?: { mergeLocalData?: boolean }) => Promise<{ success: boolean; user?: User | null; error?: string }>;
  signUp: (email: string, pass: string, name?: string) => Promise<{ success: boolean; user?: User | null; error?: string; requiresEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  openAuthModal: () => void;
}

const LeadionContext = createContext<LeadionContextType | undefined>(undefined);

export function LeadionProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [activeNav, setActiveNav] = useState<DesktopNavId>('today');

  // Local & Online Account State
  const [userAccount, setUserAccount] = useState<UserAccount | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('leadion_user_account');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return null;
  });

  const [workspaceProfile, setWorkspaceProfile] = useState<WorkspaceProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('leadion_workspace_profile');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return null;
  });

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const openLinkModal = useCallback(() => setIsLinkModalOpen(true), []);

  // User Profile Name
  const [userName, setUserNameState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedAcc = localStorage.getItem('leadion_user_account');
      if (savedAcc) {
        try {
          const parsed = JSON.parse(savedAcc);
          if (parsed.fullName) return parsed.fullName;
        } catch {}
      }
      return localStorage.getItem('leadion-username') || 'Manuel';
    }
    return 'Manuel';
  });

  const setUserName = useCallback((name: string) => {
    setUserNameState(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem('leadion-username', name);
    }
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return `Bom dia, ${userName}`;
    if (hour < 18) return `Boa tarde, ${userName}`;
    return `Boa noite, ${userName}`;
  }, [userName]);

  // Supabase Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const openAuthModal = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  const signIn = useCallback(async (email: string, pass: string, options?: { mergeLocalData?: boolean }) => {
    const res = await signInWithEmail(email, pass);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      const fullName = res.user.user_metadata?.full_name || email.split('@')[0];
      setUserName(fullName);

      const remoteUserId = res.user.id;
      const now = new Date().toISOString();

      const onlineAccount: UserAccount = {
        userId: remoteUserId,
        workspaceId: 'wsp-' + generateSecureUUID(),
        accountType: 'online',
        fullName,
        email,
        companyName: res.user.user_metadata?.company_name || 'Meu Workspace',
        deviceId: getOrCreateDeviceId(),
        createdAt: now,
        updatedAt: now,
        syncedAt: now,
      };

      setUserAccount(onlineAccount);
      if (typeof window !== 'undefined') {
        localStorage.setItem('leadion_user_account', JSON.stringify(onlineAccount));
      }
      idbPut(STORES.ACCOUNTS, onlineAccount).catch(() => {});
    }
    return res;
  }, [setUserName]);

  const signUp = useCallback(async (email: string, pass: string, name?: string) => {
    const res = await signUpWithEmail(email, pass, name);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      if (name) setUserName(name);
    }
    return res;
  }, [setUserName]);

  const signOut = useCallback(async () => {
    await signOutUser();
    setCurrentUser(null);
    setCurrentSession(null);
  }, []);

  const [leads, setLeads] = useState<Lead[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('leadion-leads');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback to initial
        }
      }
    }
    return INITIAL_LEADS.filter((l) => !isDemoLead(l));
  });

  // Helper to ensure company with existing funnel has explicit stage attributes
  const ensureCompanyFunnels = (rawCompanies: Company[]): Company[] => {
    const stageMapping: Record<string, { id: string; name: string }> = {
      prospeccao: { id: 'stg-primeira-abordagem', name: 'Primeira abordagem' },
      contato_feito: { id: 'stg-conversando', name: 'Conversando' },
      qualificacao: { id: 'stg-qualificacao', name: 'Qualificação' },
      reuniao_agendada: { id: 'stg-necessidade-identificada', name: 'Necessidade identificada' },
      proposta: { id: 'stg-proposta', name: 'Proposta' },
      negociacao: { id: 'stg-negociacao', name: 'Negociação' },
      cliente: { id: 'stg-ganho', name: 'Ganho' },
      desqualificado: { id: 'stg-perdido', name: 'Perdido' },
    };

    return rawCompanies.map((c) => {
      // Regra fundamental: Empresa recém-registrada NÃO deve receber funil automaticamente!
      if (!c.funnelId) {
        return c;
      }
      const mapped = stageMapping[c.funnelStage] || { id: 'stg-novo', name: 'Novo' };
      return {
        ...c,
        funnelStageId: c.funnelStageId || mapped.id,
        funnelStageName: c.funnelStageName || mapped.name,
      };
    });
  };

  const [companies, setCompanies] = useState<Company[]>(() => {
    if (typeof window !== 'undefined') {
      cleanLocalStorageDemoData();
      const saved = localStorage.getItem('leadion-companies');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const clean = parsed.filter((c) => !isDemoCompany(c));
            if (clean.length !== parsed.length) {
              localStorage.setItem('leadion-companies', JSON.stringify(clean));
            }
            return ensureCompanyFunnels(clean);
          }
        } catch {
          // fallback to clean
        }
      }
    }
    return [];
  });

  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(() => {
    if (typeof window !== 'undefined') {
      const savedSelectedId = localStorage.getItem('leadion-selected-company-id');
      const saved = localStorage.getItem('leadion-companies');
      if (savedSelectedId && saved) {
        try {
          const parsed: Company[] = JSON.parse(saved);
          const found = parsed.find((c) => c.id === savedSelectedId && !isDemoCompany(c));
          if (found) return found;
          localStorage.removeItem('leadion-selected-company-id');
        } catch {}
      }
    }
    return null;
  });
  const [isNewCompanyModalOpen, setIsNewCompanyModalOpen] = useState<boolean>(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const [objections] = useState<Objection[]>(INITIAL_OBJECTIONS);
  const [services, setServices] = useState<ServiceEntity[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('leadion-services-v2');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_SERVICES_DATA;
  });
  const [scripts] = useState<ProspectScript[]>(INITIAL_SCRIPTS);

  // MÓDULO DE SCRIPTS & SEQUÊNCIAS (CONSTRUTOR DE SCRIPTS)
  const [scriptsEntities, setScriptsEntities] = useState<ScriptEntity[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('leadion-scripts-v2');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_SCRIPTS_DATA;
  });

  const saveScriptsEntities = useCallback((newScripts: ScriptEntity[]) => {
    setScriptsEntities(newScripts);
    if (typeof window !== 'undefined') {
      localStorage.setItem('leadion-scripts-v2', JSON.stringify(newScripts));
    }
  }, []);

  // ==========================================
  // MOTOR DE QUALIFICAÇÃO & SCORES (0 A 100)
  // ==========================================
  const [qualificationQuestions, setQualificationQuestions] = useState<QualificationQuestion[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('leadion-qualification-questions-v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return INITIAL_QUALIFICATION_QUESTIONS;
  });

  const saveQualificationQuestions = useCallback((questions: QualificationQuestion[]) => {
    setQualificationQuestions(questions);
    if (typeof window !== 'undefined') {
      localStorage.setItem('leadion-qualification-questions-v1', JSON.stringify(questions));
    }
  }, []);

  const [qualificationAnswers, setQualificationAnswers] = useState<Record<string, Record<string, string>>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('leadion-qualification-answers-v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return {};
  });

  const saveCompanyQualificationAnswers = useCallback((companyId: string, answers: Record<string, string>) => {
    setQualificationAnswers((prev) => {
      const updated = {
        ...prev,
        [companyId]: answers,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('leadion-qualification-answers-v1', JSON.stringify(updated));
      }
      // Persistência assíncrona no Supabase
      saveQualificationAnswersToSupabase(updated, currentUser?.id).catch((err) => {
        console.warn('Erro ao salvar respostas de qualificação no Supabase:', err);
      });
      return updated;
    });
    showToast({
      type: 'success',
      title: 'Qualificação Salva',
      message: 'Respostas salvas e scores recalculados com sucesso.',
    });
  }, [showToast, currentUser]);

  const addQualificationQuestion = useCallback((q: QualificationQuestion) => {
    setQualificationQuestions((prev) => {
      const updated = [...prev, q];
      if (typeof window !== 'undefined') {
        localStorage.setItem('leadion-qualification-questions-v1', JSON.stringify(updated));
      }
      saveQualificationQuestionsToSupabase(updated, currentUser?.id).catch((err) => {
        console.warn('Erro ao salvar perguntas de qualificação no Supabase:', err);
      });
      return updated;
    });
    showToast({
      type: 'success',
      title: 'Pergunta Criada',
      message: 'Nova pergunta adicionada ao motor de qualificação.',
    });
  }, [showToast, currentUser]);

  const updateQualificationQuestion = useCallback((q: QualificationQuestion) => {
    setQualificationQuestions((prev) => {
      const updated = prev.map((item) => (item.id === q.id ? q : item));
      if (typeof window !== 'undefined') {
        localStorage.setItem('leadion-qualification-questions-v1', JSON.stringify(updated));
      }
      saveQualificationQuestionsToSupabase(updated, currentUser?.id).catch((err) => {
        console.warn('Erro ao atualizar perguntas de qualificação no Supabase:', err);
      });
      return updated;
    });
    showToast({
      type: 'success',
      title: 'Pergunta Atualizada',
      message: 'Critérios e pesos recalculados.',
    });
  }, [showToast, currentUser]);

  const deleteQualificationQuestion = useCallback((id: string) => {
    setQualificationQuestions((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('leadion-qualification-questions-v1', JSON.stringify(updated));
      }
      saveQualificationQuestionsToSupabase(updated, currentUser?.id).catch((err) => {
        console.warn('Erro ao remover pergunta de qualificação no Supabase:', err);
      });
      return updated;
    });
    showToast({
      type: 'info',
      title: 'Pergunta Removida',
      message: 'Pergunta excluída do motor de qualificação.',
    });
  }, [showToast, currentUser]);

  const getCompanyScoreResult = useCallback((companyId: string): CompanyScoreResult | null => {
    const comp = companies.find((c) => c.id === companyId);
    if (!comp) return null;
    const answers = qualificationAnswers[companyId] || {};
    return calculateCompanyQualification(comp, qualificationQuestions, services, answers);
  }, [companies, qualificationQuestions, services, qualificationAnswers]);

  // Modais de Scripts, WhatsApp e Objeções
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<ScriptEntity | null>(null);

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    company: Company;
    script?: ScriptEntity | null;
    customMessage?: string;
    actionId?: string;
  } | null>(null);

  const [isObjectionModalOpen, setIsObjectionModalOpen] = useState(false);
  const [objectionModalData, setObjectionModalData] = useState<{
    companyName?: string;
    contactName?: string;
    onSelectResponseScript?: (scriptText: string) => void;
  } | null>(null);

  // ==========================================
  // ESTADOS DA BIBLIOTECA DE OBJEÇÕES & MINI-FUNIS
  // ==========================================
  const [objectionsEntities, setObjectionsEntities] = useState<ObjectionEntity[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('leadion_objections_library_v1');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {
          // fallback to initial library
        }
      }
    }
    return INITIAL_OBJECTIONS_LIBRARY;
  });

  const saveObjectionsEntities = useCallback((newEntities: ObjectionEntity[]) => {
    setObjectionsEntities(newEntities);
    if (typeof window !== 'undefined') {
      localStorage.setItem('leadion_objections_library_v1', JSON.stringify(newEntities));
    }
  }, []);

  const [isObjectionBuilderModalOpen, setIsObjectionBuilderModalOpen] = useState(false);
  const [editingObjectionEntity, setEditingObjectionEntity] = useState<ObjectionEntity | null>(null);

  const [isObjectionSequenceModalOpen, setIsObjectionSequenceModalOpen] = useState(false);
  const [editingObjectionSequence, setEditingObjectionSequence] = useState<{ objectionId: string; sequence?: ObjectionSequence | null } | null>(null);

  const [isObjectionDispatchModalOpen, setIsObjectionDispatchModalOpen] = useState(false);
  const [objectionDispatchData, setObjectionDispatchData] = useState<{
    company?: Company | null;
    actionId?: string;
    preselectedObjectionId?: string;
  } | null>(null);

  const openObjectionDispatchModal = useCallback((company?: Company | null, actionId?: string, preselectedObjectionId?: string) => {
    setObjectionDispatchData({
      company: company || null,
      actionId,
      preselectedObjectionId,
    });
    setIsObjectionDispatchModalOpen(true);
  }, []);

  const openObjectionModal = useCallback((companyName?: string, contactName?: string, onSelectResponseScript?: (scriptText: string) => void) => {
    // Procura se existe empresa na base para abrir a biblioteca interativa
    const matched = companies.find(
      (c) => c.name.toLowerCase() === (companyName || '').toLowerCase()
    );
    if (matched) {
      openObjectionDispatchModal(matched);
      return;
    }
    setObjectionModalData({ companyName, contactName, onSelectResponseScript });
    setIsObjectionModalOpen(true);
  }, [companies, openObjectionDispatchModal]);

  // CRUD de Objeções
  const addObjection = useCallback((data: Omit<ObjectionEntity, 'id' | 'createdAt' | 'updatedAt'>): ObjectionEntity => {
    const nowIso = new Date().toISOString();
    const newObj: ObjectionEntity = {
      ...data,
      id: `obj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    const updated = [newObj, ...objectionsEntities];
    saveObjectionsEntities(updated);

    // Persistência real no Supabase
    upsertObjectionToSupabase(newObj, currentUser?.id)
      .then((res) => {
        if (!res.success) {
          enqueueOfflineMutation('objection', 'CREATE', newObj.id, newObj);
          setPendingMutations(loadPendingQueue());
        }
      })
      .catch(() => {
        enqueueOfflineMutation('objection', 'CREATE', newObj.id, newObj);
        setPendingMutations(loadPendingQueue());
      });

    return newObj;
  }, [objectionsEntities, saveObjectionsEntities, currentUser]);

  const updateObjection = useCallback((id: string, updates: Partial<ObjectionEntity>) => {
    let targetUpdated: ObjectionEntity | null = null;
    const updated = objectionsEntities.map((obj) => {
      if (obj.id !== id) return obj;
      const merged = {
        ...obj,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      targetUpdated = merged;
      return merged;
    });
    saveObjectionsEntities(updated);

    if (targetUpdated) {
      upsertObjectionToSupabase(targetUpdated, currentUser?.id)
        .then((res) => {
          if (!res.success) {
            enqueueOfflineMutation('objection', 'UPDATE', id, updates);
            setPendingMutations(loadPendingQueue());
          }
        })
        .catch(() => {
          enqueueOfflineMutation('objection', 'UPDATE', id, updates);
          setPendingMutations(loadPendingQueue());
        });
    }
  }, [objectionsEntities, saveObjectionsEntities, currentUser]);

  const duplicateObjection = useCallback((id: string): ObjectionEntity | null => {
    const target = objectionsEntities.find((o) => o.id === id);
    if (!target) return null;
    const nowIso = new Date().toISOString();
    const copy: ObjectionEntity = {
      ...JSON.parse(JSON.stringify(target)),
      id: `obj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${target.name} (Cópia)`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    const updated = [copy, ...objectionsEntities];
    saveObjectionsEntities(updated);

    upsertObjectionToSupabase(copy, currentUser?.id).catch(() => {
      enqueueOfflineMutation('objection', 'CREATE', copy.id, copy);
      setPendingMutations(loadPendingQueue());
    });

    return copy;
  }, [objectionsEntities, saveObjectionsEntities, currentUser]);

  const deleteObjection = useCallback((id: string): boolean => {
    const updated = objectionsEntities.filter((o) => o.id !== id);
    saveObjectionsEntities(updated);

    deleteObjectionFromSupabase(id)
      .then((res) => {
        if (!res.success) {
          enqueueOfflineMutation('objection', 'DELETE', id, null);
          setPendingMutations(loadPendingQueue());
        }
      })
      .catch(() => {
        enqueueOfflineMutation('objection', 'DELETE', id, null);
        setPendingMutations(loadPendingQueue());
      });

    return true;
  }, [objectionsEntities, saveObjectionsEntities]);

  // CRUD de Sequências / Mini-Funis em Objeções
  const addSequenceToObjection = useCallback((objectionId: string, seq: Omit<ObjectionSequence, 'id'>): ObjectionSequence | null => {
    const obj = objectionsEntities.find((o) => o.id === objectionId);
    if (!obj) return null;

    const newSeq: ObjectionSequence = {
      ...seq,
      id: `seq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    const updated = objectionsEntities.map((o) => {
      if (o.id !== objectionId) return o;
      return {
        ...o,
        sequences: [...o.sequences, newSeq],
        updatedAt: new Date().toISOString(),
      };
    });

    saveObjectionsEntities(updated);
    return newSeq;
  }, [objectionsEntities, saveObjectionsEntities]);

  const updateSequenceInObjection = useCallback((objectionId: string, seqId: string, updates: Partial<ObjectionSequence>) => {
    const updated = objectionsEntities.map((o) => {
      if (o.id !== objectionId) return o;
      return {
        ...o,
        sequences: o.sequences.map((s) => (s.id === seqId ? { ...s, ...updates } : s)),
        updatedAt: new Date().toISOString(),
      };
    });
    saveObjectionsEntities(updated);
  }, [objectionsEntities, saveObjectionsEntities]);

  const deleteSequenceFromObjection = useCallback((objectionId: string, seqId: string): boolean => {
    const updated = objectionsEntities.map((o) => {
      if (o.id !== objectionId) return o;
      return {
        ...o,
        sequences: o.sequences.filter((s) => s.id !== seqId),
        updatedAt: new Date().toISOString(),
      };
    });
    saveObjectionsEntities(updated);
    return true;
  }, [objectionsEntities, saveObjectionsEntities]);

  // CRUD de Etapas de Resposta em Sequência
  const addStepToObjectionSequence = useCallback((objectionId: string, seqId: string, step: Omit<ObjectionStepResponse, 'id'>): ObjectionStepResponse | null => {
    let createdStep: ObjectionStepResponse | null = null;
    const updated = objectionsEntities.map((o) => {
      if (o.id !== objectionId) return o;
      return {
        ...o,
        sequences: o.sequences.map((seq) => {
          if (seq.id !== seqId) return seq;
          const newStep: ObjectionStepResponse = {
            ...step,
            id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          };
          createdStep = newStep;
          return {
            ...seq,
            steps: [...seq.steps, newStep],
          };
        }),
        updatedAt: new Date().toISOString(),
      };
    });
    saveObjectionsEntities(updated);
    return createdStep;
  }, [objectionsEntities, saveObjectionsEntities]);

  const updateStepInObjectionSequence = useCallback((objectionId: string, seqId: string, stepId: string, updates: Partial<ObjectionStepResponse>) => {
    const updated = objectionsEntities.map((o) => {
      if (o.id !== objectionId) return o;
      return {
        ...o,
        sequences: o.sequences.map((seq) => {
          if (seq.id !== seqId) return seq;
          return {
            ...seq,
            steps: seq.steps.map((st) => (st.id === stepId ? { ...st, ...updates } : st)),
          };
        }),
        updatedAt: new Date().toISOString(),
      };
    });
    saveObjectionsEntities(updated);
  }, [objectionsEntities, saveObjectionsEntities]);

  const deleteStepFromObjectionSequence = useCallback((objectionId: string, seqId: string, stepId: string): boolean => {
    const updated = objectionsEntities.map((o) => {
      if (o.id !== objectionId) return o;
      return {
        ...o,
        sequences: o.sequences.map((seq) => {
          if (seq.id !== seqId) return seq;
          return {
            ...seq,
            steps: seq.steps.filter((st) => st.id !== stepId),
          };
        }),
        updatedAt: new Date().toISOString(),
      };
    });
    saveObjectionsEntities(updated);
    return true;
  }, [objectionsEntities, saveObjectionsEntities]);

  // Modais de Serviços
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceEntity | null>(null);
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<ServiceEntity | null>(null);

  // MÓDULO DE FUNIS
  const [funnels, setFunnels] = useState<FunnelEntity[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('leadion-funnels-v1');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const clean = parsed.filter((f) => f.id !== 'funnel-b2b-default' || (f.sequences && f.sequences.length > 0));
            if (clean.length !== parsed.length) {
              localStorage.setItem('leadion-funnels-v1', JSON.stringify(clean));
            }
            return clean;
          }
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_FUNNELS_DATA;
  });

  const saveFunnels = useCallback((newFunnels: FunnelEntity[]) => {
    setFunnels(newFunnels);
    if (typeof window !== 'undefined') {
      localStorage.setItem('leadion-funnels-v1', JSON.stringify(newFunnels));
    }
  }, []);

  const [activeFunnelId, setActiveFunnelId] = useState<string>(() => {
    return '';
  });

  // Modais de Funil
  const [isFunnelModalOpen, setIsFunnelModalOpen] = useState(false);
  const [editingFunnel, setEditingFunnel] = useState<FunnelEntity | null>(null);
  const [isFunnelStagesModalOpen, setIsFunnelStagesModalOpen] = useState(false);
  const [activeFunnelForStages, setActiveFunnelForStages] = useState<FunnelEntity | null>(null);

  const saveServices = useCallback((newServices: ServiceEntity[]) => {
    setServices(newServices);
    if (typeof window !== 'undefined') {
      localStorage.setItem('leadion-services-v2', JSON.stringify(newServices));
    }
  }, []);

  const [selectedLead, setSelectedLeadState] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [prospectFilter, setProspectFilter] = useState<ProspectFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState<boolean>(false);

  const setSelectedLead = useCallback((lead: Lead | null) => {
    setSelectedLeadState(lead);
    if (lead) {
      setIsDrawerOpen(true);
    }
  }, []);

  const setSelectedCompany = useCallback((company: Company | null) => {
    setSelectedCompanyState(company);
    if (typeof window !== 'undefined') {
      if (company?.id) {
        localStorage.setItem('leadion-selected-company-id', company.id);
      } else {
        localStorage.removeItem('leadion-selected-company-id');
      }
    }
  }, []);

  const saveLeads = (newLeads: Lead[]) => {
    setLeads(newLeads);
    if (typeof window !== 'undefined') {
      localStorage.setItem('leadion-leads', JSON.stringify(newLeads));
    }
  };

  const saveCompanies = (newCompanies: Company[]) => {
    setCompanies(newCompanies);
    if (typeof window !== 'undefined') {
      localStorage.setItem('leadion-companies', JSON.stringify(newCompanies));
    }
    // Sync selectedCompany if it was updated or if selectedCompanyId is present
    if (selectedCompany) {
      const fresh = newCompanies.find((c) => c.id === selectedCompany.id);
      if (fresh) {
        setSelectedCompanyState(fresh);
      }
    } else if (typeof window !== 'undefined') {
      const savedSelectedId = localStorage.getItem('leadion-selected-company-id');
      if (savedSelectedId) {
        const found = newCompanies.find((c) => c.id === savedSelectedId);
        if (found) {
          setSelectedCompanyState(found);
        }
      }
    }
  };

  // Prevenção básica de duplicados
  const checkCompanyDuplicate = useCallback((
    name: string,
    website?: string,
    email?: string,
    phone?: string,
    excludeId?: string
  ): DuplicateCheckResult => {
    const cleanStr = (s?: string) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    const cleanDomain = (url?: string) => {
      if (!url) return '';
      return url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim();
    };

    const targetName = cleanStr(name);
    const targetDomain = cleanDomain(website);
    const targetEmail = email ? email.toLowerCase().trim() : '';
    const targetPhone = cleanStr(phone);

    if (!targetName && !targetDomain && !targetEmail && !targetPhone) {
      return { isDuplicate: false };
    }

    for (const c of companies) {
      if (excludeId && c.id === excludeId) continue;

      const cName = cleanStr(c.name);
      const cDomain = cleanDomain(c.website || c.domain);
      const cEmail = c.email ? c.email.toLowerCase().trim() : '';
      const cPhone = cleanStr(c.phone || c.whatsapp);

      if (targetName && cName && (targetName === cName || (targetName.length > 5 && cName.includes(targetName)))) {
        return { isDuplicate: true, matchedField: 'Nome da Empresa', matchedValue: c.name, existingCompany: c };
      }

      if (targetDomain && cDomain && targetDomain === cDomain) {
        return { isDuplicate: true, matchedField: 'Website / Domínio', matchedValue: c.website || c.domain, existingCompany: c };
      }

      if (targetEmail && cEmail && targetEmail === cEmail) {
        return { isDuplicate: true, matchedField: 'E-mail Corporativo', matchedValue: c.email, existingCompany: c };
      }

      if (targetPhone && cPhone && targetPhone === cPhone && targetPhone.length >= 8) {
        return { isDuplicate: true, matchedField: 'Telefone / WhatsApp', matchedValue: c.phone || c.whatsapp, existingCompany: c };
      }
    }

    return { isDuplicate: false };
  }, [companies]);

  // Adicionar Empresa
  const addCompany = useCallback(async (companyData: Partial<Company>): Promise<{ success: boolean; error?: string; company?: Company }> => {
    const name = companyData.name?.trim();
    if (!name) {
      showToast({ type: 'warning', title: 'Atenção', message: 'O nome da empresa é obrigatório.' });
      return { success: false, error: 'O nome da empresa é obrigatório.' };
    }

    const dupCheck = checkCompanyDuplicate(name, companyData.website, companyData.email, companyData.phone);
    if (dupCheck.isDuplicate) {
      showToast({
        type: 'warning',
        title: 'Empresa já existe',
        message: `Detectado duplicado por ${dupCheck.matchedField}: "${dupCheck.matchedValue}".`,
      });
    }

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const generatedId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `comp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const city = companyData.city?.trim() || '';
    const state = companyData.state?.trim() || '';
    const country = companyData.country?.trim() || '';
    const location = companyData.location?.trim() || (
      [city, state].filter(Boolean).join(', ') + (country ? (city || state ? ` - ${country}` : country) : '')
    );

    const newCompany: Company = {
      id: companyData.id || generatedId,
      name: name,
      niche: companyData.niche?.trim() || companyData.segment?.trim() || '',
      country,
      city,
      state,
      location,
      address: companyData.address?.trim() || '',
      website: companyData.website?.trim() || '',
      phone: companyData.phone?.trim() || '',
      whatsapp: companyData.whatsapp?.trim() || companyData.phone?.trim() || '',
      email: companyData.email?.trim() || '',
      additionalContacts: companyData.additionalContacts || [],
      socials: companyData.socials || {},
      responsibles: companyData.responsibles || [],
      unitsCount: Number(companyData.unitsCount) || 1,
      businessType: companyData.businessType || 'B2B',
      size: companyData.size || companyData.employeesRange || '11-50 colaboradores',
      leadSource: companyData.leadSource || 'Outbound Ativo',
      commercialNotes: companyData.commercialNotes?.trim() || '',
      dealValue: companyData.dealValue,
      closedAt: companyData.closedAt,
      score: companyData.score !== undefined ? companyData.score : null,
      qualificationStatus: companyData.qualificationStatus || 'NOT_STARTED',
      funnelStage: companyData.funnelStage || 'prospeccao',
      funnelId: companyData.funnelId,
      funnelStageId: companyData.funnelStageId,
      funnelStageName: companyData.funnelStageName,
      primaryServiceId: companyData.primaryServiceId,
      status: 'active',
      associatedServices: companyData.associatedServices || [],
      companyServices: companyData.companyServices || [],
      positivePoints: companyData.positivePoints || [],
      negativePoints: companyData.negativePoints || [],
      commercialContext: companyData.commercialContext || {},
      nextAction: companyData.nextAction,
      timeline: [
        {
          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `evt-${Date.now()}`,
          timestamp: `${formattedDate} ${formattedTime}`,
          type: 'empresa_criada',
          title: 'Empresa registrada no LEADION',
          detail: country ? `Registrada com foco comercial em ${city ? `${city} · ` : ''}${country}.` : 'Registrada no sistema.',
          author: userName || 'Você (Operador)',
        },
        ...(companyData.associatedServices && companyData.associatedServices.length > 0 ? [{
          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `evt-${Date.now() + 1}`,
          timestamp: `${formattedDate} ${formattedTime}`,
          type: 'servico_selecionado' as const,
          title: 'Serviço de alto valor associado',
          detail: `Associada a ${companyData.associatedServices.length} serviço(s) comercial(is).`,
          author: userName || 'Você (Operador)',
        }] : []),
      ],
      activities: companyData.activities || [],
      createdAt: formattedDate,
      updatedAt: formattedDate,
      // Backwards compatibility
      segment: companyData.niche?.trim() || companyData.segment?.trim() || '',
      domain: companyData.website ? companyData.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : '',
      icpScore: companyData.score !== undefined && companyData.score !== null ? companyData.score : undefined,
      employeesRange: companyData.size || companyData.employeesRange || '11-50 colaboradores',
      recentTriggers: companyData.commercialNotes ? [companyData.commercialNotes] : [],
      activeLeadsCount: companyData.responsibles?.length || 0,
    };

    const updated = [newCompany, ...companies];
    saveCompanies(updated);

    // Persistência real no Supabase
    let savedCompany = newCompany;
    try {
      const res = await createCompanyInSupabase(newCompany, currentUser?.id);
      if (res.success && res.company) {
        savedCompany = res.company;
        setCompanies((prev) => prev.map((c) => (c.id === newCompany.id ? savedCompany : c)));
        if (typeof window !== 'undefined') {
          const freshList = updated.map((c) => (c.id === newCompany.id ? savedCompany : c));
          localStorage.setItem('leadion-companies', JSON.stringify(freshList));
        }
        setSyncStatus('synced');
        setLastSyncTimestamp(new Date().toISOString());
      } else {
        enqueueOfflineMutation('company', 'CREATE', newCompany.id, newCompany);
        setPendingMutations(loadPendingQueue());
      }
    } catch {
      enqueueOfflineMutation('company', 'CREATE', newCompany.id, newCompany);
      setPendingMutations(loadPendingQueue());
    }

    showToast({
      type: 'success',
      title: 'Empresa Cadastrada',
      message: `${savedCompany.name} foi adicionada ao pipeline com sucesso.`,
    });

    return { success: true, company: savedCompany };
  }, [companies, services, checkCompanyDuplicate, showToast, currentUser, userName, saveCompanies]);

  // Atualizar Empresa
  const updateCompany = useCallback((id: string, updates: Partial<Company>) => {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setCompanies((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== id) return c;

        // Check if stage changed
        let newTimeline = [...c.timeline];
        if (updates.funnelStage && updates.funnelStage !== c.funnelStage) {
          const stageLabels: Record<string, string> = {
            prospeccao: 'Prospecção',
            contato_feito: 'Contato Feito',
            qualificacao: 'Qualificação',
            reuniao_agendada: 'Reunião Agendada',
            proposta: 'Proposta Apresentada',
            negociacao: 'Negociação',
            cliente: 'Cliente Conquistado',
            desqualificado: 'Desqualificado',
          };
          newTimeline = [
            {
              id: `evt-${Date.now()}`,
              timestamp: `${formattedDate} ${formattedTime}`,
              type: 'alteracao_etapa',
              title: `Etapa alterada para: ${stageLabels[updates.funnelStage] || updates.funnelStage}`,
              detail: `Transição de funil atualizada pelo operador.`,
              author: 'Você (Operador)',
            },
            ...newTimeline,
          ];
        }

        const merged: Company = {
          ...c,
          ...updates,
          timeline: updates.timeline || newTimeline,
          updatedAt: formattedDate,
          // Compatibilidade
          segment: updates.niche || c.niche,
          icpScore: updates.score !== undefined ? updates.score : c.score,
        };

        // Persistência real no Supabase
        upsertCompanyToSupabase(merged, currentUser?.id)
          .then((res) => {
            if (!res.success) {
              enqueueOfflineMutation('company', 'UPDATE', id, updates);
              setPendingMutations(loadPendingQueue());
            } else {
              setSyncStatus('synced');
              setLastSyncTimestamp(new Date().toISOString());
            }
          })
          .catch(() => {
            enqueueOfflineMutation('company', 'UPDATE', id, updates);
            setPendingMutations(loadPendingQueue());
          });

        return merged;
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('leadion-companies', JSON.stringify(updated));
      }

      const current = updated.find((c) => c.id === id);
      if (current && selectedCompany?.id === id) {
        setSelectedCompanyState(current);
      }

      return updated;
    });

    showToast({
      type: 'success',
      title: 'Empresa Atualizada',
      message: 'As alterações foram salvas com sucesso.',
    });
  }, [selectedCompany, showToast, currentUser]);

  // Excluir Empresa
  const deleteCompany = useCallback((id: string) => {
    const target = companies.find((c) => c.id === id);
    const updated = companies.filter((c) => c.id !== id);
    saveCompanies(updated);

    if (selectedCompany?.id === id) {
      setSelectedCompany(null);
    }

    // Persistência real no Supabase
    deleteCompanyFromSupabase(id)
      .then((res) => {
        if (!res.success) {
          enqueueOfflineMutation('company', 'DELETE', id, null);
          setPendingMutations(loadPendingQueue());
        } else {
          setSyncStatus('synced');
          setLastSyncTimestamp(new Date().toISOString());
        }
      })
      .catch(() => {
        enqueueOfflineMutation('company', 'DELETE', id, null);
        setPendingMutations(loadPendingQueue());
      });

    showToast({
      type: 'info',
      title: 'Empresa Excluída',
      message: `${target?.name || 'A empresa'} foi removida do sistema.`,
    });
  }, [companies, selectedCompany, showToast, saveCompanies]);

  // Arquivar Empresa
  const archiveCompany = useCallback((id: string) => {
    const target = companies.find((c) => c.id === id);
    const updated = companies.map((c) => c.id === id ? { ...c, status: 'archived' as const } : c);
    saveCompanies(updated);

    if (selectedCompany?.id === id) {
      setSelectedCompanyState({ ...selectedCompany, status: 'archived' });
    }

    showToast({
      type: 'info',
      title: 'Empresa Arquivada',
      message: `${target?.name || 'A empresa'} foi arquivada. Você pode visualizá-la filtrando por "Arquivadas".`,
    });
  }, [companies, selectedCompany, showToast]);

  // Desarquivar Empresa
  const unarchiveCompany = useCallback((id: string) => {
    const target = companies.find((c) => c.id === id);
    const updated = companies.map((c) => c.id === id ? { ...c, status: 'active' as const } : c);
    saveCompanies(updated);

    if (selectedCompany?.id === id) {
      setSelectedCompanyState({ ...selectedCompany, status: 'active' });
    }

    showToast({
      type: 'success',
      title: 'Empresa Restaurada',
      message: `${target?.name || 'A empresa'} foi reativada no pipeline ativo.`,
    });
  }, [companies, selectedCompany, showToast]);

  // Duplicar Empresa
  const duplicateCompany = useCallback((id: string): Company | null => {
    const target = companies.find((c) => c.id === id);
    if (!target) return null;

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const duplicated: Company = {
      ...target,
      id: `comp-${Date.now()}`,
      name: `${target.name} (Cópia)`,
      createdAt: formattedDate,
      updatedAt: formattedDate,
      timeline: [
        {
          id: `evt-${Date.now()}`,
          timestamp: `${formattedDate} ${formattedTime}`,
          type: 'empresa_criada',
          title: 'Empresa duplicada a partir de ' + target.name,
          detail: 'Criada como cópia rápida para nova unidade ou proposta paralela.',
          author: 'Você (Operador)',
        }
      ],
      responsibles: target.responsibles.map((r) => ({
        ...r,
        id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      })),
      activities: [],
    };

    const updated = [duplicated, ...companies];
    saveCompanies(updated);

    showToast({
      type: 'success',
      title: 'Empresa Duplicada',
      message: `Criada cópia de "${target.name}".`,
    });

    return duplicated;
  }, [companies, showToast]);

  // Adicionar Evento na Timeline da Empresa
  const addCompanyTimelineEvent = useCallback((
    companyId: string,
    event: Omit<CompanyTimelineEvent, 'id' | 'timestamp'>
  ) => {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newEvt: CompanyTimelineEvent = {
      ...event,
      id: `evt-${Date.now()}`,
      timestamp: `${formattedDate} ${formattedTime}`,
      author: event.author || 'Você (Operador)',
    };

    setCompanies((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== companyId) return c;
        return {
          ...c,
          timeline: [newEvt, ...c.timeline],
          updatedAt: formattedDate,
        };
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('leadion-companies', JSON.stringify(updated));
      }

      if (selectedCompany?.id === companyId) {
        setSelectedCompanyState({
          ...selectedCompany,
          timeline: [newEvt, ...selectedCompany.timeline],
          updatedAt: formattedDate,
        });
      }

      return updated;
    });

    showToast({
      type: 'info',
      title: 'Evento Registrado',
      message: `Novo evento adicionado à timeline da empresa.`,
    });
  }, [selectedCompany, showToast]);

  // Adicionar Atividade
  const addCompanyActivity = useCallback((
    companyId: string,
    activity: Omit<CompanyActivity, 'id' | 'createdAt'>
  ) => {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    const newActivity: CompanyActivity = {
      ...activity,
      id: `act-${Date.now()}`,
      createdAt: formattedDate,
      completed: false,
    };

    setCompanies((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== companyId) return c;
        return {
          ...c,
          activities: [newActivity, ...(c.activities || [])],
          updatedAt: formattedDate,
        };
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('leadion-companies', JSON.stringify(updated));
      }

      if (selectedCompany?.id === companyId) {
        setSelectedCompanyState({
          ...selectedCompany,
          activities: [newActivity, ...(selectedCompany.activities || [])],
        });
      }

      return updated;
    });

    showToast({
      type: 'success',
      title: 'Atividade Criada',
      message: `Atividade agendada com sucesso.`,
    });
  }, [selectedCompany, showToast]);

  // Alternar conclusão de atividade
  const toggleCompanyActivity = useCallback((companyId: string, activityId: string) => {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    setCompanies((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== companyId) return c;
        const newActivities = (c.activities || []).map((act) => {
          if (act.id !== activityId) return act;
          const nextCompleted = !act.completed;
          return {
            ...act,
            completed: nextCompleted,
            completedAt: nextCompleted ? formattedDate : undefined,
          };
        });
        return {
          ...c,
          activities: newActivities,
        };
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('leadion-companies', JSON.stringify(updated));
      }

      if (selectedCompany?.id === companyId) {
        const fresh = updated.find((c) => c.id === companyId);
        if (fresh) setSelectedCompanyState(fresh);
      }

      return updated;
    });
  }, [selectedCompany]);

  // Lead Actions
  const executeLeadAction = useCallback((
    leadId: string,
    channel: ChannelType,
    actionResult: 'connected' | 'no_answer' | 'replied_positive' | 'objection' | 'rejected',
    note?: string
  ) => {
    setLeads((prevLeads) => {
      const updated = prevLeads.map((lead) => {
        if (lead.id !== leadId) return lead;

        const newCadenceStep = Math.min(lead.timing.cadenceStep + 1, lead.timing.totalCadenceSteps);
        
        let newStatus = lead.status;
        if (actionResult === 'replied_positive') {
          newStatus = 'meeting_scheduled';
        } else if (actionResult === 'rejected') {
          newStatus = 'disqualified';
        } else if (actionResult === 'objection') {
          newStatus = 'in_cadence';
        } else {
          newStatus = 'in_cadence';
        }

        const newEvent: LeadTimelineEvent = {
          id: `hist-${Date.now()}`,
          timestamp: 'Agora há pouco',
          type: channel === 'whatsapp' ? 'whatsapp_sent' : channel === 'linkedin' ? 'linkedin_connected' : channel === 'phone' ? 'call_made' : 'email_sent',
          title: `Ação executada via ${channel.toUpperCase()}`,
          detail: note || `Disparo do script com resultado: ${actionResult}`,
          channel,
          result: actionResult,
          author: 'Você (Operador)',
        };

        const updatedLead: Lead = {
          ...lead,
          status: newStatus,
          timing: {
            ...lead.timing,
            status: actionResult === 'replied_positive' ? 'executed' : 'scheduled',
            cadenceStep: newCadenceStep,
            timeIndicator: actionResult === 'replied_positive' ? 'Reunião Marcada' : 'Aguardando próximo toque',
          },
          history: [newEvent, ...lead.history],
        };

        if (selectedLead?.id === leadId) {
          setSelectedLeadState(updatedLead);
        }

        return updatedLead;
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('leadion-leads', JSON.stringify(updated));
      }
      return updated;
    });

    const channelNames: Record<ChannelType, string> = {
      whatsapp: 'WhatsApp',
      linkedin: 'LinkedIn',
      phone: 'Ligação',
      email: 'E-mail',
    };

    showToast({
      type: actionResult === 'replied_positive' ? 'success' : actionResult === 'rejected' ? 'warning' : 'info',
      title: 'Ação registrada no Leadion',
      message: `${channelNames[channel]} executado. Cadência atualizada e histórico registrado.`,
    });
  }, [selectedLead, showToast]);

  const updateLeadStatus = useCallback((leadId: string, newStatus: LeadPipelineStatus) => {
    setLeads((prev) => {
      const updated = prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l));
      saveLeads(updated);
      return updated;
    });

    showToast({
      type: 'info',
      title: 'Status atualizado',
      message: `Lead movido para ${newStatus.replace('_', ' ')}.`,
    });
  }, [showToast]);

  const snoozeLead = useCallback((leadId: string, minutes: number) => {
    setLeads((prev) => {
      const updated = prev.map((l) => {
        if (l.id !== leadId) return l;
        return {
          ...l,
          timing: {
            ...l.timing,
            status: 'snoozed' as const,
            timeIndicator: `Adiado por ${minutes} min`,
          },
        };
      });
      saveLeads(updated);
      return updated;
    });

    showToast({
      type: 'info',
      title: 'Prospecção adiada',
      message: `O lead voltará ao topo da fila em ${minutes} minutos.`,
    });
  }, [showToast]);

  const addNewLead = useCallback((leadData: Partial<Lead>) => {
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: leadData.name || 'Novo Contato',
      role: leadData.role || 'Tomador de Decisão',
      company: leadData.company || 'Empresa em Prospecção',
      email: leadData.email || '',
      phone: leadData.phone || '',
      whatsappNumber: leadData.whatsappNumber || '',
      linkedinUrl: leadData.linkedinUrl || '',
      segment: leadData.segment || 'Geral B2B',
      companySize: leadData.companySize || '50-100 colaboradores',
      location: leadData.location || 'Brasil',
      why: {
        trigger: leadData.why?.trigger || 'Oportunidade de mercado identificada no radar comercial.',
        painPoint: leadData.why?.painPoint || 'Gargalo operacional e busca por eficiência comercial.',
        urgencyLevel: leadData.why?.urgencyLevel || 'medium',
        icpFitReason: leadData.why?.icpFitReason || 'Perfil alinhado com critérios de faturamento e decisor.',
      },
      offer: {
        serviceId: 'serv-01',
        serviceName: leadData.offer?.serviceName || 'Leadion Sales OS & Otimização',
        valueProposition: leadData.offer?.valueProposition || 'Eficiência operacional e ganho de escala mensurável.',
        estimatedTicket: leadData.offer?.estimatedTicket || 'R$ 5.000/mês',
        deliverablesHighlight: 'Implementação em 30 dias com acompanhamento.',
      },
      script: {
        channel: leadData.script?.channel || 'whatsapp',
        hook: leadData.script?.hook || 'Olá [Nome], acompanhando a evolução da sua empresa.',
        body: leadData.script?.body || 'Ajudamos empresas do seu segmento a reduzir custos operacionais.',
        cta: leadData.script?.cta || 'Você teria 10 min esta semana para uma troca rápida?',
        fullText: leadData.script?.fullText || 'Olá, vi a atuação da sua empresa. Temos um modelo para otimizar seus resultados operacionais. Você teria 10 min esta semana?',
      },
      timing: {
        status: 'due_today',
        scheduledTime: 'Agora',
        scheduledDate: 'Hoje',
        cadenceStep: 1,
        totalCadenceSteps: 4,
        stepLabel: 'Toque 1: Abertura',
        timeIndicator: 'Fila de hoje',
      },
      nextAction: {
        channel: 'whatsapp',
        actionType: 'send_whatsapp',
        label: 'Enviar WhatsApp com Script',
      },
      score: 85,
      scoreFactors: [
        { label: 'Novo lead inserido na fila ativa', points: 25, type: 'positive' },
        { label: 'Decisor comercial', points: 20, type: 'positive' },
      ],
      status: 'pending_action',
      history: [
        {
          id: `hist-${Date.now()}`,
          timestamp: 'Agora',
          type: 'note_added',
          title: 'Lead cadastrado na esteira',
          detail: 'Criado para prospecção imediata.',
          author: 'Você',
        },
      ],
      notes: '',
      tags: ['Novo', 'Prospecção Ativa'],
    };

    setLeads((prev) => {
      const updated = [newLead, ...prev];
      saveLeads(updated);
      return updated;
    });

    showToast({
      type: 'success',
      title: 'Lead adicionado à fila',
      message: `${newLead.name} (${newLead.company}) agora está pronto para prospecção imediata.`,
    });
  }, [showToast]);

  // Priority Weights
  const [priorityWeights, setPriorityWeightsState] = useState<PriorityWeights>(() => {
    return loadSavedPriorityWeights();
  });

  const updatePriorityWeights = useCallback((newWeights: PriorityWeights) => {
    setPriorityWeightsState(newWeights);
    savePriorityWeights(newWeights);
    showToast({
      type: 'success',
      title: 'Regras de Prioridade Atualizadas',
      message: 'O algoritmo recalculou e reordenou a fila de execução.',
    });
  }, [showToast]);

  // Actions Execution Queue
  const [actions, setActions] = useState<ProspectAction[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('leadion-prospect-actions');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const clean = parsed.filter((a) => !isDemoAction(a));
            if (clean.length !== parsed.length) {
              localStorage.setItem('leadion-prospect-actions', JSON.stringify(clean));
            }
            return clean;
          }
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_ACTIONS.filter((a) => !isDemoAction(a));
  });

  const saveActions = useCallback((newActions: ProspectAction[]) => {
    setActions(newActions);
    if (typeof window !== 'undefined') {
      localStorage.setItem('leadion-prospect-actions', JSON.stringify(newActions));
    }
  }, []);

  // Modals for Actions
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
  const [planningPreselectedCompany, setPlanningPreselectedCompany] = useState<Company | null>(null);
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [quickViewCompany, setQuickViewCompany] = useState<Company | null>(null);
  const [companyNeedingNextAction, setCompanyNeedingNextAction] = useState<Company | null>(null);

  // Modal de Desfecho & Próxima Ação Inteligente
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [outcomeModalAction, setOutcomeModalAction] = useState<ProspectAction | null>(null);

  const openActionOutcomeModal = useCallback((action: ProspectAction) => {
    setOutcomeModalAction(action);
    setIsOutcomeModalOpen(true);
  }, []);

  const closeActionOutcomeModal = useCallback(() => {
    setIsOutcomeModalOpen(false);
    setOutcomeModalAction(null);
  }, []);

  // Unplanned Companies calculation:
  // Active companies that do NOT have any active next action (status in 'atrasada', 'hoje', 'proxima')
  const unplannedCompanies = useMemo(() => {
    const activeCompanies = companies.filter((c) => c.status === 'active');
    const companiesWithPendingAction = new Set(
      actions
        .filter((a) => a.status === 'atrasada' || a.status === 'hoje' || a.status === 'proxima')
        .map((a) => a.companyId)
    );
    return activeCompanies.filter((c) => !companiesWithPendingAction.has(c.id));
  }, [companies, actions]);

  // Action Counters for Top Metric Pills
  const actionCounters = useMemo(() => {
    const atrasadas = actions.filter((a) => a.status === 'atrasada').length;
    const hoje = actions.filter((a) => a.status === 'hoje').length;
    const proxima = actions.filter((a) => a.status === 'proxima').length;
    const concluidas = actions.filter((a) => a.status === 'concluida').length;
    const canceladas = actions.filter((a) => a.status === 'cancelada').length;
    const semProximaAcao = unplannedCompanies.length;
    return { atrasadas, hoje, proxima, concluidas, canceladas, semProximaAcao };
  }, [actions, unplannedCompanies]);

  // Helper labels
  const getStageLabel = (stage: string): string => {
    const map: Record<string, string> = {
      prospeccao: 'Prospecção',
      contato_feito: 'Contato Feito',
      qualificacao: 'Qualificação',
      reuniao_agendada: 'Reunião Agendada',
      proposta: 'Proposta Apresentada',
      negociacao: 'Negociação',
      cliente: 'Cliente Conquistado',
      desqualificado: 'Desqualificado',
    };
    return map[stage] || stage;
  };

  // Plan Action
  const planAction = useCallback((data: PlanningFormData) => {
    const targetComp = companies.find((c) => c.id === data.companyId);
    const primaryResp = targetComp?.responsibles.find((r) => r.isPrimary) || targetComp?.responsibles[0];
    const serviceObj = services.find((s) => s.name === data.service || s.id === data.serviceId);

    // Mapeamento de preço por país da empresa com snapshot histórico imutável
    const matchedCountryPrice = serviceObj ? getServicePriceForCompany(serviceObj, targetComp?.country) : null;
    const priceSnapshot = serviceObj && matchedCountryPrice 
      ? createServicePriceSnapshot(serviceObj, matchedCountryPrice) 
      : data.priceSnapshot;
    const potentialValue = priceSnapshot 
      ? priceSnapshot.formattedMyPrice 
      : (serviceObj?.standardTicket || 'R$ 5.000');

    // Determine status
    let status: 'atrasada' | 'hoje' | 'proxima' = 'hoje';
    const dateStr = data.date.toLowerCase().trim();
    if (dateStr === 'hoje') {
      status = 'hoje';
    } else if (dateStr === 'amanhã' || dateStr.includes('/') || dateStr.includes('-')) {
      status = 'proxima';
    }

    const newActionId = `act-${Date.now()}`;
    const nextActionTitle = data.nextActionTitle || `Ação via ${data.channel.toUpperCase()}`;

    const newAction: ProspectAction = {
      id: newActionId,
      companyId: data.companyId,
      companyName: targetComp?.name || 'Nova Empresa',
      niche: targetComp?.niche || 'Geral',
      location: targetComp?.location || (targetComp?.city ? `${targetComp.city} · ${targetComp.country || 'Brasil'}` : 'Local não informado'),
      score: targetComp?.score || 85,
      service: data.service,
      serviceId: data.serviceId || serviceObj?.id,
      funnelStage: data.funnelStage,
      funnelStageLabel: getStageLabel(data.funnelStage),
      channel: data.channel,
      nextAction: nextActionTitle,
      date: data.date,
      time: data.time || '09:00',
      responsible: data.responsible || userName,
      observation: data.observation || '',
      status,
      urgency: 'alta',
      potentialValue,
      priceSnapshot,
      targetContactName: primaryResp?.name,
      targetContactRole: primaryResp?.role,
      whatsappNumber: primaryResp?.whatsapp || targetComp?.whatsapp,
      phone: primaryResp?.phone || targetComp?.phone,
      email: primaryResp?.email || targetComp?.email,
      linkedinUrl: primaryResp?.linkedin || targetComp?.socials?.linkedin,
      scriptText: `Olá ${primaryResp?.name || 'Prezado(a)'}, vi o trabalho de destaque da ${targetComp?.name} e gostaria de apresentar nossa solução em ${data.service}.`,
      createdAt: new Date().toLocaleDateString('pt-BR'),
      hasPendingNextAction: true,
    };

    // Save action
    saveActions([newAction, ...actions.filter((a) => a.id !== newActionId)]);

    // Persistência real no Supabase
    upsertActionToSupabase(newAction, currentUser?.id)
      .then((res) => {
        if (!res.success) {
          enqueueOfflineMutation('action', 'CREATE', newAction.id, newAction);
          setPendingMutations(loadPendingQueue());
        }
      })
      .catch(() => {
        enqueueOfflineMutation('action', 'CREATE', newAction.id, newAction);
        setPendingMutations(loadPendingQueue());
      });

    // Update associated company
    if (targetComp) {
      updateCompany(targetComp.id, {
        funnelStage: data.funnelStage as any,
        nextAction: {
          actionType: data.channel === 'whatsapp' ? 'send_whatsapp' : data.channel === 'phone' ? 'make_call' : data.channel === 'email' ? 'send_email' : 'connect_linkedin',
          label: newAction.nextAction,
          dueDate: data.date,
          dueTime: data.time,
          channel: data.channel === 'reuniao' ? 'whatsapp' : data.channel,
          responsibleName: data.responsible,
          notes: data.observation,
        },
      });

      addCompanyTimelineEvent(targetComp.id, {
        type: 'status_alterado',
        title: `Próxima ação agendada: ${newAction.nextAction}`,
        detail: `Agendada para ${data.date} às ${data.time} via canal ${data.channel.toUpperCase()} por ${data.responsible}.`,
        author: userName,
      });

      addCompanyActivity(targetComp.id, {
        type: data.channel === 'whatsapp' ? 'whatsapp' : data.channel === 'phone' ? 'call' : data.channel === 'email' ? 'email' : 'meeting',
        title: `${newAction.nextAction} (${data.service})`,
        dueDate: data.date,
        dueTime: data.time,
        notes: data.observation,
        completed: false,
      });
    }

    // Clear alert if it was this company
    if (companyNeedingNextAction?.id === data.companyId) {
      setCompanyNeedingNextAction(null);
    }

    setIsPlanningModalOpen(false);
    setPlanningPreselectedCompany(null);

    showToast({
      type: 'success',
      title: 'Prospecção Programada com Sucesso',
      message: `${newAction.companyName}: agendado para ${newAction.date} às ${newAction.time}.`,
    });
  }, [companies, services, userName, actions, saveActions, updateCompany, addCompanyTimelineEvent, addCompanyActivity, companyNeedingNextAction, showToast]);

  // Conclusão com Desfecho & Motor de Próxima Ação
  const resolveActionWithOutcome = useCallback((actionId: string, details: ActionOutcomeDetails) => {
    const act = actions.find((a) => a.id === actionId);
    if (!act) return;

    const completedTimestamp = new Date().toLocaleString('pt-BR');

    // 1. SE GANHOU / FECHOU VENDA
    if (details.outcome === 'ganhou') {
      updateCompany(act.companyId, {
        funnelStage: 'cliente' as any,
        commercialNotes: details.notes ? `${act.potentialValue || ''} - ${details.notes}` : `Venda ganha! ${details.wonValue || act.potentialValue || ''}`,
      });

      addCompanyTimelineEvent(act.companyId, {
        type: 'transicao_funil',
        title: '🏆 Negócio Ganho - Cliente Conquistado!',
        detail: `Proposta aceita com sucesso! Valor fechado: ${details.wonValue || act.potentialValue || 'Fechado'}. ${details.notes || ''}`,
        author: userName,
      });

      const updated = actions.map((a) =>
        a.id === actionId
          ? {
              ...a,
              status: 'concluida' as const,
              completedAt: completedTimestamp,
              outcome: 'ganhou' as const,
              outcomeNotes: details.notes,
            }
          : a
      );
      saveActions(updated);

      showToast({
        type: 'success',
        title: '🎉 Parabéns! Negócio Conquistado!',
        message: `${act.companyName} agora é um cliente ativo. Prospecção encerrada com vitória!`,
      });
      return;
    }

    // 2. SE PERDEU / DESISTIU
    if (details.outcome === 'perdeu') {
      updateCompany(act.companyId, {
        funnelStage: 'desqualificado' as any,
        commercialNotes: `[Motivo Perda]: ${details.lostReason || 'Desistência'} | ${details.notes || ''}`,
      });

      addCompanyTimelineEvent(act.companyId, {
        type: 'alteracao_etapa',
        title: '❌ Oportunidade Desqualificada / Perdida',
        detail: `Motivo: ${details.lostReason || 'Não informado'}. ${details.notes || ''}`,
        author: userName,
      });

      const updated = actions.map((a) =>
        a.id === actionId
          ? {
              ...a,
              status: 'cancelada' as const,
              cancelledAt: completedTimestamp,
              outcome: 'perdeu' as const,
              lostReason: details.lostReason,
              outcomeNotes: details.notes,
            }
          : a
      );
      saveActions(updated);

      showToast({
        type: 'info',
        title: 'Motivo de Perda Registrado',
        message: `${act.companyName} arquivada com motivo registrado.`,
      });
      return;
    }

    // 3. SE APRESENTOU OBJEÇÃO
    if (details.outcome === 'objecao') {
      addCompanyTimelineEvent(act.companyId, {
        type: 'objecao',
        title: '⚠️ Objeção Levantada pelo Cliente',
        detail: details.notes || 'Cliente apresentou objeção durante a abordagem.',
        author: userName,
      });
    }

    // 4. ATUALIZA A AÇÃO ATUAL COMO CONCLUÍDA
    const updatedActions = actions.map((a) =>
      a.id === actionId
        ? {
            ...a,
            status: 'concluida' as const,
            completedAt: completedTimestamp,
            outcome: details.outcome,
            outcomeNotes: details.notes,
          }
        : a
    );

    // 5. CÁLCULO E AGENDAMENTO DA PRÓXIMA AÇÃO (Se houver próxima ação definida)
    let finalActions = updatedActions;
    if (details.nextActionTitle) {
      const nextActId = `act-${Date.now()}`;
      const targetComp = companies.find((c) => c.id === act.companyId);
      const isDueToday =
        details.nextFollowUpDate === 'Hoje' ||
        details.nextFollowUpDate === new Date().toISOString().split('T')[0];

      const newNextAction: ProspectAction = {
        id: nextActId,
        companyId: act.companyId,
        companyName: act.companyName,
        niche: act.niche,
        location: act.location,
        score: act.score,
        clientScore: act.clientScore || act.score,
        serviceScore: act.serviceScore || 90,
        service: act.service,
        serviceId: act.serviceId,
        funnelStage: details.outcome === 'respondeu' ? 'qualificacao' : act.funnelStage,
        funnelStageLabel: details.outcome === 'respondeu' ? 'Qualificação' : act.funnelStageLabel,
        channel: details.nextChannel || act.channel,
        nextAction: details.nextActionTitle,
        date: details.nextFollowUpDate || 'Hoje',
        time: details.nextFollowUpTime || '09:30',
        responsible: userName || act.responsible,
        observation: details.notes || '',
        status: isDueToday ? 'hoje' : 'proxima',
        urgency: details.outcome === 'respondeu' ? 'alta' : 'media',
        importance: act.importance || 'alta',
        potentialValue: act.potentialValue,
        targetContactName: act.targetContactName,
        targetContactRole: act.targetContactRole,
        whatsappNumber: act.whatsappNumber,
        phone: act.phone,
        email: act.email,
        linkedinUrl: act.linkedinUrl,
        scriptText: details.notes,
        scriptId: details.nextScriptId,
        createdAt: new Date().toLocaleDateString('pt-BR'),
        isFollowUp: details.outcome === 'nao_respondeu',
        clientReplied: details.outcome === 'respondeu',
        daysSinceLastContact: 0,
        hasPendingNextAction: true,
      };

      finalActions = [newNextAction, ...updatedActions];

      // Atualiza na empresa para manter sincronizado
      updateCompany(act.companyId, {
        funnelStage: (details.outcome === 'respondeu' ? 'qualificacao' : targetComp?.funnelStage || 'contato_feito') as any,
        nextAction: {
          actionType: 'send_' + (details.nextChannel || act.channel),
          label: details.nextActionTitle,
          dueDate: details.nextFollowUpDate || 'Hoje',
          dueTime: details.nextFollowUpTime || '09:30',
          channel: (details.nextChannel === 'reuniao' ? 'whatsapp' : details.nextChannel || act.channel) as any,
          responsibleName: userName,
        },
      });

      addCompanyTimelineEvent(act.companyId, {
        type: details.outcome === 'respondeu' ? 'resposta' : 'follow_up',
        title:
          details.outcome === 'respondeu'
            ? `Cliente Respondeu - Próximo Script Agendado: ${details.nextActionTitle}`
            : `Sem Resposta - Follow-up Agendado: ${details.nextActionTitle}`,
        detail: `Agendado para ${details.nextFollowUpDate || 'Hoje'} às ${details.nextFollowUpTime || '09:30'}.`,
        author: userName,
      });

      showToast({
        type: 'success',
        title: 'Próxima Ação Agendada Automaticamente!',
        message: `${act.companyName}: "${details.nextActionTitle}" programada com sucesso.`,
      });
    } else {
      // REGRA: Lead ativo sem próxima ação dispara alerta!
      const targetComp = companies.find((c) => c.id === act.companyId);
      if (targetComp && targetComp.status === 'active') {
        setCompanyNeedingNextAction(targetComp);
        showToast({
          type: 'warning',
          title: '⚠️ Atenção: Lead sem Próxima Ação',
          message: `${act.companyName} foi concluída, mas está sem próxima ação agendada. Todo lead ativo deve possuir uma próxima ação!`,
        });
      }
    }

    saveActions(finalActions);
  }, [actions, companies, userName, updateCompany, addCompanyTimelineEvent, saveActions, showToast]);

  // Complete Action (with compliance rule check)
  const completeAction = useCallback((actionId: string, notes?: string) => {
    const act = actions.find((a) => a.id === actionId);
    if (!act) return;

    const completedTimestamp = new Date().toLocaleString('pt-BR');
    const updatedActions = actions.map((a) => {
      if (a.id === actionId) {
        return {
          ...a,
          status: 'concluida' as const,
          completedAt: completedTimestamp,
          observation: notes ? `${a.observation ? a.observation + ' | ' : ''}${notes}` : a.observation,
        };
      }
      return a;
    });

    saveActions(updatedActions);

    // Register event in Company
    if (act.companyId) {
      addCompanyTimelineEvent(act.companyId, {
        type: 'atividade_concluida',
        title: `Ação Concluída: ${act.nextAction}`,
        detail: notes || `Atividade executada com sucesso via canal ${act.channel.toUpperCase()}.`,
        author: userName,
      });

      // REGRA DO SISTEMA: Todo lead ativo deve possuir uma próxima ação.
      // Se uma atividade for concluída e não houver próxima ação, o sistema deve sinalizar isso!
      const remainingPendingActions = updatedActions.filter(
        (a) => a.companyId === act.companyId && (a.status === 'atrasada' || a.status === 'hoje' || a.status === 'proxima')
      );

      const targetComp = companies.find((c) => c.id === act.companyId);
      if (remainingPendingActions.length === 0 && targetComp && targetComp.status === 'active') {
        // Sinaliza no sistema!
        setCompanyNeedingNextAction(targetComp);
        showToast({
          type: 'warning',
          title: '⚠️ Atenção: Lead sem Próxima Ação',
          message: `${act.companyName} foi concluída, mas agora está sem próxima ação agendada. Todo lead ativo deve possuir uma próxima ação!`,
        });
      } else {
        showToast({
          type: 'success',
          title: 'Ação Concluída!',
          message: `${act.companyName}: ${act.nextAction} finalizada com sucesso.`,
        });
      }
    }
  }, [actions, companies, userName, saveActions, addCompanyTimelineEvent, showToast]);

  // Cancel Action
  const cancelAction = useCallback((actionId: string, reason?: string) => {
    const act = actions.find((a) => a.id === actionId);
    if (!act) return;

    const cancelledTimestamp = new Date().toLocaleString('pt-BR');
    const updatedActions = actions.map((a) => {
      if (a.id === actionId) {
        return {
          ...a,
          status: 'cancelada' as const,
          cancelledAt: cancelledTimestamp,
          observation: reason ? `${a.observation ? a.observation + ' | ' : ''}[Cancelado: ${reason}]` : a.observation,
        };
      }
      return a;
    });

    saveActions(updatedActions);

    if (act.companyId) {
      addCompanyTimelineEvent(act.companyId, {
        type: 'status_alterado',
        title: `Ação Cancelada: ${act.nextAction}`,
        detail: reason || 'Ação cancelada pelo operador.',
        author: userName,
      });
    }

    showToast({
      type: 'info',
      title: 'Ação Cancelada',
      message: `${act.companyName}: ação cancelada na fila.`,
    });
  }, [actions, userName, saveActions, addCompanyTimelineEvent, showToast]);

  // Reopen Action
  const reopenAction = useCallback((actionId: string) => {
    const act = actions.find((a) => a.id === actionId);
    if (!act) return;

    const updatedActions = actions.map((a) => {
      if (a.id === actionId) {
        return {
          ...a,
          status: 'hoje' as const,
          completedAt: undefined,
          cancelledAt: undefined,
        };
      }
      return a;
    });

    saveActions(updatedActions);
    showToast({
      type: 'success',
      title: 'Ação Reaberta',
      message: `${act.companyName} retornou para a fila de execução.`,
    });
  }, [actions, saveActions, showToast]);

  // Auditoria e Registro da Objeção Tratada na Timeline da Empresa
  const recordObjectionHandled = useCallback((
    companyId: string,
    objectionName: string,
    sequenceName: string,
    stepName: string,
    stepType: string,
    scriptContent: string,
    actionId?: string,
    notes?: string
  ) => {
    const comp = companies.find((c) => c.id === companyId);
    if (!comp) return;

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    addCompanyTimelineEvent(companyId, {
      type: 'whatsapp_enviado',
      title: `Objeção Tratada: ${objectionName}`,
      detail: `Mini-Funil: "${sequenceName}" | Etapa: ${stepName} (${stepType}).\nScript enviado via WhatsApp:\n"${scriptContent}"${notes ? `\nObservações: ${notes}` : ''}`,
      author: userName || 'Consultor Comercial',
    });

    // Atualiza data de última interação da empresa
    updateCompany(companyId, {
      updatedAt: `${formattedDate} ${formattedTime}`,
    });

    showToast({
      type: 'success',
      title: 'Objeção Registrada na Timeline',
      message: `${comp.name}: tratamento de "${objectionName}" salvo no histórico da empresa.`,
    });
  }, [companies, userName, addCompanyTimelineEvent, updateCompany, showToast]);

  // Abre modal de despacho WhatsApp para a empresa
  const openWhatsAppForCompany = useCallback((
    company: Company,
    script?: ScriptEntity | null,
    customMessage?: string,
    actionId?: string
  ) => {
    setWhatsAppModalData({
      company,
      script: script || null,
      customMessage,
      actionId,
    });
    setIsWhatsAppModalOpen(true);
  }, []);

  // Open WhatsApp Action - Integrado ao Construtor de Scripts e Modal de Auditoria de Disparo
  const openWhatsAppAction = useCallback((actionId: string) => {
    const act = actions.find((a) => a.id === actionId);
    if (!act) return;

    const targetComp = companies.find((c) => c.id === act.companyId);
    if (targetComp) {
      // Procura script adequado para WhatsApp
      const matchingScript = scriptsEntities.find((s) => s.channel === 'whatsapp') || null;
      openWhatsAppForCompany(targetComp, matchingScript, act.scriptText, act.id);
    } else {
      const rawPhone = act.whatsappNumber || act.phone || '';
      const cleanPhone = rawPhone.replace(/\D/g, '');

      if (!cleanPhone) {
        showToast({
          type: 'error',
          title: 'Número de WhatsApp Não Encontrado',
          message: 'Cadastre o número de telefone da empresa ou do decisor para disparar.',
        });
        return;
      }

      const msg = act.scriptText || `Olá ${act.targetContactName || ''}, gostaria de falar sobre a solução de ${act.service} para a ${act.companyName}.`;
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
  }, [actions, companies, scriptsEntities, openWhatsAppForCompany, showToast]);

  // ==========================================
  // OPERAÇÕES DO CONSTRUTOR DE SCRIPTS
  // ==========================================
  const createScript = useCallback((scriptData: Omit<ScriptEntity, 'id' | 'createdAt' | 'updatedAt'>): ScriptEntity => {
    const nowStr = new Date().toISOString();
    const newScript: ScriptEntity = {
      ...scriptData,
      id: `script-${Date.now()}`,
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    const updated = [newScript, ...scriptsEntities];
    saveScriptsEntities(updated);

    // Persistência real no Supabase
    upsertScriptToSupabase(newScript, currentUser?.id)
      .then((res) => {
        if (!res.success) {
          enqueueOfflineMutation('script', 'CREATE', newScript.id, newScript);
          setPendingMutations(loadPendingQueue());
        }
      })
      .catch(() => {
        enqueueOfflineMutation('script', 'CREATE', newScript.id, newScript);
        setPendingMutations(loadPendingQueue());
      });

    return newScript;
  }, [scriptsEntities, saveScriptsEntities, currentUser]);

  const updateScript = useCallback((id: string, updates: Partial<ScriptEntity>) => {
    let targetUpdated: ScriptEntity | null = null;
    const updated = scriptsEntities.map((s) => {
      if (s.id === id) {
        const merged = {
          ...s,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        targetUpdated = merged;
        return merged;
      }
      return s;
    });
    saveScriptsEntities(updated);

    if (targetUpdated) {
      upsertScriptToSupabase(targetUpdated, currentUser?.id)
        .then((res) => {
          if (!res.success) {
            enqueueOfflineMutation('script', 'UPDATE', id, updates);
            setPendingMutations(loadPendingQueue());
          }
        })
        .catch(() => {
          enqueueOfflineMutation('script', 'UPDATE', id, updates);
          setPendingMutations(loadPendingQueue());
        });
    }
  }, [scriptsEntities, saveScriptsEntities, currentUser]);

  const duplicateScript = useCallback((id: string): ScriptEntity | null => {
    const original = scriptsEntities.find((s) => s.id === id);
    if (!original) return null;
    const nowStr = new Date().toISOString();
    const copy: ScriptEntity = {
      ...original,
      id: `script-${Date.now()}`,
      name: `${original.name} (Cópia)`,
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    const updated = [copy, ...scriptsEntities];
    saveScriptsEntities(updated);

    upsertScriptToSupabase(copy, currentUser?.id).catch(() => {
      enqueueOfflineMutation('script', 'CREATE', copy.id, copy);
      setPendingMutations(loadPendingQueue());
    });

    showToast({
      type: 'info',
      title: 'Script Duplicado',
      message: `Uma cópia de "${original.name}" foi adicionada.`,
    });
    return copy;
  }, [scriptsEntities, saveScriptsEntities, showToast, currentUser]);

  const deleteScript = useCallback((id: string): boolean => {
    const filtered = scriptsEntities.filter((s) => s.id !== id);
    saveScriptsEntities(filtered);

    deleteScriptFromSupabase(id)
      .then((res) => {
        if (!res.success) {
          enqueueOfflineMutation('script', 'DELETE', id, null);
          setPendingMutations(loadPendingQueue());
        }
      })
      .catch(() => {
        enqueueOfflineMutation('script', 'DELETE', id, null);
        setPendingMutations(loadPendingQueue());
      });

    return true;
  }, [scriptsEntities, saveScriptsEntities]);

  const recordWhatsAppDispatch = useCallback((
    companyId: string,
    scriptId: string,
    status: WhatsAppDispatchStatus,
    notes?: string
  ) => {
    const statusLabels: Record<WhatsAppDispatchStatus, string> = {
      preparado: 'Preparado para envio',
      aberto: 'Aberto no WhatsApp Web/App',
      enviado_manualmente: 'Enviado Manualmente',
      nao_enviado: 'Não Enviado / Cancelado',
    };

    addCompanyTimelineEvent(companyId, {
      type: 'whatsapp_enviado',
      title: `WhatsApp: ${statusLabels[status]}`,
      detail: notes || `Disparo registrado: ${statusLabels[status]}.`,
      author: userName,
    });

    setCompanies((prev) =>
      prev.map((c) => {
        if (c.id === companyId) {
          return {
            ...c,
            lastInteractionDate: new Date().toLocaleDateString('pt-BR'),
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
  }, [addCompanyTimelineEvent, userName]);

  // ==========================================
  // OPERAÇÕES DO MÓDULO DE SERVIÇOS
  // ==========================================
  const addService = useCallback((serviceData: Omit<ServiceEntity, 'id' | 'createdAt' | 'updatedAt' | 'version'>): ServiceEntity => {
    const nowStr = new Date().toLocaleDateString('pt-BR');
    const newService: ServiceEntity = {
      ...serviceData,
      id: `serv-${Date.now()}`,
      version: 1,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    saveServices([newService, ...services]);

    // Persistência real no Supabase
    upsertServiceToSupabase(newService, currentUser?.id)
      .then((res) => {
        if (!res.success) {
          enqueueOfflineMutation('service', 'CREATE', newService.id, newService);
          setPendingMutations(loadPendingQueue());
        }
      })
      .catch(() => {
        enqueueOfflineMutation('service', 'CREATE', newService.id, newService);
        setPendingMutations(loadPendingQueue());
      });

    showToast({
      type: 'success',
      title: 'Serviço Criado',
      message: `${newService.name} agora está disponível com precificação multipaís e funil padrão.`,
    });
    return newService;
  }, [services, saveServices, showToast, currentUser]);

  const updateService = useCallback((id: string, serviceData: Partial<ServiceEntity>) => {
    const existing = services.find((s) => s.id === id);
    if (!existing) return;

    const nowStr = new Date().toLocaleDateString('pt-BR');
    let targetUpdated: ServiceEntity | null = null;
    const updatedServices = services.map((s) => {
      if (s.id !== id) return s;
      const merged = {
        ...s,
        ...serviceData,
        version: (s.version || 1) + 1, // Mantém histórico preservado
        updatedAt: nowStr,
      };
      targetUpdated = merged;
      return merged;
    });

    saveServices(updatedServices);

    if (targetUpdated) {
      upsertServiceToSupabase(targetUpdated, currentUser?.id)
        .then((res) => {
          if (!res.success) {
            enqueueOfflineMutation('service', 'UPDATE', id, serviceData);
            setPendingMutations(loadPendingQueue());
          }
        })
        .catch(() => {
          enqueueOfflineMutation('service', 'UPDATE', id, serviceData);
          setPendingMutations(loadPendingQueue());
        });
    }

    showToast({
      type: 'success',
      title: 'Serviço Atualizado',
      message: `${serviceData.name || existing.name} atualizado. As propostas passadas permanecem protegidas.`,
    });
  }, [services, saveServices, showToast, currentUser]);

  const duplicateService = useCallback((id: string): ServiceEntity | null => {
    const target = services.find((s) => s.id === id);
    if (!target) return null;

    const nowStr = new Date().toLocaleDateString('pt-BR');
    const duplicated: ServiceEntity = {
      ...target,
      id: `serv-${Date.now()}`,
      name: `${target.name} (Cópia)`,
      code: `${target.code}-COP`,
      status: 'draft',
      version: 1,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    saveServices([duplicated, ...services]);
    showToast({
      type: 'info',
      title: 'Serviço Duplicado',
      message: `Cópia criada como rascunho. Ajuste preços ou critérios conforme desejado.`,
    });
    return duplicated;
  }, [services, saveServices, showToast]);

  const archiveService = useCallback((id: string) => {
    const target = services.find((s) => s.id === id);
    const updated = services.map((s) => (s.id === id ? { ...s, status: 'archived' as const } : s));
    saveServices(updated);
    showToast({
      type: 'info',
      title: 'Serviço Arquivado',
      message: `${target?.name || 'Serviço'} foi arquivado com sucesso.`,
    });
  }, [services, saveServices, showToast]);

  const unarchiveService = useCallback((id: string) => {
    const target = services.find((s) => s.id === id);
    const updated = services.map((s) => (s.id === id ? { ...s, status: 'active' as const } : s));
    saveServices(updated);
    showToast({
      type: 'success',
      title: 'Serviço Reativado',
      message: `${target?.name || 'Serviço'} está ativo novamente no catálogo.`,
    });
  }, [services, saveServices, showToast]);

  const deleteService = useCallback((id: string) => {
    const target = services.find((s) => s.id === id);
    const updated = services.filter((s) => s.id !== id);
    saveServices(updated);

    deleteServiceFromSupabase(id)
      .then((res) => {
        if (!res.success) {
          enqueueOfflineMutation('service', 'DELETE', id, null);
          setPendingMutations(loadPendingQueue());
        }
      })
      .catch(() => {
        enqueueOfflineMutation('service', 'DELETE', id, null);
        setPendingMutations(loadPendingQueue());
      });

    showToast({
      type: 'warning',
      title: 'Serviço Excluído',
      message: `${target?.name || 'Serviço'} removido do catálogo.`,
    });
  }, [services, saveServices, showToast]);

  const getServicePriceForCompanyCountry = useCallback((serviceId: string, country?: string): ServiceCountryPrice | null => {
    const s = services.find((item) => item.id === serviceId);
    if (!s) return null;
    return getServicePriceForCompany(s, country);
  }, [services]);

  // ==========================================
  // OPERAÇÕES DO MÓDULO DE FUNIS
  // ==========================================
  const activeFunnel = useMemo(() => {
    return funnels.find((f) => f.id === activeFunnelId) || funnels.find((f) => f.isDefault) || funnels[0];
  }, [funnels, activeFunnelId]);

  const addFunnel = useCallback((funnelData: Omit<FunnelEntity, 'id' | 'createdAt' | 'updatedAt' | 'version'>): FunnelEntity => {
    const nowIso = new Date().toISOString();
    const newFunnel: FunnelEntity = {
      stages: [],
      sequences: [],
      flowNodes: [],
      flowEdges: [],
      flowViewport: { x: 40, y: 40, zoom: 1 },
      funnelScripts: [],
      ...funnelData,
      id: `funnel-${Date.now()}`,
      createdAt: nowIso,
      updatedAt: nowIso,
      version: 1,
    };

    saveFunnels([...funnels, newFunnel]);
    setActiveFunnelId(newFunnel.id);

    // Persistência real no Supabase
    upsertFunnelToSupabase(newFunnel, currentUser?.id)
      .then((res) => {
        if (!res.success) {
          enqueueOfflineMutation('funnel', 'CREATE', newFunnel.id, newFunnel);
          setPendingMutations(loadPendingQueue());
        }
      })
      .catch(() => {
        enqueueOfflineMutation('funnel', 'CREATE', newFunnel.id, newFunnel);
        setPendingMutations(loadPendingQueue());
      });

    showToast({
      type: 'success',
      title: 'Funil Criado',
      message: `Funil "${newFunnel.name}" criado com sucesso.`,
    });
    return newFunnel;
  }, [funnels, saveFunnels, showToast, currentUser]);

  const updateFunnel = useCallback((id: string, updates: Partial<FunnelEntity>) => {
    const existing = funnels.find((f) => f.id === id);
    if (!existing) return;

    const nowIso = new Date().toISOString();
    let targetUpdated: FunnelEntity | null = null;
    const updated = funnels.map((f) => {
      if (f.id !== id) return f;
      const merged = {
        ...f,
        ...updates,
        version: (f.version || 1) + 1,
        updatedAt: nowIso,
      };
      targetUpdated = merged;
      return merged;
    });

    saveFunnels(updated);

    if (targetUpdated) {
      upsertFunnelToSupabase(targetUpdated, currentUser?.id)
        .then((res) => {
          if (!res.success) {
            enqueueOfflineMutation('funnel', 'UPDATE', id, updates);
            setPendingMutations(loadPendingQueue());
          }
        })
        .catch(() => {
          enqueueOfflineMutation('funnel', 'UPDATE', id, updates);
          setPendingMutations(loadPendingQueue());
        });
    }

    showToast({
      type: 'success',
      title: 'Funil Atualizado',
      message: `As alterações em "${updates.name || existing.name}" foram salvas com sucesso.`,
    });
  }, [funnels, saveFunnels, showToast, currentUser]);

  const duplicateFunnel = useCallback((id: string): FunnelEntity | null => {
    const target = funnels.find((f) => f.id === id);
    if (!target) return null;

    const duplicated = duplicateFunnelWithCleanGraph(target, funnels);

    saveFunnels([...funnels, duplicated]);
    setActiveFunnelId(duplicated.id);

    // Persistência real no Supabase
    upsertFunnelToSupabase(duplicated, currentUser?.id).catch(() => {
      enqueueOfflineMutation('funnel', 'CREATE', duplicated.id, duplicated);
      setPendingMutations(loadPendingQueue());
    });

    showToast({
      type: 'info',
      title: 'Funil Duplicado',
      message: `Cópia criada como "${duplicated.name}". Você já pode personalizar as sequências e o fluxo.`,
    });
    return duplicated;
  }, [funnels, saveFunnels, showToast, currentUser]);

  const archiveFunnel = useCallback((id: string) => {
    const target = funnels.find((f) => f.id === id);
    const updated = funnels.map((f) => (f.id === id ? { ...f, status: 'archived' as const } : f));
    saveFunnels(updated);
    showToast({
      type: 'info',
      title: 'Funil Arquivado',
      message: `"${target?.name || 'Funil'}" foi arquivado.`,
    });
  }, [funnels, saveFunnels, showToast]);

  const unarchiveFunnel = useCallback((id: string) => {
    const target = funnels.find((f) => f.id === id);
    const updated = funnels.map((f) => (f.id === id ? { ...f, status: 'active' as const } : f));
    saveFunnels(updated);
    showToast({
      type: 'success',
      title: 'Funil Reativado',
      message: `"${target?.name || 'Funil'}" foi reativado.`,
    });
  }, [funnels, saveFunnels, showToast]);

  const deleteFunnel = useCallback((id: string): boolean => {
    const target = funnels.find((f) => f.id === id);
    const remaining = funnels.filter((f) => f.id !== id);
    saveFunnels(remaining);
    if (activeFunnelId === id) {
      setActiveFunnelId(remaining[0]?.id || '');
    }

    deleteFunnelFromSupabase(id)
      .then((res) => {
        if (!res.success) {
          enqueueOfflineMutation('funnel', 'DELETE', id, null);
          setPendingMutations(loadPendingQueue());
        }
      })
      .catch(() => {
        enqueueOfflineMutation('funnel', 'DELETE', id, null);
        setPendingMutations(loadPendingQueue());
      });

    showToast({
      type: 'warning',
      title: 'Funil Excluído',
      message: `O funil "${target?.name || ''}" foi removido permanentemente.`,
    });
    return true;
  }, [funnels, activeFunnelId, saveFunnels, showToast]);

  const addFunnelStage = useCallback((funnelId: string, stageData: Omit<FunnelStage, 'id' | 'order'>): FunnelStage => {
    let created: FunnelStage | null = null;
    const updated = funnels.map((f) => {
      if (f.id !== funnelId) return f;
      const maxOrder = f.stages.length > 0 ? Math.max(...f.stages.map((s) => s.order)) : -1;
      const newStage: FunnelStage = {
        ...stageData,
        id: `stg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        order: maxOrder + 1,
      };
      created = newStage;
      return {
        ...f,
        stages: [...f.stages, newStage],
        updatedAt: new Date().toISOString(),
      };
    });

    saveFunnels(updated);
    showToast({
      type: 'success',
      title: 'Etapa Adicionada',
      message: `Etapa "${stageData.name}" inserida no fluxo.`,
    });
    return created!;
  }, [funnels, saveFunnels, showToast]);

  const updateFunnelStage = useCallback((funnelId: string, stageId: string, updates: Partial<FunnelStage>) => {
    const updated = funnels.map((f) => {
      if (f.id !== funnelId) return f;
      return {
        ...f,
        stages: f.stages.map((stg) => (stg.id === stageId ? { ...stg, ...updates } : stg)),
        updatedAt: new Date().toISOString(),
      };
    });

    saveFunnels(updated);
    showToast({
      type: 'success',
      title: 'Etapa Atualizada',
      message: 'Configurações de cor, nome e regras semânticas salvas.',
    });
  }, [funnels, saveFunnels, showToast]);

  const removeFunnelStage = useCallback((funnelId: string, stageId: string): boolean => {
    const funnel = funnels.find((f) => f.id === funnelId);
    if (!funnel || funnel.stages.length <= 1) {
      showToast({
        type: 'warning',
        title: 'Ação Bloqueada',
        message: 'O funil deve manter pelo menos uma etapa.',
      });
      return false;
    }

    const updated = funnels.map((f) => {
      if (f.id !== funnelId) return f;
      const filtered = f.stages
        .filter((s) => s.id !== stageId)
        .map((s, idx) => ({ ...s, order: idx }));
      return {
        ...f,
        stages: filtered,
        updatedAt: new Date().toISOString(),
      };
    });

    saveFunnels(updated);
    showToast({
      type: 'info',
      title: 'Etapa Removida',
      message: 'A etapa foi excluída e a ordem do funil foi reorganizada.',
    });
    return true;
  }, [funnels, saveFunnels, showToast]);

  const reorderFunnelStages = useCallback((funnelId: string, orderedStageIds: string[]) => {
    const updated = funnels.map((f) => {
      if (f.id !== funnelId) return f;
      const stageMap = new Map<string, FunnelStage>(f.stages.map((s) => [s.id, s]));
      const reordered: FunnelStage[] = [];

      orderedStageIds.forEach((id, idx) => {
        const item = stageMap.get(id);
        if (item) {
          reordered.push({ ...item, order: idx });
        }
      });

      // Inclui quaisquer etapas residuais
      f.stages.forEach((s) => {
        if (!orderedStageIds.includes(s.id)) {
          reordered.push({ ...s, order: reordered.length });
        }
      });

      return {
        ...f,
        stages: reordered,
        updatedAt: new Date().toISOString(),
      };
    });

    saveFunnels(updated);
  }, [funnels, saveFunnels]);

  // Transição explícita entre etapas com registro cronológico
  const transitionCompanyStage = useCallback((payload: StageTransitionPayload) => {
    const { companyId, targetStageId, targetFunnelId, responsibleName, notes, dealValue } = payload;

    setCompanies((prev) => {
      const company = prev.find((c) => c.id === companyId);
      if (!company) return prev;

      const effFunnelId = targetFunnelId || company.funnelId || activeFunnelId || 'funnel-b2b-default';
      const funnel = funnels.find((f) => f.id === effFunnelId) || funnels[0];
      const targetStage = funnel?.stages.find((s) => s.id === targetStageId);
      if (!targetStage) return prev;

      const previousStageName = company.funnelStageName || 'Etapa inicial';
      const previousStageId = company.funnelStageId || '';

      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const operator = responsibleName || userName || 'Manuel Domingos';

      const isWon = targetStage.id === 'cliente' || 
        targetStage.name.toLowerCase().includes('cliente') || 
        targetStage.name.toLowerCase().includes('ganho');

      const effectiveDealValue = dealValue || (isWon ? (company.dealValue || company.estimatedRevenue || 'R$ 6.800') : company.dealValue);

      const transitionEvent: CompanyTimelineEvent = {
        id: `evt-trans-${Date.now()}`,
        timestamp: `${dateStr} ${timeStr}`,
        type: isWon ? 'alteracao_etapa' : 'alteracao_etapa',
        title: isWon ? `🏆 Negócio Ganho - ${targetStage.name}` : `Transição para "${targetStage.name}"`,
        detail: isWon 
          ? `Negócio fechado e convertido! Valor: ${effectiveDealValue || 'Definido'} | Responsável: ${operator}${notes ? ` | Nota: ${notes}` : ''}`
          : `Etapa anterior: "${previousStageName}" → Nova etapa: "${targetStage.name}" | Responsável: ${operator}${notes ? ` | Nota: ${notes}` : ''}`,
        author: operator,
        metadata: {
          funnelId: funnel.id,
          funnelName: funnel.name,
          previousStageId,
          previousStageName,
          newStageId: targetStage.id,
          newStageName: targetStage.name,
          date: dateStr,
          time: timeStr,
          responsible: operator,
          notes: notes || null,
          dealValue: effectiveDealValue,
          isWon,
        },
      };

      const updatedCompanies = prev.map((c) => {
        if (c.id === companyId) {
          return {
            ...c,
            funnelId: funnel.id,
            funnelStageId: targetStage.id,
            funnelStageName: targetStage.name,
            funnelStage: isWon ? 'cliente' : (targetStage.id as any),
            dealValue: effectiveDealValue,
            closedAt: isWon ? `${dateStr} ${timeStr}` : c.closedAt,
            timeline: [transitionEvent, ...(c.timeline || [])],
            updatedAt: `${dateStr} ${timeStr}`,
          };
        }
        return c;
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('leadion-companies', JSON.stringify(updatedCompanies));
      }

      enqueueOfflineMutation('company', 'UPDATE', companyId, {
        funnelId: funnel.id,
        funnelStageId: targetStage.id,
        funnelStageName: targetStage.name,
        funnelStage: isWon ? 'cliente' : targetStage.id,
        dealValue: effectiveDealValue,
        notes,
      });
      setPendingMutations(loadPendingQueue());

      if (isWon) {
        showToast({
          type: 'success',
          title: '🏆 Negócio Ganho!',
          message: `${company.name} convertido com sucesso! Valor de ${effectiveDealValue} registrado nas estatísticas.`,
        });
      } else {
        showToast({
          type: 'success',
          title: 'Transição Realizada',
          message: `${company.name} avançou para "${targetStage.name}". Histórico registrado.`,
        });
      }

      return updatedCompanies;
    });
  }, [funnels, activeFunnelId, userName, showToast]);

  const todayMetrics = useMemo(() => {
    const dueToday = leads.filter((l) => l.timing.status === 'due_today' || l.timing.status === 'overdue').length;
    const completed = leads.filter((l) => l.timing.status === 'executed' || l.status === 'meeting_scheduled').length;
    const overdue = leads.filter((l) => l.timing.status === 'overdue').length;
    const highScore = leads.filter((l) => l.score >= 90).length;

    return {
      totalDueToday: dueToday,
      completedToday: completed,
      overdueCount: overdue,
      highScoreCount: highScore,
    };
  }, [leads]);

  // ==========================================
  // ARQUITETURA OFFLINE-FIRST & SYNC SUPABASE
  // ==========================================
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return 'offline';
    return 'synced';
  });
  const [pendingMutations, setPendingMutations] = useState<OfflineMutation[]>(() => loadPendingQueue());
  const [syncConflicts, setSyncConflicts] = useState<SyncConflict[]>(() => loadSyncConflicts());
  const [lastSyncTime, setLastSyncTimeState] = useState<string | null>(() => getLastSyncTimestamp() || new Date().toISOString());
  const [lastSyncError, setLastSyncErrorState] = useState<string | null>(() => getLastSyncError());

  // Modais de Sincronização & Gerenciamento de Dados
  const [isSyncCenterModalOpen, setIsSyncCenterModalOpen] = useState(false);
  const [isDataManagementModalOpen, setIsDataManagementModalOpen] = useState(false);
  const [dataManagementDefaultTab, setDataManagementDefaultTab] = useState<'export' | 'import' | 'backup'>('backup');
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [activeConflict, setActiveConflict] = useState<SyncConflict | null>(null);

  const openDataManagementModal = useCallback((tab: 'export' | 'import' | 'backup' = 'backup') => {
    setDataManagementDefaultTab(tab);
    setIsDataManagementModalOpen(true);
  }, []);

  const openConflictResolutionModal = useCallback((conflict: SyncConflict) => {
    setActiveConflict(conflict);
    setIsConflictModalOpen(true);
  }, []);

  // Executa sincronização com Supabase / réplica remota real
  const triggerCloudSync = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    const creds = getSupabaseCredentials();
    if (!creds.isConfigured) {
      setSyncStatus('offline');
      const err = creds.validationError || 'Configuração do Supabase ausente. Verifique: VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY';
      setLastSyncError(err);
      setLastSyncErrorState(err);
      return;
    }

    setSyncStatus('syncing');
    try {
      // 1. Processa mutações offline acumuladas na fila local
      const queue = loadPendingQueue();
      if (queue.length > 0) {
        await processOfflineMutations(
          queue,
          {
            companies,
            actions,
            scripts: scriptsEntities,
            funnels,
            services,
            objections: objectionsEntities,
          },
          currentUser?.id
        );
        setPendingMutations(loadPendingQueue());
      }

      // 2. Puxa estado mais recente do banco PostgreSQL no Supabase
      const remote = await pullAllRemoteData();
      if (remote.hasRemoteData) {
        const cleanRemoteCompanies = (remote.companies || []).filter((c) => !isDemoCompany(c));
        const cleanRemoteActions = (remote.actions || []).filter((a) => !isDemoAction(a));

        if (cleanRemoteCompanies.length > 0) {
          setCompanies(cleanRemoteCompanies);
          if (typeof window !== 'undefined') {
            localStorage.setItem('leadion-companies', JSON.stringify(cleanRemoteCompanies));
          }
        }
        if (cleanRemoteActions.length > 0) {
          setActions(cleanRemoteActions);
          if (typeof window !== 'undefined') {
            localStorage.setItem('leadion-prospect-actions', JSON.stringify(cleanRemoteActions));
          }
        }
        if (remote.scripts.length > 0) {
          setScriptsEntities(remote.scripts);
          if (typeof window !== 'undefined') {
            localStorage.setItem('leadion-scripts-v2', JSON.stringify(remote.scripts));
          }
        }
        if (remote.funnels.length > 0) {
          setFunnels(remote.funnels);
          if (typeof window !== 'undefined') {
            localStorage.setItem('leadion-funnels-v1', JSON.stringify(remote.funnels));
          }
        }
        if (remote.services.length > 0) {
          setServices(remote.services);
          if (typeof window !== 'undefined') {
            localStorage.setItem('leadion-services-v2', JSON.stringify(remote.services));
          }
        }
        if (remote.objections.length > 0) {
          setObjectionsEntities(remote.objections);
          if (typeof window !== 'undefined') {
            localStorage.setItem('leadion_objections_library_v1', JSON.stringify(remote.objections));
          }
        }
        if (remote.qualificationQuestions && remote.qualificationQuestions.length > 0) {
          setQualificationQuestions(remote.qualificationQuestions);
          if (typeof window !== 'undefined') {
            localStorage.setItem('leadion-qualification-questions-v1', JSON.stringify(remote.qualificationQuestions));
          }
        }
        if (remote.qualificationAnswers && Object.keys(remote.qualificationAnswers).length > 0) {
          setQualificationAnswers(remote.qualificationAnswers);
          if (typeof window !== 'undefined') {
            localStorage.setItem('leadion-qualification-answers-v1', JSON.stringify(remote.qualificationAnswers));
          }
        }
      }

      const nowIso = new Date().toISOString();
      setLastSyncTimestamp(nowIso);
      setLastSyncTimeState(nowIso);
      setLastSyncError(null);
      setLastSyncErrorState(null);
      setSyncStatus('synced');
    } catch (err: any) {
      setSyncStatus('error');
      const msg = err.message || 'Falha na sincronização com Supabase';
      setLastSyncError(msg);
      setLastSyncErrorState(msg);
    }
  }, [companies, actions, scriptsEntities, funnels, services, objectionsEntities, currentUser]);

  // ----------------------------------------------------
  // HYDRATAÇÃO INICIAL REAL DO SUPABASE + ESCUTA DE AUTH
  // ----------------------------------------------------
  React.useEffect(() => {
    let isMounted = true;

    async function initializeSupabaseIntegration() {
      try {
        // Diagnóstico seguro e sanitizado da conexão Supabase (sem expor credenciais)
        runSupabaseDiagnostics().catch(() => {});

        const session = await getCurrentSession();
        if (isMounted) {
          setCurrentSession(session);
          setCurrentUser(session?.user || null);
          if (session?.user?.user_metadata?.full_name) {
            setUserNameState(session.user.user_metadata.full_name);
          }
          setAuthLoading(false);
        }

        // Purga ativa e segura de registros demo diretamente no Supabase
        const client = getSupabaseClient();
        if (client) {
          purgeDemoDataFromSupabase(client).catch((e) => console.warn('Supabase purge:', e));
        }

        // Não sobrescreve dados locais se o usuário estiver usando Conta Local ou desconectado
        if (!session && (!userAccount || userAccount.accountType === 'local')) {
          return;
        }

        // Puxa empresas diretamente do Supabase e dados remotos consolidados
        const [remote, compRes] = await Promise.all([
          pullAllRemoteData(),
          fetchCompaniesFromSupabase()
        ]);
        if (!isMounted) return;

        const cleanDbCompanies = (compRes.data || []).filter((c) => !isDemoCompany(c));
        const cleanRemoteCompanies = (remote.companies || []).filter((c) => !isDemoCompany(c));
        const cleanRemoteActions = (remote.actions || []).filter((a) => !isDemoAction(a));

        if (compRes.success) {
          // Preserva e mescla dados locais que ainda não existam no servidor
          setCompanies((prevLocal) => {
            const unsynced = prevLocal.filter(
              (loc) => !cleanDbCompanies.some((rem) => rem.id === loc.id || (loc.remote_id && rem.id === loc.remote_id))
            );
            const merged = [...cleanDbCompanies, ...unsynced];
            if (typeof window !== 'undefined') {
              localStorage.setItem('leadion-companies', JSON.stringify(merged));
            }
            idbBulkPut(STORES.COMPANIES, merged).catch(() => {});
            return merged;
          });
        } else if (remote.hasRemoteData) {
          setCompanies((prevLocal) => {
            const unsynced = prevLocal.filter(
              (loc) => !cleanRemoteCompanies.some((rem) => rem.id === loc.id || (loc.remote_id && rem.id === loc.remote_id))
            );
            const merged = [...cleanRemoteCompanies, ...unsynced];
            if (typeof window !== 'undefined') {
              localStorage.setItem('leadion-companies', JSON.stringify(merged));
            }
            idbBulkPut(STORES.COMPANIES, merged).catch(() => {});
            return merged;
          });
        }

        if (remote.hasRemoteData) {
          if (cleanRemoteActions.length > 0) {
            setActions(cleanRemoteActions);
            if (typeof window !== 'undefined') {
              localStorage.setItem('leadion-prospect-actions', JSON.stringify(cleanRemoteActions));
            }
          }
          if (remote.scripts.length > 0) {
            setScriptsEntities(remote.scripts);
            if (typeof window !== 'undefined') {
              localStorage.setItem('leadion-scripts-v2', JSON.stringify(remote.scripts));
            }
          }
          if (remote.funnels.length > 0) {
            setFunnels(remote.funnels);
            if (typeof window !== 'undefined') {
              localStorage.setItem('leadion-funnels-v1', JSON.stringify(remote.funnels));
            }
          }
          if (remote.services.length > 0) {
            setServices(remote.services);
            if (typeof window !== 'undefined') {
              localStorage.setItem('leadion-services-v2', JSON.stringify(remote.services));
            }
          }
          if (remote.objections.length > 0) {
            setObjectionsEntities(remote.objections);
            if (typeof window !== 'undefined') {
              localStorage.setItem('leadion_objections_library_v1', JSON.stringify(remote.objections));
            }
          }
          if (remote.qualificationQuestions && remote.qualificationQuestions.length > 0) {
            setQualificationQuestions(remote.qualificationQuestions);
            if (typeof window !== 'undefined') {
              localStorage.setItem('leadion-qualification-questions-v1', JSON.stringify(remote.qualificationQuestions));
            }
          }
          if (remote.qualificationAnswers && Object.keys(remote.qualificationAnswers).length > 0) {
            setQualificationAnswers(remote.qualificationAnswers);
            if (typeof window !== 'undefined') {
              localStorage.setItem('leadion-qualification-answers-v1', JSON.stringify(remote.qualificationAnswers));
            }
          }
          setSyncStatus('synced');
          const nowIso = new Date().toISOString();
          setLastSyncTimestamp(nowIso);
          setLastSyncTimeState(nowIso);
        }
      } catch (err) {
        console.warn('Iniciando em modo offline / cache local:', err);
      }
    }

    initializeSupabaseIntegration();

    const { unsubscribe } = subscribeToAuthChanges((_evt, session) => {
      if (isMounted) {
        setCurrentSession(session);
        setCurrentUser(session?.user || null);
        if (session?.user?.user_metadata?.full_name) {
          setUserNameState(session.user.user_metadata.full_name);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Monitora eventos de rede
  React.useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('syncing');
      showToast({
        type: 'success',
        title: 'Conexão Restabelecida',
        message: 'Rede ativa. Sincronizando dados pendentes...',
      });
      triggerCloudSync();
    };

    const handleOffline = () => {
      setSyncStatus('offline');
      showToast({
        type: 'warning',
        title: 'Modo Offline Ativo',
        message: 'O Leadion continua operando normalmente. Suas alterações estão seguras localmente.',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast, triggerCloudSync]);

  // Resolução de Conflitos
  const resolveActiveConflict = useCallback((
    conflictId: string,
    strategy: 'keep_local' | 'keep_remote' | 'custom_merge',
    customData?: Record<string, any>
  ) => {
    resolveSyncConflict(conflictId, strategy);
    const updatedConflicts = loadSyncConflicts();
    setSyncConflicts(updatedConflicts);
    setIsConflictModalOpen(false);
    setActiveConflict(null);

    const conf = syncConflicts.find((c) => c.id === conflictId);
    if (conf && (strategy === 'keep_remote' || strategy === 'custom_merge')) {
      const finalData = strategy === 'keep_remote' ? conf.remoteData : (customData || conf.localData);
      if (conf.entityType === 'company') {
        updateCompany(conf.entityId, finalData);
      }
    }

    showToast({
      type: 'success',
      title: 'Conflito Resolvido',
      message: `Estratégia "${strategy === 'keep_local' ? 'Manter Local' : strategy === 'keep_remote' ? 'Aceitar Nuvem' : 'Mesclagem'}" aplicada com sucesso.`,
    });
  }, [syncConflicts, updateCompany, showToast]);

  // Restauração Completa de Estado
  const restoreEntireState = useCallback((payload: LeadionBackupPayload, mode: 'merge' | 'replace') => {
    // 1. Snapshot automático de segurança
    const currentPayload: LeadionBackupPayload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      exportedByDeviceId: getOrCreateDeviceId(),
      deviceName: getDeviceName(),
      system: 'LEADION Sales OS',
      metadata: {
        totalCompanies: companies.length,
        totalScripts: scriptsEntities.length,
        totalFunnels: funnels.length,
        totalServices: services.length,
        totalActions: actions.length,
        totalObjections: objectionsEntities.length,
      },
      companies,
      leads,
      scripts: scriptsEntities,
      funnels,
      services,
      actions,
      objections: objectionsEntities,
      qualificationQuestions,
      qualificationAnswers,
      priorityWeights,
    };
    saveLocalBackupSnapshot('Auto-Snapshot Pré-Restauração', currentPayload);

    if (mode === 'replace') {
      if (payload.companies) {
        const cleanPayloadCompanies = payload.companies.filter((c: Company) => !isDemoCompany(c));
        setCompanies(cleanPayloadCompanies);
        localStorage.setItem('leadion-companies', JSON.stringify(cleanPayloadCompanies));
      }
      if (payload.leads) {
        const cleanPayloadLeads = payload.leads.filter((l: Lead) => !isDemoLead(l));
        setLeads(cleanPayloadLeads);
        localStorage.setItem('leadion-leads', JSON.stringify(cleanPayloadLeads));
      }
      if (payload.scripts) {
        setScriptsEntities(payload.scripts);
        localStorage.setItem('leadion-scripts-v2', JSON.stringify(payload.scripts));
      }
      if (payload.funnels) {
        setFunnels(payload.funnels);
        localStorage.setItem('leadion-funnels-v1', JSON.stringify(payload.funnels));
      }
      if (payload.services) {
        setServices(payload.services);
        localStorage.setItem('leadion-services-v2', JSON.stringify(payload.services));
      }
      if (payload.actions) {
        const cleanPayloadActions = payload.actions.filter((a: ProspectAction) => !isDemoAction(a));
        setActions(cleanPayloadActions);
        localStorage.setItem('leadion-prospect-actions-v2', JSON.stringify(cleanPayloadActions));
      }
      if (payload.objections) {
        setObjectionsEntities(payload.objections);
        localStorage.setItem('leadion_objections_library_v1', JSON.stringify(payload.objections));
      }
      if (payload.qualificationQuestions) {
        setQualificationQuestions(payload.qualificationQuestions);
        localStorage.setItem('leadion-qualification-questions-v1', JSON.stringify(payload.qualificationQuestions));
      }
      if (payload.qualificationAnswers) {
        setQualificationAnswers(payload.qualificationAnswers);
        localStorage.setItem('leadion-qualification-answers-v1', JSON.stringify(payload.qualificationAnswers));
      }
      if (payload.priorityWeights) {
        updatePriorityWeights(payload.priorityWeights);
      }
    } else {
      if (payload.companies) {
        const mergedComp = [...companies];
        payload.companies.filter((c: Company) => !isDemoCompany(c)).forEach((incoming) => {
          const idx = mergedComp.findIndex((c) => c.id === incoming.id || (c.name.toLowerCase().trim() === incoming.name.toLowerCase().trim()));
          if (idx >= 0) {
            const existing = mergedComp[idx];
            mergedComp[idx] = {
              ...existing,
              ...incoming,
              timeline: [...(existing.timeline || []), ...(incoming.timeline || [])].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i),
              activities: [...(existing.activities || []), ...(incoming.activities || [])].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i),
            };
          } else {
            mergedComp.push(incoming);
          }
        });
        setCompanies(mergedComp);
        localStorage.setItem('leadion-companies', JSON.stringify(mergedComp));
      }
      if (payload.scripts) {
        const mergedScripts = [...scriptsEntities];
        payload.scripts.forEach((sc) => {
          if (!mergedScripts.some((s) => s.id === sc.id)) mergedScripts.push(sc);
        });
        setScriptsEntities(mergedScripts);
        localStorage.setItem('leadion-scripts-v2', JSON.stringify(mergedScripts));
      }
    }

    enqueueOfflineMutation('company', 'UPDATE', 'bulk-restore', { mode, timestamp: new Date().toISOString() });
    setPendingMutations(loadPendingQueue());
  }, [companies, scriptsEntities, funnels, services, actions, objectionsEntities, qualificationQuestions, qualificationAnswers, priorityWeights, leads, savePriorityWeights]);

  // Importação Tabular de Empresas
  const importCompaniesList = useCallback((imported: Partial<Company>[], mode: 'merge' | 'create_only') => {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setCompanies((prev) => {
      const result = [...prev];
      imported.forEach((item) => {
        const name = item.name?.trim();
        if (!name) return;

        const existingIdx = result.findIndex((c) => c.name.toLowerCase().trim() === name.toLowerCase().trim());

        if (existingIdx >= 0 && mode === 'merge') {
          result[existingIdx] = {
            ...result[existingIdx],
            ...item,
            updatedAt: formattedDate,
          };
        } else if (existingIdx < 0) {
          const newComp: Company = {
            id: `comp-imp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: name,
            niche: item.niche || 'Geral B2B',
            country: item.country || 'Moçambique',
            city: item.city || 'Maputo',
            state: item.state || '',
            location: item.location || `${item.city || 'Maputo'} - ${item.country || 'Moçambique'}`,
            address: item.address || '',
            website: item.website || '',
            phone: item.phone || '',
            whatsapp: item.whatsapp || item.phone || '',
            email: item.email || '',
            additionalContacts: [],
            socials: {},
            responsibles: [
              {
                id: `resp-${Date.now()}`,
                name: 'Decisor Principal',
                role: 'Diretor / Sócio',
                phone: item.phone || '',
                whatsapp: item.phone || '',
                email: item.email || '',
                notes: '',
                isPrimary: true,
              }
            ],
            unitsCount: 1,
            businessType: 'B2B',
            size: '11-50 colaboradores',
            leadSource: 'Importação CSV',
            status: 'active',
            associatedServices: [],
            funnelId: 'funnel-b2b-default',
            funnelStage: 'prospeccao',
            funnelStageId: 'stg-primeira-abordagem',
            funnelStageName: 'Primeira abordagem',
            score: 75,
            commercialNotes: item.commercialNotes || 'Importado via CSV',
            timeline: [
              {
                id: `evt-imp-${Date.now()}`,
                timestamp: `${formattedDate} ${formattedTime}`,
                type: 'empresa_criada',
                title: 'Empresa importada',
                detail: 'Cadastro realizado por importação tabular CSV.',
                author: 'Sistema (Importador)',
              }
            ],
            activities: [],
            createdAt: formattedDate,
            updatedAt: formattedDate,
            segment: item.niche || 'Geral B2B',
            domain: item.website || '',
            icpScore: 75,
            employeesRange: '11-50 colaboradores',
            recentTriggers: ['Empresa recém-importada'],
            activeLeadsCount: 1,
          };
          result.push(newComp);
        }
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('leadion-companies', JSON.stringify(result));
      }
      return result;
    });

    enqueueOfflineMutation('company', 'CREATE', 'bulk-csv-import', { count: imported.length });
    setPendingMutations(loadPendingQueue());
  }, []);

  // Simulação de conflito remoto para testes de robustez
  const simulateRemoteConflict = useCallback(() => {
    if (companies.length === 0) return;
    const target = companies[0];
    const conflict = recordSyncConflict({
      entityType: 'company',
      entityId: target.id,
      entityTitle: target.name,
      localVersion: (target as any).version || 1,
      remoteVersion: ((target as any).version || 1) + 1,
      localTimestamp: new Date().toISOString(),
      remoteTimestamp: new Date(Date.now() - 3600000).toISOString(),
      localData: {
        phone: target.phone,
        funnelStageName: target.funnelStageName || 'Qualificação',
        score: target.score || 80,
      },
      remoteData: {
        phone: '+258 84 999 8888',
        funnelStageName: 'Proposta Apresentada',
        score: 95,
      },
      conflictingFields: ['phone', 'funnelStageName', 'score'],
    });

    setSyncConflicts(loadSyncConflicts());
    openConflictResolutionModal(conflict);
    showToast({
      type: 'warning',
      title: 'Conflito Simulado',
      message: `Simulação de edição concorrente no dispositivo remoto criada para ${target.name}.`,
    });
  }, [companies, openConflictResolutionModal, showToast]);

  // ==========================================
  // CONTA LOCAL & ONLINE (DUAL ENGINE)
  // ==========================================
  const createLocalAccount = useCallback(async (data: {
    fullName: string;
    companyName: string;
    sector?: string;
    country?: string;
    state?: string;
    region?: string;
    phone?: string;
    whatsapp?: string;
    localCredential?: string;
  }) => {
    const localUserId = 'usr-' + generateSecureUUID();
    const localWorkspaceId = 'wsp-' + generateSecureUUID();
    const deviceId = getOrCreateDeviceId();
    const now = new Date().toISOString();

    const newAccount: UserAccount = {
      userId: localUserId,
      workspaceId: localWorkspaceId,
      accountType: 'local',
      fullName: data.fullName,
      companyName: data.companyName,
      sector: data.sector || '',
      country: data.country || 'Brasil',
      state: data.state || '',
      region: data.region || '',
      phone: data.phone || '',
      whatsapp: data.whatsapp || '',
      localCredential: data.localCredential || data.fullName,
      deviceId,
      createdAt: now,
      updatedAt: now,
    };

    const newWorkspace: WorkspaceProfile = {
      id: localWorkspaceId,
      name: data.companyName,
      sector: data.sector,
      country: data.country,
      state: data.state,
      region: data.region,
      ownerId: localUserId,
      isLocalOnly: true,
      createdAt: now,
      updatedAt: now,
    };

    setUserAccount(newAccount);
    setWorkspaceProfile(newWorkspace);
    setUserName(data.fullName);

    if (typeof window !== 'undefined') {
      localStorage.setItem('leadion_user_account', JSON.stringify(newAccount));
      localStorage.setItem('leadion_workspace_profile', JSON.stringify(newWorkspace));
    }

    await idbPut(STORES.ACCOUNTS, newAccount);
    await idbPut(STORES.WORKSPACES, newWorkspace);

    setSyncStatus('offline');
    return newAccount;
  }, [setUserName]);

  const createOnlineAccount = useCallback(async (data: {
    fullName: string;
    email: string;
    password: string;
    companyName: string;
    sector?: string;
    country?: string;
    state?: string;
    region?: string;
    phone?: string;
    whatsapp?: string;
  }) => {
    const signUpRes = await signUpWithEmail(data.email, data.password, data.fullName);
    if (!signUpRes.success) {
      return { success: false, error: signUpRes.error };
    }

    const remoteUserId = signUpRes.user?.id || 'usr-' + generateSecureUUID();
    const workspaceId = 'wsp-' + generateSecureUUID();
    const deviceId = getOrCreateDeviceId();
    const now = new Date().toISOString();

    const newAccount: UserAccount = {
      userId: remoteUserId,
      workspaceId,
      accountType: 'online',
      fullName: data.fullName,
      email: data.email,
      companyName: data.companyName,
      sector: data.sector || '',
      country: data.country || 'Brasil',
      state: data.state || '',
      region: data.region || '',
      phone: data.phone || '',
      whatsapp: data.whatsapp || '',
      deviceId,
      createdAt: now,
      updatedAt: now,
      syncedAt: now,
    };

    const newWorkspace: WorkspaceProfile = {
      id: workspaceId,
      name: data.companyName,
      sector: data.sector,
      country: data.country,
      state: data.state,
      region: data.region,
      ownerId: remoteUserId,
      isLocalOnly: false,
      createdAt: now,
      updatedAt: now,
    };

    setUserAccount(newAccount);
    setWorkspaceProfile(newWorkspace);
    setUserName(data.fullName);
    setCurrentUser(signUpRes.user || null);

    if (typeof window !== 'undefined') {
      localStorage.setItem('leadion_user_account', JSON.stringify(newAccount));
      localStorage.setItem('leadion_workspace_profile', JSON.stringify(newWorkspace));
    }

    await idbPut(STORES.ACCOUNTS, newAccount);
    await idbPut(STORES.WORKSPACES, newWorkspace);

    setSyncStatus('synced');
    setLastSyncTimestamp(now);

    return { success: true };
  }, [setUserName]);

  const linkLocalAccountToCloud = useCallback(async (email: string, pass: string) => {
    if (!userAccount) {
      return { success: false, error: 'Nenhuma conta local ativa para vincular.' };
    }

    // 1. Cria usuário no Supabase Auth
    const signUpRes = await signUpWithEmail(email, pass, userAccount.fullName);
    if (!signUpRes.success) {
      return { success: false, error: signUpRes.error || 'Falha ao autenticar na nuvem.' };
    }

    const remoteUserId = signUpRes.user?.id || 'usr-' + generateSecureUUID();
    const now = new Date().toISOString();

    // 2. Mapeia dados locais (preservando local_id e setando remote_id e sync_status)
    const updatedCompanies = companies.map((c) => ({
      ...c,
      local_id: c.local_id || c.id,
      remote_id: c.remote_id || c.id,
      sync_status: 'synced' as const,
      synced_at: now,
      updatedAt: now,
    }));
    setCompanies(updatedCompanies);
    if (typeof window !== 'undefined') {
      localStorage.setItem('leadion-companies', JSON.stringify(updatedCompanies));
    }
    await idbBulkPut(STORES.COMPANIES, updatedCompanies);

    const updatedActions = actions.map((a) => ({
      ...a,
      local_id: (a as any).local_id || a.id,
      sync_status: 'synced' as const,
      synced_at: now,
    }));
    setActions(updatedActions);
    if (typeof window !== 'undefined') {
      localStorage.setItem('leadion-prospect-actions', JSON.stringify(updatedActions));
    }
    await idbBulkPut(STORES.ACTIONS, updatedActions);

    // 3. Envia os dados para o Supabase
    for (const comp of updatedCompanies) {
      await upsertCompanyToSupabase(comp, remoteUserId);
    }
    for (const act of updatedActions) {
      await upsertActionToSupabase(act, remoteUserId);
    }
    for (const scr of scriptsEntities) {
      await upsertScriptToSupabase(scr, remoteUserId);
    }
    for (const fun of funnels) {
      await upsertFunnelToSupabase(fun, remoteUserId);
    }
    for (const srv of services) {
      await upsertServiceToSupabase(srv, remoteUserId);
    }
    for (const obj of objectionsEntities) {
      await upsertObjectionToSupabase(obj, remoteUserId);
    }

    // 4. Limpa a fila pois todos os dados locais foram consolidados
    clearPendingQueue();
    setPendingMutations([]);

    // 5. Atualiza a conta para Online
    const updatedAccount: UserAccount = {
      ...userAccount,
      accountType: 'online',
      userId: remoteUserId,
      email: email,
      updatedAt: now,
      syncedAt: now,
    };

    setUserAccount(updatedAccount);
    setCurrentUser(signUpRes.user || null);

    if (typeof window !== 'undefined') {
      localStorage.setItem('leadion_user_account', JSON.stringify(updatedAccount));
    }
    await idbPut(STORES.ACCOUNTS, updatedAccount);

    setSyncStatus('synced');
    setLastSyncTimestamp(now);

    return { success: true };
  }, [userAccount, companies, actions, scriptsEntities, funnels, services, objectionsEntities]);

  const logoutAccount = useCallback(async () => {
    await signOutUser();
    setCurrentUser(null);
    setCurrentSession(null);
    setUserAccount(null);
    setWorkspaceProfile(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('leadion_user_account');
      localStorage.removeItem('leadion_workspace_profile');
      localStorage.removeItem('leadion-selected-company-id');
    }
  }, []);

  // Escuta de conectividade real com auto-sync ao reconectar
  React.useEffect(() => {
    const unsubscribe = connectivityEngine.subscribe(({ connectivity }) => {
      if (connectivity === 'online') {
        setSyncStatus((prev) => {
          if (prev === 'syncing') return 'syncing';
          return pendingMutations.length > 0 ? 'pending' : 'synced';
        });
        // Dispara sync em background se for conta online
        if (userAccount?.accountType === 'online') {
          triggerCloudSync().catch(() => {});
        }
      } else if (connectivity === 'offline') {
        setSyncStatus('offline');
      }
    });

    return () => unsubscribe();
  }, [pendingMutations.length, userAccount?.accountType, triggerCloudSync]);

  return (
    <LeadionContext.Provider
      value={{
        activeNav,
        setActiveNav,
        userName,
        setUserName,
        greeting,
        actions,
        planAction,
        completeAction,
        cancelAction,
        reopenAction,
        openWhatsAppAction,
        priorityWeights,
        updatePriorityWeights,
        isPlanningModalOpen,
        setIsPlanningModalOpen,
        planningPreselectedCompany,
        setPlanningPreselectedCompany,
        isPriorityModalOpen,
        setIsPriorityModalOpen,
        quickViewCompany,
        setQuickViewCompany,
        companyNeedingNextAction,
        setCompanyNeedingNextAction,
        unplannedCompanies,
        actionCounters,
        leads,
        selectedLead,
        setSelectedLead,
        isDrawerOpen,
        setIsDrawerOpen,
        prospectFilter,
        setProspectFilter,
        searchQuery,
        setSearchQuery,
        executeLeadAction,
        updateLeadStatus,
        snoozeLead,
        addNewLead,
        companies,
        selectedCompany,
        setSelectedCompany,
        isNewCompanyModalOpen,
        setIsNewCompanyModalOpen,
        editingCompany,
        setEditingCompany,
        addCompany,
        updateCompany,
        deleteCompany,
        archiveCompany,
        unarchiveCompany,
        duplicateCompany,
        addCompanyTimelineEvent,
        addCompanyActivity,
        toggleCompanyActivity,
        checkCompanyDuplicate,
        objections,
        services,
        addService,
        updateService,
        duplicateService,
        archiveService,
        unarchiveService,
        deleteService,
        getServicePriceForCompanyCountry,
        isServiceModalOpen,
        setIsServiceModalOpen,
        editingService,
        setEditingService,
        selectedServiceDetail,
        setSelectedServiceDetail,
        funnels,
        activeFunnelId,
        setActiveFunnelId,
        activeFunnel,
        addFunnel,
        updateFunnel,
        duplicateFunnel,
        archiveFunnel,
        unarchiveFunnel,
        deleteFunnel,
        addFunnelStage,
        updateFunnelStage,
        removeFunnelStage,
        reorderFunnelStages,
        transitionCompanyStage,
        isFunnelModalOpen,
        setIsFunnelModalOpen,
        editingFunnel,
        setEditingFunnel,
        isFunnelStagesModalOpen,
        setIsFunnelStagesModalOpen,
        activeFunnelForStages,
        setActiveFunnelForStages,
        scripts,
        scriptsEntities,
        createScript,
        updateScript,
        duplicateScript,
        deleteScript,
        recordWhatsAppDispatch,
        isScriptModalOpen,
        setIsScriptModalOpen,
        editingScript,
        setEditingScript,
        isWhatsAppModalOpen,
        setIsWhatsAppModalOpen,
        whatsAppModalData,
        openWhatsAppForCompany,
        isObjectionModalOpen,
        setIsObjectionModalOpen,
        objectionModalData,
        openObjectionModal,

        // Biblioteca de Objeções & Mini-Funis
        objectionsEntities,
        addObjection,
        updateObjection,
        duplicateObjection,
        deleteObjection,
        addSequenceToObjection,
        updateSequenceInObjection,
        deleteSequenceFromObjection,
        addStepToObjectionSequence,
        updateStepInObjectionSequence,
        deleteStepFromObjectionSequence,
        recordObjectionHandled,
        isObjectionBuilderModalOpen,
        setIsObjectionBuilderModalOpen,
        editingObjectionEntity,
        setEditingObjectionEntity,
        isObjectionSequenceModalOpen,
        setIsObjectionSequenceModalOpen,
        editingObjectionSequence,
        setEditingObjectionSequence,
        isObjectionDispatchModalOpen,
        setIsObjectionDispatchModalOpen,
        objectionDispatchData,
        openObjectionDispatchModal,

        // Outcome Modal
        isOutcomeModalOpen,
        setIsOutcomeModalOpen,
        outcomeModalAction,
        setOutcomeModalAction,
        openActionOutcomeModal,
        closeActionOutcomeModal,
        resolveActionWithOutcome,

        isNewLeadModalOpen,
        setIsNewLeadModalOpen,
        todayMetrics,

        // Motor de Qualificação & Scores
        qualificationQuestions,
        addQualificationQuestion,
        updateQualificationQuestion,
        deleteQualificationQuestion,
        qualificationAnswers,
        saveCompanyQualificationAnswers,
        getCompanyScoreResult,

        // Offline-First & Sync Engine
        syncStatus,
        pendingMutations,
        syncConflicts,
        lastSyncTime,
        lastSyncError,
        triggerCloudSync,
        isSyncCenterModalOpen,
        setIsSyncCenterModalOpen,
        isDataManagementModalOpen,
        setIsDataManagementModalOpen,
        dataManagementDefaultTab,
        openDataManagementModal,
        isConflictModalOpen,
        setIsConflictModalOpen,
        activeConflict,
        openConflictResolutionModal,
        resolveActiveConflict,
        restoreEntireState,
        importCompaniesList,
        simulateRemoteConflict,

        // Supabase Auth & Session
        currentUser,
        currentSession,
        authLoading,
        signIn,
        signUp,
        signOut,
        isAuthModalOpen,
        setIsAuthModalOpen,
        openAuthModal,

        // Dual Engine Account (Local / Online)
        userAccount,
        workspaceProfile,
        createLocalAccount,
        createOnlineAccount,
        linkLocalAccountToCloud,
        logoutAccount,
        isLinkModalOpen,
        setIsLinkModalOpen,
        openLinkModal,
      }}
    >
      {children}
    </LeadionContext.Provider>
  );
}

export function useLeadion() {
  const context = useContext(LeadionContext);
  if (!context) {
    throw new Error('useLeadion must be used within a LeadionProvider');
  }
  return context;
}

