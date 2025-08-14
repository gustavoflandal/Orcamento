const despesaRecorrenteModel = require('../models/despesaRecorrenteModel');
const parcelaModel = require('../models/parcelaModel');

exports.listar = async (req, res, next) => {
  try {
    console.log('[DEBUG] Iniciando listar despesas recorrentes para usuário:', req.user.id);
    const despesas = await despesaRecorrenteModel.listar(req.user.id);
    console.log('[DEBUG] Despesas retornadas:', despesas);
    res.json(despesas);
  } catch (err) {
    console.error('[ERRO] Falha ao listar despesas recorrentes:', err);
    next(err);
  }
};

exports.obter = async (req, res, next) => {
  try {
    const despesa = await despesaRecorrenteModel.obter(req.params.id, req.user.id);
    if (!despesa) return res.status(404).json({ error: 'Despesa não encontrada.' });
    res.json(despesa);
  } catch (err) {
    next(err);
  }
};

exports.criar = async (req, res, next) => {
  try {
    const { descricao, valor_total, numero_parcelas, primeiro_vencimento, id_categoria, periodo } = req.body;
    const [dia, mes, ano] = primeiro_vencimento.split('/');
    const dataISO = `${ano}-${mes}-${dia}`;
    let despesa;
    try {
      despesa = await despesaRecorrenteModel.criar({ descricao, valor_total, numero_parcelas, primeiro_vencimento: dataISO, id_categoria, periodo, id_usuario: req.user.id });
    } catch (e) {
      if (e.message && e.message.includes('Despesa recorrente já existe')) {
        return res.status(400).json({ error: 'Já existe uma despesa recorrente com esses dados.' });
      }
      throw e;
    }
    // Gerar parcelas conforme período
    const valorParcela = (Number(valor_total) / Number(numero_parcelas)).toFixed(2);
    const diasPeriodo = Number(periodo);
    let dataVenc = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));
    for (let i = 0; i < numero_parcelas; i++) {
      const vencStr = dataVenc.toISOString().slice(0, 10);
      await parcelaModel.criar({ id_despesa_recorrente: despesa.id, numero_parcela: i + 1, data_vencimento: vencStr, valor: valorParcela });
      dataVenc.setUTCDate(dataVenc.getUTCDate() + diasPeriodo);
    }
    res.status(201).json(despesa);
  } catch (err) {
    next(err);
  }
};

exports.deletar = async (req, res, next) => {
  try {
    // Verifica se existe parcela paga
    const existePaga = await parcelaModel.existeParcelaPaga(req.params.id);
    if (existePaga) {
      return res.status(400).json({ error: 'Não é possível excluir: há parcelas pagas.' });
    }
    // Exclui todas as parcelas antes de excluir a despesa recorrente
    await parcelaModel.excluirPorDespesa(req.params.id);
    await despesaRecorrenteModel.deletar(req.params.id, req.user.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

exports.listarParcelas = async (req, res, next) => {
  try {
    const parcelas = await parcelaModel.listarPorDespesa(req.params.id);
    res.json(parcelas);
  } catch (err) {
    next(err);
  }
};

exports.atualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('[DEBUG] Atualizando despesa ID:', id);
    console.log('[DEBUG] Dados recebidos:', req.body);
    
    const existePaga = await parcelaModel.existeParcelaPaga(id);
    if (existePaga) {
      return res.status(400).json({ error: 'Despesa não pode ser editada. Já existem parcelas pagas' });
    }

    const { descricao, valor_total, numero_parcelas, primeiro_vencimento, id_categoria, periodo } = req.body;
    
    // Validar se todos os campos obrigatórios estão presentes
    if (!descricao || !valor_total || !numero_parcelas || !primeiro_vencimento || !id_categoria || !periodo) {
      console.log('[DEBUG] Campos faltando:', { descricao, valor_total, numero_parcelas, primeiro_vencimento, id_categoria, periodo });
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    // Converter data de DD/MM/YYYY para YYYY-MM-DD
    const [dia, mes, ano] = primeiro_vencimento.split('/');
    const dataISO = `${ano}-${mes}-${dia}`;
    
    await despesaRecorrenteModel.atualizar(id, {
      descricao,
      valor_total: Number(valor_total),
      numero_parcelas: Number(numero_parcelas),
      primeiro_vencimento: dataISO,
      id_categoria: Number(id_categoria),
      periodo: Number(periodo)
    });

    console.log('[DEBUG] Despesa atualizada com sucesso');
    res.json({ ok: true });
  } catch (err) {
    console.error('[ERRO] Falha ao atualizar despesa:', err);
    next(err);
  }
};

exports.recriarParcelas = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('[DEBUG] Recriando parcelas para despesa ID:', id);
    
    const despesa = await despesaRecorrenteModel.obter(id, req.user.id);
    if (!despesa) {
      return res.status(404).json({ error: 'Despesa não encontrada.' });
    }

    console.log('[DEBUG] Dados da despesa:', despesa);

    await parcelaModel.excluirPorDespesa(id);

    const valorParcela = (Number(despesa.valor_total) / Number(despesa.numero_parcelas)).toFixed(2);
    
    // Tratar o campo primeiro_vencimento que pode vir como Date ou string
    let dataISO;
    if (despesa.primeiro_vencimento instanceof Date) {
      dataISO = despesa.primeiro_vencimento.toISOString().slice(0, 10);
    } else if (typeof despesa.primeiro_vencimento === 'string') {
      // Se já está no formato YYYY-MM-DD
      if (despesa.primeiro_vencimento.match(/^\d{4}-\d{2}-\d{2}/)) {
        dataISO = despesa.primeiro_vencimento.slice(0, 10);
      } else {
        dataISO = despesa.primeiro_vencimento;
      }
    } else {
      throw new Error('Formato de data inválido');
    }
    
    console.log('[DEBUG] Data ISO processada:', dataISO);
    
    const [pAno, pMes, pDia] = dataISO.split('-').map(Number);
    const diasPeriodo = Number(despesa.periodo) || 30;

    let dataVenc = new Date(Date.UTC(pAno, pMes - 1, pDia));
    for (let i = 0; i < despesa.numero_parcelas; i++) {
      const vencStr = dataVenc.toISOString().slice(0, 10);
      await parcelaModel.criar({ id_despesa_recorrente: id, numero_parcela: i + 1, data_vencimento: vencStr, valor: valorParcela });
      dataVenc.setUTCDate(dataVenc.getUTCDate() + diasPeriodo);
    }

    console.log('[DEBUG] Parcelas recriadas com sucesso');
    res.json({ ok: true });
  } catch (err) {
    console.error('[ERRO] Falha ao recriar parcelas:', err);
    next(err);
  }
};
