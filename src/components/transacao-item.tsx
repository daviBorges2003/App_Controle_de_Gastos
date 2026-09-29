import { Pressable, StyleSheet, View } from 'react-native';

import { CategoriaIcone } from '@/components/categoria-icone';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatarDiaRelativo } from '@/lib/datas';
import { formatarMoeda } from '@/lib/dinheiro';
import type { Transacao } from '@/types/models';

type TransacaoItemProps = {
  transacao: Transacao;
  onPress: () => void;
};

export function TransacaoItem({ transacao, onPress }: TransacaoItemProps) {
  const ehReceita = transacao.tipo === 'receita';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.linha, pressed && styles.pressionado]}>
      <CategoriaIcone categoria={transacao.categoria} />

      <View style={styles.textos}>
        <ThemedText numberOfLines={1}>{transacao.descricao || transacao.categoria.nome}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {transacao.categoria.nome} · {transacao.carteira.nome} · {formatarDiaRelativo(transacao.data)}
        </ThemedText>
      </View>

      <ThemedText type="smallBold" themeColor={ehReceita ? 'success' : 'danger'}>
        {ehReceita ? '+ ' : '− '}
        {formatarMoeda(transacao.valor)}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pressionado: {
    opacity: 0.6,
  },
  textos: {
    flex: 1,
  },
});
