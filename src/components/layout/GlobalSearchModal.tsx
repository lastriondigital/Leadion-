import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Building2, 
  User, 
  FileText, 
  Briefcase, 
  Clock, 
  ArrowRight
} from 'lucide-react';
import { useLeadion } from '../../context/LeadionContext';
import { Company } from '../../core/types/company';
import { ScriptEntity } from '../../core/types/script';
import { ServiceEntity } from '../../core/types/service';
import { ProspectAction } from '../../core/types/prospectAction';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchCategory = 'all' | 'companies' | 'contacts' | 'scripts' | 'services' | 'actions';

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { 
    companies = [], 
    scriptsEntities = [], 
    services = [], 
    actions = [], 
    setActiveNav,
    setSelectedCompany
  } = useLeadion() as any;

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setActiveCategory('all');
    }
  }, [isOpen]);

  // Fechar com Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        companies: [],
        contacts: [],
        scripts: [],
        services: [],
        actions: [],
        total: 0
      };
    }

    // 1. Empresas
    const matchedCompanies: Company[] = companies.filter((c: Company) => 
      c.name.toLowerCase().includes(q) ||
      c.niche?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.commercialNotes?.toLowerCase().includes(q)
    );

    // 2. Contatos das empresas
    const matchedContacts: Array<{ name: string; role: string; phone?: string; company: Company }> = [];
    companies.forEach((comp: Company) => {
      if (Array.isArray(comp.responsibles)) {
        comp.responsibles.forEach((resp) => {
          if (
            resp.name?.toLowerCase().includes(q) ||
            resp.role?.toLowerCase().includes(q) ||
            resp.phone?.includes(q) ||
            resp.email?.toLowerCase().includes(q)
          ) {
            matchedContacts.push({ name: resp.name, role: resp.role, phone: resp.phone, company: comp });
          }
        });
      }
      if (comp.decisionMakerName && comp.decisionMakerName.toLowerCase().includes(q)) {
        // Evitar duplicatas se já adicionado em responsibles
        if (!matchedContacts.some(c => c.company.id === comp.id && c.name === comp.decisionMakerName)) {
          matchedContacts.push({ name: comp.decisionMakerName, role: 'Decisor', phone: comp.phone, company: comp });
        }
      }
    });

    // 3. Scripts
    const matchedScripts: ScriptEntity[] = scriptsEntities.filter((s: ScriptEntity) =>
      s.name?.toLowerCase().includes(q) ||
      s.channel?.toLowerCase().includes(q) ||
      s.niche?.toLowerCase().includes(q) ||
      s.content?.toLowerCase().includes(q)
    );

    // 4. Serviços
    const matchedServices: ServiceEntity[] = services.filter((srv: ServiceEntity) =>
      srv.name?.toLowerCase().includes(q) ||
      srv.description?.toLowerCase().includes(q) ||
      srv.code?.toLowerCase().includes(q)
    );

    // 5. Ações (Next Actions / Agenda)
    const matchedActions: ProspectAction[] = actions.filter((act: ProspectAction) =>
      act.companyName?.toLowerCase().includes(q) ||
      act.nextAction?.toLowerCase().includes(q) ||
      act.service?.toLowerCase().includes(q) ||
      act.channel?.toLowerCase().includes(q) ||
      act.responsible?.toLowerCase().includes(q)
    );

    const total = matchedCompanies.length + matchedContacts.length + matchedScripts.length + matchedServices.length + matchedActions.length;

    return {
      companies: matchedCompanies,
      contacts: matchedContacts,
      scripts: matchedScripts,
      services: matchedServices,
      actions: matchedActions,
      total
    };
  }, [query, companies, scriptsEntities, services, actions]);

  if (!isOpen) return null;

  const handleSelectCompany = (comp: Company) => {
    setActiveNav('companies');
    if (setSelectedCompany) {
      setSelectedCompany(comp);
    }
    onClose();
  };

  const handleSelectScript = (_script: ScriptEntity) => {
    setActiveNav('scripts');
    onClose();
  };

  const handleSelectService = (_service: ServiceEntity) => {
    setActiveNav('services');
    onClose();
  };

  const handleSelectAction = (action: ProspectAction) => {
    if (action.status === 'hoje' || action.status === 'atrasada') {
      setActiveNav('today');
    } else {
      setActiveNav('calendar');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-start bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-150 p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div className="relative w-full max-w-2xl mx-auto bg-white dark:bg-[#15181F] rounded-[18px] border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden max-h-[88vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-2 p-3 sm:p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#1A1D26]">
          <Search className="w-5 h-5 text-zinc-400 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar empresas, contatos, scripts, serviços ou ações..."
            className="flex-1 bg-transparent border-0 text-sm sm:text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none min-w-0"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              aria-label="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-[8px] bg-zinc-200/70 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors shrink-0"
          >
            Fechar
          </button>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border-b border-zinc-200/80 dark:border-zinc-800/80 overflow-x-auto no-scrollbar shrink-0 text-xs bg-white dark:bg-[#15181F]">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
              activeCategory === 'all'
                ? 'bg-[#635BFF] text-white font-semibold'
                : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Tudo ({searchResults.total})
          </button>
          <button
            onClick={() => setActiveCategory('companies')}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
              activeCategory === 'companies'
                ? 'bg-[#635BFF] text-white font-semibold'
                : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Empresas ({searchResults.companies.length})
          </button>
          <button
            onClick={() => setActiveCategory('contacts')}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
              activeCategory === 'contacts'
                ? 'bg-[#635BFF] text-white font-semibold'
                : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Contatos ({searchResults.contacts.length})
          </button>
          <button
            onClick={() => setActiveCategory('scripts')}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
              activeCategory === 'scripts'
                ? 'bg-[#635BFF] text-white font-semibold'
                : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Scripts ({searchResults.scripts.length})
          </button>
          <button
            onClick={() => setActiveCategory('services')}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
              activeCategory === 'services'
                ? 'bg-[#635BFF] text-white font-semibold'
                : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Serviços ({searchResults.services.length})
          </button>
          <button
            onClick={() => setActiveCategory('actions')}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
              activeCategory === 'actions'
                ? 'bg-[#635BFF] text-white font-semibold'
                : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Ações ({searchResults.actions.length})
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {!query.trim() ? (
            <div className="py-10 text-center text-zinc-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs sm:text-sm font-medium">
                Digite um termo para pesquisar em toda a operação
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Empresas, contatos, scripts, serviços e próximas ações
              </p>
            </div>
          ) : searchResults.total === 0 ? (
            <div className="py-10 text-center text-zinc-400">
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Nenhum resultado para "{query}"
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Tente buscar por outro termo ou nome de empresa
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Empresas */}
              {(activeCategory === 'all' || activeCategory === 'companies') && searchResults.companies.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-1">
                    Empresas ({searchResults.companies.length})
                  </div>
                  {searchResults.companies.map((comp) => (
                    <button
                      key={comp.id}
                      onClick={() => handleSelectCompany(comp)}
                      className="w-full text-left p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 hover:border-[#635BFF]/50 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-[#EEF0FF]/30 dark:hover:bg-[#1E1D38]/30 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#EEF0FF] dark:bg-[#1E1D38] text-[#635BFF] dark:text-[#9A94FF] flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {comp.name}
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            {comp.niche || 'Sem nicho'} • {comp.location || comp.city || 'Sem cidade'}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Contatos */}
              {(activeCategory === 'all' || activeCategory === 'contacts') && searchResults.contacts.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-1">
                    Contatos ({searchResults.contacts.length})
                  </div>
                  {searchResults.contacts.map((item, idx) => (
                    <button
                      key={`${item.company.id}-${idx}`}
                      onClick={() => handleSelectCompany(item.company)}
                      className="w-full text-left p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 hover:border-[#635BFF]/50 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-[#EEF0FF]/30 dark:hover:bg-[#1E1D38]/30 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            {item.role || 'Decisor'} na empresa <strong className="font-semibold text-zinc-700 dark:text-zinc-300">{item.company.name}</strong>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Scripts */}
              {(activeCategory === 'all' || activeCategory === 'scripts') && searchResults.scripts.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-1">
                    Scripts ({searchResults.scripts.length})
                  </div>
                  {searchResults.scripts.map((script) => (
                    <button
                      key={script.id}
                      onClick={() => handleSelectScript(script)}
                      className="w-full text-left p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 hover:border-[#635BFF]/50 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-[#EEF0FF]/30 dark:hover:bg-[#1E1D38]/30 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {script.name}
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            Canal: {script.channel} • Nicho: {script.niche || 'Geral'}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Serviços */}
              {(activeCategory === 'all' || activeCategory === 'services') && searchResults.services.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-1">
                    Serviços ({searchResults.services.length})
                  </div>
                  {searchResults.services.map((srv) => (
                    <button
                      key={srv.id}
                      onClick={() => handleSelectService(srv)}
                      className="w-full text-left p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 hover:border-[#635BFF]/50 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-[#EEF0FF]/30 dark:hover:bg-[#1E1D38]/30 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {srv.name}
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            Código: {srv.code} • {srv.description || 'Solução comercial'}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Ações / Agenda */}
              {(activeCategory === 'all' || activeCategory === 'actions') && searchResults.actions.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-1">
                    Ações & Agenda ({searchResults.actions.length})
                  </div>
                  {searchResults.actions.map((act) => (
                    <button
                      key={act.id}
                      onClick={() => handleSelectAction(act)}
                      className="w-full text-left p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 hover:border-[#635BFF]/50 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-[#EEF0FF]/30 dark:hover:bg-[#1E1D38]/30 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {act.companyName} — {act.nextAction}
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            {act.time} ({act.date}) • {act.channel?.toUpperCase()} • {act.service}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
