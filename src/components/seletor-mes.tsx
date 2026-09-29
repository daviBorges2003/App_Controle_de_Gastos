import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { nomeDoMes, somarMeses, type AnoMes } from '@/lib/datas';

type SeletorMesProps = {
  valor: AnoMes;
  onChange: (novo: AnoMes) => void;
};

export function SeletorMes({ valor, onChange }: SeletorMesProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Pressable onPress={() => onChange(somarMeses(valor, -1))} hitSlop={12}>
        <SymbolView name={{ ios: 'chevron.left', android: 'chevron_left' }} tintColor={theme.text} size={24} />
      </Pressable>

      <ThemedText type="smallBold">{nomeDoMes(valor)}</ThemedText>

      <Pressable onPress={() => onChange(somarMeses(valor, 1))} hitSlop={12}>
        <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right' }} tintColor={theme.text} size={24} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
});
