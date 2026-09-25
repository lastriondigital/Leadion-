/**
 * POLÍTICA DE SENHAS MODERNA (NIST SP 800-63B / OWASP)
 * 
 * Princípios aplicados:
 * 1. Não exigir regras artificiais (ex: 1 maiúscula, 1 minúscula, 1 número, 1 símbolo).
 * 2. Permitir frases secretas longas (passphrases), espaços e caracteres Unicode.
 * 3. Exigir comprimento mínimo seguro (mínimo 8 caracteres, recomendado >= 12).
 * 4. Bloquear senhas comuns / fracas conhecidas.
 * 5. Não truncar senhas (suporta até 128 caracteres).
 */

const COMMON_WEAK_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  'password',
  'password123',
  'senha123',
  'senha1234',
  'leadion123',
  'admin123',
  'qwerty123',
  'qwertyuiop',
  'master123',
  'welcome123',
  'iloveyou',
  'prospeccao',
  'vendas123',
]);

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 a 100
  feedback: string;
  isTooShort: boolean;
  isCommon: boolean;
  strengthLabel: 'Fraca' | 'Razoável' | 'Boa' | 'Excelente';
}

export function validatePasswordNist(password: string): PasswordValidationResult {
  const trimmed = password || '';
  const length = trimmed.length;

  if (length === 0) {
    return {
      isValid: false,
      score: 0,
      feedback: 'Informe uma senha segura com no mínimo 8 caracteres.',
      isTooShort: true,
      isCommon: false,
      strengthLabel: 'Fraca',
    };
  }

  if (length < 8) {
    return {
      isValid: false,
      score: Math.min(25, length * 3),
      feedback: `Senha curta demais (${length}/8 caracteres). Digite pelo menos 8 caracteres.`,
      isTooShort: true,
      isCommon: false,
      strengthLabel: 'Fraca',
    };
  }

  const lower = trimmed.toLowerCase();
  if (COMMON_WEAK_PASSWORDS.has(lower)) {
    return {
      isValid: false,
      score: 15,
      feedback: 'Esta senha é muito comum e fácil de adivinhar. Escolha uma combinação ou frase única.',
      isTooShort: false,
      isCommon: true,
      strengthLabel: 'Fraca',
    };
  }

  // Cálculo de entropia e força sem obrigar símbolos
  let score = 30; // base para >= 8 caracteres

  // Bônus por comprimento (NIST encoraja passphrases longas)
  if (length >= 10) score += 15;
  if (length >= 12) score += 20;
  if (length >= 16) score += 15;

  // Presença de diversidade voluntária (sem ser obrigatória)
  const hasSpaces = /\s/.test(trimmed); // Frases com espaço são ótimas passphrases!
  const hasMixedCase = /[a-z]/.test(trimmed) && /[A-Z]/.test(trimmed);
  const hasNumbers = /\d/.test(trimmed);
  const hasSpecial = /[^a-zA-Z0-9\s]/.test(trimmed);

  if (hasSpaces) score += 10;
  if (hasMixedCase) score += 5;
  if (hasNumbers) score += 5;
  if (hasSpecial) score += 5;

  score = Math.min(100, Math.max(20, score));

  let strengthLabel: 'Fraca' | 'Razoável' | 'Boa' | 'Excelente' = 'Fraca';
  let feedback = 'Senha aceitável.';

  if (score >= 80) {
    strengthLabel = 'Excelente';
    feedback = 'Senha forte e protegida! Ótimo uso de comprimento/passphrase.';
  } else if (score >= 60) {
    strengthLabel = 'Boa';
    feedback = 'Senha segura. Dica: você pode usar frases inteiras com espaços.';
  } else if (score >= 40) {
    strengthLabel = 'Razoável';
    feedback = 'Senha válida. Aumentar o tamanho para 12+ caracteres melhora ainda mais a segurança.';
  } else {
    strengthLabel = 'Fraca';
    feedback = 'Tente usar uma frase secreta mais longa (ex: "minha prospecção gera resultados").';
  }

  return {
    isValid: true,
    score,
    feedback,
    isTooShort: false,
    isCommon: false,
    strengthLabel,
  };
}
