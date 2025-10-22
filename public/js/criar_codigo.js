document.addEventListener('DOMContentLoaded', async () => {
  const estadoSelect = document.getElementById('estado');
  const semanasContainer = document.getElementById('semanasContainer');

  // Mostrar ou ocultar o campo semanas conforme o estado (Pós-parto não tem semanas)
  estadoSelect.addEventListener('change', () => {
    if (estadoSelect.value === 'Pós-parto') {
      semanasContainer.style.display = 'none';
      document.getElementById('semanas').value = '';
    } else {
      semanasContainer.style.display = 'block';
    }
  });

  // Função para criar checkbox
  function criarCheckbox(id, nome, grupo) {
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" value="${id}"> ${nome}`;
    grupo.appendChild(label);
  }

  // Popular listas de checkboxes para terapias
  try {
    const resp = await fetch('/api/terapias');
    if (!resp.ok) throw new Error('Erro ao buscar terapias');
    const terapias = await resp.json();

    const permitidasDiv = document.getElementById('terapiasPermitidas');
    const naoRecomendadasDiv = document.getElementById('terapiasNaoRecomendadas');
    const proibidasDiv = document.getElementById('terapiasProibidas');

    terapias.forEach(terapia => {
      criarCheckbox(terapia.id_terapia, terapia.nome, permitidasDiv);
      criarCheckbox(terapia.id_terapia, terapia.nome, naoRecomendadasDiv);
      criarCheckbox(terapia.id_terapia, terapia.nome, proibidasDiv);
    });
  } catch (error) {
    alert('Erro ao carregar terapias: ' + error.message);
  }
});

document.getElementById('formCodigo').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Validação da idade mínima (18 anos)
  const dataNascimentoStr = document.getElementById('data_nascimento').value;
  if (!dataNascimentoStr) {
    alert('Por favor, preencha a data de nascimento.');
    return;
  }
  const hoje = new Date();
  const dataNascimento = new Date(dataNascimentoStr);
  let idade = hoje.getFullYear() - dataNascimento.getFullYear();
  const mes = hoje.getMonth() - dataNascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < dataNascimento.getDate())) {
    idade--;
  }
  if (idade < 18) {
    alert('O utente deve ter pelo menos 18 anos.');
    return;
  }

  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const nif = document.getElementById('nif').value.trim();
  const estado = document.getElementById('estado').value;
  const semanasValue = document.getElementById('semanas').value;
  const semanas = (estado === 'Pós-parto' || semanasValue === '') ? null : parseInt(semanasValue);

  // Função para extrair valores selecionados de múltiplos checkboxes
  function getCheckedValues(containerId) {
    const container = document.getElementById(containerId);
    return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
  }

  const terapiasPermitidas = getCheckedValues('terapiasPermitidas');
  const terapiasNaoRecomendadas = getCheckedValues('terapiasNaoRecomendadas');
  const terapiasProibidas = getCheckedValues('terapiasProibidas');

  const dados = {
    nome,
    email,
    nif,
    data_nascimento: dataNascimentoStr,
    estado,
    semanas_gestacao: semanas,
    terapiasPermitidas,
    terapiasNaoRecomendadas,
    terapiasProibidas
  };

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Não autenticado. Faça login novamente.');
      return;
    }

    const resp = await fetch('/api/codigoacesso', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dados)
    });

    const result = await resp.json();
    const mensagem = document.getElementById('mensagem');

    if (resp.ok) {
      mensagem.innerHTML = `<div class="alert alert-success">Código criado com sucesso! Código: <strong>${result.codigo}</strong></div>`;
      document.getElementById('formCodigo').reset();
      semanasContainer.style.display = 'block';
    } else {
      mensagem.innerHTML = `<div class="alert alert-danger">Erro ao criar código: ${result.error}</div>`;
    }
  } catch (err) {
    alert('Erro ao comunicar com o servidor.');
    console.error(err);
  }
});
