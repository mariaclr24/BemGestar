
async function carregarAulasRealizadas() {
  const userId = localStorage.getItem('userId');
  try {
    const resposta = await fetch(`/api/aulas-realizadas/${userId}`);
    if (!resposta.ok) throw new Error("Erro ao buscar aulas realizadas");

    const aulas = await resposta.json();
    const container = document.getElementById('realizadasContainer');
    const nenhumaMsg = document.getElementById('nenhumaMsg');

    if (aulas.length === 0) {
      nenhumaMsg.textContent = 'Você ainda não participou de nenhuma aula.';
      return;
    }

    aulas.forEach((aula) => {
      const data = new Date(aula.data);
      const dataFormatada = data.toLocaleDateString();
      const horaFormatada = data.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const card = `
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">${aula.nome_terapia}</h5>
              <p class="card-text">
                <strong>Data:</strong> ${dataFormatada} às ${horaFormatada}<br>
                <strong>Presença:</strong> ${aula.presente ? 'Sim' : 'Não'}<br>
                <strong>Terapeuta:</strong> ${aula.nome_profissional}<br>
                <strong>Sala:</strong> ${aula.nome_espaco}<br>
                <strong>Clínica:</strong> ${aula.nome_clinica}
              </p>
              ${aula.presente ? `
                <div class="d-flex justify-content-between">
                  <a href="questionario.html?id_aula=${aula.id_aula}" class="btn btn-outline-primary btn-sm">Responder Questionário</a>
                  <a href="detalhes_aula.html?id_aula=${aula.id_aula}" class="btn btn-outline-secondary btn-sm">Ver Detalhes</a>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', card);
    });

  } catch (err) {
    console.error("Erro ao carregar aulas realizadas:", err);
    document.getElementById('nenhumaMsg').textContent = 'Erro ao carregar informações.';
  }
}

document.addEventListener('DOMContentLoaded', carregarAulasRealizadas);
