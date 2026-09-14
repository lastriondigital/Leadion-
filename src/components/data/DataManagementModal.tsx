import React, { useState, useRef } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { 
  Download, 
  Upload, 
  Database, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  History, 
  HardDrive, 
  Trash2, 
  Layers,
  ArrowRight,
  ShieldCheck,
  Info,
  X
} from 'lucide-react';
import { 
  exportDatabaseToJson, 
  exportCompaniesToCsv, 
  exportActivitiesToCsv, 
  exportPipelineToCsv,
  parseAndValidateJsonBackup,
  parseCsvContent,
  autoMapCsvHeaders,
  listLocalBackupSlots,
  saveLocalBackupSnapshot,
  deleteLocalBackupSlot,
  LocalBackupSlot
} from '../../core/backup/backupEngine';
import { 
  uploadCloudBackup, 
  listCloudBackups, 
  downloadCloudBackup, 
  CloudBackupMetadata 
} from '../../core/supabase/supabaseClient';
import { getDeviceName } from '../../core/storage/offlineEngine';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'export' | 'import' | 'backup';
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'backup',
}) => {
  if (!isOpen) return null;

  const {
    companies,
    leads,
    scriptsEntities,
    funnels,
    services,
    actions,
    objectionsEntities,
    qualificationQuestions,
    qualificationAnswers,
    priorityWeights,
    // Context restoration / bulk import methods:
    restoreEntireState,
    importCompaniesList,
    triggerCloudSync
  } = useLeadion() as any;

  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'backup'>(defaultTab);

  // Estados de Backup
  const [localSlots, setLocalSlots] = useState<LocalBackupSlot[]>(() => listLocalBackupSlots());
  const [cloudBackups, setCloudBackups] = useState<CloudBackupMetadata[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(false);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);

  // Estados de Importação JSON
  const [jsonFileContent, setJsonFileContent] = useState<string | null>(null);
  const [jsonPreview, setJsonPreview] = useState<any | null>(null);
  const [jsonImportMode, setJsonImportMode] = useState<'merge' | 'replace'>('merge');

  // Estados de Importação CSV
  const [csvFileContent, setCsvFileContent] = useState<string | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [csvColumnMap, setCsvColumnMap] = useState<Record<string, number>>({});
  const [csvImportMode, setCsvImportMode] = useState<'merge' | 'create_only'>('merge');

  const fileInputJsonRef = useRef<HTMLInputElement>(null);
  const fileInputCsvRef = useRef<HTMLInputElement>(null);

  // Carrega backups da nuvem quando a aba de backup é acessada
  React.useEffect(() => {
    if (activeTab === 'backup') {
      loadCloudBackupsList();
    }
  }, [activeTab]);

  const loadCloudBackupsList = async () => {
    setIsLoadingCloud(true);
    try {
      const list = await listCloudBackups();
      setCloudBackups(list);
    } catch {
      // fallback
    } finally {
      setIsLoadingCloud(false);
    }
  };

  // HANDLERS DE EXPORTAÇÃO
  const handleExportJson = () => {
    exportDatabaseToJson({
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
    });
    showToast('Backup JSON completo exportado com sucesso!', 'success');
  };

  const handleExportCompaniesCsv = () => {
    exportCompaniesToCsv(companies);
    showToast(`${companies.length} empresas exportadas em CSV (Excel).`, 'success');
  };

  const handleExportActivitiesCsv = () => {
    exportActivitiesToCsv(companies);
    showToast('Histórico completo de atividades exportado em CSV.', 'success');
  };

  const handleExportPipelineCsv = () => {
    exportPipelineToCsv(actions, companies);
    showToast(`${actions.length} ações do pipeline exportadas em CSV.`, 'success');
  };

  // HANDLERS DE BACKUP
  const handleCreateLocalBackup = () => {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      exportedByDeviceId: 'device-local',
      deviceName: getDeviceName(),
      system: 'LEADION Sales OS' as const,
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

    const slot = saveLocalBackupSnapshot(`Snapshot ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, payload);
    setLocalSlots(listLocalBackupSlots());
    showToast('Snapshot local salvo no navegador com sucesso.', 'success');
  };

  const handleCreateCloudBackup = async () => {
    setIsBackingUp(true);
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      exportedByDeviceId: 'device-local',
      deviceName: getDeviceName(),
      system: 'LEADION Sales OS' as const,
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

    try {
      const res = await uploadCloudBackup(
        payload,
        `Backup Nuvem ${new Date().toLocaleDateString()}`,
        getDeviceName()
      );
      showToast(res.message, 'success');
      loadCloudBackupsList();
    } catch (err: any) {
      showToast('Falha ao enviar backup para a nuvem: ' + err.message, 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreSlot = (slot: LocalBackupSlot) => {
    if (window.confirm(`Deseja restaurar o snapshot "${slot.name}" de ${new Date(slot.createdAt).toLocaleString()}? Isso aplicará os dados preservando a integridade histórica.`)) {
      if (restoreEntireState) {
        restoreEntireState(slot.payload, 'replace');
        showToast('Snapshot restaurado com sucesso!', 'success');
        onClose();
      }
    }
  };

  const handleDeleteSlot = (id: string) => {
    deleteLocalBackupSlot(id);
    setLocalSlots(listLocalBackupSlots());
    showToast('Snapshot removido.', 'info');
  };

  const handleRestoreCloudBackup = async (bck: CloudBackupMetadata) => {
    if (window.confirm(`Deseja baixar e restaurar o backup em nuvem "${bck.name}" (${bck.deviceName})?`)) {
      try {
        const payload = await downloadCloudBackup(bck.id);
        if (payload && restoreEntireState) {
          restoreEntireState(payload, 'replace');
          showToast('Backup da nuvem restaurado com sucesso!', 'success');
          onClose();
        } else {
          showToast('Não foi possível obter os dados do backup remoto.', 'error');
        }
      } catch (err: any) {
        showToast('Erro ao restaurar da nuvem: ' + err.message, 'error');
      }
    }
  };

  // HANDLERS DE IMPORTAÇÃO JSON
  const handleJsonFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonFileContent(content);
      const validation = parseAndValidateJsonBackup(content);
      if (validation.isValid && validation.payload) {
        setJsonPreview(validation);
      } else {
        setJsonPreview(null);
        showToast(validation.error || 'Arquivo JSON inválido.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmJsonImport = () => {
    if (!jsonPreview?.payload || !restoreEntireState) return;
    restoreEntireState(jsonPreview.payload, jsonImportMode);
    showToast(`Dados importados com sucesso (${jsonImportMode === 'merge' ? 'Mesclagem inteligente' : 'Substituição completa'}).`, 'success');
    onClose();
  };

  // HANDLERS DE IMPORTAÇÃO CSV
  const handleCsvFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvFileContent(content);
      const parsed = parseCsvContent(content);
      if (parsed.length > 0) {
        const headers = parsed[0];
        const rows = parsed.slice(1);
        setCsvHeaders(headers);
        setCsvRows(rows);
        const mapped = autoMapCsvHeaders(headers);
        setCsvColumnMap(mapped);
      } else {
        showToast('O arquivo CSV selecionado está vazio.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmCsvImport = () => {
    if (csvRows.length === 0 || !importCompaniesList) return;

    const nameIdx = csvColumnMap['name'];
    if (nameIdx === undefined) {
      showToast('Por favor, selecione qual coluna do CSV corresponde ao Nome da Empresa.', 'error');
      return;
    }

    const importedCompanies: Partial<any>[] = [];
    csvRows.forEach((row) => {
      const name = row[nameIdx]?.trim();
      if (!name) return;

      const comp: Partial<any> = {
        name,
        commercialName: csvColumnMap['commercialName'] !== undefined ? row[csvColumnMap['commercialName']] : name,
        phone: csvColumnMap['phone'] !== undefined ? row[csvColumnMap['phone']] : '',
        email: csvColumnMap['email'] !== undefined ? row[csvColumnMap['email']] : '',
        niche: csvColumnMap['niche'] !== undefined ? row[csvColumnMap['niche']] : 'Tecnologia / B2B',
        country: csvColumnMap['country'] !== undefined ? row[csvColumnMap['country']] : 'Moçambique',
        city: csvColumnMap['city'] !== undefined ? row[csvColumnMap['city']] : 'Maputo',
        website: csvColumnMap['website'] !== undefined ? row[csvColumnMap['website']] : '',
        document: csvColumnMap['document'] !== undefined ? row[csvColumnMap['document']] : '',
        commercialNotes: csvColumnMap['notes'] !== undefined ? row[csvColumnMap['notes']] : 'Importado via CSV',
      };
      importedCompanies.push(comp);
    });

    if (importedCompanies.length === 0) {
      showToast('Nenhuma empresa válida encontrada nas linhas do CSV.', 'error');
      return;
    }

    importCompaniesList(importedCompanies, csvImportMode);
    showToast(`${importedCompanies.length} empresas importadas com sucesso!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-[22px] shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#232836] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Central de Confiabilidade de Dados
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Backup seguro, importação/exportação CSV & JSON e preservação histórica de registros.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 pt-3 border-b border-zinc-100 dark:border-[#232836] flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'backup'
                ? 'border-[#635BFF] text-[#635BFF] dark:text-[#9A94FF]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Backups & Snapshots</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'export'
                ? 'border-[#635BFF] text-[#635BFF] dark:text-[#9A94FF]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar (CSV / JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'import'
                ? 'border-[#635BFF] text-[#635BFF] dark:text-[#9A94FF]'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar (CSV / JSON)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* ABA 1: BACKUPS & SNAPSHOTS */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-3">
                <Info className="w-4 h-4 text-[#635BFF] shrink-0 mt-0.5" />
                <div className="space-y-1 text-zinc-600 dark:text-zinc-300">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Arquitetura Offline-First com Proteção Contra Perda de Dados
                  </p>
                  <p>
                    Seus dados residem permanentemente no dispositivo e são preservados mesmo sem conexão.
                    Mudanças futuras em preços, scripts ou critérios nunca alteram eventos de histórico gravados.
                  </p>
                </div>
              </div>

              {/* Botões de Ação de Backup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#1A1F2C] space-y-3">
                  <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
                    <HardDrive className="w-4 h-4 text-indigo-500" />
                    <span>Snapshot Local no Navegador</span>
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    Salva uma foto completa instantânea do workspace neste dispositivo para restauração rápida a qualquer momento.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateLocalBackup}
                    className="w-full"
                  >
                    Criar Snapshot Local Agora
                  </Button>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#1A1F2C] space-y-3">
                  <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
                    <Database className="w-4 h-4 text-sky-500" />
                    <span>Backup Seguro na Nuvem (Supabase)</span>
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    Envia réplica completa para o repositório remoto ou nuvem Supabase, permitindo sincronização entre múltiplos dispositivos.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCreateCloudBackup}
                    disabled={isBackingUp}
                    className="w-full"
                  >
                    {isBackingUp ? 'Enviando para Nuvem...' : 'Criar Backup na Nuvem'}
                  </Button>
                </div>
              </div>

              {/* Lista de Snapshots Locais */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <History className="w-4 h-4 text-zinc-500" />
                    <span>Snapshots Locais Salvos ({localSlots.length})</span>
                  </h4>
                  <span className="text-[11px] text-zinc-400">Até 5 pontos de restauração</span>
                </div>

                {localSlots.length === 0 ? (
                  <div className="p-4 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    Nenhum snapshot local gerado ainda. Clique no botão acima para registrar um ponto seguro.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {localSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-white dark:bg-[#181B24]"
                      >
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">
                            {slot.name}
                          </div>
                          <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                            <span>{new Date(slot.createdAt).toLocaleString()}</span>
                            <span>&bull;</span>
                            <span>{slot.itemCounts.companies} empresas</span>
                            <span>&bull;</span>
                            <span>{slot.itemCounts.scripts} scripts</span>
                            <span>&bull;</span>
                            <span>{slot.itemCounts.actions} ações</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreSlot(slot)}
                          >
                            Restaurar
                          </Button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors"
                            title="Excluir snapshot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lista de Backups Remotos na Nuvem */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Database className="w-4 h-4 text-sky-500" />
                    <span>Backups Remotos na Nuvem ({cloudBackups.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={loadCloudBackupsList}
                    className="text-xs text-sky-500 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingCloud ? 'animate-spin' : ''}`} />
                    <span>Atualizar</span>
                  </button>
                </div>

                {cloudBackups.length === 0 ? (
                  <div className="p-4 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    Nenhum backup em nuvem encontrado.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cloudBackups.map((bck) => (
                      <div
                        key={bck.id}
                        className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-white dark:bg-[#181B24]"
                      >
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <span>{bck.name}</span>
                            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 font-normal">
                              {bck.deviceName}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                            <span>{new Date(bck.createdAt).toLocaleString()}</span>
                            <span>&bull;</span>
                            <span>{bck.recordsCount.companies} empresas</span>
                            <span>&bull;</span>
                            <span>{Math.round(bck.sizeBytes / 1024)} KB</span>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreCloudBackup(bck)}
                        >
                          Baixar & Restaurar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA 2: EXPORTAR (CSV / JSON) */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <p className="text-zinc-500 dark:text-zinc-400">
                Exporte sua base completa em JSON com versionamento para portabilidade total ou gere planilhas CSV com formatação UTF-8 pronta para Excel.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card Export JSON */}
                <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                        Exportar Banco Completo (JSON)
                      </h4>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                        Contém empresas, scripts, funis, serviços, pontuações, ações e histórico completo.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-[#181B24] border border-zinc-200 dark:border-zinc-800 text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Empresas:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{companies.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Scripts & Playbooks:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{scriptsEntities.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Funis de Vendas:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{funnels.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Ações Agendadas:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{actions.length}</span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Download className="w-4 h-4" />}
                    onClick={handleExportJson}
                    className="w-full"
                  >
                    Baixar Arquivo .JSON
                  </Button>
                </div>

                {/* Card Export CSV Empresas */}
                <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                        Empresas & Contas (CSV / Excel)
                      </h4>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                        Planilha com dados cadastrais, telefone, e-mail, nicho, país, cidade, etapa e score.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-[#181B24] border border-zinc-200 dark:border-zinc-800 text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Total de Linhas:</span>
                      <span className="font-bold text-emerald-600">{companies.length} empresas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Codificação:</span>
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">UTF-8 com BOM (sem erros de acentos)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Separador:</span>
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">Ponto e vírgula (;)</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Download className="w-4 h-4" />}
                    onClick={handleExportCompaniesCsv}
                    className="w-full"
                  >
                    Baixar Empresas .CSV
                  </Button>
                </div>
              </div>

              {/* Opções Adicionais de Exportação CSV */}
              <div className="pt-2 space-y-2">
                <span className="font-bold text-zinc-800 dark:text-zinc-200 block">Outros relatórios tabulares:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleExportActivitiesCsv}
                    className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#181B24] hover:border-zinc-300 dark:hover:border-zinc-700 flex items-center justify-between text-left transition-all cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">Histórico de Atividades (CSV)</div>
                      <div className="text-[11px] text-zinc-500">Todas as tarefas, reuniões e ligações</div>
                    </div>
                    <Download className="w-4 h-4 text-zinc-400" />
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPipelineCsv}
                    className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#181B24] hover:border-zinc-300 dark:hover:border-zinc-700 flex items-center justify-between text-left transition-all cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">Pipeline de Ações (CSV)</div>
                      <div className="text-[11px] text-zinc-500">Próximos toques, horários e desfechos</div>
                    </div>
                    <Download className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: IMPORTAR (CSV / JSON) */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              {/* Seletor de Tipo de Importação */}
              <div className="grid grid-cols-2 gap-3">
                {/* Seletor Arquivo JSON */}
                <div
                  onClick={() => fileInputJsonRef.current?.click()}
                  className="p-4 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/20 dark:bg-indigo-950/10 hover:bg-indigo-50/40 transition-all cursor-pointer text-center space-y-2"
                >
                  <input
                    type="file"
                    ref={fileInputJsonRef}
                    accept=".json"
                    onChange={handleJsonFileSelected}
                    className="hidden"
                  />
                  <FileText className="w-6 h-6 text-indigo-500 mx-auto" />
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">
                    Importar Backup JSON
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Clique para selecionar arquivo de backup (.json)
                  </p>
                </div>

                {/* Seletor Arquivo CSV */}
                <div
                  onClick={() => fileInputCsvRef.current?.click()}
                  className="p-4 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/10 hover:bg-emerald-50/40 transition-all cursor-pointer text-center space-y-2"
                >
                  <input
                    type="file"
                    ref={fileInputCsvRef}
                    accept=".csv"
                    onChange={handleCsvFileSelected}
                    className="hidden"
                  />
                  <FileSpreadsheet className="w-6 h-6 text-emerald-500 mx-auto" />
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">
                    Importar Empresas CSV
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Clique para selecionar planilha (.csv)
                  </p>
                </div>
              </div>

              {/* Visualização de Prévia JSON */}
              {jsonPreview && (
                <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-[#181B24] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Backup JSON Válido Reconhecido</span>
                    </h4>
                    <span className="text-[11px] text-zinc-500">Versão #{jsonPreview.payload.version}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                      <span className="text-zinc-500 block">Empresas:</span>
                      <strong className="text-zinc-900 dark:text-zinc-100">{jsonPreview.summary?.empresas}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                      <span className="text-zinc-500 block">Scripts:</span>
                      <strong className="text-zinc-900 dark:text-zinc-100">{jsonPreview.summary?.scripts}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                      <span className="text-zinc-500 block">Funis:</span>
                      <strong className="text-zinc-900 dark:text-zinc-100">{jsonPreview.summary?.funis}</strong>
                    </div>
                  </div>

                  {/* Modo de importação */}
                  <div className="space-y-1">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block">Modo de Aplicação:</span>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="jsonMode"
                          checked={jsonImportMode === 'merge'}
                          onChange={() => setJsonImportMode('merge')}
                        />
                        <span>Mesclagem Inteligente (Recomendado - não destrói registros existentes)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="jsonMode"
                          checked={jsonImportMode === 'replace'}
                          onChange={() => setJsonImportMode('replace')}
                        />
                        <span>Substituição Completa</span>
                      </label>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmJsonImport}
                    className="w-full"
                  >
                    Confirmar e Importar Backup JSON
                  </Button>
                </div>
              )}

              {/* Assistente de Mapeamento de Colunas CSV */}
              {csvRows.length > 0 && (
                <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-white dark:bg-[#181B24] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      <span>{csvRows.length} linhas detectadas no CSV</span>
                    </h4>
                    <span className="text-[11px] text-zinc-500">Mapeamento de colunas</span>
                  </div>

                  <p className="text-zinc-500">
                    Confirme o mapeamento das colunas da sua planilha para os campos do LEADION:
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Nome da Empresa *
                      </label>
                      <select
                        value={csvColumnMap['name'] ?? ''}
                        onChange={(e) => setCsvColumnMap({ ...csvColumnMap, name: Number(e.target.value) })}
                        className="w-full p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                      >
                        <option value="">-- Selecionar --</option>
                        {csvHeaders.map((h, i) => (
                          <option key={i} value={i}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Telefone / WhatsApp
                      </label>
                      <select
                        value={csvColumnMap['phone'] ?? ''}
                        onChange={(e) => setCsvColumnMap({ ...csvColumnMap, phone: Number(e.target.value) })}
                        className="w-full p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                      >
                        <option value="">-- Selecionar --</option>
                        {csvHeaders.map((h, i) => (
                          <option key={i} value={i}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        E-mail
                      </label>
                      <select
                        value={csvColumnMap['email'] ?? ''}
                        onChange={(e) => setCsvColumnMap({ ...csvColumnMap, email: Number(e.target.value) })}
                        className="w-full p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                      >
                        <option value="">-- Selecionar --</option>
                        {csvHeaders.map((h, i) => (
                          <option key={i} value={i}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Nicho / Ramo
                      </label>
                      <select
                        value={csvColumnMap['niche'] ?? ''}
                        onChange={(e) => setCsvColumnMap({ ...csvColumnMap, niche: Number(e.target.value) })}
                        className="w-full p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                      >
                        <option value="">-- Selecionar --</option>
                        {csvHeaders.map((h, i) => (
                          <option key={i} value={i}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        País
                      </label>
                      <select
                        value={csvColumnMap['country'] ?? ''}
                        onChange={(e) => setCsvColumnMap({ ...csvColumnMap, country: Number(e.target.value) })}
                        className="w-full p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                      >
                        <option value="">-- Selecionar --</option>
                        {csvHeaders.map((h, i) => (
                          <option key={i} value={i}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Cidade
                      </label>
                      <select
                        value={csvColumnMap['city'] ?? ''}
                        onChange={(e) => setCsvColumnMap({ ...csvColumnMap, city: Number(e.target.value) })}
                        className="w-full p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                      >
                        <option value="">-- Selecionar --</option>
                        {csvHeaders.map((h, i) => (
                          <option key={i} value={i}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmCsvImport}
                    className="w-full"
                  >
                    Importar {csvRows.length} Empresas
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
