import React from 'react';
import { HardDrive, Cloud, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { useLeadion } from '../../context/LeadionContext';

interface LocalAccountBannerProps {
  onOpenLinkModal: () => void;
}

export const LocalAccountBanner: React.FC<LocalAccountBannerProps> = ({ onOpenLinkModal }) => {
  const { userAccount } = useLeadion() as any;

  // Renderiza apenas se a conta for exclusivamente local
  if (!userAccount || userAccount.accountType !== 'local') {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-indigo-500/10 dark:from-amber-950/40 dark:via-amber-900/30 dark:to-indigo-950/30 border-b border-amber-300/70 dark:border-amber-800/60 px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <HardDrive className="w-3.5 h-3.5" />
          </div>
          <div className="text-zinc-800 dark:text-zinc-200 leading-tight">
            <span className="font-bold text-amber-900 dark:text-amber-300 mr-2 flex-inline items-center gap-1">
              <span>Conta local</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mx-1 align-middle animate-pulse" />
              <span className="font-semibold text-[11px] text-amber-700 dark:text-amber-400">Ainda não sincronizada</span>
            </span>
            <span className="text-zinc-600 dark:text-zinc-400 text-[11px]">
              — Seus dados estão neste dispositivo. Para recuperar em outro dispositivo, conecte sua conta à nuvem.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenLinkModal}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#635BFF] hover:bg-[#5248E5] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>Conectar à nuvem</span>
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
