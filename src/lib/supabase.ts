import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Faltam EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.local (veja .env.example).'
  );
}

// O SDK acrescenta /auth/v1, /rest/v1 etc. sozinho: a URL deve ser só a base do projeto
if (!/^https?:\/\/[^/]+\/?$/.test(supabaseUrl)) {
  throw new Error(
    `EXPO_PUBLIC_SUPABASE_URL deve ser só a base do projeto (ex: https://xxxx.supabase.co), sem caminho no final. Recebido: ${supabaseUrl}`
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    // Guarda a sessão no aparelho: o usuário continua logado ao reabrir o app
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Só renova o token de login enquanto o app está em primeiro plano
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
