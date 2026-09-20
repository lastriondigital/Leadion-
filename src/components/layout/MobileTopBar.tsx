import React from 'react';
import { Zap, Search, MoreHorizontal } from 'lucide-react';

interface MobileTopBarProps {
  onOpenSearch: () => void;
  onOpenMore: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  onOpenSearch,
  onOpenMore
}) => {
  return (
    <header className="md:hidden sticky top-0 z-30 w-full bg-white/95 dark:bg-[#111319]/95 backdrop-blur-md border-b border-[#E6E8EC] dark:border-[#232836] px-4 py-2.5 flex items-center justify-between safe-area-top">
      {/* Lado Esquerdo: Wordmark Oficial LEADION */}
      <div className="flex items-center gap-2 select-none">
        <div className="w-7 h-7 rounded-[8px] bg-[#635BFF] flex items-center justify-center text-white shadow-2xs shrink-0">
          <Zap className="w-4 h-4 fill-current" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-base font-black tracking-tight text-zinc-900 dark:text-white">
            LEADION
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#EEF0FF] text-[#635BFF] dark:bg-[#1E1D38] dark:text-[#9A94FF]">
            OS
          </span>
        </div>
      </div>

      {/* Lado Direito: Pesquisar e Mais */}
      <div className="flex items-center gap-1">
        {/* Pesquisar */}
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Pesquisar"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[10px] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Mais */}
        <button
          type="button"
          onClick={onOpenMore}
          aria-label="Mais opções"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[10px] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
