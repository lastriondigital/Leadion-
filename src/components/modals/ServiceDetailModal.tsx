import React, { useState } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { ServiceEntity, formatServiceCurrency, getServicePriceForCompany } from '../../core/types/service';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  Sparkles, 
  Globe, 
  Layers, 
  CheckCircle2, 
  HelpCircle, 
  Edit3, 
  Copy, 
  Archive, 
  RotateCcw, 
  Tag, 
  Calendar,
  Check,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export const ServiceDetailModal: React.FC = () => {
  const { 
    selectedServiceDetail, 
    setSelectedServiceDetail,
    setIsServiceModalOpen,
    setEditingService,
    duplicateService,
    archiveService,
    unarchiveService
  } = useLeadion();

  const [selectedCountryIndex, setSelectedCountryIndex] = useState<number>(0);

  if (!selectedServiceDetail) return null;

  const service = selectedServiceDetail;
  const activePrice = service.countryPrices && service.countryPrices[selectedCountryIndex] 
    ? service.countryPrices[selectedCountryIndex] 
    : service.countryPrices?.[0];

  const handleEdit = () => {
    setEditingService(service);
    setSelectedServiceDetail(null);
    setIsServiceModalOpen(true);
  };

  const handleDuplicate = () => {
    duplicateService(service.id);
    setSelectedServiceDetail(null);
  };

  const handleToggleArchive = () => {
    if (service.status === 'archived') {
      unarchiveService(service.id);
    } else {
      archiveService(service.id);
    }
    setSelectedServiceDetail(null);
  };

  return (
    <Modal
      isOpen={!!selectedServiceDetail}
      onClose={() => setSelectedServiceDetail(null)}
      title={`${service.name}`}
      description={`Código: ${service.code} · Versão do Catálogo: v${service.version || 1}`}
      size="lg"
    >
      <div className="space-y-5 pt-1">
        {/* Header Badges & Funil Padrão */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] tracking-wider ${
                service.status === 'active'
                  ? 'bg-emerald-100 text-emerald-800'
                  : service.status === 'draft'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-zinc-200 text-zinc-700'
              }`}
            >
              {service.status === 'active' ? 'Ativo' : service.status === 'draft' ? 'Rascunho' : 'Arquivado'}
            </span>
            <span className="text-zinc-500 font-mono font-medium">
              {service.countryPrices?.length || 0} países com precificação cadastrada
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-medium text-zinc-700">
            <Layers className="w-3.5 h-3.5 text-[#635BFF]" />
            <span>Funil Padrão: <strong>{service.defaultFunnelStageName || service.defaultFunnelStage}</strong></span>
          </div>
        </div>

        {/* Descrição & Proposta de Valor */}
        {service.description && (
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Descrição da Solução
            </span>
            <p className="text-sm text-zinc-800 leading-relaxed bg-white p-3 rounded-lg border border-zinc-200">
              {service.description}
            </p>
          </div>
        )}

        {/* Simulador / Seletor de País & Preços */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#635BFF]" />
              Precificação por País & Moeda
            </span>
            <span className="text-[11px] text-zinc-500">
              Simule o valor que será aplicado ao escolher empresas deste país
            </span>
          </div>

          {/* Abas dos Países Disponíveis */}
          <div className="flex flex-wrap gap-1.5">
            {service.countryPrices?.map((cp, idx) => (
              <button
                key={cp.id}
                type="button"
                onClick={() => setSelectedCountryIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectedCountryIndex === idx
                    ? 'bg-[#635BFF] text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                <span>{cp.country}</span>
                <span className="text-[10px] font-mono opacity-80">({cp.currency})</span>
              </button>
            ))}
          </div>

          {/* Cartão de Preços em Destaque */}
          {activePrice && (
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                <span className="text-xs font-bold text-zinc-800">
                  Condições Comerciais em {activePrice.country}
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  Moeda Oficial: {activePrice.currency} ({activePrice.currencySymbol})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Meu Preço */}
                <div className="p-3 bg-white rounded-lg border-2 border-[#635BFF]/30 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#635BFF] block">
                    Meu Preço (Recomendado)
                  </span>
                  <span className="text-lg font-extrabold text-zinc-900 block mt-1">
                    {formatServiceCurrency(activePrice.myPrice, activePrice.currency, activePrice.currencySymbol)}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Valor base inserido na proposta
                  </span>
                </div>

                {/* Mínimo de Mercado */}
                <div className="p-3 bg-white rounded-lg border border-zinc-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                    Preço Mínimo de Mercado
                  </span>
                  <span className="text-base font-bold text-zinc-700 block mt-1">
                    {formatServiceCurrency(activePrice.marketMinPrice, activePrice.currency, activePrice.currencySymbol)}
                  </span>
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Piso de referência do setor
                  </span>
                </div>

                {/* Máximo de Mercado */}
                <div className="p-3 bg-white rounded-lg border border-zinc-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                    Preço Máximo de Mercado
                  </span>
                  <span className="text-base font-bold text-zinc-700 block mt-1">
                    {formatServiceCurrency(activePrice.marketMaxPrice, activePrice.currency, activePrice.currencySymbol)}
                  </span>
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Teto praticado por agências/consultorias
                  </span>
                </div>
              </div>

              {activePrice.notes && (
                <p className="text-[11px] text-zinc-500 italic bg-white p-2 rounded border border-zinc-200">
                  Nota local: {activePrice.notes}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Entregáveis & ICP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {service.deliverables && service.deliverables.length > 0 && (
            <div className="p-3 bg-white rounded-lg border border-zinc-200 space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Entregáveis Principais
              </span>
              <ul className="space-y-1">
                {service.deliverables.map((item, idx) => (
                  <li key={idx} className="text-xs text-zinc-700 flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {service.idealCustomerProfile && (
            <div className="p-3 bg-white rounded-lg border border-zinc-200 space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Perfil de Cliente Ideal (ICP)
              </span>
              <p className="text-xs text-zinc-700 leading-relaxed">
                {service.idealCustomerProfile}
              </p>
            </div>
          )}
        </div>

        {/* Critérios de Qualificação & Perguntas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Critérios */}
          <div className="p-3 bg-white rounded-lg border border-zinc-200 space-y-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Critérios de Qualificação ({service.qualificationCriteria?.length || 0})
            </span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {service.qualificationCriteria?.map((crit) => (
                <div key={crit.id} className="p-2 bg-zinc-50 rounded border border-zinc-100 text-xs">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-zinc-800">{crit.label}</span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        crit.importance === 'obrigatorio'
                          ? 'bg-red-100 text-red-800'
                          : crit.importance === 'eliminatorio'
                          ? 'bg-zinc-800 text-white'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {crit.importance}
                    </span>
                  </div>
                  {crit.description && (
                    <p className="text-[10px] text-zinc-500 mt-0.5">{crit.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Perguntas Investigativas */}
          <div className="p-3 bg-white rounded-lg border border-zinc-200 space-y-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-[#635BFF]" />
              Perguntas Investigativas ({service.qualificationQuestions?.length || 0})
            </span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {service.qualificationQuestions?.map((q) => (
                <div key={q.id} className="p-2 bg-zinc-50 rounded border border-zinc-100 text-xs">
                  <p className="font-semibold text-zinc-800 italic">"{q.question}"</p>
                  {q.expectedAnswerInsight && (
                    <p className="text-[10px] text-emerald-700 mt-1 flex items-start gap-1">
                      <span>💡 <strong>Insight:</strong> {q.expectedAnswerInsight}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
              icon={<Copy className="w-3.5 h-3.5" />}
            >
              Duplicar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleArchive}
              icon={service.status === 'archived' ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
            >
              {service.status === 'archived' ? 'Desarquivar' : 'Arquivar'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedServiceDetail(null)}
            >
              Fechar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleEdit}
              icon={<Edit3 className="w-3.5 h-3.5" />}
            >
              Editar Serviço
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
