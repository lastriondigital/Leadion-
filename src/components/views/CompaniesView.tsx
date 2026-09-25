import React, { useState, useMemo } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { Company, CompanyFunnelStage } from '../../core/types/company';
import { CompanyDetailView } from '../companies/CompanyDetailView';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Score } from '../ui/Score';
import { Modal } from '../ui/Modal';
import { 
  Building2, 
  MapPin, 
  Users, 
  ExternalLink, 
  Plus, 
  Search, 
  ArrowRight,
  Filter, 
  LayoutGrid, 
  Table as TableIcon, 
  Phone, 
  MessageSquare, 
  Globe, 
  MoreVertical, 
  Edit3, 
  Copy, 
  Archive, 
  ArchiveRestore, 
  Trash2, 
  Sparkles, 
  Briefcase, 
  Clock, 
  AlertTriangle,
  Send,
  Scale
} from 'lucide-react';

export const CompaniesView: React.FC = () => {
  const { 
    companies, 
    selectedCompany, 
    setSelectedCompany, 
    setIsNewCompanyModalOpen, 
    setEditingCompany,
    deleteCompany,
    archiveCompany,
    unarchiveCompany,
    duplicateCompany,
    setActiveNav, 
    setSearchQuery: setGlobalSearchQuery 
  } = useLeadion();

  // Local filters and view mode
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [nicheFilter, setNicheFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'recent' | 'name' | 'next_action'>('score');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Delete modal confirmation
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  // Active Dropdown menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // All unique niches
  const niches = Array.from(new Set(companies.map((c) => c.niche || c.segment).filter(Boolean)));

  // Filtered & Sorted Companies
  const filteredCompanies = useMemo(() => {
    return companies
      .filter((company) => {
        // Status filter
        if (statusFilter === 'active' && company.status === 'archived') return false;
        if (statusFilter === 'archived' && company.status !== 'archived') return false;

        // Stage filter
        if (stageFilter !== 'all' && company.funnelStage !== stageFilter) return false;

        // Niche filter
        if (nicheFilter !== 'all' && (company.niche !== nicheFilter && company.segment !== nicheFilter)) return false;

        // Text search
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = company.name.toLowerCase().includes(q);
          const matchNiche = (company.niche || company.segment || '').toLowerCase().includes(q);
          const matchCity = (company.city || '').toLowerCase().includes(q);
          const matchLocation = (company.location || '').toLowerCase().includes(q);
          const matchWebsite = (company.website || company.domain || '').toLowerCase().includes(q);
          const matchResp = company.responsibles?.some((r) => 
            r.name.toLowerCase().includes(q) || r.role.toLowerCase().includes(q)
          );
          if (!matchName && !matchNiche && !matchCity && !matchLocation && !matchWebsite && !matchResp) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score') {
          return (b.score || b.icpScore || 0) - (a.score || a.icpScore || 0);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'next_action') {
          return (a.nextAction?.dueDate || '').localeCompare(b.nextAction?.dueDate || '');
        }
        // Recent
        return (b.id || '').localeCompare(a.id || '');
      });
  }, [companies, search, stageFilter, statusFilter, nicheFilter, sortBy]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = companies.length;
    const active = companies.filter((c) => c.status !== 'archived').length;
    const inProspecting = companies.filter((c) => c.funnelStage === 'prospeccao' && c.status !== 'archived').length;
    const inMeetingOrProposal = companies.filter((c) => 
      (c.funnelStage === 'reuniao_agendada' || c.funnelStage === 'proposta' || c.funnelStage === 'negociacao') && c.status !== 'archived'
    ).length;
    const clientsWon = companies.filter((c) => c.funnelStage === 'cliente').length;
    const avgScore = total > 0 
      ? Math.round(companies.reduce((acc, c) => acc + (c.score || c.icpScore || 0), 0) / total)
      : 0;

    return { total, active, inProspecting, inMeetingOrProposal, clientsWon, avgScore };
  }, [companies]);

  // If a company is selected for deep drill-down, render CompanyDetailView (after all hooks)
  if (selectedCompany) {
    return (
      <CompanyDetailView
        company={selectedCompany}
        onBack={() => setSelectedCompany(null)}
      />
    );
  }

  const handleOpenNewCompanyModal = () => {
    setEditingCompany(null);
    setIsNewCompanyModalOpen(true);
  };

  const handleEdit = (company: Company, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingCompany(company);
    setIsNewCompanyModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDuplicate = (company: Company, e?: React.MouseEvent) => {
    e?.stopPropagation();
    duplicateCompany(company.id);
    setOpenMenuId(null);
  };

  const handleToggleArchive = (company: Company, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (company.status === 'archived') {
      unarchiveCompany(company.id);
    } else {
      archiveCompany(company.id);
    }
    setOpenMenuId(null);
  };

  const handleDeletePrompt = (company: Company, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCompanyToDelete(company);
    setOpenMenuId(null);
  };

  const confirmDelete = () => {
    if (companyToDelete) {
      deleteCompany(companyToDelete.id);
      setCompanyToDelete(null);
    }
  };

  const getStageBadge = (stage?: CompanyFunnelStage) => {
    switch (stage) {
      case 'prospeccao':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-[#635BFF] border border-[#635BFF]/20">Prospecção</span>;
      case 'contato_feito':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">Contato Feito</span>;
      case 'qualificacao':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">Qualificação</span>;
      case 'reuniao_agendada':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">Reunião Marcada</span>;
      case 'proposta':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">Proposta</span>;
      case 'negociacao':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800">Negociação</span>;
      case 'cliente':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">Cliente Ganho</span>;
      case 'desqualificado':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">Desqualificado</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">Prospecção</span>;
    }
  };

  const getWhatsAppLink = (number?: string) => {
    if (!number) return '#';
    const clean = number.replace(/\D/g, '');
    const full = clean.startsWith('55') ? clean : `55${clean}`;
    return `https://wa.me/${full}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-150">
      {/* Executive Header & KPI Metrics */}
      <div className="p-6 rounded-[20px] bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#635BFF] uppercase tracking-wider">
                Módulo de Contas & Pipeline B2B
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mt-0.5">
              Empresas & Inteligência Comercial
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Base central de inteligência para prospecção outbound. Estrutura com múltiplos contatos, decisores mapeados, histórico completo e próximas ações.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveNav('qualification')}
              className="px-3.5 py-2 min-h-[40px] rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-[#635BFF] text-xs font-semibold text-[#635BFF] dark:text-[#9A94FF] bg-white dark:bg-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Qualificação</span>
            </button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenNewCompanyModal}
              icon={<Plus className="w-4 h-4" />}
            >
              Adicionar empresa
            </Button>
          </div>
        </div>

        {/* Quick KPI Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="p-3 rounded-[12px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Total</span>
            <span className="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{stats.total}</span>
          </div>
          <div className="p-3 rounded-[12px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Prospecção</span>
            <span className="text-lg font-bold tabular-nums text-[#635BFF]">{stats.inProspecting}</span>
          </div>
          <div className="p-3 rounded-[12px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Reuniões</span>
            <span className="text-lg font-bold tabular-nums text-purple-600 dark:text-purple-400">{stats.inMeetingOrProposal}</span>
          </div>
          <div className="p-3 rounded-[12px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Ganhos</span>
            <span className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{stats.clientsWon}</span>
          </div>
          <div className="p-3 rounded-[12px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Score médio</span>
            <span className="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{stats.avgScore}/100</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-[16px] bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por empresa, nicho, cidade, decisor ou website..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 h-9 rounded-[9px] bg-zinc-50 dark:bg-[#12151D] border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#635BFF]"
            />
          </div>

          {/* Quick Selects */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-9 px-2.5 rounded-[9px] bg-zinc-50 dark:bg-[#12151D] border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="active">Ativas ({stats.active})</option>
              <option value="archived">Arquivadas ({stats.total - stats.active})</option>
              <option value="all">Todas ({stats.total})</option>
            </select>

            {/* Stage filter */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="h-9 px-2.5 rounded-[9px] bg-zinc-50 dark:bg-[#12151D] border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas as Etapas</option>
              <option value="prospeccao">Prospecção</option>
              <option value="contato_feito">Contato Feito</option>
              <option value="qualificacao">Qualificação</option>
              <option value="reuniao_agendada">Reunião Agendada</option>
              <option value="proposta">Proposta Apresentada</option>
              <option value="negociacao">Negociação</option>
              <option value="cliente">Cliente Conquistado</option>
              <option value="desqualificado">Desqualificado</option>
            </select>

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 px-2.5 rounded-[9px] bg-zinc-50 dark:bg-[#12151D] border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="score">Maior Fit ICP</option>
              <option value="recent">Mais Recentes</option>
              <option value="name">Nome (A - Z)</option>
              <option value="next_action">Próxima Ação</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-[9px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-[7px] transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-[#161922] text-[#635BFF] shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                title="Visualização em Grade"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-[7px] transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-[#161922] text-[#635BFF] shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                title="Visualização em Tabela"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Nicho Quick Pills */}
        {niches.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setNicheFilter('all')}
              className={`px-3 py-1.5 rounded-[9px] text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                nicheFilter === 'all'
                  ? 'bg-[#635BFF] border-[#635BFF] text-white'
                  : 'bg-white dark:bg-[#161922] border-[#E6E8EC] dark:border-[#232836] text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
              }`}
            >
              Todos os Nichos ({companies.length})
            </button>
            {niches.map((n) => (
              <button
                key={n}
                onClick={() => setNicheFilter(n)}
                className={`px-3 py-1.5 rounded-[9px] text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                  nicheFilter === n
                    ? 'bg-[#635BFF] border-[#635BFF] text-white'
                    : 'bg-white dark:bg-[#161922] border-[#E6E8EC] dark:border-[#232836] text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {companies.length === 0 ? (
        /* Empty State Real */
        <div className="p-12 text-center rounded-[20px] bg-white dark:bg-[#161922] border border-dashed border-[#E6E8EC] dark:border-[#232836] space-y-3">
          <Building2 className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Você ainda não cadastrou nenhuma empresa.
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Cadastre sua primeira empresa para organizar decisores, etapas de funil e prospecção ativa.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenNewCompanyModal}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Adicionar empresa
            </Button>
          </div>
        </div>
      ) : filteredCompanies.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-[20px] bg-white dark:bg-[#161922] border border-dashed border-[#E6E8EC] dark:border-[#232836] space-y-3">
          <Building2 className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Nenhuma empresa encontrada com os filtros atuais
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Tente ajustar os termos da pesquisa, alterar o nicho ou cadastre uma nova empresa comercial para prospectar.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            {(search || stageFilter !== 'all' || nicheFilter !== 'all' || statusFilter !== 'active') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStageFilter('all');
                  setNicheFilter('all');
                  setStatusFilter('active');
                }}
              >
                Limpar Filtros
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenNewCompanyModal}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Adicionar empresa
            </Button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => {
            const primaryResp = company.responsibles?.find((r) => r.isPrimary) || company.responsibles?.[0];
            const isMenuOpen = openMenuId === company.id;

            return (
              <div
                key={company.id}
                onClick={() => setSelectedCompany(company)}
                className={`p-5 rounded-[18px] bg-white dark:bg-[#161922] border transition-all duration-150 flex flex-col justify-between cursor-pointer group hover:border-[#635BFF]/50 hover:shadow-md ${
                  company.status === 'archived'
                    ? 'border-zinc-300 dark:border-zinc-800 opacity-75'
                    : 'border-[#E6E8EC] dark:border-[#232836] shadow-xs'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Card Top: Niche & Score */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#635BFF] uppercase tracking-wider truncate">
                          {company.niche || company.segment}
                        </span>
                        {company.status === 'archived' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
                            Arquivada
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate group-hover:text-[#635BFF] transition-colors">
                        {company.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                        <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span className="truncate">
                          {company.city ? (company.state ? `${company.city}, ${company.state}` : company.city) : (company.location || company.country || 'Localização não informada')}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <Score score={company.score !== undefined ? company.score : null} size="sm" showLabel={false} />

                      {/* Quick Dropdown Menu */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(isMenuOpen ? null : company.id)}
                          className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 top-full mt-1 w-44 rounded-[12px] bg-white dark:bg-[#1A1E29] border border-[#E6E8EC] dark:border-[#282F40] shadow-xl p-1 z-20 space-y-0.5 animate-in fade-in zoom-in-95">
                            <button
                              type="button"
                              onClick={(e) => handleEdit(company, e)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDuplicate(company, e)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Duplicar
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleToggleArchive(company, e)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
                            >
                              {company.status === 'archived' ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                              {company.status === 'archived' ? 'Desarquivar' : 'Arquivar'}
                            </button>
                            <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                            <button
                              type="button"
                              onClick={(e) => handleDeletePrompt(company, e)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stage & Units Tags */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStageBadge(company.funnelStage)}
                    <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full">
                      {company.unitsCount || 1} {company.unitsCount === 1 ? 'unidade' : 'unidades'}
                    </span>
                    <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full">
                      {company.businessType || 'B2B'}
                    </span>
                  </div>

                  {/* Decisor & Next Action Preview */}
                  <div className="p-3 rounded-[12px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                          Decisor Principal
                        </span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                          {primaryResp?.name || 'Mapear Decisor'}
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate block">
                          {primaryResp?.role || 'Diretoria'}
                        </span>
                      </div>

                      {primaryResp?.whatsapp && (
                        <a
                          href={getWhatsAppLink(primaryResp.whatsapp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-[9px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors shrink-0"
                          title={`Conversar no WhatsApp com ${primaryResp.name}`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-[#635BFF]" />
                        {company.nextAction?.dueDate || 'Hoje'}
                      </span>
                      <span className="font-bold text-[#635BFF] truncate max-w-[140px]">
                        {company.nextAction?.label || 'Primeiro toque'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">
                    {company.responsibles?.length || 1} decisor(es)
                  </span>
                  <span className="text-xs font-semibold text-[#635BFF] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Ver detalhes
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-[18px] bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-[#E6E8EC] dark:border-[#232836] text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="py-3 px-4">Empresa</th>
                  <th className="py-3 px-4">Nicho & Local</th>
                  <th className="py-3 px-4">Decisor Principal</th>
                  <th className="py-3 px-4">Etapa do Funil</th>
                  <th className="py-3 px-4">Próxima Ação</th>
                  <th className="py-3 px-4">Fit ICP</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E8EC]/80 dark:divide-[#232836]/80">
                {filteredCompanies.map((company) => {
                  const primaryResp = company.responsibles?.find((r) => r.isPrimary) || company.responsibles?.[0];

                  return (
                    <tr
                      key={company.id}
                      onClick={() => setSelectedCompany(company)}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer group"
                    >
                      {/* Empresa */}
                      <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-[#635BFF] shrink-0" />
                          <div>
                            <span className="group-hover:text-[#635BFF] transition-colors block font-bold">
                              {company.name}
                            </span>
                            {company.website && (
                              <span className="text-[11px] text-zinc-400">
                                {company.website.replace(/^https?:\/\//, '').split('/')[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Nicho & Local */}
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                          {company.niche || company.segment}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {company.city}, {company.state}
                        </span>
                      </td>

                      {/* Decisor Principal */}
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                          {primaryResp?.name || 'Mapear Decisor'}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {primaryResp?.role || 'Diretoria'}
                        </span>
                      </td>

                      {/* Etapa */}
                      <td className="py-3.5 px-4">
                        {getStageBadge(company.funnelStage)}
                      </td>

                      {/* Próxima Ação */}
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200 block text-[11px]">
                          {company.nextAction?.label || 'Primeiro toque'}
                        </span>
                        <span className="text-[10px] text-[#635BFF] font-semibold">
                          Prazo: {company.nextAction?.dueDate || 'Hoje'}
                        </span>
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-4">
                        <Score score={company.score !== undefined ? company.score : null} size="sm" showLabel={false} />
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {primaryResp?.whatsapp && (
                            <a
                              href={getWhatsAppLink(primaryResp.whatsapp)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-[7px] bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                              title="WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCompany(company)}
                          >
                            Ver detalhes
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(companyToDelete)}
        onClose={() => setCompanyToDelete(null)}
        title="Excluir Empresa"
        description="Esta ação removerá a empresa e todo seu histórico de atividades do Leadion. Tem certeza?"
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompanyToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={confirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Sim, Excluir
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3 p-2 text-xs text-zinc-600 dark:text-zinc-400">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <p>
            Você está prestes a remover <strong>{companyToDelete?.name}</strong>. Se preferir, você pode arquivá-la para manter o registro sem poluir sua fila ativa.
          </p>
        </div>
      </Modal>
    </div>
  );
};
