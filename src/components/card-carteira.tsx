import { Pressable, StyleSheet, View } from 'react-native';

import { CategoriaIcone } from '@/components/categoria-icone';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatarMoeda } from '@/lib/dinheiro';
import type { ResumoCarteira } from '@/types/models';

type CardCarteiraProps = {
  carteira: ResumoCarteira;
  nomeMes: string;
  onPress: () => void;
};

export function CardCarteira({ carteira, nomeMes, onPress }: CardCarteiraProps) {
  const theme = useTheme();
  const resultadoMes = carteira.entradas_periodo - carteira.saidas_periodo;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
      ]}>
      <View style={styles.topo}>
        <CategoriaIcone categoria={carteira} tamanho={32} />
        <ThemedText type="smallBold" style={styles.nome}>
          {carteira.nome}
        </ThemedText>
      </View>

      <ThemedText type="subtitle" themeColor={carteira.saldo_final >= 0 ? 'text' : 'danger'}>
        {formatarMoeda(carteira.saldo_final)}
      </ThemedText>

      <View style={styles.linha}>
        <ThemedText type="small" themeColor="textSecondary">
          {nomeMes}:
        </ThemedText>
        <ThemedText type="small" themeColor="success">
          +{formatarMoeda(carteira.entradas_periodo)}
        </ThemedText>
        <ThemedText type="small" themeColor="danger">
          −{formatarMoeda(carteira.saidas_periodo)}
        </ThemedText>
      </View>

      <ThemedText type="small" themeColor={resultadoMes >= 0 ? 'success' : 'danger'}>
        {resultadoMes >= 0 ? '▲ sobrou ' : '▼ faltou '}
        {formatarMoeda(Math.abs(resultadoMes))} no mês
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  nome: {
    flex: 1,
  },
  linha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
