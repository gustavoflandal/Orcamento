// despesas.js
// CRUD de despesas recorrentes

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM completamente carregado e analisado');
  console.log('Elemento despesasGrid:', document.getElementById('despesasGrid'));
  carregarDespesas();
  const novaBtn = document.getElementById('novaDespesaBtn');
  if (novaBtn) novaBtn.addEventListener('click', abrirModalDespesa);

  const gerarBtn = document.getElementById('gerarParcelasBtn');
  if (gerarBtn) gerarBtn.addEventListener('click', simularJobDiario);

  const gridEl = document.getElementById('despesasGrid');
  if (gridEl) {
    gridEl.addEventListener('click', async (e) => {
      const btn = e.target.closest && e.target.closest('.edit-btn');
      if (!btn || !gridEl.contains(btn)) return;
      const id = btn.dataset.id;
      const parcelas = await api.despesas.parcelas(id);
      const hasPaid = parcelas.some(p => p.status === 'Pago');
      if (hasPaid) {
        showToast('Despesa não pode ser editada. Já existem parcelas pagas', 'erro');
        return;
      }
      abrirModalEdicao(id);
    });
  }

  const closeEdicao = document.getElementById('closeModalEdicao');
  if (closeEdicao) closeEdicao.addEventListener('click', fecharModalEdicao);

  const cancelEdicaoBtn = document.getElementById('cancelEdicaoBtn');
  if (cancelEdicaoBtn) cancelEdicaoBtn.addEventListener('click', fecharModalEdicao);
});

async function carregarDespesas() {
  try {
    const [despesas, categorias] = await Promise.all([
      api.despesas.listar(),
      api.categorias.listar()
    ]);
    // Mapeia id para nome para facilitar busca do nome da categoria
    const mapIdNome = {};
    categorias.forEach(cat => { mapIdNome[cat.id] = cat.nome; });
    const grid = document.getElementById('despesasGrid');
    grid.innerHTML = '';
    for (const desp of despesas) {
      const saldoPagar = await calcularSaldoPagar(desp);
      // Formatar data para DD/MM/YYYY, removendo hora se necessário
      let dataFormatada = '-';
      if (desp.primeiro_vencimento) {
        let data = desp.primeiro_vencimento;
        // Remove parte de hora se existir (ex: 2025-08-12T03:00:00.000Z)
        if (data.includes('T')) data = data.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
          const [ano, mes, dia] = data.split('-');
          dataFormatada = `${dia}/${mes}/${ano}`;
        } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
          dataFormatada = data;
        }
      }
      const nomeCategoria = mapIdNome[desp.id_categoria] || '-';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${desp.descricao}</td>
        <td>${formatarValor(desp.valor_total)}</td>
        <td>${desp.numero_parcelas}</td>
        <td>${dataFormatada}</td>
        <td>${desp.periodo || '-'} dias</td>
        <td>${nomeCategoria}</td>
        <td>${formatarValor(saldoPagar)}</td>
        <td>
          <button class="btn-info" onclick="verParcelas(${desp.id})"><i class="fa fa-list"></i></button>
          <button class="btn-edit edit-btn" data-id="${desp.id}"><i class="fa fa-edit"></i></button>
          <button class="btn-danger" onclick="excluirDespesa(${desp.id})"><i class="fa fa-trash"></i></button>
        </td>
      `;
      grid.appendChild(tr);
    }
  } catch (err) {
    showToast('Erro ao carregar despesas.', 'erro');
  }
}
async function calcularSaldoPagar(desp) {
  const parcelas = await api.despesas.parcelas(desp.id);
  const pagas = parcelas.filter(p => p.status === 'Pago').reduce((s, p) => s + Number(p.valor), 0);
  return Number(desp.valor_total) - pagas;
}
// Exibe modal para criar nova despesa recorrente
async function abrirModalDespesa() {
  const modal = document.getElementById('modalDespesa');
  let categorias = [];
  try {
    categorias = await api.categorias.listar();
  } catch (error) {
    showToast('Erro ao carregar categorias.', 'erro');
  }

  const options = categorias.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');

  modal.innerHTML = `
    <div class="modal-content">
      <h3>Nova Despesa Recorrente</h3>
      <form id="formDespesa">
        <input type="text" name="descricao" id="novaDespesa_descricao" placeholder="Descrição" required maxlength="100"><br>
        <input type="number" name="valor_total" id="novaDespesa_valor_total" placeholder="Valor Total" required step="0.01" min="0.01"><br>
        <input type="number" name="numero_parcelas" id="novaDespesa_numero_parcelas" placeholder="Nº Parcelas" required min="1"><br>
        <input type="date" name="primeiro_vencimento" id="novaDespesa_primeiro_vencimento" required><br>
        <input type="number" name="periodo" id="novaDespesa_periodo" placeholder="Dias de intervalo entre parcelas" required min="1"><br>
        <select name="id_categoria" id="novaDespesa_id_categoria" required>
          <option value="">Selecione a Categoria</option>
          ${options}
        </select><br>
        <div id="despesaErro" class="error-message"></div>
        <button type="submit" class="btn-primary">Salvar</button>
        <button type="button" class="btn-danger" onclick="fecharModalDespesa()">Cancelar</button>
      </form>
    </div>
  `;
  modal.classList.remove('hidden');
  document.getElementById('formDespesa').onsubmit = salvarDespesa;
}
function fecharModalDespesa() {
  document.getElementById('modalDespesa').classList.add('hidden');
}
// Validação e envio do formulário de despesa recorrente
async function salvarDespesa(e) {
  e.preventDefault();
  const form = e.target;
  const descricao = form.descricao.value.trim();
  const valor_total = form.valor_total.value;
  const numero_parcelas = form.numero_parcelas.value;
  const primeiro_vencimento = form.primeiro_vencimento.value;
  const id_categoria = form.id_categoria.value;
  const erroDiv = document.getElementById('despesaErro');
  erroDiv.textContent = '';

  const periodo = form.periodo.value;

  // Validações robustas
  if (!descricao || descricao.length < 2) {
    erroDiv.textContent = 'Descrição obrigatória (mínimo 2 caracteres).';
    return;
  }
  if (!valor_total || isNaN(Number(valor_total)) || Number(valor_total) <= 0) {
    erroDiv.textContent = 'Valor total deve ser um número positivo.';
    return;
  }
  if (!numero_parcelas || isNaN(Number(numero_parcelas)) || Number(numero_parcelas) < 1) {
    erroDiv.textContent = 'Número de parcelas deve ser um inteiro positivo.';
    return;
  }
  if (!primeiro_vencimento) {
    erroDiv.textContent = 'Primeiro vencimento obrigatório.';
    return;
  }
  if (!id_categoria) {
    erroDiv.textContent = 'Selecione uma categoria.';
    return;
  }
  if (!periodo || isNaN(Number(periodo)) || Number(periodo) < 1) {
    erroDiv.textContent = 'Dias de intervalo deve ser um número positivo.';
    return;
  }

  // Envia para o backend
  const body = {
    descricao,
    valor_total,
    numero_parcelas,
    primeiro_vencimento: primeiro_vencimento.split('-').reverse().join('/'),
    id_categoria,
    periodo
  };
  try {
    await api.despesas.criar(body);
    fecharModalDespesa();
    carregarDespesas();
    showToast('Despesa salva com sucesso!', 'sucesso');
  } catch (err) {
    erroDiv.textContent = 'Erro ao salvar despesa.';
  }
}
window.verParcelas = async function(id) {
  const parcelas = await api.despesas.parcelas(id);
  const modal = document.getElementById('modalParcelas');
  function formatarDataParcela(data) {
    if (!data) return '-';
    let d = data;
    if (d.includes('T')) d = d.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const [ano, mes, dia] = d.split('-');
      return `${dia}/${mes}/${ano}`;
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
      return d;
    }
    return d;
  }
  modal.innerHTML = `<div class="modal-content"><h3>Parcelas</h3><ul>${parcelas.map(p => `<li>${formatarDataParcela(p.data_vencimento)} - ${formatarValor(p.valor)} - ${p.status}</li>`).join('')}</ul><button class="btn-primary" onclick="fecharModalParcelas()">Fechar</button></div>`;
  modal.classList.remove('hidden');
}
window.fecharModalParcelas = function() {
  document.getElementById('modalParcelas').classList.add('hidden');
}
// Confirmação visual antes de excluir
window.excluirDespesa = async function(id) {
  if (window.confirm('Tem certeza que deseja excluir esta despesa? Esta ação não poderá ser desfeita.')) {
    try {
      await api.despesas.excluir(id);
      carregarDespesas();
      showToast('Despesa excluída!', 'sucesso');
    } catch (err) {
      showToast('Erro ao excluir despesa.', 'erro');
    }
  }
}
async function simularJobDiario() {
  alert('Simulação: gere as parcelas manualmente no backend para testar.');
}

async function abrirModalEdicao(id) {
  try {
    const [despesa, categorias] = await Promise.all([
      api.despesas.obter(id),
      api.categorias.listar()
    ]);

    const modal = document.getElementById('modalEdicaoDespesa');
    const options = categorias.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');

    // Formatar data para o input date
    let dataFormatada = '';
    if (despesa.primeiro_vencimento) {
      let data = despesa.primeiro_vencimento;
      if (data.includes('T')) data = data.split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        dataFormatada = data;
      }
    }

    // Criar o modal com a mesma estrutura do cadastro
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-button" onclick="fecharModalEdicao()">&times;</span>
        <h3>Editar Despesa Recorrente</h3>
        <form id="formEdicaoDespesa">
          <input type="text" name="descricao" id="editDespesa_descricao" placeholder="Descrição" required maxlength="100" value="${despesa.descricao}"><br>
          <input type="number" name="valor_total" id="editDespesa_valor_total" placeholder="Valor Total" required step="0.01" min="0.01" value="${despesa.valor_total}"><br>
          <input type="number" name="numero_parcelas" id="editDespesa_numero_parcelas" placeholder="Nº Parcelas" required min="1" value="${despesa.numero_parcelas}"><br>
          <input type="date" name="primeiro_vencimento" id="editDespesa_primeiro_vencimento" required value="${dataFormatada}"><br>
          <input type="number" name="periodo" id="editDespesa_periodo" placeholder="Dias de intervalo entre parcelas" required min="1" value="${despesa.periodo || 30}"><br>
          <select name="id_categoria" id="editDespesa_id_categoria" required>
            <option value="">Selecione a Categoria</option>
            ${options}
          </select><br>
          <div id="edicaoErro" class="error-message"></div>
          <button type="submit" class="btn-primary">Salvar</button>
          <button type="button" class="btn-danger" onclick="fecharModalEdicao()">Cancelar</button>
        </form>
      </div>
    `;

    // Selecionar a categoria atual
    const categoriaSelect = document.getElementById('editDespesa_id_categoria');
    categoriaSelect.value = despesa.id_categoria;

    modal.classList.remove('hidden');
    document.getElementById('formEdicaoDespesa').onsubmit = (e) => salvarEdicao(e, id);

  } catch (err) {
    showToast('Erro ao carregar dados para edição.', 'erro');
  }
}

function fecharModalEdicao() {
  document.getElementById('modalEdicaoDespesa').classList.add('hidden');
}

async function salvarEdicao(e, id) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  
  const descricao = formData.get('descricao').trim();
  const valor_total = formData.get('valor_total');
  const numero_parcelas = formData.get('numero_parcelas');
  const primeiro_vencimento = formData.get('primeiro_vencimento');
  const id_categoria = formData.get('id_categoria');
  const periodo = formData.get('periodo');
  
  const erroDiv = document.getElementById('edicaoErro');
  erroDiv.textContent = '';

  console.log('Dados do formulário:', { descricao, valor_total, numero_parcelas, primeiro_vencimento, id_categoria, periodo });

  // Validações robustas
  if (!descricao || descricao.length < 2) {
    erroDiv.textContent = 'Descrição obrigatória (mínimo 2 caracteres).';
    return;
  }
  if (!valor_total || isNaN(Number(valor_total)) || Number(valor_total) <= 0) {
    erroDiv.textContent = 'Valor total deve ser um número positivo.';
    return;
  }
  if (!numero_parcelas || isNaN(Number(numero_parcelas)) || Number(numero_parcelas) < 1) {
    erroDiv.textContent = 'Número de parcelas deve ser um inteiro positivo.';
    return;
  }
  if (!primeiro_vencimento) {
    erroDiv.textContent = 'Primeiro vencimento obrigatório.';
    return;
  }
  if (!id_categoria) {
    erroDiv.textContent = 'Selecione uma categoria.';
    return;
  }
  if (!periodo || isNaN(Number(periodo)) || Number(periodo) < 1) {
    erroDiv.textContent = 'Dias de intervalo deve ser um número positivo.';
    return;
  }

  try {
    // Enviar dados no formato esperado pelo backend
    const body = {
      descricao,
      valor_total: Number(valor_total),
      numero_parcelas: Number(numero_parcelas),
      primeiro_vencimento: primeiro_vencimento.split('-').reverse().join('/'), // YYYY-MM-DD para DD/MM/YYYY
      id_categoria: Number(id_categoria),
      periodo: Number(periodo)
    };
    
    console.log('Enviando para o backend:', body);
    
    await api.despesas.atualizar(id, body);
    await api.despesas.recriarParcelas(id);
    fecharModalEdicao();
    carregarDespesas();
    showToast('Despesa atualizada com sucesso!', 'sucesso');
  } catch (err) {
    console.error('Erro ao salvar edição:', err);
    erroDiv.textContent = 'Erro ao atualizar despesa.';
  }
}
