import React, { useState } from 'react';
import { 
  Cloud, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Mail, 
  ArrowRight, 
  Layers, 
  Database,
  Building2,
  Sparkles
} from 'lucide-react';
import { useLeadion } from '../../context/LeadionContext';
import { useToast } from '../../context/ToastContext';
import { validatePasswordNist } from '../../core/utils/passwordPolicy';

interface LinkAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LinkAccountModal: React.FC<LinkAccountModalProps> = ({ isOpen, onClose }) => {
  const { 
    userAccount, 
    linkLocalAccountToCloud, 
    companies, 
    actions, 
    scriptsEntities, 
    funnels, 
    services, 
    objectionsEntities 
  } = useLeadion() as any;
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [syncStepText, setSyncStepText] = useState<string>('');

  if (!isOpen) return null;

  const passwordVal = validatePasswordNist(password);

  // Inventário de registros locais a serem protegidos e enviados
  const inventory = {
    companies: companies?.length || 0,
    actions: actions?.length || 0,
    scripts: scriptsEntities?.length || 0,
    funnels: funnels?.length || 0,
    services: services?.length || 0,
    objections: objectionsEntities?.length || 0,
  };
  const totalLocalRecords = Object.values(inventory).reduce((a, b) => a + b, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Informe seu e-mail corporativo ou pessoal.');
      return;
    }

    if (!passwordVal.isValid) {
      setErrorMsg(passwordVal.feedback);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('A confirmação de senha não coincide com a senha digitada.');
      return;
    }

    setLoading(true);
    setSyncStepText('Criando identidade online no Supabase Auth...');

    try {
      setSyncStepText('Vinculando workspace local e mapeando registros...');
      
      const res = await linkLocalAccountToCloud(email.trim(), password);

      if (!res.success) {
        setErrorMsg(res.error || 'Falha ao vincular conta à nuvem.');
        setLoading(false);
        return;
      }

      showToast({
        type: 'success',
        title: 'Conta Protegida na Nuvem!',
        message: 'Todos os seus dados locais foram sincronizados e estão salvos com segurança.',
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro durante o processo de vinculação à nuvem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-[#232836] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#635BFF] to-[#4338CA] text-white flex items-center justify-center shadow-md shadow-[#635BFF]/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Vincular Conta à Nuvem</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  Proteção Total
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Sincronize seus dados locais com o Supabase sem perder nada
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Card de Inventário Local */}
          <div className="p-4 rounded-2xl bg-[#EEF0FF]/60 dark:bg-[#1A1C2C]/50 border border-[#635BFF]/20">
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#635BFF]" />
                <span>Dados preservados na vinculação:</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#635BFF] text-white text-[10px] font-bold">
                {totalLocalRecords} registros
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
              <div className="bg-white/80 dark:bg-zinc-800/80 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50">
                <span className="text-zinc-400 block text-[9px] uppercase font-bold">Empresas</span>
                <strong className="text-zinc-900 dark:text-zinc-100">{inventory.companies}</strong>
              </div>
              <div className="bg-white/80 dark:bg-zinc-800/80 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50">
                <span className="text-zinc-400 block text-[9px] uppercase font-bold">Ações</span>
                <strong className="text-zinc-900 dark:text-zinc-100">{inventory.actions}</strong>
              </div>
              <div className="bg-white/80 dark:bg-zinc-800/80 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50">
                <span className="text-zinc-400 block text-[9px] uppercase font-bold">Scripts</span>
                <strong className="text-zinc-900 dark:text-zinc-100">{inventory.scripts}</strong>
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              Todos os relacionamentos, notas, contatos e histórico serão mapeados e preservados no seu novo perfil online.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                E-mail para acesso em qualquer dispositivo <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@empresa.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#635BFF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Senha <span className="text-rose-500">*</span> (NIST: min 8 car.)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#635BFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Confirmar senha <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#635BFF]"
                  />
                </div>
              </div>
            </div>

            {password && (
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between pt-0.5">
                <span>Força: <strong className={passwordVal.score > 50 ? 'text-emerald-600' : 'text-amber-600'}>{passwordVal.strengthLabel}</strong> ({passwordVal.score}/100)</span>
                <span className="text-[10px] text-zinc-400">Suporta frases com espaço</span>
              </div>
            )}

            {loading && syncStepText && (
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>{syncStepText}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 rounded-xl bg-[#635BFF] hover:bg-[#5248E5] text-white font-bold text-xs shadow-md shadow-[#635BFF]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Sincronizando e protegendo...</span>
              ) : (
                <>
                  <Cloud className="w-4 h-4" />
                  <span>Sincronizar e Proteger Minha Conta na Nuvem</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
