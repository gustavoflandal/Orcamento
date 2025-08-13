// WebSocket para atualizações em tempo real
let wsConnections = [];

function notificarMudancaParcela(despesaId, novoSaldo) {
  const message = JSON.stringify({
    tipo: 'parcela_atualizada',
    despesa_id: despesaId,
    novo_saldo: novoSaldo
  });
  
  wsConnections.forEach(ws => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(message);
    }
  });
}

function adicionarConexao(ws) {
  wsConnections.push(ws);
  
  ws.on('close', () => {
    wsConnections = wsConnections.filter(conn => conn !== ws);
  });
}

module.exports = {
  notificarMudancaParcela,
  adicionarConexao
};
