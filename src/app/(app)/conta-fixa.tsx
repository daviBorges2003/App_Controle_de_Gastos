import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { SeletorTipo } from '@/components/seletor-tipo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { TextField } from '@/components/ui/text-field';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { lerValor, valorParaTexto } from '@/lib/dinheiro';
import { mensagemDeErro } from '@/lib/erros';
import { listarCarteiras } from '@/services/carteiras';
import { listarCategorias } from '@/services/categorias';
import {
  atualizarContaFixa,
  buscarContaFixa,
  criarContaFixa,
  excluirContaFixa,
} from '@/services/contas-fixas';
import type { Carteira, Categoria, TipoTransacao } from '@/types/models';

export default function ContaFixaScreen() {
  // Com ?id=... edita; sem id, cria
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [tipo, setTipo] = useState<TipoTransacao>('despesa');
  const [nome, setNome] = useState('');
  const [valorTexto, setValorTexto] = useState('');
  const [diaTexto, setDiaTexto] = useState('');
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [carteiraId, setCarteiraId] = useState<string | null>(null);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [carregando, setCarregando] = useState(!!id);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarCategorias()
      .then(setCategorias)
      .catch((e) => setErro(mensagemDeErro(e)));

    listarCarteiras()
      .then((lista) => {
        setCarteiras(lista);
        const padrao = lista.find((c) => c.tipo === 'conta') ?? lista[0];
        setCarteiraId((atual) => atual ?? padrao?.id ?? null);
      })
      .catch((e) => setErro(mensagemDeErro(e)));

    if (id) {
      buscarContaFixa(id)
        .then((c) => {
          setTipo(c.tipo);
          setNome(c.nome);
          setValorTexto(valorParaTexto(c.valor));
          setDiaTexto(String(c.dia_vencimento));
          setCategoriaId(c.categoria_id);
          setCarteiraId(c.carteira_id);
        })
        .catch((e) => setErro(mensagemDeErro(e)))
        .finally(() => setCarregando(false));
    }
  }, [id]);

  function trocarTipo(novo: TipoTransacao) {
    setTipo(novo);
    setCategoriaId(null);
  }

  async function salvar() {
    const valor = lerValor(valorTexto);
    const dia = Number(diaTexto);

    if (!nome.trim()) return setErro('Dê um nome para a conta, ex: Aluguel.');
    if (valor === null) return setErro('Informe um valor válido, ex: 150,00');
    if (!Number.isInteger(dia) || dia < 1 || dia > 31) return setErro('O dia deve ser de 1 a 31.');
    if (!carteiraId) return setErro('Escolha a carteira.');
    if (!categoriaId) return setErro('Escolha uma categoria.');

    setErro(null);
    setSalvando(true);
    const dados = {
      tipo,
      nome: nome.trim(),
      valor,
      dia_vencimento: dia,
      categoria_id: categoriaId,
      carteira_id: carteiraId,
    };

    try {
      if (id) {
        await atualizarContaFixa(id, dados);
      } else {
        await criarContaFixa(dados);
      }
      router.back();
    } catch (e) {
      setErro(mensagemDeErro(e));
      setSalvando(false);
    }
  }

  function confirmarExclusao() {
    Alert.alert('Excluir conta fixa?', 'Os lançamentos já feitos continuam no histórico.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirContaFixa(id!);
            router.back();
          } catch (e) {
            setErro(mensagemDeErro(e));
          }
        },
      },
    ]);
  }

  const ehReceita = tipo === 'receita';

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: id ? 'Editar conta fixa' : 'Nova conta fixa' }} />

      {carregando ? (
        <ActivityIndicator style={styles.flex} />
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
            <SeletorTipo
              valor={tipo}
              onChange={trocarTipo}
              rotulos={{ despesa: 'Saída fixa', receita: 'Entrada fixa' }}
            />

            <TextField
              label="Nome"
              value={nome}
              onChangeText={setNome}
              placeholder={ehReceita ? 'Ex: Salário, Vale alimentação' : 'Ex: Aluguel, Luz, Internet'}
              maxLength={60}
            />

            <View style={styles.linha}>
              <View style={styles.flex}>
                <TextField
                  label="Valor previsto (R$)"
                  value={valorTexto}
                  onChangeText={setValorTexto}
                  placeholder="0,00"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.dia}>
                <TextField
                  label={ehReceita ? 'Cai dia' : 'Vence dia'}
                  value={diaTexto}
                  onChangeText={setDiaTexto}
                  placeholder="10"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>

            <View style={styles.secao}>
              <ThemedText type="smallBold">{ehReceita ? 'Entra em' : 'Pago com'}</ThemedText>
              <View style={styles.chips}>
                {carteiras.map((c) => (
                  <Chip
                    key={c.id}
                    rotulo={c.nome}
                    icone={c}
                    selecionado={c.id === carteiraId}
                    onPress={() => setCarteiraId(c.id)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.secao}>
              <ThemedText type="smallBold">Categoria</ThemedText>
              <View style={styles.chips}>
                {categorias
                  .filter((c) => c.tipo === tipo)
                  .map((c) => (
                    <Chip
                      key={c.id}
                      rotulo={c.nome}
                      icone={c}
                      selecionado={c.id === categoriaId}
                      onPress={() => setCategoriaId(c.id)}
                    />
                  ))}
              </View>
            </View>

            {!ehReceita && (
              <ThemedText type="small" themeColor="textSecondary">
                🎮 Pagando até o vencimento você ganha +20 XP de bônus.
              </ThemedText>
            )}

            {erro && <ThemedText themeColor="danger">{erro}</ThemedText>}

            <Button title="Salvar" onPress={salvar} loading={salvando} />
            {id && <Button title="Excluir" variant="secondary" onPress={confirmarExclusao} />}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  conteudo: {
    padding: Spacing.four,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  linha: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  dia: {
    width: 100,
  },
  secao: {
    gap: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
