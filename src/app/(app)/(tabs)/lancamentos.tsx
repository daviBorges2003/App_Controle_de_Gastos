import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SeletorMes } from '@/components/seletor-mes';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TransacaoItem } from '@/components/transacao-item';
import { Chip } from '@/components/ui/chip';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { mesAtual, nomeDoMes } from '@/lib/datas';
import { formatarMoeda } from '@/lib/dinheiro';
import { mensagemDeErro } from '@/lib/erros';
import { listarCarteiras } from '@/services/carteiras';
import { calcularTotais, listarTransacoesDoMes } from '@/services/transacoes';
import type { Carteira, Transacao } from '@/types/models';

export default function LancamentosScreen() {
  const theme = useTheme();
  const [mes, setMes] = useState(mesAtual);
  const [transacoes, setTransacoes] = useState<Transacao[] | null>(null);
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [filtroCarteira, setFiltroCarteira] = useState<string | null>(null); // null = todas
  const [erro, setErro] = useState<string | null>(null);

  // Roda ao focar a tela e toda vez que o mês muda
  useFocusEffect(
    useCallback(() => {
      // Evita que a resposta de um mês antigo (mais lenta) sobrescreva a do mês novo
      let ativa = true;

      Promise.all([listarTransacoesDoMes(mes), listarCarteiras()])
        .then(([dados, carteiras]) => {
          if (!ativa) return;
          setTransacoes(dados);
          setCarteiras(carteiras);
          setErro(null);
        })
        .catch((e) => ativa && setErro(mensagemDeErro(e)));

      return () => {
        ativa = false;
      };
    }, [mes])
  );

  function trocarMes(novo: typeof mes) {
    setTransacoes(null); // mostra o "carregando" enquanto busca o novo mês
    setMes(novo);
  }

  // Filtro feito no próprio app: os dados do mês já estão carregados
  const visiveis = transacoes?.filter((t) => !filtroCarteira || t.carteira.id === filtroCarteira) ?? null;
  const totais = visiveis && calcularTotais(visiveis);

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FlatList
          data={visiveis ?? []}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.conteudo}
          renderItem={({ item }) => (
            <TransacaoItem
              transacao={item}
              onPress={() => router.push({ pathname: '/lancamento', params: { id: item.id } })}
            />
          )}
          ListHeaderComponent={
            <View style={styles.cabecalho}>
              <SeletorMes valor={mes} onChange={trocarMes} />
              <View style={styles.filtros}>
                <Chip rotulo="Todas" selecionado={!filtroCarteira} onPress={() => setFiltroCarteira(null)} />
                {carteiras.map((c) => (
                  <Chip
                    key={c.id}
                    rotulo={c.nome}
                    selecionado={filtroCarteira === c.id}
                    onPress={() => setFiltroCarteira(c.id)}
                  />
                ))}
              </View>
              {totais && (
                <ThemedText type="small" themeColor="textSecondary">
                  Entrou {formatarMoeda(totais.receitas)} · Saiu {formatarMoeda(totais.despesas)} · Resultado{' '}
                  {formatarMoeda(totais.saldo)}
                </ThemedText>
              )}
              {erro && <ThemedText themeColor="danger">{erro}</ThemedText>}
            </View>
          }
          ListEmptyComponent={
            transacoes === null ? (
              <ActivityIndicator style={styles.vazio} />
            ) : (
              <ThemedText themeColor="textSecondary" style={styles.vazio}>
                Nenhum lançamento em {nomeDoMes(mes)}.{'\n'}Toque no + para registrar e ganhar XP!
              </ThemedText>
            )
          }
        />

        {/* Botão flutuante (FAB) */}
        <Pressable
          onPress={() => router.push('/lancamento')}
          style={({ pressed }) => [styles.fab, { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 }]}>
          <SymbolView name={{ ios: 'plus', android: 'add' }} tintColor="#ffffff" size={28} />
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  conteudo: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.six + Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  cabecalho: {
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  filtros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  vazio: {
    marginTop: Spacing.six,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: BottomTabInset + Spacing.three,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
