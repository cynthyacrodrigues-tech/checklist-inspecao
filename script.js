const STORAGE_KEY = 'checklist-inspecao-state';
// Remove credenciais em texto puro guardadas por versões antigas do protótipo.
localStorage.removeItem('checklist-inspecao-usuarios');
sessionStorage.removeItem('checklist-inspecao-usuario');
const supabaseClient = window.supabase?.createClient && window.SUPABASE_URL && window.SUPABASE_ANON_KEY
  && !window.SUPABASE_URL.includes('SEU-PROJETO') && !window.SUPABASE_ANON_KEY.includes('SUA_CHAVE')
  ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
  : null;
let veiculos = {};
let usuarioAtual = null;
let registrosRelatorio = [];
let inspecaoEmCorrecao = null;
const PRAZO_CORRECAO_INSPECAO_MS = 10 * 60 * 1000;

const irregularidadesPorVeiculo = [
  {
    codigo: 'XYZ9876',
    nome: 'Caminhão 2',
    itens: [
      'Pressão do pneu traseiro esquerdo fora do limite permitido (41 PSI).',
      'Nível de óleo inadequado.',
      'Documentação do veículo com pendência.'
    ]
  },
  {
    codigo: 'LMN4567',
    nome: 'Van de logística',
    itens: [
      'Checklist incompleto: checagem de freios pendente.',
      'Observação: para-brisa com risco de visibilidade.'
    ]
  }
];

const numeroVeiculo = document.getElementById('numeroVeiculo');
const btnIdentificar = document.getElementById('btnIdentificar');
const erroIdentificacao = document.getElementById('erroIdentificacao');
const veiculoInfo = document.getElementById('veiculoInfo');
const veiculoNome = document.getElementById('veiculoNome');
const faixaPressao = document.getElementById('faixaPressao');
const statusVeiculo = document.getElementById('statusVeiculo');
const itensInspecaoCard = document.getElementById('itensInspecaoCard');
const dadosInspecaoAside = document.getElementById('dadosInspecaoAside');
const finalizacaoInspecaoCard = document.getElementById('finalizacaoInspecaoCard');
let veiculoIdentificadoCodigo = '';
const btnMostrarCadastroVeiculo = document.getElementById('btnMostrarCadastroVeiculo');
const cadastroVeiculoForm = document.getElementById('cadastroVeiculoForm');
const erroCadastroVeiculo = document.getElementById('erroCadastroVeiculo');
const tituloCadastroVeiculo = document.getElementById('tituloCadastroVeiculo');
const btnSalvarVeiculo = document.getElementById('btnSalvarVeiculo');
const btnCancelarCadastroVeiculo = document.getElementById('btnCancelarCadastroVeiculo');
const btnAtualizarVeiculos = document.getElementById('btnAtualizarVeiculos');
const veiculosBody = document.getElementById('veiculosBody');
const veiculosVazio = document.getElementById('veiculosVazio');
let veiculoEditandoId = null;

const statusPneus = document.getElementById('statusPneus');
const statusOleo = document.getElementById('statusOleo');
const operador = document.getElementById('operador');
const observacoes = document.getElementById('observacoes');
const dataAtual = document.getElementById('dataAtual');
const horaAtual = document.getElementById('horaAtual');
const resultadoFinal = document.getElementById('resultadoFinal');
const erroFinal = document.getElementById('erroFinal');
const btnFinalizar = document.getElementById('btnFinalizar');
const avisoCorrecaoInspecao = document.getElementById('avisoCorrecaoInspecao');
const btnSalvar = document.getElementById('btnSalvar');
const totalInspecoes = document.getElementById('totalInspecoes');
const totalIrregularidades = document.getElementById('totalIrregularidades');
const totalEmAndamento = document.getElementById('totalEmAndamento');
const relatorioBody = document.getElementById('relatorioBody');
const relatorioItensBody = document.getElementById('relatorioItensBody');
const relatorioVazio = document.getElementById('relatorioVazio');
const filtroCategoriaRelatorio = document.getElementById('filtroCategoriaRelatorio');
const filtroVeiculoRelatorio = document.getElementById('filtroVeiculoRelatorio');
const filtroItemRelatorio = document.getElementById('filtroItemRelatorio');
const btnImprimirRelatorio = document.getElementById('btnImprimirRelatorio');
const loginScreen = document.getElementById('loginScreen');
const loginForm = document.getElementById('loginForm');
const loginUsuario = document.getElementById('loginUsuario');
const loginSenha = document.getElementById('loginSenha');
const loginErro = document.getElementById('loginErro');
const cadastroForm = document.getElementById('cadastroForm');
const cadastroUsuario = document.getElementById('cadastroUsuario');
const cadastroEmail = document.getElementById('cadastroEmail');
const cadastroSenha = document.getElementById('cadastroSenha');
const cadastroErro = document.getElementById('cadastroErro');
const appShell = document.getElementById('appShell');
const welcomePanel = document.getElementById('welcomePanel');
const usuarioLogado = document.getElementById('usuarioLogado');
const perfilLogado = document.getElementById('perfilLogado');
const btnSair = document.getElementById('btnSair');
const tabButtons = document.querySelectorAll('.tab-button');
const checklistPanel = document.getElementById('checklist-panel');
const relatoriosPanel = document.getElementById('relatorios-panel');
const categoryTabs = document.querySelectorAll('.category-tab');
let categoryCards = document.querySelectorAll('.category-card');
const statusGeralBadge = document.getElementById('statusGeralBadge');
const statusGeralTexto = document.getElementById('statusGeralTexto');

function transformarItensInspecao() {
  document.querySelectorAll('.item-obrigatorio[type="checkbox"]').forEach((checkbox) => {
    const linha = checkbox.closest('li');
    const textoItem = obterRotuloItem(linha);
    const seletor = document.createElement('select');
    seletor.className = 'item-obrigatorio';
    seletor.setAttribute('aria-label', `Status do item: ${textoItem}`);
    seletor.innerHTML = `
      <option value="pendente">Pendente</option>
      <option value="ok">OK</option>
      <option value="irregular">Irregular</option>
    `;
    checkbox.replaceWith(seletor);

  });
}

transformarItensInspecao();

function obterUsuarioAtual() {
  return usuarioAtual;
}

function bloquearChecklistAteIdentificacao() {
  veiculoIdentificadoCodigo = '';
  veiculoInfo.classList.remove('show');
  itensInspecaoCard.classList.add('hidden');
  dadosInspecaoAside.classList.add('hidden');
  finalizacaoInspecaoCard.classList.add('hidden');
}

function liberarChecklistIdentificado(codigo) {
  veiculoIdentificadoCodigo = codigo;
  itensInspecaoCard.classList.remove('hidden');
  dadosInspecaoAside.classList.remove('hidden');
  finalizacaoInspecaoCard.classList.remove('hidden');
}

function exibirAplicacao(conta) {
  if (!conta) return encerrarSessao();
  usuarioAtual = conta;
  usuarioLogado.textContent = conta.nome_de_usuario;
  perfilLogado.textContent = `(${conta.tipo_de_perfil === 'gerente' ? 'Gerente' : 'Operador'})`;
  operador.value = conta.nome_de_usuario;
  operador.readOnly = true;
  salvarEstadoFormulario();
  loginScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
  welcomePanel.classList.remove('hidden');
  checklistPanel.classList.add('hidden');
  relatoriosPanel.classList.add('hidden');
  tabButtons.forEach((botao) => botao.classList.remove('active'));
}

async function encerrarSessao() {
  usuarioAtual = null;
  if (supabaseClient) await supabaseClient.auth.signOut();
  appShell.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  loginSenha.value = '';
  loginUsuario.focus();
}

async function carregarPerfilUsuario(authUid) {
  const { data, error } = await supabaseClient
    .from('usuarios')
    .select('id_usuario, auth_uid, nome_de_usuario, tipo_de_perfil')
    .eq('auth_uid', authUid)
    .single();
  if (error) throw error;
  return data;
}

function mensagemErroAutenticacao(error) {
  switch (error.code) {
    case 'invalid_credentials':
      return 'E-mail ou senha incorretos. Confira os dados e, se acabou de criar a conta, confirme o e-mail antes de entrar.';
    case 'email_not_confirmed':
      return 'Confirme seu e-mail pelo link enviado pelo Supabase antes de entrar.';
    case 'over_email_send_rate_limit':
      return 'O Supabase atingiu o limite de envio de e-mails. Aguarde antes de tentar novamente.';
    default:
      return error.message || 'Não foi possível entrar no Supabase.';
  }
}

loginForm.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (!supabaseClient) {
    loginErro.textContent = 'Configure a URL e a chave pública do Supabase em supabase-config.js.';
    loginErro.classList.add('show');
    return;
  }
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: loginUsuario.value.trim(),
      password: loginSenha.value
    });
    if (error) throw error;
    exibirAplicacao(await carregarPerfilUsuario(data.user.id));
    loginErro.classList.remove('show');
    await carregarVeiculos();
    await atualizarRelatorio();
  } catch (error) {
    loginErro.textContent = mensagemErroAutenticacao(error);
    loginErro.classList.add('show');
  }
});

cadastroForm.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const usuario = cadastroUsuario.value.trim();
  const senha = cadastroSenha.value;
  if (usuario.length < 3 || senha.length < 6) {
    cadastroErro.textContent = 'Use pelo menos 3 caracteres no usuário e 6 na senha.';
    cadastroErro.classList.add('show');
    return;
  }
  if (!supabaseClient) {
    cadastroErro.textContent = 'Configure a URL e a chave pública do Supabase em supabase-config.js.';
    cadastroErro.classList.add('show');
    return;
  }
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email: cadastroEmail.value.trim(),
      password: senha,
      options: { data: { nome_de_usuario: usuario } }
    });
    if (error) throw error;
    if (data.session && data.user) {
      exibirAplicacao(await carregarPerfilUsuario(data.user.id));
      await carregarVeiculos();
      await atualizarRelatorio();
    } else {
      cadastroErro.textContent = 'Conta criada. Confirme o e-mail para concluir o cadastro e entrar.';
      cadastroErro.classList.add('show');
      return;
    }
    cadastroErro.classList.remove('show');
  } catch (error) {
    cadastroErro.textContent = error.message || 'Não foi possível criar a conta no Supabase.';
    cadastroErro.classList.add('show');
  }
});

btnSair.addEventListener('click', encerrarSessao);

function trocarAba(tabSelecionada) {
  const panelMap = {
    checklist: checklistPanel,
    relatorios: relatoriosPanel
  };

  tabButtons.forEach((botao) => {
    const ativo = botao.dataset.tab === tabSelecionada;
    botao.classList.toggle('active', ativo);
  });

  Object.entries(panelMap).forEach(([key, panel]) => {
    panel.classList.toggle('hidden', key !== tabSelecionada);
  });
  welcomePanel.classList.add('hidden');
}

function renderizarIrregularidades() {
  const container = document.getElementById('listaIrregularidades');

  if (!container) {
    return;
  }

  if (!irregularidadesPorVeiculo.length) {
    container.innerHTML = '<div class="issue-card"><h3>Nenhuma irregularidade</h3><p>Não há itens irregulares registrados neste momento.</p></div>';
    return;
  }

  container.innerHTML = irregularidadesPorVeiculo
    .map((veiculo) => `
      <div class="issue-card">
        <h3>${veiculo.codigo} - ${veiculo.nome}</h3>
        <ul>
          ${veiculo.itens.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    `)
    .join('');
}

async function carregarVeiculos() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient
    .from('veiculos')
    .select('id_veiculo, codigo, nome_modelo, placa, pressao_minima_psi, pressao_maxima_psi, situacao');
  if (error) throw error;
  veiculos = Object.fromEntries(data.map((veiculo) => [veiculo.codigo, {
    id: veiculo.id_veiculo,
    codigo: veiculo.codigo,
    nome: veiculo.nome_modelo,
    placa: veiculo.placa,
    pressaoMin: Number(veiculo.pressao_minima_psi),
    pressaoMax: Number(veiculo.pressao_maxima_psi),
    situacao: veiculo.situacao
  }]));
  renderizarVeiculos();
}

function renderizarVeiculos() {
  const lista = Object.values(veiculos).sort((a, b) => a.codigo.localeCompare(b.codigo));
  veiculosBody.innerHTML = lista.map((veiculo) => {
    const bloqueado = veiculo.situacao === 'bloqueado';
    const classeStatus = bloqueado ? 'alert' : 'ok';
    const textoStatus = bloqueado ? 'Bloqueado' : 'Liberado';
    const textoAcao = bloqueado ? 'Liberar' : 'Bloquear';
    const classeAcao = bloqueado ? 'release' : 'block';
    return `<tr>
      <td>${escaparHTML(veiculo.codigo)}</td>
      <td>${escaparHTML(veiculo.nome)}</td>
      <td>${escaparHTML(veiculo.placa)}</td>
      <td>${veiculo.pressaoMin}–${veiculo.pressaoMax}</td>
      <td><span class="tag ${classeStatus}">${textoStatus}</span></td>
      <td><div class="vehicle-row-actions">
        <button class="secondary-button" type="button" data-acao-veiculo="editar" data-codigo-veiculo="${escaparHTML(veiculo.codigo)}">Editar</button>
        <button class="report-action ${classeAcao}" type="button" data-acao-veiculo="alternar" data-codigo-veiculo="${escaparHTML(veiculo.codigo)}">${textoAcao}</button>
      </div></td>
    </tr>`;
  }).join('');
  veiculosVazio.classList.toggle('hidden', lista.length > 0);
}

async function atualizarRelatorio() {
  if (!supabaseClient || !usuarioAtual) return;
  const { data, error } = await supabaseClient
    .from('inspecoes')
    .select('id_inspecao, id_usuario, data_da_inspecao, resultado, veiculo_bloqueado, observacoes, veiculos(codigo, situacao), usuarios(nome_de_usuario), itens_inspecao(categoria, nome_item, valor, resultado, item_critico)')
    .order('data_da_inspecao', { ascending: false });
  if (error) {
    relatorioBody.innerHTML = `<tr><td colspan="6">${escaparHTML(error.message)}</td></tr>`;
    relatorioItensBody.innerHTML = '';
    return;
  }
  const traduzirResultado = (resultado) => resultado === 'regular' ? 'ok' : resultado;
  registrosRelatorio = (data || []).map((linha) => ({
    id: linha.id_inspecao,
    idUsuario: linha.id_usuario,
    dataCriacao: linha.data_da_inspecao,
    veiculo: linha.veiculos?.codigo || '',
    operador: linha.usuarios?.nome_de_usuario || '',
    data: new Date(linha.data_da_inspecao).toLocaleString('pt-BR'),
    status: traduzirResultado(linha.resultado),
    observacoes: linha.observacoes || '',
    bloqueado: linha.veiculos?.situacao === 'bloqueado',
    itens: (linha.itens_inspecao || []).map((item) => ({
      categoria: item.categoria,
      nomeCategoria: nomeCategoria(item.categoria),
      item: item.nome_item,
      valor: item.valor || '',
      status: traduzirResultado(item.resultado),
      critico: item.item_critico
    }))
  }));
  preencherFiltrosRelatorio(registrosRelatorio);
  renderizarVisaoRelatorio();
}

function preencherFiltrosRelatorio(registros) {
  const manterVeiculo = filtroVeiculoRelatorio.value;
  const manterItem = filtroItemRelatorio.value;
  const veiculosRelatorio = [...new Set(registros.map((registro) => registro.veiculo).filter(Boolean))].sort();
  const itensRelatorio = [...new Set(registros.flatMap((registro) => registro.itens.map((item) => item.item)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  filtroVeiculoRelatorio.innerHTML = '<option value="todos">Todos os veículos</option>' + veiculosRelatorio
    .map((codigo) => `<option value="${escaparHTML(codigo)}">${escaparHTML(codigo)}</option>`).join('');
  filtroItemRelatorio.innerHTML = '<option value="todos">Todos os itens</option>' + itensRelatorio
    .map((item) => `<option value="${escaparHTML(item)}">${escaparHTML(item)}</option>`).join('');
  filtroVeiculoRelatorio.value = veiculosRelatorio.includes(manterVeiculo) ? manterVeiculo : 'todos';
  filtroItemRelatorio.value = itensRelatorio.includes(manterItem) ? manterItem : 'todos';
}

function obterRegistrosFiltradosRelatorio() {
  const veiculoSelecionado = filtroVeiculoRelatorio.value;
  const itemSelecionado = filtroItemRelatorio.value;
  const categoriaSelecionada = filtroCategoriaRelatorio.value;
  return registrosRelatorio.flatMap((registro) => {
    if (veiculoSelecionado !== 'todos' && registro.veiculo !== veiculoSelecionado) return [];
    const itens = registro.itens.filter((item) =>
      (itemSelecionado === 'todos' || item.item === itemSelecionado) &&
      (categoriaSelecionada === 'todos' || item.categoria === categoriaSelecionada)
    );
    if ((itemSelecionado !== 'todos' || categoriaSelecionada !== 'todos') && itens.length === 0) return [];
    return [{ ...registro, itens }];
  });
}

function renderizarVisaoRelatorio() {
  const registros = obterRegistrosFiltradosRelatorio();

  const total = registros.length;
  const irregular = registros.filter((item) => item.status === 'irregular').length;
  const andamento = registros.filter((item) => item.status === 'pendente').length;

  totalInspecoes.textContent = total;
  totalIrregularidades.textContent = irregular;
  totalEmAndamento.textContent = andamento;

  relatorioBody.innerHTML = registros
    .map((item) => {
      const badge = item.status === 'ok'
        ? '<span class="tag ok">OK</span>'
        : item.status === 'irregular'
          ? '<span class="tag alert">Irregular</span>'
          : '<span class="tag wait">Pendente</span>';
      const ehDoUsuarioAtual = String(item.idUsuario) === String(usuarioAtual?.id_usuario);
      const prazoAberto = Date.now() < Date.parse(item.dataCriacao) + PRAZO_CORRECAO_INSPECAO_MS;
      const acaoCorrecao = ehDoUsuarioAtual && prazoAberto
        ? `<button class="secondary-button correction-button" type="button" data-corrigir-inspecao="${escaparHTML(item.id)}" aria-label="Editar checklist do veículo ${escaparHTML(item.veiculo)}">Editar checklist</button>`
        : ehDoUsuarioAtual
          ? '<span class="muted-copy">Prazo encerrado</span>'
          : '—';

      return `
        <tr>
          <td>${escaparHTML(item.veiculo)}</td>
          <td>${escaparHTML(item.operador)}</td>
          <td>${escaparHTML(item.data)}</td>
          <td>${badge}</td>
          <td>${renderizarStatusCirculacao(item.veiculo, registros)}</td>
          <td>${acaoCorrecao}</td>
        </tr>
      `;
    })
    .join('');
  renderizarRelatorioItens(registros);
  renderizarIrregularidadesDoBanco(registros);
}

function nomeCategoria(categoria) {
  return ({
    pneus: 'Pneus', iluminacao: 'Iluminação e sinalização', freios: 'Freios',
    fluidos: 'Fluidos e motor', seguranca: 'Segurança do operador', geral: 'Checklist geral'
  })[categoria] || categoria;
}

function renderizarIrregularidadesDoBanco(registros) {
  const irregularidades = registros.flatMap((registro) => registro.itens
    .filter((item) => item.status === 'irregular')
    .map((item) => ({ veiculo: registro.veiculo, item })));
  const container = document.getElementById('listaIrregularidades');
  container.innerHTML = irregularidades.length
    ? irregularidades.map(({ veiculo, item }) => `<div class="issue-card"><h3>${escaparHTML(veiculo)} - ${escaparHTML(item.nomeCategoria)}</h3><ul><li>${escaparHTML(item.item)}${item.valor ? ` (${escaparHTML(item.valor)})` : ''}</li></ul></div>`).join('')
    : '<div class="issue-card"><h3>Nenhuma irregularidade</h3><p>Não há itens irregulares registrados.</p></div>';
}

function normalizarRegistros(registros) {
  return registros.map((registro) => {
    if (Array.isArray(registro.itens)) {
      return {
        ...registro,
        itens: registro.itens.map((item) => ({
          ...item,
          critico: item.critico ?? itemEhCritico(item)
        }))
      };
    }
    const itensPendentes = [
      ...['Pneu dianteiro esquerdo', 'Pneu dianteiro direito', 'Pneu traseiro esquerdo', 'Pneu traseiro direito']
        .map((item) => ({
          categoria: 'pneus',
          nomeCategoria: 'Pneus',
          item,
          status: 'pendente',
          critico: true
        })),
      ...Array.from(categoryCards).flatMap((card) =>
        Array.from(card.querySelectorAll('li')).map((linha) => ({
          categoria: card.dataset.category,
          nomeCategoria: card.querySelector('h3').textContent.trim(),
          item: obterRotuloItem(linha),
          status: 'pendente',
          critico: linha.dataset.critical === 'true'
        }))),
      {
        categoria: 'fluidos',
        nomeCategoria: 'Fluidos e motor',
        item: 'Nível de óleo',
        status: 'pendente',
        critico: true
      }
    ];
    return { ...registro, itens: itensPendentes };
  });
}

function itemEhCritico(item) {
  if (item.categoria === 'pneus' || item.item === 'Nível de óleo') return true;
  return Array.from(document.querySelectorAll('li[data-critical="true"]'))
    .some((linha) => obterRotuloItem(linha) === item.item);
}

function escaparHTML(valor) {
  return String(valor).replace(/[&<>"']/g, (caractere) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[caractere]);
}

function obterRotuloItem(linha) {
  return Array.from(linha.childNodes)
    .filter((nodo) => nodo.nodeType === Node.TEXT_NODE)
    .map((nodo) => nodo.textContent.trim())
    .join(' ');
}

function veiculoEstaBloqueado(codigo, registros) {
  const veiculo = veiculos[codigo];
  if (veiculo) return veiculo.situacao === 'bloqueado';
  return registros.find((registro) => registro.veiculo === codigo)?.bloqueado === true;
}

function renderizarStatusCirculacao(codigo, registros = criarDadosDemonstracao()) {
  const bloqueado = veiculoEstaBloqueado(codigo, registros);
  const rotulo = bloqueado ? 'Bloqueado' : 'Liberado';
  const classe = bloqueado ? 'alert' : 'ok';
  return `<span class="tag ${classe}">${rotulo}</span>`;
}

function criarDadosDemonstracao() {
  const itensDoChecklist = Array.from(categoryCards).flatMap((card) => {
    const categoria = card.dataset.category;
    return Array.from(card.querySelectorAll('li')).map((linha) => ({
      categoria,
      nomeCategoria: card.querySelector('h3').textContent.trim(),
      item: obterRotuloItem(linha),
      status: 'ok',
      critico: linha.dataset.critical === 'true'
    }));
  });
  const listaPneus = [
    ['Pneu dianteiro esquerdo', 'Pneus'],
    ['Pneu dianteiro direito', 'Pneus'],
    ['Pneu traseiro esquerdo', 'Pneus'],
    ['Pneu traseiro direito', 'Pneus']
  ];

  return [
    {
      veiculo: 'ABC1234', operador: 'João Silva', data: '06/10/2026',
      status: 'ok', bloqueado: false, itens: [
        ...listaPneus.map(([item]) => ({ categoria: 'pneus', nomeCategoria: 'Pneus', item, status: 'ok', critico: true })),
        ...itensDoChecklist,
        { categoria: 'fluidos', nomeCategoria: 'Fluidos e motor', item: 'Nível de óleo', status: 'ok', critico: true }
      ]
    },
    {
      veiculo: 'XYZ9876', operador: 'Maria Costa', data: '05/10/2026',
      status: 'irregular', bloqueado: true, itens: [
        ...listaPneus.map(([item], indice) => ({
          categoria: 'pneus', nomeCategoria: 'Pneus', item,
          status: indice === 2 ? 'irregular' : 'ok',
          valor: indice === 2 ? '41 PSI' : '',
          critico: true
        })),
        ...itensDoChecklist,
        { categoria: 'fluidos', nomeCategoria: 'Fluidos e motor', item: 'Nível de óleo', status: 'irregular', critico: true }
      ]
    },
    {
      veiculo: 'LMN4567', operador: 'Pedro Souza', data: '04/10/2026',
      status: 'pendente', bloqueado: false, itens: [
        ...listaPneus.map(([item]) => ({ categoria: 'pneus', nomeCategoria: 'Pneus', item, status: 'pendente', critico: true })),
        ...itensDoChecklist.map((item) => ({ ...item, status: 'pendente' })),
        { categoria: 'fluidos', nomeCategoria: 'Fluidos e motor', item: 'Nível de óleo', status: 'pendente', critico: true }
      ]
    }
  ];
}

function renderizarRelatorioItens(registros = obterRegistrosFiltradosRelatorio()) {
  const veiculosComAcao = new Set();
  const linhas = registros.flatMap((registro) => (registro.itens || [])
    .map((item) => {
      const statusLabels = { ok: 'OK', irregular: 'Irregular', pendente: 'Pendente' };
      const statusClasses = { ok: 'ok', irregular: 'alert', pendente: 'wait' };
      const bloqueado = veiculoEstaBloqueado(registro.veiculo, registrosRelatorio);
      const circulacao = bloqueado ? 'Bloqueado' : 'Liberado';
      const acao = bloqueado ? 'Liberar para rodar' : 'Bloquear veículo';
      const classeAcao = bloqueado ? 'release' : 'block';
      const valor = item.valor ? ` (${escaparHTML(item.valor)})` : '';
      const exibirAcao = !veiculosComAcao.has(registro.veiculo);
      veiculosComAcao.add(registro.veiculo);
      const controleVeiculo = !exibirAcao
        ? '—'
        : `<button class="report-action ${classeAcao}" type="button" data-status-action="${bloqueado ? 'liberar' : 'bloquear'}" data-veiculo="${escaparHTML(registro.veiculo)}">${acao}</button>`;
      return `<tr>
        <td>${escaparHTML(registro.veiculo)}</td>
        <td>${escaparHTML(item.nomeCategoria)}</td>
        <td>${escaparHTML(item.item)}${valor}</td>
        <td><span class="tag ${statusClasses[item.status] || 'wait'}">${statusLabels[item.status] || 'Pendente'}</span></td>
        <td><span class="tag ${bloqueado ? 'alert' : 'ok'}">${circulacao}</span></td>
        <td>${controleVeiculo}</td>
      </tr>`;
    }));

  relatorioItensBody.innerHTML = linhas.join('');
  relatorioVazio.classList.toggle('hidden', linhas.length > 0);
}

async function alternarStatusVeiculo(codigo, acao) {
  const statusNovo = acao === 'bloquear' ? 'bloqueado' : 'liberado';
  const atual = veiculoEstaBloqueado(codigo, registrosRelatorio);

  if ((acao === 'bloquear' && atual) || (acao === 'liberar' && !atual)) {
    return;
  }

  const ultimaInspecao = registrosRelatorio
    .find((registro) => registro.veiculo === codigo);
  const confirmacao = acao === 'bloquear'
    ? `Confirma o bloqueio do veículo ${codigo} para circulação?`
    : ultimaInspecao?.status === 'irregular'
      ? `A inspeção mais recente de ${codigo} registrou irregularidade. Confirme a liberação somente após avaliação e autorização conforme o procedimento da operação. Continuar?`
      : `Confirma a liberação do veículo ${codigo} para rodar?`;
  if (!window.confirm(confirmacao)) return;

  const { error } = await supabaseClient.rpc('alterar_situacao_veiculo', {
    codigo_veiculo: codigo,
    nova_situacao: statusNovo
  });
  if (error) {
    window.alert(`Não foi possível atualizar o veículo: ${error.message}`);
    return;
  }
  veiculos[codigo].situacao = statusNovo;
  renderizarVeiculos();
  await atualizarRelatorio();
}

function atualizarStatusCategoria(card) {
  const badge = card.querySelector('.status-badge');
  if (card.dataset.category === 'pneus') {
    const codigo = numeroVeiculo.value.trim().toUpperCase();
    const veiculo = veiculos[codigo];
    const pressao = ['pneu1', 'pneu2', 'pneu3', 'pneu4']
      .map((id) => document.getElementById(id).value);
    const todosPreenchidos = pressao.every((valor) => valor !== '' && Number.isFinite(Number(valor)));
    const algumaIrregular = veiculo && pressao.some((valor) => valor !== '' && (
      Number(valor) < veiculo.pressaoMin || Number(valor) > veiculo.pressaoMax
    ));

    if (algumaIrregular) {
      badge.textContent = 'Irregular';
      badge.className = 'status-badge alert';
    } else if (veiculo && todosPreenchidos) {
      badge.textContent = 'OK';
      badge.className = 'status-badge ok';
    } else {
      badge.textContent = 'Pendente';
      badge.className = 'status-badge wait';
    }
    return;
  }

  const itens = card.querySelectorAll('.item-obrigatorio');
  const total = itens.length;
  const valores = Array.from(itens).map((item) => item.value);

  const oleo = card.dataset.category === 'fluidos'
    ? document.querySelector('input[name="oleo"]:checked')?.value || 'pendente'
    : null;
  if (valores.includes('irregular') || oleo === 'inadequado') {
    badge.textContent = 'Irregular';
    badge.className = 'status-badge alert';
    return;
  }

  if (valores.includes('pendente') || oleo === 'pendente') {
    badge.textContent = 'Pendente';
    badge.className = 'status-badge wait';
    return;
  }

  if (valores.every((valor) => valor === 'ok') && (!oleo || oleo === 'adequado')) {
    badge.textContent = 'OK';
    badge.className = 'status-badge ok';
    return;
  }

  badge.textContent = 'Pendente';
  badge.className = 'status-badge wait';
}

function atualizarStatusCategorias() {
  categoryCards.forEach((card) => atualizarStatusCategoria(card));

  const totalCategorias = categoryCards.length;
  let ok = 0;
  let irregular = 0;
  let pendente = 0;

  categoryCards.forEach((card) => {
    const badge = card.querySelector('.status-badge');
    if (!badge) return;

    if (badge.textContent.trim() === 'OK') ok += 1;
    else if (badge.textContent.trim() === 'Irregular') irregular += 1;
    else pendente += 1;
  });

  if (ok === totalCategorias) {
    statusGeralBadge.textContent = 'OK';
    statusGeralBadge.className = 'status-badge ok';
    statusGeralTexto.textContent = 'Todos os itens da inspeção foram concluídos.';
    return;
  }

  if (irregular > 0) {
    statusGeralBadge.textContent = 'Irregular';
    statusGeralBadge.className = 'status-badge alert';
    statusGeralTexto.textContent = 'Há itens fora dos padrões esperados.';
    return;
  }

  statusGeralBadge.textContent = 'Pendente';
  statusGeralBadge.className = 'status-badge wait';
  statusGeralTexto.textContent = 'Faltam itens para concluir a inspeção.';
}

function trocarCategoria(categoriaSelecionada) {
  categoryTabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.category === categoriaSelecionada);
  });

  categoryCards.forEach((card) => {
    const mostrar = categoriaSelecionada === 'todos' || card.dataset.category === categoriaSelecionada;
    card.classList.toggle('hidden', !mostrar);
  });
}

function atualizarDataHora() {
  const agora = new Date();
  dataAtual.textContent = agora.toLocaleDateString('pt-BR');
  horaAtual.textContent = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function mostrarErro(el, mensagem) {
  el.textContent = mensagem;
  el.classList.add('show');
}

function ocultarErro(el) {
  el.classList.remove('show');
}

function coletarEstadoFormulario() {
  return {
    numeroVeiculo: numeroVeiculo.value,
    pneu1: document.getElementById('pneu1').value,
    pneu2: document.getElementById('pneu2').value,
    pneu3: document.getElementById('pneu3').value,
    pneu4: document.getElementById('pneu4').value,
    oleo: document.querySelector('input[name="oleo"]:checked')?.value || '',
    operador: operador.value,
    observacoes: observacoes.value,
    itens: Array.from(document.querySelectorAll('.item-obrigatorio')).map((item) => item.value),
  };
}

function coletarItensInspecao() {
  const codigo = numeroVeiculo.value.trim().toUpperCase();
  const veiculo = veiculos[codigo];
  const pneus = [
    ['pneu1', 'Pneu dianteiro esquerdo'],
    ['pneu2', 'Pneu dianteiro direito'],
    ['pneu3', 'Pneu traseiro esquerdo'],
    ['pneu4', 'Pneu traseiro direito']
  ];
  const itensPneus = pneus.map(([id, item]) => {
    const campo = document.getElementById(id);
    const valor = campo.value === '' ? null : Number(campo.value);
    const dentroDoLimite = valor !== null && veiculo &&
      valor >= veiculo.pressaoMin && valor <= veiculo.pressaoMax;

    return {
      categoria: 'pneus',
      nomeCategoria: 'Pneus',
      item,
      valor: valor === null ? '' : `${valor} PSI`,
      status: valor === null ? 'pendente' : dentroDoLimite ? 'ok' : 'irregular',
      critico: true,
      critico: true
    };
  });
  const oleo = document.querySelector('input[name="oleo"]:checked')?.value || '';
  const itensChecklist = Array.from(categoryCards).flatMap((card) => {
    const categoria = card.dataset.category;
    const nomeCategoria = card.querySelector('h3').textContent.trim();
    return Array.from(card.querySelectorAll('.item-obrigatorio')).map((seletor) => ({
      categoria,
      nomeCategoria,
      item: obterRotuloItem(seletor.parentElement),
      status: seletor.value,
      critico: seletor.closest('li')?.dataset.critical === 'true',
      critico: seletor.closest('li')?.dataset.critical === 'true'
    }));
  });

  return [
    ...itensPneus,
    ...itensChecklist,
    {
      categoria: 'fluidos',
      nomeCategoria: 'Fluidos e motor',
      item: 'Nível de óleo',
      status: oleo === 'adequado' ? 'ok' : oleo === 'inadequado' ? 'irregular' : 'pendente',
      critico: true,
      critico: true
    }
  ];
}

function salvarEstadoFormulario() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(coletarEstadoFormulario()));
}

function restaurarEstadoFormulario() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  if (!saved) return;

  numeroVeiculo.value = '';
  document.getElementById('pneu1').value = saved.pneu1 || '';
  document.getElementById('pneu2').value = saved.pneu2 || '';
  document.getElementById('pneu3').value = saved.pneu3 || '';
  document.getElementById('pneu4').value = saved.pneu4 || '';
  operador.value = saved.operador || '';
  observacoes.value = saved.observacoes || '';

  if (saved.oleo) {
    const radio = document.querySelector(`input[name="oleo"][value="${saved.oleo}"]`);
    if (radio) {
      radio.checked = true;
    }
  }

  const checks = Array.isArray(saved.itens) ? saved.itens : [];
  document.querySelectorAll('.item-obrigatorio').forEach((item, index) => {
    item.value = typeof checks[index] === 'string'
      ? checks[index]
      : checks[index] ? 'ok' : 'pendente';
  });
  atualizarStatusCategorias();

  // O rascunho pode ser restaurado, mas a identificação precisa ser feita novamente nesta sessão.
  bloquearChecklistAteIdentificacao();
}

function limparChecklistAposSalvar() {
  ['pneu1', 'pneu2', 'pneu3', 'pneu4'].forEach((id) => {
    document.getElementById(id).value = '';
  });
  document.querySelectorAll('input[name="oleo"]').forEach((radio) => {
    radio.checked = false;
  });
  document.querySelectorAll('.item-obrigatorio').forEach((item) => {
    item.value = 'pendente';
  });
  observacoes.value = '';
  numeroVeiculo.value = '';
  bloquearChecklistAteIdentificacao();
  ocultarErro(erroIdentificacao);
  ocultarErro(erroFinal);
  resultadoFinal.classList.remove('show');
  statusPneus.textContent = 'Informe a pressão correta de cada pneu.';
  statusPneus.className = 'status warning';
  statusOleo.textContent = 'Selecione o nível de óleo verificado.';
  statusOleo.className = 'status warning';
  localStorage.removeItem(STORAGE_KEY);
  inspecaoEmCorrecao = null;
  btnFinalizar.textContent = '✓ Finalizar checklist';
  avisoCorrecaoInspecao.classList.add('hidden');
  atualizarStatusCategorias();
  numeroVeiculo.focus();
}

async function registrarHistorico(status, bloqueado) {
  const codigo = numeroVeiculo.value.trim().toUpperCase();
  const itens = coletarItensInspecao().map((item) => ({
    categoria: item.categoria,
    nome_item: item.item,
    valor: item.valor || null,
    resultado: item.status === 'ok' ? 'regular' : item.status,
    item_critico: item.critico
  }));
  const parametros = {
    p_resultado: status === 'ok' ? 'regular' : status,
    p_veiculo_bloqueado: bloqueado,
    p_observacoes: observacoes.value.trim() || null,
    p_itens: itens
  };
  const { error } = inspecaoEmCorrecao
    ? await supabaseClient.rpc('corrigir_inspecao', {
      ...parametros,
      p_inspecao_id: inspecaoEmCorrecao.id
    })
    : await supabaseClient.rpc('salvar_inspecao', {
      ...parametros,
      p_codigo_veiculo: codigo
    });
  if (error) throw error;
  veiculos[codigo].situacao = bloqueado ? 'bloqueado' : 'liberado';
  renderizarVeiculos();
}

async function iniciarCorrecaoInspecao(id) {
  const registro = registrosRelatorio.find((item) => String(item.id) === String(id));
  const prazoFinal = registro ? Date.parse(registro.dataCriacao) + PRAZO_CORRECAO_INSPECAO_MS : 0;
  if (!registro || String(registro.idUsuario) !== String(usuarioAtual?.id_usuario) || Date.now() >= prazoFinal) {
    window.alert('Este checklist não pode mais ser corrigido. O prazo é de 10 minutos após o salvamento.');
    await atualizarRelatorio();
    return;
  }
  const veiculo = veiculos[registro.veiculo];
  if (!veiculo) {
    window.alert('O veículo desta inspeção não está disponível no cadastro.');
    return;
  }

  inspecaoEmCorrecao = { id: registro.id, prazoFinal };
  ['pneu1', 'pneu2', 'pneu3', 'pneu4'].forEach((idPneu) => {
    document.getElementById(idPneu).value = '';
  });
  document.querySelectorAll('input[name="oleo"]').forEach((radio) => { radio.checked = false; });
  document.querySelectorAll('.item-obrigatorio').forEach((campo) => { campo.value = 'pendente'; });
  numeroVeiculo.value = registro.veiculo;
  veiculoInfo.classList.add('show');
  veiculoNome.textContent = veiculo.nome;
  document.getElementById('veiculoPlaca').textContent = veiculo.placa;
  faixaPressao.textContent = `${veiculo.pressaoMin} a ${veiculo.pressaoMax} PSI`;
  statusVeiculo.textContent = 'Corrigindo checklist salvo';
  liberarChecklistIdentificado(registro.veiculo);

  const pneus = {
    'Pneu dianteiro esquerdo': 'pneu1',
    'Pneu dianteiro direito': 'pneu2',
    'Pneu traseiro esquerdo': 'pneu3',
    'Pneu traseiro direito': 'pneu4'
  };
  registro.itens.forEach((item) => {
    if (pneus[item.item]) {
      document.getElementById(pneus[item.item]).value = Number.parseFloat(item.valor) || '';
      return;
    }
    if (item.item === 'Nível de óleo') {
      const valorOleo = item.status === 'ok' ? 'adequado' : item.status === 'irregular' ? 'inadequado' : '';
      document.querySelectorAll('input[name="oleo"]').forEach((radio) => { radio.checked = radio.value === valorOleo; });
      return;
    }
    const seletor = Array.from(document.querySelectorAll('.item-obrigatorio')).find((campo) =>
      campo.closest('.category-card')?.dataset.category === item.categoria &&
      obterRotuloItem(campo.closest('li')) === item.item
    );
    if (seletor) seletor.value = item.status === 'regular' ? 'ok' : item.status;
  });
  observacoes.value = registro.observacoes;
  btnFinalizar.textContent = 'Salvar correção';
  avisoCorrecaoInspecao.textContent = `Você pode corrigir este checklist até ${new Date(prazoFinal).toLocaleTimeString('pt-BR')}.`;
  avisoCorrecaoInspecao.classList.remove('hidden');
  ocultarErro(erroIdentificacao);
  ocultarErro(erroFinal);
  resultadoFinal.classList.remove('show');
  atualizarStatusCategorias();
  validarPneus();
  validarOleo();
  trocarAba('checklist');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validarPneus() {
  const pneus = [
    document.getElementById('pneu1'),
    document.getElementById('pneu2'),
    document.getElementById('pneu3'),
    document.getElementById('pneu4')
  ];

  const valorVeiculo = veiculos[numeroVeiculo.value.trim().toUpperCase()];

  if (!valorVeiculo) {
    statusPneus.textContent = 'Identifique o veículo antes de registrar a pressão dos pneus.';
    statusPneus.className = 'status warning show';
    return false;
  }

  let todosValidos = true;

  pneus.forEach((pneu) => {
    const valor = Number(pneu.value);
    if (pneu.value === '' || Number.isNaN(valor)) {
      todosValidos = false;
      return;
    }

    if (valor < valorVeiculo.pressaoMin || valor > valorVeiculo.pressaoMax) {
      todosValidos = false;
    }
  });

  if (!todosValidos) {
    statusPneus.textContent = `A pressão informada está fora do limite aceitável para este veículo (${valorVeiculo.pressaoMin} a ${valorVeiculo.pressaoMax} PSI).`;
    statusPneus.className = 'status error show';
    return false;
  }

  statusPneus.textContent = 'A pressão dos pneus está dentro do limite permitido.';
  statusPneus.className = 'status success show';
  return true;
}

function validarOleo() {
  const selecionado = document.querySelector('input[name="oleo"]:checked');

  if (!selecionado) {
    statusOleo.textContent = 'Selecione o nível de óleo verificado.';
    statusOleo.className = 'status warning show';
    return false;
  }

  if (selecionado.value === 'inadequado') {
    statusOleo.textContent = 'Nível de óleo inadequado. A inspeção não pode continuar.';
    statusOleo.className = 'status error show';
    return false;
  }

  statusOleo.textContent = 'Nível de óleo adequado.';
  statusOleo.className = 'status success show';
  return true;
}

function verificarItensObrigatorios() {
  const itens = document.querySelectorAll('.item-obrigatorio');
  return Array.from(itens).every((item) => item.value !== 'pendente');
}

async function validarChecklistCompleto() {
  const codigoVeiculo = numeroVeiculo.value.trim().toUpperCase();
  const veiculo = veiculos[codigoVeiculo];
  const veiculoValido = !!veiculo && codigoVeiculo === veiculoIdentificadoCodigo;
  const camposPneu = ['pneu1', 'pneu2', 'pneu3', 'pneu4'].map((id) => document.getElementById(id));
  const pneusPreenchidos = camposPneu.every((campo) => campo.value !== '' && Number.isFinite(Number(campo.value)));
  const oleoSelecionado = document.querySelector('input[name="oleo"]:checked');
  const itensCompletos = verificarItensObrigatorios();
  const operadorPreenchido = operador.value.trim() !== '';

  if (!veiculoValido || !pneusPreenchidos || !oleoSelecionado || !itensCompletos || !operadorPreenchido) {
    if (!veiculoValido) {
      mostrarErro(erroIdentificacao, 'Identifique um veículo cadastrado antes de continuar o checklist.');
    }
    if (!pneusPreenchidos) {
      statusPneus.textContent = 'Informe a pressão medida nos quatro pneus para finalizar.';
      statusPneus.className = 'status warning show';
    } else {
      validarPneus();
    }
    if (!oleoSelecionado) {
      validarOleo();
    } else {
      validarOleo();
    }
    mostrarErro(erroFinal, 'Preencha os dados do veículo, informe todos os pneus, selecione o nível de óleo, conclua os itens e informe o operador.');
    resultadoFinal.classList.remove('show');
    return false;
  }

  const pressaoAdequada = validarPneus();
  const oleoAdequado = oleoSelecionado.value === 'adequado';
  const itemIrregular = Array.from(document.querySelectorAll('.item-obrigatorio'))
    .some((item) => item.value === 'irregular');
  const itemCriticoIrregular = Array.from(document.querySelectorAll('li[data-critical="true"] .item-obrigatorio'))
    .some((item) => item.value === 'irregular');
  const bloqueiaVeiculo = !pressaoAdequada || !oleoAdequado || itemCriticoIrregular;
  const statusInspecao = bloqueiaVeiculo || itemIrregular ? 'irregular' : 'ok';

  ocultarErro(erroFinal);
  resultadoFinal.textContent = bloqueiaVeiculo
    ? 'Foi identificada uma irregularidade que impede a circulação. O veículo será bloqueado até avaliação e liberação.'
    : statusInspecao === 'irregular'
      ? 'Inspeção finalizada com irregularidade. O veículo está liberado para circulação.'
      : 'Inspeção finalizada sem irregularidades. Veículo liberado para circulação.';
  resultadoFinal.className = `alert ${bloqueiaVeiculo ? 'error' : 'success'} show`;
  try {
    await registrarHistorico(statusInspecao, bloqueiaVeiculo);
  } catch (error) {
    mostrarErro(erroFinal, `Não foi possível salvar a inspeção no Supabase: ${error.message}`);
    return false;
  }
  statusGeralBadge.textContent = statusInspecao === 'ok' ? 'OK' : 'Irregular';
  statusGeralBadge.className = `status-badge ${statusInspecao === 'ok' ? 'ok' : 'alert'}`;
  statusGeralTexto.textContent = bloqueiaVeiculo
    ? 'Checklist salvo e campos limpos. Irregularidade que impede a circulação; veículo bloqueado até liberação.'
    : statusInspecao === 'irregular'
      ? 'Checklist salvo e campos limpos. Há item não crítico irregular; veículo liberado para rodar.'
      : 'Checklist salvo e campos limpos. Inspeção sem irregularidades; veículo liberado para rodar.';
  limparChecklistAposSalvar();
  await atualizarRelatorio();
  return true;
}

btnMostrarCadastroVeiculo.addEventListener('click', () => {
  const aberto = cadastroVeiculoForm.classList.toggle('hidden');
  btnMostrarCadastroVeiculo.setAttribute('aria-expanded', String(!aberto));
});

btnAtualizarVeiculos.addEventListener('click', async () => {
  try {
    await carregarVeiculos();
  } catch (error) {
    window.alert(`Não foi possível atualizar a lista de veículos: ${error.message}`);
  }
});

btnCancelarCadastroVeiculo.addEventListener('click', () => {
  veiculoEditandoId = null;
  cadastroVeiculoForm.reset();
  cadastroVeiculoForm.classList.add('hidden');
  btnMostrarCadastroVeiculo.setAttribute('aria-expanded', 'false');
  tituloCadastroVeiculo.textContent = 'Novo veículo';
  btnSalvarVeiculo.textContent = 'Salvar veículo';
  erroCadastroVeiculo.classList.remove('show');
});

veiculosBody.addEventListener('click', async (evento) => {
  const botao = evento.target.closest('[data-acao-veiculo]');
  if (!botao) return;
  const codigo = botao.dataset.codigoVeiculo;
  const acao = botao.dataset.acaoVeiculo;

  if (acao === 'editar') {
    const veiculo = veiculos[codigo];
    if (!veiculo) return;
    veiculoEditandoId = veiculo.id;
    document.getElementById('novoNumeroVeiculo').value = veiculo.codigo;
    document.getElementById('novoNomeVeiculo').value = veiculo.nome;
    document.getElementById('novaPlacaVeiculo').value = veiculo.placa;
    document.getElementById('novaPressaoMin').value = veiculo.pressaoMin;
    document.getElementById('novaPressaoMax').value = veiculo.pressaoMax;
    tituloCadastroVeiculo.textContent = `Editar veículo ${veiculo.codigo}`;
    btnSalvarVeiculo.textContent = 'Salvar alterações';
    erroCadastroVeiculo.classList.remove('show');
    cadastroVeiculoForm.classList.remove('hidden');
    btnMostrarCadastroVeiculo.setAttribute('aria-expanded', 'true');
    document.getElementById('novoNumeroVeiculo').focus();
    return;
  }

  if (acao === 'alternar') {
    const estaBloqueado = veiculos[codigo]?.situacao === 'bloqueado';
    await alternarStatusVeiculo(codigo, estaBloqueado ? 'liberar' : 'bloquear');
  }
});

cadastroVeiculoForm.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const codigo = document.getElementById('novoNumeroVeiculo').value.trim().toUpperCase();
  const nome = document.getElementById('novoNomeVeiculo').value.trim();
  const placa = document.getElementById('novaPlacaVeiculo').value.trim().toUpperCase();
  const pressaoMin = Number(document.getElementById('novaPressaoMin').value);
  const pressaoMax = Number(document.getElementById('novaPressaoMax').value);
  if (!Number.isFinite(pressaoMin) || !Number.isFinite(pressaoMax) || pressaoMin >= pressaoMax) {
    erroCadastroVeiculo.textContent = 'A pressão máxima precisa ser maior que a pressão mínima.';
    erroCadastroVeiculo.classList.add('show');
    return;
  }

  try {
    const dadosVeiculo = {
      codigo, nome_modelo: nome, placa,
      pressao_minima_psi: pressaoMin,
      pressao_maxima_psi: pressaoMax
    };
    const resultado = veiculoEditandoId
      ? await supabaseClient.from('veiculos').update(dadosVeiculo).eq('id_veiculo', veiculoEditandoId)
      : await supabaseClient.from('veiculos').insert({ ...dadosVeiculo, situacao: 'liberado' });
    const { error } = resultado;
    if (error) throw error;
    await carregarVeiculos();
  } catch (error) {
    erroCadastroVeiculo.textContent = error.message || 'Não foi possível cadastrar o veículo.';
    erroCadastroVeiculo.classList.add('show');
    return;
  }
  erroCadastroVeiculo.classList.remove('show');
  veiculoEditandoId = null;
  cadastroVeiculoForm.reset();
  cadastroVeiculoForm.classList.add('hidden');
  btnMostrarCadastroVeiculo.setAttribute('aria-expanded', 'false');
  tituloCadastroVeiculo.textContent = 'Novo veículo';
  btnSalvarVeiculo.textContent = 'Salvar veículo';
  numeroVeiculo.value = codigo;
  btnIdentificar.click();
});

btnIdentificar.addEventListener('click', async () => {
  if (!supabaseClient) {
    mostrarErro(erroIdentificacao, 'Configure primeiro a conexão com o Supabase em supabase-config.js.');
    return;
  }
  try {
    await carregarVeiculos();
  } catch (error) {
    mostrarErro(erroIdentificacao, `Não foi possível consultar os veículos: ${error.message}`);
    return;
  }
  const codigo = numeroVeiculo.value.trim().toUpperCase();
  const veiculo = veiculos[codigo];

  if (!veiculo) {
    mostrarErro(erroIdentificacao, 'Veículo não cadastrado. Informe uma numeração válida para continuar.');
    bloquearChecklistAteIdentificacao();
    return;
  }
  if (veiculo.situacao === 'bloqueado') {
    mostrarErro(erroIdentificacao, 'Veículo bloqueado. Um usuário autenticado pode liberá-lo na lista de veículos cadastrados após a avaliação operacional.');
    bloquearChecklistAteIdentificacao();
    return;
  }

  ocultarErro(erroIdentificacao);
  veiculoInfo.classList.add('show');
  veiculoNome.textContent = veiculo.nome;
  document.getElementById('veiculoPlaca').textContent = veiculo.placa;
  faixaPressao.textContent = `${veiculo.pressaoMin} a ${veiculo.pressaoMax} PSI`;
  statusVeiculo.textContent = 'Veículo identificado e pronto para inspeção';
  liberarChecklistIdentificado(codigo);
  salvarEstadoFormulario();
});

numeroVeiculo.addEventListener('input', () => {
  if (numeroVeiculo.value.trim().toUpperCase() !== veiculoIdentificadoCodigo) {
    bloquearChecklistAteIdentificacao();
  }
});

[
  document.getElementById('pneu1'),
  document.getElementById('pneu2'),
  document.getElementById('pneu3'),
  document.getElementById('pneu4')
].forEach((pneu) => {
  pneu.addEventListener('input', () => {
    validarPneus();
    atualizarStatusCategorias();
    salvarEstadoFormulario();
  });
});

document.querySelectorAll('input[name="oleo"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    validarOleo();
    atualizarStatusCategorias();
    salvarEstadoFormulario();
  });
});

document.querySelectorAll('.item-obrigatorio').forEach((item) => {
  item.addEventListener('change', () => {
    atualizarStatusCategorias();
    salvarEstadoFormulario();
    if (verificarItensObrigatorios()) {
      ocultarErro(erroFinal);
    }
  });
});

[operador, observacoes].forEach((campo) => {
  campo.addEventListener('input', salvarEstadoFormulario);
});

categoryTabs.forEach((botao) => {
  botao.addEventListener('click', () => trocarCategoria(botao.dataset.category));
});

tabButtons.forEach((botao) => {
  botao.addEventListener('click', () => trocarAba(botao.dataset.tab));
});

btnSalvar.addEventListener('click', () => {
  salvarEstadoFormulario();
  resultadoFinal.textContent = 'Rascunho salvo com sucesso.';
  resultadoFinal.classList.add('show');
  erroFinal.classList.remove('show');
});

btnFinalizar.addEventListener('click', validarChecklistCompleto);
[filtroCategoriaRelatorio, filtroVeiculoRelatorio, filtroItemRelatorio].forEach((filtro) => {
  filtro.addEventListener('change', renderizarVisaoRelatorio);
});
relatorioItensBody.addEventListener('click', (evento) => {
  const botao = evento.target.closest('[data-status-action]');
  if (botao) {
    alternarStatusVeiculo(botao.dataset.veiculo, botao.dataset.statusAction);
  }
});
relatorioBody.addEventListener('click', (evento) => {
  const botao = evento.target.closest('[data-corrigir-inspecao]');
  if (botao) iniciarCorrecaoInspecao(botao.dataset.corrigirInspecao);
});
btnImprimirRelatorio.addEventListener('click', () => window.print());
bloquearChecklistAteIdentificacao();
atualizarStatusCategorias();
trocarCategoria('todos');
restaurarEstadoFormulario();
atualizarDataHora();

async function iniciarSupabase() {
  if (!supabaseClient) {
    loginErro.textContent = 'Configure SUPABASE_URL e SUPABASE_ANON_KEY no arquivo supabase-config.js.';
    loginErro.classList.add('show');
    return;
  }
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    if (!data.session) return;
    exibirAplicacao(await carregarPerfilUsuario(data.session.user.id));
    await carregarVeiculos();
    await atualizarRelatorio();
  } catch (error) {
    loginErro.textContent = `Falha ao conectar ao Supabase: ${error.message}`;
    loginErro.classList.add('show');
  }
}

iniciarSupabase();
