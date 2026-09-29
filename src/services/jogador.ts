import { supabase } from '@/lib/supabase';
import type { ResumoJogador } from '@/types/models';

// Chama a função SQL resumo_jogador() (RPC = "remote procedure call")
export async function buscarResumoJogador(): Promise<ResumoJogador> {
  const { data, error } = await supabase
    .rpc('resumo_jogador')
    .single()
    .overrideTypes<ResumoJogador, { merge: false }>();

  if (error) throw error;
  if (!data) throw new Error('Não foi possível carregar seu progresso.');
  return data;
}

export async function buscarNome(): Promise<string | null> {
  const { data, error } = await supabase.from('perfis').select('nome').maybeSingle();

  if (error) throw error;
  return data?.nome ?? null;
}
