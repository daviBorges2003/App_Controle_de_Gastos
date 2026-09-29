import { supabase } from '@/lib/supabase';
import type { Categoria } from '@/types/models';

export async function listarCategorias(): Promise<Categoria[]> {
  // O RLS já filtra: só voltam as categorias do usuário logado
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nome, tipo, icone, cor')
    .order('nome');

  if (error) throw error;
  return data;
}
