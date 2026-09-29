const formatador = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

// 1234.5 → "R$ 1.234,50"
export function formatarMoeda(valor: number) {
  return formatador.format(valor);
}

// 42.5 → "42,50" (para preencher o campo ao editar)
export function valorParaTexto(valor: number) {
  return valor.toFixed(2).replace('.', ',');
}

// Lê o que o usuário digitou: "42,50", "1.234,56", "12.5", "R$ 10" → número (ou null se inválido).
// Por padrão só aceita valores > 0 (lançamentos); com aceitarZeroOuNegativo, aceita "0" e "-150,00"
// (ex: saldo inicial de uma conta no cheque especial).
export function lerValor(texto: string, { aceitarZeroOuNegativo = false } = {}): number | null {
  let limpo = texto.replace(/R\$|\s/g, '');
  const negativo = limpo.startsWith('-');
  if (negativo) limpo = limpo.slice(1);
  if (!limpo) return null;

  // Com vírgula, ela é o decimal e os pontos são separador de milhar.
  // Sem vírgula, "1.000" / "25.000.000" também são milhar; já "12.5" é decimal.
  const soMilhar = /^\d{1,3}(\.\d{3})+$/.test(limpo);
  const normalizado =
    limpo.includes(',') || soMilhar ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return null;

  const valor = (negativo ? -1 : 1) * Number(normalizado);
  // numeric(12, 2) no banco: até 9.999.999.999,99
  if (Math.abs(valor) >= 1e10) return null;
  if (aceitarZeroOuNegativo) return valor;
  return valor > 0 ? valor : null;
}
