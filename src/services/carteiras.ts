import { intervaloDoMes, type AnoMes } from '@/lib/datas';
import { supabase } from '@/lib/supabase';
import type { Carteira, ResumoCarteira } from '@/types/models';

const CAMPOS = 'id, nome, tipo, icone, cor, saldo_inicial';

export async function listarCarteiras(): Promise<Carteira[]> {
  const { data, error } = await supabase
    .from('carteiras')
    .select(CAMPOS)
    .order('tipo')
    .order('nome')
    .overrideTypes<Carteira[], { merge: false }>();

  if (error) throw error;
  return data.map((c) => ({ ...c, saldo_inicial: Number(c.saldo_inicial) }));
}

export async function buscarCarteira(id: string): Promise<Carteira> {
  const { data, error } = await supabase
    .from('carteiras')
    .select(CAMPOS)
    .eq('id', id)
    .single()
    .overrideTypes<Carteira, { merge: false }>();

  if (error) throw error;
  return { ...data, saldo_inicial: Number(data.saldo_inicial) };
}

export async function atualizarCarteira(id: string, dados: Pick<Carteira, 'nome' | 'saldo_inicial'>) {
  const { error } = await supabase.from('carteiras').update(dados).eq('id', id);
  if (error) throw error;
}

// Chama a função SQL resumo_carteiras(inicio, fim) para o mês pedido
export async function buscarResumoCarteiras(anoMes: AnoMes): Promise<ResumoCarteira[]> {
  const { data, error } = await supabase.rpc('resumo_carteiras', intervaloDoMes(anoMes));

  if (error) throw error;
  // Sem os tipos gerados do banco, o SDK não conhece o retorno da função: informamos com "as"
  const linhas = (data ?? []) as ResumoCarteira[];
  // Colunas numeric: garantimos que chegam como number (e não texto) antes de somar
  return linhas.map((c) => ({
    ...c,
    saldo_inicial: Number(c.saldo_inicial),
    saldo_final: Number(c.saldo_final),
    entradas_periodo: Number(c.entradas_periodo),
    saidas_periodo: Number(c.saidas_periodo),
  }));
}
