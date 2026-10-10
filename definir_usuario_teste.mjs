// Cria ou atualiza uma conta de teste via Supabase Auth Admin API.
// Execute localmente. Nunca coloque a chave service_role no navegador ou no repositório.

const obrigatorias = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TEST_USER_EMAIL',
  'TEST_USER_PASSWORD',
  'TEST_USER_NAME'
];
const ausentes = obrigatorias.filter((nome) => !process.env[nome]);
if (ausentes.length) {
  console.error(`Defina estas variáveis de ambiente: ${ausentes.join(', ')}`);
  process.exit(1);
}

const base = process.env.SUPABASE_URL.replace(/\/+$/, '');
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cabecalhos = {
  apikey: chave,
  Authorization: `Bearer ${chave}`,
  'Content-Type': 'application/json'
};
const email = process.env.TEST_USER_EMAIL.trim().toLowerCase();
const senha = process.env.TEST_USER_PASSWORD;
const nome = process.env.TEST_USER_NAME.trim();

async function requisitar(caminho, opcoes = {}) {
  const resposta = await fetch(`${base}${caminho}`, {
    ...opcoes,
    headers: { ...cabecalhos, ...opcoes.headers }
  });
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(corpo.msg || corpo.message || corpo.error_description || `Erro HTTP ${resposta.status}`);
  }
  return corpo;
}

try {
  const lista = await requisitar('/auth/v1/admin/users?page=1&per_page=1000');
  const existente = (lista.users || []).find((usuario) => usuario.email?.toLowerCase() === email);
  const dados = {
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome_de_usuario: nome }
  };

  const resultado = existente
    ? await requisitar(`/auth/v1/admin/users/${existente.id}`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    })
    : await requisitar('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify(dados)
    });

  console.log(JSON.stringify({
    acao: existente ? 'usuario_atualizado' : 'usuario_criado',
    email: resultado.email || email,
    id: resultado.id || existente?.id
  }));
} catch (erro) {
  console.error(`Não foi possível criar/atualizar a conta: ${erro.message}`);
  process.exit(1);
}
