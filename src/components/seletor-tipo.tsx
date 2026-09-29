import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TipoTransacao } from '@/types/models';

type SeletorTipoProps = {
  valor: TipoTransacao;
  onChange: (tipo: TipoTransacao) => void;
  rotulos?: Record<TipoTransacao, string>;
};

// Botões lado a lado "Gasto | Receita" (vermelho/verde quando selecionado)
export function SeletorTipo({
  valor,
  onChange,
  rotulos = { despesa: 'Gasto', receita: 'Receita' },
}: SeletorTipoProps) {
  const theme = useTheme();

  return (
    <View style={[styles.segmentos, { backgroundColor: theme.backgroundElement }]}>
      {(['despesa', 'receita'] as const).map((opcao) => {
        const ativo = valor === opcao;
        const corAtiva = opcao === 'despesa' ? theme.danger : theme.success;
        return (
          <Pressable
            key={opcao}
            onPress={() => onChange(opcao)}
            style={[styles.segmento, ativo && { backgroundColor: corAtiva }]}>
            <ThemedText type="smallBold" style={ativo && styles.textoAtivo}>
              {rotulos[opcao]}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segmentos: {
    flexDirection: 'row',
    borderRadius: Spacing.two,
    padding: Spacing.one,
  },
  segmento: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two - 2,
  },
  textoAtivo: {
    color: '#ffffff',
  },
});
