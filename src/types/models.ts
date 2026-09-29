// Formato dos dados que vêm do Supabase (espelham as tabelas das migrations)

export type TipoTransacao = 'receita' | 'despesa';

export type Categoria = {
  id: string;
  nome: string;
  tipo: TipoTransacao;
  icone: string | null;
  cor: string | null;
};

// conta = salário, pagamentos... | beneficio = cartão alimentação/refeição
export type TipoCarteira = 'conta' | 'beneficio';

export type Carteira = {
  id: string;
  nome: string;
  tipo: TipoCarteira;
  icone: string | null;
  cor: string | null;
  saldo_inicial: number;
};

// Retorno da função SQL resumo_carteiras(inicio, fim)
export type ResumoCarteira = Carteira & {
  saldo_final: number; // saldo acumulado até o fim do período
  entradas_periodo: number;
  saidas_periodo: number;
};

export type Transacao = {
  id: string;
  tipo: TipoTransacao;
  valor: number;
  descricao: string | null;
  data: string; // 'AAAA-MM-DD'
  categoria: Categoria;
  carteira: Pick<Carteira, 'id' | 'nome'>;
};

// O que o app envia ao criar/editar (user_id o banco preenche sozinho)
export type DadosTransacao = {
  tipo: TipoTransacao;
  valor: number;
  categoria_id: string;
  carteira_id: string;
  data: string;
  descricao: string | null;
  conta_fixa_id?: string | null; // preenchido quando o lançamento paga/recebe uma conta fixa
};

// Conta que se repete todo mês: aluguel, luz (saídas) ou salário, VA (entradas)
export type ContaFixa = {
  id: string;
  nome: string;
  tipo: TipoTransacao;
  valor: number; // valor previsto
  dia_vencimento: number;
  categoria_id: string;
  carteira_id: string;
};

// Retorno da função SQL contas_fixas_do_mes(inicio, fim)
export type ContaFixaDoMes = ContaFixa & {
  vencimento: string; // 'AAAA-MM-DD' do vencimento naquele mês
  categoria_nome: string;
  icone: string | null;
  cor: string | null;
  carteira_nome: string;
  valor_realizado: number; // quanto já foi pago/recebido no mês
  pago: boolean;
};

export type ResumoJogador = {
  xp_total: number;
  nivel: number;
  xp_inicio_nivel: number;
  xp_proximo_nivel: number;
  streak_atual: number;
  registrou_hoje: boolean;
};
