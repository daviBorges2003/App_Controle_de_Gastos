import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { FormScreen } from '@/components/form-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { traduzirErroAuth } from '@/lib/auth-errors';
import { supabase } from '@/lib/supabase';

export default function CadastroScreen() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function cadastrar() {
    if (!nome.trim() || !email.trim() || !senha) {
      setErro('Preencha todos os campos.');
      return;
    }

    setErro(null);
    setCarregando(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      // Vai para raw_user_meta_data; o trigger handle_new_user copia para perfis.nome
      options: { data: { nome: nome.trim() } },
    });
    setCarregando(false);

    if (error) {
      setErro(traduzirErroAuth(error));
      return;
    }

    // Com "Confirm email" ligado no Supabase, o cadastro não devolve sessão:
    // o usuário precisa clicar no link do email antes de conseguir entrar.
    if (!data.session) {
      Alert.alert('Confirme seu email', 'Enviamos um link de confirmação. Depois de confirmar, faça login.');
      router.replace('/login');
    }
  }

  return (
    <FormScreen title="Criar conta" subtitle="Comece a controlar seus gastos.">
      <TextField
        label="Nome"
        value={nome}
        onChangeText={setNome}
        placeholder="Como quer ser chamado"
        autoComplete="name"
      />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="voce@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <TextField
        label="Senha"
        value={senha}
        onChangeText={setSenha}
        placeholder="Mínimo de 6 caracteres"
        secureTextEntry
        autoComplete="new-password"
        onSubmitEditing={cadastrar}
      />

      {erro && <ThemedText themeColor="danger">{erro}</ThemedText>}

      <Button title="Cadastrar" onPress={cadastrar} loading={carregando} />

      <Link href="/login" replace style={{ alignSelf: 'center' }}>
        <ThemedText type="linkPrimary">Já tem conta? Entrar</ThemedText>
      </Link>
    </FormScreen>
  );
}
