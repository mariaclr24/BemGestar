const pool = require('../config/db');

exports.createProfissional = async (dados) => {
  const {
    nome,
    email,
    senhaHash,
    especialidade,
    hora_almoco_inicio,
    hora_almoco_fim,
    id_clinica
  } = dados;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar se o e-mail já existe
    const emailExiste = await client.query('SELECT 1 FROM utilizador WHERE email = $1', [email]);
    if (emailExiste.rowCount > 0) {
      throw new Error('O email já está registado. Por favor, utilize outro.');
    }

    // Verificar se a clínica existe e obter o horário
    const clinicaRes = await client.query(
      'SELECT hora_abertura, hora_fecho FROM clinica WHERE id_clinica = $1',
      [id_clinica]
    );
    if (clinicaRes.rowCount === 0) {
      throw new Error('Clínica não encontrada.');
    }

    const { hora_abertura, hora_fecho } = clinicaRes.rows[0];

    // Validação de horário de almoço
    if (hora_almoco_inicio && hora_almoco_fim) {
      if (hora_almoco_inicio >= hora_almoco_fim) {
        throw new Error('A hora de início do almoço deve ser anterior à hora de fim.');
      }

      if (hora_almoco_inicio < hora_abertura || hora_almoco_fim > hora_fecho) {
        throw new Error('As horas de almoço devem estar dentro do horário de funcionamento da clínica.');
      }
    }

    // Inserir utilizador
    const result = await client.query(
      `INSERT INTO utilizador (nome, email, senha, tipo_utilizador, ativo)
       VALUES ($1, $2, $3, 'profissional', true)
       RETURNING id_utilizador`,
      [nome, email, senhaHash]
    );

    const id_utilizador = result.rows[0].id_utilizador;

    // Inserir profissional
    await client.query(
      `INSERT INTO ProfissionalSaude (
        id_utilizador,
        especialidade,
        hora_almoco_inicio,
        hora_almoco_fim,
        id_clinica
      ) VALUES ($1, $2, $3, $4, $5)`,
      [id_utilizador, especialidade, hora_almoco_inicio, hora_almoco_fim, id_clinica]
    );

    await client.query('COMMIT');
    return id_utilizador;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

exports.getAllProfissionais = async () => {
  const query = `
      SELECT 
    u.id_utilizador, 
    u.nome, 
    u.email, 
    ps.especialidade,
    c.nome AS nome_clinica
  FROM utilizador u
  JOIN profissionalsaude ps ON u.id_utilizador = ps.id_utilizador
  JOIN clinica c ON ps.id_clinica = c.id_clinica
  ORDER BY u.nome;
  `;
  const { rows } = await pool.query(query);
  return rows;
};
