import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { useTheme } from '@/hooks/use-theme';
import { deISO, formatarData, hojeISO, paraISO } from '@/lib/datas';
import { lerValor, valorParaTexto } from '@/lib/dinheiro';
import { mensagemDeErro } from '@/lib/erros';
import { listarCarteiras } from '@/services/carteiras';
import { listarCategorias } from '@/services/categorias';
import { buscarContaFixa } from '@/services/contas-fixas';
import {
  atualizarTransacao,
  buscarTransacao,
  criarTransacao,
  excluirTransacao,
} from '@/services/transacoes';
import type { Carteira, Categoria, TipoTransacao } from '@/types/models';

export default function LancamentoScreen() {
  // ?id=...          → edita um lançamento existente
  // ?contaFixaId=... → novo lançamento que paga/recebe uma conta fixa (vem preenchido)
  // nenhum           → lançamento novo em branco
  const params = useLocalSearchParams<{ id?: string; contaFixaId?: string; data?: string }>();
  const { id, contaFixaId } = params;
  const theme = useTheme();

  const [tipo, setTipo] = useState<TipoTransacao>('despesa');
  const [valorTexto, setValorTexto] = useState('');
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [carteiraId, setCarteiraId] = useState<string | null>(null);
  const [data, setData] = useState(() => params.data ?? hojeISO());
  const [descricao, setDescricao] = useState('');

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [carregando, setCarregando] = useState(!!id || !!contaFixaId);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarCategorias()
      .then(setCategorias)
      .catch((e) => setErro(mensagemDeErro(e)));

    listarCarteiras()
      .then((lista) => {
        setCarteiras(lista);
        // Lançamento novo começa na conta principal (a edição preenche com a carteira salva)
        const padrao = lista.find((c) => c.tipo === 'conta') ?? lista[0];
        setCarteiraId((atual) => atual ?? padrao?.id ?? null);
      })
      .catch((e) => setErro(mensagemDeErro(e)));

    if (id) {
      buscarTransacao(id)
        .then((t) => {
          setTipo(t.tipo);
          setValorTexto(valorParaTexto(t.valor));
          setCategoriaId(t.categoria.id);
          setCarteiraId(t.carteira.id);
          setData(t.data);
          setDescricao(t.descricao ?? '');
        })
        .catch((e) => setErro(mensagemDeErro(e)))
        .finally(() => setCarregando(false));
    } else if (contaFixaId) {
      // Preenche com os dados da conta fixa; o valor pode ser ajustado (ex: a luz veio mais cara)
      buscarContaFixa(contaFixaId)
        .then((c) => {
          setTipo(c.tipo);
          setValorTexto(valorParaTexto(c.valor));
          setCategoriaId(c.categoria_id);
          setCarteiraId(c.carteira_id);
          setDescricao(c.nome);
        })
        .catch((e) => setErro(mensagemDeErro(e)))
        .finally(() => setCarregando(false));
    }
  }, [id, contaFixaId]);

  function trocarTipo(novo: TipoTransacao) {
    setTipo(novo);
    setCategoriaId(null); // categorias de gasto e de receita são diferentes
  }

  function aoEscolherData(evento: DateTimePickerEvent, escolhida?: Date) {
    // No Android o calendário é um diálogo que fecha sozinho; no iOS fica na tela
    setMostrarCalendario(Platform.OS === 'ios');
    if (evento.type === 'set' && escolhida) {
      setData(paraISO(escolhida));
    }
  }

  async function salvar() {
    const valor = lerValor(valorTexto);
    if (valor === null) {
      setErro('Informe um valor válido, ex: 25,90');
      return;
    }
    if (!carteiraId) {
      setErro('Escolha a carteira.');
      return;
    }
    if (!categoriaId) {
      setErro('Escolha uma categoria.');
      return;
    }

    setErro(null);
    setSalvando(true);
    const dados = {
      tipo,
      valor,
      carteira_id: carteiraId,
      categoria_id: categoriaId,
      data,
      descricao: descricao.trim() || null,
      // Liga o lançamento à conta fixa: é assim que ela aparece como "paga" no mês
      ...(contaFixaId && !id ? { conta_fixa_id: contaFixaId } : {}),
    };

    try {
      if (id) {
        await atualizarTransacao(id, dados);
      } else {
        await criarTransacao(dados);
      }
      router.back();
    } catch (e) {
      setErro(mensagemDeErro(e));
      setSalvando(false);
    }
  }

  function confirmarExclusao() {
    Alert.alert('Excluir lançamento?', 'O XP ganho com ele também será removido.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirTransacao(id!);
            router.back();
          } catch (e) {
            setErro(mensagemDeErro(e));
          }
        },
      },
    ]);
  }

  const categoriasDoTipo = categorias.filter((c) => c.tipo === tipo);
  const pagandoContaFixa = !!contaFixaId && !id;

  let titulo = 'Novo lançamento';
  if (id) titulo = 'Editar lançamento';
  else if (pagandoContaFixa) titulo = tipo === 'despesa' ? 'Pagar conta' : 'Confirmar recebimento';

  let rotuloBotao = 'Registrar (+10 XP)';
  if (id) rotuloBotao = 'Salvar alterações';
  else if (pagandoContaFixa) rotuloBotao = tipo === 'despesa' ? 'Confirmar pagamento' : 'Confirmar recebimento';

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: titulo }} />

      {carregando ? (
        <ActivityIndicator style={styles.flex} />
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
            {/* Ao pagar uma conta fixa o tipo já vem definido por ela */}
            {!pagandoContaFixa && <SeletorTipo valor={tipo} onChange={trocarTipo} />}

            <TextField
              label="Valor (R$)"
              value={valorTexto}
              onChangeText={setValorTexto}
              placeholder="0,00"
              keyboardType="decimal-pad"
              style={styles.valor}
            />

            <View style={styles.secao}>
              <ThemedText type="smallBold">{tipo === 'despesa' ? 'Pago com' : 'Entrou em'}</ThemedText>
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
                {categoriasDoTipo.map((c) => (
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

            <View style={styles.secao}>
              <ThemedText type="smallBold">Data</ThemedText>
              <Pressable
                onPress={() => setMostrarCalendario(true)}
                style={[styles.campoData, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText>{data === hojeISO() ? `Hoje (${formatarData(data)})` : formatarData(data)}</ThemedText>
              </Pressable>
              {mostrarCalendario && (
                <DateTimePicker value={deISO(data)} mode="date" onChange={aoEscolherData} />
              )}
            </View>

            <TextField
              label="Descrição (opcional)"
              value={descricao}
              onChangeText={setDescricao}
              placeholder={tipo === 'despesa' ? 'Ex: almoço, uber, mercado...' : 'Ex: salário de setembro'}
              maxLength={200}
            />

            {erro && <ThemedText themeColor="danger">{erro}</ThemedText>}

            <Button title={rotuloBotao} onPress={salvar} loading={salvando} />
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
  valor: {
    fontSize: 28,
    fontWeight: 600,
  },
  secao: {
    gap: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  campoData: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderRadius: Spacing.two,
  },
});
