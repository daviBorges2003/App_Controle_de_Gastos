import { Pressable, StyleSheet, View } from 'react-native';

import { CategoriaIcone } from '@/components/categoria-icone';
import { ThemedText } from '@/components/themed-text';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatarData } from '@/lib/datas';
import { formatarMoeda } from '@/lib/dinheiro';
import { statusDaConta, type StatusConta } from '@/services/contas-fixas';
import type { ContaFixaDoMes } from '@/types/models';

type ContaFixaItemProps = {
  conta: ContaFixaDoMes;
  onPress: () => void; // editar a conta
  onPagar: () => void; // registrar o pagamento/recebimento do mês
};

const ROTULO_STATUS: Record<StatusConta, { texto: string; cor: ThemeColor }> = {
  pago: { texto: '✅ Pago', cor: 'success' },
  pendente: { texto: '⏳ Pendente', cor: 'textSecondary' },
  atrasado: { texto: '🔴 Atrasado', cor: 'danger' },
};

export function ContaFixaItem({ conta, onPress, onPagar }: ContaFixaItemProps) {
  const theme = useTheme();
  const status = statusDaConta(conta);
  const ehReceita = conta.tipo === 'receita';
  const rotulo = ROTULO_STATUS[status];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.linha, pressed && styles.pressionado]}>
      <CategoriaIcone categoria={conta} />

      <View style={styles.textos}>
        <ThemedText numberOfLines={1}>{conta.nome}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {ehReceita ? 'Cai' : 'Vence'} {formatarData(conta.vencimento).slice(0, 5)} · {conta.carteira_nome}
        </ThemedText>
        <ThemedText type="small" themeColor={rotulo.cor}>
          {ehReceita && status === 'pago' ? '✅ Recebido' : rotulo.texto}
          {conta.pago && conta.valor_realizado !== conta.valor && ` (${formatarMoeda(conta.valor_realizado)})`}
        </ThemedText>
      </View>

      <View style={styles.direita}>
        <ThemedText type="smallBold">{formatarMoeda(conta.valor)}</ThemedText>
        {!conta.pago && (
          <Pressable
            onPress={onPagar}
            hitSlop={8}
            style={[styles.botao, { backgroundColor: ehReceita ? theme.success : theme.primary }]}>
            <ThemedText type="smallBold" style={styles.textoBotao}>
              {ehReceita ? 'Recebi' : 'Pagar'}
            </ThemedText>
          </Pressable>
        )}
      </View>
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
  direita: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  botao: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  textoBotao: {
    color: '#ffffff',
  },
});
