import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { iconeDaCategoria } from '@/constants/icones';
import type { Categoria } from '@/types/models';

type CategoriaIconeProps = {
  categoria: Pick<Categoria, 'icone' | 'cor'>;
  tamanho?: number;
};

export function CategoriaIcone({ categoria, tamanho = 40 }: CategoriaIconeProps) {
  const cor = categoria.cor ?? '#757575';

  return (
    <View
      style={[
        styles.circulo,
        // cor + '26' = a mesma cor com ~15% de opacidade (hex no formato #RRGGBBAA)
        { width: tamanho, height: tamanho, borderRadius: tamanho / 2, backgroundColor: `${cor}26` },
      ]}>
      <SymbolView name={iconeDaCategoria(categoria.icone)} tintColor={cor} size={tamanho * 0.55} />
    </View>
  );
}

const styles = StyleSheet.create({
  circulo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
