const STORAGE_KEY = 'checklist-inspecao-state';
const HISTORY_KEY = 'checklist-inspecao-historico';
const VEHICLE_STATUS_KEY = 'checklist-inspecao-status-veiculos';
const VEHICLES_KEY = 'checklist-inspecao-veiculos';
const USERS_KEY = 'checklist-inspecao-usuarios';
const SESSION_USER_KEY = 'checklist-inspecao-usuario';

const veiculos = {
  '001': { nome: 'Caminhão 1', placa: 'ABC1234', pressaoMin: 30, pressaoMax: 38 },
  '002': { nome: 'Caminhão 2', placa: 'XYZ9876', pressaoMin: 28, pressaoMax: 36 },
  '003': { nome: 'Van de logística', placa: 'LMN4567', pressaoMin: 31, pressaoMax: 35 },
  ABC1234: { nome: 'Caminhão 1', placa: 'ABC1234', pressaoMin: 30, pressaoMax: 38 },
  XYZ9876: { nome: 'Caminhão 2', placa: 'XYZ9876', pressaoMin: 28, pressaoMax: 36 },
  LMN4567: { nome: 'Van de logística', placa: 'LMN4567', pressaoMin: 31, pressaoMax: 35 }
};
Object.assign(veiculos, JSON.parse(localStorage.getItem(VEHICLES_KEY) || '{}'));

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

const statusPneus = document.getElementById('statusPneus');
const statusOleo = document.getElementById('statusOleo');
const operador = document.getElementById('operador');
const observacoes = document.getElementById('observacoes');
const dataAtual = document.getElementById('dataAtual');
const horaAtual = document.getElementById('horaAtual');
const resultadoFinal = document.getElementById('resultadoFinal');
const erroFinal = document.getElementById('erroFinal');
const btnFinalizar = document.getElementById('btnFinalizar');
const btnSalvar = document.getElementById('btnSalvar');
const totalInspecoes = document.getElementById('totalInspecoes');
const totalIrregularidades = document.getElementById('totalIrregularidades');
const totalEmAndamento = document.getElementById('totalEmAndamento');
const relatorioBody = document.getElementById('relatorioBody');
const relatorioItensBody = document.getElementById('relatorioItensBody');
const relatorioVazio = document.getElementById('relatorioVazio');
const filtroCategoriaRelatorio = document.getElementById('filtroCategoriaRelatorio');
const btnImprimirRelatorio = document.getElementById('btnImprimirRelatorio');
const loginScreen = document.getElementById('loginScreen');
const loginForm = document.getElementById('loginForm');
const loginUsuario = document.getElementById('loginUsuario');
const loginSenha = document.getElementById('loginSenha');
const loginErro = document.getElementById('loginErro');
const cadastroForm = document.getElementById('cadastroForm');
const cadastroUsuario = document.getElementById('cadastroUsuario');
const cadastroSenha = document.getElementById('cadastroSenha');
const cadastroGerente = document.getElementById('cadastroGerente');
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

function obterUsuarios() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
}

function obterUsuarioAtual() {
  const usuario = sessionStorage.getItem(SESSION_USER_KEY);
  return usuario ? obterUsuarios()[usuario] || null : null;
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

function exibirAplicacao(usuario) {
  const conta = obterUsuarios()[usuario];
  if (!conta) return encerrarSessao();
  usuarioLogado.textContent = usuario;
  perfilLogado.textContent = conta.gerente ? '(Gerente)' : '(Operador)';
  operador.value = usuario;
  operador.readOnly = true;
  salvarEstadoFormulario();
  loginScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
  welcomePanel.classList.remove('hidden');
  checklistPanel.classList.add('hidden');
  relatoriosPanel.classList.add('hidden');
  tabButtons.forEach((botao) => botao.classList.remove('active'));
}

function encerrarSessao() {
  sessionStorage.removeItem(SESSION_USER_KEY);
  appShell.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  loginSenha.value = '';
  loginUsuario.focus();
}

loginForm.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const usuario = loginUsuario.value.trim();
  const senha = loginSenha.value;

  const conta = obterUsuarios()[usuario];
  if (!conta || conta.senha !== senha) {
    loginErro.textContent = 'Usuário ou senha inválidos. Crie uma conta para começar.';
    loginErro.classList.add('show');
    return;
  }

  sessionStorage.setItem(SESSION_USER_KEY, usuario);
  loginErro.classList.remove('show');
  exibirAplicacao(usuario);
});

cadastroForm.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const usuario = cadastroUsuario.value.trim();
  const senha = cadastroSenha.value;
  const usuarios = obterUsuarios();
  if (usuario.length < 3 || senha.length < 4) {
    cadastroErro.textContent = 'Use pelo menos 3 caracteres no usuário e 4 na senha.';
    cadastroErro.classList.add('show');
    return;
  }
  if (usuarios[usuario]) {
    cadastroErro.textContent = 'Esse usuário já está cadastrado.';
    cadastroErro.classList.add('show');
    return;
  }
  usuarios[usuario] = { senha, gerente: cadastroGerente.checked };
  localStorage.setItem(USERS_KEY, JSON.stringify(usuarios));
  sessionStorage.setItem(SESSION_USER_KEY, usuario);
  cadastroErro.classList.remove('show');
  exibirAplicacao(usuario);
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

function atualizarRelatorio() {
  const historico = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  const registros = normalizarRegistros(historico.length ? historico : criarDadosDemonstracao());

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

      return `
        <tr>
          <td>${escaparHTML(item.veiculo)}</td>
          <td>${escaparHTML(item.operador)}</td>
          <td>${escaparHTML(item.data)}</td>
          <td>${badge}</td>
          <td>${renderizarStatusCirculacao(item.veiculo, registros)}</td>
        </tr>
      `;
    })
    .join('');
  renderizarRelatorioItens(registros);
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

function obterStatusVeiculos() {
  return JSON.parse(localStorage.getItem(VEHICLE_STATUS_KEY) || '{}');
}

function veiculoEstaBloqueado(codigo, registros) {
  const statusSalvos = obterStatusVeiculos();
  if (Object.prototype.hasOwnProperty.call(statusSalvos, codigo)) {
    return statusSalvos[codigo] === 'bloqueado';
  }

  const ultimaInspecao = registros.find((registro) => registro.veiculo === codigo);
  if (typeof ultimaInspecao?.bloqueado === 'boolean') return ultimaInspecao.bloqueado;
  return ultimaInspecao?.itens?.some((item) => item.critico && item.status === 'irregular') || false;
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

function renderizarRelatorioItens(registros = criarDadosDemonstracao()) {
  const categoriaSelecionada = filtroCategoriaRelatorio.value;
  const veiculosComAcao = new Set();
  const linhas = registros.flatMap((registro) => (registro.itens || [])
    .filter((item) => categoriaSelecionada === 'todos' || item.categoria === categoriaSelecionada)
    .map((item) => {
      const statusLabels = { ok: 'OK', irregular: 'Irregular', pendente: 'Pendente' };
      const statusClasses = { ok: 'ok', irregular: 'alert', pendente: 'wait' };
      const bloqueado = veiculoEstaBloqueado(registro.veiculo, registros);
      const circulacao = bloqueado ? 'Bloqueado' : 'Liberado';
      const acao = bloqueado ? 'Liberar para rodar' : 'Bloquear veículo';
      const classeAcao = bloqueado ? 'release' : 'block';
      const valor = item.valor ? ` (${escaparHTML(item.valor)})` : '';
      const exibirAcao = !veiculosComAcao.has(registro.veiculo);
      veiculosComAcao.add(registro.veiculo);
      const controleVeiculo = !exibirAcao
        ? '—'
        : bloqueado && !obterUsuarioAtual()?.gerente
          ? '<span class="muted-copy">Somente gerente</span>'
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

function alternarStatusVeiculo(codigo, acao) {
  if (acao === 'liberar' && !obterUsuarioAtual()?.gerente) {
    window.alert('Apenas um gerente pode liberar um veículo bloqueado.');
    return;
  }
  const statusSalvos = obterStatusVeiculos();
  const registros = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  const statusNovo = acao === 'bloquear' ? 'bloqueado' : 'liberado';
  const atual = veiculoEstaBloqueado(codigo, registros.length ? registros : criarDadosDemonstracao());

  if ((acao === 'bloquear' && atual) || (acao === 'liberar' && !atual)) {
    return;
  }

  const ultimaInspecao = (registros.length ? registros : criarDadosDemonstracao())
    .find((registro) => registro.veiculo === codigo);
  const confirmacao = acao === 'bloquear'
    ? `Confirma o bloqueio do veículo ${codigo} para circulação?`
    : ultimaInspecao?.status === 'irregular'
      ? `A inspeção mais recente de ${codigo} registrou irregularidade. Confirme a liberação somente após avaliação e autorização conforme o procedimento da operação. Continuar?`
      : `Confirma a liberação do veículo ${codigo} para rodar?`;
  if (!window.confirm(confirmacao)) return;

  statusSalvos[codigo] = statusNovo;
  localStorage.setItem(VEHICLE_STATUS_KEY, JSON.stringify(statusSalvos));
  atualizarRelatorio();
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

function registrarHistorico(status, bloqueado) {
  const historico = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  const codigo = numeroVeiculo.value.trim().toUpperCase();
  const registro = {
    veiculo: codigo || 'N/A',
    operador: operador.value.trim() || 'Operador não informado',
    data: new Date().toLocaleDateString('pt-BR'),
    status,
    bloqueado,
    itens: coletarItensInspecao(),
    observacoes: observacoes.value.trim()
  };

  historico.unshift(registro);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(historico.slice(0, 10)));

  const statusSalvos = obterStatusVeiculos();
  statusSalvos[codigo] = bloqueado ? 'bloqueado' : 'liberado';
  localStorage.setItem(VEHICLE_STATUS_KEY, JSON.stringify(statusSalvos));
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

function validarChecklistCompleto() {
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
  registrarHistorico(statusInspecao, bloqueiaVeiculo);
  statusGeralBadge.textContent = statusInspecao === 'ok' ? 'OK' : 'Irregular';
  statusGeralBadge.className = `status-badge ${statusInspecao === 'ok' ? 'ok' : 'alert'}`;
  statusGeralTexto.textContent = bloqueiaVeiculo
    ? 'Irregularidade que impede a circulação. Veículo bloqueado até liberação.'
    : statusInspecao === 'irregular'
      ? 'Há item não crítico irregular. Veículo liberado para rodar.'
      : 'Inspeção sem irregularidades. Veículo liberado para rodar.';
  atualizarRelatorio();
  salvarEstadoFormulario();
  return true;
}

btnMostrarCadastroVeiculo.addEventListener('click', () => {
  const aberto = cadastroVeiculoForm.classList.toggle('hidden');
  btnMostrarCadastroVeiculo.setAttribute('aria-expanded', String(!aberto));
});

cadastroVeiculoForm.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const codigo = document.getElementById('novoNumeroVeiculo').value.trim().toUpperCase();
  const nome = document.getElementById('novoNomeVeiculo').value.trim();
  const placa = document.getElementById('novaPlacaVeiculo').value.trim().toUpperCase();
  const pressaoMin = Number(document.getElementById('novaPressaoMin').value);
  const pressaoMax = Number(document.getElementById('novaPressaoMax').value);
  const placasExistentes = Object.values(veiculos).map((veiculo) => veiculo.placa.toUpperCase());

  if (Object.prototype.hasOwnProperty.call(veiculos, codigo)) {
    erroCadastroVeiculo.textContent = 'Já existe um veículo com essa numeração.';
    erroCadastroVeiculo.classList.add('show');
    return;
  }
  if (placasExistentes.includes(placa)) {
    erroCadastroVeiculo.textContent = 'Já existe um veículo cadastrado com essa placa.';
    erroCadastroVeiculo.classList.add('show');
    return;
  }
  if (!Number.isFinite(pressaoMin) || !Number.isFinite(pressaoMax) || pressaoMin >= pressaoMax) {
    erroCadastroVeiculo.textContent = 'A pressão máxima precisa ser maior que a pressão mínima.';
    erroCadastroVeiculo.classList.add('show');
    return;
  }

  veiculos[codigo] = { nome, placa, pressaoMin, pressaoMax };
  const veiculosPersonalizados = JSON.parse(localStorage.getItem(VEHICLES_KEY) || '{}');
  veiculosPersonalizados[codigo] = veiculos[codigo];
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(veiculosPersonalizados));
  erroCadastroVeiculo.classList.remove('show');
  cadastroVeiculoForm.reset();
  cadastroVeiculoForm.classList.add('hidden');
  btnMostrarCadastroVeiculo.setAttribute('aria-expanded', 'false');
  numeroVeiculo.value = codigo;
  btnIdentificar.click();
});

btnIdentificar.addEventListener('click', () => {
  const codigo = numeroVeiculo.value.trim().toUpperCase();
  const veiculo = veiculos[codigo];

  if (!veiculo) {
    mostrarErro(erroIdentificacao, 'Veículo não cadastrado. Informe uma numeração válida para continuar.');
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
filtroCategoriaRelatorio.addEventListener('change', () => {
  const historico = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  renderizarRelatorioItens(normalizarRegistros(historico.length ? historico : criarDadosDemonstracao()));
});
relatorioItensBody.addEventListener('click', (evento) => {
  const botao = evento.target.closest('[data-status-action]');
  if (botao) {
    alternarStatusVeiculo(botao.dataset.veiculo, botao.dataset.statusAction);
  }
});
btnImprimirRelatorio.addEventListener('click', () => window.print());
bloquearChecklistAteIdentificacao();
atualizarStatusCategorias();
trocarCategoria('todos');
renderizarIrregularidades();
atualizarRelatorio();
restaurarEstadoFormulario();
atualizarDataHora();

const usuarioDaSessao = sessionStorage.getItem(SESSION_USER_KEY);
if (usuarioDaSessao) {
  exibirAplicacao(usuarioDaSessao);
}
