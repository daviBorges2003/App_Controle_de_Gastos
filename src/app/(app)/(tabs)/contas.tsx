import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContaFixaItem } from '@/components/conta-fixa-item';
import { SeletorMes } from '@/components/seletor-mes';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { hojeISO, intervaloDoMes, mesAtual, type AnoMes } from '@/lib/datas';
import { formatarMoeda } from '@/lib/dinheiro';
import { mensagemDeErro } from '@/lib/erros';
import { listarContasFixasDoMes } from '@/services/contas-fixas';
import type { ContaFixaDoMes } from '@/types/models';

export default function ContasScreen() {
  const [mes, setMes] = useState(mesAtual);
  const [contas, setContas] = useState<ContaFixaDoMes[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let ativa = true;

      listarContasFixasDoMes(mes)
        .then((dados) => {
          if (!ativa) return;
          setContas(dados);
          setErro(null);
        })
        .catch((e) => ativa && setErro(mensagemDeErro(e)));

      return () => {
        ativa = false;
      };
    }, [mes])
  );

  function trocarMes(novo: AnoMes) {
    setContas(null);
    setMes(novo);
  }

  function registrarPagamento(conta: ContaFixaDoMes) {
    // No mês atual o pagamento é "hoje"; em outro mês, sugere a data do vencimento
    const { inicio, fim } = intervaloDoMes(mes);
    const hoje = hojeISO();
    const data = hoje >= inicio && hoje < fim ? hoje : conta.vencimento;
    router.push({ pathname: '/lancamento', params: { contaFixaId: conta.id, data } });
  }

  const entradas = contas?.filter((c) => c.tipo === 'receita') ?? [];
  const saidas = contas?.filter((c) => c.tipo === 'despesa') ?? [];

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.conteudo}>
          <SeletorMes valor={mes} onChange={trocarMes} />

          {erro && <ThemedText themeColor="danger">{erro}</ThemedText>}
          {!contas && !erro && <ActivityIndicator />}

          {contas && (
            <>
              <ResumoFixos entradas={entradas} saidas={saidas} />

              <Secao
                titulo="Entradas fixas"
                vazio="Cadastre o salário e a recarga do VA para prever o que ainda vai entrar."
                contas={entradas}
                onPagar={registrarPagamento}
              />
              <Secao
                titulo="Saídas fixas"
                vazio="Cadastre aluguel, luz, internet, assinaturas..."
                contas={saidas}
                onPagar={registrarPagamento}
              />
            </>
          )}

          <Button title="+ Nova conta fixa" onPress={() => router.push('/conta-fixa')} />

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Dívidas</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Em breve: parcelamentos, fatura do cartão e empréstimos, com plano de quitação.
            </ThemedText>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function ResumoFixos({ entradas, saidas }: { entradas: ContaFixaDoMes[]; saidas: ContaFixaDoMes[] }) {
  // Já realizado + o previsto das que ainda faltam = como o mês deve terminar
  const somaRealizada = (lista: ContaFixaDoMes[]) =>
    lista.reduce((s, c) => s + (c.pago ? c.valor_realizado : 0), 0);
  const somaPendente = (lista: ContaFixaDoMes[]) => lista.reduce((s, c) => s + (c.pago ? 0 : c.valor), 0);

  const faltaPagar = somaPendente(saidas);
  const faltaReceber = somaPendente(entradas);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.linha}>
        <ThemedText themeColor="textSecondary">Recebido</ThemedText>
        <ThemedText type="smallBold" themeColor="success">
          {formatarMoeda(somaRealizada(entradas))}
        </ThemedText>
      </View>
      <View style={styles.linha}>
        <ThemedText themeColor="textSecondary">Ainda vai entrar</ThemedText>
        <ThemedText type="smallBold">{formatarMoeda(faltaReceber)}</ThemedText>
      </View>
      <View style={styles.linha}>
        <ThemedText themeColor="textSecondary">Pago</ThemedText>
        <ThemedText type="smallBold" themeColor="danger">
          {formatarMoeda(somaRealizada(saidas))}
        </ThemedText>
      </View>
      <View style={styles.linha}>
        <ThemedText themeColor="textSecondary">Ainda falta pagar</ThemedText>
        <ThemedText type="smallBold">{formatarMoeda(faltaPagar)}</ThemedText>
      </View>
    </ThemedView>
  );
}

type SecaoProps = {
  titulo: string;
  vazio: string;
  contas: ContaFixaDoMes[];
  onPagar: (conta: ContaFixaDoMes) => void;
};

function Secao({ titulo, vazio, contas, onPagar }: SecaoProps) {
  return (
    <View>
      <ThemedText type="smallBold">{titulo}</ThemedText>
      {contas.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.vazio}>
          {vazio}
        </ThemedText>
      ) : (
        contas.map((c) => (
          <ContaFixaItem
            key={c.id}
            conta={c}
            onPress={() => router.push({ pathname: '/conta-fixa', params: { id: c.id } })}
            onPagar={() => onPagar(c)}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  conteudo: {
    paddingHorizontal: Spacing.four,
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
  vazio: {
    paddingVertical: Spacing.two,
  },
});
