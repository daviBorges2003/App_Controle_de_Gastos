import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { lerValor, valorParaTexto } from '@/lib/dinheiro';
import { mensagemDeErro } from '@/lib/erros';
import { atualizarCarteira, buscarCarteira } from '@/services/carteiras';

export default function CarteiraScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [nome, setNome] = useState('');
  const [saldoTexto, setSaldoTexto] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    buscarCarteira(id)
      .then((c) => {
        setNome(c.nome);
        setSaldoTexto(valorParaTexto(c.saldo_inicial));
      })
      .catch((e) => setErro(mensagemDeErro(e)))
      .finally(() => setCarregando(false));
  }, [id]);

  async function salvar() {
    const saldo = lerValor(saldoTexto, { aceitarZeroOuNegativo: true });
    if (!nome.trim()) {
      setErro('Informe um nome.');
      return;
    }
    if (saldo === null) {
      setErro('Informe um saldo válido, ex: 1.250,00 (ou -200,00 se estava negativo).');
      return;
    }

    setErro(null);
    setSalvando(true);
    try {
      await atualizarCarteira(id, { nome: nome.trim(), saldo_inicial: saldo });
      router.back();
    } catch (e) {
      setErro(mensagemDeErro(e));
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <ThemedView style={styles.flex}>
        <ActivityIndicator style={styles.flex} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <TextField label="Nome" value={nome} onChangeText={setNome} maxLength={40} />

          <TextField
            label="Saldo inicial (R$)"
            value={saldoTexto}
            onChangeText={setSaldoTexto}
            placeholder="0,00"
            // Precisa do sinal de menos (saldo negativo): no iOS só este teclado tem "-"
            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
          />
          <ThemedText type="small" themeColor="textSecondary">
            Quanto havia nesta carteira quando você começou a usar o app. A partir daí, o saldo é
            calculado com os lançamentos: saldo inicial + entradas − saídas.
          </ThemedText>

          {erro && <ThemedText themeColor="danger">{erro}</ThemedText>}

          <Button title="Salvar" onPress={salvar} loading={salvando} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  conteudo: {
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
