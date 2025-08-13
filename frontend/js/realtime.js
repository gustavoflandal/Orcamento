// realtime.js - Cliente WebSocket para atualizações em tempo real

let ws = null;
let tentativasReconexao = 0;
const MAX_TENTATIVAS = 5;

function conectarWebSocket() {
  if (tentativasReconexao >= MAX_TENTATIVAS) {
    console.log('Máximo de tentativas de reconexão atingido. WebSocket desabilitado.');
    return;
  }
  
  try {
    ws = new WebSocket('ws://localhost:3000');
    
    ws.onopen = function() {
      console.log('Conectado ao WebSocket para atualizações em tempo real');
      tentativasReconexao = 0; // Reset contador
    };
    
    ws.onmessage = function(event) {
      const data = JSON.parse(event.data);
      
      if (data.tipo === 'parcela_atualizada') {
        // Atualizar saldo da despesa em tempo real
        atualizarSaldoDespesa(data.despesa_id, data.novo_saldo);
      }
    };
    
    ws.onclose = function() {
      tentativasReconexao++;
      if (tentativasReconexao < MAX_TENTATIVAS) {
        console.log(`Conexão WebSocket fechada. Tentando reconectar em 5 segundos... (${tentativasReconexao}/${MAX_TENTATIVAS})`);
        setTimeout(conectarWebSocket, 5000);
      }
    };
    
    ws.onerror = function(error) {
      console.warn('WebSocket não disponível, continuando sem atualizações em tempo real');
    };
  } catch (error) {
    console.warn('WebSocket não suportado ou servidor indisponível');
  }
}

function atualizarSaldoDespesa(despesaId, novoSaldo) {
  // Atualizar o grid de despesas se estiver na página correta
  if (window.location.pathname.includes('despesas.html')) {
    const grid = document.getElementById('despesasGrid');
    if (grid) {
      const rows = grid.querySelectorAll('tr');
      rows.forEach(row => {
        const editBtn = row.querySelector('.edit-btn');
        if (editBtn && editBtn.dataset.id == despesaId) {
          const saldoCell = row.cells[6]; // Coluna do saldo a pagar
          if (saldoCell) {
            saldoCell.textContent = formatarValor(novoSaldo);
          }
        }
      });
    }
  }
}

// Conectar automaticamente quando o script carregar
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', conectarWebSocket);
}
