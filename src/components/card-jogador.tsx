import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ResumoJogador } from '@/types/models';

export function CardJogador({ resumo }: { resumo: ResumoJogador }) {
  const theme = useTheme();

  const xpNoNivel = resumo.xp_total - resumo.xp_inicio_nivel;
  const xpDoNivel = resumo.xp_proximo_nivel - resumo.xp_inicio_nivel;
  const progresso = xpNoNivel / xpDoNivel;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.linha}>
        <ThemedText type="subtitle">Nível {resumo.nivel}</ThemedText>
        <View style={styles.streak}>
          <ThemedText type="subtitle">🔥 {resumo.streak_atual}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {resumo.streak_atual === 1 ? 'dia' : 'dias'}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.barraFundo, { backgroundColor: theme.backgroundSelected }]}>
        <View style={[styles.barra, { width: `${progresso * 100}%`, backgroundColor: theme.primary }]} />
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        {xpNoNivel} / {xpDoNivel} XP para o nível {resumo.nivel + 1}
      </ThemedText>

      {!resumo.registrou_hoje && (
        <ThemedText type="small">
          {resumo.streak_atual > 0
            ? '⚠️ Registre algo hoje para não perder sua sequência!'
            : 'Registre um gasto hoje para começar uma sequência.'}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  barraFundo: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barra: {
    height: '100%',
    borderRadius: 5,
  },
});
