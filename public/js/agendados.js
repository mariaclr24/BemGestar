
async function carregarAgendamentos() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    alert("Você precisa estar logado.");
    window.location.href = "login.html";
    return;
  }

  try {
    const resposta = await fetch(`/api/agendados/${userId}`);
    if (!resposta.ok) throw new Error("Erro ao buscar agendamentos");

    const aulas = await resposta.json();
    const container = document.getElementById('scheduledContainer');
    const noSchedules = document.getElementById('noSchedules');

    if (aulas.length === 0) {
      noSchedules.textContent = "Você ainda não tem aulas agendadas.";
      return;
    }

    noSchedules.textContent = "";
    container.innerHTML = "";

    aulas.forEach((aula) => {
      const dataObj = new Date(aula.data);
      const dataFormatada = dataObj.toLocaleDateString();
      const horaFormatada = dataObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const card = `
        <div class="col-md-4 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title">${aula.nome_terapia}</h5>
              <p class="card-text"><strong>Data:</strong> ${dataFormatada} às ${horaFormatada}</p>
              <p class="card-text"><strong>Terapeuta:</strong> ${aula.nome_profissional}</p>
              <p class="card-text"><strong>Sala:</strong> ${aula.nome_espaco}</p>
              <p class="card-text"><strong>Clínica:</strong> ${aula.nome_clinica}</p>
              <button class="btn btn-danger btn-sm me-2" onclick="cancelarAula(${aula.id_aula})">Desmarcar</button>
              <a href="alterar_aula.html?idAula=${aula.id_aula}" class="btn btn-primary btn-sm">Alterar Horário</a>
            </div>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', card);
    });
  } catch (error) {
    console.error("Erro ao carregar agendamentos:", error);
    document.getElementById('noSchedules').textContent = "Erro ao carregar seus agendamentos.";
  }
}

async function cancelarAula(idAula) {
  const userId = localStorage.getItem('userId');
  if (!confirm("Tem certeza que deseja cancelar esta aula?")) return;

  try {
    const resposta = await fetch(`/api/cancelarAgendamento`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_utilizador: userId, id_aula: idAula })
    });

    const data = await resposta.json();
    if (!resposta.ok) throw new Error(data.error || "Erro ao cancelar agendamento");

    alert("Aula cancelada com sucesso.");
    carregarAgendamentos();
  } catch (error) {
    console.error("Erro ao cancelar aula:", error);
    alert("Erro ao cancelar aula.");
  }
}

document.addEventListener("DOMContentLoaded", carregarAgendamentos);
