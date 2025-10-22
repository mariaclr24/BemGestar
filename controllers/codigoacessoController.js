const codigoAcessoModel = require('../models/codigoacessoModel');
const { enviarEmail } = require('../config/email');

exports.criarCodigoAcesso = async (req, res) => {
  try {
    const id_profissional = req.user.id_utilizador;

    const {
      nome,
      email,
      nif,
      data_nascimento,
      estado,
      semanas_gestacao,
      terapiasPermitidas,
      terapiasNaoRecomendadas,
      terapiasProibidas
    } = req.body;

    const codigoGerado = await codigoAcessoModel.criarCodigoAcesso({
      id_profissional,
      nome,
      email,
      nif,
      data_nascimento,
      estado,
      semanas_gestacao,
      terapias_recomendadas: terapiasPermitidas,
      terapias_nao_recomendadas: terapiasNaoRecomendadas,
      terapias_proibidas: terapiasProibidas
    });

    // ✉️ Enviar email com o código
    await enviarEmail(
      email,
      'Código de Acesso - BemGestar',
      `Olá ${nome},

Foi gerado um código de acesso à plataforma BemGestar.

Código: ${codigoGerado.codigo}

Este código tem validade de 30 dias. Use-o ao registar-se na plataforma.

Cumprimentos,
Equipa BemGestar`
    );

    res.status(201).json({
      message: 'Código criado com sucesso!',
      codigo: codigoGerado.codigo
    });

  } catch (err) {
    console.error('Erro ao criar código de acesso:', err);
    res.status(500).json({ error: 'Erro ao criar código de acesso' });
  }
};
