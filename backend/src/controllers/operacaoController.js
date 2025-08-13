// Importa parcelas não pagas no intervalo de datas
exports.importarParcelasProximas = async (req, res, next) => {
  try {
    const { dataInicio, dataFinal } = req.body;
    if (!dataInicio || !dataFinal) {
      return res.status(400).json({ mensagem: 'Intervalo de datas obrigatório.' });
    }
    // Busca parcelas não pagas no intervalo
    const [parcelas] = await pool.query(
      `SELECT p.*, dr.descricao as despesa_descricao, dr.id_categoria, dr.id_usuario
       FROM parcelas p
       INNER JOIN despesas_recorrentes dr ON p.id_despesa_recorrente = dr.id
       WHERE p.status = 'Aberto'
         AND p.data_vencimento BETWEEN ? AND ?
         AND dr.id_usuario = ?`,
      [dataInicio, dataFinal, req.user.id]
    );
    if (!parcelas.length) {
      return res.json({ mensagem: 'Nenhuma parcela encontrada para importar.' });
    }
    let importadas = 0;
    for (const parcela of parcelas) {
      // Verifica se já existe operação vinculada à parcela
      const [ops] = await pool.query(
        'SELECT id FROM operacoes WHERE id_parcela = ? AND id_usuario = ?',
        [parcela.id, req.user.id]
      );
      if (ops.length === 0) {
        // Cria operação vinculada à parcela
        await pool.query(
          'INSERT INTO operacoes (data, descricao, id_categoria, valor, id_usuario, status, id_parcela) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [parcela.data_vencimento, `Parcela ${parcela.id} - ${parcela.despesa_descricao}`, parcela.id_categoria, parcela.valor, req.user.id, 'Aberto', parcela.id]
        );
        importadas++;
      }
    }
    res.json({ mensagem: `${importadas} parcela(s) importada(s) com sucesso.` });
  } catch (err) {
    next(err);
  }
};
const operacaoModel = require('../models/operacaoModel');
const categoriaModel = require('../models/categoriaModel');
const pool = require('../config/db');

function calcularSaldo(operacoes, categorias) {
  let saldo = 0;
  const catMap = {};
  categorias.forEach(c => catMap[c.id] = c);
  return operacoes.map(op => {
    // Apenas operações com status 'Pago' ou 'pago' afetam o saldo
    if (op.status && (op.status.toLowerCase() === 'pago')) {
      const tipo = catMap[op.id_categoria]?.tipo;
      if (tipo === 'Crédito') {
        saldo += Number(op.valor);
      } else {
        saldo -= Number(op.valor);
      }
    }
    return { ...op, saldo_cumulativo: saldo };
  });
}

exports.listar = async (req, res, next) => {
  try {
    const filtros = {};
    
    // Processar filtros da query string
    if (req.query.dataInicio) {
      filtros.dataInicio = req.query.dataInicio;
    }
    
    if (req.query.dataFinal) {
      filtros.dataFinal = req.query.dataFinal;
    }
    
    if (req.query.categoria) {
      filtros.categoria = req.query.categoria;
    }
    
    const [operacoes, categorias] = await Promise.all([
      operacaoModel.listar(req.user.id, filtros),
      categoriaModel.listar(req.user.id)
    ]);
    const lista = calcularSaldo(operacoes, categorias);
    res.json(lista);
  } catch (err) {
    next(err);
  }
};

exports.obter = async (req, res, next) => {
  try {
    const op = await operacaoModel.obter(req.params.id, req.user.id);
    if (!op) return res.status(404).json({ error: 'Operação não encontrada.' });
    res.json(op);
  } catch (err) {
    next(err);
  }
};

exports.criar = async (req, res, next) => {
  try {
    const { data, descricao, id_categoria, valor } = req.body;
    // Converter data para formato YYYY-MM-DD
    const [dia, mes, ano] = data.split('/');
    const dataISO = `${ano}-${mes}-${dia}`;
    const nova = await operacaoModel.criar({ data: dataISO, descricao, id_categoria, valor, id_usuario: req.user.id });
    res.status(201).json(nova);
  } catch (err) {
    next(err);
  }
};

exports.atualizar = async (req, res, next) => {
  try {
    // Verifica se a operação está paga
    const op = await operacaoModel.obter(req.params.id, req.user.id);
    if (!op) return res.status(404).json({ error: 'Operação não encontrada.' });
    if (op.status === 'Pago') {
      return res.status(403).json({ error: 'Não é permitido editar uma operação já paga.' });
    }
    const { data, descricao, id_categoria, valor } = req.body;
    const [dia, mes, ano] = data.split('/');
    const dataISO = `${ano}-${mes}-${dia}`;
    await operacaoModel.atualizar(req.params.id, { data: dataISO, descricao, id_categoria, valor }, req.user.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

exports.deletar = async (req, res, next) => {
  try {
    await operacaoModel.deletar(req.params.id, req.user.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

exports.pagar = async (req, res, next) => {
  try {
    await operacaoModel.pagar(req.params.id, req.user.id);
    
    // Verificar se a operação está vinculada a uma parcela e sincronizar status
    const operacao = await operacaoModel.obter(req.params.id, req.user.id);
    if (operacao && operacao.descricao.includes('Parcela')) {
      // Extrair ID da parcela da descrição
      const match = operacao.descricao.match(/Parcela (\d+)/);
      if (match) {
        const parcelaId = match[1];
        await pool.query('UPDATE parcelas SET status = ? WHERE id = ?', ['Pago', parcelaId]);
        
        // Calcular novo saldo e notificar mudança
        const [parcelaInfo] = await pool.query(`
          SELECT p.id_despesa_recorrente, dr.valor_total,
          (SELECT COALESCE(SUM(valor), 0) FROM parcelas WHERE id_despesa_recorrente = p.id_despesa_recorrente AND status = 'Pago') as valor_pago
          FROM parcelas p
          INNER JOIN despesas_recorrentes dr ON p.id_despesa_recorrente = dr.id
          WHERE p.id = ?
        `, [parcelaId]);
        
        if (parcelaInfo.length > 0) {
          const novoSaldo = parcelaInfo[0].valor_total - parcelaInfo[0].valor_pago;
          // notificarMudancaParcela(parcelaInfo[0].id_despesa_recorrente, novoSaldo);
        }
      }
    }
    
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

exports.estornar = async (req, res, next) => {
  try {
    await operacaoModel.estornar(req.params.id, req.user.id);
    
    // Verificar se a operação está vinculada a uma parcela e sincronizar status
    const operacao = await operacaoModel.obter(req.params.id, req.user.id);
    if (operacao && operacao.descricao.includes('Parcela')) {
      // Extrair ID da parcela da descrição
      const match = operacao.descricao.match(/Parcela (\d+)/);
      if (match) {
        const parcelaId = match[1];
        await pool.query('UPDATE parcelas SET status = ? WHERE id = ?', ['Aberto', parcelaId]);
        
        // Calcular novo saldo e notificar mudança
        const [parcelaInfo] = await pool.query(`
          SELECT p.id_despesa_recorrente, dr.valor_total,
          (SELECT COALESCE(SUM(valor), 0) FROM parcelas WHERE id_despesa_recorrente = p.id_despesa_recorrente AND status = 'Pago') as valor_pago
          FROM parcelas p
          INNER JOIN despesas_recorrentes dr ON p.id_despesa_recorrente = dr.id
          WHERE p.id = ?
        `, [parcelaId]);
        
        if (parcelaInfo.length > 0) {
          const novoSaldo = parcelaInfo[0].valor_total - parcelaInfo[0].valor_pago;
          // notificarMudancaParcela(parcelaInfo[0].id_despesa_recorrente, novoSaldo);
        }
      }
    }
    
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
