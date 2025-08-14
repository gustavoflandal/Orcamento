// operacoes.js
// CRUD de operações

document.addEventListener('DOMContentLoaded', () => {
  carregarOperacoes();
  carregarCategoriasFiltro();
  document.getElementById('novaOperacaoBtn').addEventListener('click', abrirModalOperacao);
  document.getElementById('filtrarOperacoesBtn').addEventListener('click', filtrarOperacoes);
  document.getElementById('limparFiltrosBtn').addEventListener('click', limparFiltros);
  document.getElementById('importarParcelasBtn').addEventListener('click', importarParcelasProximas);
  document.getElementById('gerarRelatorioBtn').addEventListener('click', gerarRelatorioOperacoes);
});

// Função para importar parcelas próximas do vencimento
async function importarParcelasProximas() {
  const hoje = new Date();
  const dataImportacao = hoje.toISOString().slice(0, 10); // yyyy-mm-dd
  // Calcula intervalo de 10 dias antes e depois
  const dataInicio = new Date(hoje);
  dataInicio.setDate(hoje.getDate() - 10);
  const dataFinal = new Date(hoje);
  dataFinal.setDate(hoje.getDate() + 10);
  const dataInicioStr = dataInicio.toISOString().slice(0, 10);
  const dataFinalStr = dataFinal.toISOString().slice(0, 10);
  try {
    // Chama endpoint para importar parcelas não pagas nesse intervalo
    const resultado = await api.operacoes.importarParcelas({ dataInicio: dataInicioStr, dataFinal: dataFinalStr });
    showToast(resultado.mensagem || 'Parcelas importadas com sucesso!', 'sucesso');
    carregarOperacoes();
  } catch (err) {
    showToast('Erro ao importar parcelas.', 'erro');
    console.error('Erro ao importar parcelas:', err);
  }
}

// Função para formatar data
function formatarData(data) {
  if (!data) return '-';
  const d = new Date(data);
  if (!isNaN(d)) {
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  } else if (data.includes('/')) {
    return data; // Caso já venha no formato DD/MM/YYYY
  }
  return '-';
}

// Função para mapear IDs de categorias para nomes
function mapearCategorias(categorias) {
  const mapIdNome = {};
  categorias.forEach(cat => { mapIdNome[cat.id] = cat.nome; });
  return mapIdNome;
}

// Função para mapear IDs de categorias para tipos
function mapearCategoriasTipo(categorias) {
  const mapIdTipo = {};
  categorias.forEach(cat => { mapIdTipo[cat.id] = cat.tipo; });
  return mapIdTipo;
}

// Função para criar linha de operação
function criarLinhaOperacao(op, mapIdNome, mapCategoriaTipo) {
  const grid = document.getElementById('operacoesGrid');
  const nomeCategoria = mapIdNome[op.id_categoria] || '-';
  const dataFormatada = formatarData(op.data);
  const saldoNum = Number(op.saldo_cumulativo);
  const saldo = op.saldo_cumulativo !== undefined ? saldoNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-';
  const valor = op.valor !== undefined ? Number(op.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-';
  
  // Determinar tipo baseado na categoria
  const tipoCategoria = mapCategoriaTipo[op.id_categoria];
  const tipo = tipoCategoria === 'Crédito' ? 'C' : 'D';
  
  const tr = document.createElement('tr');
  const isPago = (op.status === 'Pago' || op.status === 'pago');
  tr.innerHTML = `
    <td>${dataFormatada}</td>
    <td>${op.descricao}</td>
    <td>${nomeCategoria}</td>
    <td style="text-align:center;">${tipo}</td>
    <td>${valor}</td>
    <td class="${saldoNum < 0 ? 'saldo-negativo' : ''}">${saldo}</td>
    <td><input type="checkbox" ${isPago ? 'checked' : ''} onclick="marcarPago(${op.id}, this.checked)"></td>
    <td>
      <button class="btn-editar-operacao${isPago ? ' btn-editar-desabilitado' : ''}" onclick="${isPago ? '' : `editarOperacao(${op.id})`}" ${isPago ? 'disabled' : ''}><i class="fa fa-edit"></i></button>
      <button class="btn-danger${isPago ? ' btn-danger-desabilitado' : ''}" onclick="${isPago ? '' : `excluirOperacao(${op.id})`}" ${isPago ? 'disabled' : ''}><i class="fa fa-trash"></i></button>
    </td>
  `;
  grid.appendChild(tr);
}

async function carregarOperacoes() {
  try {
    const [operacoes, categorias] = await Promise.all([
      api.operacoes.listar(),
      api.categorias.listar()
    ]);
    const mapIdNome = mapearCategorias(categorias);
    const mapCategoriaTipo = mapearCategoriasTipo(categorias);
    const grid = document.getElementById('operacoesGrid');
    grid.innerHTML = '';
    let saldo = 0;
    operacoes.forEach(op => {
      saldo = op.saldo_cumulativo;
      criarLinhaOperacao(op, mapIdNome, mapCategoriaTipo);
    });
  } catch (err) {
    showToast('Erro ao carregar operações.', 'erro');
    console.error('Erro ao carregar operações:', err);
  }
}

// Fim do arquivo operacoes.js

// Exibe modal para criar nova operação
async function abrirModalOperacao() {
  const categorias = await api.categorias.listar();
  const modal = document.getElementById('modalOperacao');
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Nova Operação</h3>
      <form id="formOperacao">
        <input type="date" name="data" required><br>
        <input type="text" name="descricao" placeholder="Descrição" required maxlength="100"><br>
        <select name="id_categoria" required>
          <option value="">Categoria</option>
          ${categorias.map(cat => `<option value="${cat.id}">${cat.nome}</option>`).join('')}
        </select><br>
        <input type="number" name="valor" placeholder="Valor" required step="0.01" min="0.01"><br>
        <div id="operacaoErro" class="error-message"></div>
        <button type="submit" class="btn-primary">Salvar</button>
        <button type="button" class="btn-danger" onclick="fecharModalOperacao()">Cancelar</button>
      </form>
    </div>
  `;
  modal.classList.remove('hidden');
  document.getElementById('formOperacao').onsubmit = salvarOperacao;
}
function fecharModalOperacao() {
  document.getElementById('modalOperacao').classList.add('hidden');
}
// Validação e envio do formulário de operação
async function salvarOperacao(e) {
  e.preventDefault();
  const form = e.target;
  const data = form.data.value;
  const descricao = form.descricao.value.trim();
  const id_categoria = form.id_categoria.value;
  const valor = form.valor.value;
  const erroDiv = document.getElementById('operacaoErro');
  erroDiv.textContent = '';

  // Validações robustas
  if (!data) {
    erroDiv.textContent = 'Data obrigatória.';
    return;
  }
  if (!descricao || descricao.length < 2) {
    erroDiv.textContent = 'Descrição obrigatória (mínimo 2 caracteres).';
    return;
  }
  if (!id_categoria || isNaN(Number(id_categoria)) || Number(id_categoria) < 1) {
    erroDiv.textContent = 'ID da categoria deve ser um número válido.';
    return;
  }
  if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) {
    erroDiv.textContent = 'Valor deve ser um número positivo.';
    return;
  }

  // Envia para o backend
  const body = {
    data: data.split('-').reverse().join('/'),
    descricao,
    id_categoria,
    valor
  };
  try {
    await api.operacoes.criar(body);
    fecharModalOperacao();
    setTimeout(() => carregarOperacoes(), 100);
    showToast('Operação salva com sucesso!', 'sucesso');
  } catch (err) {
    erroDiv.textContent = 'Erro ao salvar operação.';
    console.error('Erro ao salvar operação:', err);
  }
}
window.editarOperacao = async function(id) {
  // Buscar operação pelo id
  let operacoes = [];
  let operacao = null;
  try {
    operacoes = await api.operacoes.listar();
    operacao = operacoes.find(o => o.id === id);
  } catch (e) {
    showToast('Erro ao buscar operação.', 'erro');
    return;
  }
  if (!operacao) {
    showToast('Operação não encontrada.', 'erro');
    return;
  }
  // Carregar categorias para o select
  let categorias = [];
  try {
    categorias = await api.categorias.listar();
  } catch (e) {}
  const modal = document.getElementById('modalOperacao');
  // Converter data para yyyy-MM-dd (input date)
  let dataISO = '';
  if (operacao.data) {
    if (/^\d{4}-\d{2}-\d{2}/.test(operacao.data)) {
      // Já está no formato yyyy-MM-dd
      dataISO = operacao.data.substring(0, 10);
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(operacao.data)) {
      // Formato DD/MM/YYYY
      const [dia, mes, ano] = operacao.data.split('/');
      dataISO = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    } else {
      // Tenta converter de ISO ou outros formatos
      const d = new Date(operacao.data);
      if (!isNaN(d)) {
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const ano = d.getFullYear();
        dataISO = `${ano}-${mes}-${dia}`;
      }
    }
  }
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Editar Operação</h3>
      <form id="formOperacao">
        <input type="date" name="data" required value="${dataISO}"><br>
        <input type="text" name="descricao" placeholder="Descrição" required maxlength="100" value="${operacao.descricao}"><br>
        <select name="id_categoria" required>
          <option value="">Categoria</option>
          ${categorias.map(cat => `<option value="${cat.id}" ${cat.id === operacao.id_categoria ? 'selected' : ''}>${cat.nome}</option>`).join('')}
        </select><br>
        <input type="number" name="valor" placeholder="Valor" required step="0.01" min="0.01" value="${operacao.valor}"><br>
        <div id="operacaoErro" class="error-message"></div>
        <button type="submit" class="btn-primary">Salvar</button>
        <button type="button" class="btn-danger" onclick="fecharModalOperacao()">Cancelar</button>
      </form>
    </div>
  `;
  modal.classList.remove('hidden');
  document.getElementById('formOperacao').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const data = form.data.value;
    const descricao = form.descricao.value.trim();
    const id_categoria = form.id_categoria.value;
    const valor = form.valor.value;
    const erroDiv = document.getElementById('operacaoErro');
    erroDiv.textContent = '';
    if (!data) {
      erroDiv.textContent = 'Data obrigatória.';
      return;
    }
    if (!descricao || descricao.length < 2) {
      erroDiv.textContent = 'Descrição obrigatória (mínimo 2 caracteres).';
      return;
    }
    if (!id_categoria || isNaN(Number(id_categoria)) || Number(id_categoria) < 1) {
      erroDiv.textContent = 'ID da categoria deve ser um número válido.';
      return;
    }
    if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) {
      erroDiv.textContent = 'Valor deve ser um número positivo.';
      return;
    }
    const body = {
      data: data.split('-').reverse().join('/'),
      descricao,
      id_categoria,
      valor
    };
    try {
      await api.operacoes.atualizar(id, body);
      fecharModalOperacao();
      setTimeout(() => carregarOperacoes(), 100);
      showToast('Operação atualizada com sucesso!', 'sucesso');
    } catch (err) {
      erroDiv.textContent = 'Erro ao atualizar operação.';
      console.error('Erro ao atualizar operação:', err);
    }
  };
}
// Confirmação visual antes de excluir
window.excluirOperacao = async function(id) {
  // Primeiro verificar se a operação não está paga
  try {
    const operacoes = await api.operacoes.listar();
    const operacao = operacoes.find(o => o.id === id);
    
    if (!operacao) {
      showToast('Operação não encontrada.', 'erro');
      return;
    }
    
    const isPago = (operacao.status === 'Pago' || operacao.status === 'pago');
    if (isPago) {
      showToast('Não é possível excluir operações que já foram pagas.', 'erro');
      return;
    }
    
    if (window.confirm('Tem certeza que deseja excluir esta operação? Esta ação não poderá ser desfeita.')) {
      await api.operacoes.excluir(id);
      carregarOperacoes();
      showToast('Operação excluída!', 'sucesso');
    }
  } catch (err) {
    showToast('Erro ao excluir operação.', 'erro');
    console.error('Erro ao excluir operação:', err);
  }
}
window.marcarPago = async function(id, checked, checkboxElement) {
  // Tenta obter o checkbox do evento ou do parâmetro
  const checkbox = checkboxElement || (event && event.target);
  const originalState = !checked;
  
  try {
    // Desabilita o checkbox temporariamente para evitar cliques múltiplos
    if (checkbox) {
      checkbox.disabled = true;
    }
    
    if (checked) {
      await api.operacoes.pagar(id);
      showToast('Operação marcada como paga!', 'sucesso');
    } else {
      await api.operacoes.estornar(id);
      showToast('Operação marcada como pendente!', 'info');
    }
    
    // Recarrega as operações para atualizar o grid
    await carregarOperacoes();
    
  } catch (err) {
    // Em caso de erro, reverte o estado do checkbox
    if (checkbox) {
      checkbox.checked = originalState;
    }
    showToast('Erro ao atualizar status da operação.', 'erro');
    console.error('Erro ao atualizar status:', err);
  } finally {
    // Reabilita o checkbox
    if (checkbox) {
      checkbox.disabled = false;
    }
  }
}

// Função para carregar categorias no filtro
async function carregarCategoriasFiltro() {
  try {
    const categorias = await api.categorias.listar();
    const select = document.getElementById('filtroCategoria');
    select.innerHTML = '<option value="">Todas as categorias</option>';
    categorias.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.nome;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Erro ao carregar categorias para filtro:', err);
  }
}

// Função para filtrar operações
async function filtrarOperacoes() {
  try {
    const dataInicio = document.getElementById('filtroDataInicio').value;
    const dataFinal = document.getElementById('filtroDataFinal').value;
    const categoria = document.getElementById('filtroCategoria').value;
    // Validar se data início não é maior que data final
    if (dataInicio && dataFinal && dataInicio > dataFinal) {
      showToast('Data início não pode ser maior que data final.', 'erro');
      return;
    }
    // Montar filtros no formato esperado pelo backend
    const filtros = {};
    if (dataInicio) filtros.dataInicio = dataInicio; // já está em yyyy-mm-dd
    if (dataFinal) filtros.dataFinal = dataFinal;
    if (categoria && categoria !== '') filtros.categoria = categoria;
    
    const [operacoes, categorias] = await Promise.all([
      api.operacoes.listar(filtros),
      api.categorias.listar()
    ]);
    
    const mapIdNome = mapearCategorias(categorias);
    const mapCategoriaTipo = mapearCategoriasTipo(categorias);
    const grid = document.getElementById('operacoesGrid');
    grid.innerHTML = '';
    
    if (operacoes.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="8" style="text-align: center; padding: 2rem; color: #666;">Nenhuma operação encontrada para os filtros selecionados.</td>';
      grid.appendChild(tr);
    } else {
      operacoes.forEach(op => {
        criarLinhaOperacao(op, mapIdNome, mapCategoriaTipo);
      });
    }
    
    showToast(`${operacoes.length} operação(ões) encontrada(s).`, 'sucesso');
  } catch (err) {
    showToast('Erro ao filtrar operações.', 'erro');
    console.error('Erro ao filtrar operações:', err);
  }
}

// Função para limpar filtros
function limparFiltros() {
  document.getElementById('filtroDataInicio').value = '';
  document.getElementById('filtroDataFinal').value = '';
  document.getElementById('filtroCategoria').value = '';
  carregarOperacoes();
}
