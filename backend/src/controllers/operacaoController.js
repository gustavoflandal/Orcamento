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
        // Cria operação vinculada à parcela, incluindo o número da parcela
        await pool.query(
          'INSERT INTO operacoes (data, descricao, id_categoria, valor, id_usuario, status, id_parcela) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [parcela.data_vencimento, `Parcela ${parcela.numero_parcela} - ${parcela.despesa_descricao}`, parcela.id_categoria, parcela.valor, req.user.id, 'Aberto', parcela.id]
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
    // Buscar a operação antes de marcar como paga
    const operacao = await operacaoModel.obter(req.params.id, req.user.id);
    if (!operacao) {
      return res.status(404).json({ error: 'Operação não encontrada.' });
    }

    // Marcar operação como paga
    await operacaoModel.pagar(req.params.id, req.user.id);
    
    // Verificar se a operação está vinculada a uma parcela
    if (operacao.id_parcela) {
      // Atualizar status da parcela usando id_parcela
      console.log('[DEBUG] Atualizando status da parcela:', operacao.id_parcela);
      await pool.query('UPDATE parcelas SET status = ? WHERE id = ?', ['Pago', operacao.id_parcela]);
    } else if (operacao.descricao && operacao.descricao.includes('Parcela')) {
      // Fallback: tentar extrair ID da parcela da descrição
      const match = operacao.descricao.match(/Parcela (\d+)/);
      if (match) {
        const numeroMatch = operacao.descricao.match(/Parcela (\d+) -/);
        if (numeroMatch) {
          const numeroParcela = numeroMatch[1];
          console.log('[DEBUG] Tentando atualizar parcela pelo número:', numeroParcela);
          // Buscar a parcela pelo número e descrição
          const [parcelas] = await pool.query(`
            SELECT p.id FROM parcelas p
            INNER JOIN despesas_recorrentes dr ON p.id_despesa_recorrente = dr.id
            WHERE p.numero_parcela = ? AND dr.id_usuario = ?
          `, [numeroParcela, req.user.id]);
          
          if (parcelas.length > 0) {
            await pool.query('UPDATE parcelas SET status = ? WHERE id = ?', ['Pago', parcelas[0].id]);
          }
        }
      }
    }
    
    res.json({ ok: true });
  } catch (err) {
    console.error('[ERRO] Falha ao pagar operação:', err);
    next(err);
  }
};

exports.estornar = async (req, res, next) => {
  try {
    // Buscar a operação antes de estornar
    const operacao = await operacaoModel.obter(req.params.id, req.user.id);
    if (!operacao) {
      return res.status(404).json({ error: 'Operação não encontrada.' });
    }

    // Estornar operação
    await operacaoModel.estornar(req.params.id, req.user.id);
    
    // Verificar se a operação está vinculada a uma parcela
    if (operacao.id_parcela) {
      // Atualizar status da parcela usando id_parcela
      console.log('[DEBUG] Estornando status da parcela:', operacao.id_parcela);
      await pool.query('UPDATE parcelas SET status = ? WHERE id = ?', ['Aberto', operacao.id_parcela]);
    } else if (operacao.descricao && operacao.descricao.includes('Parcela')) {
      // Fallback: tentar extrair ID da parcela da descrição
      const numeroMatch = operacao.descricao.match(/Parcela (\d+) -/);
      if (numeroMatch) {
        const numeroParcela = numeroMatch[1];
        console.log('[DEBUG] Tentando estornar parcela pelo número:', numeroParcela);
        // Buscar a parcela pelo número e descrição
        const [parcelas] = await pool.query(`
          SELECT p.id FROM parcelas p
          INNER JOIN despesas_recorrentes dr ON p.id_despesa_recorrente = dr.id
          WHERE p.numero_parcela = ? AND dr.id_usuario = ?
        `, [numeroParcela, req.user.id]);
        
        if (parcelas.length > 0) {
          await pool.query('UPDATE parcelas SET status = ? WHERE id = ?', ['Aberto', parcelas[0].id]);
        }
      }
    }
    
    res.json({ ok: true });
  } catch (err) {
    console.error('[ERRO] Falha ao estornar operação:', err);
    next(err);
  }
};
