import type { SymbolViewProps } from 'expo-symbols';

type NomeIcone = SymbolViewProps['name'];

// A coluna categorias.icone guarda uma chave; aqui ela vira o ícone nativo de cada sistema:
// SF Symbols no iOS e Material Symbols no Android (https://fonts.google.com/icons)
const ICONES: Record<string, NomeIcone> = {
  briefcase: { ios: 'briefcase.fill', android: 'work' },
  laptop: { ios: 'laptopcomputer', android: 'laptop' },
  'chart-line': { ios: 'chart.line.uptrend.xyaxis', android: 'trending_up' },
  'cash-plus': { ios: 'banknote.fill', android: 'payments' },
  food: { ios: 'fork.knife', android: 'restaurant' },
  home: { ios: 'house.fill', android: 'home' },
  car: { ios: 'car.fill', android: 'directions_car' },
  'file-document': { ios: 'doc.text.fill', android: 'receipt_long' },
  'heart-pulse': { ios: 'heart.fill', android: 'favorite' },
  school: { ios: 'graduationcap.fill', android: 'school' },
  'gamepad-variant': { ios: 'gamecontroller.fill', android: 'sports_esports' },
  cart: { ios: 'cart.fill', android: 'shopping_cart' },
  'dots-horizontal': { ios: 'ellipsis', android: 'more_horiz' },
  basket: { ios: 'basket.fill', android: 'shopping_basket' },
  'food-card': { ios: 'creditcard.fill', android: 'credit_card' },
  bank: { ios: 'building.columns.fill', android: 'account_balance' },
};

// Serve para categorias e carteiras (as duas tabelas têm a coluna "icone")
export function iconeDaCategoria(chave: string | null): NomeIcone {
  return (chave && ICONES[chave]) || ICONES['dots-horizontal'];
}
