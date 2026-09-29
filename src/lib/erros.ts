// Extrai uma mensagem legível de qualquer erro (Error do JS, PostgrestError do Supabase...)
export function mensagemDeErro(erro: unknown) {
  if (erro && typeof erro === 'object' && 'message' in erro && typeof erro.message === 'string') {
    return erro.message;
  }
  return 'Algo deu errado. Tente novamente.';
}
