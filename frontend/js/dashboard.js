// dashboard.js
// Renderiza gráficos usando Chart.js e busca dados do backend

document.addEventListener('DOMContentLoaded', async () => {
  await carregarDashboard();
  document.getElementById('filtrarBtn').addEventListener('click', carregarDashboard);
});

async function carregarDashboard() {
  // Filtros de data (opcional)
  const dataInicio = document.getElementById('dataInicio')?.value;
  const dataFim = document.getElementById('dataFim')?.value;
  try {
    // Se backend aceitar filtros, adicione query string
    // let url = `/dashboard?inicio=${dataInicio}&fim=${dataFim}`;
    // const data = await api.dashboard.todos(url);
  const data = await api.dashboard.obter();
  if (!data) return;
  renderPizzaReceita(data.pizza);
  renderPizza(data.pizza);
  renderBarras(data.barras);
  renderLinha(data.linha);
  } catch (err) {
    showToast('Erro ao carregar dashboard.', 'erro');
  }
}

let pizzaReceitaChart, pizzaChart, barraChart, linhaChart;
function renderPizzaReceita(pizza) {
  const ctx = document.getElementById('pizzaReceitaChart').getContext('2d');
  if (pizzaReceitaChart) pizzaReceitaChart.destroy();
  // Considerar apenas receitas (valores positivos ou tipo 'Crédito')
  const receitas = pizza.filter(c => (c.total > 0) || (c.tipo && c.tipo.toLowerCase().startsWith('c')));
  pizzaReceitaChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: receitas.map(c => c.nome),
      datasets: [{
        data: receitas.map(c => c.total),
        backgroundColor: receitas.map(c => c.cor)
      }]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  });
}
function renderPizza(pizza) {
  const ctx = document.getElementById('pizzaChart').getContext('2d');
  if (pizzaChart) pizzaChart.destroy();
  // Considerar apenas despesas (valores negativos ou tipo 'Débito')
  const despesas = pizza.filter(c => (c.total < 0) || (c.tipo && c.tipo.toLowerCase().startsWith('d')));
  pizzaChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: despesas.map(c => c.nome),
      datasets: [{
        data: despesas.map(c => Math.abs(c.total)),
        backgroundColor: despesas.map(c => c.cor)
      }]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  });
}
function renderBarras(barras) {
  const ctx = document.getElementById('barraChart').getContext('2d');
  if (barraChart) barraChart.destroy();
  barraChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: barras.map(b => formatarDataBR(b.data)),
      datasets: [
        { label: 'Crédito', data: barras.map(b => b.credito), backgroundColor: '#2ecc71' },
        { label: 'Débito', data: barras.map(b => b.debito), backgroundColor: '#e74c3c' }
      ]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  });
}
function renderLinha(linha) {
  const ctx = document.getElementById('linhaChart').getContext('2d');
  if (linhaChart) linhaChart.destroy();
  linhaChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: linha.map(l => formatarDataBR(l.data)),
      datasets: [{
        label: 'Saldo acumulado',
        data: linha.map(l => l.saldo_acumulado),
        borderColor: '#3498db',
        fill: false
      }]
    },
    options: { plugins: { legend: { display: false } } }
  });
}

// Utilitário para formatar datas para dd/mm/yyyy
function formatarDataBR(data) {
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
