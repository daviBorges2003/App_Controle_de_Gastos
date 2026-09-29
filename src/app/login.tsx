import { Link } from 'expo-router';
import { useState } from 'react';

import { FormScreen } from '@/components/form-screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { traduzirErroAuth } from '@/lib/auth-errors';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    if (!email.trim() || !senha) {
      setErro('Preencha email e senha.');
      return;
    }

    setErro(null);
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    setCarregando(false);

    if (error) {
      setErro(traduzirErroAuth(error));
    }
    // Deu certo? Não precisa navegar: o AuthProvider recebe a nova sessão
    // e o Stack.Protected do _layout troca para as telas do app sozinho.
  }

  return (
    <FormScreen title="Entrar" subtitle="Acesse sua conta para ver seus gastos.">
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
        placeholder="Sua senha"
        secureTextEntry
        autoComplete="current-password"
        onSubmitEditing={entrar}
      />

      {erro && <ThemedText themeColor="danger">{erro}</ThemedText>}

      <Button title="Entrar" onPress={entrar} loading={carregando} />

      <Link href="/cadastro" replace style={{ alignSelf: 'center' }}>
        <ThemedText type="linkPrimary">Não tem conta? Cadastre-se</ThemedText>
      </Link>
    </FormScreen>
  );
}
