const userId = localStorage.getItem('userId');
const idAulaAtual = new URLSearchParams(window.location.search).get('idAula');

if (!userId || !idAulaAtual) {
  alert("Acesso inválido.");
  window.location.href = "login.html";
}

async function carregarOpcoes() {
  try {
    const todasAulas = await fetch('/api/aulas').then(r => r.json());
    const agendadas = await fetch(`/api/agendados/${userId}`).then(r => r.json());

    const aulasAgendadasIds = agendadas.map(a => a.id_aula);
    const aulaAtual = todasAulas.find(a => a.id_aula == idAulaAtual);

    if (!aulaAtual) {
      document.getElementById('infoAtual').innerHTML = '<p class="text-danger">Aula atual não encontrada.</p>';
      return;
    }

    const idTerapia = aulaAtual.id_terapia;

    document.getElementById('infoAtual').innerHTML = `
      <h5>Aula Atual:</h5>
      <p><strong>${aulaAtual.nome_terapia}</strong></p>
      <p><strong>Data:</strong> ${new Date(aulaAtual.data).toLocaleString()}</p>
      <p><strong>Clínica:</strong> ${aulaAtual.nome_clinica}</p>
    `;

    const alternativas = todasAulas.filter(a =>
      a.id_terapia == idTerapia &&
      a.id_aula != idAulaAtual &&
      !aulasAgendadasIds.includes(a.id_aula)
    );

    const container = document.getElementById('novasOpcoes');
    container.innerHTML = "";

    if (alternativas.length === 0) {
      container.innerHTML = `<p class="text-muted">Não existem outros horários disponíveis.</p>`;
      return;
    }

    alternativas.forEach(a => {
      const card = document.createElement('div');
      card.className = 'col-md-4 mb-4';
      card.innerHTML = `
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">${a.nome_terapia}</h5>
            <p class="card-text"><strong>Data:</strong> ${new Date(a.data).toLocaleString()}</p>
            <p class="card-text"><strong>Profissional:</strong> ${a.nome_profissional}</p>
            <p class="card-text"><strong>Espaço:</strong> ${a.nome_espaco}</p>
            <p class="card-text"><strong>Clínica:</strong> ${a.nome_clinica}</p>
            <button class="btn btn-primary w-100" onclick="trocarHorario(${a.id_aula})">Escolher este horário</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Erro ao carregar opções:", err);
    document.getElementById('infoAtual').innerHTML = '<p class="text-danger">Erro ao carregar dados.</p>';
  }
}

async function trocarHorario(idNovaAula) {
  if (!confirm("Tem certeza que deseja alterar para este novo horário?")) return;

  try {
    const resposta = await fetch('/api/alterar-horario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_utilizador: userId,
        id_aula_atual: idAulaAtual,
        id_aula_nova: idNovaAula
      })
    });

    const resultado = await resposta.json();
    const mensagem = document.getElementById('mensagem');

    if (resposta.ok) {
      mensagem.innerHTML = `<div class="alert alert-success">✅ Aula alterada com sucesso! Redirecionando...</div>`;
      setTimeout(() => window.location.href = 'agendados.html', 2500);
    } else {
      mensagem.innerHTML = `<div class="alert alert-danger">${resultado.error || 'Erro ao alterar aula.'}</div>`;
    }
  } catch (err) {
    console.error("Erro ao trocar aula:", err);
    document.getElementById('mensagem').innerHTML = `<div class="alert alert-danger">Erro ao comunicar com o servidor.</div>`;
  }
}

carregarOpcoes();
