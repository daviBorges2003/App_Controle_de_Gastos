import { Stack } from 'expo-router';

// Pilha de telas do usuário logado: as abas embaixo e o formulário de lançamento por cima
export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="lancamento" options={{ presentation: 'modal', title: 'Novo lançamento' }} />
      <Stack.Screen name="carteira" options={{ presentation: 'modal', title: 'Editar carteira' }} />
      <Stack.Screen name="conta-fixa" options={{ presentation: 'modal', title: 'Conta fixa' }} />
    </Stack>
  );
}
