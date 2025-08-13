// categorias.js
// CRUD de categorias


// Ao carregar a página, inicializa grid e botão de nova categoria
document.addEventListener('DOMContentLoaded', () => {
  carregarCategorias();
  document.getElementById('novaCategoriaBtn').addEventListener('click', abrirModalCategoria);
});

// Busca e exibe as categorias na tabela
async function carregarCategorias() {
  try {
    const categorias = await api.categorias.listar();
    // Mapeia id para nome para facilitar busca do nome da categoria pai
    const mapIdNome = {};
    categorias.forEach(cat => { mapIdNome[cat.id] = cat.nome; });
    const grid = document.getElementById('categoriasGrid');
    grid.innerHTML = '';
    categorias.forEach(cat => {
      const nomePai = cat.id_categoria_pai ? (mapIdNome[cat.id_categoria_pai] || '-') : '-';
      const tr = document.createElement('tr');
      tr.innerHTML = `
  <td>${cat.nome}</td>
  <td>${nomePai}</td>
  <td>${cat.tipo}</td>
  <td><span style="background:${cat.cor};padding:0.3em 1em;border-radius:5px;">${cat.cor}</span></td>
        <td>
          <button class="btn-primary" onclick="editarCategoria(${cat.id})"><i class="fa fa-edit"></i></button>
          <button class="btn-danger" onclick="confirmarExclusaoCategoria(${cat.id})"><i class="fa fa-trash"></i></button>
        </td>
      `;
      grid.appendChild(tr);
    });
  } catch (err) {
    showToast('Erro ao carregar categorias.', 'erro');
  }
}

// Exibe modal para criar nova categoria
async function abrirModalCategoria() {
  // Buscar categorias para popular o select de categoria pai
  let categorias = [];
  try {
    categorias = await api.categorias.listar();
  } catch (e) {}
  const modal = document.getElementById('modalCategoria');
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Nova Categoria</h3>
      <form id="formCategoria">
        <input type="text" name="nome" placeholder="Nome" required maxlength="50"><br>
        <select name="tipo" required>
          <option value="">Tipo</option>
          <option value="Débito">Débito</option>
          <option value="Crédito">Crédito</option>
        </select><br>
        <input type="color" name="cor" value="#3498db" required><br>
        <select name="id_categoria_pai">
          <option value="">Categoria Pai (opcional)</option>
          ${categorias.map(cat => `<option value="${cat.id}">${cat.nome}</option>`).join('')}
        </select><br>
        <div id="categoriaErro" class="error-message"></div>
        <button type="submit" class="btn-primary">Salvar</button>
        <button type="button" class="btn-danger" onclick="fecharModalCategoria()">Cancelar</button>
      </form>
    </div>
  `;
  modal.classList.remove('hidden');
  document.getElementById('formCategoria').onsubmit = salvarCategoria;
}

// Fecha o modal de categoria
function fecharModalCategoria() {
  document.getElementById('modalCategoria').classList.add('hidden');
}

// Validação e envio do formulário de categoria
async function salvarCategoria(e) {
  e.preventDefault();
  const form = e.target;
  const nome = form.nome.value.trim();
  const tipo = form.tipo.value;
  const cor = form.cor.value;
  const id_categoria_pai = form.id_categoria_pai.value;
  const erroDiv = document.getElementById('categoriaErro');
  erroDiv.textContent = '';

  // Validações robustas
  if (!nome || nome.length < 2) {
    erroDiv.textContent = 'Nome obrigatório (mínimo 2 caracteres).';
    return;
  }
  if (!['Débito', 'Crédito'].includes(tipo)) {
    erroDiv.textContent = 'Selecione um tipo válido.';
    return;
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(cor)) {
    erroDiv.textContent = 'Cor inválida.';
    return;
  }
  if (id_categoria_pai && isNaN(Number(id_categoria_pai))) {
    erroDiv.textContent = 'ID da categoria pai deve ser um número.';
    return;
  }

  // Envia para o backend
  const body = {
    nome,
    tipo,
    cor,
    id_categoria_pai: id_categoria_pai || null
  };
  try {
    await api.categorias.criar(body);
    fecharModalCategoria();
    carregarCategorias();
    showToast('Categoria salva com sucesso!', 'sucesso');
  } catch (err) {
    erroDiv.textContent = 'Erro ao salvar categoria.';
  }
}

// Confirmação visual antes de excluir
window.confirmarExclusaoCategoria = function(id) {
  if (window.confirm('Tem certeza que deseja excluir esta categoria? Esta ação não poderá ser desfeita.')) {
    excluirCategoria(id);
  }
}

// Exclui categoria
window.excluirCategoria = async function(id) {
  try {
    await api.categorias.excluir(id);
    carregarCategorias();
    showToast('Categoria excluída!', 'sucesso');
  } catch (err) {
    showToast('Erro ao excluir categoria.', 'erro');
  }
}

// (Opcional) Função para editar categoria pode ser implementada aqui
window.editarCategoria = async function(id) {
  // Buscar categorias para popular o select de categoria pai
  let categorias = [];
  let categoria = null;
  try {
    categorias = await api.categorias.listar();
    categoria = categorias.find(c => c.id === id);
  } catch (e) {}
  if (!categoria) {
    showToast('Categoria não encontrada.', 'erro');
    return;
  }
  const modal = document.getElementById('modalCategoria');
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Editar Categoria</h3>
      <form id="formCategoria">
        <input type="text" name="nome" placeholder="Nome" required maxlength="50" value="${categoria.nome}"><br>
        <select name="tipo" required>
          <option value="">Tipo</option>
          <option value="Débito" ${categoria.tipo === 'Débito' ? 'selected' : ''}>Débito</option>
          <option value="Crédito" ${categoria.tipo === 'Crédito' ? 'selected' : ''}>Crédito</option>
        </select><br>
        <input type="color" name="cor" value="${categoria.cor}" required><br>
        <select name="id_categoria_pai">
          <option value="">Categoria Pai (opcional)</option>
          ${categorias.filter(cat => cat.id !== id).map(cat => `<option value="${cat.id}" ${cat.id === categoria.id_categoria_pai ? 'selected' : ''}>${cat.nome}</option>`).join('')}
        </select><br>
        <div id="categoriaErro" class="error-message"></div>
        <button type="submit" class="btn-primary">Salvar</button>
        <button type="button" class="btn-danger" onclick="fecharModalCategoria()">Cancelar</button>
      </form>
    </div>
  `;
  modal.classList.remove('hidden');
  document.getElementById('formCategoria').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const nome = form.nome.value.trim();
    const tipo = form.tipo.value;
    const cor = form.cor.value;
    const id_categoria_pai = form.id_categoria_pai.value;
    const erroDiv = document.getElementById('categoriaErro');
    erroDiv.textContent = '';
    if (!nome || nome.length < 2) {
      erroDiv.textContent = 'Nome obrigatório (mínimo 2 caracteres).';
      return;
    }
    if (!['Débito', 'Crédito'].includes(tipo)) {
      erroDiv.textContent = 'Selecione um tipo válido.';
      return;
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(cor)) {
      erroDiv.textContent = 'Cor inválida.';
      return;
    }
    if (id_categoria_pai && isNaN(Number(id_categoria_pai))) {
      erroDiv.textContent = 'ID da categoria pai deve ser um número.';
      return;
    }
    const body = {
      nome,
      tipo,
      cor,
      id_categoria_pai: id_categoria_pai || null
    };
    try {
      await api.categorias.atualizar(id, body);
      fecharModalCategoria();
      carregarCategorias();
      showToast('Categoria atualizada com sucesso!', 'sucesso');
    } catch (err) {
      erroDiv.textContent = 'Erro ao atualizar categoria.';
    }
  };
}
