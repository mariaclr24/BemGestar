document.addEventListener('DOMContentLoaded', carregarAulasProfissional);

async function carregarAulasProfissional() {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  if (!token || !userId) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch('/api/aulas-profissional', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erro ao buscar aulas: ${errorText}`);
    }

    const aulas = await res.json();
    const container = document.getElementById("listaAulas");
    container.innerHTML = "";

    if (aulas.length === 0) {
      container.innerHTML = "<p class='text-muted'>Nenhuma aula encontrada.</p>";
      return;
    }

    const futurasSection = document.createElement("section");
    futurasSection.innerHTML = "<h4 class='mt-4 mb-3'>Aulas Futuras</h4><div class='row' id='futurasAulas'></div>";
    const realizadasSection = document.createElement("section");
    realizadasSection.innerHTML = "<h4 class='mt-4 mb-3'>Aulas Realizadas</h4><div class='row' id='aulasRealizadas'></div>";

    const futurasDiv = futurasSection.querySelector('#futurasAulas');
    const realizadasDiv = realizadasSection.querySelector('#aulasRealizadas');

    aulas.forEach(aula => {
      const data = new Date(aula.data);
      const agora = new Date();
      const futura = data > agora;
      const dataFormatada = data.toLocaleDateString('pt-PT');
      const horaFormatada = data.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

      const template = document.getElementById('templateAula').content.cloneNode(true);
      const card = template.querySelector('.card');
      template.querySelector('.card-title').textContent = aula.nome_terapia;
      template.querySelector('.card-text').innerHTML = `
        <strong>Data:</strong> ${dataFormatada} ${horaFormatada}<br>
        <strong>Sala:</strong> ${aula.nome_espaco}<br>
        <strong>Clínica:</strong> ${aula.nome_clinica}<br>
        <strong>Vagas preenchidas:</strong> ${aula.vagas_ocupadas}/${aula.limite_participantes}
      `;

      const btnVerAlunos = template.querySelector('.verAlunosBtn');
      const btnAdicionarAluno = template.querySelector('.adicionarAlunoBtn');

      if (futura) {
        btnVerAlunos.classList.add('d-none');

        const btnVerAgendados = document.createElement("button");
        btnVerAgendados.className = "btn btn-outline-secondary btn-sm";
        btnVerAgendados.id = `btn-agendados-${aula.id_aula}`;
        btnVerAgendados.textContent = "Ver Agendados";
        btnVerAgendados.onclick = () => toggleAgendados(aula.id_aula, card.querySelector('.card-body'));
        card.querySelector('.card-body').appendChild(btnVerAgendados);

        const diffHoras = (data - agora) / 36e5;
        if (aula.vagas_ocupadas >= aula.limite_participantes && diffHoras >= 24) {
          btnAdicionarAluno.classList.remove('d-none');
          btnAdicionarAluno.onclick = () => window.location.href = `adicionar_participante.html?id_aula=${aula.id_aula}`;
        }
        
        futurasDiv.appendChild(template);
      } else {
        btnAdicionarAluno.classList.add('d-none');
        btnVerAlunos.classList.remove('d-none');
        btnVerAlunos.onclick = () => window.location.href = `avaliar_presencas.html?id_aula=${aula.id_aula}`;
        realizadasDiv.appendChild(template);
      }
    });

    container.appendChild(futurasSection);
    container.appendChild(realizadasSection);

  } catch (err) {
    console.error("Erro ao buscar aulas do profissional:", err);
    document.getElementById("mensagemErro").textContent = "Erro ao carregar aulas.";
  }
}

async function toggleAgendados(id_aula, cardElement) {
  const existing = document.getElementById(`agendados-${id_aula}`);
  const botao = document.getElementById(`btn-agendados-${id_aula}`);

  if (existing) {
    existing.remove();
    botao.textContent = "Ver Agendados";
    botao.classList.remove('btn-danger');
    botao.classList.add('btn-outline-secondary');
    return;
  }

  try {
    const res = await fetch(`/api/agendados-aulas/${id_aula}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    console.log('[DEBUG] ID AULA:', id_aula);
    const utentes = await res.json();
    console.log('[DEBUG] Resultados agendados:', utentes);

    const div = document.createElement('div');
    div.id = `agendados-${id_aula}`;
    div.className = 'mt-3';

    if (utentes.length === 0) {
      div.innerHTML = `<div class="alert alert-warning">Nenhum utente agendado.</div>`;
    } else {
      div.innerHTML = `
        <div class="card bg-light p-3">
          <h6>Utentes Agendados</h6>
          <table class="table table-sm">
            <thead><tr><th>Nome</th><th>Email</th><th>Telefone</th></tr></thead>
            <tbody>
              ${utentes.map(u => `
                <tr>
                  <td>${u.nome}</td>
                  <td>${u.email}</td>
                  <td>${u.contacto}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    }

    cardElement.appendChild(div);
    botao.textContent = "Fechar Agendados";
    botao.classList.remove('btn-outline-secondary');
    botao.classList.add('btn-danger');
  } catch (err) {
    alert("Erro ao carregar utentes.");
    console.error(err);
  }
}
