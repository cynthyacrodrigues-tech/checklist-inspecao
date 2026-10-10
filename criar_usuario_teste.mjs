// Cria um usuário de teste no Supabase Auth pela API administrativa.
// Execute localmente com Node.js 18+ e nunca exponha SUPABASE_SERVICE_ROLE_KEY no navegador.

const variaveisObrigatorias = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TEST_USER_EMAIL',
  'TEST_USER_PASSWORD',
  'TEST_USER_NAME'
];

const ausentes = variaveisObrigatorias.filter((nome) => !process.env[nome]);
if (ausentes.length) {
  console.error(`Defina estas variáveis de ambiente: ${ausentes.join(', ')}`);
  process.exit(1);
}

const urlBase = process.env.SUPABASE_URL.replace(/\/+$/, '');
const resposta = await fetch(`${urlBase}/auth/v1/admin/users`, {
  method: 'POST',
  headers: {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD,
    email_confirm: true,
    user_metadata: { nome_de_usuario: process.env.TEST_USER_NAME }
  })
});

const resultado = await resposta.json().catch(() => ({}));
if (!resposta.ok) {
  console.error(`Falha ao criar usuário (${resposta.status}): ${resultado.msg || resultado.message || JSON.stringify(resultado)}`);
  process.exit(1);
}

console.log(`Usuário de teste criado: ${resultado.email} (ID ${resultado.id}).`);
console.log('O gatilho do Supabase deve criar o perfil correspondente em public.usuarios.');
