// utils.js - funções utilitárias

/**
 * Exibe um toast de notificação na tela.
 * @param {string} msg - Mensagem a ser exibida
 * @param {string} tipo - Tipo: 'info', 'erro', 'sucesso'
 */
function showToast(msg, tipo = 'info') {
  let toast = document.createElement('div');
  toast.className = 'toast ' + tipo;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => { toast.classList.add('show'); }, 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}
function formatarDataBR(dataISO) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

function formatarValor(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
