import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// Normaliza variáveis de ambiente do Supabase caso contenham prefixos de cópia acidentais, aspas ou nomes de variáveis
function sanitizeKey(raw?: string): string {
  if (!raw) return '';
  let v = String(raw).trim().replace(/^["']|["']$/g, '').trim();
  v = v.replace(/^(export\s+)?VITE_SUPABASE_PUBLISHABLE_KEY\s*[:= ]\s*/i, '').trim();
  v = v.replace(/^(export\s+)?VITE_SUPABASE_ANON_KEY\s*[:= ]\s*/i, '').trim();
  v = v.replace(/^(export\s+)?SUPABASE_KEY\s*[:= ]\s*/i, '').trim();
  return v.replace(/^["']|["']$/g, '').trim();
}

function sanitizeUrl(raw?: string): string {
  if (!raw) return '';
  let v = String(raw).trim().replace(/^["']|["']$/g, '').trim();
  v = v.replace(/^(export\s+)?VITE_SUPABASE_URL\s*[:= ]\s*/i, '').trim();
  v = v.replace(/^(export\s+)?SUPABASE_URL\s*[:= ]\s*/i, '').trim();
  return v.replace(/\/+$/, '').replace(/^["']|["']$/g, '').trim();
}

if (process.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = sanitizeKey(process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
}
if (process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.VITE_SUPABASE_ANON_KEY = sanitizeKey(process.env.VITE_SUPABASE_ANON_KEY);
}
if (process.env.VITE_SUPABASE_URL) {
  process.env.VITE_SUPABASE_URL = sanitizeUrl(process.env.VITE_SUPABASE_URL);
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
