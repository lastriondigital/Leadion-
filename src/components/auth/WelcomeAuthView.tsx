import React, { useState } from 'react';
import { 
  ShieldCheck, 
  LogIn, 
  UserPlus, 
  WifiOff, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  HardDrive,
  Cloud,
  ChevronLeft
} from 'lucide-react';
import { useLeadion } from '../../context/LeadionContext';
import { useToast } from '../../context/ToastContext';
import { validatePasswordNist } from '../../core/utils/passwordPolicy';

type OnboardingStep = 'landing' | 'login' | 'create_online' | 'create_offline';

export const WelcomeAuthView: React.FC = () => {
  const { 
    signIn, 
    createOnlineAccount, 
    createLocalAccount, 
    companies, 
    actions 
  } = useLeadion() as any;
  const { showToast } = useToast();

  const [step, setStep] = useState<OnboardingStep>('landing');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Formulário Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showUnsavedLocalWarning, setShowUnsavedLocalWarning] = useState(false);

  // Formulário Online
  const [onlineFullName, setOnlineFullName] = useState('');
  const [onlineEmail, setOnlineEmail] = useState('');
  const [onlinePassword, setOnlinePassword] = useState('');
  const [onlineConfirmPassword, setOnlineConfirmPassword] = useState('');
  const [onlineCompanyName, setOnlineCompanyName] = useState('');
  const [onlineSector, setOnlineSector] = useState('');
  const [onlineCountry, setOnlineCountry] = useState('Brasil');
  const [onlineState, setOnlineState] = useState('');
  const [onlineRegion, setOnlineRegion] = useState('');
  const [onlinePhone, setOnlinePhone] = useState('');
  const [onlineWhatsApp, setOnlineWhatsApp] = useState('');

  // Formulário Offline
  const [offlineFullName, setOfflineFullName] = useState('');
  const [offlineCompanyName, setOfflineCompanyName] = useState('');
  const [offlineSector, setOfflineSector] = useState('');
  const [offlineCountry, setOfflineCountry] = useState('Brasil');
  const [offlineState, setOfflineState] = useState('');
  const [offlineRegion, setOfflineRegion] = useState('');
  const [offlinePhone, setOfflinePhone] = useState('');
  const [offlineWhatsApp, setOfflineWhatsApp] = useState('');
  const [offlineCredential, setOfflineCredential] = useState('');

  const passwordVal = validatePasswordNist(onlinePassword);

  // Quantidade de registros locais já existentes
  const localDataCount = (companies?.length || 0) + (actions?.length || 0);

  // Handler Login Online
  const handleLoginSubmit = async (e: React.FormEvent, forceMerge: boolean = false) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginEmail || !loginPassword) {
      setErrorMsg('Preencha seu e-mail e senha.');
      return;
    }

    // Se houver dados locais e ainda não confirmou merge
    if (localDataCount > 0 && !showUnsavedLocalWarning && !forceMerge) {
      setShowUnsavedLocalWarning(true);
      return;
    }

    setLoading(true);
    try {
      const res = await signIn(loginEmail, loginPassword, { mergeLocalData: forceMerge });
      if (!res.success) {
        setErrorMsg(res.error || 'Falha ao autenticar.');
      } else {
        showToast({
          type: 'success',
          title: 'Sessão Conectada',
          message: 'Workspace carregado e sincronizado com sucesso!',
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  // Handler Criação de Conta Online
  const handleCreateOnlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!onlineFullName.trim()) {
      setErrorMsg('Informe seu nome completo.');
      return;
    }
    if (!onlineEmail.trim()) {
      setErrorMsg('Informe seu e-mail corporativo ou pessoal.');
      return;
    }
    if (!passwordVal.isValid) {
      setErrorMsg(passwordVal.feedback);
      return;
    }
    if (onlinePassword !== onlineConfirmPassword) {
      setErrorMsg('As senhas não coincidem. Digite novamente.');
      return;
    }
    if (!onlineCompanyName.trim()) {
      setErrorMsg('Informe o nome da sua empresa ou operação comercial.');
      return;
    }

    setLoading(true);
    try {
      const res = await createOnlineAccount({
        fullName: onlineFullName.trim(),
        email: onlineEmail.trim(),
        password: onlinePassword,
        companyName: onlineCompanyName.trim(),
        sector: onlineSector.trim(),
        country: onlineCountry.trim(),
        state: onlineState.trim(),
        region: onlineRegion.trim(),
        phone: onlinePhone.trim(),
        whatsapp: onlineWhatsApp.trim() || onlinePhone.trim(),
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Não foi possível criar a conta online.');
      } else {
        showToast({
          type: 'success',
          title: 'Conta Criada!',
          message: 'Seu workspace online foi configurado com sucesso.',
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar conta online.');
    } finally {
      setLoading(false);
    }
  };

  // Handler Criação de Conta Offline
  const handleCreateOfflineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!offlineFullName.trim()) {
      setErrorMsg('Informe seu nome completo.');
      return;
    }
    if (!offlineCompanyName.trim()) {
      setErrorMsg('Informe o nome da sua empresa.');
      return;
    }

    setLoading(true);
    try {
      await createLocalAccount({
        fullName: offlineFullName.trim(),
        companyName: offlineCompanyName.trim(),
        sector: offlineSector.trim(),
        country: offlineCountry.trim(),
        state: offlineState.trim(),
        region: offlineRegion.trim(),
        phone: offlinePhone.trim(),
        whatsapp: offlineWhatsApp.trim() || offlinePhone.trim(),
        localCredential: offlineCredential.trim() || offlineFullName.trim(),
      });

      showToast({
        type: 'info',
        title: 'Conta Local Ativada',
        message: 'Você pode começar a prospectar imediatamente sem internet!',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao inicializar conta local.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-[#0C0E14] text-zinc-900 dark:text-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans transition-colors">
      <div className="w-full max-w-xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#635BFF] to-[#4338CA] text-white shadow-xl shadow-[#635BFF]/20 mb-4 ring-4 ring-[#635BFF]/10">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-950 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
            LEADION
          </h1>
          <p className="text-sm sm:text-base font-medium text-zinc-500 dark:text-zinc-400 mt-1.5 tracking-tight">
            Transformar prospecção em execução
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-none p-6 sm:p-8 relative overflow-hidden backdrop-blur-sm">
          
          {/* BOTÃO VOLTAR SE NÃO FOR LANDING */}
          {step !== 'landing' && (
            <button
              type="button"
              onClick={() => {
                setStep('landing');
                setErrorMsg(null);
                setShowUnsavedLocalWarning(false);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 mb-6 transition-colors cursor-pointer group"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Voltar às opções</span>
            </button>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TELA INICIAL (LANDING COM AS TRÊS OPÇÕES) */}
          {/* ======================================================== */}
          {step === 'landing' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="w-full group flex items-center justify-between p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-[#635BFF] dark:hover:border-[#635BFF] bg-zinc-50/70 hover:bg-[#EEF0FF]/50 dark:bg-zinc-900/50 dark:hover:bg-[#1E1D38]/50 transition-all cursor-pointer text-left shadow-xs hover:shadow-md"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[#635BFF] group-hover:scale-105 transition-transform">
                      <LogIn className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Entrar na minha conta
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Acessar com email e senha já cadastrados na nuvem
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-[#635BFF] group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => setStep('create_online')}
                  className="w-full group flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#635BFF] hover:bg-[#5248E5] text-white shadow-lg shadow-[#635BFF]/25 hover:shadow-xl hover:shadow-[#635BFF]/35 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        Criar minha conta
                      </div>
                      <div className="text-xs text-indigo-100 mt-0.5">
                        Criar perfil online protegido com backup automático
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              </div>

              {/* Separador Visual */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-[#141720] px-4 font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide uppercase text-[11px]">
                    Continuar sem Internet
                  </span>
                </div>
              </div>

              {/* Opção Criar Conta Offline */}
              <button
                type="button"
                onClick={() => setStep('create_offline')}
                className="w-full group flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <WifiOff className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>Criar conta offline</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider">
                        100% Local
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Comece agora mesmo no dispositivo. Conecte à nuvem quando quiser.
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Box Explicativo das Diferenças */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
                <div className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#635BFF]" />
                  <span>Como funciona a persistência no LEADION?</span>
                </div>
                <p className="leading-relaxed">
                  O LEADION é <strong>offline-first</strong>: você não precisa de internet para iniciar seus trabalhos.
                  Contudo, dados criados <em>somente localmente</em> permanecem restritos a este navegador até serem vinculados à nuvem.
                </p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TELA ENTRAR NA MINHA CONTA */}
          {/* ======================================================== */}
          {step === 'login' && (
            <form onSubmit={(e) => handleLoginSubmit(e, false)} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Entrar na minha conta
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Insira as credenciais do seu usuário cadastrado no Supabase
                </p>
              </div>

              {/* Aviso de Dados Locais Pré-existentes */}
              {showUnsavedLocalWarning && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-3 animate-in fade-in">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Dados locais detectados neste navegador</span>
                  </div>
                  <p className="leading-relaxed">
                    Existem <strong>{companies?.length || 0} empresas</strong> e <strong>{actions?.length || 0} ações</strong> registradas localmente antes do login.
                    Deseja mesclar seus dados locais na sua conta online para não perder nada?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={(e) => handleLoginSubmit(e, true)}
                      className="flex-1 py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      Mesclar e Enviar à Nuvem (Recomendado)
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={(e) => handleLoginSubmit(e, false)}
                      className="py-2 px-3 rounded-lg border border-amber-400 dark:border-amber-700 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-medium text-xs transition-colors cursor-pointer"
                    >
                      Carregar Apenas Nuvem
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    E-mail <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="seu.email@empresa.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-[#635BFF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Senha <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Sua senha de acesso"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-[#635BFF]"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 rounded-xl bg-[#635BFF] hover:bg-[#5248E5] text-white font-bold text-xs shadow-md shadow-[#635BFF]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Autenticando e sincronizando...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Entrar e Abrir LEADION</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* TELA CRIAR MINHA CONTA ONLINE */}
          {/* ======================================================== */}
          {step === 'create_online' && (
            <form onSubmit={handleCreateOnlineSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Criar minha conta online
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Identidade do usuário, credenciais e workspace comercial protegido
                </p>
              </div>

              {/* Seção Dados Pessoais */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[10px]">
                  1. Dados Pessoais & Conta
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nome completo <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={onlineFullName}
                      onChange={(e) => setOnlineFullName(e.target.value)}
                      placeholder="Ex: Manuel Domingos"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#635BFF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Email de acesso <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={onlineEmail}
                      onChange={(e) => setOnlineEmail(e.target.value)}
                      placeholder="manuel@exemplo.com"
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
                        value={onlinePassword}
                        onChange={(e) => setOnlinePassword(e.target.value)}
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
                        value={onlineConfirmPassword}
                        onChange={(e) => setOnlineConfirmPassword(e.target.value)}
                        placeholder="Repita a senha"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#635BFF]"
                      />
                    </div>
                  </div>
                </div>

                {/* Feedback Dinâmico NIST */}
                {onlinePassword && (
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 flex items-center justify-between">
                    <span>Força: <strong className={passwordVal.score > 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}>{passwordVal.strengthLabel}</strong> ({passwordVal.score}/100)</span>
                    <span className="text-[10px] text-zinc-400">Espaços e frases permitidos</span>
                  </div>
                )}
              </div>

              {/* Seção Empresa & Workspace */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[10px]">
                  2. Empresa & Localização
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Nome da empresa <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={onlineCompanyName}
                        onChange={(e) => setOnlineCompanyName(e.target.value)}
                        placeholder="Ex: Leadion Corp"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#635BFF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Setor de atuação
                    </label>
                    <input
                      type="text"
                      value={onlineSector}
                      onChange={(e) => setOnlineSector(e.target.value)}
                      placeholder="Ex: SaaS, B2B, Consultoria"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#635BFF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      País
                    </label>
                    <input
                      type="text"
                      value={onlineCountry}
                      onChange={(e) => setOnlineCountry(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Estado/Província
                    </label>
                    <input
                      type="text"
                      value={onlineState}
                      onChange={(e) => setOnlineState(e.target.value)}
                      placeholder="SP, RJ, Luanda"
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Região
                    </label>
                    <input
                      type="text"
                      value={onlineRegion}
                      onChange={(e) => setOnlineRegion(e.target.value)}
                      placeholder="Sudeste, Central"
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>

              {/* Seção Contatos */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[10px]">
                  3. Contatos
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Telefone
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        value={onlinePhone}
                        onChange={(e) => setOnlinePhone(e.target.value)}
                        placeholder="+55 11 99999-0000"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#635BFF]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      WhatsApp Comercial
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-emerald-500 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        value={onlineWhatsApp}
                        onChange={(e) => setOnlineWhatsApp(e.target.value)}
                        placeholder="+55 11 99999-0000"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#635BFF]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#635BFF] hover:bg-[#5248E5] text-white font-bold text-xs shadow-md shadow-[#635BFF]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Criando conta e provisionando workspace...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Concluir Cadastro e Abrir LEADION</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* TELA CRIAR CONTA OFFLINE (SEM INTERNET) */}
          {/* ======================================================== */}
          {step === 'create_offline' && (
            <form onSubmit={handleCreateOfflineSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-2">
                  <WifiOff className="w-3 h-3" />
                  <span>Modo 100% Offline</span>
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Criar conta offline
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Não requer conexão nem Supabase Auth. Seus dados serão armazenados de forma segura neste dispositivo via IndexedDB.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nome completo <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={offlineFullName}
                      onChange={(e) => setOfflineFullName(e.target.value)}
                      placeholder="Ex: Manuel Domingos"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Nome da empresa <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={offlineCompanyName}
                        onChange={(e) => setOfflineCompanyName(e.target.value)}
                        placeholder="Ex: Minha Empresa"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Setor
                    </label>
                    <input
                      type="text"
                      value={offlineSector}
                      onChange={(e) => setOfflineSector(e.target.value)}
                      placeholder="Ex: Vendas B2B"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      País
                    </label>
                    <input
                      type="text"
                      value={offlineCountry}
                      onChange={(e) => setOfflineCountry(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Estado/Província
                    </label>
                    <input
                      type="text"
                      value={offlineState}
                      onChange={(e) => setOfflineState(e.target.value)}
                      placeholder="SP, Luanda"
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Região
                    </label>
                    <input
                      type="text"
                      value={offlineRegion}
                      onChange={(e) => setOfflineRegion(e.target.value)}
                      placeholder="Sul, Central"
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={offlinePhone}
                      onChange={(e) => setOfflinePhone(e.target.value)}
                      placeholder="+55 11 99999-0000"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={offlineWhatsApp}
                      onChange={(e) => setOfflineWhatsApp(e.target.value)}
                      placeholder="+55 11 99999-0000"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Credencial local / Identificador de sessão
                  </label>
                  <input
                    type="text"
                    value={offlineCredential}
                    onChange={(e) => setOfflineCredential(e.target.value)}
                    placeholder="Apelido ou chave de identificação neste dispositivo"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Identificadores UUID únicos (local_user_id e local_workspace_id) serão gerados com segurança criptográfica.
                  </p>
                </div>
              </div>

              {/* Informação explícita de segurança exigida pelo usuário */}
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-amber-600" />
                  <span>Atenção: seus dados permanecerão neste dispositivo</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  &ldquo;Sua conta foi criada neste dispositivo. Para recuperar seus dados em outro dispositivo ou depois de desinstalar o aplicativo, conecte sua conta à nuvem quando estiver online.&rdquo;
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Criando workspace local...</span>
                ) : (
                  <>
                    <HardDrive className="w-4 h-4" />
                    <span>Criar Workspace Local e Entrar Imediatamente</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
