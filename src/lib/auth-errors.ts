import type { AuthError } from '@supabase/supabase-js';

// O Supabase devolve mensagens em inglês; traduzimos as mais comuns pelo código do erro
const MENSAGENS: Record<string, string> = {
  invalid_credentials: 'Email ou senha incorretos.',
  email_not_confirmed: 'Confirme seu email antes de entrar (veja sua caixa de entrada).',
  user_already_exists: 'Já existe uma conta com este email.',
  weak_password: 'Senha fraca: use pelo menos 6 caracteres.',
  email_address_invalid: 'Email inválido.',
  validation_failed: 'Verifique o email e a senha informados.',
  over_email_send_rate_limit: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  over_request_rate_limit: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
};

export function traduzirErroAuth(error: AuthError) {
  return (error.code && MENSAGENS[error.code]) || error.message;
}
