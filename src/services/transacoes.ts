import { intervaloDoMes, type AnoMes } from '@/lib/datas';
import { supabase } from '@/lib/supabase';
import type { DadosTransacao, Transacao } from '@/types/models';

// "categoria:categorias(...)" traz a categoria junto, seguindo a chave estrangeira (um JOIN).
// Sem os tipos gerados do banco, o SDK não sabe que é 1 categoria por transação (acha que é
// uma lista); o overrideTypes<...> abaixo informa o formato real da resposta.
const CAMPOS =
  'id, tipo, valor, descricao, data, categoria:categorias(id, nome, tipo, icone, cor), carteira:carteiras(id, nome)';

export async function listarTransacoesDoMes(anoMes: AnoMes): Promise<Transacao[]> {
  const { inicio, fim } = intervaloDoMes(anoMes);
  const { data, error } = await supabase
    .from('transacoes')
    .select(CAMPOS)
    .gte('data', inicio)
    .lt('data', fim)
    .order('data', { ascending: false })
    .order('criado_em', { ascending: false })
    .overrideTypes<Transacao[], { merge: false }>();

  if (error) throw error;
  return data.map(normalizar);
}

export async function buscarTransacao(id: string): Promise<Transacao> {
  const { data, error } = await supabase
    .from('transacoes')
    .select(CAMPOS)
    .eq('id', id)
    .single()
    .overrideTypes<Transacao, { merge: false }>();

  if (error) throw error;
  return normalizar(data);
}

// Coluna numeric: garantimos que "valor" é number (e não texto) antes de somar
function normalizar(t: Transacao): Transacao {
  return { ...t, valor: Number(t.valor) };
}

export async function criarTransacao(dados: DadosTransacao) {
  const { error } = await supabase.from('transacoes').insert(dados);
  if (error) throw error;
}

export async function atualizarTransacao(id: string, dados: DadosTransacao) {
  const { error } = await supabase.from('transacoes').update(dados).eq('id', id);
  if (error) throw error;
}

export async function excluirTransacao(id: string) {
  const { error } = await supabase.from('transacoes').delete().eq('id', id);
  if (error) throw error;
}

export function calcularTotais(transacoes: Transacao[]) {
  let receitas = 0;
  let despesas = 0;
  for (const t of transacoes) {
    if (t.tipo === 'receita') receitas += t.valor;
    else despesas += t.valor;
  }
  return { receitas, despesas, saldo: receitas - despesas };
}
