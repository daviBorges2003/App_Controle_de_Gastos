import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardCarteira } from '@/components/card-carteira';
import { CardJogador } from '@/components/card-jogador';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { mesAtual, nomeDoMes } from '@/lib/datas';
import { formatarMoeda } from '@/lib/dinheiro';
import { mensagemDeErro } from '@/lib/erros';
import { supabase } from '@/lib/supabase';
import { buscarResumoCarteiras } from '@/services/carteiras';
import { buscarNome, buscarResumoJogador } from '@/services/jogador';
import type { ResumoCarteira, ResumoJogador } from '@/types/models';

export default function InicioScreen() {
  const [nome, setNome] = useState<string | null>(null);
  const [resumo, setResumo] = useState<ResumoJogador | null>(null);
  const [carteiras, setCarteiras] = useState<ResumoCarteira[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const mes = mesAtual();
  const nomeMes = nomeDoMes(mes).split(' ')[0]; // 'Setembro de 2026' → 'Setembro'

  // Recarrega toda vez que a tela ganha foco (ex: ao voltar do formulário de lançamento)
  useFocusEffect(
    useCallback(() => {
      let ativa = true;

      Promise.all([buscarNome(), buscarResumoJogador(), buscarResumoCarteiras(mesAtual())])
        .then(([nome, resumo, carteiras]) => {
          if (!ativa) return;
          setNome(nome);
          setResumo(resumo);
          setCarteiras(carteiras);
          setErro(null);
        })
        .catch((e) => ativa && setErro(mensagemDeErro(e)));

      return () => {
        ativa = false;
      };
    }, [])
  );

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.conteudo}>
          <ThemedText type="subtitle">Olá{nome ? `, ${nome}` : ''} 👋</ThemedText>

          {erro && <ThemedText themeColor="danger">{erro}</ThemedText>}

          {resumo && <CardJogador resumo={resumo} />}

          {carteiras && <CardFechamento carteiras={carteiras} nomeMes={nomeMes} />}

          {carteiras?.map((c) => (
            <CardCarteira
              key={c.id}
              carteira={c}
              nomeMes={nomeMes}
              onPress={() => router.push({ pathname: '/carteira', params: { id: c.id } })}
            />
          ))}

          <Button title="+ Novo lançamento" onPress={() => router.push('/lancamento')} />
          {/* O AuthProvider percebe o logout e o Stack.Protected volta para o login */}
          <Button title="Sair" variant="secondary" onPress={() => supabase.auth.signOut()} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// "As contas fecharam?": tudo que entrou − tudo que saiu no mês, somando as carteiras
function CardFechamento({ carteiras, nomeMes }: { carteiras: ResumoCarteira[]; nomeMes: string }) {
  const entradas = carteiras.reduce((soma, c) => soma + c.entradas_periodo, 0);
  const saidas = carteiras.reduce((soma, c) => soma + c.saidas_periodo, 0);
  const resultado = entradas - saidas;
  const noAzul = resultado >= 0;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">Fechamento de {nomeMes}</ThemedText>
      <ThemedText type="subtitle" themeColor={noAzul ? 'success' : 'danger'}>
        {noAzul ? '✅' : '❌'} {noAzul ? '+' : '−'}
        {formatarMoeda(Math.abs(resultado))}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {noAzul
          ? 'Até agora as contas estão fechando no azul.'
          : 'Até agora saiu mais do que entrou este mês.'}
      </ThemedText>
      <View style={styles.linha}>
        <ThemedText type="small" themeColor="success">
          Entrou {formatarMoeda(entradas)}
        </ThemedText>
        <ThemedText type="small" themeColor="danger">
          Saiu {formatarMoeda(saidas)}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  conteudo: {
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
