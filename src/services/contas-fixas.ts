import { hojeISO, intervaloDoMes, type AnoMes } from '@/lib/datas';
import { supabase } from '@/lib/supabase';
import type { ContaFixa, ContaFixaDoMes } from '@/types/models';

const CAMPOS = 'id, nome, tipo, valor, dia_vencimento, categoria_id, carteira_id';

export type DadosContaFixa = Omit<ContaFixa, 'id'>;
export type StatusConta = 'pago' | 'pendente' | 'atrasado';

// Chama a função SQL contas_fixas_do_mes(inicio, fim)
export async function listarContasFixasDoMes(anoMes: AnoMes): Promise<ContaFixaDoMes[]> {
  const { data, error } = await supabase.rpc('contas_fixas_do_mes', intervaloDoMes(anoMes));

  if (error) throw error;
  // Sem os tipos gerados do banco, o SDK não conhece o retorno da função: informamos com "as"
  const linhas = (data ?? []) as ContaFixaDoMes[];
  return linhas.map((c) => ({ ...c, valor: Number(c.valor), valor_realizado: Number(c.valor_realizado) }));
}

export async function buscarContaFixa(id: string): Promise<ContaFixa> {
  const { data, error } = await supabase
    .from('contas_fixas')
    .select(CAMPOS)
    .eq('id', id)
    .single()
    .overrideTypes<ContaFixa, { merge: false }>();

  if (error) throw error;
  return { ...data, valor: Number(data.valor) };
}

export async function criarContaFixa(dados: DadosContaFixa) {
  const { error } = await supabase.from('contas_fixas').insert(dados);
  if (error) throw error;
}

export async function atualizarContaFixa(id: string, dados: DadosContaFixa) {
  const { error } = await supabase.from('contas_fixas').update(dados).eq('id', id);
  if (error) throw error;
}

// Os lançamentos já feitos continuam existindo (o banco só remove a ligação com a conta)
export async function excluirContaFixa(id: string) {
  const { error } = await supabase.from('contas_fixas').delete().eq('id', id);
  if (error) throw error;
}

export function statusDaConta(conta: ContaFixaDoMes): StatusConta {
  if (conta.pago) return 'pago';
  return hojeISO() > conta.vencimento ? 'atrasado' : 'pendente';
}
