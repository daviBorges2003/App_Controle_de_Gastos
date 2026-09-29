// O banco guarda datas como texto 'AAAA-MM-DD' (tipo date, sem hora).
// Montamos/lemos esse texto à mão, com o horário LOCAL, para evitar o clássico bug
// de fuso em que new Date('2026-09-28') vira dia 27 às 21h no Brasil.

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const doisDigitos = (n: number) => String(n).padStart(2, '0');

export function paraISO(data: Date) {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

export function deISO(iso: string) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

export function hojeISO() {
  return paraISO(new Date());
}

// '2026-09-28' → '28/09/2026'
export function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

// '2026-09-28' → 'Hoje' | 'Ontem' | '28/09'
export function formatarDiaRelativo(iso: string) {
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);

  if (iso === hojeISO()) return 'Hoje';
  if (iso === paraISO(ontem)) return 'Ontem';
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

// Mês no formato usado pelas telas: mes de 0 (janeiro) a 11 (dezembro), igual ao Date do JS
export type AnoMes = { ano: number; mes: number };

export function mesAtual(): AnoMes {
  const hoje = new Date();
  return { ano: hoje.getFullYear(), mes: hoje.getMonth() };
}

export function somarMeses({ ano, mes }: AnoMes, quantidade: number): AnoMes {
  const data = new Date(ano, mes + quantidade, 1);
  return { ano: data.getFullYear(), mes: data.getMonth() };
}

// { ano: 2026, mes: 8 } → 'Setembro de 2026'
export function nomeDoMes({ ano, mes }: AnoMes) {
  return `${MESES[mes]} de ${ano}`;
}

// Intervalo [inicio, fim) para filtrar no banco: data >= inicio e data < fim
export function intervaloDoMes(anoMes: AnoMes) {
  return {
    inicio: paraISO(new Date(anoMes.ano, anoMes.mes, 1)),
    fim: paraISO(new Date(anoMes.ano, anoMes.mes + 1, 1)),
  };
}
