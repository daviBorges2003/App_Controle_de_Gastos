import { Pressable, StyleSheet } from 'react-native';

import { CategoriaIcone } from '@/components/categoria-icone';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = {
  rotulo: string;
  selecionado: boolean;
  onPress: () => void;
  // Opcional: mostra o ícone de uma categoria/carteira e usa a cor dela na borda
  icone?: { icone: string | null; cor: string | null };
};

export function Chip({ rotulo, selecionado, onPress, icone }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        icone ? styles.comIcone : styles.semIcone,
        { backgroundColor: theme.backgroundElement },
        selecionado && { borderColor: icone?.cor ?? theme.primary },
      ]}>
      {icone && <CategoriaIcone categoria={icone} tamanho={24} />}
      <ThemedText type="small">{rotulo}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
    paddingRight: Spacing.three,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  comIcone: {
    paddingLeft: Spacing.one,
  },
  semIcone: {
    paddingLeft: Spacing.three,
  },
});
