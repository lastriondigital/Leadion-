import React, { useState, useMemo } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { ServiceEntity, formatServiceCurrency } from '../../core/types/service';
import { Button } from '../ui/Button';
import { 
  Sparkles, 
  Plus, 
  Search, 
  Globe, 
  Layers, 
  CheckCircle2, 
  HelpCircle, 
  Edit3, 
  Copy, 
  Archive, 
  RotateCcw, 
  ChevronRight, 
  Tag, 
  Coins,
  Check,
  Calendar,
  Eye,
  Filter
} from 'lucide-react';

export const ServicesView: React.FC = () => {
  const { 
    services, 
    setIsServiceModalOpen, 
    setEditingService, 
    setSelectedServiceDetail,
    duplicateService,
    archiveService,
    unarchiveService,
    setIsPlanningModalOpen,
    setActiveNav
  } = useLeadion();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('all');
  
  // Track selected country index preview per card
  const [cardSelectedCountryIndex, setCardSelectedCountryIndex] = useState<Record<string, number>>({});

  // Compute all unique countries across services
  const allCountries = useMemo(() => {
    const countriesSet = new Set<string>();
    services.forEach((s) => {
      s.countryPrices?.forEach((cp) => {
        if (cp.country) countriesSet.add(cp.country);
      });
    });
    return Array.from(countriesSet);
  }, [services]);

  // Compute metrics
  const metrics = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.status === 'active').length;
    const drafts = services.filter((s) => s.status === 'draft').length;
    const archived = services.filter((s) => s.status === 'archived').length;
    const countriesCount = allCountries.length;
    return { total, active, drafts, archived, countriesCount };
  }, [services, allCountries]);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      // Status
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;

      // Country
      if (selectedCountryFilter !== 'all') {
        const hasCountry = s.countryPrices?.some(
          (cp) => cp.country.toLowerCase() === selectedCountryFilter.toLowerCase()
        );
        if (!hasCountry) return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesCode = s.code?.toLowerCase().includes(q);
        const matchesDesc = s.description?.toLowerCase().includes(q);
        const matchesIcp = s.idealCustomerProfile?.toLowerCase().includes(q);
        const matchesCountry = s.countryPrices?.some((cp) => cp.country.toLowerCase().includes(q));
        if (!matchesName && !matchesCode && !matchesDesc && !matchesIcp && !matchesCountry) {
          return false;
        }
      }

      return true;
    });
  }, [services, statusFilter, selectedCountryFilter, searchQuery]);

  const handleCreateNew = () => {
    setEditingService(null);
    setIsServiceModalOpen(true);
  };

  const handleEdit = (service: ServiceEntity) => {
    setEditingService(service);
    setIsServiceModalOpen(true);
  };

  const handleOpenDetail = (service: ServiceEntity) => {
    setSelectedServiceDetail(service);
  };

  const setCountryForCard = (serviceId: string, index: number) => {
    setCardSelectedCountryIndex((prev) => ({ ...prev, [serviceId]: index }));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="p-5 rounded-[15px] bg-white border border-[#E6E8EC] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#635BFF]/10 text-[#635BFF]">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
              Catálogo de Serviços & Precificação Comercial
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
            Soluções comercializáveis do LEADION com suporte a precificação em múltiplos países, moedas locais, funis padrões associados e regras de qualificação.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateNew}
            icon={<Plus className="w-4 h-4" />}
          >
            Novo Serviço
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-[#E6E8EC] shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
            Serviços Ativos
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900">{metrics.active}</span>
            <span className="text-xs text-zinc-400 font-medium">de {metrics.total} total</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E6E8EC] shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
            Países com Preço Local
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#635BFF]">{metrics.countriesCount}</span>
            <span className="text-xs text-zinc-400 font-medium">mercados</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E6E8EC] shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
            Em Rascunho
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{metrics.drafts}</span>
            <span className="text-xs text-zinc-400 font-medium">em estruturação</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E6E8EC] shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
            Arquivados
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-500">{metrics.archived}</span>
            <span className="text-xs text-zinc-400 font-medium">preservados</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white rounded-xl border border-[#E6E8EC] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por serviço, código ou país..."
            className="w-full text-xs rounded-lg border border-zinc-200 pl-9 pr-3 py-2 text-zinc-800 focus:border-[#635BFF] focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Todos ({metrics.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Ativos ({metrics.active})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('draft')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                statusFilter === 'draft' ? 'bg-white text-amber-700 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Rascunhos ({metrics.drafts})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('archived')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                statusFilter === 'archived' ? 'bg-white text-zinc-800 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Arquivados ({metrics.archived})
            </button>
          </div>

          {/* Filter by Country */}
          {allCountries.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <Globe className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={selectedCountryFilter}
                onChange={(e) => setSelectedCountryFilter(e.target.value)}
                className="text-xs rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-zinc-800 focus:border-[#635BFF] focus:outline-none"
              >
                <option value="all">Todos os Países</option>
                {allCountries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Services List */}
      {services.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-zinc-300 space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-800">Você ainda não cadastrou serviços.</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Cadastre o primeiro serviço comercial para mapear soluções, precificação por país e funis associados.
          </p>
          <Button variant="primary" size="sm" onClick={handleCreateNew} icon={<Plus className="w-3.5 h-3.5" />}>
            Cadastrar Serviço
          </Button>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-zinc-300 space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-800">Nenhum serviço atende aos filtros</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Tente redefinir a busca ou alterar os filtros de status e país.
          </p>
          <Button variant="primary" size="sm" onClick={handleCreateNew} icon={<Plus className="w-3.5 h-3.5" />}>
            Cadastrar Serviço
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredServices.map((service) => {
            const countryPrices = service.countryPrices || [];
            const activeIndex = cardSelectedCountryIndex[service.id] || 0;
            const currentCountryPrice = countryPrices[activeIndex] || countryPrices[0];

            return (
              <div
                key={service.id}
                className="bg-white border border-[#E6E8EC] rounded-[15px] p-5 shadow-xs space-y-4 flex flex-col justify-between hover:border-[#635BFF]/40 transition-all"
              >
                {/* Header do Card */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-[#635BFF] bg-[#635BFF]/10 px-2 py-0.5 rounded">
                          {service.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            service.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : service.status === 'draft'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {service.status === 'active' ? 'Ativo' : service.status === 'draft' ? 'Rascunho' : 'Arquivado'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-zinc-900">{service.name}</h3>
                    </div>

                    {/* Funil Padrão Badge */}
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-lg border border-zinc-200">
                      <Layers className="w-3 h-3 text-[#635BFF]" />
                      <span>{service.defaultFunnelStageName || 'Prospecção'}</span>
                    </div>
                  </div>

                  {/* Descrição */}
                  {service.description && (
                    <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  )}

                  {/* SEÇÃO PRINCIPAL DE PREÇOS MULTIPAÍS */}
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-[#635BFF]" />
                        Precificação por Mercado Local:
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {countryPrices.length} {countryPrices.length === 1 ? 'país' : 'países'}
                      </span>
                    </div>

                    {/* Country Selector Pills */}
                    {countryPrices.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {countryPrices.map((cp, idx) => (
                          <button
                            key={cp.id}
                            type="button"
                            onClick={() => setCountryForCard(service.id, idx)}
                            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                              activeIndex === idx
                                ? 'bg-zinc-900 text-white shadow-xs'
                                : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                            }`}
                          >
                            {cp.country} ({cp.currency})
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Three Price Tiers: Meu Preço, Mercado Mínimo, Mercado Máximo */}
                    {currentCountryPrice ? (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {/* Meu Preço */}
                        <div className="bg-white p-2 rounded-lg border-2 border-[#635BFF]/30 shadow-2xs">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-[#635BFF] block">
                            Meu Preço
                          </span>
                          <span className="text-xs sm:text-sm font-extrabold text-zinc-900 block mt-0.5 truncate">
                            {formatServiceCurrency(currentCountryPrice.myPrice, currentCountryPrice.currency, currentCountryPrice.currencySymbol)}
                          </span>
                        </div>

                        {/* Mínimo Mercado */}
                        <div className="bg-white p-2 rounded-lg border border-zinc-200 shadow-2xs">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 block">
                            Mín. Mercado
                          </span>
                          <span className="text-xs font-semibold text-zinc-700 block mt-0.5 truncate">
                            {formatServiceCurrency(currentCountryPrice.marketMinPrice, currentCountryPrice.currency, currentCountryPrice.currencySymbol)}
                          </span>
                        </div>

                        {/* Máximo Mercado */}
                        <div className="bg-white p-2 rounded-lg border border-zinc-200 shadow-2xs">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 block">
                            Máx. Mercado
                          </span>
                          <span className="text-xs font-semibold text-zinc-700 block mt-0.5 truncate">
                            {formatServiceCurrency(currentCountryPrice.marketMaxPrice, currentCountryPrice.currency, currentCountryPrice.currencySymbol)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-400 italic">Nenhum preço configurado para este país.</p>
                    )}
                  </div>

                  {/* ICP & Qualificação Resumo */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <strong>{service.qualificationCriteria?.length || 0}</strong> critérios de qualificação
                    </span>

                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-[#635BFF]" />
                      <strong>{service.qualificationQuestions?.length || 0}</strong> perguntas investigativas
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDetail(service)}
                      icon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Ficha
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(service)}
                      icon={<Edit3 className="w-3.5 h-3.5" />}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateService(service.id)}
                      icon={<Copy className="w-3.5 h-3.5" />}
                      title="Duplicar Serviço"
                    >
                      Copiar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        service.status === 'archived'
                          ? unarchiveService(service.id)
                          : archiveService(service.id)
                      }
                      icon={
                        service.status === 'archived' ? (
                          <RotateCcw className="w-3.5 h-3.5" />
                        ) : (
                          <Archive className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-700" />
                        )
                      }
                      title={service.status === 'archived' ? 'Desarquivar' : 'Arquivar'}
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsPlanningModalOpen(true);
                    }}
                    icon={<Calendar className="w-3.5 h-3.5 text-[#635BFF]" />}
                  >
                    Programar Ação
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
