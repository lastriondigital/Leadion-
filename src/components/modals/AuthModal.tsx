import React, { useState } from 'react';
import { useLeadion } from '../../context/LeadionContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { 
  User, 
  LogIn, 
  UserPlus, 
  LogOut, 
  Mail, 
  Lock, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Database,
  KeyRound
} from 'lucide-react';
import { getSupabaseCredentials } from '../../core/supabase/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, signIn, signUp, signOut, triggerCloudSync } = useLeadion() as any;
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const creds = getSupabaseCredentials();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await signIn(email, password);
        if (res.success) {
          showToast({
            type: 'success',
            title: 'Sessão Iniciada',
            message: `Bem-vindo de volta ao LEADION!`,
          });
          if (triggerCloudSync) triggerCloudSync();
          onClose();
        } else {
          setErrorMessage(res.error || 'Falha ao autenticar.');
        }
      } else {
        const res = await signUp(email, password, fullName);
        if (res.success) {
          if (res.requiresEmailConfirmation) {
            setSuccessMessage('Cadastro realizado! Verifique sua caixa de entrada para confirmar o e-mail.');
          } else {
            showToast({
              type: 'success',
              title: 'Conta Criada',
              message: 'Sua conta no LEADION foi registrada com sucesso!',
            });
            if (triggerCloudSync) triggerCloudSync();
            onClose();
          }
        } else {
          setErrorMessage(res.error || 'Falha ao criar conta.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      showToast({
        type: 'info',
        title: 'Sessão Encerrada',
        message: 'Você saiu da sua conta do LEADION.',
      });
      onClose();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Erro ao sair',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] rounded-[22px] shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#232836] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {currentUser ? 'Perfil & Autenticação' : mode === 'login' ? 'Entrar no LEADION' : 'Criar Nova Conta'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Supabase Auth & Isolamento de Dados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {currentUser ? (
            /* Logged in state */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-emerald-900 dark:text-emerald-200">
                    Autenticado via Supabase
                  </div>
                  <div className="text-emerald-700 dark:text-emerald-300 break-all font-mono">
                    {currentUser.email}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 pt-1">
                    ID: {currentUser.id}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
                <div className="flex items-center gap-2 font-medium text-zinc-800 dark:text-zinc-200">
                  <Database className="w-3.5 h-3.5 text-[#635BFF]" />
                  <span>Instância PostgreSQL Conectada</span>
                </div>
                <div className="font-mono text-[11px] text-zinc-500 truncate">
                  {creds.url}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Fechar
                </Button>
                <Button
                  variant="danger"
                  icon={<LogOut className="w-4 h-4" />}
                  onClick={handleSignOut}
                  loading={loading}
                  className="flex-1"
                >
                  Encerrar Sessão
                </Button>
              </div>
            </div>
          ) : (
            /* Login / Signup Form */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ex: Manuel Domingos"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#635BFF]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@empresa.com"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#635BFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#635BFF]"
                  />
                </div>
              </div>

              <Button
                variant="primary"
                type="submit"
                loading={loading}
                icon={mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                className="w-full mt-2"
              >
                {mode === 'login' ? 'Entrar' : 'Criar Conta'}
              </Button>

              <div className="pt-2 text-center">
                {mode === 'login' ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Ainda não possui conta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[#635BFF] hover:underline font-semibold"
                    >
                      Cadastre-se
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Já tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[#635BFF] hover:underline font-semibold"
                    >
                      Entrar
                    </button>
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
