// auth.js - controle de login, cadastro e token


function getToken() {
  return sessionStorage.getItem('token');
}

function setToken(token) {
  sessionStorage.setItem('token', token);
}

function removeToken() {
  sessionStorage.removeItem('token');
}

function checkAuth() {
  if (!getToken()) {
    window.location.href = 'index.html';
  }
}


// Login com validação robusta
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const login = document.getElementById('login').value.trim();
    const senha = document.getElementById('senha').value;
    const erroDiv = document.getElementById('loginError');
    erroDiv.textContent = '';

    // Validação
    if (!login || login.length < 3) {
      erroDiv.textContent = 'Login obrigatório (mínimo 3 caracteres).';
      return;
    }
    if (!senha || senha.length < 6) {
      erroDiv.textContent = 'Senha obrigatória (mínimo 6 caracteres).';
      return;
    }
    try {
      const response = await fetch(CONFIG.API_URL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, senha })
      });
      const data = await response.json();
      if (data && data.token) {
        setToken(data.token);
        showToast('Login realizado com sucesso!', 'sucesso');
        window.location.href = 'dashboard.html';
      } else {
        erroDiv.textContent = (data && data.error) || 'Falha no login.';
        showToast(erroDiv.textContent, 'erro');
      }
    } catch (err) {
      erroDiv.textContent = 'Erro de conexão.';
      showToast('Erro de conexão.', 'erro');
    }
  });
}

// Cadastro com validação robusta
if (document.getElementById('cadastroForm')) {
  document.getElementById('cadastroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const login = document.getElementById('login').value.trim();
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    const erroDiv = document.getElementById('cadastroError');
    erroDiv.textContent = '';

    // Validações
    if (!email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(email)) {
      erroDiv.textContent = 'E-mail inválido.';
      return;
    }
    if (!login || login.length < 3) {
      erroDiv.textContent = 'Login obrigatório (mínimo 3 caracteres).';
      return;
    }
    if (!senha || senha.length < 6) {
      erroDiv.textContent = 'Senha obrigatória (mínimo 6 caracteres).';
      return;
    }
    if (senha !== confirmarSenha) {
      erroDiv.textContent = 'As senhas não coincidem.';
      return;
    }
    try {
      const response = await fetch(CONFIG.API_URL + '/auth/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, login, senha })
      });
      const data = await response.json();
      if (data && !data.error) {
        showToast('Cadastro realizado com sucesso!', 'sucesso');
        window.location.href = 'index.html';
      } else {
        erroDiv.textContent = (data && data.error) || 'Falha no cadastro.';
        showToast(erroDiv.textContent, 'erro');
      }
    } catch (err) {
      erroDiv.textContent = 'Erro de conexão.';
      showToast('Erro de conexão.', 'erro');
    }
  });
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    removeToken();
    showToast('Logout realizado!', 'info');
    window.location.href = 'index.html';
  });
}

// Proteger páginas
if (['dashboard.html','categorias.html','operacoes.html','despesas.html'].some(p => window.location.pathname.endsWith(p))) {
  checkAuth();
}
